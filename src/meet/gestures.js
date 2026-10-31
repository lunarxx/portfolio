// talking with your body, kept to a few you can't do by accident (his call: more was "way too sensitive... a whole
// learning process"): a nod or thumbs up is yes and a head shake is no, only when he's just asked you something; a
// real wave gets a wave back; heart hands get hearts. and silently, he smiles when you smile, laughs when you laugh,
// and his camera leans in when you do. every one is held or repeated before it counts, and has a cooldown
import { get, set, live, note } from './store.js'
import { say, fx, pick } from './show.js'
import { ask } from './brain.js'
import { pacify } from './behaviour.js'

// ---------------------------------------------------------------- reading a hand (21 points, mirrored, image space)
const D = (a, b, k = 1) => Math.hypot((a.x - b.x) * k, a.y - b.y)
function readHand(lm, aspect) {
  const d = (i, j) => D(lm[i], lm[j], aspect), palm = d(0, 9) || 1e-3
  const up = (tip, pip) => d(tip, 0) > d(pip, 0) * 1.12                     // a finger is out when its tip is past its middle joint
  const f = [up(8, 6), up(12, 10), up(16, 14), up(20, 18)]
  const thumbOut = d(4, 5) > palm * .55 && d(4, 17) > palm * .95
  const n = f.filter(Boolean).length, curled = n === 0, tucked = d(4, 9) < palm * .45   // the thumb folded into the palm, as when you count
  const pinch = d(4, 8) < palm * .3
  const c = { x: (lm[0].x + lm[9].x) / 2, y: (lm[0].y + lm[9].y) / 2 }
  let shape = 'other'
  if (curled && thumbOut && lm[4].y < lm[3].y && lm[4].y < lm[5].y - palm * .25) shape = 'thumbsup'
  else if (curled && thumbOut && lm[4].y > lm[3].y && lm[4].y > lm[17].y + palm * .2) shape = 'thumbsdown'
  else if (pinch && f[1] && f[2] && f[3]) shape = 'ok'
  else if (pinch && !f[1]) shape = 'pinch'
  else if (curled) shape = 'fist'
  else if (n === 4 && !tucked) shape = 'open'   // (four up with the thumb loose is an open hand, not a four: measured on his takes)
  else if (f[0] && !f[1] && !f[2] && f[3]) shape = 'rock'
  else if (f[0] && !f[1] && !f[2] && !f[3]) shape = 'one'
  else if (f[0] && f[1] && !f[2] && !f[3]) shape = 'two'
  else if (f[0] && f[1] && f[2] && !f[3]) shape = 'three'
  else if (n === 4) shape = 'four'
  return { lm, shape, palm, c, tucked, pinchAt: { x: (lm[4].x + lm[8].x) / 2, y: (lm[4].y + lm[8].y) / 2 } }
}
const COUNT = { one: 1, two: 2, three: 3, four: 4 }

// ---------------------------------------------------------------- what counts, and what he does
const cool = {}, held = {}, hist = { pitch: [], yaw: [], wave: [] }
let gid = 0
const now = () => performance.now()
function fire(name, label, fn, cd = 3000) {
  const t = now(); if ((cool[name] || 0) > t) return false
  cool[name] = t + cd; set({ gesture: { name, label, id: ++gid, at: t } })
  const said = { wave: 'waved at me', heart: 'made a heart with their hands', thumbsup: 'gave me a thumbs up', nod: 'nodded', shake: 'shook their head', in: 'joined with a thumbs up' }[name]; if (said) note(said, `gesture:${name}`)   // deliberate gestures only: never a smile or a laugh
  fn(); return true
}
// a shape held this long (ms), continuously
function hold(name, on, ms) { const t = now(); if (!on) { held[name] = 0; return false } if (!held[name]) held[name] = t; return t - held[name] >= ms }
// back and forth (a nod, a head shake, a waving hand): how many times it turned, in the last `win` ms
function swings(arr, v, amp, t, win = 1300) {
  arr.push([t, v]); while (arr.length && arr[0][0] < t - win) arr.shift()
  let turns = 0, dir = 0, last = arr[0]?.[1] ?? v
  for (const [, x] of arr) { const dx = x - last; if (Math.abs(dx) > amp) { const s = Math.sign(dx); if (dir && s !== dir) turns++; dir = s; last = x } }
  return turns
}
const face = (mood, dur = 1.6) => fx({ kind: 'face', a: { mood }, dur })
const asked = () => get().phase === 'call' && !!get().offer   // he's waiting on a yes or a no

