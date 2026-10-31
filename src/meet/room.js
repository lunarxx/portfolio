// his room, in the call: the camera across his desk, his phone running mooney, and everything in his tile you can
// poke (him, his mug and can to steal, his phone, the cat, the lamps as real switches, the record player...)
import * as THREE from 'three'
import { get, set, live, note } from './store.js'
import { say, stage, emit, fx, pick } from './show.js'
import { play } from './brain.js'
import { poked, pacify } from './behaviour.js'

// ---------------------------------------------------------------- the camera: across the desk, like a call
// a little high and to the side, so his face, his mug and the cat are all in reach. W while he stands (it crops his
// head otherwise), the cat's close-up while he pets her, the desk while you're still in the lobby
function meetingCam(s) {
  const d = Math.PI / 180, el = 34 * d, az = 10 * d
  s.CAMS.M = s.ortho(.64, new THREE.Vector3(.04, 1.1, .3), new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)), [0, 2, 3, 4, 6, 7])
}
function shots() {
  const s = stage()
  if (s && s.CAMS) {
    if (!s.CAMS.M) meetingCam(s)
    const st = s.state, act = st.act && st.act.name
    st.camHold = get().phase === 'lobby' ? 'A' : st.move ? 'W' : act === 'pet_cat' ? 'K' : 'M'
    const z = 1 + (live.lean || 0) * .28; if (Math.abs(s.CAMS.M.zoom - z) > .002) { s.CAMS.M.zoom += (z - s.CAMS.M.zoom) * .08; s.CAMS.M.updateProjectionMatrix() }   // you lean in, his camera pushes in
  }
  requestAnimationFrame(shots)
}
// his phone runs mooney: the screen in his hand is the app's paper, a receipt and the mic
function paintPhone() {
  const p = stage()?.props?.phone; if (!p) return setTimeout(paintPhone, 300)
  p.traverse((m) => {
    if (!m.material?.map?.image || m.material.map.image.width !== 15) return
    const g = m.material.map.image.getContext('2d')
    g.fillStyle = '#F2EFE7'; g.fillRect(0, 0, 15, 30); g.fillStyle = '#1A1A1A'; g.fillRect(2, 3, 6, 2); g.fillStyle = '#FFFFFF'; g.fillRect(1, 7, 13, 15)
    for (const [y, c, w] of [[9, '#D4622A', 7], [13, '#3A6F9F', 5], [17, '#D4622A', 8]]) { g.fillStyle = c; g.fillRect(2, y, 1, 3); g.fillStyle = '#5A5650'; g.fillRect(4, y, w, 1); g.fillStyle = '#C4C0B8'; g.fillRect(4, y + 2, 3, 1) }
    g.fillStyle = '#B85F3A'; g.fillRect(10, 25, 3, 3); g.fillStyle = '#FFFFFF'; g.fillRect(2, 25, 7, 3)
    m.material.map.needsUpdate = true
  })
}
// in the call a while with the camera still off, he mentions it once, only in a real lull (never over an answer)
let camNudged = false
function lull() {
  const s = get(), now = performance.now()
  if (camNudged || s.cam || s.phase !== 'call' || now - s.joinedAt < 40000 || stage()?.state?.line || now - live.lastSaid < 8000) return
  camNudged = true; say('You can turn your camera on, by the way. Your character copies you. I never see your face.', { mark: 'point' })
}
let started = false
export function start() { if (started) return; started = true; requestAnimationFrame(shots); paintPhone(); setInterval(lull, 2000) }

