// memory: what people said, kept two ways. every turn is stored as it was (an episode: searchable, and the source of
// every fact). facts are pulled out of it (who it's about, the subject, the statement, dates resolved against the
// turn's own time: mem0), then each one is checked before it lands: an exact repeat is dropped without a model call;
// otherwise the same subject's facts (duplicates?) and a broader set (contradictions?) go to the model, which answers
// by small integer index (Graphiti's rules: never a duplicate when numbers, dates or qualifiers differ; a contradiction
// needs evidence the old fact ended). time is then set in code, never by the model (Graphiti's temporal rules)
import type { Chunk, Embedder, LLM, Store, Trace } from './types.ts'
import { search } from './search.ts'
import { hash } from './text.ts'

export interface Fact { subject: string; statement: string; about?: 'user' | 'assistant' | 'other'; validFrom?: string | null; validUntil?: string | null; importance?: number }
export interface Change { action: 'add' | 'duplicate' | 'retire' | 'add-ended'; fact: string; id?: string; replaces?: string }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const EXTRACT = (date: string, focus: string) => `You pull lasting facts out of one message in a conversation. The message was sent on ${date}: resolve relative times ("yesterday", "next month") against that date, never today's.
Keep facts worth remembering later: ${focus}. Skip greetings, filler and anything only true for this sentence.
Each fact stands alone: no pronouns, the subject named. One fact per statement.
Return JSON: {"facts": [{"subject": the person or thing it's about, short, "statement": the fact in one sentence, "about": "user" | "assistant" | "other", "validFrom": ISO date or null, "validUntil": ISO date or null, "importance": 1 to 5}]}. An empty list is fine.`

const RESOLVE = `You check one NEW FACT against facts already known.
NEVER mark a fact as a duplicate if they differ in a number, a date, an amount or a key qualifier.
Only mark a fact contradicted when the NEW FACT and it cannot both be true: there must be explicit evidence the old fact stopped being true or was replaced (an end, a change, a transfer, a cancellation, mutually exclusive current states). Never infer it from recency alone, or from new activity involving the same person or thing (doing work on an order doesn't contradict who owns it).
duplicate_facts: indices from EXISTING FACTS only. contradicted_facts: indices from either list (the numbering continues from EXISTING FACTS into OTHER FACTS).
Return JSON: {"duplicate_facts": [numbers], "contradicted_facts": [numbers]}`

export interface MemoryOptions {
  /** what's worth remembering here (the desk: orders, preferences, sizes, addresses, deadlines, complaints) */
  focus?: string
  /** facts compared per check (each of the two searches) */
  candidates?: number
  onTrace?: (t: Trace) => void
}

