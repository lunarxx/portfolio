'use client'
// the call: two tiles side by side. his room in his (poke anything in it; what he shows you is shared there), your
// character in yours. under his, who he is; under yours, what you can ask. the controls below
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { get, set, useMeet } from '../store.js'
import { ask } from '../brain.js'
import { stage } from '../show.js'
import { camera, micButton, warm } from '../you.js'
import { under, tap, giveBack, lookAround, resetView } from '../room.js'
import { StageView } from './Stage'
import { YouTile } from './YouTile'
import { Mooney, Contact } from './Share'
import { Sources, Notebook } from './Notes'
import { Shared } from './minis'
import { Brief, Cases } from './Brief'
import { Guitar } from './Guitar'
import { Agenda } from './Agenda'
import { Mic, Cam, Skip, Chat, Hang, Send } from './icons'
import { VoiceMute, MusicMute, Volume } from './SoundControls'
import { PhoneMenu } from './PhoneMenu'
import s from './meet.module.css'

export function Call({ live, onLeave }: { live: boolean; onLeave: () => void }) {
  const m = useMeet()
  const sharing = !!m.share, phone = usePhone(), tiles = useRef<HTMLDivElement>(null)
  return (
    <div className={`${s.call} ${live ? s.callLive : ''} ${sharing ? s.sharing : ''}`}>
      <div className={s.topRow}>
        <div className={s.topline}>
          <span className={s.topTitle}>Interview with Ashwini</span>
          {/* a phone has no room for the plate under his tile: who he is sits up here instead */}
          <span className={s.topWho}><span className={s.topName}>Ashwini Tiwari</span><span className={s.topSub}>Open to remote · Cofounder, Octyn</span></span>
          <Timer />
        </div>
        <Agenda />
      </div>
      <div className={s.tiles} ref={tiles}>
        <div className={s.hisTile} data-his-tile>
          <motion.div layout transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className={!live ? s.stageFull : sharing ? (phone || m.share === 'shelf' || m.share === 'brief' || m.share === 'cases' || m.share === 'guitar' || String(m.share).startsWith('mini:') ? s.stagePipTop : s.stagePip) : s.stageTile}>
            <StageView className={s.stageBox} />
          </motion.div>
          {live && !sharing && <TapLayer />}
          {live && <span className={s.tileName}>Ashwini Tiwari</span>}
          {live && !sharing && m.viewMoved && <button className={s.resetView} onClick={resetView}>Back to the desk</button>}
          <AnimatePresence>
            {live && sharing && (
              <motion.div className={s.share} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .97 }}>
                <ShareCaption />
                <span className={s.presenting}><i>Ashwini is </i>presenting</span>
                <button className={s.stopShare} onClick={() => set({ share: null })}><span className={s.stopWide}>Stop sharing</span><span className={s.stopNarrow}>Back to call</span></button>
                <ShareFit>{m.share === 'guitar' ? <Guitar /> : m.share === 'brief' ? <Brief /> : m.share === 'cases' ? <Cases /> : m.share === 'mooney' ? <Mooney /> : m.share === 'sources' ? <Sources /> : m.share === 'notebook' ? <Notebook /> : m.share === 'shelf' || String(m.share).startsWith('mini:') ? <Shared /> : <Contact bye={m.share === 'bye'} />}</ShareFit>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* yours: beside his on a computer; on a phone, a little window over his room you can drag out of the way */}
        <motion.div key={phone ? 'pip' : 'tile'} className={s.meTile} drag={phone && live} dragConstraints={tiles} dragElastic={.12} dragMomentum={false} whileDrag={{ scale: 1.04 }}>
          {live && <YouTile>
            <span className={s.tileName}>{m.name || 'You'}{m.cam && <i> · moving with you</i>}</span>
            {!m.mic && <span className={s.muted}><Mic /></span>}
            {!m.cam && m.camNote && <span className={s.waking}>{m.camNote}</span>}
            <AnimatePresence>{m.gesture && m.cam && <GestureTag key={m.gesture.id} label={m.gesture.label} />}</AnimatePresence>
            {m.debugSees && <span className={s.debugSees}>{m.debugSees}</span>}
            {m.cam && <MoveHint />}
            <AnimatePresence>{m.myCap && <motion.div key={m.myCap} className={s.myCap} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{m.myCap}</motion.div>}</AnimatePresence>
            <AnimatePresence>{m.mine && <motion.button key={m.mine} className={`${s.mine} ${m.mine === 'can' ? s.mineCan : ''}`} title="Give it back" onClick={giveBack}
              initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} />}</AnimatePresence>
          </YouTile>}
          <AnimatePresence>{m.transcript && <Transcript />}</AnimatePresence>
        </motion.div>
      </div>
      <motion.div className={s.under} initial={false} animate={{ opacity: live ? 1 : 0 }}>
        <div className={s.plate}>
          <div className={s.role}>I teach machines the unglamorous parts of real jobs, then stay until people trust them.</div>
          <div className={s.facts}>Open to full-time, remote · India, IST · Cofounder, Octyn</div>
        </div>
        <Ask />
      </motion.div>
      <motion.div className={s.controls} initial={false} animate={{ opacity: live ? 1 : 0, y: live ? 0 : 20 }}>
        <button className={`${s.rb} ${m.mic ? (m.listening ? s.listening : '') : s.struck}`} onClick={micButton} title="Talk to him"><Mic /></button>
        <div className={s.camWrap}>
          {live && !m.cam && !sharing && <CamHint />}
          <button className={`${s.rb} ${m.cam ? s.lit : s.struck}`} onPointerEnter={warm} onClick={() => camera(!get().cam)} title="Your camera moves your character"><Cam /></button>
        </div>
        {/* two separate mutes: him, and the room (the music and his keyboard) */}
        <PhoneMenu call />
        <span className={s.deskOnly}><VoiceMute /></span>
        <div className={s.songbox}>
          <MusicMute className={s.songMute} />
          <span id="song" className={s.song} />
          <button className={`${s.rb} ${s.songNext}`} onClick={() => stage()?.sound.skip()} title="Next song"><Skip /></button>
        </div>
        <Volume />
        <button className={`${s.rb} ${s.deskBtn} ${m.transcript ? s.lit : ''}`} onClick={() => set({ transcript: !get().transcript })} title="Transcript"><Chat /></button>
        <span className={s.sep} />
        <button className={s.leave} onClick={onLeave}><Hang />Leave</button>
      </motion.div>
    </div>
  )
}

