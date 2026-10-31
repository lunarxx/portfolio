// your camera drives your character: the trackers from octyn-reel-lab/live (mediapipe's face, body and hand
// landmarkers, run in this browser, nothing sent anywhere) and the rig's rules: your usual pose is his straight pose
// (a neutral learnt from the first steady second, eased toward what you hold), every expression measured against your
// own resting face and your own range (someone who barely smiles still gets a full smile), and nothing on screen that
// the camera didn't really see (an arm only counts when a hand is found at its wrist: the body tracker alone invents
// the arm it can't see).
const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1'
const MODELS = 'https://storage.googleapis.com/mediapipe-models'
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
        top[k] = Math.max(FLOOR[k] * 2, (top[k] || 0) * .9995, Math.abs(v))
        const span = Math.max(FLOOR[k], top[k] * .8)
        want[k] = signed ? clamp(Math.sign(v) * Math.max(0, Math.abs(v) - FLOOR[k] * .4) / span) : clamp((v - FLOOR[k] * .4) / span, 0, 1)
      }
      if (!cur) cur = { ...want }
      for (const k of Object.keys(want)) cur[k] = ease(cur[k], want[k], k === 'z' ? .06 : k === 'x' || k === 'y' ? .25 : /blink|jaw|pucker/.test(k) ? .75 : .4)
      return cur
    },
  }
}

export async function createFaceCam() {
  const { FilesetResolver, FaceLandmarker, PoseLandmarker, HandLandmarker } = await import(`${VISION}/vision_bundle.mjs`)
  const files = await FilesetResolver.forVisionTasks(`${VISION}/wasm`)
  async function make(Kind, path, extra) {
    for (const delegate of ['GPU', 'CPU']) { try { return await Kind.createFromOptions(files, { baseOptions: { modelAssetPath: path, delegate }, runningMode: 'VIDEO', ...extra }) } catch {} }
    return null
  }
  const face = await make(FaceLandmarker, new URL('./models/face_landmarker.task', import.meta.url).href, { numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true, minFaceDetectionConfidence: .4, minFacePresenceConfidence: .4, minTrackingConfidence: .4 })
  const body = await make(PoseLandmarker, `${MODELS}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`, { numPoses: 1, minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5 })
  const hands = await make(HandLandmarker, `${MODELS}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, { numHands: 2, minHandDetectionConfidence: .55, minHandPresenceConfidence: .55, minTrackingConfidence: .5 })
  if (!face) throw new Error('no face tracker')
  let last = -1
  const seen = { left: 0, right: 0 }   // how many frames running each arm's hand has been found (on and off, with a lag)
  return {
    // the newest { face, arms } from the video (undefined: no new frame). face is null when none is in view
    read(video, now) {
      if (!video.videoWidth || video.currentTime === last) return undefined
      last = video.currentTime
      const r = face.detectForVideo(video, now)
      let f = null
      if (r.faceLandmarks?.length && r.facialTransformationMatrixes?.length) {
        const bs = Object.fromEntries((r.faceBlendshapes[0]?.categories || []).map((c) => [c.categoryName, c.score]))
        f = rawPose({ m: r.facialTransformationMatrixes[0].data, bs, lm: r.faceLandmarks[0] })
      }
      const aspect = video.videoWidth / video.videoHeight
      const b = body && body.detectForVideo(video, now + .3), lm = b?.landmarks?.[0]
      const h = hands && hands.detectForVideo(video, now + .6)
      const arms = {}
      if (lm) for (const [side, S, E, Wr] of [['left', 11, 13, 15], ['right', 12, 14, 16]]) {
        // the hand found nearest this arm's wrist, if it's really there (each hand only once)
        let best = null, bd = .14
        for (let i = 0; i < (h?.landmarks?.length || 0); i++) {
          const w = h.landmarks[i][0], d = Math.hypot((w.x - lm[Wr].x) * aspect, w.y - lm[Wr].y)
          if (d < bd && !Object.values(arms).some((a) => a.hand === i)) { bd = d; best = i }
        }
        seen[side] = best !== null ? seen[side] + 1 : 0
        if (best === null || seen[side] < 2) continue   // two frames running, or it's a flicker
        const hl = h.landmarks[best], d0 = (i) => Math.hypot(hl[i].x - hl[0].x, hl[i].y - hl[0].y)
        const curled = [[8, 5], [12, 9], [16, 13], [20, 17]].filter(([tip, mcp]) => d0(tip) < d0(mcp) * 1.25).length
        arms[side] = { upper: dir(lm[S], lm[E], aspect, .12), fore: dir(lm[E], lm[Wr], aspect, .3), hand: best, palm: palmOf(h.worldLandmarks[best]),
          at: [1 - hl[9].x, hl[9].y], grab: curled >= 3,   // where your hand is on a mirrored screen, and whether it's a fist
          sh: [1 - lm[S].x, lm[S].y], shw: Math.abs(lm[11].x - lm[12].x) }   // and your shoulder, to measure a reach against
      }
      for (const s of Object.keys(arms)) delete arms[s].hand
      return { face: f, arms: Object.keys(arms).length ? arms : null }
    },
  }
}
// a limb segment as a direction on a mirrored screen (x right, y up, a little toward the camera)
function dir(a, b, aspect, z) { const v = [-(b.x - a.x) * aspect, -(b.y - a.y), z]; const n = Math.hypot(...v) || 1; return v.map((x) => x / n) }
// a hand in metres, mirrored: the palm's frame and every finger bone as a direction
const FINGERS = { index: [5, 6, 7, 8], middle: [9, 10, 11, 12], ring: [13, 14, 15, 16], pinky: [17, 18, 19, 20], thumb: [1, 2, 3, 4] }
function palmOf(w) {
  const p = (i) => [-w[i].x, -w[i].y, -w[i].z], sub = (a, b) => a.map((x, i) => x - b[i])
  const out = { fingers: sub(p(9), p(0)), across: sub(p(5), p(17)), bones: {} }
  for (const [n, ix] of Object.entries(FINGERS)) out.bones[n] = [sub(p(ix[1]), p(ix[0])), sub(p(ix[2]), p(ix[1])), sub(p(ix[3]), p(ix[2]))]
  return out
}
