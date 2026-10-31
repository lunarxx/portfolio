'use client'
// aarttsii's estimator, small: a piece is scored on eight things that make crochet slow (the real one reads a photo),
// and the price is built from those hours and the yarn, line by line, so nobody gets lowballed in DMs. size, yarn and
// extra parts tune it live. yarns follow the house rule: Mousse and Chenille for products, Cotton only for wearables.
// illustrative numbers, said on screen
import { useState } from 'react'
import { motion } from 'framer-motion'
import m from './minis.module.css'

const AXES = ['Stitch density', 'Shaping', 'Colour changes', 'Separate parts', 'Size', 'Texture', 'Fine detail', 'Finishing']
type Piece = { id: string; name: string; scores: number[]; wear: boolean; parts: number; art: React.ReactNode }
const PIECES: Piece[] = [
  { id: 'bag', name: 'Bucket bag', scores: [6, 5, 2, 3, 7, 6, 3, 6], wear: false, parts: 3, art: <Bag /> },
  { id: 'cat', name: 'Amigurumi cat', scores: [8, 8, 4, 7, 3, 2, 8, 7], wear: false, parts: 7, art: <Cat /> },
  { id: 'keys', name: 'Charm keychain', scores: [5, 4, 3, 2, 1, 2, 5, 4], wear: false, parts: 2, art: <Charm /> },
  { id: 'beanie', name: 'Baby beanie', scores: [5, 3, 2, 1, 4, 5, 2, 3], wear: true, parts: 1, art: <Beanie /> },
]
const YARN = { Mousse: 1, Chenille: 1.35, Cotton: .8 } as Record<string, number>
const SIZE = { S: .75, M: 1, L: 1.4 } as Record<string, number>
const rs = (n: number) => `₹${Math.round(n / 10) * 10}`

export function Estimator() {
  const [p, setP] = useState(PIECES[0]), [size, setSize] = useState('M'), [extra, setExtra] = useState(0)
  const yarns = p.wear ? ['Cotton'] : ['Mousse', 'Chenille']
  const [yarnPick, setYarn] = useState('Mousse'); const yarn = yarns.includes(yarnPick) ? yarnPick : yarns[0]
  // hours grow faster than the effort scores (a power curve: the hard pieces are much harder), times size and parts
  const effort = p.scores.reduce((a, b) => a + b, 0) / 80, hours = (1.2 + 9 * effort ** 1.6) * SIZE[size] * (1 + extra * .12)
  const lines: [string, number][] = [[`Making (${hours.toFixed(1)} h)`, hours * 220], [`${yarn} yarn`, 160 * SIZE[size] * YARN[yarn] * (1 + extra * .15)], [`Parts (${p.parts + extra})`, (p.parts + extra) * 35], ['Packing and care card', 60]]
  const total = lines.reduce((s, l) => s + l[1], 0)
  const Seg = ({ label, opts, on, pick }: { label: string; opts: string[]; on: string; pick: (x: string) => void }) => (
    <div className={m.seg}><span>{label}</span>{opts.map((o) => <button key={o} className={o === on ? m.segOn : ''} onClick={() => pick(o)}>{o}</button>)}</div>
  )
  return (
    <div className={m.est}>
      <div className={m.pieces}>
        {PIECES.map((x) => <button key={x.id} className={`${m.piece} ${x.id === p.id ? m.pieceOn : ''}`} onClick={() => { setP(x); setExtra(0) }}>{x.art}{x.name}</button>)}
      </div>
      <div className={m.axes}>
        <div className={m.axesTtl}>how hard it is to make</div>
        {AXES.map((a, i) => (
          <div key={a} className={m.axis}>
            <div><span>{a}</span><span>{p.scores[i]}/10</span></div>
            <div className={m.track}><motion.div className={m.fill} initial={false} animate={{ width: `${p.scores[i] * 10}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * .04 }} /></div>
          </div>
        ))}
      </div>
      <div className={m.price}>
        <div className={m.priceTtl}>the price, line by line</div>
        {lines.map(([l, n]) => <div key={l} className={m.line}><span>{l}</span><span>{rs(n)}</span></div>)}
        <div className={m.total}><span>Quote</span><motion.b key={Math.round(total / 10)} initial={{ y: -6, opacity: .4 }} animate={{ y: 0, opacity: 1 }}>{rs(total)}</motion.b></div>
        <div className={m.tune}>
          <Seg label="Size" opts={['S', 'M', 'L']} on={size} pick={setSize} />
          <Seg label="Yarn" opts={yarns} on={yarn} pick={setYarn} />
          <Seg label="Parts" opts={['+0', '+1', '+2']} on={`+${extra}`} pick={(x) => setExtra(Number(x.slice(1)))} />
        </div>
      </div>
    </div>
  )
}

// the pieces, drawn here
function Bag() { return <svg viewBox="0 0 40 40"><path d="M10 15h20l-2 19H12z" fill="#E8C9A8" stroke="#3A2C34" strokeWidth="1.5" /><path d="M14 15c0-8 12-8 12 0" fill="none" stroke="#3A2C34" strokeWidth="1.5" /><path d="M12 22h16M12 28h16" stroke="#C9764A" strokeWidth="1.2" /></svg> }
function Cat() { return <svg viewBox="0 0 40 40"><circle cx="20" cy="24" r="10" fill="#F2C9A0" stroke="#3A2C34" strokeWidth="1.5" /><path d="M12 18l1-8 5 5M28 18l-1-8-5 5" fill="#F2C9A0" stroke="#3A2C34" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="16.5" cy="23" r="1.2" fill="#3A2C34" /><circle cx="23.5" cy="23" r="1.2" fill="#3A2C34" /></svg> }
function Charm() { return <svg viewBox="0 0 40 40"><circle cx="20" cy="9" r="4" fill="none" stroke="#8A7C70" strokeWidth="1.5" /><path d="M20 13v4" stroke="#8A7C70" strokeWidth="1.5" /><path d="M20 36s-10-6-10-13a5 5 0 0110-1 5 5 0 0110 1c0 7-10 13-10 13z" fill="#E59A9A" stroke="#3A2C34" strokeWidth="1.5" /></svg> }
function Beanie() { return <svg viewBox="0 0 40 40"><path d="M9 28c0-12 22-12 22 0z" fill="#A9C8D8" stroke="#3A2C34" strokeWidth="1.5" /><rect x="8" y="27" width="24" height="6" rx="2" fill="#86A9BC" stroke="#3A2C34" strokeWidth="1.5" /><circle cx="20" cy="12" r="3" fill="#F2EEE6" stroke="#3A2C34" strokeWidth="1.5" /></svg> }