// a phone-sized screen (the call's layout switches with the CSS at the same width)
const PHONE = '(max-width: 860px)'
function usePhone() {
  return useSyncExternalStore((f) => { const q = matchMedia(PHONE); q.addEventListener('change', f); return () => q.removeEventListener('change', f) }, () => matchMedia(PHONE).matches, () => false)
}

// his captions, while he's small in the corner: the same words the engine writes on his picture, down where you can read them
function ShareCaption() {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const cap = document.getElementById('cap'), el = box.current; if (!cap || !el) return
    const copy = () => { el.innerHTML = cap.innerHTML; el.style.display = cap.innerHTML ? '' : 'none' }
    copy(); const mo = new MutationObserver(copy); mo.observe(cap, { childList: true, subtree: true, characterData: true, attributes: true })
    return () => mo.disconnect()
  }, [])
  return <div ref={box} className={s.shareCap} aria-live="polite" />
}

// what he shares is drawn for a tile of about 860 x 520, and scales as one piece to the tile it's really in, so nothing in a
// miniature gets clipped or crushed when the window changes. a phone held upright has its own layouts
function ShareFit({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null), [f, setF] = useState<{ k: number; w: number; h: number } | null>(null)
  useEffect(() => {
    const el = box.current?.parentElement; if (!el) return
    const read = () => {
      const W = el.clientWidth, H = el.clientHeight, vw = innerWidth, vh = innerHeight
      if (vw <= 860 && vh > 500) return setF(null)
      const k = vw <= 860 ? Math.min(1, W / 640, H / 340) : Math.min(1.25, W / 860, H / 520)
      setF({ k, w: W / k, h: H / k })
    }
    read(); const ro = new ResizeObserver(read); ro.observe(el); addEventListener('resize', read)
    return () => { ro.disconnect(); removeEventListener('resize', read) }
  }, [])
  return <div ref={box} className={f ? s.shareFit : s.shareFitOff} style={f ? { zoom: f.k, width: f.w, height: f.h } : undefined}>{children}</div>
}

