'use client'
// everything he's built, as a shelf he shares in his tile, and each thing as a small working version of itself. asked
// "what have you built?", he opens the shelf; pick one (or ask for it by name) and that one opens. every miniature runs
// on its own (sample data where real data is private, said so on screen); the RAG one is the real search
import { motion } from 'framer-motion'
import { set, useMeet } from '../../store.js'
import { say } from '../../show.js'
import { Mooney } from '../Share'
import { Cookie } from './Cookie'
import { Estimator } from './Estimator'
import { Inkling } from './Inkling'
import { Outbound } from './Outbound'
import { Recall } from './Recall'
import m from './minis.module.css'

type Mini = { id: string; name: string; line: string; tint: string; glyph: React.ReactNode; open: string; real?: string; note?: string; Body?: () => React.ReactElement }

// what he says as each opens (his voice; short, it's a show not a lecture)
export const MINIS: Mini[] = [
  { id: 'cookie', name: 'Cookie, the front desk', line: 'Text it an order. It prices, proposes, collects, chases.', tint: '#2F4A3E', open: "This is Cookie. Text her an order, like an owner would.", note: 'a sample business, sample costs', Body: Cookie,
    glyph: <Chat /> },
  { id: 'mooney', name: 'Mooney', line: 'Say what you spent. It lands in the list.', tint: '#B85F3A', open: "Mooney. Type what you spent, or hold the mic.", real: 'https://play.google.com/store/apps/details?id=com.octyn.mooney',
    glyph: <Receipt /> },
  { id: 'aarttsii', name: "aarttsii's estimator", line: 'A crochet piece, priced from how hard it is to make.', tint: '#C9764A', open: 'Pick a piece. It scores how hard it is to make, then prices it.', note: 'illustrative numbers · the real one reads a photo', Body: Estimator,
    glyph: <Yarn /> },
  { id: 'inkling', name: 'Inkling', line: 'Markdown notes, multiplayer, your vault is a GitHub repo.', tint: '#16171B', open: "Inkling. Someone's already in this note with you.", note: 'a sample vault', Body: Inkling,
    glyph: <Editor /> },
  { id: 'outbound', name: 'The outbound engine', line: 'Finds the right agencies, writes each one from its own work.', tint: '#3A4650', open: 'The outbound engine. Open any agency to see the line it wrote.', note: 'sample agencies', Body: Outbound,
    glyph: <Lanes /> },
  { id: 'recall', name: 'RAG + memory', line: 'Ask about me. Watch the real search pick my notes.', tint: '#3A2C34', open: "This one's real. Ask it anything about me and watch it search my notes.", note: 'my real notes, the real search', Body: Recall,
    glyph: <Search /> },
]

export const openMini = (id: string, speak = true) => {
  const it = MINIS.find((x) => x.id === id); if (!it) return
  set({ share: id === 'mooney' ? 'mooney' : `mini:${id}` })
  if (speak) say(it.open, { mark: 'point_screen' })
}

