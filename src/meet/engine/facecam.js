// your camera drives your character: mediapipe's face and hand trackers (the rig's, octyn-reel-lab/live; Gesture
// Synth's hands too), run in this browser, nothing sent anywhere. the rig's rules: your usual pose is his straight pose
// (a neutral learnt from the first steady second, eased toward what you hold), every expression measured against your
// own resting face and range, and nothing on screen the camera didn't really see (a hand shows after two frames)
const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1'
// mediapipe prints its status ("INFO: Created TensorFlow Lite XNNPACK delegate...") on console.error; send those to info
if (typeof console !== 'undefined' && !console.error.__meet) {
  const err = console.error.bind(console), quiet = (...a) => (typeof a[0] === 'string' && /^(INFO:|W\d{4}|I\d{4})/.test(a[0]) ? console.info(...a) : err(...a))
  quiet.__meet = true; console.error = quiet
}
const MODELS = 'https://storage.googleapis.com/mediapipe-models'
const PHONE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
// how the tracker is keeping up (shown with /meet?debug): ms from a frame sent to its result back, results a second
export const stats = { ms: 0, fps: 0 }
let statN = 0, statAt = 0
function tally(sentAt) {
  const t = performance.now(); stats.ms = Math.round(stats.ms ? stats.ms * .9 + (t - sentAt) * .1 : t - sentAt); statN++
  if (t - statAt > 1000) { stats.fps = Math.round(statN * 1000 / (t - statAt || 1)); statN = 0; statAt = t }
}
const clamp = (x, a = -1, b = 1) => Math.max(a, Math.min(b, x))
const avg = (...v) => v.reduce((s, x) => s + (x || 0), 0) / v.length

// one face from the tracker -> raw angles, position and expression channels, mirrored like a self view
export function rawPose(r) {
  const m = r.m, b = r.bs, lm = r.lm
  const L = lm[234], R = lm[454]
  return {
    roll: -Math.atan2(m[4], m[5]), yaw: -Math.atan2(m[8], m[10]), pitch: -Math.asin(clamp(m[9])),
    x: 1 - (L.x + R.x) / 2, y: (L.y + R.y) / 2, d: -m[14],            // where the head is, and how far (cm, the face transform's own)
    // your left eye is on the screen's left in a self view: the tracker's 'Right' channels are yours
    blinkL: b.eyeBlinkRight, blinkR: b.eyeBlinkLeft,
    wide: avg(b.eyeWideLeft, b.eyeWideRight), squint: avg(b.eyeSquintLeft, b.eyeSquintRight, b.cheekSquintLeft, b.cheekSquintRight),
    lookX: avg(b.eyeLookInLeft, b.eyeLookOutRight) - avg(b.eyeLookOutLeft, b.eyeLookInRight), lookY: avg(b.eyeLookUpLeft, b.eyeLookUpRight) - avg(b.eyeLookDownLeft, b.eyeLookDownRight),
    browUp: Math.max(b.browInnerUp || 0, avg(b.browOuterUpLeft, b.browOuterUpRight)), browDown: avg(b.browDownLeft, b.browDownRight),
    browSad: Math.max(0, (b.browInnerUp || 0) - avg(b.browOuterUpLeft, b.browOuterUpRight)),
    jaw: b.jawOpen, smile: avg(b.mouthSmileLeft, b.mouthSmileRight), smirk: (b.mouthSmileRight || 0) - (b.mouthSmileLeft || 0),
    frown: avg(b.mouthFrownLeft, b.mouthFrownRight), pucker: Math.max(b.mouthPucker || 0, b.mouthFunnel || 0), puff: b.cheekPuff,
    press: avg(b.mouthPressLeft, b.mouthPressRight, b.mouthRollLower, b.mouthRollUpper),
  }
}
const EXPR = ['blinkL', 'blinkR', 'wide', 'squint', 'lookX', 'lookY', 'browUp', 'browDown', 'browSad', 'jaw', 'smile', 'smirk', 'frown', 'pucker', 'puff', 'press']
// the least a channel must move past rest to read as anything, and the least it counts as full (so noise stays noise)
const FLOOR = { blinkL: .3, blinkR: .3, wide: .08, squint: .12, lookX: .1, lookY: .1, browUp: .12, browDown: .1, browSad: .1, jaw: .08, smile: .12, smirk: .1, frown: .06, pucker: .15, puff: .1, press: .12 }

