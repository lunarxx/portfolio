'use client'
// how he did it, shared in his tile. Sources: the notes his answer came from, dealt out like cards, the words that
// matched marked. Notebook: what he wrote down about you in the call, the lines his cold read used circled
import { motion } from 'framer-motion'
import { useMeet } from '../store.js'
import s from './meet.module.css'

const STOP = new Set('a an and are as at be but by can did do does for from had has have he her him his how i if in into is it its me my no not of on or our she so than that the their them then there these they this to too up us was we were what when where which who why will with would you your about also just more some only like yeah'.split(' '))
const words = (t: string) => new Set((t.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ing|ed|es|s)$/, '')))

// the slip's words that were in the question or his answer, marked like a highlighter
function Marked({ text, hit }: { text: string; hit: Set<string> }) {
  return <>{text.split(/(\s+)/).map((w, i) => {
    const k = w.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(ing|ed|es|s)$/, '')
    return k.length > 2 && hit.has(k) ? <mark key={i}>{w}</mark> : w
  })}</>
}

export function Sources() {
  const { cites } = useMeet() as any
  if (!cites) return null
  const hit = new Set([...words(cites.q), ...words(cites.say)])
  return (
    <div className={s.notesWrap}>
      <div className={s.notesHead}>
        <span className={s.hand}>what I looked up</span>
        <span className={s.notesQ}>“{cites.q}”</span>
      </div>
      <div className={s.slips}>
        {cites.slips.map((c: any, i: number) => (
          <motion.div key={c.n} className={s.slip} style={{ rotate: (i % 2 ? .8 : -.7) * (1 + (i % 3) * .4) }}
            initial={{ opacity: 0, y: 46, rotate: i % 2 ? 9 : -9 }} animate={{ opacity: 1, y: 0, rotate: (i % 2 ? .8 : -.7) * (1 + (i % 3) * .4) }}
            transition={{ delay: .15 + i * .2, type: 'spring', stiffness: 260, damping: 22 }}>
            <span className={s.slipFrom}>{c.section}</span>
            <Marked text={c.text} hit={hit} />
          </motion.div>
        ))}
      </div>
      {cites.of && <motion.div className={s.notesFoot} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .4 + cites.slips.length * .2 }}>
        {cites.slips.length} of the {cites.of} notes I keep on myself
      </motion.div>}
    </div>
  )
}

export function Notebook() {
  const { reading, name } = useMeet() as any
  if (!reading) return null
  // which of his lines each note fed: 1 2 3 for what he said, ★ for the guess, circled like a pen would
  const used = new Map<number, string[]>()
  reading.lines.forEach((l: any, i: number) => used.set(l.note, [...(used.get(l.note) || []), String(i + 1)]))
  for (const n of reading.guessNotes || []) used.set(n, [...(used.get(n) || []), '★'])
  return (
    <div className={s.notesWrap}>
      <div className={s.page}>
        <div className={s.pageTitle}>notes on {name || 'you'}</div>
        {reading.notes.map((n: any, i: number) => (
          <motion.div key={i} className={`${s.entry} ${used.has(i) ? s.entryUsed : ''}`}
            initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ delay: .2 + i * .11, duration: .45, ease: 'easeOut' }}>
            <span className={s.entryAt}>{n.at}</span>
            <span className={s.entryText}>{used.has(i) ? <mark>{n.text}</mark> : n.text}</span>
            {used.has(i) && <span className={s.entryRef}>{used.get(i)!.map((r) => <i key={r}>{r}</i>)}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