// ---------------------------------------------------------------- poking around his tile
let pokes = 0, saidAt = 0
const talk = (line, mark = 'shrug', always = false) => { const now = performance.now(); if (!always && now - saidAt < 1300) return; saidAt = now; say(line, { mark }) }
function respond(kind, name) {
  const r = poked(kind, name); if (!r) return
  if (r.face) fx({ kind: 'face', a: { mood: r.face }, dur: 1.5 })
  if (r.act) { saidAt = performance.now(); say(r.line, { act: r.act }); return }
  if (r.line) talk(r.line, r.mark || 'shrug', !!r.always)
}
// a real switch on his lights: off, then back on. returns whether it's on now
function lightSwitch(name) { const L = stage()?.lights?.[name]; if (!L) return true; L.userData.off = !L.userData.off; return !L.userData.off }
// the things in his room: where they stand (room.js), what poking each does; what he says goes through his mood
const SPOTS = [
  { name: 'record player', at: [-.43, .69, -1.67], tap: () => { stage()?.sound.skip(); talk(pick(['Next one.', 'Good pick.', 'Ooh, this one.']), 'thumbs_up') } },
  { name: 'records', at: [.07, .75, -1.66], tap: () => { stage()?.sound.skip(); talk('Pick anything.', 'present') } },
  { name: 'salt lamp', at: [.37, .78, -1.69], tap: () => { fx({ kind: 'light', a: { color: 'amber', strength: 1.2, where: 'room' }, dur: 1.2 }); respond('lamp', 'salt lamp') } },
  { name: 'desk lamp', at: [.62, 1.14, .84], tap: () => { const on = lightSwitch('lamp'); fx({ kind: 'sound', a: { sfx: 'blip' } }); if (on) talk(pacify('gift') || 'Thank you.', 'thumbs_up', true); else respond('lamp', 'desk lamp') } },
  { name: 'pendant light', at: [-.1, 2.25, .1], tap: () => { const on = lightSwitch('pendant'); fx({ kind: 'sound', a: { sfx: 'blip' } }); if (on) talk('Better.', 'shrug', true); else respond('pendant', 'pendant light') } },
  { name: 'his pc', at: [1.0, 1.0, .72], tap: () => respond('pc', 'his pc') },
  { name: 'bookcase', at: [-1.3, 1.2, -1.7], tap: () => respond('books', 'bookcase') },
  { name: 'the print', at: [-.68, 1.52, -1.88], tap: () => respond('print', 'the print') },
  { name: 'the window', at: [.72, 1.58, -1.89], tap: () => respond('window', 'the window') },
  { name: 'guitar', at: [1.05, .6, -1.72], tap: () => respond('guitar', 'guitar') },
  { name: 'clock', at: [.2, 2.4, -1.87], tap: () => respond('clock', 'clock') },
  { name: 'notebook', at: [-.72, .78, .52], tap: () => respond('notebook', 'notebook') },
  { name: 'webcam', at: [.12, 1.52, .99], tap: () => respond('webcam', 'webcam') },
]
const NAMES = { monitor: 'his monitor', head: 'Ashwini', him: 'Ashwini', mug: 'his coffee', can: 'his energy drink', phone: 'his phone', cat: 'the cat' }
// his 16:9 picture covers the tile (w x h): where it lands
const fit = (w, h) => { const k = Math.max(w / 16, h / 9), pw = 16 * k, ph = 9 * k; return { pw, ph, ox: (pw - w) / 2, oy: (ph - h) / 2 } }
const camNow = () => { const s = stage(); return s && s.CAMS[s.state.camHold || 'A'] }
// what's under a point in his tile: him, his things, the cat (a ray into his room), else the nearest spot
export function under(x, y, w, h) {
  const s = stage(), c = camNow(); if (!s || !c) return null
  const F = fit(w, h), toTile = (v) => { const p = v.clone().project(c); return [(p.x + 1) / 2 * F.pw - F.ox, (1 - p.y) / 2 * F.ph - F.oy] }
  const ray = new THREE.Raycaster(); ray.layers.mask = c.layers.mask
  ray.setFromCamera(new THREE.Vector2((x + F.ox) / F.pw * 2 - 1, -((y + F.oy) / F.ph * 2 - 1)), c)
  const owner = (o) => { for (let n = o; n; n = n.parent) { if (n === s.O.head) return 'head'; if (n === s.O.root) return 'him'; if (n === s.props.monitorRig) return 'monitor'; for (const k of ['mug', 'can', 'phone']) if (n === s.props[k]) return k; if (s.cat && n === s.cat.root) return 'cat' } return null }
  let solid = 0, first = null
  for (const hit of ray.intersectObject(s.O.root.parent, true)) {   // past the see-through glows and light pools, the first solid things
    const mt = hit.object.material; if (!hit.object.visible || (mt && (mt.transparent || mt.depthWrite === false))) continue
    first = first || hit.object
    const k = owner(hit.object); if (k) return { kind: k, name: NAMES[k] }; if (++solid >= 2) break
  }
  if (first && owner(first) === 'monitor') return { kind: 'monitor', name: NAMES.monitor }
  const r = F.ph / 690   // small things are hard to hit exactly: near enough on screen counts
  for (const [k, o, up, rad] of [['mug', s.props.mug, .05, 46], ['can', s.props.can, .06, 40], ['phone', s.props.phone, 0, 40], ['cat', s.cat && s.cat.head, 0, 50]]) {
    if (!o || !o.visible) continue; const [px, py] = toTile(o.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, up, 0)))
    if (Math.hypot(px - x, py - y) < rad * r) return { kind: k, name: NAMES[k] }
  }
  let best = null, bd = 60 * r
  for (const sp of SPOTS) { const [px, py] = toTile(new THREE.Vector3(...sp.at)), d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = sp } }
  return best ? { kind: 'spot', spot: best, name: best.name, obj: first } : { kind: 'none', name: '', obj: first }
}
export function tap(x, y, w, h) {
  const u = under(x, y, w, h); if (!u) return
  const s = stage()
  if (u.kind === 'head' || u.kind === 'him') {
    pokes++; note(u.kind === 'head' ? 'poked me on the head' : 'poked me', u.kind === 'head' ? 'poke:head' : 'poke:me')
    fx({ kind: 'shake', a: { amount: .45 }, dur: .25 }); fx({ kind: 'sound', a: { sfx: 'pop' } }); fx({ kind: 'face', a: { mood: 'surprised' }, dur: 1.1 })
    respond(u.kind, u.kind === 'head' ? 'his head' : 'him')
  } else if (u.kind === 'mug' || u.kind === 'can') {
    if (get().mine) return
    s.props[u.kind].visible = false; set({ mine: u.kind }); note(`took my ${u.kind === 'mug' ? 'coffee mug' : 'drink can'} off the desk`, `took:${u.kind}`)
    fx({ kind: 'sound', a: { sfx: 'blip' } }); fx({ kind: 'face', a: { mood: 'surprised' }, dur: 1.4 })
    setTimeout(() => respond(u.kind, u.kind), 300)
  } else if (u.kind === 'monitor') knockMonitor()
  else if (u.kind === 'phone') { note('tapped my phone', 'phone'); if (!get().share) play('mooney') }
  else if (u.kind === 'cat') { note('petted the cat', 'cat'); fx({ kind: 'particles', a: { kind: 'hearts', anchor: 'cat', n: 10 }, dur: 1.6 }); respond('cat', 'the cat') }
  else if (u.kind === 'spot') { if (u.spot.name !== 'his monitor') { wobble(u.obj); note(`poked my ${u.spot.name}`, `poke:${u.spot.name}`) } u.spot.tap() }
  else { wobble(u.obj); emit({ type: 'glance' }); if (Math.random() < .4) respond('none', 'something') }
}
// a poked thing wobbles: the thing itself (its own group, not the shelf or desk it sits on) shakes and settles
const wobbling = new Set()
function wobble(o) {
  if (!o) return
  // up to the thing you poked (a mug's handle is part of the mug), but never past something bigger than a small object
  const size = (x) => { const v = new THREE.Box3().setFromObject(x).getSize(new THREE.Vector3()); return Math.max(v.x, v.y, v.z) }
  if (size(o) > .55) return                                                 // walls, the desk, the floor: nothing to wobble
  for (let k = 0; k < 3 && o.parent && size(o.parent) <= .55; k++) o = o.parent
  if (wobbling.has(o)) return; wobbling.add(o)
  const r0 = o.rotation.clone(), p0 = o.position.clone(), t0 = performance.now()
  ;(function step() {
    const u = (performance.now() - t0) / 520, k = Math.max(0, 1 - u)
    o.rotation.z = r0.z + Math.sin(u * 30) * .06 * k; o.rotation.x = r0.x + Math.sin(u * 24 + 1) * .025 * k; o.position.y = p0.y + Math.abs(Math.sin(u * 15)) * .006 * k
    if (u < 1) requestAnimationFrame(step); else { o.rotation.copy(r0); o.position.copy(p0); wobbling.delete(o) }
  })()
}
// his monitor tips over onto the desk, thud. a beat, then he reaches over and stands it back up
let knocked = false
function knockMonitor() {
  const m = stage()?.props?.monitorRig; if (!m || knocked) return
  knocked = true; note('knocked my monitor over', 'monitor')
  const x0 = m.rotation.x, y0 = m.position.y, t0 = performance.now(), ease = (u) => u * u * (3 - 2 * u)
  const fall = (u) => ease(Math.min(1, u)) ** 1.6 * 1.32                 // tips back, faster as it goes, flat on the desk
  ;(function down() {
    const u = (performance.now() - t0) / 420
    m.rotation.x = x0 + fall(u); m.position.y = y0 - Math.min(1, u) * .2
    if (u < 1) return requestAnimationFrame(down)
    fx({ kind: 'sound', a: { sfx: 'thud' } }); fx({ kind: 'shake', a: { amount: 1 }, dur: .35 }); fx({ kind: 'face', a: { mood: 'surprised' }, dur: 1.6 })
    respond('monitor', 'his monitor')
    setTimeout(() => pickUp(m, x0, y0), 1500)
  })()
}

