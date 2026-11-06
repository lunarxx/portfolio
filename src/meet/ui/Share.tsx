'use client'
// what he shares in his tile. mooney, as the app looks: warm paper, a white receipt torn at the bottom, plex mono,
// category bars, the terracotta mic; type or say what you spent and it logs. and his contact card
import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { get, set } from '../store.js'
import { say } from '../show.js'
import { offerNext, EMAIL } from '../brain.js'
import { Mic, Pen, Camera, Left, Right } from './icons'
import s from './meet.module.css'

const CUR = typeof navigator === 'undefined' ? '$' : (() => { const l = navigator.language || ''; return /-IN$/i.test(l) ? '₹' : /-GB$/i.test(l) ? '£' : /^(de|fr|es|it|nl|pt|fi|el)\b/i.test(l) ? '€' : '$' })()
type Cat = [string, string, RegExp?]
const CATS: Cat[] = [
  ['food & drink', '#D4622A', /chai|coffee|tea|latte|lunch|dinner|breakfast|food|pizza|snack|burger|biryani|samosa|zomato|swiggy|groceries|beer|drinks?|cafe|sandwich/i],
  ['transport', '#3A6F9F', /uber|ola|lyft|auto|metro|bus|cab|taxi|fuel|petrol|gas|train|rapido|parking|subway/i],
  ['shopping', '#C49A1A', /amazon|flipkart|shoes?|shirt|clothes|jeans|shopping|myntra|zara|gift/i],
  ['entertainment', '#7A4BC9', /movie|cinema|netflix|spotify|concert|game|tickets?|bowling/i],
  ['health', '#C4624A', /medicine|doctor|gym|pharmacy|meds|dentist|pills/i],
  ['utilities', '#2A6B4F', /electricity|wifi|internet|recharge|bill|rent|phone|water/i],
  ['travel', '#1A7A9A', /flight|hotel|trip|airbnb|hostel|visa/i],
  ['client & work', '#4A4AAF', /client|office|software|domain|server|laptop|figma|notion/i],
]
const catOf = (t: string): Cat => CATS.find(([, , re]) => re!.test(t)) || ['other', '#7A7670']
type Row = { t: string; a: number; c: Cat; time: string; id: number }
let rid = 0
function parse(text: string) {
  return text.toLowerCase().replace(/[₹$£€]|rs\.?|rupees?|bucks|dollars?|inr|usd/g, ' ').split(/\s*(?:,| and | & |\+)\s*/).map((p) => {
    const amt = (p.match(/(\d+(?:\.\d+)?)/) || [])[1]; if (!amt) return null
    const what = p.replace(amt, ' ').replace(/\b(i|spent|paid|bought|got|for|on|a|an|the|to|at|of|just|today|some)\b/g, ' ').replace(/\s+/g, ' ').trim() || 'something'
    return { t: what[0].toUpperCase() + what.slice(1), a: +amt, c: catOf(what) }
  }).filter(Boolean) as { t: string; a: number; c: Cat }[]
}
const clock = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const title = (x: string) => x.replace(/\b\w/g, (c) => c.toUpperCase())

