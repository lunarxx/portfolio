// you: your character (the skits cast, real models in their watercolour), drawn on twos into whichever tiles are
// showing it; your face and arms move it when your camera's on, else it idles, follows your cursor, dozes, giggles.
// your mic: its loudness moves the mouth, and what you say goes to him as text. in the lobby it talks in bubbles
import { get, set, live, note } from './store.js'
import { say, stage, pick, wakeAudio } from './show.js'
import { ask } from './brain.js'
import { createCast, CAST, DEFAULT_LOOK } from './engine/cast3d.js'
import { createFaceCam, createRetarget } from './engine/facecam.js'
import { feed } from './gestures.js'

const inLobby = () => get().phase === 'lobby'
let cast = null, started = false
const canvases = new Set()
export const attach = (cv) => { canvases.add(cv); return () => canvases.delete(cv) }
export const head = () => cast && cast.head
let gazeEl = null
export const gazeAnchor = (el) => { gazeEl = el }

// ---------------------------------------------------------------- the pose
let tracker = null, video = null, camStream = null
const retarget = createRetarget(), idle = { blinkAt: 2, glance: 0, glanceAt: 3 }, armsLost = {}
let arms = null, pose = null, lastStep = -1, busy = false, pokedAt = -9
const gaze = { yaw: 0, pitch: 0, lx: 0, ly: 0, over: false, want: { yaw: 0, pitch: 0, lx: 0, ly: 0 } }
function idlePose(t) {
  if (t > idle.blinkAt + .14) idle.blinkAt = t + 2.5 + Math.random() * 3
  if (t > idle.glanceAt) { idle.glance = (Math.random() - .5) * .4; idle.glanceAt = t + 2 + Math.random() * 4 }
  const bl = t > idle.blinkAt ? 1 : 0
  // in the lobby with the camera off, it slowly dozes off: lids heavy, head nodding, the odd yawn
  const doze = inLobby() && !get().cam ? Math.min(1, Math.max(0, (live.dozy - 5) / 6)) : 0
  const yawn = doze > .6 && (t % 9) < 1.6 ? Math.sin((t % 9) / 1.6 * Math.PI) : 0
  const lid = Math.max(bl, doze * .62)
  return { x: Math.sin(t * .6) * 5, y: doze * 6, z: 1, roll: Math.sin(t * .8) * .03 + doze * .08, yaw: idle.glance * (1 - doze), pitch: doze * (.18 + Math.sin(t * .7) * .06), blinkL: lid, blinkR: lid, jaw: yawn * .9, pucker: yawn * .3, smile: .3 * (1 - doze), browUp: yawn * .4 }
}
// the lobby: it looks at your cursor, beams when you hover it, giggles when poked
function lobbyPose(p, t) {
  if (get().cam) return p
  for (const k of ['yaw', 'pitch', 'lx', 'ly']) gaze[k] += (gaze.want[k] - gaze[k]) * .12
  const doze = live.dozy > 5, u = t - pokedAt, poke = u < .8 ? 1 - u / .8 : 0, q = { ...p }
  if (!doze) { q.yaw = gaze.yaw; q.pitch = gaze.pitch; q.lookX = gaze.lx * 1.2; q.lookY = gaze.ly * .9; q.roll = (q.roll || 0) - gaze.yaw * .22; q.x = (q.x || 0) + gaze.yaw * 22 }
  if (!doze && gaze.over) { q.smile = Math.max(q.smile || 0, .85); q.browUp = .5 }
  if (poke) { q.smile = 1; q.squint = .6; q.blinkL = q.blinkR = 0; q.jaw = .35 * poke; q.roll = Math.sin(u * 28) * .12 * poke; q.y = -10 * Math.sin(u * Math.PI / .8) }
  return q
}
const talking = (t) => (performance.now() < live.talkUntil ? Math.abs(Math.sin(t * 13)) * .6 : 0)
// arms ease toward what the camera sees, and hold a moment when it loses one
const lerpDeep = (a, b, k) => Array.isArray(b) ? b.map((x, i) => lerpDeep(a?.[i], x, k)) : b && typeof b === 'object' ? Object.fromEntries(Object.entries(b).map(([key, v]) => [key, lerpDeep(a?.[key], v, k)])) : typeof a === 'number' ? a + (b - a) * k : b
function holdArms(prev, next) {
  const out = {}
  for (const side of ['left', 'right']) {
    const n = next && next[side], p = prev && prev[side]
    if (n) { armsLost[side] = 0; out[side] = p ? lerpDeep(p, n, .5) : n }
    else if (p && (armsLost[side] = (armsLost[side] || 0) + 1) < 6) out[side] = p
  }
  return Object.keys(out).length ? out : null
}
function loop(now) {
  const t = now / 1000, step = Math.floor(t * 12)
  if (tracker && video) { const r = tracker.read(video, now); if (r !== undefined) { const p = retarget.step(r.face); if (p) pose = { ...p }; arms = holdArms(arms, r.arms); feed({ pose: p, faceSeen: !!r.face, hands: r.hands, faceLm: r.faceLm, body: r.body, aspect: r.aspect }) } }
  else { pose = lobbyPose(idlePose(t), t); arms = null }
  if (cast && !busy && step !== lastStep && canvases.size) {
    lastStep = step; busy = true
    cast.draw(get().look, { ...pose, jaw: Math.max(pose.jaw || 0, talking(t), live.micLevel * .9), arms }, t).then((c) => {
      for (const cv of canvases) cv.getContext('2d').drawImage(c, 0, 0, cv.width, cv.height)
    }).finally(() => { busy = false })
  }
  requestAnimationFrame(loop)
}

