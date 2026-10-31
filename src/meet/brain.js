// what he says (drafts in ashwini's voice, for him to correct), how he understands you, and what a yes does.
// offer: what a yes does next. next: the chips after this answer
import { get, set, live, note, noteText, spokenName } from './store.js'
import { say, move, emit, pick } from './show.js'
import { pacify, tone, talkedTo, moodWords } from './behaviour.js'

export const EMAIL = 'ashwinitiwari8888@gmail.com'
const share = (what) => set({ share: what })
const A = {
  greet: { seeds: ['hi', 'hello', 'hey', 'yo', 'sup', 'good morning'], say: 'Hey {name}. Ask me anything, or say "show me" and I will.', mark: 'arms_up' },
  intro: { seeds: ['tell me about yourself', 'who are you', 'introduce yourself', 'whats your background', 'what do you do', 'apne baare mein batao'], say: "I'm Ashwini. I build AI systems that run parts of a business on their own.", mark: 'me', next: ['What have you built?', 'Why should we hire you?'] },
  show_work: { seeds: ['show me something you built', 'what have you built', 'what have you made', 'show me your work', 'what have you shipped', 'portfolio', 'show me', 'show me everything', 'what else have you built', 'tumne kya banaya hai'], say: "Here's everything I've built. Pick one and it opens, or just ask me about it.", mark: 'present', after: () => setTimeout(() => share('shelf'), 700), next: ['Cookie', 'Mooney', "aarttsii's estimator", 'RAG + memory'] },
  mooney: { seeds: ['show me mooney', 'what is mooney', 'tell me about the expense app', 'the voice expense app', 'the app with the cow'], say: "Here, it's on my phone. Say what you spent and watch it log.", act: 'show_phone', after: () => setTimeout(() => share('mooney'), 2200) },
  desk: { seeds: ['the front desk', 'tell me about the whatsapp bot', 'cookie', 'what is the desk', 'show me the desk', 'the desk'], say: "A front desk for made-to-order businesses, tried first on aarttsii. The owner texts it an order, it prices it from the business's own costs, makes the proposal, collects the advance and chases the balance. Here, text her one.", mark: 'explain', after: () => setTimeout(() => share('mini:cookie'), 500), next: ['How does it not make things up?', 'The outbound engine'] },
  aarttsii: { seeds: ['aarttsii', 'the crochet brand', "aarttsii's estimator", 'the price estimator', 'how do you price crochet', 'the crochet store'], say: "All the tech behind a crochet brand. My favourite bit is the estimator: it prices a piece from how hard it is to make. Try it.", mark: 'explain', after: () => setTimeout(() => share('mini:aarttsii'), 500), next: ['Cookie', 'Inkling'] },
  inkling: { seeds: ['inkling', 'the notes app', 'the markdown editor', 'what is inkling'], say: "Inkling. Markdown notes, your vault is a GitHub repo, and two people can write in one note at once. Someone's in there now.", mark: 'explain', after: () => setTimeout(() => share('mini:inkling'), 500), next: ['Mooney', 'RAG + memory'] },
  rag: { seeds: ['how does it not make things up', 'how does the rag work', 'what if it doesnt know', 'hallucination', 'rag + memory', 'rag and memory', 'show me the search'], say: "Every answer is pulled from the records first, and if nothing matches it says so. This one's real: ask it about me and watch it search my notes.", mark: 'point_screen', after: () => setTimeout(() => share('mini:recall'), 500), next: ['The sales engine', 'Why should we hire you?'] },
  engine: { seeds: ['the sales engine', 'the outbound engine', 'tell me about octyn', 'what does your company do', 'outreach engine', 'how do you get clients'], say: 'Octyn finds the right people, reads up on each one, writes to them and follows up, every night, while I sleep. Open any agency to see the line it wrote.', mark: 'explain', after: () => setTimeout(() => share('mini:outbound'), 500), next: ['Why should we hire you?', 'How do you use AI?'] },
  stream: { seeds: ['why are you a tv', 'what is octyn the character', 'why the tv head', 'is this a stream', 'who is octyn'], say: "That's Octyn, my stream character. He codes live, builds his own games and talks to chat.", mark: 'me', next: ['Wave', 'Dance', 'Pet the cat'] },
  why_hire: { seeds: ['why should we hire you', 'what makes you a good fit', 'convince me', 'sell yourself', 'what value would you bring'], say: 'I ship the whole thing, end to end, and it still works at 3am. You are sitting inside one right now.', mark: 'explain', next: ['What are your weaknesses?', 'How do I reach you?'] },
  strengths: { seeds: ['what are your strengths', 'what are you best at', 'whats your edge', 'what makes you special'], say: 'Speed and taste. Idea to live in days, and it feels right when you use it.', mark: 'thumbs_up' },
  weakness: { seeds: ['what is your biggest weakness', 'what are your weaknesses', 'what are you bad at', 'where do you struggle'], say: 'I start too many things. Working on finishing more of them.', mark: 'shrug' },
  ai_use: { seeds: ['how do you use ai', 'how do you work with claude', 'do you write the code yourself', 'do you vibe code', 'is it you or the ai'], say: "Claude's my team. I direct, review and test. This call was built that way.", mark: 'point_screen', next: ['What stack do you use?', 'Why should we hire you?'] },
  stack: { seeds: ['what tech stack do you use', 'what stack do you use', 'which languages do you know', 'what do you code in', 'do you know react', 'do you know python'], say: 'TypeScript, React, Flutter, Python, Postgres, three.js. And my own servers.', mark: 'explain' },
  salary: { seeds: ['what salary are you expecting', 'how much do you charge', 'whats your rate', 'compensation expectations'], say: "Depends on the role. Email me and we'll talk.", mark: 'shrug', offer: 'contact' },
  contact: { seeds: ['how can i contact you', 'how do i reach you', 'what is your email', 'linkedin', 'can i get your resume', 'resume'], say: "Email's quickest. Here.", mark: 'point', after: () => setTimeout(() => share('contact'), 1200) },
  three_d: { seeds: ['tell me about your 3d work', 'did you do 3d art', 'what did you do at sanshu', 'the nft project'], say: 'Lead 3D artist at Sanshu before all this. This guy comes from there.', mark: 'float' },
  failure: { seeds: ['tell me about a failure', 'a mistake you learned from', 'your biggest failure'], say: 'My first agency never landed a client. Taught me to sell before I build.', mark: 'head_shake' },
  wave: { seeds: ['wave', 'wave at me'], say: 'Hi again, {name}.', mark: 'hello' },
  stand: { seeds: ['stand up', 'get up', 'give me a big wave'], say: 'Okay, okay.', move: 'wave' },
  dance: { seeds: ['dance', 'show me your moves', 'can you dance'], say: 'Okay, one song.', act: 'dance' },
  spin: { seeds: ['spin', 'spin in your chair', 'do a spin'], say: 'Wheee!', move: 'spin' },
  sip: { seeds: ['drink your coffee', 'take a sip', 'have some coffee'], say: 'Good idea.', act: 'sip' },
  stretch: { seeds: ['stretch', 'you look tired', 'take a break'], say: 'Yeah, been at this a while.', act: 'stretch' },
  cat: { seeds: ['pet the cat', 'is that your cat', 'cat', 'whats the cats name'], say: 'She runs this place.', act: 'pet_cat' },
  // the two tricks: how he knew (he lays out his notes), and reading you (from what you did, then the notebook)
  how: { seeds: ['how do you know', 'how do you know that', 'how did you know', 'how did you know that', 'where did you get that', 'are you reading from something', 'are you making this up', 'is this rag', 'are you psychic', 'how do you do that'], run: () => reveal() },
  read: { seeds: ['read me', 'guess something about me', 'what do you think of me', 'tell me about myself', 'read my mind', 'can you read me', 'do a cold read', 'guess who i am'], run: () => readYou() },
}
const ALL = Object.entries(A)
const START = ['Who are you?', 'What have you built?', 'Why should we hire you?', 'Pet the cat']
const MORE = ['How do you use AI?', 'What stack do you use?', 'Tell me about a failure', 'How do I reach you?', 'Dance', 'Spin in your chair']
const YES = /^(y|ya|yes|yeah|yea|yep|yup|sure|ok|okay|k|go|go on|go ahead|please|pls|do it|lets go|let's go|show me|show it|of course|absolutely|why not|sounds good|haan|han|ha|bilkul|definitely|alright|cool|yes please|sure thing|tell me more|tell me|go on read me|yes show me|share your contact)\b/i
const NO = /^(no|nah|nope|not now|later|maybe later|skip|pass|nahi|na)\b/i
// when he doesn't know: short, and never the same twice running
const MISS = ['Not sure I follow. Try that another way?', "That one's better over email.", 'Hm. Ask me about something I built?', 'You lost me there, ha.']

// the meaning matcher: a small sentence model in the browser, with a confidence gate (tested: 0 wrong answers played)
let embed = null, bank = [], loading = null
export function loadMatcher() {
  if (loading) return loading
  loading = (async () => {
    try {
      const url = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1'
      const { pipeline, env } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)
      env.allowLocalModels = false
      embed = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' })
      for (const [id, a] of ALL) for (const s of a.seeds) bank.push({ id, v: await vec(s) })
    } catch (e) { console.warn('matcher offline, using words', e) }
  })()
  return loading
}
async function vec(t) { return Array.from((await embed(t, { pooling: 'mean', normalize: true })).data) }
async function match(q) {
  const words = ` ${q.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')} `
  for (const [id, a] of ALL) if (a.seeds.some((s) => words.trim() === s)) return id   // a chip or the exact words: no model needed
  if (embed && bank.length) {
    const v = await vec(q), sc = {}
    for (const b of bank) sc[b.id] = Math.max(sc[b.id] ?? -1, b.v.reduce((s, x, i) => s + x * v[i], 0))
    const r = Object.entries(sc).sort((a, b) => b[1] - a[1])
    return r[0][1] >= .57 && r[0][1] - r[1][1] >= .03 ? r[0][0] : null
  }
  for (const [id, a] of ALL) if (a.seeds.some((s) => words.includes(` ${s} `))) return id
  return null
}