export function memory(ctx: { store: Store; embedder?: Embedder; llm: LLM }, o: MemoryOptions = {}) {
  const n = o.candidates ?? 8
  const embed = async (texts: string[]) => (ctx.embedder ? ctx.embedder.embed(texts, 'doc').catch(() => texts.map(() => [])) : texts.map(() => []))

  /** store a turn and learn from it. `scope` is where it lives (tenant:x/contact:y/session:z) */
  async function remember(turn: { scope: string; who: 'user' | 'assistant'; text: string; at?: string; id?: string }) {
    const t0 = performance.now(), at = turn.at || new Date().toISOString(), changes: Change[] = []
    const episode: Chunk = { id: turn.id || `ep:${hash(turn.scope + at + turn.text)}`, docId: `episodes:${turn.scope}`, text: `${turn.who}: ${turn.text}`, context: '', scope: turn.scope, kind: 'episode', source: 'conversation', at, pos: Date.parse(at), meta: { who: turn.who } }
    await ctx.store.upsert([episode], await embed([episode.text]))

    let facts: Fact[] = []
    try { facts = (await ctx.llm.json<{ facts: Fact[] }>([{ role: 'system', content: EXTRACT(at.slice(0, 10), o.focus || 'who someone is, what they want, prefer, decided, own, plan, and what changed') }, { role: 'user', content: `${turn.who}: ${turn.text}` }], { maxTokens: 500, temperature: 0 })).facts || [] } catch { /* the episode is kept; facts can be pulled again later */ }

    for (const f of facts.filter((x) => x?.statement && x?.subject).slice(0, 8)) {
      const filter = { scopes: [turn.scope], kinds: ['fact'] }
      // the same subject's facts (duplicates) and the broader neighbourhood (contradictions), both current only
      const same = (await search(ctx, `${f.subject}: ${f.statement}`, { filter: { ...filter, where: (c) => norm(c.subject || '') === norm(f.subject) }, limit: n, pool: 40 })).passages
      if (same.some((p) => norm(p.text) === norm(f.statement))) { changes.push({ action: 'duplicate', fact: f.statement }); continue }   // exact repeat: no model call
      const sameIds = new Set(same.flatMap((p) => p.ids))
      const wider = (await search(ctx, f.statement, { filter, limit: n, pool: 40 })).passages.filter((p) => !p.ids.some((id) => sameIds.has(id)))
      const known = [...same, ...wider]
      let dup: number[] = [], contra: number[] = []
      if (known.length) {
        try {
          const r = await ctx.llm.json<{ duplicate_facts: number[]; contradicted_facts: number[] }>([
            { role: 'system', content: RESOLVE },
            { role: 'user', content: `EXISTING FACTS:\n${same.map((p, i) => `${i}: ${p.text}`).join('\n') || '(none)'}\n\nOTHER FACTS:\n${wider.map((p, i) => `${same.length + i}: ${p.text}`).join('\n') || '(none)'}\n\nNEW FACT: ${f.statement}` },
          ], { maxTokens: 120, temperature: 0 })
          dup = (r.duplicate_facts || []).map(Number).filter((i) => i >= 0 && i < same.length)
          contra = (r.contradicted_facts || []).map(Number).filter((i) => i >= 0 && i < known.length)
        } catch { /* can't check it: add it, a later check can retire it */ }
      }
      if (dup.length && !contra.length) { changes.push({ action: 'duplicate', fact: f.statement, id: same[dup[0]].ids[0] }); continue }

      const id = `fact:${hash(turn.scope + f.subject + f.statement + at)}`
      const fact: Chunk = { id, docId: `facts:${turn.scope}`, text: f.statement, context: f.subject, scope: turn.scope, kind: 'fact', source: episode.id, at, pos: Date.parse(at), subject: f.subject, importance: f.importance ?? 3,
        validFrom: f.validFrom || at, validUntil: f.validUntil || null, retiredAt: null, meta: { about: f.about || 'other', episode: episode.id } }
      // time, decided here: an older overlapping fact ends where this one starts; a new fact older than what it
      // contradicts is stored already ended
      const now = new Date().toISOString(), retire: { id: string; until: string }[] = []
      for (const i of contra) {
        const old = (await ctx.store.get([known[i].ids[0]]))[0]; if (!old) continue
        const oFrom = old.validFrom || old.at || '', nFrom = fact.validFrom!
        if (old.validUntil && old.validUntil <= nFrom) continue
        if (fact.validUntil && fact.validUntil <= oFrom) continue
        if (oFrom <= nFrom) retire.push({ id: old.id, until: nFrom })
        else { fact.validUntil = oFrom; fact.retiredAt = now }
      }
      await ctx.store.upsert([fact], await embed([`${f.subject}: ${f.statement}`]))
      for (const r of retire) { await ctx.store.patch(r.id, { validUntil: r.until, retiredAt: now, meta: { retiredBy: id } }); changes.push({ action: 'retire', fact: (await ctx.store.get([r.id]))[0]?.text || r.id, id: r.id, replaces: id }) }
      if (retire.length) await ctx.store.patch(id, { supersedes: retire[0].id })
      changes.push({ action: fact.retiredAt ? 'add-ended' : 'add', fact: f.statement, id })
    }
    o.onTrace?.({ id: episode.id, at, op: 'remember', scope: [turn.scope], memory: changes, ms: { total: Math.round(performance.now() - t0) } })
    return { episode, changes }
  }

  /** what's remembered for a scope: current facts (or as of a date, or all history) and matching episodes */
  async function recall(query: string, a: { scope: string; asOf?: string; history?: boolean; limit?: number; episodes?: boolean }) {
    return search(ctx, query, { filter: { scopes: [a.scope], kinds: a.episodes === false ? ['fact'] : ['fact', 'episode'], asOf: a.asOf, history: a.history }, limit: a.limit ?? 10 })
  }

  return { remember, recall }
}