// a little portrait of each of the cast, for the picker
/** @type {Record<string, string>} */
export const thumbs = {}
export function start() {
  if (started) return; started = true
  createCast().then(async (c) => {
    cast = c
    for (const n of Object.keys(CAST)) {
      const cv = await c.draw({ ...DEFAULT_LOOK, ...CAST[n] }, { ...idlePose(0), x: 0, roll: 0, yaw: 0, blinkL: 0, blinkR: 0, smile: .5 }, 0)
      const th = document.createElement('canvas'); th.width = 180; th.height = 140
      th.getContext('2d').drawImage(cv, cv.width * .3, 0, cv.width * .4, cv.height * .7, 0, 0, 180, 140)
      thumbs[n] = th.toDataURL()
    }
    set({ thumbsReady: true })
    if (process.env.NODE_ENV !== 'production') window.__meetCast = c   // dev only: the stills script poses the character directly
  }).catch((e) => console.warn('cast failed', e))
  pose = idlePose(0); requestAnimationFrame(loop)
  addEventListener('pointermove', onPointer)
  setInterval(tick, 1000)
  // its first words tell you where you are, nervously, as if you're the one being interviewed
  setTimeout(() => speak("Psst… we're interviewing Ashwini. The guy with the TV for a head.", { force: true }), 1200)
}

