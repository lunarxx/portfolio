'use client'
// the agenda: for whoever came for one thing. any of it, one tap, from the door or mid-call, whatever he's in the middle of
// saying. from the door, a tap walks you in with that thing already up
import { set, useMeet, note } from '../store.js'
import s from './meet.module.css'

export const AGENDA: [string, string][] = [['brief', 'The short version'], ['shelf', "What I've built"], ['cases', 'Case studies'], ['contact', 'Reach me']]

export function Agenda({ onPick }: { onPick?: () => void }) {
  const { share } = useMeet()
  const on = share === 'mooney' || String(share).startsWith('mini:') ? 'shelf' : share
  return (
    <nav className={s.agenda} aria-label="Skip to">
      {AGENDA.map(([id, label]) => (
        <button key={id} className={on === id ? s.agendaOn : ''} aria-current={on === id ? 'true' : undefined}
          onClick={() => { if (on === id && !onPick) return set({ share: null }); note(`went straight to "${label}"`, `agenda:${id}`); set({ share: id }); onPick?.() }}>{label}</button>
      ))}
      <a href="/resume" target="_blank" rel="noreferrer">Resume</a>
    </nav>
  )
}
