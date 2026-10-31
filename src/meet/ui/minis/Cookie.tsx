'use client'
// Cookie, the front desk, small: you're the owner, you text her an order the way you would on WhatsApp. she reads it,
// prices it from the business's own costs (numbers from code, never the model: the real desk's rule), checks there's
// time to make it, drafts the proposal, and waits for your tap; then the advance, then the nudge for the balance.
// a sample business's numbers, said on screen
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { say } from '../../show.js'
import m from './minis.module.css'

type Msg = { id: number; who: 'me' | 'her' | 'note'; text?: string; quote?: Quote }
type Quote = { qty: number; item: string; lines: [string, number][]; total: number; days: number; by?: string }
// a sample maker's costs: materials and hours a piece, her rate, her margin
const COST: Record<string, { name: string; mat: number; hrs: number }> = {
  keychain: { name: 'keychain', mat: 40, hrs: .5 }, tote: { name: 'tote bag', mat: 420, hrs: 6 }, bag: { name: 'bag', mat: 380, hrs: 5 },
  coaster: { name: 'coaster', mat: 30, hrs: .4 }, plush: { name: 'plush toy', mat: 160, hrs: 3 }, piece: { name: 'piece', mat: 150, hrs: 2 },
}
const RATE = 180, MARGIN = 1.35, WEEK_HOURS = 60
const rs = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
let nid = 0

function quote(text: string): Quote | null {
  const qty = Number((text.match(/\b(\d{1,4})\b/) || [])[1] || (/\b(a|an|one)\b/i.test(text) ? 1 : 0))
  const key = Object.keys(COST).find((k) => new RegExp(`\\b${k}`, 'i').test(text)) || (/amigurumi|toy|doll/i.test(text) ? 'plush' : 'piece')
  if (!qty) return null
  const c = COST[key], hours = c.hrs * qty, materials = c.mat * qty, labour = hours * RATE
  const bulk = qty >= 25 ? -(materials + labour) * MARGIN * .08 : 0
  const lines: [string, number][] = [[`Materials (${qty} × ${rs(c.mat)})`, materials], [`Making (${hours.toFixed(1)} h × ${rs(RATE)})`, labour], ['Her margin', (materials + labour) * (MARGIN - 1)]]
  if (bulk) lines.push(['Bulk, 25 or more', bulk])
  const by = (text.match(/\bby ([^.,!?]+)/i) || [])[1]
  return { qty, item: qty > 1 ? `${c.name}s` : c.name, lines, total: lines.reduce((s, l) => s + l[1], 0), days: Math.max(2, Math.ceil(hours / WEEK_HOURS * 7)), by }
}

const STEPS = [
  ['Read the order', 'how many, what, by when'],
  ["Priced it from the business's own costs", 'materials, hours, margin: numbers from code, never guessed'],
  ['Checked there is time to make it', 'maker-hours against the week'],
  ['Drafted the proposal', 'branded, itemised'],
  ['Waiting for a human tap', 'nothing goes out without one'],
  ['Sent the advance link', '40% now, the rest on delivery'],
  ['Chased the balance', 'a nudge, politely, days later'],
]

export function Cookie() {
  const [msgs, setMsgs] = useState<Msg[]>([{ id: nid++, who: 'her', text: "Hi! I'm Cookie, the front desk here. Text me an order like you would on WhatsApp." }])
  const [step, setStep] = useState(-1), [v, setV] = useState(''), [live, setLive] = useState<Quote | null>(null), [sent, setSent] = useState(false)
  const end = useRef<HTMLDivElement>(null), timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [msgs.length])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)) }
  const push = (x: Omit<Msg, 'id'>) => setMsgs((a) => [...a, { ...x, id: nid++ }])

  const order = (text: string) => {
    if (!text.trim()) return
    push({ who: 'me', text }); setV(''); setSent(false)
    const q = quote(text)
    if (!q) { later(700, () => push({ who: 'her', text: 'Happy to! How many do you need?' })); return }
    setLive(q); setStep(0)
    later(600, () => { setStep(1); push({ who: 'her', text: `Got it: ${q.qty} ${q.item}${q.by ? `, by ${q.by}` : ''}. Pricing it now.` }) })
    later(1400, () => setStep(2))
    later(2200, () => { setStep(3); push({ who: 'her', quote: q }) })
    later(2900, () => setStep(4))
  }
  const send = () => {
    if (!live || sent) return
    setSent(true); setStep(5); push({ who: 'her', text: `Sent. Advance link for ${rs(live.total * .4)} (40%), the rest on delivery.` })
    say("Nothing went out until you tapped. That's the rule.", { mark: 'thumbs_up' })
    later(1800, () => { push({ who: 'note', text: 'three days later' }); setStep(6); push({ who: 'her', text: `Hi! A gentle nudge on the advance for the ${live.qty} ${live.item}. Here's the link again whenever you're ready.` }) })
  }

  return (
    <div className={m.desk}>
      <div className={m.chat}>
        <div className={m.chatHead}><i>C</i><div>Cookie<small>front desk · online</small></div></div>
        <div className={m.msgs}>
          <AnimatePresence initial={false}>
            {msgs.map((x) => x.who === 'note'
              ? <motion.div key={x.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ alignSelf: 'center', font: '10px var(--f-plex), monospace', color: '#8A7C70', background: '#ffffff99', padding: '2px 8px', borderRadius: 99 }}>{x.text}</motion.div>
              : x.quote
                ? <motion.div key={x.id} className={m.proposal} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <header>Proposal · {x.quote.qty} {x.quote.item}</header>
                    {x.quote.lines.map(([l, n]) => <div key={l}><span>{l}</span><b>{rs(n)}</b></div>)}
                    <div><span>Ready in</span><b>{x.quote.days} days</b></div>
                    <div><span>Total</span><b>{rs(x.quote.total)}</b></div>
                    <footer>
                      <button className={`${m.tap} ${m.tapGo}`} onClick={send} disabled={sent}>{sent ? 'Sent' : 'Send to the buyer'}</button>
                      {!sent && <button className={m.tap} onClick={() => push({ who: 'her', text: 'Tell me what to change, in plain words. "Make it 60" works.' })}>Edit</button>}
                    </footer>
                  </motion.div>
                : <motion.div key={x.id} className={x.who === 'me' ? m.me : m.her} initial={{ opacity: 0, y: 8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>{x.text}</motion.div>)}
          </AnimatePresence>
          <div ref={end} />
        </div>
        {!live && <div className={m.picks}>
          {['50 cat keychains for a team event, by 20 Nov', 'One chenille tote bag', '12 coasters in our logo colours'].map((p) => <button key={p} onClick={() => order(p)}>{p}</button>)}
        </div>}
        <form className={m.compose} onSubmit={(e) => { e.preventDefault(); order(v) }}>
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Text Cookie an order" maxLength={120} /><button>Send</button>
        </form>
      </div>
      <div className={m.behind}>
        <div className={m.behindTtl}>what she&apos;s doing</div>
        {STEPS.map(([t, d], i) => (
          <motion.div key={t} className={`${m.step} ${i <= step ? m.stepOn : ''}`} animate={{ scale: i === step ? [1, 1.02, 1] : 1 }} transition={{ duration: .35 }}>
            <span>{i < step || (i === step && i !== 4) ? '✓' : i + 1}</span><div><b>{t}</b>{i === step && <small>{d}</small>}</div>
          </motion.div>
        ))}
        <div className={m.rule}>The real desk runs on WhatsApp, Instagram and email, with a client portal and a staff HQ. Words from the model, numbers from code.</div>
      </div>
    </div>
  )
}