// raw poses -> the character's pose: less your neutral, over your own range, smoothed
export function createRetarget() {
  let neutral = null, acc = [], cur = null, top = {}
  const ease = (a, b, k) => a + (b - a) * k
  return {
    calibrate() { neutral = null; acc = []; top = {} },
    step(raw) {
      if (!raw) { if (cur) for (const k of Object.keys(cur)) if (!['z', 'x', 'y'].includes(k)) cur[k] *= .85; return cur }
      if (!neutral) { acc.push(raw); if (acc.length < 15) return cur; neutral = {}; for (const k of Object.keys(raw)) neutral[k] = acc.reduce((s, a) => s + (a[k] || 0), 0) / acc.length }
      for (const k of ['roll', 'yaw', 'pitch', 'x', 'y', 'd']) neutral[k] = ease(neutral[k], raw[k], .0015)   // what you hold, slowly, becomes straight
      const want = {
        roll: clamp(raw.roll - neutral.roll, -.5, .5), yaw: clamp(raw.yaw - neutral.yaw, -.6, .6), pitch: clamp((raw.pitch - neutral.pitch) * 1.3, -.5, .5),
        // the head's place on screen, less the sideways swing a turn gives it (the face's middle moves with a turn; the body doesn't)
        x: clamp((raw.x - neutral.x - Math.sin(raw.yaw - neutral.yaw) * .06) * 480, -140, 140), y: clamp((raw.y - neutral.y) * 260, -60, 70),
        z: clamp(neutral.d / Math.max(10, raw.d), .88, 1.14),
      }
      // expressions: past your resting face, over the most you've shown (which decays, so one big laugh doesn't dull the rest)
      for (const k of EXPR) {
        const signed = k === 'lookX' || k === 'lookY' || k === 'smirk'
        const v = (raw[k] || 0) - (signed || k.startsWith('blink') ? (signed ? neutral[k] : 0) : neutral[k] || 0)
        // calmer than it was (his note: "the expressions are too sensitive"): a wider dead zone, a full expression needs
        // most of the biggest one you've shown, and never less than a clear one
        top[k] = Math.max(FLOOR[k] * 3, (top[k] || 0) * .9997, Math.abs(v))
        const span = Math.max(FLOOR[k] * 2.2, top[k])
        want[k] = signed ? clamp(Math.sign(v) * Math.max(0, Math.abs(v) - FLOOR[k]) / span) : clamp((v - FLOOR[k]) / span, 0, 1)
      }
      if (!cur) cur = { ...want }
      for (const k of Object.keys(want)) cur[k] = ease(cur[k], want[k], k === 'z' ? .06 : k === 'x' || k === 'y' ? .25 : /blink/.test(k) ? .7 : /jaw|pucker/.test(k) ? .5 : .22)
      return cur
    },
  }
}

