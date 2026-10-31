// the language model: any OpenAI-compatible chat endpoint (Groq; Google's Gemini and Gemma through their compatible
// endpoint; Cloudflare), asked for JSON. models get retired and keys hit limits, so `openai` walks keys × models and
// `chain` walks providers
import type { LLM, ChatMessage } from './types.ts'
import { post } from './http.ts'

// `extra` goes into the request as is (reasoning_effort...); `response_format: undefined` there turns JSON mode off for
// a model that refuses it (the reply is still parsed as JSON)
export interface ModelSpec { id: string; extra?: Record<string, unknown> }

export function openai(o: { base: string; keys: string[]; models: ModelSpec[]; name?: string }): LLM {
  const keys = o.keys.filter(Boolean)
  return {
    id: o.name || o.models.map((m) => m.id).join('|'),
    async json<T>(messages: ChatMessage[], opt: { maxTokens?: number; temperature?: number } = {}): Promise<T> {
      let last: unknown
      for (const key of keys) for (const m of o.models) {
        try {
          const r = await post(`${o.base}/chat/completions`, {
            model: m.id, response_format: { type: 'json_object' }, ...m.extra, messages, temperature: opt.temperature ?? .3, max_tokens: opt.maxTokens ?? 600,
          }, { headers: { Authorization: `Bearer ${key}` }, tries: 1, timeoutMs: 20000 })
          const text: string = r.choices?.[0]?.message?.content || ''
          return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as T
        } catch (e) { last = e }
      }
      throw last || new Error('no model answered')
    },
  }
}

/** Groq: qwen with thinking off is the fast one; gpt-oss at low effort when it's gone (both live on 31 Oct 2026). */
export const groq = (keys: string[], models: ModelSpec[] = [{ id: 'qwen/qwen3.8-27b', extra: { reasoning_effort: 'none' } }, { id: 'openai/gpt-oss-20b', extra: { reasoning_effort: 'low' } }]) =>
  openai({ base: 'https://api.groq.com/openai/v1', keys, models, name: 'groq' })

/** Google's OpenAI-compatible endpoint (Gemma 4 on the free tier: 14.4K requests a day). */
export const google = (key: string, models: ModelSpec[]) => openai({ base: 'https://generativelanguage.googleapis.com/v1beta/openai', keys: [key], models, name: 'google' })

export function chain(...ls: LLM[]): LLM {
  return {
    id: ls.map((l) => l.id).join('>'),
    async json<T>(m: ChatMessage[], o?: { maxTokens?: number; temperature?: number }): Promise<T> {
      let last: unknown
      for (const l of ls) { try { return await l.json<T>(m, o) } catch (e) { last = e } }
      throw last
    },
  }
}
