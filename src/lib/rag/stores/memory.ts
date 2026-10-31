// the in-process store: BM25 and brute-force cosine over everything in memory, filters applied while scanning (never
// after a limit). for small corpora (the portfolio: hundreds of chunks, a search well under a millisecond). saved to
// and loaded from JSON, vectors as base64 Float32 so the file stays small
import type { Chunk, Filter, Store } from '../types.ts'
import { BM25 } from '../bm25.ts'
import { searchable } from '../chunk.ts'
import { visible } from '../scope.ts'

const toB64 = (v: number[]) => Buffer.from(new Float32Array(v).buffer).toString('base64')
const fromB64 = (s: string) => Array.from(new Float32Array(new Uint8Array(Buffer.from(s, 'base64')).buffer))

export class MemoryStore implements Store {
  chunks = new Map<string, Chunk>()
  vecs = new Map<string, number[]>()
  private bm = new BM25()

  async upsert(chunks: Chunk[], vectors: number[][]) {
    chunks.forEach((c, i) => {
      this.chunks.set(c.id, c); this.bm.add(c.id, searchable(c))
      if (vectors[i]?.length) this.vecs.set(c.id, vectors[i]); else this.vecs.delete(c.id)
    })
  }
  async patch(id: string, p: Partial<Chunk>) {
    const c = this.chunks.get(id); if (!c) return
    const n = { ...c, ...p, meta: { ...c.meta, ...(p.meta || {}) } }
    this.chunks.set(id, n)
    if (p.text !== undefined || p.context !== undefined) this.bm.add(id, searchable(n))
  }
  async remove(ids: string[]) { for (const id of ids) { this.chunks.delete(id); this.vecs.delete(id); this.bm.remove(id) } }
  async get(ids: string[]) { return ids.map((id) => this.chunks.get(id)).filter(Boolean) as Chunk[] }
  async listDoc(docId: string) { return [...this.chunks.values()].filter((c) => c.docId === docId).sort((a, b) => a.pos - b.pos) }
  async around(docId: string, pos: number, n: number) {
    return [...this.chunks.values()].filter((c) => c.docId === docId && Math.abs(c.pos - pos) <= n).sort((a, b) => a.pos - b.pos)
  }
  async keyword(query: string, k: number, f: Filter) {
    const now = new Date().toISOString()
    return this.bm.search(query, (id) => visible(this.chunks.get(id)!, f, now)).slice(0, k).map((h) => ({ chunk: this.chunks.get(h.id)!, score: h.score }))
  }
  async vector(v: number[], k: number, f: Filter) {
    const now = new Date().toISOString(), out: { chunk: Chunk; score: number }[] = []
    for (const [id, w] of this.vecs) {
      const c = this.chunks.get(id)!; if (!visible(c, f, now)) continue
      let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * w[i]
      out.push({ chunk: c, score: s })
    }
    return out.sort((a, b) => b.score - a.score).slice(0, k)
  }
  async count(f: Filter = {}) { const now = new Date().toISOString(); let n = 0; for (const c of this.chunks.values()) if (visible(c, f, now)) n++; return n }

  toJSON(meta: Record<string, unknown> = {}) {
    return { meta, chunks: [...this.chunks.values()].map((c) => ({ ...c, v: this.vecs.has(c.id) ? toB64(this.vecs.get(c.id)!) : undefined })) }
  }
  static fromJSON(data: { chunks: (Chunk & { v?: string })[] }) {
    const s = new MemoryStore()
    for (const { v, ...c } of data.chunks) { s.chunks.set(c.id, c); s.bm.add(c.id, searchable(c)); if (v) s.vecs.set(c.id, fromB64(v)) }
    return s
  }
}