export async function createFaceCam() {
  const FACE = '/meet/stage/models/face_landmarker.task'
  const HANDS = `${MODELS}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, BODY = `${MODELS}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`
  const v = (x, y, z) => { const n = Math.hypot(x, y, z) || 1; return [x / n, y / n, z / n] }
  const smooth = { left: null, right: null }   // one-euro filters per hand: still when you're still, quick when you move
  const seen = { left: 0, right: 0 }   // how many frames running each arm's hand has been found (on and off, with a lag)
  let lastBody = null, lastHands = null
  // the trackers' plain results into { face, arms, hands, faceLm, body, aspect }, the same wherever they ran
  function shape(rf, h, b, aspect, now) {
    if (b !== undefined) lastBody = b
    if (h === undefined) h = lastHands; else lastHands = h   // a frame the hands skipped: the last ones stand
    const f = rf ? rawPose({ m: rf.m, bs: Object.fromEntries(rf.bs), lm: rf.lm }) : null
    const lm = lastBody?.landmarks?.[0], wl = lastBody?.worldLandmarks?.[0]
    const arms = {}, used = new Set()
    if (lm && wl) for (const [side, S, E, Wr] of [['left', 11, 13, 15], ['right', 12, 14, 16]]) {
      // the hand found at this arm's wrist (each hand once)
      let best = null, bd = .16
      for (let i = 0; i < (h?.landmarks?.length || 0); i++) {
        const w = h.landmarks[i][0], d = Math.hypot((w.x - lm[Wr].x) * aspect, w.y - lm[Wr].y)
        if (d < bd && !used.has(i)) { bd = d; best = i }
      }
      // an arm shows when its hand is seen, or the body tracker is sure of the elbow and wrist (hands behind your head,
      // out of the hand tracker's sight); never an arm it only guessed at
      const sure = (lm[E].visibility ?? 0) > .8 && (lm[Wr].visibility ?? 0) > .65
      if (best === null && !sure) continue
      if (best !== null) used.add(best)
      // in 3D, mirrored like a self view: x right, y up, z toward the camera (mediapipe's z grows away from it)
      const d3 = (a, c) => v(-(wl[c].x - wl[a].x), -(wl[c].y - wl[a].y), -(wl[c].z - wl[a].z))
      const raw = { upper: d3(S, E), fore: d3(E, Wr), at: [1 - lm[Wr].x, lm[Wr].y] }
      if (best !== null) {
        const hl = h.landmarks[best], d0 = (k) => Math.hypot(hl[k].x - hl[0].x, hl[k].y - hl[0].y)
        raw.palm = palmOf(h.worldLandmarks[best]); raw.at = [1 - hl[9].x, hl[9].y]
        raw.grab = [[8, 5], [12, 9], [16, 13], [20, 17]].filter(([tip, mcp]) => d0(tip) < d0(mcp) * 1.25).length >= 3
      }
      seen[side] = (seen[side] || 0) + 1
      arms[side] = smooth[side] = oneEuro(smooth[side], raw, now)
    }
    for (const side of ['left', 'right']) if (!arms[side]) { seen[side] = 0; smooth[side] = null }
    for (const side of Object.keys(arms)) if (seen[side] < 2) delete arms[side]   // two frames running, or it's a flicker
    // how close your two hands are, by your own palm's size (1: touching, 0: a few palms apart): the character's arms come off
    // a wide round body, so copying your arms' directions alone never brings its hands together
    if (arms.left && arms.right && h?.landmarks?.length === 2) {
      const [a, b] = h.landmarks, palm = Math.hypot((a[0].x - a[9].x) * aspect, a[0].y - a[9].y) || .01, gap = Math.hypot((a[9].x - b[9].x) * aspect, a[9].y - b[9].y) / palm
      arms.near = Math.max(0, Math.min(1, (3 - gap) / 1.7))
    }
    // for gestures: every hand's points (mirrored like a self view), your face's points and the body's, raw
    const mir = (pts) => pts.map((q) => ({ x: 1 - q.x, y: q.y, z: q.z }))
    const handsRaw = (h?.landmarks || []).map((pts) => ({ lm: mir(pts) }))
    return { face: f, arms: Object.keys(arms).length ? arms : null, hands: handsRaw, faceLm: rf ? mir(rf.lm) : null, body: lm ? mir(lm) : null, aspect }
  }

  // in a worker (the GPU readbacks wait there, not on the page): a frame goes when the last one's back. a classic
  // worker, not a module one: mediapipe loads its wasm runtime with importScripts
  const worker = await new Promise((resolve) => {
    try {
      const w = new Worker('/meet/facecam-worker.js'), t = setTimeout(() => { w.terminate(); resolve(null) }, 20000)
      w.onmessage = (e) => { if (e.data.type === 'ready') { clearTimeout(t); if (e.data.ok) resolve(w); else { console.warn('[facecam] worker failed, tracking on the page:', e.data.error); w.terminate(); resolve(null) } } }
      w.onerror = (e) => { console.warn('[facecam] worker error, tracking on the page:', e.message); clearTimeout(t); resolve(null) }
      w.postMessage({ type: 'init', vision: VISION, face: FACE, handsEvery: PHONE ? 2 : 1, bodyEvery: PHONE ? 3 : 2 })
    } catch { resolve(null) }
  })
  if (worker) {
    let busy = false, last = -1, ready = null, extras = false, sentAt = 0
    worker.onmessage = (e) => { if (e.data.type === 'result') { busy = false; tally(sentAt); if (!e.data.error) ready = e.data } }
    return {
      // the newest { face, arms, ... } (undefined: nothing new yet). face is null when none is in view
      read(video, now) {
        if (!video.videoWidth) return undefined
        if (!extras) { extras = true; worker.postMessage({ type: 'extras', hands: HANDS, body: BODY }) }
        if (!busy && video.currentTime !== last) {
          last = video.currentTime; busy = true; sentAt = performance.now()
          createImageBitmap(video).then((bitmap) => worker.postMessage({ type: 'frame', bitmap, t: now }, [bitmap]), () => { busy = false })
        }
        if (!ready) return undefined
        const r = ready; ready = null
        return shape(r.face, r.hands, r.body, r.w / r.h, now)
      },
    }
  }

  // no worker: the trackers on the page, as before (from the CDN at run time; the bundler must leave this import alone)
  const { FilesetResolver, FaceLandmarker, HandLandmarker, PoseLandmarker } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${VISION}/vision_bundle.mjs`)
  const files = await FilesetResolver.forVisionTasks(`${VISION}/wasm`)
  async function make(Kind, path, extra) {
    for (const delegate of ['GPU', 'CPU']) { try { return await Kind.createFromOptions(files, { baseOptions: { modelAssetPath: path, delegate }, runningMode: 'VIDEO', ...extra }) } catch {} }
    return null
  }
  const face = await make(FaceLandmarker, FACE, { numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true, minFaceDetectionConfidence: .4, minFacePresenceConfidence: .4, minTrackingConfidence: .4 })
  if (!face) throw new Error('no face tracker')
  let hands = null, body = null, extras = false, last = -1, frame = 0
  const loadExtras = () => { if (extras) return; extras = true
    make(HandLandmarker, HANDS, { numHands: 2, minHandDetectionConfidence: .5, minHandPresenceConfidence: .5, minTrackingConfidence: .5 }).then((m) => { hands = m })
    make(PoseLandmarker, BODY, { numPoses: 1, minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5 }).then((m) => { body = m }) }
  return {
    read(video, now) {
      if (!video.videoWidth || video.currentTime === last) return undefined
      loadExtras(); last = video.currentTime
      const r = face.detectForVideo(video, now)
      const rf = r.faceLandmarks?.length && r.facialTransformationMatrixes?.length ? { lm: r.faceLandmarks[0], m: r.facialTransformationMatrixes[0].data, bs: (r.faceBlendshapes[0]?.categories || []).map((c) => [c.categoryName, c.score]) } : null
      const h = hands && hands.detectForVideo(video, now + .5)
      const b = body && ++frame % 2 === 0 ? body.detectForVideo(video, now + .25) : undefined
      return shape(rf, h, b, video.videoWidth / video.videoHeight, now)
    },
  }
}
// the one-euro filter on every number in a hand: a low cut-off when it's still (no shiver), opening up with speed (no lag)
function oneEuro(prev, next, now) {
  if (!prev) return { ...next, _t: now, _dx: null }
  const dt = Math.max(1, now - prev._t) / 1000, fc = (cut) => 1 / (1 + 1 / (2 * Math.PI * cut * dt))
  const walk = (p, n, dp) => {
    if (Array.isArray(n)) return n.map((x, i) => walk(p?.[i], x, dp?.[i]))
    if (n && typeof n === 'object') { const o = {}; for (const k of Object.keys(n)) o[k] = walk(p?.[k], n[k], dp?.[k]); return o }
    if (typeof n !== 'number' || typeof p !== 'number') return n
    const speed = Math.abs(n - p) / dt, a = fc(1.2 + .9 * speed)
    return p + (n - p) * a
  }
  const out = walk(prev, next); out._t = now; return out
}
// a limb segment as a direction on a mirrored screen (x right, y up, a little toward the camera)
// a hand in metres, mirrored: the palm's frame and every finger bone as a direction
const FINGERS = { index: [5, 6, 7, 8], middle: [9, 10, 11, 12], ring: [13, 14, 15, 16], pinky: [17, 18, 19, 20], thumb: [1, 2, 3, 4] }
function palmOf(w) {
  const p = (i) => [-w[i].x, -w[i].y, -w[i].z], sub = (a, b) => a.map((x, i) => x - b[i])
  const out = { fingers: sub(p(9), p(0)), across: sub(p(5), p(17)), bones: {} }
  for (const [n, ix] of Object.entries(FINGERS)) out.bones[n] = [sub(p(ix[1]), p(ix[0])), sub(p(ix[2]), p(ix[1])), sub(p(ix[3]), p(ix[2]))]
  // the rig's own numbers for a hand (octyn-px rig.py GRIPS): each finger's curl 0..1, the spread, the thumb's curl and
  // how far it crosses the palm. the blob's mitten fingers are posed from these, never from your joints one by one
  const ang = (a, b) => Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / ((Math.hypot(...a) * Math.hypot(...b)) || 1))))
  out.curls = ['index', 'middle', 'ring', 'pinky'].map((n) => { const [b0, b1, b2] = out.bones[n]; return Math.max(0, Math.min(1, (ang(out.fingers, b0) + ang(b0, b1) + ang(b1, b2) - .25) / 2.6)) })   // a real fist reads about 2.6 here, so it closes all the way
  out.spread = Math.max(0, Math.min(1, (ang(out.bones.index[0], out.bones.pinky[0]) - .3) / .6))
  const [t0, t1, t2] = out.bones.thumb, palmW = Math.hypot(...sub(p(5), p(17))) || 1
  out.thumb = [Math.max(0, Math.min(1, (ang(t0, t1) + ang(t1, t2)) / 1.35)), Math.max(-.6, Math.min(1, 1.2 - Math.hypot(...sub(p(4), p(5))) / palmW * 1.1))]
  return out
}
