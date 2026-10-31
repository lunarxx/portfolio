'use client'
// the interview: a call with ashwini at his desk. the call is always there underneath (his room has to keep its one
// canvas); the lobby sits over it until you walk in, then the room settles into his tile
import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { get, set, live, useMeet, note, spokenName } from '../store.js'
import { say, wakeAudio } from '../show.js'
import { chips, loadMatcher } from '../brain.js'
import { start as startYou } from '../you.js'
import { start as startRoom } from '../room.js'
import { StageHidden } from './Stage'
import { Lobby } from './Lobby'
import { Call } from './Call'
import s from './meet.module.css'

async function join() {
  if (get().phase === 'call') return
  await wakeAudio()
  set({ phase: 'call', name: get().name.trim().slice(0, 22), joinedAt: performance.now(), bubble: null })
  // what you walked in as: the first lines of his notes
  const l = get().look, who = (l.base || 'rory')[0].toUpperCase() + (l.base || 'rory').slice(1)
  const wearing = [l.hat && l.hat !== 'none' && (l.hat === 'party' ? 'a party hat' : l.hat === 'headphones' ? 'headphones' : `a ${l.hat === 'cap' ? 'cap' : l.hat === 'bucket' ? 'bucket hat' : l.hat}`), l.glasses && 'glasses', l.pattern !== 'plain' && `a ${l.pattern === 'yoke' ? 'two-tone' : l.pattern} top`].filter(Boolean)
  note(`came in as ${who}${wearing.length ? `, with ${wearing.join(' and ')}` : ''}`)
  note(get().name ? 'told me their name before joining' : 'joined without giving a name')
  setTimeout(() => { const n = spokenName(get().name); say(n ? `Hey ${n}.` : 'Hey, come in.', { mark: 'hello' }); chips() }, 900)
}
function leave() {
  const n = spokenName(get().name)
  say(`Thanks for coming in${n ? `, ${n}` : ''}. Talk soon.`, { mark: 'hello' })
  setTimeout(() => set({ share: 'bye' }), 2600)
}

export default function Meet({ fonts }: { fonts: string }) {
  const { phase } = useMeet()
  useEffect(() => { startYou(); startRoom(); loadMatcher(); live.lastAction = performance.now(); (window as any).__meetJoin = join }, [])
  return (
    <div className={`${s.root} ${fonts}`}>
      <StageHidden />
      <Call live={phase === 'call'} onLeave={leave} />
      <AnimatePresence>{phase === 'lobby' && <Lobby onJoin={join} />}</AnimatePresence>
    </div>
  )
}
