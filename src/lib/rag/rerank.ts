// rerankers: read the question and each passage together and score how well it answers. raw scores differ wildly by
// model (Cloudflare's bge-reranker-base gives a right answer 0.003), so the abstain cutoff is calibrated per reranker
// on the eval set, never a fixed number. unlike embedders these can fall back to each other: `chain`
import type { Reranker } from './types.ts'
import { post } from './http.ts'

export function cloudflare(o: { account: string; token: string; model?: string }): Reranker {
  const model = o.model || '@cf/baai/bge-reranker-base'
  return {
    id: model,
    async score(query, passages) {
      if (!passages.length) return []
      const r = await post(`https://api.cloudflare.com/client/v4/accounts/${o.account}/ai/run/${model}`, { query, contexts: passages.map((text) => ({ text })) }, { headers: { Authorization: `Bearer ${o.token}` } })
      const out = new Array(passages.length).fill(0)
      for (const x of r.result.response) out[x.id] = x.score
      return out
    },
  }
}

/** Local cross-encoder (transformers.js). mxbai-rerank-xsmall: BEIR nDCG@10 43.9 at 71M params (docs/research.md). */
export function local(o: { model?: string } = {}): Reranker {
  const model = o.model || 'mixedbread-ai/mxbai-rerank-xsmall-v1'
  let tok: any, net: any
  return {
    id: model,
    async score(query, passages) {
      if (!passages.length) return []
      if (!net) {
        const t = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ '@huggingface/transformers' as string)
        tok = await t.AutoTokenizer.from_pretrained(model); net = await t.AutoModelForSequenceClassification.from_pretrained(model, { dtype: 'q8' })
      }
      const inputs = tok(new Array(passages.length).fill(query), { text_pair: passages, padding: true, truncation: true })
      const { logits } = await net(inputs)
      return logits.sigmoid().tolist().map((r: number[]) => r[0])
    },
  }
}

/** The first that answers; a failed one is skipped for a minute so a dead provider doesn't cost a timeout every call. */
export function chain(...rs: Reranker[]): Reranker {
  const down = new Map<string, number>()
  return {
    id: rs.map((r) => r.id).join('>'),
    async score(query, passages) {
      let last: unknown
      for (const r of rs) {
        if ((down.get(r.id) || 0) > Date.now()) continue
        try { return await r.score(query, passages) } catch (e) { last = e; down.set(r.id, Date.now() + 60000) }
      }
      throw last || new Error('no reranker available')
    },
  }
}
