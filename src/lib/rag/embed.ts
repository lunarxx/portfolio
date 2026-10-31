// embedders: text into vectors. every vector a store holds must come from the same embedder (the spaces of two models
// don't mix), so there's no fallback between them here: when one fails, search goes keyword-only (search.ts)
import type { Embedder } from './types.ts'
import { post } from './http.ts'
import { normalize, hash } from './text.ts'

const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models'
// indexing sits out a rate limit (the free tier counts every batched text as a request: 100 a minute); a live query
// doesn't, so search can fall back to words at once
const wait = (as: 'doc' | 'query') => (as === 'doc' ? { timeoutMs: 30000, tries: 8, maxWaitMs: 70000 } : { timeoutMs: 4000, tries: 2, maxWaitMs: 1500 })

/** Gemini Embedding 1 (`gemini-embedding-001`): text only, 2,048 tokens, task types. Vectors under 3,072 dims come back
 *  unnormalised, so they're normalised here. Documents may carry a title (it improves retrieval). */
export function gemini1(o: { key: string; dims?: number; model?: string; batch?: number }): Embedder {
  const model = o.model || 'gemini-embedding-001', dims = o.dims || 768
  return {
    id: `${model}@${dims}`, dims,
    async embed(texts, as) {
      const out: number[][] = []
      for (let i = 0; i < texts.length; i += o.batch || 100) {
        const requests = texts.slice(i, i + (o.batch || 100)).map((t) => ({ model: `models/${model}`, content: { parts: [{ text: t }] }, taskType: as === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT', outputDimensionality: dims }))
        const r = await post(`${GEMINI}/${model}:batchEmbedContents`, { requests }, { headers: { 'x-goog-api-key': o.key }, ...wait(as) })
        for (const e of r.embeddings) out.push(normalize(e.values))
      }
      return out
    },
  }
}

/** Gemini Embedding 2 (`gemini-embedding-2`): multimodal, 8,192 tokens, no task types: the task goes in the text.
 *  One request per text (several inputs in one content are merged into one vector). */
export function gemini2(o: { key: string; dims?: number; model?: string; batch?: number }): Embedder {
  const model = o.model || 'gemini-embedding-2', dims = o.dims || 768
  const wrap = (t: string, as: 'doc' | 'query') => (as === 'query' ? `task: search result | query: ${t}` : `title: none | text: ${t}`)
  return {
    id: `${model}@${dims}`, dims,
    async embed(texts, as) {
      const out: number[][] = []
      for (let i = 0; i < texts.length; i += o.batch || 50) {
        const requests = texts.slice(i, i + (o.batch || 50)).map((t) => ({ model: `models/${model}`, content: { parts: [{ text: wrap(t, as) }] }, outputDimensionality: dims }))
        const r = await post(`${GEMINI}/${model}:batchEmbedContents`, { requests }, { headers: { 'x-goog-api-key': o.key }, ...wait(as) })
        for (const e of r.embeddings) out.push(normalize(e.values))
      }
      return out
    },
  }
}

/** Cloudflare Workers AI (bge-m3: 1,024 dims, multilingual; qwen3-embedding-0.6b; bge-small 384). */
export function cloudflare(o: { account: string; token: string; model?: string; dims?: number; batch?: number }): Embedder {
  const model = o.model || '@cf/baai/bge-m3'
  return {
    id: model, dims: o.dims || (/bge-small/.test(model) ? 384 : /bge-base/.test(model) ? 768 : 1024),
    async embed(texts, as) {
      const out: number[][] = []
      for (let i = 0; i < texts.length; i += o.batch || 50) {
        const r = await post(`https://api.cloudflare.com/client/v4/accounts/${o.account}/ai/run/${model}`, { text: texts.slice(i, i + (o.batch || 50)) }, { headers: { Authorization: `Bearer ${o.token}` }, ...wait(as) })
        for (const v of r.result.data) out.push(normalize(v))
      }
      return out
    },
  }
}

/** Local, free, offline (transformers.js, ONNX). Default bge-small (34 MB quantised); bge wants an instruction on queries. */
export function local(o: { model?: string; dims?: number; queryPrefix?: string } = {}): Embedder {
  const model = o.model || 'Xenova/bge-small-en-v1.5'
  const prefix = o.queryPrefix ?? (/bge-.*-en/.test(model) ? 'Represent this sentence for searching relevant passages: ' : '')
  let pipe: any
  return {
    id: model, dims: o.dims || 384,
    async embed(texts, as) {
      if (!pipe) { const { pipeline } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ '@huggingface/transformers' as string); pipe = await pipeline('feature-extraction', model, { dtype: 'q8' }) }
      const r = await pipe(texts.map((t) => (as === 'query' ? prefix + t : t)), { pooling: 'cls', normalize: true })
      return r.tolist()
    },
  }
}

/** For tests: a deterministic bag-of-words vector (similar words, similar vectors; no meaning). */
export function fake(dims = 256): Embedder {
  return {
    id: `fake@${dims}`, dims,
    async embed(texts) {
      return texts.map((t) => {
        const v = new Array(dims).fill(0)
        for (const w of t.toLowerCase().match(/[a-z0-9]+/g) || []) { const h = parseInt(hash(w).slice(-6), 36); v[h % dims] += 1 }
        return normalize(v)
      })
    },
  }
}