// ---------------------------------------------------------------- the conversation
const asked = new Set()
let miss = 0, capTimer = null
export async function ask(q) {
  q = q.trim(); if (!q) return
  clearTimeout(capTimer); capTimer = setTimeout(() => set({ myCap: '' }), 3200)
  set((s) => ({ log: [...s.log, { who: 'you', text: q }], myCap: q }))
  live.talkUntil = performance.now() + Math.min(4000, 500 + q.length * 55)
  emit({ type: 'glance' })
  // an apology is heard before anything else: it's how you make up with him
  if (/\b(sorry|my bad|apolog|forgive)/i.test(q)) { const line = pacify('sorry'); if (line) { setTimeout(() => say(line, { mark: 'shrug' }), 500); return } }
  talkedTo()
  const pending = get().offer; set({ offer: null })
  // a real ask wins ("show me mooney" is a question, not a yes); only a bare yes or no answers his offer
  let id = await match(q)
  if (id !== 'how' && id !== 'read' && (q.split(/\s+/).length > 2 || !(YES.test(q) || NO.test(q)))) note(`asked "${q.slice(0, 90)}"`)
  const bare = !id || id === 'greet' || (id === 'show_work' && pending)
  if (bare && pending && YES.test(q) && q.split(/\s+/).length <= 5) id = pending
  else if (bare && pending && NO.test(q)) { setTimeout(() => { say('Fair. What else do you want to know?', { mark: 'shrug' }); chips() }, 600); return }
  else if (!id && YES.test(q) && q.split(/\s+/).length <= 3) { setTimeout(() => { say('Yes to what? Ask me anything.', { mark: 'shrug' }); chips() }, 600); return }
  setTimeout(() => play(id, q), id ? 250 : 120)
}
// anything without a written answer: the facts about him go to a model with the question, it answers as him (in his
// mood) and may pick something to do on screen. it's his fallback, so a slow or failed call still gets him talking
const DO = { mooney: { act: 'show_phone', after: () => setTimeout(() => share('mooney'), 2200) }, contact: { after: () => setTimeout(() => share('contact'), 1200) },
  shelf: { after: () => setTimeout(() => share('shelf'), 600) }, desk: { after: () => setTimeout(() => share('mini:cookie'), 600) }, engine: { after: () => setTimeout(() => share('mini:outbound'), 600) },
  aarttsii: { after: () => setTimeout(() => share('mini:aarttsii'), 600) }, inkling: { after: () => setTimeout(() => share('mini:inkling'), 600) }, rag: { after: () => setTimeout(() => share('mini:recall'), 600) },
  wave: { mark: 'hello' }, dance: { act: 'dance' }, spin: { move: 'spin' }, sip: { act: 'sip' }, stretch: { act: 'stretch' }, cat: { act: 'pet_cat' } }
