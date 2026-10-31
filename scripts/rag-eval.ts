// how well the interview finds the right notes: the golden set (src/meet/knowledge/golden.jsonl) against the old
// word-overlap lookup (v1), words only (BM25), meaning only, and both (hybrid, what /api/ask runs). `--answers` also
// checks the answers themselves (must-have words, abstaining when it should), which costs model calls
import { readFileSync } from 'fs'
import { MemoryStore, embedders, search, evals, createRag, llms, type Embedder } from '../src/lib/rag/index.ts'
import { knowledge, INDEX, WEIGHTS } from '../src/meet/knowledge/load.ts'

const cases: evals.Case[] = readFileSync('src/meet/knowledge/golden.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
const saved = JSON.parse(readFileSync(INDEX, 'utf8')), store = MemoryStore.fromJSON(saved)
const { hash } = knowledge()
if (saved.meta.about !== hash) console.warn('index is stale: run npm run rag:index first')

// the question's vector once per run, shared by every setup that needs it (the free tier counts each call)
const base = embedders.gemini1({ key: process.env.GEMINI_API_KEY!, dims: 768 }), cache = new Map<string, number[]>()
const embedder: Embedder = { ...base, async embed(t, as) { const k = t.join('\u0000'); if (!cache.has(k)) cache.set(k, (await base.embed(t, as))[0]); return [cache.get(k)!] } }
// warm, so latency below is search, not the network. out of embedding quota (the free tier's 1,000 a day): the
// meaning-based runs are skipped, the rest still measured
let vectors = true
try { for (const c of cases) await embedder.embed([c.q], 'query') } catch (e: any) { vectors = false; console.warn(`embeddings unavailable (${String(e.message || e).slice(0, 60)}): meaning-based runs skipped`) }

// v1: the old route's lookup (word overlap, a section word counting double), for the before and after
const STOP = new Set('the and you your are was for with that this what how who does did his him have has from about into they them their there just can not but our its also any'.split(' '))
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)))
const all = [...store.chunks.values()]
const v1 = async (q: string) => {
  const t = performance.now(), qw = words(q)
  const scored = all.map((c) => { const sec = c.context.toLowerCase(), cw = words(sec + ' ' + c.text); return { c, s: [...qw].reduce((n, w) => n + (cw.has(w) ? (sec.includes(w) ? 2 : 1) : 0), 0) } })
  return { texts: scored.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 10).map((x) => x.c.text), ms: Math.round(performance.now() - t) }
}
const run = (o: { embedder?: Embedder; weights?: { keyword: number; vector: number } }) => async (q: string) => {
  const r = await search({ store, embedder: o.embedder }, q, { limit: 10, budget: 5000, weights: o.weights })
  return { texts: r.passages.map((p) => p.text), ms: r.trace.ms.total }
}
const reports = [
  await evals.evaluate('v1 word overlap', cases, v1),
  await evals.evaluate('words (bm25)', cases, run({})),
  ...(vectors ? [
    await evals.evaluate('meaning (vector)', cases, run({ embedder, weights: { keyword: 0, vector: 1 } })),
    await evals.evaluate('live (/api/ask)', cases, run({ embedder, weights: WEIGHTS })),
    await evals.evaluate('hybrid 1:1', cases, run({ embedder })),
    await evals.evaluate('hybrid 2:1 words', cases, run({ embedder, weights: { keyword: 2, vector: 1 } })),
  ] : []),
]
console.log(`${cases.filter((c) => c.expect).length} questions, ${store.chunks.size} notes\n`)
console.log(evals.table(reports))
const hybrid = reports.find((r) => r.name === 'live (/api/ask)') || reports[1]   // what the route runs (words only when embeddings are out)
if (hybrid.misses.length) console.log(`\nlive misses:\n${hybrid.misses.map((m) => `  ${m.q}\n    got: ${m.got.join(' | ')}`).join('\n')}`)

if (process.argv.includes('--answers')) {
  const llm = llms.chain(llms.groq([process.env.GROQ_API_KEY!, process.env.GROQ_API_KEY_FALLBACK!]), llms.google(process.env.GEMINI_API_KEY!, [{ id: 'gemini-3.5-flash-lite' }]))
  const rag = createRag({ store, embedder, llm })
  // --live: ask the running site (localhost:3311), so the interview rules and the guard are what's measured
  const live = process.argv.includes('--live')
  await evals.evaluateAnswers(hybrid, cases, async (q) => {
    if (live) { const d = await (await fetch('http://localhost:3311/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q }) })).json(); return { text: d.say || '', abstained: d.covered === false } }
    const a = await rag.answer(q, { limit: 14, budget: 1600, weights: WEIGHTS, instructions: 'You are Ashwini, answering a visitor in first person, 1 to 3 short sentences.' })
    return { text: a.text, abstained: a.abstained }
  })
  const a = hybrid.answers!
  console.log(`\nanswers: ${a.n} checked, must-have ${a.mustRate}, must-not ${a.mustNotRate}, abstain accuracy ${a.abstainAcc}`)
  for (const f of a.fails) console.log(`  ✗ ${f.q} (${f.why})\n    said: ${f.said}`)
}
const prev = evals.save('evals-runs', reports)
const drops = prev ? evals.gate(hybrid, prev.find((r) => r.name === hybrid.name)) : []
if (drops.length) { console.log(`\nGATE FAILED: ${drops.join('; ')}`); process.exitCode = 1 }
