'use client'
// make your character yours: who (with a portrait of each), skin, top colour and print, a hat, the face. shuffle
// throws it all up in the air. your character notices every change
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CAST as CAST0, SKINS, TOPS, OPTIONS as OPTS0, ACCENTS } from '../engine/cast3d.js'
const CAST = CAST0 as Record<string, any>, OPTIONS = OPTS0 as unknown as Record<string, [string, string][]>
import { get, set, useMeet, note } from '../store.js'
import { thumbs, noticed } from '../you.js'
import { pick } from '../show.js'
import { Dice } from './icons'
import s from './meet.module.css'

const HAT_COLOURS = ['#E3A94F', '#D9483B', '#2F3A52', '#8FA38A', '#F2EEE6', '#F27FB8', '#6FB7F0', '#4A4A4A']
const TABS = ['Who', 'Top', 'Hat', 'Face'] as const
type Look = Record<string, any>
const change = (p: Look) => set({ look: { ...get().look, ...p } })

export function Customiser() {
  const { look } = useMeet() as { look: Look }
  const [tab, setTab] = useState<(typeof TABS)[number]>('Who')
  const choose = (k: string, v: any) => { change({ [k]: v }); noticed(k, v) }
  const Dots = ({ k, list }: { k: string; list: string[] }) => (
    <div className={s.dots}>{list.map((c) => <button key={c} aria-label={c} style={{ background: c }} className={look[k] === c ? s.on : ''} onClick={() => choose(k, c)} />)}</div>
  )
  const Seg = ({ k, list }: { k: string; list: [string, string][] }) => (
    <div className={s.seg}>{list.map(([v, l]) => <button key={v} className={look[k] === v ? s.on : ''} onClick={() => choose(k, v)}>{l}</button>)}</div>
  )
  const shuffle = () => {
    const n = pick(Object.keys(CAST))
    change({ ...(CAST as Look)[n], skin: pick(SKINS), top: pick(TOPS), accent: pick(ACCENTS), pattern: pick(OPTIONS.pattern)[0], hat: Math.random() < .6 ? pick(OPTIONS.hat)[0] : 'none',
      hatColour: pick(HAT_COLOURS.slice(0, 6)), eyes: pick(OPTIONS.eyes)[0], cheeks: pick(OPTIONS.cheeks)[0], glasses: Math.random() < .25, head: +(0.9 + Math.random() * .25).toFixed(2) })
    noticed('shuffle'); note('hit shuffle on their character', 'shuffle')
  }
  return (
    <div className={s.custom}>
      <div className={s.tabs}>
        {TABS.map((t) => (
          <button key={t} className={tab === t ? s.on : ''} onClick={() => setTab(t)}>
            {tab === t && <motion.span layoutId="tab" className={s.tabPill} transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
            <span>{t}</span>
          </button>
        ))}
        <button className={s.shuffle} onClick={shuffle}><Dice />Shuffle</button>
      </div>
      <motion.div key={tab} className={s.pane} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18 }}>
        {tab === 'Who' && <>
          <div className={s.who}>
            {Object.keys(CAST).map((n) => (
              <motion.button key={n} whileHover={{ y: -3, rotate: -1 }} whileTap={{ scale: .96 }} className={(CAST as Look)[n].base === look.base ? s.on : ''}
                onClick={() => { change((CAST as Look)[n]); noticed('who', n) }}>
                {thumbs[n] ? <img alt="" src={thumbs[n]} /> : <span className={s.thumbWait} />}<b>{n}</b>
              </motion.button>
            ))}
          </div>
          <Row label="Skin"><Dots k="skin" list={SKINS} /></Row>
        </>}
        {tab === 'Top' && <>
          <Row label="Colour"><Dots k="top" list={TOPS} /></Row>
          <Row label="Print"><Seg k="pattern" list={OPTIONS.pattern} /></Row>
          <Row label="Accent"><Dots k="accent" list={ACCENTS} /></Row>
        </>}
        {tab === 'Hat' && <>
          <Row><Seg k="hat" list={OPTIONS.hat} /></Row>
          <Row label="Colour"><Dots k="hatColour" list={HAT_COLOURS} /></Row>
        </>}
        {tab === 'Face' && <>
          <Row label="Eyes"><Seg k="eyes" list={OPTIONS.eyes} /></Row>
          <Row label="Cheeks"><Seg k="cheeks" list={OPTIONS.cheeks} />
            <button className={`${s.segBtn} ${look.glasses ? s.on : ''}`} onClick={() => { change({ glasses: !look.glasses }); noticed('glasses', !look.glasses) }}>Glasses</button></Row>
          <Row label="Head"><input type="range" min={0.85} max={1.2} step={0.01} value={look.head} className={s.range}
            onChange={(e) => change({ head: +e.target.value })} onPointerUp={(e) => noticed('head', +(e.target as HTMLInputElement).value)} /></Row>
        </>}
      </motion.div>
    </div>
  )
}
const Row = ({ label, children }: { label?: string; children: React.ReactNode }) => (
  <div className={s.row}>{label && <span>{label}</span>}{children}</div>
)
