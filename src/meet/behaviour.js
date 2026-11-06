// how he takes being poked at, like a person: he remembers what you touched and how often, gets annoyed (more for a
// boop on the head, his coffee gone, his monitor knocked over), forgives you (sorry, the coffee back, heart hands, or
// time), and talks in three tones as it builds: friendly, irritated, grumpy. at his limit he stops, sips, breathes.
// his mood also colours his answers (and goes to the model with every question)
import { get, set, note, noteText } from './store.js'
import { say, fx, pick } from './show.js'

// annoy is the flare-up (fades when you stop); grudge is what he holds against you for the rest of the call (fades slowly,
// an apology or the coffee back buys most of it). his tone follows whichever is higher
export const mood = { annoy: 0, grudge: 0, warmth: .5, last: 0, peak: 0, hist: [], cooldown: 0 }
const now = () => performance.now()
const level = () => Math.max(mood.annoy, mood.grudge)
// how much each kind of poke gets on his nerves
const WEIGHT = { head: .16, him: .12, monitor: .3, mug: .18, can: .14, cat: .02, phone: .04, none: .02, default: .06 }
const tier = () => (level() < .3 ? 0 : level() < .62 ? 1 : 2)
export const moodTier = tier
// a line for the thing, in his current tone; repeats of the same thing get their own lines
const LINES = {
  head: [['Hey.', 'Ow.', 'Is that part of the interview?', 'Boop received.'], ['Okay, I felt that.', 'You do this to every candidate?', 'My head is not a button.'], ['Stop.', 'Seriously.', '...']],
  him: [['Personal space, please.', 'Hi?', 'Yes, I am real.'], ['Can you not.', 'That tickles. Stop.'], ['Hands off.', 'No.']],
  cat: [['She likes you.', 'Careful, she bites.', 'Now she will never leave.'], ['At least someone here is nice to her.', 'She approves of you. I am reserving judgement.'], ['Pet her, not me. Good.']],
  monitor: [['Oh no.'], ['Again?!'], ['I am gluing it down.']],
  mug: [["That's my coffee.", 'I was drinking that.', 'Bold move.'], ['My coffee. Really.', 'I need that to function.'], ['Give it back.']],
  can: [["That's my energy drink.", 'You need that more than me?'], ['That was my last one.'], ['...wow.']],
  lamp: [['Hey, I need that.'], ['Lights on, please.'], ['Great. Now I cannot see.']],
  pendant: [['Who turned off the lights?'], ['Very funny.'], ['...']],
  default: [['Hm?', "What's that?", 'Lost something?', 'Careful with that.'], ['Can you stop touching my stuff?', 'That stays there.'], ['Please. Stop.', 'Hands. Off. My. Stuff.']],
}
const REPEAT = {
  head: ['Again?', 'Still my head.', 'That is three.'], him: ['Still here.', 'Yes. Still me.'], lamp: ['Again with the lamp?', 'On, off, on, off.'],
  default: ['Again?', 'Same thing, again.', 'You really like that one.'],
}

