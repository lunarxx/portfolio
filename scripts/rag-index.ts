// build the interview's search index: about.md, one bullet a chunk under its section, embedded with Gemini Embedding 1
// (768 dims) and saved next to it. run after editing about.md: `npm run rag:index` (the route notices a stale index and
// falls back to words only until it's rebuilt)
import { writeFileSync } from 'fs'
import { createRag, MemoryStore, embedders } from '../src/lib/rag/index.ts'
import { knowledge, INDEX, REFS } from '../src/meet/knowledge/load.ts'

const key = process.env.GEMINI_API_KEY
if (!key) { console.error('GEMINI_API_KEY missing (portfolio .env.local)'); process.exit(1) }
const { doc, hash } = knowledge()
const store = new MemoryStore(), embedder = embedders.gemini1({ key, dims: 768 })
const rag = createRag({ store, embedder, chunking: { itemsPerChunk: 1, refs: REFS } })
const t = performance.now()
const r = await rag.ingest([doc])
writeFileSync(INDEX, JSON.stringify(store.toJSON({ about: hash, embedder: embedder.id, built: new Date().toISOString() })))
console.log(`indexed ${r.added} chunks with ${embedder.id} in ${Math.round(performance.now() - t)} ms → ${INDEX}`)