// ---------------------------------------------------------------- the lobby: bubbles, cursor, pokes, nudges
let bubbleUntil = 0, bubbleId = 0, lastLine = '', hideTimer = null
export function speak(text, { small = false, force = false } = {}) {
  if (!inLobby() || (!force && performance.now() < bubbleUntil - 600) || text === lastLine) return
  lastLine = text; clearTimeout(hideTimer)
  live.talkUntil = performance.now() + Math.min(2600, 300 + text.length * 42)
  const stay = 1400 + text.length * 60; bubbleUntil = performance.now() + stay
  set({ bubble: { text, small, id: ++bubbleId } })
  hideTimer = setTimeout(() => { set({ bubble: null }); lastLine = '' }, stay)
}
export const acted = () => { live.lastAction = performance.now() }
function onPointer(e) {
  if (get().cam || !gazeEl) return
  const r = gazeEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .42
  const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width * .9))), dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height * .9)))
  gaze.want = { yaw: dx * .62, pitch: dy * .3, lx: dx, ly: -dy }
  gaze.over = gazeEl.contains(e.target) && e.target.tagName === 'CANVAS'
  if (live.dozy > 9 && inLobby()) speak(pick(["Oh! I'm up.", "I wasn't sleeping.", "Huh? Who's there?"]), { force: true })
  live.dozy = 0
}
export function poke() {
  pokedAt = performance.now() / 1000; live.dozy = 0; acted()
  speak(pick(['Hey!', 'Hehe, stop.', 'Boop received.', 'That tickles.', 'Again? Okay.', "I'm ticklish there."]), { force: true })
}
// what you put on it, it notices
const HAT = { beanie: 'Cozy.', cap: 'Very cool. Very sideways.', bucket: 'Gone fishing.', headphones: "Can't hear you, vibing.", party: 'Is it a party? Is it MY party?', sprout: "I'm growing!", none: 'Hat hair. Sorry.' }
export function noticed(kind, v) {
  acted()
  const f = { force: true }
  if (kind === 'shuffle') return speak(pick(['Whoa. New me.', 'Who am I now?', 'Again! Again!', 'Plot twist.']), f)
  if (kind === 'who') return speak(pick([`${v}! Good pick.`, `Feeling very ${v} today.`, `${v} it is.`]), f)
  if (kind === 'glasses') return speak(v ? 'I can see everything now.' : 'Blurry. Fine.', f)
  if (kind === 'hat') return speak(HAT[v], f)
  if (kind === 'name') return v && speak(pick([`Hi, ${v}!`, `${v}. I like it.`, `Nice to meet me, ${v}.`]), f)
}
// when things go quiet: a doze, or a nudge toward the next step (each once); the control it means wiggles
const NUDGES = [
  { when: () => !get().name, line: "Psst. Type your name, I'm curious.", el: 'yourname' },
  { when: () => !get().cam, line: 'The camera button. I wanna move.', el: 'lcam' },
]
let dozeSaid = false
function tick() {
  if (!inLobby()) return
  if (!get().cam) live.dozy++
  if (live.dozy > 7 && !dozeSaid) { dozeSaid = true; speak('Zzz…', { small: true }) }
  if (live.dozy < 3) dozeSaid = false
  if (performance.now() - live.lastAction < 12000 || performance.now() < bubbleUntil + 4000) return
  const n = NUDGES.find((x) => !x.done && x.when()); if (!n) return
  n.done = true; acted(); speak(n.line, { force: true })
  document.getElementById(n.el)?.animate([{ transform: 'none' }, { transform: 'rotate(-3deg) scale(1.04)' }, { transform: 'rotate(3deg) scale(1.04)' }, { transform: 'none' }], { duration: 600, iterations: 2 })
}

// ---------------------------------------------------------------- your camera: moves your character, never shows
// the face tracker starts downloading when you reach for the camera button (export warm), not for every visitor
let trackerP = null
const warmTracker = () => (trackerP ||= createFaceCam())
export const warm = () => { warmTracker().catch(() => { trackerP = null }) }
// a phone: the front camera, a smaller, slower stream (the trackers read every frame, and a phone's GPU is the same
// one drawing the page), whichever way up it's held (a portrait phone gives a tall frame; the tracker takes either)
const coarse = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
async function openCam() {
  const md = navigator.mediaDevices
  if (!md?.getUserMedia) { set({ camNote: 'This browser has no camera access here' }); return null }
  const phone = coarse()
  const want = { facingMode: 'user', width: { ideal: phone ? 480 : 640 }, height: { ideal: phone ? 360 : 480 }, frameRate: { ideal: phone ? 24 : 30, max: 30 } }
  try { return await md.getUserMedia({ video: want, audio: false }) } catch (e) {
    if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') { set({ camNote: 'Camera blocked. Allow it in the site settings, then tap again' }); return null }
    try { return await md.getUserMedia({ video: true, audio: false }) } catch { set({ camNote: 'No camera found' }); return null }   // an odd camera that refuses the asks: any frames will do
  }
}
// the video is never shown, but it sits in the page: Safari on a phone stops a video's frames when it isn't in one
function videoFor(stream) {
  const v = document.createElement('video')
  v.muted = true; v.playsInline = true; v.autoplay = true; v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true')
  v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;z-index:-1'
  v.srcObject = stream; document.body.appendChild(v)
  return v
}
// a phone takes the camera back when it locks or another app wants it: the character goes still, and when you're
// back on the page, the camera comes back on its own
let camWanted = false
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && camWanted && !camStream) camera(true)
})
export async function camera(on) {
  if (on) camWanted = true
  if (on && !camStream) {
    set({ camNote: '' })
    camStream = await openCam()
    if (camStream) {
      video = videoFor(camStream); await video.play().catch(() => {})
      camStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (!camStream) return
        camStream.getTracks().forEach((t) => t.stop()); camStream = null; video?.remove(); video = null; set({ cam: false })   // camWanted stays: it comes back
      })
      set({ cam: true, camWaking: true }); retarget.calibrate(); note(inLobby() ? 'turned their camera on before joining' : 'turned their camera on', 'cam')
      try { tracker = tracker || await warmTracker() } catch (e) { console.warn('tracker failed', e); trackerP = null }
      set({ camWaking: false }); if (inLobby()) setTimeout(() => speak('Ooh, I can move! Wave at him. Thumbs up when you want to go in.', { force: true }), 400)
    }
  } else if (!on) { camWanted = false; if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; video?.remove(); video = null; set({ cam: false }) } }
  live.dozy = 0; acted()
}