export function Mooney() {
  const [rows, setRows] = useState<Row[]>([
    { t: 'Coffee', a: 5, c: CATS[0], time: '9:12 AM', id: rid++ }, { t: 'Metro card', a: 20, c: CATS[1], time: '10:03 AM', id: rid++ }, { t: 'Lunch', a: 14, c: CATS[0], time: '1:40 PM', id: rid++ },
  ])
  const [hint, setHint] = useState('Hold the mic, type "coffee 5", or scan a receipt'), [v, setV] = useState(''), [rec, setRec] = useState(false)
  const logged = useRef(0), sr = useRef<any>(null)
  const add = (text: string) => {
    const got = parse(text)
    if (!got.length) { setHint('No amount in that. Try "coffee 5"'); return }
    setRows((r) => [...got.reverse().map((g) => ({ ...g, time: clock(new Date()), id: rid++ })), ...r]); setHint('')
    if (++logged.current === 1) setTimeout(() => { say(got.length > 1 ? `${got.length} in one go, each on its own line. That's Mooney.` : "Logged. That's Mooney. Want to see the front desk next?", { mark: 'thumbs_up' }); offerNext('desk', 'The front desk') }, 400)
    else say('Logged.', { mark: 'thumbs_up' })
  }
  // the camera: a photo of a receipt, made small here, read on the server, one row back
  const photo = useRef<HTMLInputElement>(null), [reading, setReading] = useState(false)
  const scan = async (file?: File) => {
    if (!file) return
    setReading(true); setHint('Reading your receipt...')
    try {
      const bmp = await createImageBitmap(file), k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height)), cv = document.createElement('canvas')
      cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k); cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close()
      const res = await fetch('/api/receipt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ image: cv.toDataURL('image/jpeg', .82).split(',')[1] }) })
      const r = await res.json()
      if (!res.ok || !(r.total > 0)) { setHint("Couldn't find a total on that one. Try a clearer photo"); return }
      setRows((x) => [{ t: r.merchant || 'Receipt', a: r.total, c: catOf(`${r.merchant || ''} ${r.kind || ''}`), time: clock(new Date()), id: rid++ }, ...x]); setHint('')
      if (++logged.current === 1) setTimeout(() => { say("Read it off the photo. That's Mooney. Want to see the front desk next?", { mark: 'thumbs_up' }); offerNext('desk', 'The front desk') }, 400)
      else say('Logged.', { mark: 'thumbs_up' })
    } catch { setHint("Couldn't read that one. Try again?") } finally { setReading(false); if (photo.current) photo.current.value = '' }
  }
  const SR = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  const down = (e: React.PointerEvent) => {
    e.preventDefault(); if (!SR) return
    const r = new SR(); r.lang = navigator.language || 'en-US'; r.interimResults = true
    r.onresult = (ev: any) => { const x = ev.results[ev.results.length - 1]; setV(x[0].transcript); if (x.isFinal) { add(x[0].transcript); setV('') } }
    r.onend = () => setRec(false); r.start(); sr.current = r; setRec(true)
  }
  const up = () => { sr.current?.stop(); sr.current = null }
  const total = rows.reduce((t, r) => t + r.a, 0)
  return (
    <motion.div className={s.phone} initial={{ y: 40, opacity: 0, scale: .95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
      <div className={s.scr}>
        <div className={s.sb}><span>{clock(new Date()).replace(/ (AM|PM)/, '')}</span><span>▴▴ ▮</span></div>
        <div className={s.hd}><div className={s.day}><Left /><span>Today</span><Right /></div><img src="/meet/stage/mooney-cow.png" alt="" /></div>
        <div className={s.tot}><motion.b key={total} initial={{ y: -6, opacity: .4 }} animate={{ y: 0, opacity: 1 }}>{CUR}{total.toLocaleString()}</motion.b><span>Spent today</span></div>
        <div className={s.rcpt}>
          <div className={s.rlbl}>RECEIPT · TODAY</div>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.div key={r.id} layout className={s.rrow} initial={{ opacity: 0, y: -14, backgroundColor: '#F5DCD0' }} animate={{ opacity: 1, y: 0, backgroundColor: '#ffffff00' }} transition={{ duration: .6 }}>
                <i style={{ background: r.c[1] }} />
                <div><div className={s.l1}><span>{r.t}</span><b>{CUR}{r.a}</b></div><div className={s.l2}><span>{title(r.c[0])}</span><span>{r.time}</span></div></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className={s.hint}>{hint}</div>
        <div className={s.ib}>
          <div className={s.pill}><Pen /><input placeholder="What did you spend?" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) { add(v); setV('') } }} /><button aria-label="scan a receipt" title="Scan a receipt. The photo is read and not kept." disabled={reading} onClick={() => photo.current?.click()}><Camera /></button><input ref={photo} type="file" accept="image/*" hidden onChange={(e) => scan(e.target.files?.[0])} /></div>
          <button className={`${s.mmic} ${rec ? s.rec : ''}`} aria-label="hold to talk" onPointerDown={down} onPointerUp={up} onPointerLeave={up}><Mic /></button>
        </div>
      </div>
      <a className={s.real} href="https://play.google.com/store/apps/details?id=com.octyn.mooney" target="_blank" rel="noreferrer">The real one is on Google Play</a>
    </motion.div>
  )
}

export function Contact({ bye }: { bye: boolean }) {
  const name = get().name
  return (
    <motion.div className={s.card} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <h3>{bye ? `Thanks${name ? `, ${name}` : ''}` : 'Reach Ashwini'}</h3>
      <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      <div>
        <a href="/resume">Resume</a><a href="https://linkedin.com/in/ashwtiw" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://x.com/ashwtiw" target="_blank" rel="noreferrer">X</a><a href="https://github.com/lunarxx" target="_blank" rel="noreferrer">GitHub</a>
      </div>
      {bye && <button className={s.again} onClick={() => set({ share: null })}>Back to the call</button>}
    </motion.div>
  )
}
