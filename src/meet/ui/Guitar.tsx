'use client'
// his guitar, handed over: a close-up you actually play. a finger or a mouse dragged across the strings plucks each one it
// crosses; with the camera on, one hand holds up fingers for the chord and the other sweeps up and down over the strings
// (gestures.js passes the hands through live.guitar). every string is its own plucked note, so a slow sweep is an arpeggio
import { useEffect, useRef, useState } from 'react'
import { live, note, useMeet } from '../store.js'
import { stage, say } from '../show.js'
import { moodTier } from '../behaviour.js'
import { camera, warm } from '../you.js'
import s from './meet.module.css'

const OPEN = [82.41, 110, 146.83, 196, 246.94, 329.63]   // low E at the top, as it looks with it in your lap
const CHORDS: Record<string, (number | null)[]> = { Am: [null, 0, 2, 2, 1, 0], C: [null, 3, 2, 0, 1, 0], G: [3, 2, 0, 0, 0, 3], Em: [0, 2, 2, 0, 0, 0], D: [null, null, 0, 2, 3, 2], F: [1, 3, 3, 2, 1, 1] }
const NAMES = Object.keys(CHORDS)
const BY_FINGERS: Record<string, string> = { one: 'Am', two: 'C', three: 'G', four: 'Em', open: 'Em' }
const BAND = [.2, .8], FRETS = 4.4
// what he says over it, the longer you keep playing: low and unhurried, like the narration on a quiet film. written, because a
// model couldn't be both this soft and this true: every line comes from his notes. drafts, for him to correct
export const OVER_THE_GUITAR = [
  'Keep going. The cat likes this one.',
  'I started out cutting montages for streamers, back in 2018.',
  'Then came the years of sculpting faces, one small crease at a time.',
  'Two thousand masks came out of eight animated pieces.',
  'I studied history. Mostly it taught me to ask who wrote a thing, and why.',
  'There is a crochet brand in here somewhere too, priced by how hard each piece is to make.',
  'Somewhere, someone is saying what they spent out loud, and a small cow writes it down.',
  'And this room. A TV for a head, a cat on the desk, and you, still playing.',
  'It is quiet here. Stay as long as you like.',
]

