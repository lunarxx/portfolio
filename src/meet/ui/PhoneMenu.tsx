'use client'
// on a phone, one button where a thumb already is, and a sheet with everything that doesn't need to be on screen all the
// time: where to go, the sound, the transcript. big rows, tap outside or swipe it down to close
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { get, set, useMeet, note } from '../store.js'
import { stage } from '../show.js'
import { AGENDA } from './Agenda'
import { Menu, Tv, Note, Chat } from './icons'
import s from './meet.module.css'

export function PhoneMenu({ onPick, call = false }: { onPick?: () => void; call?: boolean }) {
  const [open, setOpen] = useState(false)
  const { share, voiceOff, roomOff, transcript } = useMeet()
  const on = share === 'mooney' || String(share).startsWith('mini:') ? 'shelf' : share
  const go = (id: string, label: string) => { setOpen(false); note(`went straight to "${label}"`, `agenda:${id}`); set({ share: id }); onPick?.() }
  return (
    <>
      <button className={`${s.menuBtn} ${call ? s.menuBtnCall : ''}`} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}><Menu /><span>Menu</span></button>
      <AnimatePresence>
        {open && <>
          <motion.div className={s.menuBack} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div className={s.menuSheet} role="dialog" aria-label="Menu" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: .7 }} onDragEnd={(_, i) => { if (i.offset.y > 80 || i.velocity.y > 400) setOpen(false) }}>
            <i className={s.menuGrip} />
            {AGENDA.map(([id, label]) => <button key={id} className={`${s.menuRow} ${on === id ? s.menuRowOn : ''}`} onClick={() => go(id, label)}>{label}</button>)}
            <a className={s.menuRow} href="/resume" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>Resume</a>
            <div className={s.menuToggles}>
              <button className={voiceOff ? s.menuOff : ''} aria-pressed={!!voiceOff} onClick={() => { const v = !get().voiceOff; stage()?.sound.muteVoice(v); set({ voiceOff: v }) }}><Tv /><span>{voiceOff ? 'Ashwini muted' : 'Ashwini on'}</span></button>
              <button className={roomOff ? s.menuOff : ''} aria-pressed={!!roomOff} onClick={() => { const v = !get().roomOff; stage()?.sound.muteRoom(v); set({ roomOff: v }) }}><Note /><span>{roomOff ? 'Music off' : 'Music on'}</span></button>
              {call && <button className={transcript ? s.menuLit : ''} aria-pressed={!!transcript} onClick={() => { setOpen(false); set({ transcript: !get().transcript }) }}><Chat /><span>Transcript</span></button>}
            </div>
          </motion.div>
        </>}
      </AnimatePresence>
    </>
  )
}
