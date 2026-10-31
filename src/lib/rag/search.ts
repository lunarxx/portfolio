// hybrid search, end to end: both legs (words, meaning) inside the caller's walls, fused by weighted reciprocal rank,
// nudged by recency and by subjects the question names, reranked, then grown back into readable passages (a hit and
// its neighbours, adjacent hits merged) and packed to a token budget. every candidate's every score lands in the trace
import type { Chunk, Embedder, Filter, Hit, Reranker, Store, Trace } from './types.ts'
import { terms, tokens } from './text.ts'

export interface SearchOptions {
  filter?: Filter
  /** passages wanted at most (the budget usually decides first) */
  limit?: number
  /** candidates per leg: max(4 × limit, 60) by default (mem0) */
  pool?: number
  /** keyword vs meaning weight in the fusion; corpus-dependent, tuned on evals (RAGFlow 0.7/0.3, R2R 1/5) */
  weights?: { keyword: number; vector: number }
  /** reciprocal rank constant (60 in the RRF paper, 50 Supabase/R2R, 1 Graphiti) */
  k?: number
  /** recency: score × 1 / (1 + decay × age in years), per chunk kind (Onyx 0.5) */
  decay?: Record<string, number>
  /** how many fused candidates the reranker reads */
  rerankTop?: number
  /** neighbours pulled in each side of a hit (0: just the hit) */
  expand?: number
  /** token budget for the packed passages */
  budget?: number
  /** a separate query for the keyword leg (a rewrite), else the question */
  keywordQuery?: string
  embedTimeoutMs?: number
}

export interface Passage { n: number; text: string; context: string; source: string; docId: string; ids: string[]; score: number; at: string | null; kind: string; subject?: string | null }

export interface SearchResult { passages: Passage[]; hits: Hit[]; degraded: string[]; trace: Trace }

const timeout = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error(`timed out after ${ms} ms`)), ms))])

export async function search(ctx: { store: Store; embedder?: Embedder; reranker?: Reranker }, query: string, o: SearchOptions = {}): Promise<SearchResult> {
  const t0 = performance.now(), ms: Record<string, number> = {}, degraded: string[] = []
  const lap = (k: string, from: number) => { ms[k] = Math.round(performance.now() - from) }
  const limit = o.limit ?? 12, pool = o.pool ?? Math.max(4 * limit, 60), K = o.k ?? 60
  const w = o.weights ?? { keyword: 1, vector: 1 }, f = o.filter ?? {}

  // both legs at once; if the embedder fails (down, out of quota, slow), words alone carry the search
  let t = performance.now()
  const vecP = ctx.embedder
    ? timeout(ctx.embedder.embed([query], 'query'), o.embedTimeoutMs ?? 3000).then((v) => ctx.store.vector(v[0], pool, f)).catch((e) => { degraded.push(`vector: ${String(e.message || e).slice(0, 120)}`); return [] })
    : Promise.resolve([])
  const [kw, vec] = await Promise.all([ctx.store.keyword(o.keywordQuery || query, pool, f), vecP])
  lap('retrieve', t)

  // weighted reciprocal rank fusion; missing from a list = ranked just past its end (R2R), not zero
  const by = new Map<string, Hit>()
  kw.forEach((r, i) => by.set(r.chunk.id, { chunk: r.chunk, score: 0, scores: { keyword: r.score }, ranks: { keyword: i + 1 } }))
  vec.forEach((r, i) => {
    const h = by.get(r.chunk.id) || { chunk: r.chunk, score: 0, scores: {}, ranks: {} }
    h.scores.vector = r.score; h.ranks.vector = i + 1; by.set(r.chunk.id, h)
  })
  const legs = (kw.length ? w.keyword : 0) + (vec.length ? w.vector : 0) || 1
  const qTerms = new Set(terms(query)), now = Date.now()
  for (const h of by.values()) {
    const rk = h.ranks.keyword ?? pool + 1, rv = h.ranks.vector ?? pool + 1
    let s = ((kw.length ? w.keyword / (K + rk) : 0) + (vec.length ? w.vector / (K + rv) : 0)) / legs
    h.scores.fused = s
    const d = o.decay?.[h.chunk.kind] ?? o.decay?.['*']
    if (d && h.chunk.at) { const years = Math.max(0, (now - Date.parse(h.chunk.at)) / 3.156e10); h.scores.recency = 1 / (1 + d * years); s *= h.scores.recency }
    // the question names this fact's subject: a nudge (mem0's entity boost, 0.5)
    if (h.chunk.subject && terms(h.chunk.subject).some((x) => qTerms.has(x))) s *= 1.5
    h.score = s
  }
  let hits = [...by.values()].sort((a, b) => b.score - a.score)

  // rerank: the cross-encoder reads question and passage together; its score orders the list (and later decides abstain)
  if (ctx.reranker && hits.length) {
    t = performance.now()
    const top = hits.slice(0, o.rerankTop ?? 30)
    try {
      const sc = await ctx.reranker.score(query, top.map((h) => (h.chunk.context ? `${h.chunk.context}\n${h.chunk.text}` : h.chunk.text)))
      top.forEach((h, i) => { h.scores.rerank = sc[i]; h.score = sc[i] })
      hits = [...top.sort((a, b) => b.score - a.score), ...hits.slice(top.length).map((h) => ({ ...h, score: -1 }))]
    } catch (e: any) { degraded.push(`rerank: ${String(e.message || e).slice(0, 120)}`) }
    lap('rerank', t)
  }
  hits.forEach((h) => { h.scores.final = h.score })

  // grow hits into passages: neighbours each side, hits touching in one document merged; a chunk is used once
  t = performance.now()
  const used = new Set<string>(), passages: Passage[] = []
  let spent = 0
  for (const h of hits) {
    if (passages.length >= limit || used.has(h.chunk.id)) continue
    let group: Chunk[] = [h.chunk]
    if (o.expand) group = (await ctx.store.around(h.chunk.docId, h.chunk.pos, o.expand)).filter((c) => c.id === h.chunk.id || (!used.has(c.id) && c.scope === h.chunk.scope))
    // a later hit already inside this passage doesn't get its own
    const text = group.map((c) => c.text).join('\n'), cost = tokens(text) + tokens(h.chunk.context)
    if (spent + cost > (o.budget ?? 3000) && passages.length) continue
    // near-duplicates (same words, another source) add nothing
    const tw = new Set(terms(text))
    if (passages.some((p) => { const pw = new Set(terms(p.text)); let n = 0; for (const x of tw) if (pw.has(x)) n++; return n / Math.max(1, Math.min(tw.size, pw.size)) > .9 })) continue
    group.forEach((c) => used.add(c.id)); spent += cost
    passages.push({ n: passages.length + 1, text, context: h.chunk.context, source: h.chunk.source, docId: h.chunk.docId, ids: group.map((c) => c.id), score: h.score, at: h.chunk.at, kind: h.chunk.kind, subject: h.chunk.subject })
  }
  lap('pack', t); lap('total', t0)

  const trace: Trace = {
    id: Math.random().toString(36).slice(2), at: new Date().toISOString(), op: 'search', query, rewrites: o.keywordQuery ? [o.keywordQuery] : undefined,
    scope: f.scopes, candidates: hits.slice(0, 50).map((h) => ({ id: h.chunk.id, source: h.chunk.source, scores: h.scores, ranks: h.ranks })),
    kept: passages.flatMap((p) => p.ids), ms, error: degraded.length ? degraded.join('; ') : undefined,
  }
  return { passages, hits, degraded, trace }
}
