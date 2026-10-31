'use client'
// the call: two tiles side by side. his room in his (poke anything in it; what he shows you is shared there), your
// character in yours. under his, who he is; under yours, what you can ask. the controls below
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { get, set, useMeet } from '../store.js'
import { ask } from '../brain.js'
import { stage } from '../show.js'
import { camera, micButton, warm } from '../you.js'
import { under, tap, giveBack } from '../room.js'
import { StageView } from './Stage'
import { YouTile } from './YouTile'
import { Mooney, Contact } from './Share'
import { Sources, Notebook } from './Notes'
import { Shared } from './minis'
import { Mic, Cam, Sound, Skip, Chat, Hang, Send } from './icons'
import s from './meet.module.css'

export function Call({ live, onLeave }: { live: boolean; onLeave: () => void }) {
  const m = useMeet()
  const sharing = !!m.share
  return (
    <div className={`${s.call} ${live ? s.callLive : ''}`}>
      <div className={s.topline}>Interview with Ashwini <Timer /></div>
      <div className={s.tiles}>
        <div className={s.hisTile} data-his-tile>
          <motion.div layout transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className={!live ? s.stageFull : sharing ? (m.share === 'shelf' || String(m.share).startsWith('mini:') ? s.stagePipTop : s.stagePip) : s.stageTile}>
            <StageView className={s.stageBox} />
          </motion.div>
          {live && !sharing && <TapLayer />}
          {live && <span className={s.tileName}>Ashwini</span>}
          <AnimatePresence>
            {live && sharing && (
              <motion.div className={s.share} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .97 }}>
                <span className={s.presenting}>Ashwini is presenting</span>
                <button className={s.stopShare} onClick={() => set({ share: null })}>Stop sharing</button>
                {m.share === 'mooney' ? <Mooney /> : m.share === 'sources' ? <Sources /> : m.share === 'notebook' ? <Notebook /> : m.share === 'shelf' || String(m.share).startsWith('mini:') ? <Shared /> : <Contact bye={m.share === 'bye'} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className={s.meTile}>
          {live && <YouTile>
            <span className={s.tileName}>{m.name || 'You'}{m.cam && <i> · moving with you</i>}</span>
            {!m.mic && <span className={s.muted}><Mic /></span>}
            <AnimatePresence>{m.gesture && m.cam && <GestureTag key={m.gesture.id} label={m.gesture.label} />}</AnimatePresence>
            {m.debugSees && <span className={s.debugSees}>{m.debugSees}</span>}
            <AnimatePresence>{m.myCap && <motion.div key={m.myCap} className={s.myCap} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{m.myCap}</motion.div>}</AnimatePresence>
            <AnimatePresence>{m.mine && <motion.button key={m.mine} className={`${s.mine} ${m.mine === 'can' ? s.mineCan : ''}`} title="Give it back" onClick={giveBack}
              initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} />}</AnimatePresence>
          </YouTile>}
          <AnimatePresence>{m.transcript && <Transcript />}</AnimatePresence>
        </div>
      </div>
      <motion.div className={s.under} initial={false} animate={{ opacity: live ? 1 : 0 }}>
        <div className={s.plate}>
          <div className={s.plateName}>Ashwini Tiwari</div>
          <div className={s.role}>Builds AI systems end to end, from idea to live.</div>
          <div className={s.tags}><span className={s.open}>Open to full-time, remote</span><span>India · IST</span><span>Founder, Octyn</span></div>
        </div>
        <Ask />
      </motion.div>
      <motion.div className={s.controls} initial={false} animate={{ opacity: live ? 1 : 0, y: live ? 0 : 20 }}>
        <button className={`${s.rb} ${m.mic ? (m.listening ? s.listening : '') : s.struck}`} onClick={micButton} title="Talk to him"><Mic /></button>
        <button className={`${s.rb} ${m.cam ? s.lit : s.struck}`} onPointerEnter={warm} onClick={() => camera(!get().cam)} title="Your camera moves your character"><Cam /></button>
        <button className={`${s.rb} ${m.muted ? s.struck : ''}`} onClick={() => { const v = !get().muted; stage()?.sound.mute(v); set({ muted: v }) }} title="Sound"><Sound on={!m.muted} /></button>
        <div className={s.songbox}><span id="song" className={s.song} /><button className={s.rb} onClick={() => stage()?.sound.skip()} title="Next song"><Skip /></button></div>
        <button className={`${s.rb} ${m.transcript ? s.lit : ''}`} onClick={() => set({ transcript: !get().transcript })} title="Transcript"><Chat /></button>
        <span className={s.sep} />
        <button className={s.leave} onClick={onLeave}><Hang />Leave</button>
      </motion.div>
    </div>
  )
}