// he reaches over, both hands on the monitor's top edge, and stands it back up with it in his hands
async function pickUp(m, x0, y0) {
  const st = stage(); if (!st) return
  const { setArm } = await import('./engine/octyn.js')   // the rig's arm, loaded here (a top-level import ran the engine before its canvas existed)
  const { O, state } = st, ease = (u) => u * u * (3 - 2 * u), t0 = performance.now()
  const from = { R: O.arms.R.hand.getWorldPosition(new THREE.Vector3()), L: O.arms.L.hand.getWorldPosition(new THREE.Vector3()) }
  // it fell away from him, so its top edge is out of reach: he leans in and takes it by both sides, halfway up, and his
  // hands stay on those sides (they're points on the monitor) as he stands it back up
  const side = (s) => O.root.worldToLocal(m.localToWorld(new THREE.Vector3(s === 'R' ? .25 : -.25, .09, 0)))
  const toRoot = (v) => O.root.worldToLocal(v.clone())
  const GRIP = [[.95, 1, 1.05, 1.1], [.45, .75]]                                 // fingers curled round the edge
  let base = null
  state.afterPose = () => {
    const u = (performance.now() - t0) / 1000                                   // 0-.6 lean and reach, .6-1.6 lift, 1.6-2 let go
    const lift = ease(Math.min(1, Math.max(0, (u - .6) / 1)))
    m.rotation.x = x0 + 1.32 * (1 - lift); m.position.y = y0 - .2 * (1 - lift)
    const k = u < .6 ? ease(u / .6) : u < 1.6 ? 1 : 1 - ease(Math.min(1, (u - 1.6) / .4))
    if (k <= 0 && u > 1.6) { state.afterPose = null; m.rotation.x = x0; m.position.y = y0; knocked = false; say("Got it. Please don't.", { mark: 'deadpan' }); return }
    // the lean: most of it while the monitor is down, easing off as it comes up with him. his body is posed on twos
    // and this runs every frame, so the lean goes on top of the pose the body last made, never on top of itself
    const lean = k * (.26 - .14 * lift), T = O.torso, H = O.head
    if (!base || T.rotation.x !== base.wrote[0] || T.position.z !== base.wrote[1] || H.position.z !== base.wrote[2])
      base = { rx: T.rotation.x, ty: T.position.y, tz: T.position.z, hy: H.position.y, hz: H.position.z }
    T.rotation.x = base.rx + lean * .7; T.position.z = base.tz + lean * .35; T.position.y = base.ty - lean * .05
    H.position.z = base.hz + lean * .45; H.position.y = base.hy - lean * .1
    base.wrote = [T.rotation.x, T.position.z, H.position.z]
    const tq = O.torso.quaternion
    for (const s of ['R', 'L']) {
      const S = new THREE.Vector3((s === 'R' ? -1 : 1) * O.shoulderW, .06, 0).applyQuaternion(tq).add(O.torso.position)
      const hand = O.root.worldToLocal(O.arms[s].hand.getWorldPosition(new THREE.Vector3())), T = (u < .6 ? toRoot(from[s]) : hand).lerp(side(s), k)
      setArm(O, s, S, T, k > .7 ? GRIP : 'relaxed', new THREE.Vector3(s === 'R' ? -1 : 1, .25, 0).normalize())   // backs of the hands face out: palms on the sides
    }
  }
}

// what you took, back where it was
export function giveBack() {
  const m = get().mine; if (!m) return
  stage().props[m].visible = true; set({ mine: null }); note(`gave my ${m === 'mug' ? 'mug' : 'can'} back`, `gave:${m}`)
  fx({ kind: 'face', a: { mood: 'happy' }, dur: 1.2 }); talk(pacify('gift') || pick(['Thank you.', 'Finally.']), 'thumbs_up', true)
}

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') window.__meetRoom = { under }   // dev only: probing what a tap lands on
