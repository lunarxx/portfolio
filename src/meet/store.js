// the meeting's state, one place: what the screens draw from (React reads it with useMeet) and what the modules
// change (set). things that move every frame (mouth, mic level, doze) live in `live` and never re-render anything
import { useSyncExternalStore } from 'react'
import { CAST, DEFAULT_LOOK } from './engine/cast3d.js'

/** @type {Record<string, any>} */
let S = {
  phase: 'lobby',            // lobby | call
  name: '',
  look: { ...DEFAULT_LOOK, ...CAST.Rory },
  cam: false, camWaking: false, mic: false, listening: false, muted: false,
  log: [],                   // [{ who: 'him' | 'you', text }]
  chips: [], offer: null,
  share: null,               // null | 'mooney' | 'contact' | 'bye'
  myCap: '',                 // your last words, shown in your tile for a moment
  bubble: null,              // your character's speech bubble in the lobby: { text, id, small }
  heard: null,               // what he called out when he heard you in the lobby
  transcript: false,
  mine: null,                // what you took off his desk
  joinedAt: 0,
  gesture: null,             // the last gesture he saw: { name, label, id }
  pickHold: null,            // fingers held up toward a chip: { n, k 0..1 }
  pinch: null,               // your pinch as a cursor in his tile: { x, y } 0..1
  notes: [],                 // what he notices you do: [{ at, text, key, count }] (this tab only, gone when you leave)
  cites: null,               // what his last looked-up answer came from: { q, say, slips: [{ n, section, text }] }
  reading: null,             // his cold read of you: { lines: [{ say, note }], guess, tie, guessNotes }
}
const subs = new Set()
export const get = () => S
export function set(p) { S = { ...S, ...(typeof p === 'function' ? p(S) : p) }; subs.forEach((f) => f()) }
const sub = (f) => { subs.add(f); return () => subs.delete(f) }
/** @returns {Record<string, any>} */
export const useMeet = () => useSyncExternalStore(sub, get, get)

// he takes notes: what you chose and did, never how you look. a repeat counts up instead of a new line
export function note(text, key) {
  const sec = S.joinedAt ? Math.floor((performance.now() - S.joinedAt) / 1000) : -1
  const at = sec < 0 ? 'lobby' : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  set((s) => {
    const i = key ? s.notes.findIndex((n) => n.key === key) : -1
    if (i >= 0) { const notes = [...s.notes]; notes[i] = { ...notes[i], count: notes[i].count + 1 }; return { notes } }
    return { notes: [...s.notes, { at, text, key, count: 1 }].slice(-40) }
  })
}
export const noteText = (n) => (n.count > 1 ? `${n.text} (${n.count} times)` : n.text)

// your name as he says it out loud (shown as you typed it): stretched letters squashed ("ashhhh" is Ash), letters only,
// and never anything rude or unsayable, since he speaks it in a real voice ("ashhhh" came out as a swear). '' = he
// doesn't use a name
// strong words anywhere in it; mild ones only as the whole name (so Hassan, Cassie and Jassi stay names)
const RUDE = /(fuck|fuk|shit|cunt|nigg|bitch|slut|whore|faggot|porn|nazi|hitler|retard|wank|twat|pussy|asshole|penis|vagina|rapist)/i
const MILD = /^(ass|arse|cum|sex|sexy|hoe|tit|tits|anal|piss|crap|damn|dick|cock|boob|boobs|butt|poop|fag|rape|bastard)$/i
export function spokenName(raw = '') {
  const n = raw.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/(.)\1{2,}/gi, '$1').replace(/h{2,}\b/gi, 'h').replace(/[^a-z' -]/gi, ' ').replace(/\s+/g, ' ').trim()
  const first = n.split(' ')[0] || ''
  if (first.length < 2 || first.length > 16 || !/[aeiouy]/i.test(first) || RUDE.test(n.replace(/[^a-z]/gi, '')) || MILD.test(first)) return ''
  return first[0].toUpperCase() + first.slice(1).toLowerCase()
}

export const live = { talkUntil: 0, micLevel: 0, dozy: 0, lastAction: 0, lastSaid: 0, lean: 0, pinchSeen: 0 }
