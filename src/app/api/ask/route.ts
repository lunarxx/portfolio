// the interview's open answers, on octyn-rag. a question nobody wrote an answer for is looked up in what he's written
// about himself (src/meet/knowledge/about.md: words and meaning, Gemini Embedding 1, words alone if that's down), and
// answered as him from what came back, citing it, so "how do you know?" can lay the notes out. `read` is the other
// trick: a cold read of the visitor from the notes he took on what they did in the call, nothing else
import { readFileSync } from 'fs'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { createRag, MemoryStore, embedders, llms, search, type Passage } from '@/lib/rag/index.ts'
import { knowledge, INDEX, REFS, WEIGHTS } from '@/meet/knowledge/load'
import { INTERVIEW, check, asksAboutSetbacks } from '@/meet/knowledge/guard'

const ACTIONS = ['shelf', 'mooney', 'desk', 'aarttsii', 'inkling', 'engine', 'rag', 'contact', 'wave', 'dance', 'spin', 'sip', 'stretch', 'cat'] as const
// what he can actually show or do when asked; the desk and the engine are things he talks about, not demos he has
const OFFERABLE = new Set(['shelf', 'mooney', 'desk', 'aarttsii', 'inkling', 'engine', 'rag', 'contact', 'wave', 'dance', 'spin', 'sip', 'stretch', 'cat'])
const EMAIL = 'ashwinitiwari8888@gmail.com'

// built once per server: the saved index if it matches about.md, else words only from about.md itself (still right,
// just less clever, until `npm run rag:index`)
let rag: ReturnType<typeof createRag> | null = null, RULES = '', SETBACKS = ''
async function engine() {
  if (rag) return rag
  const { doc, rules, setbacks, hash } = knowledge(); RULES = rules; SETBACKS = setbacks
  const llm = llms.chain(
    llms.groq([process.env.GROQ_API_KEY!, process.env.GROQ_API_KEY_FALLBACK!]),
    ...(process.env.GEMINI_API_KEY ? [llms.google(process.env.GEMINI_API_KEY, [{ id: 'gemini-3.5-flash-lite' }])] : []))
  let store: MemoryStore, fresh = false
  try { const saved = JSON.parse(readFileSync(INDEX, 'utf8')); fresh = saved.meta?.about === hash; store = MemoryStore.fromJSON(saved) } catch { store = new MemoryStore() }
  const embedder = fresh && process.env.GEMINI_API_KEY ? embedders.gemini1({ key: process.env.GEMINI_API_KEY, dims: 768 }) : undefined
  rag = createRag({ store, embedder, llm, chunking: { itemsPerChunk: 1, refs: REFS } })
  if (!fresh) { console.warn('[ask] index is stale or missing: words only until `npm run rag:index`'); await rag.ingest([doc]) }
  return rag
}

const clean = (t: unknown, n = 400) => String(t || '').replace(/—|–/g, ',').replace(/\s+/g, ' ').trim().slice(0, n)
// what the visitor may see of a note: its section and its words, never where we got it from
const slip = (p: Passage) => ({ n: p.n, section: p.context.split(' › ').pop() || '', text: p.text })

export async function POST(req: Request) {
  const ip = getClientIP(req)
  if (!rateLimit(`ask:${ip}`, 20, 60_000)) return Response.json({ say: 'Give me a second, too many questions at once.', action: null }, { status: 429 })
  const body = await req.json().catch(() => ({}))
  try {
    return Response.json(body.mode === 'read' ? await reading(body) : body.mode === 'sources' ? await sources(body) : body.mode === 'search' ? await searchShown(body) : await answer(body))
  } catch (e) {
    console.error('[ask]', e)
    return Response.json({ say: "My head's a bit fuzzy right now. Ask me that over email?", action: null, cites: [] })
  }
}

async function answer({ q, mood, name, recent }: any) {
  if (!q || typeof q !== 'string' || q.length > 400) throw new Error('no question')
  const r = await engine()
  const history = Array.isArray(recent) ? recent.slice(-6).map((l: any) => ({ who: l.who === 'him' ? 'assistant' as const : 'user' as const, text: String(l.text).slice(0, 300) })) : []
  const ask = (extra = '') => r.answer(q, {
    history, rewrite: 'append', limit: 14, budget: 1600, weights: WEIGHTS, allowUngrounded: true, temperature: .5, maxTokens: 400,
    instructions: `You are Ashwini Tiwari, in a video-call interview on your portfolio. You appear as Octyn, your TV-headed stream character, at your desk. A visitor (maybe a hirer) is talking to you.
Answer as Ashwini, first person, out loud: 1 to 3 short sentences, plain spoken English, casual and warm, a little dry. No em dashes, no lists, no markdown, no emojis, no hype words. Never mention notes, sources or searching; just talk.
If the notes don't cover it, say you don't know that one and that they can email you (${EMAIL}).
On screen you can show: the shelf of everything you've built (shelf), and a small working version of the desk/Cookie (desk), Mooney (mooney), aarttsii's estimator (aarttsii), Inkling (inkling), the outbound engine (engine) and the real RAG search over your notes (rag); and your contact card (contact). Never offer to show anything else (no dashboards, sites or code); talk about those instead.
${INTERVIEW}
${asksAboutSetbacks(q) ? `They asked about setbacks. Pick exactly one from this list and nothing else (never call anything else a failure), tell it in a sentence or two, and land on what you learned or did next:
${SETBACKS}` : 'Do not use anything from the "Setbacks and lessons" notes.'}
Never say any of these:\n${RULES}
Your current mood: ${clean(mood || 'relaxed and friendly', 120)}. Let it colour the tone only, never refuse to answer.${name ? `\nThe visitor's name is ${clean(name, 30)}.` : ''}${extra}`,
    fields: {
      action: `null, or one thing to do on screen right now, only if they asked for it or it plainly fits what you just said: ${ACTIONS.join(', ')} (each opens that project's small working version on screen, only for that project: never Mooney when talking about the desk; shelf opens everything; contact your card; cat pets the cat)`,
      offer: `null, or if your answer ends by offering to show or do something, which one: ${ACTIONS.join(', ')} (only the project you just talked about). Use it instead of action when you're asking, not doing`,
      next: `2 short follow-up questions they might ask next, in their words, about what you just said, under 7 words each (e.g. "How does it price an order?")`,
    },
  })
  // every answer is checked before he says it: one retry told what it broke, then a safe line
  let a = await ask(), broke = check(q, a.text)
  if (broke.length) {
    console.warn('[ask] guard:', broke.join('; '), '|', a.text)
    a = await ask(`\nYour last answer broke these interview rules: ${broke.join('; ')}. Answer again without doing that.`)
    broke = check(q, a.text)
    if (broke.length) return { say: /work|part|skill/.test(broke.join(' ')) ? 'My cofounder and I built it together. Want to see it?' : "That's a longer story. Ask me how any of it works, that's the fun part.", action: null, covered: true, cites: [], guarded: true }
  }
  const action = ACTIONS.includes(a.extra.action as any) ? a.extra.action : (!a.covered ? 'contact' : null)
  const offer = OFFERABLE.has(a.extra.offer as string) && a.extra.offer !== action ? a.extra.offer : null
  const next = (Array.isArray(a.extra.next) ? a.extra.next : []).map((x: unknown) => clean(x, 60)).filter((x: string) => x && x.split(' ').length <= 9).slice(0, 2)
  return { say: clean(a.text) || "Not sure about that one. Email me?", action, offer, next, covered: a.covered, cites: a.cites.map(slip), of: await r.store.count({ kinds: ['about'] }), ms: a.trace.ms }
}

