// how he takes being poked at, like a person: he remembers what you touched and how often, gets annoyed (more for a
// boop on the head, his coffee gone, his monitor knocked over), forgives you (sorry, the coffee back, heart hands, or
// time), and talks in three tones as it builds: friendly, irritated, grumpy. at his limit he stops, sips, breathes.
// his mood also colours his answers (and goes to the model with every question)
import { set, note } from './store.js'
import { say, fx, pick } from './show.js'

export const mood = { annoy: 0, warmth: .5, last: 0, peak: 0, hist: [], cooldown: 0 }
const now = () => performance.now()
// how much each kind of poke gets on his nerves
const WEIGHT = { head: .16, him: .12, monitor: .3, mug: .18, can: .14, cat: .02, phone: .04, none: .02, default: .06 }
const tier = () => (mood.annoy < .35 ? 0 : mood.annoy < .7 ? 1 : 2)
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
  mood.annoy = Math.min(1, mood.annoy + (WEIGHT[kind] ?? WEIGHT.default) * patience); mood.peak = Math.max(mood.peak, mood.annoy); mood.last = t
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
  if (mood.annoy < .25) return null
  mood.annoy = Math.max(0, mood.annoy - (how === 'sorry' ? .5 : how === 'gift' ? .35 : .3)); set({ mood: tier() })
  fx({ kind: 'face', a: { mood: 'happy' }, dur: 1.6 })
  return pick(how === 'gift' ? ['Thank you.', 'Finally. Thank you.'] : ['Okay. We are good.', 'Fine. Forgiven.', 'Apology accepted.'])
}
// time heals: annoyance fades once you leave him alone a few seconds; from a real sulk he says so
function decay(t) {
  if (!mood.last) return
  const quiet = (t - mood.last) / 1000
  if (quiet > 2) mood.annoy = Math.max(0, mood.annoy - .06 * (quiet - 2)), mood.last = t - 2000
}
let overSaid = 0
setInterval(() => {
  const t = now(); decay(t); set({ mood: tier() })
  if (mood.peak > .6 && mood.annoy < .15 && t - overSaid > 60000) { overSaid = t; mood.peak = 0; say("Okay, I'm over it.", { mark: 'shrug' }) }
}, 2000)
// his answers, in his mood: a curt start when he's sore
export const tone = () => (tier() === 2 ? pick(['Fine. ', 'Okay. ', '']) : tier() === 1 ? pick(['', 'Right. ', '']) : '')
// you asked him something: back to the interview, he lets it go a little
export function talkedTo() { decay(now()); mood.annoy = Math.max(0, mood.annoy - .15); set({ mood: tier() }) }
// for the model's prompt
export const moodWords = () => ['relaxed and friendly', 'a bit irritated (the visitor has been poking his stuff)', 'grumpy (the visitor keeps poking him), curt but still answers'][tier()]
