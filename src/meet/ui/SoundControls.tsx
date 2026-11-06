'use client'
// the call's sound, the same at the door and in the call: him, the room (music, keyboard, his set's static), and how loud
import { useEffect, useState } from 'react'
import { get, set, useMeet } from '../store.js'
import { stage, wakeAudio } from '../show.js'
import { Sound, Tv, Note } from './icons'
import s from './meet.module.css'

export function VoiceMute() {
  const { voiceOff } = useMeet()
  return <button className={`${s.rb} ${voiceOff ? s.struck : ''}`} onClick={() => { const v = !get().voiceOff; stage()?.sound.muteVoice(v); set({ voiceOff: v }) }} title={voiceOff ? 'Unmute Ashwini' : 'Mute Ashwini (his captions stay)'} aria-label={voiceOff ? 'Unmute Ashwini' : 'Mute Ashwini'} aria-pressed={!!voiceOff}><Tv /></button>
}

export function MusicMute({ className = '' }: { className?: string }) {
  const { roomOff } = useMeet()
  return <button className={`${s.rb} ${className} ${roomOff ? s.struck : ''}`} onClick={() => { const v = !get().roomOff; stage()?.sound.muteRoom(v); set({ roomOff: v }) }} title={roomOff ? 'Turn the music on' : 'Turn the music off'} aria-label={roomOff ? 'Turn the music on' : 'Turn the music off'} aria-pressed={!!roomOff}><Note /></button>
}

// how loud the whole call is, remembered on this device
export function Volume() {
  const { volume } = useMeet() as { volume?: number }
  const [v, setV] = useState(() => { if (volume != null) return volume; try { const x = parseFloat(localStorage.getItem('meet-volume') || ''); return x >= 0 && x <= 1 ? x : .8 } catch { return .8 } })
  useEffect(() => { let t = 0; const go = () => { const st = stage(); if (st?.sound) st.sound.volume(v); else t = window.setTimeout(go, 400) }; go(); return () => clearTimeout(t) }, [v])
  return (
    <label className={s.volbox} title="Volume">
      <Sound on={v > 0} />
      <input type="range" min={0} max={1} step={.02} value={v} aria-label="Volume" style={{ '--v': `${v * 100}%` } as React.CSSProperties}
        onChange={(e) => { const x = +e.target.value; setV(x); set({ volume: x }); wakeAudio(); try { localStorage.setItem('meet-volume', String(x)) } catch {} }} />
    </label>
  )
}
