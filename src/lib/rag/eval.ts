// measuring retrieval (and optionally answers) against a golden set, so a change is kept only when the numbers say so.
// a case: a question, the text the right notes contain (any one matching counts as relevant), and for answers the words
// it must contain or that it should abstain. runs are saved and compared with the last one
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Case { q: string; expect?: string[]; must?: string[]; mustNot?: string[]; abstain?: boolean; tag?: string }
export interface Retrieved { texts: string[]; ms: number }
export interface Report {
  name: string; n: number; hit1: number; hit3: number; hit5: number; hit10: number; mrr: number; ndcg10: number
  p50: number; p95: number; misses: { q: string; got: string[] }[]
  answers?: { n: number; mustRate: number; mustNotRate: number; abstainAcc: number; fails: { q: string; said: string; why: string }[] }
}

const has = (t: string, e: string) => t.toLowerCase().includes(e.toLowerCase())
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))] || 0 }
const r3 = (x: number) => Math.round(x * 1000) / 1000

export async function evaluate(name: string, cases: Case[], retrieve: (q: string) => Promise<Retrieved>): Promise<Report> {
  const scored = cases.filter((c) => c.expect?.length)
  let h1 = 0, h3 = 0, h5 = 0, h10 = 0, rr = 0, nd = 0
  const lat: number[] = [], misses: Report['misses'] = []
  for (const c of scored) {
    const r = await retrieve(c.q); lat.push(r.ms)
    const rel = r.texts.map((t) => c.expect!.some((e) => has(t, e)))
    const first = rel.indexOf(true) + 1
    if (first === 1) h1++; if (first && first <= 3) h3++; if (first && first <= 5) h5++; if (first && first <= 10) h10++
    if (first) rr += 1 / first; else misses.push({ q: c.q, got: r.texts.slice(0, 3).map((t) => t.slice(0, 90)) })
    // nDCG@10, binary relevance; ideal: as many relevant notes as expected strings, at the top
    const dcg = rel.slice(0, 10).reduce((s, x, i) => s + (x ? 1 / Math.log2(i + 2) : 0), 0)
    const ideal = Array.from({ length: Math.min(10, c.expect!.length) }, (_, i) => 1 / Math.log2(i + 2)).reduce((a, b) => a + b, 0)
    nd += Math.min(1, dcg / ideal)
  }
  const n = scored.length || 1
  return { name, n: scored.length, hit1: r3(h1 / n), hit3: r3(h3 / n), hit5: r3(h5 / n), hit10: r3(h10 / n), mrr: r3(rr / n), ndcg10: r3(nd / n), p50: pct(lat, .5), p95: pct(lat, .95), misses }
}

/** answers: must-have words present, and abstaining exactly when it should */
export async function evaluateAnswers(report: Report, cases: Case[], answer: (q: string) => Promise<{ text: string; abstained: boolean }>) {
  const cs = cases.filter((c) => c.must?.length || c.mustNot?.length || c.abstain !== undefined)
  let must = 0, mustN = 0, not = 0, notN = 0, abst = 0, abstN = 0
  const fails: { q: string; said: string; why: string }[] = []
  for (const c of cs) {
    const a = await answer(c.q)
    if (c.must?.length) { mustN++; const ok = c.must.every((m) => has(a.text, m)); if (ok) must++; else fails.push({ q: c.q, said: a.text, why: `missing ${c.must.filter((m) => !has(a.text, m)).join(', ')}` }) }
    // words it must never say (a guardrail as a test: e.g. underselling, a number from the wrong project)
    if (c.mustNot?.length) { notN++; const hit = c.mustNot.filter((m) => has(a.text, m)); if (!hit.length) not++; else fails.push({ q: c.q, said: a.text, why: `said ${hit.join(', ')}` }) }
    if (c.abstain !== undefined) { abstN++; if (a.abstained === c.abstain) abst++; else fails.push({ q: c.q, said: a.text, why: c.abstain ? 'should have abstained' : 'abstained wrongly' }) }
  }
  report.answers = { n: cs.length, mustRate: r3(must / (mustN || 1)), mustNotRate: r3(not / (notN || 1)), abstainAcc: r3(abst / (abstN || 1)), fails }
  return report
}

export function table(rs: Report[]) {
  const cols = ['hit1', 'hit3', 'hit5', 'mrr', 'ndcg10', 'p50', 'p95'] as const
  const lines = [`${'run'.padEnd(22)}${cols.map((c) => c.padStart(8)).join('')}`]
  for (const r of rs) lines.push(`${r.name.padEnd(22)}${cols.map((c) => String(r[c]).padStart(8)).join('')}`)
  return lines.join('\n')
}

/** save this run; returns the previous one for comparison */
export function save(dir: string, rs: Report[]) {
  mkdirSync(dir, { recursive: true })
  const prev = readdirSync(dir).filter((f) => f.endsWith('.json')).sort().pop()
  writeFileSync(join(dir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`), JSON.stringify(rs, null, 2))
  return prev ? (JSON.parse(readFileSync(join(dir, prev), 'utf8')) as Report[]) : null
}

/** a drop beyond `tolerance` on any of these metrics fails the gate */
export function gate(now: Report, before: Report | undefined, tolerance = .02, metrics: (keyof Report)[] = ['hit3', 'mrr', 'ndcg10']) {
  if (!before) return []
  return metrics.filter((m) => (now[m] as number) < (before[m] as number) - tolerance).map((m) => `${now.name}: ${String(m)} ${before[m]} → ${now[m]}`)
}
