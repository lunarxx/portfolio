'use client'
// the lobby, over his room (blurred): your character to make yours, the camera and mic (notes in a hand point at
// them until you use them), and the door: who's already in, your name, walk in
import { motion } from 'framer-motion'
import { get, set, useMeet, spokenName } from '../store.js'
import { camera, micButton, noticed, acted, warm } from '../you.js'
import { YouTile } from './YouTile'
import { Customiser } from './Customiser'
import { Agenda } from './Agenda'
import { VoiceMute, MusicMute, Volume } from './SoundControls'
import { PhoneMenu } from './PhoneMenu'
import { Mic, Cam } from './icons'
import { useEffect, useRef } from 'react'
import { say, emit, wakeAudio } from '../show.js'
import s from './meet.module.css'

let nameTimer: ReturnType<typeof setTimeout> | undefined
export function Lobby({ onJoin }: { onJoin: () => void }) {
  const { name, cam, camWaking, camNote, mic, heard, debugSees } = useMeet()
  return (
    <motion.div className={s.lobby} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: .5 } }}>
      <div className={s.lobbyTop}>
        <div className={s.lobbyNav}><Agenda onPick={onJoin} /></div>
        <div className={s.lobbySound}><VoiceMute /><MusicMute /><Volume /></div>
        <PhoneMenu onPick={onJoin} />
      </div>
      <div className={s.pre}>
        <YouTile lobby>
          <span className={s.lbl}>{name || 'You'}{cam && <i> · moving with you</i>}</span>
          {camWaking ? <span className={s.waking}>Waking up the tracker…</span> : camNote && <span className={s.waking}>{camNote}</span>}
          {debugSees && <span className={s.debugSees}>{debugSees}</span>}
          {!mic && <div className={`${s.nudge} ${s.nMic}`}><span>or just<br />say hi out loud</span><svg viewBox="0 0 170 70"><path d="M10 14c40-8 100 6 146 44M156 58l-3-17M156 58l-17-4" /></svg></div>}
          {!cam && <div className={`${s.nudge} ${s.nCam}`}><svg viewBox="0 0 170 70"><path d="M160 14C120 6 60 20 14 58M14 58l3-17M14 58l17-4" /></svg><span>camera on and<br />i copy your face<br />and hands</span></div>}
          <div className={s.tileBtns}>
            <button id="lmic" className={`${s.rb} ${mic ? s.lit : s.struck}`} onClick={micButton} title="Talk instead of typing"><Mic /></button>
            <button id="lcam" className={`${s.rb} ${cam ? s.lit : s.struck}`} onPointerEnter={warm} onClick={() => camera(!get().cam)} title="Your camera moves your character"><Cam /></button>
          </div>
        </YouTile>
        <Customiser />
      </div>
      <div className={s.join}>
        <HisPreview heard={heard} />
        <h1 className={s.ready}>Ready to join?</h1>
        <label className={s.book} htmlFor="yourname">What should he call you?</label>
        <input id="yourname" className={s.name} maxLength={22} placeholder="your name" autoComplete="given-name" spellCheck={false} value={name}
          onChange={(e) => { const v = e.target.value; set({ name: v }); acted(); clearTimeout(nameTimer); nameTimer = setTimeout(() => noticed('name', v.trim()), 900) }}
          onKeyDown={(e) => { if (e.key === 'Enter') onJoin() }} />
        <button id="go" className={s.go} onClick={onJoin}>Walk in <span>→</span></button>
      </div>
    </motion.div>
  )
}

// his tile, like the preview a call shows of who's already in: his room live (a mirror of the stage's canvas), his
// name tag. tap it and he looks up and waves you in
let wavedAt = 0
function HisPreview({ heard }: { heard: string | null }) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let raf = 0
    const draw = () => {
      const src = document.getElementById('c') as HTMLCanvasElement | null, g = cv.current?.getContext('2d')
      if (src && g) { g.imageSmoothingEnabled = true; g.drawImage(src, 0, 0, cv.current!.width, cv.current!.height) }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])
  const wave = async () => {
    if (performance.now() - wavedAt < 5000) return; wavedAt = performance.now()
    await wakeAudio(); emit({ type: 'glance' })
    const n = spokenName(get().name); say(n ? `Oh, hey ${n}! Come in.` : 'Oh hey! Come on in.', { mark: 'hello' })
  }
  return (
    <motion.button className={s.preview} onClick={wave} whileHover={{ scale: 1.01 }} whileTap={{ scale: .99 }} title="Say hi">
      <canvas ref={cv} width={320} height={180} />
      {heard && <span className={s.previewCap}>{heard}</span>}
      <span className={s.previewName}>Ashwini <i>in the call</i></span>
    </motion.button>
  )
}