export function Guitar() {
  const { cam, camWaking } = useMeet()
  const box = useRef<HTMLCanvasElement>(null), [chord, setChord] = useState('Am'), chordRef = useRef('Am')
  const pick = (c: string) => { chordRef.current = c; setChord(c) }

  useEffect(() => {
    const cv = box.current!, g = cv.getContext('2d')!, amp = [0, 0, 0, 0, 0, 0], pointers = new Map<number, number>()
    // the longer you play, the more he talks. time spent actually playing, not time with it open; he stops when you stop
    let playedFor = 0, lastPlay = 0, lastFrame = performance.now(), nextMuse = 9, beat = 0, musing = false
    const museOver = async () => {
      const line = OVER_THE_GUITAR[beat]; if (!line) return
      musing = true; beat++
      await say(line, { still: true, soft: true }).catch(() => {})
      nextMuse = playedFor + 8 + Math.random() * 5; musing = false
    }
    let w = 1, h = 1, raf = 0, played = false, tracked: number | null = null, held = { name: '', at: 0 }, alive = true
    const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); w = r.width; h = r.height; cv.width = w * d; cv.height = h * d; g.setTransform(d, 0, 0, d, 0, 0) }
    const ro = new ResizeObserver(size); ro.observe(cv); size()
    const yOf = (i: number) => h * (BAND[0] + (BAND[1] - BAND[0]) * i / 5)
    const pluck = (i: number, vel = .8, delay = 0) => {
      const fret = CHORDS[chordRef.current][i]; if (fret == null) return
      stage()?.sound.pluck(i, OPEN[i] * 2 ** (fret / 12), vel, delay); amp[i] = Math.min(7, 3 + vel * 5); lastPlay = performance.now()
      if (!played) { played = true; note('played my guitar', 'cat:guitar') }
    }
    // every string between two heights, in the order you'd hit them
    const cross = (a: number, b: number) => {
      const down = b > a, vel = Math.max(.45, Math.min(1, Math.abs(b - a) / (h * .28))); let n = 0
      for (let k = 0; k < 6; k++) { const i = down ? k : 5 - k, y = yOf(i); if (down ? a < y && y <= b : b <= y && y < a) pluck(i, vel, .012 * n++) }
    }
    const fx = (f: number) => w * (.04 + .56 * f / FRETS)
    const draw = (t: number) => {
      g.clearRect(0, 0, w, h)
      const top = h * .1, bot = h * .9, ink = '#3A2C34'; g.lineJoin = 'round'
      // the body, past the neck
      g.fillStyle = '#C9975F'; g.strokeStyle = ink; g.lineWidth = 2.5; g.beginPath(); g.roundRect(w * .56, 4, w * .44 - 4, h - 8, 26); g.fill(); g.stroke()
      const hx = w * .79, hr = Math.min(h * .25, w * .13)
      g.strokeStyle = '#F1D9A8'; g.lineWidth = 5; g.beginPath(); g.arc(hx, h / 2, hr + 7, 0, 7); g.stroke()
      g.fillStyle = '#17120F'; g.beginPath(); g.arc(hx, h / 2, hr, 0, 7); g.fill()
      // the neck, frets, the nut
      g.fillStyle = '#4A3A30'; g.strokeStyle = ink; g.lineWidth = 2.5; g.beginPath(); g.rect(-4, top, w * .62, bot - top); g.fill(); g.stroke()
      g.fillStyle = '#C9BFAE'; for (let f = 1; f <= 4; f++) g.fillRect(fx(f) - 1.5, top + 1, 3, bot - top - 2)
      g.fillStyle = '#EDE8DD'; g.fillRect(fx(0) - 4, top + 1, 7, bot - top - 2)
      g.fillStyle = '#B9A68E'; g.beginPath(); g.arc((fx(2) + fx(3)) / 2, h / 2, 6, 0, 7); g.fill()
      // where the fingers go for this chord
      const frets = CHORDS[chordRef.current]
      frets.forEach((f, i) => { const y = yOf(i); if (f) { g.fillStyle = '#F1D9A8'; g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.arc((fx(f - 1) + fx(f)) / 2, y, Math.min(11, h * .032), 0, 7); g.fill(); g.stroke() } })
      // the strings, each shaking as long as it rings
      for (let i = 0; i < 6; i++) {
        amp[i] *= .955; const y = yOf(i), muted = frets[i] == null
        g.strokeStyle = i < 3 ? '#C9A76A' : '#EDE8DD'; g.globalAlpha = muted ? .28 : 1; g.lineWidth = 3.4 - i * .42
        g.beginPath(); for (let x = 0; x <= w; x += 8) { const u = x / w, dy = amp[i] * Math.sin(Math.PI * u) * Math.sin(t * (.06 + i * .007)); if (x) g.lineTo(x, y + dy); else g.moveTo(x, y + dy) } g.stroke(); g.globalAlpha = 1
      }
      // your hand, in the air
      if (tracked != null) { g.fillStyle = '#E3A94F'; g.strokeStyle = ink; g.lineWidth = 2; g.beginPath(); g.arc(w * .79, tracked, 11, 0, 7); g.fill(); g.stroke() }
    }
    const loop = (t: number) => {
      if (!alive) return
      const v = live.guitar as { y: number | null; at: number; shape: string | null } | undefined, now = performance.now()
      if (v && v.y != null && now - v.at < 300) {
        const want = h * (BAND[0] - .06 + (BAND[1] - BAND[0] + .12) * Math.max(0, Math.min(1, (v.y - .25) / .5)))
        if (tracked == null) tracked = want
        else { const next = tracked + (want - tracked) * .75; if (Math.abs(next - tracked) > 2.5) { cross(tracked, next); tracked = next } }   // a still hand's jitter crosses nothing
      } else tracked = null
      const name = v && now - v.at < 300 && v.shape ? BY_FINGERS[v.shape] : ''
      if (name && name !== held.name) held = { name, at: now }
      if (name && name === held.name && now - held.at > 140 && name !== chordRef.current) pick(name)
      const dt = (now - lastFrame) / 1000; lastFrame = now
      if (now - lastPlay < 2500) { playedFor += dt; if (!musing && playedFor > nextMuse && moodTier() === 0) museOver() }
      draw(t); raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const hello = setTimeout(() => cross(yOf(0) - 1, yOf(5) + 1), 350)   // it's in your hands: one strum to say so
    const yIn = (e: PointerEvent) => e.clientY - cv.getBoundingClientRect().top
    const down = (e: PointerEvent) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const y = yIn(e); pointers.set(e.pointerId, y); let best = -1, bd = 16; for (let i = 0; i < 6; i++) { const d = Math.abs(yOf(i) - y); if (d < bd) { bd = d; best = i } } if (best >= 0) pluck(best, .75); else cross(yOf(0) - 1, yOf(5) + 1) }   // on a string, that string; anywhere else, the whole chord
    const move = (e: PointerEvent) => { const p = pointers.get(e.pointerId); if (p == null) return; const y = yIn(e); cross(p, y); pointers.set(e.pointerId, y) }
    const up = (e: PointerEvent) => { pointers.delete(e.pointerId) }
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up)
    const key = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.tagName === 'INPUT') return; const c = NAMES[+e.key - 1]; if (c) pick(c) }
    addEventListener('keydown', key)
    stage()?.sound.playing(true)   // the music gets out of the way while you play
    return () => { alive = false; clearTimeout(hello); cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); ro.disconnect(); removeEventListener('keydown', key); stage()?.sound.playing(false); live.guitar = undefined }
  }, [])

  return (
    <div className={s.gtr}>
      <div className={s.gtrTop}><b>{chord}</b><span>{cam ? (camWaking ? 'waking up the tracker…' : 'one hand holds up fingers for the chord, the other sweeps over the strings') : 'tap it, or drag across the strings'}</span></div>
      <canvas ref={box} className={s.gtrCanvas} />
      <div className={s.gtrChords}>{NAMES.map((n) => <button key={n} className={n === chord ? s.gtrOn : ''} onClick={() => pick(n)}>{n}</button>)}</div>
      {cam
        ? <div className={s.gtrLegend}>1 finger Am · 2 C · 3 G · 4 Em</div>
        : <button className={s.gtrCam} onPointerEnter={warm} onClick={() => camera(true)}>Turn your camera on and strum it in the air</button>}
    </div>
  )
}