export function Shelf() {
  return (
    <div className={m.wrap}>
      <div className={m.top}><span className={m.ttl}>things I&apos;ve built</span><span className={m.sub}>pick one, it opens</span></div>
      <div className={m.shelf}>
        {MINIS.map((it, i) => (
          <motion.button key={it.id} className={m.item} onClick={() => openMini(it.id)} initial={{ opacity: 0, y: 24, rotate: i % 2 ? 2 : -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: .06 * i, type: 'spring', stiffness: 260, damping: 22 }} whileHover={{ y: -4, rotate: i % 2 ? .6 : -.6 }}>
            <div className={m.glyph} style={{ background: it.tint }}>{it.glyph}</div>
            <div className={m.itemText}><div className={m.itemName}>{it.name}</div><div className={m.itemLine}>{it.line}</div></div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// one miniature, in its frame: back to the shelf, its name, the real thing if there is one
export function MiniView({ id }: { id: string }) {
  const it = MINIS.find((x) => x.id === id); if (!it || !it.Body) return null
  const Body = it.Body
  return (
    <div className={m.wrap}>
      <div className={m.top}>
        <button className={m.back} onClick={() => set({ share: 'shelf' })}>‹ Everything</button>
        <span className={m.ttl}>{it.name}</span>
        {it.real && <a className={m.real} href={it.real} target="_blank" rel="noreferrer">the real one</a>}
        {it.note && <span className={m.note2}>{it.note}</span>}
      </div>
      <motion.div className={m.body} initial={{ opacity: 0, scale: .97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}><Body /></motion.div>
    </div>
  )
}

export function Shared() {
  const { share } = useMeet() as any
  if (share === 'shelf') return <Shelf />
  if (typeof share === 'string' && share.startsWith('mini:')) return <MiniView id={share.slice(5)} />
  if (share === 'mooney') return <Mooney />
  return null
}

// the shelf's little pictures, drawn here (no stock icons)
function Chat() { return <svg viewBox="0 0 120 70" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><rect x="14" y="12" width="56" height="16" rx="7" fill="#F1EADB" /><rect x="48" y="33" width="58" height="16" rx="7" fill="#D6F0C8" /><rect x="14" y="54" width="40" height="12" rx="6" fill="#F2C46B" /></svg> }
function Receipt() { return <svg viewBox="0 0 120 70" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><path d="M38 6h44v52l-5.5 4-5.5-4-5.5 4-5.5-4-5.5 4-5.5-4-5.5 4-5.5-4z" fill="#F2EFE7" /><g stroke="#B85F3A" strokeWidth="2.4"><path d="M45 18h22M45 28h30M45 38h18" /></g></svg> }
function Yarn() { return <svg viewBox="0 0 120 70" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><circle cx="60" cy="36" r="22" fill="#F6E3C9" /><g stroke="#C9764A" strokeWidth="2.2" fill="none"><path d="M42 26c10 6 26 6 36 0M40 36c12 7 28 7 40 0M42 46c10 6 26 6 36 0M52 15c-6 14-6 28 0 42M68 15c6 14 6 28 0 42" /></g><path d="M80 48c10 4 16 2 22-6" stroke="#F6E3C9" strokeWidth="2" fill="none" /></svg> }
function Editor() { return <svg viewBox="0 0 120 70" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><rect x="16" y="14" width="30" height="5" rx="2" fill="#F1D9A8" /><rect x="16" y="26" width="70" height="4" rx="2" fill="#5C5A55" /><rect x="16" y="35" width="56" height="4" rx="2" fill="#5C5A55" /><rect x="16" y="44" width="46" height="4" rx="2" fill="#8FB8D8" /><rect x="64" y="40" width="2" height="12" fill="#8FA38A" /><rect x="64" y="34" width="22" height="6" rx="2" fill="#8FA38A" /></svg> }
function Lanes() { return <svg viewBox="0 0 120 70" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">{[0, 1, 2, 3, 4].map((i) => <g key={i}><rect x={10 + i * 21} y="10" width="17" height="3" fill="#9AA6B0" />{Array.from({ length: 4 - Math.abs(2 - i) }, (_, k) => <rect key={k} x={10 + i * 21} y={18 + k * 12} width="17" height="9" rx="2" fill={i === 3 && k === 0 ? '#FFF1C9' : '#EDEFF0'} />)}</g>)}</svg> }
function Search() { return <svg viewBox="0 0 120 70" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"><rect x="14" y="12" width="92" height="12" rx="6" fill="#F4F1EA" />{[0, 1, 2].map((i) => <g key={i}><rect x="14" y={31 + i * 12} width="10" height="8" rx="2" fill="#F2C46B" /><rect x="28" y={32 + i * 12} width={70 - i * 14} height="6" rx="3" fill="#8A7C70" /></g>)}</svg> }