function Timer() {
  const { joinedAt } = useMeet(); const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t) }, [])
  const sec = joinedAt ? Math.floor((performance.now() - joinedAt) / 1000) : 0
  return <b>{Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</b>
}

// what you can ask: type or talk, and the chips (a yes to his offer is one of them)
function Ask() {
  const { chips, interim, cam, offer } = useMeet() as any
  const [q, setQ] = useState('')
  return (
    <div className={s.ask} data-ask>
      <form className={s.askf} onSubmit={(e) => { e.preventDefault(); ask(q); setQ('') }}>
        <input placeholder="Ask him anything" maxLength={160} value={interim || q} onChange={(e) => setQ(e.target.value)} />
        <button aria-label="send"><Send /></button>
      </form>
      <div className={s.chips}>
        <AnimatePresence mode="popLayout">
          {chips.map((c: string) => (
            <motion.button key={c} layout initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .8 }}
              className={c === 'Yes' ? s.chipYes : ''} onClick={() => ask(c)}>{c}</motion.button>
          ))}
        </AnimatePresence>
      </div>
      {cam && offer && <motion.div className={s.guide} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>or just nod, or thumbs up, for yes</motion.div>}
    </div>
  )
}

// the gesture he just saw, a tag in your tile for a moment
function GestureTag({ label }: { label: string }) {
  const [on, setOn] = useState(true)
  useEffect(() => { const t = setTimeout(() => setOn(false), 1600); return () => clearTimeout(t) }, [])
  return on && label ? <motion.span className={s.gestureTag} initial={{ opacity: 0, y: -8, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>{label}</motion.span> : null
}

function Transcript() {
  const { log, name } = useMeet()
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [log.length])
  return (
    <motion.div className={s.transcript} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
      {log.map((l: any, i: number) => <div key={i} className={l.who === 'him' ? s.msgHim : s.msgYou}><span>{l.who === 'him' ? 'Ashwini' : name || 'You'}</span>{l.text}</div>)}
      <div ref={end} />
    </motion.div>
  )
}

// poking around his tile: your mitten for a cursor, what's under it, a ring where you tap
function TapLayer() {
  const { look } = useMeet() as any
  const el = useRef<HTMLDivElement>(null)
  const [p, setP] = useState<{ x: number; y: number; name: string } | null>(null)
  const [rings, setRings] = useState<{ x: number; y: number; id: number }[]>([])
  const last = useRef(0)
  const at = (e: React.PointerEvent) => { const r = el.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height } }
  return (
    <div ref={el} className={s.tapLayer}
      onPointerMove={(e) => { const a = at(e); const now = performance.now(); let name = p?.name || ''; if (now - last.current > 120) { last.current = now; name = under(a.x, a.y, a.w, a.h)?.name || '' } setP({ x: a.x, y: a.y, name }) }}
      onPointerLeave={() => setP(null)}
      onPointerDown={(e) => { e.preventDefault(); const a = at(e); tap(a.x, a.y, a.w, a.h); const id = Math.random(); setRings((r) => [...r, { x: a.x, y: a.y, id }]); setTimeout(() => setRings((r) => r.filter((z) => z.id !== id)), 500) }}>
      {rings.map((r) => <motion.i key={r.id} className={s.ring} style={{ left: r.x, top: r.y }} initial={{ scale: .3, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: .5 }} />)}
      {p && <>
        <svg className={s.mitten} style={{ left: p.x, top: p.y }} viewBox="-30 -40 60 80">
          <g stroke="#4A3A44" strokeWidth="2.4" transform="rotate(-20)">
            <ellipse cx="0" cy="30" rx="16" ry="7" fill={look.top} />
            {[[-9, -15, -12], [0, -19, 0], [9, -15, 12]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="5.5" ry="10" transform={`rotate(${r} ${x} ${y})`} fill={look.skin} />)}
            <ellipse cx="-15" cy="4" rx="5.5" ry="9" transform="rotate(-50 -15 4)" fill={look.skin} /><ellipse cx="0" cy="5" rx="15" ry="14" fill={look.skin} />
          </g>
        </svg>
        {p.name && <span className={s.hoverName} style={{ left: p.x + 26, top: p.y - 46 }}>{p.name}</span>}
      </>}
    </div>
  )
}