// ---------------------------------------------------------------- your mic: your voice moves your mouth; your words go to him
const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
export const canListen = () => !!SR
let micStream = null, rec = null, lobbyHeard = false
async function openMic() {
  if (micStream) return true
  try { micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }) } catch { return false }
  await wakeAudio()
  const ac = stage()?.audio
  if (ac) {
    const an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(micStream).connect(an)   // only read, never played
    const buf = new Float32Array(an.fftSize)
    ;(function lvl() { an.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) s += v * v; live.micLevel = wantMic ? Math.max(Math.min(1, (Math.sqrt(s / buf.length) - .015) * 14), live.micLevel * .82) : 0; requestAnimationFrame(lvl) })()
  }
  return true
}
export let heardLive = ''   // what you're saying right now, before it's final
// your words, through Deepgram: never an open mic. the mic is only measured here, in the page; when you start talking
// the last moment before it (so the first word isn't clipped) and what you say until a short silence become one clip,
// and only that clip is sent (/api/transcribe, Nova-3, paid by the second of speech). a cough is dropped, his own voice
// out of your speakers has to be louder to count, and a call sends at most a few minutes. two failures: the browser's
// own recognition takes over
const DG = { on: true, fails: 0, sent: 0, warmed: 0, MAX_SENT: 240 }
let vad = null
function listen() {
  if (DG.on && stage()?.audio && micStream) return listenDeepgram()
  listenBrowser()
}
function listenDeepgram() {
  if (vad) return
  fetch('/api/transcribe', { method: 'GET' }).catch(() => {})   // the server opens its line to Deepgram now, not on your first word
  const ac = stage().audio, src = ac.createMediaStreamSource(micStream), node = ac.createScriptProcessor(2048, 1, 1), mute = ac.createGain()
  mute.gain.value = 0; src.connect(node); node.connect(mute); mute.connect(ac.destination)   // runs, never heard
  const frame = 2048 / ac.sampleRate, ring = [], RING = Math.ceil(.8 / frame), QUIET = Math.ceil(.7 / frame), MIN = .3, LONGEST = 15   // a long lead-in: soft starts ("how", "go") sit under the threshold
  let floor = .01, clip = null, quiet = 0, loud = 0
  node.onaudioprocess = (e) => {
    if (!wantMic) return
    const x = new Float32Array(e.inputBuffer.getChannelData(0)); let s = 0; for (const v of x) s += v * v
    const rms = Math.sqrt(s / x.length), him = live.lastSaid > performance.now()
    floor = rms < floor ? floor * .9 + rms * .1 : floor * .999 + rms * .001   // the room's own noise, tracked slowly
    const speaking = rms > Math.max(him ? .05 : .014, floor * (him ? 4.5 : 2.5))
    if (!clip) {
      ring.push(x); if (ring.length > RING) ring.shift()
      loud = speaking ? loud + 1 : 0
      if (loud >= 2 && DG.sent < DG.MAX_SENT) {
        clip = [...ring]; quiet = 0; set({ interim: '…' })
        if (performance.now() - DG.warmed > 2500) { DG.warmed = performance.now(); fetch('/api/transcribe', { method: 'GET' }).catch(() => {}) }   // the server opens its line to Deepgram while you talk
      }
      return
    }
    clip.push(x); quiet = speaking ? 0 : quiet + 1
    if (quiet >= QUIET || clip.length * frame > LONGEST) {
      const done = clip; clip = null; ring.length = 0; loud = 0
      const secs = (done.length - quiet) * frame
      if (secs < MIN) { set({ interim: '' }); return }   // a cough, a click: nothing sent
      DG.sent += done.length * frame; sendClip(done, ac.sampleRate)
    }
  }
  vad = { stop() { node.disconnect(); src.disconnect(); mute.disconnect(); vad = null } }
  set({ listening: true })
}
// one clip as a 16 kHz wav (a third of the bytes of the mic's rate, and all Nova-3 needs)
async function sendClip(frames, rate) {
  if (!wantMic) return   // switched off as the clip ended: it stays here
  const all = new Float32Array(frames.reduce((n, f) => n + f.length, 0)); let o = 0; for (const f of frames) { all.set(f, o); o += f.length }
  const step = rate / 16000, n = Math.floor(all.length / step), wav = new DataView(new ArrayBuffer(44 + n * 2))
  const str = (p, s) => [...s].forEach((c, i) => wav.setUint8(p + i, c.charCodeAt(0)))
  str(0, 'RIFF'); wav.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 1, true)
  wav.setUint32(24, 16000, true); wav.setUint32(28, 32000, true); wav.setUint16(32, 2, true); wav.setUint16(34, 16, true); str(36, 'data'); wav.setUint32(40, n * 2, true)
  for (let i = 0; i < n; i++) wav.setInt16(44 + i * 2, Math.max(-1, Math.min(1, all[Math.floor(i * step)])) * 32767, true)
  try {
    const form = new FormData(); form.append('audio', new Blob([wav], { type: 'audio/wav' }), 'clip.wav')
    const res = await fetch('/api/transcribe', { method: 'POST', body: form, signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(String(res.status))
    const said = ((await res.json()).transcript || '').trim(); DG.fails = 0
    set({ interim: '' }); if (!said || !wantMic) return
    if (inLobby()) heardInLobby(said); else ask(said)
  } catch {
    set({ interim: '' })
    if (++DG.fails >= 2) { DG.on = false; vad && vad.stop(); if (wantMic) listenBrowser() }   // Deepgram's out: the browser listens instead
  }
}
function listenBrowser() {
  if (!SR || rec) return
  rec = new SR(); rec.lang = navigator.language || 'en-US'; rec.interimResults = true; rec.continuous = true
  rec.onresult = (e) => {
    const r = e.results[e.results.length - 1], said = r[0].transcript
    if (inLobby()) { if (r.isFinal) heardInLobby(said); return }
    set({ interim: r.isFinal ? '' : said }); if (r.isFinal) ask(said)
  }
  rec.onend = () => { rec = null; set({ listening: false, interim: '' }); if (micStream && wantMic) setTimeout(listenBrowser, 250) }   // on until you turn it off (the browser stops after each phrase)
  rec.onerror = () => {}
  rec.start(); set({ listening: true })
}
// he's in the room behind the lobby: say hi and he hears you
function heardInLobby(said) {
  if (lobbyHeard) return; lobbyHeard = true
  const hi = /\b(hi|hey|hello|yo|sup|namaste|hola|morning)\b/i.test(said), line = hi ? 'Hey! I can hear you. Come in.' : 'I can hear you out there. Come in.'
  say(line, { mark: 'hello' }); set({ heard: line })
}
let wantMic = false
export async function micButton() {
  acted()
  if (!wantMic) {
    if (!(await openMic())) return
    wantMic = true; set({ mic: true }); listen(); note(inLobby() ? 'turned their mic on in the lobby' : 'turned their mic on', 'mic')
    if (inLobby()) setTimeout(() => speak('I can hear you!', { force: true }), 600)
  } else { wantMic = false; set({ mic: false, listening: false, interim: '' }); rec && rec.stop(); vad && vad.stop() }
}
