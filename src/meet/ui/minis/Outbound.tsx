'use client'
// the outbound engine, small: agencies move through it on their own (found, qualified, address checked, first line
// written, scheduled for their morning); open any one to see what it read of theirs and the line it wrote from it.
// sample agencies (the real lists are private), real shape: 12 inboxes on 6 domains, follow-ups at +3 and +7 days
import { useEffect, useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import m from './minis.module.css'

const STAGES = ['Found', 'Qualified', 'Verified', 'Written', 'Scheduled']
type Agency = { id: number; name: string; kind: string; city: string; tz: string; work: string; line: string; stage: number }
const SEED: Omit<Agency, 'id' | 'stage'>[] = [
  { name: 'Northwind Social', kind: 'social agency', city: 'Austin', tz: 'CST', work: 'A case study on running 40 creator accounts for one food brand.', line: 'Forty creator accounts for one brand is a lot of DMs to keep straight; your case study made me wonder who tracks which creator owes which draft.' },
  { name: 'Paper Fox Talent', kind: 'talent agency', city: 'London', tz: 'GMT', work: 'A post about signing their 100th creator.', line: 'A hundred creators is the point where approvals start living in five group chats; congrats on the milestone.' },
  { name: 'Lumen Content Co', kind: 'content studio', city: 'Sydney', tz: 'AEST', work: 'Their reel series on turning one shoot into 30 assets.', line: 'Thirty assets from one shoot means thirty approvals somewhere; loved the breakdown in your reel series.' },
  { name: 'Tidewater Creators', kind: 'creator agency', city: 'Toronto', tz: 'EST', work: 'A hiring post for a campaign coordinator.', line: "You're hiring a campaign coordinator, which usually means the deal tracking outgrew a spreadsheet." },
  { name: 'Kite & Co', kind: 'influencer agency', city: 'Dublin', tz: 'IST', work: 'A talk on brand safety checks for creators.', line: 'Your brand safety talk had a checklist most agencies run by hand; it stuck with me.' },
  { name: 'Moss Studio', kind: 'social agency', city: 'Berlin', tz: 'CET', work: 'A thread on reporting to clients every Friday.', line: 'Friday reports across every client is a whole day; your thread on it was refreshingly honest.' },
]

export function Outbound() {
  const [list, setList] = useState<Agency[]>(() => SEED.map((a, i) => ({ ...a, id: i, stage: Math.max(0, 4 - i) })))
  const [open, setOpen] = useState(1)
  // the engine never stops: every couple of seconds one agency moves on; past the end, a new one is found
  useEffect(() => {
    let k = 0
    const t = setInterval(() => setList((l) => {
      const movable = l.filter((a) => a.stage < 4); if (!movable.length) return l.map((a) => ({ ...a, stage: 0 }))
      const pick = movable[k++ % movable.length]; return l.map((a) => (a.id === pick.id ? { ...a, stage: a.stage + 1 } : a))
    }), 2200)
    return () => clearInterval(t)
  }, [])
  const a = list.find((x) => x.id === open) || list[0]
  return (
    <div className={m.ob}>
      <LayoutGroup>
        <div className={m.lanes}>
          {STAGES.map((s, si) => (
            <div key={s} className={m.lane}>
              <small>{s}</small>
              {list.filter((x) => x.stage === si).map((x) => (
                <motion.button layout layoutId={`ag-${x.id}`} key={x.id} className={`${m.agency} ${x.id === open ? m.agencyOn : ''}`} onClick={() => setOpen(x.id)} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
                  {x.name}<small>{x.kind} · {x.city}</small>
                </motion.button>
              ))}
            </div>
          ))}
        </div>
      </LayoutGroup>
      {/* on a phone five lanes don't fit: the same agencies as a list, each with how far along it is */}
      <div className={m.obList}>
        {list.map((x) => (
          <button key={x.id} className={x.id === open ? m.obRowOn : ''} onClick={() => setOpen(x.id)}>
            <span className={m.obName}>{x.name}<small>{x.kind} · {x.city}</small></span>
            <span className={m.obStage}><b>{STAGES[x.stage]}</b><i>{STAGES.map((_, i) => <u key={i} className={i <= x.stage ? m.obDone : ''} />)}</i></span>
          </button>
        ))}
      </div>
      <div className={m.dossier}>
        <h4>{a.name}</h4>
        <div><label>what it read</label><div>{a.work}</div></div>
        <div><label>the first line it wrote</label><div className={m.firstLine}>{a.stage >= 3 ? a.line : 'writing once the address checks out…'}</div></div>
        <div><label>when it goes</label><div>{a.stage >= 4 ? `8–10am in ${a.city} (${a.tz}), then +3 and +7 days if quiet` : 'not yet'}</div></div>
      </div>
      <div className={m.obFoot}><span>12 inboxes</span><span>6 domains</span><span>every address checked before sending</span><span>follow-ups +3, +7 days</span></div>
    </div>
  )
}