// a written answer's notes: what he just said, looked up (no model call: words and meaning only)
async function sources({ q, say }: any) {
  const r = await engine()
  const found = await search(r, `${clean(q, 200)}. ${clean(say, 400)}`, { limit: 3, budget: 500, weights: WEIGHTS, filter: { kinds: ['about'] } })
  return { cites: found.passages.map(slip), of: await r.store.count({ kinds: ['about'] }) }
}

// the search itself, shown (the RAG miniature): every candidate's rank in each leg, the fused score, and what was kept.
// his real notes, his real search; no model call
async function searchShown({ q }: any) {
  if (!q || typeof q !== 'string' || q.length > 200) throw new Error('no question')
  const r = await engine()
  const found = await search(r, clean(q, 200), { limit: 5, budget: 900, weights: WEIGHTS, filter: { kinds: ['about'] } })
  const short = (t: string) => clean(t, 140)
  return {
    of: await r.store.count({ kinds: ['about'] }), ms: found.trace.ms, degraded: found.degraded.length > 0,
    candidates: found.hits.slice(0, 8).map((h) => ({ id: h.chunk.id, section: h.chunk.context.split(' › ').pop(), text: short(h.chunk.text), words: h.ranks.keyword ?? null, meaning: h.ranks.vector ?? null, fused: +(h.scores.fused || 0).toFixed(5), kept: found.passages.some((p) => p.ids.includes(h.chunk.id)) })),
  }
}

// the cold read: only from what they did (the notes the page kept), tied to something true about him when it fits
async function reading({ notes, name }: any) {
  const list = (Array.isArray(notes) ? notes : []).slice(-30).map((x: any, i: number) => `${i}: [${clean(x.at, 8)}] ${clean(x.text, 140)}`)
  if (list.length < 3) throw new Error('not enough to read')
  const r = await engine()
  const about = (await search(r, list.join(' '), { limit: 5, budget: 500, weights: WEIGHTS })).passages.map((p) => `- ${p.text}`).join('\n')
  const out = await r.llm!.json<any>([
    { role: 'system', content: `You are Ashwini Tiwari on a video call, doing a playful cold read of the visitor, the way a mentalist reads a stranger: confident, warm, oddly specific, a little smug. All you know is the numbered notes on what they did in this call.
Write 3 observations. Each is one short spoken sentence, starts with "You", names a trait, and slips in a sly hint of the evidence without listing it, so it lands as uncanny. Different note for each. The shape (don't reuse the words): "You learn by breaking things first, then you read the manual."
Then "guess": one plain sentence, under 22 words, on why they're here or what they do, reasoned from what they asked about. No metaphors.
Then "tie": one sentence in your own voice ("I ..." or "My ..."), linking the guess to something you did, using only these facts, or null if none fits:\n${about}
Never comment on how they look, their face, body, voice, age, gender, or anything a camera would show; only their choices and actions. Never be mean. No em dashes. Never invent anything not in the notes or facts.${name ? `\nTheir name is ${clean(name, 30)}.` : ''}
Reply as JSON: {"lines": [{"say": "...", "note": number}, {"say": "...", "note": number}, {"say": "...", "note": number}], "guess": "...", "guessNotes": [numbers], "tie": "..." or null}` },
    { role: 'user', content: `Notes:\n${list.join('\n')}` },
  ], { maxTokens: 400, temperature: .7 })
  const lines = (Array.isArray(out.lines) ? out.lines : []).slice(0, 3).map((l: any) => ({ say: clean(l.say, 200), note: Number(l.note) })).filter((l: any) => l.say)
  return { lines, guess: clean(out.guess, 200), tie: out.tie ? clean(out.tie, 200) : null, guessNotes: (out.guessNotes || []).map(Number).filter((n: number) => n >= 0 && n < list.length) }
}
