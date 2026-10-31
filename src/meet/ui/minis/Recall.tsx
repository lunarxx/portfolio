'use client'
// the RAG, not a mock: ask anything about him and this is the real search over his 191 notes, every stage shown. the
// rank each note got from words and from meaning, how they fuse (reciprocal rank, meaning counting double), and the
// five kept for the answer. when the meaning half is down (the free embedding quota) it says so: words carry it alone
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import m from './minis.module.css'

type Hit = { id: string; section: string; text: string; words: number | null; meaning: number | null; fused: number; kept: boolean }
const TRIES = ['how does Mooney make money', 'does he write code by hand', 'what does the desk never do', 'where is he based']

export function Recall() {
  const [q, setQ] = useState(''), [hits, setHits] = useState<Hit[] | null>(null), [meta, setMeta] = useState<{ of: number; ms: number; degraded: boolean } | null>(null), [busy, setBusy] = useState(false)
  const go = async (text: string) => {
    if (!text.trim() || busy) return
    setQ(text); setBusy(true)
    try {
      const r = await (await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'search', q: text }) })).json()
      setHits(r.candidates || []); setMeta({ of: r.of, ms: r.ms?.total ?? 0, degraded: !!r.degraded })
    } catch { setHits([]) } finally { setBusy(false) }
  }
  return (
    <div className={m.rc}>
      <form className={m.ask} onSubmit={(e) => { e.preventDefault(); go(q) }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about Ashwini" maxLength={160} /><button>{busy ? '…' : 'Search'}</button>
      </form>
      <div className={m.tries}>{TRIES.map((t) => <button key={t} onClick={() => go(t)}>{t}</button>)}</div>
      <div className={m.results}>
        {hits && <div className={m.rcHead}><span>words</span><span>meaning</span><span>note (kept ones outlined)</span></div>}
        <AnimatePresence>
          {hits?.map((h, i) => (
            <motion.div key={`${q}-${h.id}`} className={`${m.hit} ${h.kept ? m.hitKept : ''}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .05 }}>
              <div className={m.rank}><b>{h.words ?? '·'}</b>{h.words ? 'rank' : 'no hit'}</div>
              <div className={m.rank}><b>{h.meaning ?? '·'}</b>{h.meaning ? 'rank' : meta?.degraded ? 'offline' : 'no hit'}</div>
              <div><em>{h.section}</em>{h.text}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        {!hits && <div style={{ font: '22px var(--f-hand), cursive', color: '#8A7C70', margin: 'auto', textAlign: 'center' }}>ask something, or try one above</div>}
      </div>
      <div className={m.rcFoot}>
        {meta ? `${meta.of} notes searched in ${meta.ms} ms · words and meaning fused by rank, meaning counting double · ${meta.degraded ? 'meaning is offline today (free quota), words carry it' : 'five kept for the answer'}` : 'his real notes, his real search'}
      </div>
    </div>
  )
}
