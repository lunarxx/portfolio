// the camera trackers (face, hands, body), off the page's main thread. each model reads its result back from the GPU
// with a blocking readPixels: on the page that froze everything else (61% of the main thread, profiled 31 Oct); here
// it only waits this worker. the page sends a frame when the last one is done (a busy worker skips frames instead of
// queueing them, so the lag never grows) and turns the plain results into his face, arms and gestures itself
let face = null, hands = null, body = null, frame = 0, extrasAsked = false, files = null, mp = null, why = []
let handsEvery = 1, bodyEvery = 2   // a phone sends 2 and 3: hands every other frame, the body every third

async function make(Kind, path, extra) {
  for (const delegate of ['GPU', 'CPU']) {
    try { return await Kind.createFromOptions(files, { baseOptions: { modelAssetPath: path, delegate }, runningMode: 'VIDEO', canvas: delegate === 'GPU' ? new OffscreenCanvas(1, 1) : undefined, ...extra }) } catch (err) { why.push(`${delegate}: ${err?.message || err}`) }
  }
  return null
}

self.onmessage = async (e) => {
  const m = e.data
  if (m.type === 'init') {
    handsEvery = m.handsEvery || 1; bodyEvery = m.bodyEvery || 2
    try {
      mp = await import(`${m.vision}/vision_bundle.mjs`)
      files = await mp.FilesetResolver.forVisionTasks(`${m.vision}/wasm`)
      face = await make(mp.FaceLandmarker, m.face, { numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true, minFaceDetectionConfidence: .4, minFacePresenceConfidence: .4, minTrackingConfidence: .4 })
      self.postMessage({ type: 'ready', ok: !!face, error: why.join(' | ') })
    } catch (err) { self.postMessage({ type: 'ready', ok: false, error: String(err) }) }
    return
  }
  if (m.type === 'extras') {   // hands and body load once a camera is really in use
    if (extrasAsked || !mp) return; extrasAsked = true
    make(mp.HandLandmarker, m.hands, { numHands: 2, minHandDetectionConfidence: .5, minHandPresenceConfidence: .5, minTrackingConfidence: .5 }).then((x) => { hands = x })
    make(mp.PoseLandmarker, m.body, { numPoses: 1, minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5 }).then((x) => { body = x })
    return
  }
  if (m.type === 'frame') {
    const img = m.bitmap, t = m.t
    try {
      const r = face.detectForVideo(img, t)
      frame++
      const h = !hands ? null : frame % handsEvery === 0 ? hands.detectForVideo(img, t + .5) : undefined   // undefined: skipped, the page keeps the last
      const b = body && frame % bodyEvery === 1 % bodyEvery ? body.detectForVideo(img, t + .25) : null   // the body every other frame (every third on a phone)
      self.postMessage({
        type: 'result', t, w: img.width, h: img.height,
        face: r.faceLandmarks?.length && r.facialTransformationMatrixes?.length
          ? { lm: r.faceLandmarks[0], m: Array.from(r.facialTransformationMatrixes[0].data), bs: (r.faceBlendshapes[0]?.categories || []).map((c) => [c.categoryName, c.score]) } : null,
        hands: h ? { landmarks: h.landmarks || [], worldLandmarks: h.worldLandmarks || [] } : h,
        body: b ? { landmarks: b.landmarks || [], worldLandmarks: b.worldLandmarks || [] } : undefined,
      })
    } catch (err) { self.postMessage({ type: 'result', t, error: String(err) }) }
    finally { img.close() }
  }
}
