// answers that stay inside what was found. the question is rewritten against the conversation (a standalone one for
// meaning, a keyword one for words: Onyx), the passages go to the model numbered, it answers in JSON citing [n] and says
// whether they covered it. citations are checked, a low reranker score or an uncovered question abstains, and once the
// model may ask for one more search (letting it search again matters: docs/research.md)
import type { ChatMessage, LLM, Trace } from './types.ts'
import { search, type SearchOptions, type SearchResult, type Passage } from './search.ts'

export interface Turn { who: 'user' | 'assistant'; text: string; at?: string }

export interface Rewrite { semantic: string; keyword: string; from?: string; to?: string }

/** the question made to stand alone (pronouns resolved from history), a keyword form, and a time window if it names one */
export async function rewrite(llm: LLM, q: string, history: Turn[], now = new Date()): Promise<Rewrite> {
  if (!history.length) return { semantic: q, keyword: q }
  try {
    const r = await llm.json<Partial<Rewrite>>([
      { role: 'system', content: `You turn the latest message of a conversation into search queries. Today is ${now.toISOString().slice(0, 10)}.
Return JSON: {"semantic": a standalone question with every pronoun and reference resolved from the conversation, "keyword": the 3 to 8 most distinctive search words, "from": ISO date or null, "to": ISO date or null (only if the message names a time, like "last week")}` },
      { role: 'user', content: `Conversation:\n${history.slice(-6).map((t) => `${t.who}: ${t.text.slice(0, 300)}`).join('\n')}\n\nLatest message: ${q}` },
    ], { maxTokens: 200, temperature: 0 })
    return { semantic: r.semantic || q, keyword: r.keyword || q, from: r.from || undefined, to: r.to || undefined }
  } catch { return { semantic: q, keyword: q } }
}

export interface AnswerOptions extends SearchOptions {
  history?: Turn[]
  /** who's answering and how (persona, voice, rules); the grounding rules are added after it */
  instructions?: string
  /** extra JSON fields the model fills, described for it: { action: 'one of ..., or null' } */
  fields?: Record<string, string>
  /** 'llm' rewrites with the model; 'append' just adds the last question when this one is short (free, no call); false: as asked */
  rewrite?: 'llm' | 'append' | false
  /** abstain when the best reranker score is under this (calibrated per reranker on the eval set) */
  abstainBelow?: number
  /** searches allowed in all (2: the model may ask for one more) */
  hops?: number
  /** small talk etc. may be answered without passages */
  allowUngrounded?: boolean
  maxTokens?: number
  temperature?: number
}

export interface Answer { text: string; cites: Passage[]; covered: boolean; abstained: boolean; extra: Record<string, unknown>; passages: Passage[]; trace: Trace }

const GROUND = `Answer only from the numbered notes. Cite the notes you used by number in "cites". Never add facts, numbers, names, dates or outcomes that aren't in them. If the notes don't cover the question, set "covered" to false and say so plainly instead of guessing.`

export async function answer(ctx: { store: any; embedder?: any; reranker?: any; llm: LLM }, q: string, o: AnswerOptions = {}): Promise<Answer> {
  const t0 = performance.now(), history = o.history || []
  // 1. what to search for
  let rw: Rewrite = { semantic: q, keyword: q }
  if (o.rewrite === 'llm') rw = await rewrite(ctx.llm, q, history)
  else if (o.rewrite === 'append' && history.length && (q.split(/\s+/).length < 6 || /\b(it|that|this|those|they|them|he|she|there|more)\b/i.test(q))) {
    const last = [...history].reverse().find((t) => t.who === 'user'); if (last) rw = { semantic: `${last.text} ${q}`, keyword: `${last.text} ${q}` }
  }
  const filter = { ...o.filter, ...(rw.from || rw.to ? { at: { from: rw.from, to: rw.to } } : {}) }
  let found: SearchResult = await search(ctx, rw.semantic, { ...o, filter, keywordQuery: rw.keyword })
  let passages = found.passages
  const ms: Record<string, number> = { search: found.trace.ms.total }

  // 2. the model, with the notes numbered
  const fields = Object.entries(o.fields || {}).map(([k, v]) => `"${k}": ${v}`).join(', ')
  const ask = async (ps: Passage[], canSearch: boolean) => {
    const notes = ps.map((p) => `[${p.n}] ${p.context ? `(${p.context}) ` : ''}${p.text}`).join('\n') || '(no notes found)'
    const messages: ChatMessage[] = [
      { role: 'system', content: `${o.instructions || 'You answer questions.'}\n\n${GROUND}${o.allowUngrounded ? ' Small talk and greetings can be answered naturally without notes (covered: true, no cites).' : ''}
Reply as JSON: {"answer": "...", "cites": [numbers], "covered": true|false${canSearch ? ', "search": null or a different search query if the notes miss something you need' : ''}${fields ? ', ' + fields : ''}}\n\nNotes:\n${notes}` },
      ...(history.length ? [{ role: 'user' as const, content: `Conversation so far:\n${history.slice(-6).map((t) => `${t.who === 'user' ? 'Them' : 'You'}: ${t.text.slice(0, 300)}`).join('\n')}` }] : []),
      { role: 'user', content: q },
    ]
    return ctx.llm.json<Record<string, any>>(messages, { maxTokens: o.maxTokens ?? 500, temperature: o.temperature ?? .4 })
  }
  let t = performance.now()
  let out = await ask(passages, (o.hops ?? 1) > 1)
  // 3. one more search if it asked for one and the first came up short
  if ((o.hops ?? 1) > 1 && typeof out.search === 'string' && out.search.trim() && out.covered === false) {
    const more = await search(ctx, out.search, { ...o, filter })
    const seen = new Set(passages.flatMap((p) => p.ids))
    passages = [...passages, ...more.passages.filter((p) => !p.ids.some((id) => seen.has(id)))].map((p, i) => ({ ...p, n: i + 1 }))
    found = { ...found, trace: { ...found.trace, rewrites: [...(found.trace.rewrites || []), out.search] } }
    out = await ask(passages, false)
  }
  ms.answer = Math.round(performance.now() - t)

  // 4. check it: citations must exist; abstain when uncovered or the reranker found nothing good
  const cites = [...new Set((Array.isArray(out.cites) ? out.cites : []).map(Number))].map((n) => passages.find((p) => p.n === n)).filter(Boolean) as Passage[]
  const best = found.hits[0]?.scores.rerank
  const weak = o.abstainBelow !== undefined && best !== undefined && best < o.abstainBelow
  const covered = out.covered !== false && !weak
  const extra: Record<string, unknown> = {}
  for (const k of Object.keys(o.fields || {})) extra[k] = out[k]
  ms.total = Math.round(performance.now() - t0)
  const text = String(out.answer || '')
  return {
    text, cites, covered, abstained: !covered, extra, passages,
    trace: { ...found.trace, op: 'answer', rewrites: [rw.semantic, rw.keyword].filter((x) => x !== q), answer: text, citations: cites.flatMap((p) => p.ids), abstained: !covered, ms },
  }
}