export function feed({ pose, faceSeen, hands, faceLm, aspect }) {
  const t = now()
  if (!get().cam) return
  const H = (hands || []).map((h) => readHand(h.lm, aspect)), fl = faceLm
  const chin = fl ? fl[152] : null, fw = fl ? D(fl[234], fl[454], aspect) : .2
  const aboveShoulder = (h) => !chin || h.c.y < chin.y + fw * .6
  // nod and shake: yes and no to his question; otherwise he nods along, or looks puzzled
  let nod = 0, shake = 0
  if (pose && faceSeen) {
    nod = swings(hist.pitch, pose.pitch, .05, t); shake = swings(hist.yaw, pose.yaw, .09, t)
    if (nod >= 2 && shake === 0) { hist.pitch.length = 0; fire('nod', asked() ? 'nod · yes' : 'nod', () => asked() ? ask('yes') : fx({ kind: 'arm', a: { name: 'nod' }, dur: 1.2 }), 2500) }
    else if (shake >= 2 && nod === 0) { hist.yaw.length = 0; fire('shake', asked() ? 'shake · no' : 'shake', () => asked() ? ask('no') : (face('look'), fx({ kind: 'tv', a: { text: '?' }, dur: 1.4 })), 2500) }
  }
  // the hands, checked together: any hand making a shape counts (one hand doing nothing never resets the other)
  const thumbs = H.find((h) => h.shape === 'thumbsup')
  if (hold('thumbsup', !!thumbs, 500)) {
    if (get().phase === 'lobby') fire('in', 'thumbs up', () => window.__meetJoin && window.__meetJoin(), 3000)
    else fire('thumbsup', asked() ? 'thumbs up · yes' : 'thumbs up', () => asked() ? ask('yes') : (fx({ kind: 'arm', a: { name: 'thumbs_up' }, dur: 1.6 }), face('happy'), (() => { const l = pacify('thumbs'); if (l) say(l, { mark: 'thumbs_up' }) })()), 2500)
  }
  const waver = H.find((h) => h.shape === 'open' && aboveShoulder(h))
  if (waver) { if (swings(hist.wave, waver.c.x, waver.palm * .55, t, 1500) >= 2) { hist.wave.length = 0; fire('wave', 'wave', () => say(get().phase === 'lobby' ? 'Oh hey! Come on in.' : pick(['Hi again!', 'Hey hey.']), { mark: 'hello' }), 6000) } }
  else hist.wave.length = 0
  // heart hands: thumb tips together, index tips together, index above thumb, held
  const heart = H.length === 2 && D(H[0].lm[4], H[1].lm[4], aspect) < H[0].palm * .55 && D(H[0].lm[8], H[1].lm[8], aspect) < H[0].palm * .55 && H[0].lm[8].y < H[0].lm[4].y
  if (hold('heart', heart, 500)) fire('heart', 'heart', () => { fx({ kind: 'particles', a: { kind: 'hearts', anchor: 'head', n: 18 }, dur: 2 }); fx({ kind: 'tv', a: { text: '<3' }, dur: 2 }); face('happy', 2); const l = pacify('heart'); if (l) say(l, { mark: 'me' }) }, 8000)
  // silently: your smile and laugh on his face, and his camera leaning in with you
  if (pose && faceSeen) {
    const laughing = (pose.smile || 0) > .55 && (pose.jaw || 0) > .3
    if (hold('laugh', laughing, 400)) fire('laugh', '', () => face('laugh', 2), 6000)
    else if (hold('smile', (pose.smile || 0) > .6 && !laughing, 900)) fire('smile', '', () => face('happy', 2.2), 7000)
    live.lean = Math.max(0, Math.min(1, ((pose.z || 1) - 1.06) / .14))
  }
  // what it sees, for /meet?debug
  if (debug) set({ debugSees: `${faceSeen ? 'face' : 'no face'} · nod ${nod} shake ${shake} · hands: ${H.map((h) => h.shape + (aboveShoulder(h) ? '↑' : '↓')).join(', ') || 'none'}${asked() ? ' · he asked' : ''}` })
}
const debug = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug')
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') window.__meetGest = { feed, set, get }   // dev only: replaying a take through the gestures
