// keyword search: BM25 over stemmed terms, kept incrementally (add and remove one chunk at a time)
import { terms } from './text.ts'

export class BM25 {
  k1 = 1.2; b = 0.75
  private docs = new Map<string, { tf: Map<string, number>; len: number }>()
  private df = new Map<string, number>()
  private total = 0
  add(id: string, text: string) {
    this.remove(id)
    const tf = new Map<string, number>(), ts = terms(text)
    for (const t of ts) tf.set(t, (tf.get(t) || 0) + 1)
    for (const t of tf.keys()) this.df.set(t, (this.df.get(t) || 0) + 1)
    this.docs.set(id, { tf, len: ts.length }); this.total += ts.length
  }
  remove(id: string) {
    const d = this.docs.get(id); if (!d) return
    for (const t of d.tf.keys()) { const n = (this.df.get(t) || 1) - 1; if (n) this.df.set(t, n); else this.df.delete(t) }
    this.total -= d.len; this.docs.delete(id)
  }
  /** scores for every document that shares a term with the query (allowed: only these ids) */
  search(query: string, allowed?: (id: string) => boolean): { id: string; score: number }[] {
    const q = [...new Set(terms(query))], N = this.docs.size || 1, avg = this.total / N || 1, out: { id: string; score: number }[] = []
    for (const [id, d] of this.docs) {
      if (allowed && !allowed(id)) continue
      let s = 0
      for (const t of q) {
        const f = d.tf.get(t); if (!f) continue
        const n = this.df.get(t) || 0, idf = Math.log(1 + (N - n + .5) / (n + .5))
        s += idf * (f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + this.b * d.len / avg))
      }
      if (s > 0) out.push({ id, score: s })
    }
    return out.sort((a, b) => b.score - a.score)
  }
}
