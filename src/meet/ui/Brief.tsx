'use client'
// the short version: everything a hirer came for on one sheet, no asking. each thing opens its working miniature. the
// words come from the resume (src/app/resume/page.tsx)
import { motion } from 'framer-motion'
import { EMAIL } from '../brain.js'
import { openMini } from './minis'
import s from './meet.module.css'

const BUILT: { id: string; name: string; line: string }[] = [
  { id: 'cookie', name: 'Cookie', line: 'A front desk for made-to-order businesses. Prices orders from their own costs, sends the proposal, collects the advance, chases the balance.' },
  { id: 'mooney', name: 'Mooney', line: 'Voice-first expense tracker, live on Google Play. Under 5 seconds from speech to saved row, in 60+ countries.' },
  { id: 'recall', name: 'RAG + memory', line: 'The search behind this call. Puts the right note first 81% of the time, up from 38%.' },
  { id: 'outbound', name: 'Outbound', line: 'Email, LinkedIn, Instagram and X, each message written from the prospect’s own work.' },
  { id: 'inkling', name: 'Inkling', line: 'Local-first markdown workspace with real-time multiplayer, shipped on desktop.' },
  { id: 'aarttsii', name: 'aarttsii', line: 'All the tech behind a crochet brand, including a price estimator that reads a photo.' },
]

// the longer read on three of them
const CASES: { href: string; name: string; line: string }[] = [
  { href: '/case/mooney', name: 'Mooney', line: 'The expense tracker that listens.' },
  { href: '/case/aarttsii', name: 'aarttsii', line: 'Pricing crochet without the guesswork.' },
  { href: '/case/whofits', name: 'WhoFits', line: 'Finding creators worth working with.' },
]
export function Cases() {
  return (
    <motion.div className={s.brief} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
      <h3>Case studies</h3>
      <div className={s.briefRows}>
        {CASES.map((c) => <a key={c.href} href={c.href} target="_blank" rel="noreferrer"><b>{c.name}</b><span>{c.line}</span><i aria-hidden>↗</i></a>)}
      </div>
    </motion.div>
  )
}

export function Brief() {
  return (
    <motion.div className={s.brief} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 26 }}>
      <h3>The short version</h3>
      <p className={s.briefLead}>Cofounder of Octyn, where each system is custom built for one company, then run and kept current. Product designer and 3D artist before that. Looking for full-time remote work, from India, on IST.</p>
      <div className={s.briefRows}>
        {BUILT.map((b) => (
          <button key={b.id} onClick={() => openMini(b.id, false)}><b>{b.name}</b><span>{b.line}</span><i aria-hidden>→</i></button>
        ))}
      </div>
      <div className={s.briefLinks}>
        <a href="/resume" target="_blank" rel="noreferrer">Resume</a>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <a href="https://linkedin.com/in/ashwtiw" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://github.com/lunarxx" target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </motion.div>
  )
}