async function openAnswer(q) {
  emit({ type: 'glance' })
  // a real question gets an instant 'hmm' (cached voice, so it plays at once) while the answer is thought up and
  // voiced; not every time, never for a few words
  if (q.split(/\s+/).length >= 4 && Math.random() < .6) say(pick(['Hmm, good question.', 'Okay, so.', 'Right, so.', 'Oh, nice one.', 'Let me think.']))
  let r = null
  try {
    const res = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, mood: moodWords(), name: spokenName(get().name), recent: get().log.slice(-7, -1) }) })
    r = await res.json()
  } catch {}
  if (!r || !r.say) { await say(MISS[miss++ % MISS.length], { mark: 'shrug' }); chips(); return }
  if (r.cites?.length) set({ cites: { q, say: r.say, slips: r.cites, of: r.of }, revealOf: 'answer' })
  const d = DO[r.action] || {}
  if (d.move) move(d.move)
  const talking = say(r.say, { mark: d.mark || (d.act ? null : 'explain'), act: d.act || null })
  if (d.after) d.after()   // it comes up while he talks about it
  await talking
  const offered = r.offer === 'shelf' ? 'show_work' : r.offer
  if (offered && A[offered]) set({ offer: offered })   // he asked "want me to...?": a yes now does exactly that
  chips([...(r.next || []), ...(r.cites?.length ? ['How do you know?'] : [])]); if (!d.after && !r.offer) offerReading()
}