// what the camera does, said early: a note on the camera button itself, from the moment you're in
function CamHint() {
  const [on, setOn] = useState(true)
  useEffect(() => { const t = setTimeout(() => setOn(false), matchMedia('(max-width: 1240px)').matches ? 7000 : 30000); return () => clearTimeout(t) }, [])   // where there's no spare room it sits over the ask box: a moment, then out of the way
  if (!on) return null
  return <motion.div className={s.camHint} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>turn this on and your character copies your face and hands<small>your video stays in this tab</small></motion.div>
}
// and once it's on, what to try: one thing at a time, on to the next when you do it (or after a while)
const MOVES = [{ want: 'wave', say: 'wave at him' }]
function MoveHint() {
  const { gesture } = useMeet(); const [i, setI] = useState(0)
  useEffect(() => { if (gesture && MOVES[i] && gesture.name === MOVES[i].want) setI(i + 1) }, [gesture, i])
  useEffect(() => { if (i >= MOVES.length) return; const t = setTimeout(() => setI(i + 1), 14000); return () => clearTimeout(t) }, [i])
  return <AnimatePresence mode="wait">{MOVES[i] && <motion.div key={i} className={s.moveHint} initial={{ opacity: 0, y: 8, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -1 }} exit={{ opacity: 0, y: -6 }}>{MOVES[i].say}</motion.div>}</AnimatePresence>
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
    <motion.div className={s.transcript} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
      <button className={s.sheetClose} onClick={() => set({ transcript: false })} aria-label="Close the transcript"><i /></button>
      {!log.length && <div className={s.sheetEmpty}>Nothing said yet.</div>}
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
  // a press that stays put is a tap; one that moves walks his camera round the room
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [touchHint, setTouchHint] = useState(false)
  useEffect(() => { if (!matchMedia('(pointer: coarse)').matches || get().viewMoved) return; setTouchHint(true); const t = setTimeout(() => setTouchHint(false), 6000); return () => clearTimeout(t) }, [])
  const at = (e: React.PointerEvent) => { const r = el.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height } }
  return (
    <div ref={el} className={`${s.tapLayer} ${dragging ? s.tapDragging : ''}`}
      onPointerMove={(e) => {
        const a = at(e), d = press.current
        if (d) {
          if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) { d.moved = true; setDragging(true) }
          if (d.moved) { lookAround(e.clientX - d.x, e.clientY - d.y, a.w, a.h); d.x = e.clientX; d.y = e.clientY; return }
        }
        const now = performance.now(); let name = p?.name || ''
        if (now - last.current > 120) { last.current = now; name = under(a.x, a.y, a.w, a.h)?.name || (get().viewMoved ? '' : 'drag to look around') }
        setP({ x: a.x, y: a.y, name })
      }}
      onPointerLeave={() => { if (!press.current) setP(null) }}
      onPointerDown={(e) => { e.preventDefault(); el.current!.setPointerCapture(e.pointerId); press.current = { x: e.clientX, y: e.clientY, moved: false } }}
      onPointerCancel={() => { press.current = null; setDragging(false) }}
      onPointerUp={(e) => {
        const d = press.current; press.current = null; setDragging(false); setTouchHint(false)
        if (e.pointerType === 'touch') setP(null)
        if (!d || d.moved) return
        const a = at(e); tap(a.x, a.y, a.w, a.h); const id = Math.random(); setRings((r) => [...r, { x: a.x, y: a.y, id }]); setTimeout(() => setRings((r) => r.filter((z) => z.id !== id)), 500)
      }}>
      {touchHint && <span className={s.dragHint}>drag to look around</span>}
      {rings.map((r) => <motion.i key={r.id} className={s.ring} style={{ left: r.x, top: r.y }} initial={{ scale: .3, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: .5 }} />)}
      {p && !dragging && <>
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
