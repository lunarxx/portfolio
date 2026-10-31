// octyn-rag: one engine for what an agent knows (documents, records) and what it remembers (people, over time).
// createRag wires a store, an embedder, a reranker and a model; everything else is optional and swappable
import type { Doc, Embedder, LLM, Reranker, Store } from './types.ts'
import { chunk, searchable, type ChunkOptions } from './chunk.ts'
import { search, type SearchOptions } from './search.ts'
import { answer, type AnswerOptions } from './answer.ts'
import { memory, type MemoryOptions } from './memory.ts'
import { hash } from './text.ts'
import type { Sink } from './trace.ts'

export * from './types.ts'
export { chunk, searchable } from './chunk.ts'
export { search } from './search.ts'
export { answer, rewrite } from './answer.ts'
export { memory } from './memory.ts'
export { MemoryStore } from './stores/memory.ts'
export { PgStore } from './stores/postgres.ts'
export * as embedders from './embed.ts'
export * as rerankers from './rerank.ts'
export * as llms from './llm.ts'
export * as traces from './trace.ts'
export * as evals from './eval.ts'
export type { Passage, SearchOptions } from './search.ts'
export type { AnswerOptions, Answer, Turn } from './answer.ts'

export interface RagConfig { store: Store; embedder?: Embedder; reranker?: Reranker; llm?: LLM; trace?: Sink; chunking?: ChunkOptions; memory?: MemoryOptions }

export function createRag(cfg: RagConfig) {
  const ctx = { store: cfg.store, embedder: cfg.embedder, reranker: cfg.reranker }
  const mem = cfg.llm ? memory({ ...ctx, llm: cfg.llm }, { ...cfg.memory, onTrace: cfg.trace }) : null
  return {
    ...ctx, llm: cfg.llm,
    /** add or refresh documents: unchanged ones are skipped (by content hash), changed ones replaced whole */
    async ingest(docs: Doc[], o: ChunkOptions = {}) {
      let added = 0, skipped = 0
      for (const d of docs) {
        const h = hash(JSON.stringify([d.text, d.title, d.scope, d.kind, d.at, d.meta, o, cfg.chunking]))
        const old = await cfg.store.listDoc(d.id)
        if (old.length && old.every((c) => c.meta.docHash === h)) { skipped++; continue }
        const cs = chunk({ ...d, meta: { ...d.meta, docHash: h } }, { ...cfg.chunking, ...o })
        const vs = cfg.embedder ? await cfg.embedder.embed(cs.map(searchable), 'doc') : cs.map(() => [])
        await cfg.store.remove(old.map((c) => c.id))
        await cfg.store.upsert(cs, vs); added += cs.length
      }
      return { added, skipped }
    },
    async search(q: string, o?: SearchOptions) { const r = await search(ctx, q, o); cfg.trace?.(r.trace); return r },
    async answer(q: string, o?: AnswerOptions) {
      if (!cfg.llm) throw new Error('answer needs an llm')
      const r = await answer({ ...ctx, llm: cfg.llm }, q, o); cfg.trace?.(r.trace); return r
    },
    remember: (...a: Parameters<NonNullable<typeof mem>['remember']>) => { if (!mem) throw new Error('memory needs an llm'); return mem.remember(...a) },
    recall: (...a: Parameters<NonNullable<typeof mem>['recall']>) => { if (!mem) throw new Error('memory needs an llm'); return mem.recall(...a) },
  }
}
