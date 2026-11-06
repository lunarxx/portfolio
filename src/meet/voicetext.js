// how a line is cut for his voice, shared by the page (show.js) and the cache warm-up (scripts/voice-warm.mjs): the
// voice is cached per piece, so both must cut a line the same way
// a line in at most two pieces: the first sentence, so his first word comes quickly, and all the rest together. every extra
// cut is a clip voiced from scratch, and its pitch jumps: measured 7 Nov, a line said whole stayed at 117-123 Hz and the same
// line cut at its commas wandered 119-140 Hz (his note: "it changes pitch and tone sometimes randomly"). a short opener rides
// with what follows, since the shorter the text the wilder the voice gets
const LIMIT = 380   // what the voice route takes in one go
export function pieces(text) {
  const sentences = (text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [text]).map((s) => s.trim()).filter(Boolean)
  if (!sentences.length) return [text]
  let first = sentences.shift()
  while (first.length < 24 && sentences.length) first += ' ' + sentences.shift()
  const out = [first]; let rest = ''
  for (const s of sentences) { if (rest && (rest + ' ' + s).length > LIMIT) { out.push(rest); rest = s } else rest = rest ? rest + ' ' + s : s }
  if (rest) { if (rest.length < 16) out[out.length - 1] += ' ' + rest; else out.push(rest) }
  return out
}

// the voice model guesses at very short lines ("Good question." came out at 235 Hz, "Hmm, good question." at 126), so each clip
// is measured and played a little faster or slower to sit at his pitch. returns the playback rate: autocorrelation over voiced
// frames, the median, then the nudge toward him, only as far as still sounds like a voice
const HIS_HZ = 122
export function pitchRate(samples, sampleRate) {
  const step = Math.max(1, Math.round(sampleRate / 8000)), x = []
  for (let i = 0; i + step <= samples.length; i += step) x.push(samples[i])
  const sr = sampleRate / step, N = Math.round(sr * .04), lo = Math.round(sr / 320), hi = Math.round(sr / 70), hz = []
  for (let s = 0; s + N + hi < x.length && hz.length < 80; s += N >> 1) {
    let e = 0; for (let i = 0; i < N; i++) e += x[s + i] * x[s + i]
    if (Math.sqrt(e / N) < .02) continue
    let best = 0, lag = 0
    for (let l = lo; l <= hi; l++) { let c = 0, a = 0, b = 0; for (let i = 0; i < N; i++) { c += x[s + i] * x[s + i + l]; a += x[s + i] * x[s + i]; b += x[s + i + l] * x[s + i + l] } const v = c / (Math.sqrt(a * b) || 1); if (v > best) { best = v; lag = l } }
    if (best > .75) hz.push(sr / lag)
  }
  if (hz.length < 4) return 1
  hz.sort((a, b) => a - b)
  const rate = HIS_HZ / hz[hz.length >> 1]
  return Math.abs(rate - 1) < .05 ? 1 : Math.max(.8, Math.min(1.2, rate))
}