// you poked something: what he says, or null when he's holding his tongue (he doesn't narrate every single tap)
export function poked(kind, name) {
  const t = now(); decay(t)
  const key = LINES[kind] ? kind : LINES[name] ? name : 'default'
  mood.hist.push({ t, kind, name }); mood.hist = mood.hist.filter((h) => t - h.t < 30000)
  const patience = t < mood.cooldown ? .5 : 1   // just after he's calmed himself down, things bother him half as much
  const hit = (WEIGHT[kind] ?? WEIGHT.default) * patience
  mood.annoy = Math.min(1, mood.annoy + hit); mood.grudge = Math.min(1, mood.grudge + hit * .5); mood.peak = Math.max(mood.peak, level()); mood.last = t
  set({ mood: tier() })
  const recent = mood.hist.filter((h) => t - h.t < 12000), same = recent.filter((h) => (h.name || h.kind) === (name || kind)).length
  // his limit: he stops, sips, breathes, and comes back calmer
  if (mood.annoy >= .9 && t > mood.cooldown) {
    mood.cooldown = t + 20000; mood.annoy = .2; set({ mood: tier() })
    fx({ kind: 'sound', a: { sfx: 'deepbreath' } }); fx({ kind: 'face', a: { mood: 'angry' }, dur: 1.4 })
    return { line: 'Give me a second.', act: 'sip', always: true }
  }
  // combos: you touring the room, coffee then me, the monitor twice
  const kinds = new Set(recent.map((h) => h.name || h.kind))
  if (kinds.size >= 4 && !recent.some((h) => h.toured)) { mood.hist[mood.hist.length - 1].toured = true; return { line: "Touring my room, huh? The good stuff's on the shelf.", mark: 'present' } }
  if ((kind === 'head' || kind === 'him') && mood.hist.some((h) => (h.kind === 'mug' || h.kind === 'can') && t - h.t < 20000)) return { line: 'First my coffee, now me?', mark: 'hands_head', face: 'angry' }
  if (kind === 'monitor') { const n = mood.hist.filter((h) => h.kind === 'monitor').length; return { line: LINES.monitor[Math.min(2, n - 1)][0], mark: 'hands_head', always: true } }
  if (same >= 3 && Math.random() < .7) return { line: pick(REPEAT[key] || REPEAT.default), mark: 'shrug', face: tier() ? 'angry' : 'look' }
  // most taps get a line; grumpy, he sometimes just glares
  if (tier() === 2 && Math.random() < .4) return { line: null, face: 'angry' }
  return { line: pick(LINES[key][tier()]), mark: tier() ? 'deadpan' : 'shrug', face: tier() === 2 ? 'angry' : tier() === 1 ? 'look' : null }
}
// you made up for it: sorry, the coffee back, heart hands, a thumbs up while he's sore
export function pacify(how) {
  decay(now()); if (how === 'sorry') note('said sorry', 'sorry')
  if (level() < .25) return null
  const by = how === 'sorry' ? .5 : how === 'gift' ? .35 : .3
  mood.annoy = Math.max(0, mood.annoy - by); mood.grudge = Math.max(0, mood.grudge - by * .8); set({ mood: tier() })
  fx({ kind: 'face', a: { mood: 'happy' }, dur: 1.6 })
  return pick(how === 'gift' ? ['Thank you.', 'Finally. Thank you.'] : ['Okay. We are good.', 'Fine. Forgiven.', 'Apology accepted.'])
}
// what you said to him: the model reads each message and says how it treated him ('rude' | 'kind' | 'neutral'), in any
// language and any wording, so there's no list of bad words here to get around
export function felt(how) {
  if (how === 'rude') { mood.annoy = Math.min(1, mood.annoy + .35); mood.grudge = Math.min(1, mood.grudge + .35); mood.peak = Math.max(mood.peak, level()); mood.last = now(); note('said something rude to me', 'rude'); fx({ kind: 'face', a: { mood: 'angry' }, dur: 2 }) }
  else if (how === 'kind') { mood.annoy = Math.max(0, mood.annoy - .2); mood.grudge = Math.max(0, mood.grudge - .15) }
  set({ mood: tier() })
}
// what he's holding on to, for the model: only what you did to him and his things, this call
const DID = /^(poke|took|gave|cat|monitor|phone|rude|sorry)/
export const happened = () => {
  const s = get(), done = s.notes.filter((n) => DID.test(n.key || '')).slice(-8).map(noteText)
  if (s.mine) done.push(`still has my ${s.mine} and hasn't given it back`)
  return done
}
// time heals: the flare-up fades after a while of being left alone; the grudge slowly; from a real sulk he says so
function decay(t) {
  if (!mood.last) return
  const quiet = (t - mood.last) / 1000
  if (quiet > 5) mood.annoy = Math.max(0, mood.annoy - .025 * (quiet - 5)), mood.last = t - 5000
}
let overSaid = 0
setInterval(() => {
  const t = now(); decay(t); mood.grudge = Math.max(0, mood.grudge - .006); set({ mood: tier() })
  if (mood.peak > .6 && level() < .15 && t - overSaid > 60000) { overSaid = t; mood.peak = 0; say("Okay, I'm over it.", { mark: 'shrug' }) }
}, 2000)
// his answers, in his mood: a curt start when he's sore
export const tone = () => (tier() === 2 ? pick(['Fine. ', 'Okay. ', '']) : tier() === 1 ? pick(['', 'Right. ', '']) : '')
// you asked him something: back to the interview, he lets it go a little
export function talkedTo() { decay(now()); mood.annoy = Math.max(0, mood.annoy - .05); set({ mood: tier() }) }
// for the model's prompt: the attitude, never the words
export const moodWords = () => ['relaxed, warm, a little dry', 'irritated by how this visitor is behaving: shorter than usual, drier, less patient, no warmth to spare', 'properly fed up with this visitor: clipped and cold, as few words as will answer it, unimpressed and not hiding it'][tier()]
