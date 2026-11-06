// his side of the call: the stage engine runs as on stream, and what the page wants him to do goes in as the show's
// own events (a 'say' with timed words, gestures on their words, a babble voice his mouth follows; acts and moves
// from his library)
import { get, set, live, spokenName } from './store.js'
import { pieces } from './voicetext.js'

export const stage = () => (typeof window !== 'undefined' ? window.stage : null)
export const emit = (m) => window.__show && window.__show.emit(m)
export const move = (name) => emit({ type: 'move', name })
export const fx = (f) => { try { stage()?.fx.start(f) } catch {} }
export const pick = (a) => a[Math.floor(Math.random() * a.length)]

// his voice: a soft babble, one blip a syllable
const syl = (w) => Math.max(1, (w.toLowerCase().match(/[aeiouy]+/g) || []).length)
async function babble(words, dur) {
  const sr = 22050, off = new OfflineAudioContext(1, Math.ceil((dur + .3) * sr), sr)
  for (const [w, t0] of words) {
    const n = syl(w), step = Math.min(.12, .24 / n)
    for (let k = 0; k < n; k++) {
      const o = off.createOscillator(), g = off.createGain(), t = t0 + k * step
      o.type = 'triangle'; o.frequency.value = 190 + Math.random() * 70
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + step * .9)
      o.connect(g).connect(off.destination); o.start(t); o.stop(t + step)
    }
  }
  const buf = await off.startRendering(), d = buf.getChannelData(0), wav = new DataView(new ArrayBuffer(44 + d.length * 2))
  const str = (o, s) => [...s].forEach((c, i) => wav.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF'); wav.setUint32(4, 36 + d.length * 2, true); str(8, 'WAVEfmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 1, true)
  wav.setUint32(24, sr, true); wav.setUint32(28, sr * 2, true); wav.setUint16(32, 2, true); wav.setUint16(34, 16, true); str(36, 'data'); wav.setUint32(40, d.length * 2, true)
  for (let i = 0; i < d.length; i++) wav.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true)
  return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
}

// his real voice (Flux, through /api/voice): the line's mp3 and how long it runs. the words get their times from that
// length, shared out by syllables and the pauses at punctuation, so the captions and his gestures land with the audio.
// slow (over 4.5 s), down or out of budget: null, and he babbles
async function voice(text, wait = 4500, soft = false) {
  try {
    const res = await fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, soft }), signal: AbortSignal.timeout(wait) })
    if (!res.ok) return null
    const mp3 = await res.arrayBuffer(), ctx = stage()?.audio
    const dur = ctx ? (await ctx.decodeAudioData(mp3.slice(0))).duration : null
    return dur ? { url: URL.createObjectURL(new Blob([mp3], { type: 'audio/mpeg' })), dur } : null
  } catch { return null }
}
const weight = (w) => .1 + syl(w) * .085 + (/[.,?!;:]$/.test(w) ? .28 : 0)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// one line at a time: a new line waits for the one he's saying (the engine plays whatever it's given at once, so two
// lines would talk over each other). every sentence's voice is asked for the moment the line is, so he starts on the
// first while the rest are still being made; say() resolves when he's finished talking
let lineId = 0, queue = Promise.resolve()
/** @param {string} text @param {{ mark?: string | null, act?: string | null, still?: boolean, soft?: boolean }} [o] */
export function say(text, { mark = null, act = null, still = false, soft = false } = {}) {   // still: he's fed up, his hands stay down after the first gesture
  text = text.replace(/,? \{name\}/g, (m) => { const n = spokenName(get().name); return n ? m.replace('{name}', n) : '' })
  const parts = pieces(text), voices = parts.map((p, i) => voice(p, i ? 12000 : 4500, soft))   // later pieces are made while earlier ones play
  const turn = queue.then(async () => {
    set((s) => ({ log: [...s.log, { who: 'him', text }] }))
    for (const [i, part] of parts.entries()) {
      const ws = part.split(/\s+/).filter(Boolean), real = await voices[i]
      const words = []; let t = .15
      if (real) {   // shared out over the real audio: a small lead-in, the rest by weight
        const lead = .12, scale = Math.max(.2, real.dur - lead - .15) / ws.reduce((s, w) => s + weight(w), 0)
        t = lead; for (const w of ws) { words.push([w, t]); t += weight(w) * scale }
      } else for (const w of ws) { words.push([w, t]); t += weight(w) }
      const dur = real ? real.dur : t + .2, url = real ? real.url : await babble(words, dur)
      // his own mark opens the line; after it, and on lines with none, a sentence of any length gets talking hands
      const m = mark && !i ? mark : !act && !still && ws.length >= 5 ? 'explain' : null
      emit({ type: 'say', id: `p${++lineId}`, text: part, url, words, dur, marks: m ? [[0, m]] : [], act: i ? null : act })
      live.lastSaid = performance.now() + dur * 1000
      await sleep(dur * 1000 + 140)
    }
  })
  queue = turn.catch(() => {})
  return turn
}

export async function wakeAudio() { try { const a = stage()?.audio; if (a && a.state === 'suspended') await a.resume() } catch {} }