// a written answer's notes: the same search, no model, so "how do you know?" works after any of them
const INFO = new Set(['intro', 'show_work', 'mooney', 'desk', 'aarttsii', 'inkling', 'rag', 'engine', 'stream', 'why_hire', 'strengths', 'weakness', 'ai_use', 'stack', 'salary', 'contact', 'three_d', 'failure'])
function sourcesFor(q, said) {
  fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'sources', q: q || said, say: said }) })
    .then((r) => r.json()).then((r) => { if (r?.cites?.length) { set({ cites: { q: q || said, say: said, slips: r.cites, of: r.of }, revealOf: 'answer' }); if (!get().offer) chips(['How do you know?', ...get().chips]) } }).catch(() => {})
}
// "how do you know?": no psychic powers. after a looked-up answer he shares the notes it came from; after reading you,
// the notebook he kept on you
async function reveal() {
  const s = get()
  if (s.revealOf === 'reading' && s.reading) { await say("Psychics aren't real. I just take notes.", { mark: 'point_screen' }); share('notebook'); return }
  if (s.cites?.slips?.length) { await say(pick(['Not magic. I looked it up.', "I keep notes on myself. Here's what I pulled."]), { mark: 'point_screen' }); share('sources'); return }
  await say("That one I just know. Ask me something only my notes would know, then ask me that again.", { mark: 'shrug' }); chips()
}
// the cold read: what you did in the call goes to the model, nothing else; he says it like a mentalist, then offers to
// show how
let readingOffered = false
// only once you've really been in the call (his note: it tried to read him before he'd done anything): three real
// questions, two things done in his room, and a minute and a half in
const DID = /^(poke|took|gave|cat|monitor|phone|gesture|shuffle)/
function offerReading() {
  const s = get(), asks = s.notes.filter((n) => n.text.startsWith('asked') && n.text.split(' ').length >= 5).length
  const did = s.notes.filter((n) => DID.test(n.key || '')).reduce((k, n) => k + n.count, 0)
  if (readingOffered || s.reading || s.offer || s.share || asks < 3 || did < 2 || performance.now() - s.joinedAt < 90000) return
  readingOffered = true
  setTimeout(async () => { if (get().offer || get().share) return; await say("Can I try something? Don't tell me anything about yourself.", { mark: 'me' }); set({ offer: 'read' }); chips() }, 1600)
}
async function readYou() {
  const notes = get().notes.map((n) => ({ at: n.at, text: noteText(n) }))
  if (notes.length < 4) { await say('Give me a minute with you first. Poke around, ask me things.', { mark: 'shrug' }); chips(); return }
  readingOffered = true
  const asking = fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'read', notes, name: spokenName(get().name) }) }).then((r) => r.json()).catch(() => null)
  await say("Okay. Don't tell me anything.", { mark: 'me' })
  const r = await asking
  if (!r?.lines?.length) { await say("Huh. You're hard to read. I'll get you next time.", { mark: 'shrug' }); chips(); return }
  set({ reading: { ...r, notes }, revealOf: 'reading' })
  const marks = ['explain', 'point', 'me']
  for (const [i, l] of r.lines.entries()) await say(l.say, { mark: marks[i % 3] })
  if (r.guess) await say(r.guess + (r.tie ? ` ${r.tie}` : ''), { mark: 'point' })
  chips(['How did you know?'])
}
export async function play(id, q = '') {
  if (!id) { if (q) return openAnswer(q); await say(MISS[miss++ % MISS.length], { mark: 'shrug' }); chips(); return }
  const a = A[id]; asked.add(id)
  if (a.run) return a.run(q)
  if (a.move) move(a.move)
  if (INFO.has(id)) sourcesFor(q, a.say)
  // what he shows comes up while he talks about it (say() resolves when he's done), the chips once he's done
  const talking = say(tone() + a.say, { mark: a.mark || null, act: a.act || null })   // his mood colours the answer
  if (a.after) a.after()
  await talking
  set({ offer: a.offer || null })
  chips(a.next)
  if (!a.after && !a.offer) offerReading()
}
export function chips(next = []) {
  const done = (t) => { const id = ALL.find(([, a]) => a.seeds.includes(t.toLowerCase().replace(/[?]/g, '')))?.[0]; return id && id !== 'how' && asked.has(id) }   // "how do you know?" stays askable
  const pool = [...next, ...START, ...MORE].filter((t, i, all) => all.indexOf(t) === i && !done(t))
  const offer = get().offer, yes = OFFER_CHIP[offer] || 'Yes, show me'
  set({ chips: offer ? [yes, 'Not now', ...pool.slice(0, 2)] : pool.slice(0, 4) })
}
// what a yes to his offer says (never a bare "Yes" with no idea what it's to)
const OFFER_CHIP = { mooney: 'Show me Mooney', engine: 'Show me the engine', desk: 'Show me the desk', aarttsii: 'Show me the estimator', inkling: 'Show me Inkling', rag: 'Show me the search', show_work: 'Show me everything', contact: 'Share your contact', read: 'Go on, read me', cat: 'Pet the cat', dance: 'Dance!', spin: 'Spin!', wave: 'Wave', sip: 'Go on', stretch: 'Go on' }
// after a demo: he offers the next thing
export function offerNext(id, chip) { set({ offer: id }); chips([chip]) }
