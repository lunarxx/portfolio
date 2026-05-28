'use client'

import { useState, useRef } from 'react'
import { ReceiptCard } from './ReceiptCard'
import styles from './Mooney.module.css'

type Phase = 'idle' | 'recording' | 'transcribing' | 'parsing' | 'done' | 'error'

interface Expense {
  amount: number
  category: string
  merchant: string
  currency: string
  transcript: string
}

export function VoiceDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [expense, setExpense] = useState<Expense | null>(null)
  const [error, setError] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => processAudio()
      mediaRef.current = recorder
      recorder.start()
      setPhase('recording')
    } catch {
      setError('mic access needed to try this')
      setPhase('error')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    mediaRef.current?.stream.getTracks().forEach(t => t.stop())
  }

  const processAudio = async () => {
    setPhase('transcribing')
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const form = new FormData()
    form.append('audio', blob)

    try {
      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: form })
      if (!transcribeRes.ok) throw new Error()
      const { transcript } = await transcribeRes.json()

      setPhase('parsing')
      const parseRes = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (!parseRes.ok) throw new Error()
      const parsed = await parseRes.json()

      setExpense({ ...parsed, transcript })
      setPhase('done')
    } catch {
      setError('something went wrong')
      setPhase('error')
    }
  }

  const reset = () => {
    setPhase('idle')
    setExpense(null)
    setError('')
  }

  if (phase === 'done' && expense) {
    return (
      <div className={styles.voiceDemo}>
        <ReceiptCard expense={expense} />
        <button className={styles.tryAgain} onClick={reset}>try another</button>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className={styles.voiceDemo}>
        <p className={styles.error}>{error}</p>
        <button className={styles.tryAgain} onClick={reset}>retry</button>
      </div>
    )
  }

  return (
    <div className={styles.voiceDemo}>
      {phase === 'idle' && (
        <>
          <p className={styles.demoHint}>try saying:</p>
          <p className={styles.demoExample}>&ldquo;five dollars on coffee&rdquo;</p>
          <button className={styles.micButton} onClick={startRecording}>
            <MicIcon />
          </button>
          <p className={styles.micLabel}>tap to speak</p>
        </>
      )}
      {phase === 'recording' && (
        <>
          <div className={styles.waveform}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.waveBar} style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <button className={`${styles.micButton} ${styles.recording}`} onClick={stopRecording}>
            <StopIcon />
          </button>
          <p className={styles.micLabel}>listening...</p>
        </>
      )}
      {(phase === 'transcribing' || phase === 'parsing') && (
        <div className={styles.processingState}>
          <div className={styles.dots}>
            <span /><span /><span />
          </div>
          <p className={styles.micLabel}>
            {phase === 'transcribing' ? 'transcribing your voice...' : 'parsing the expense...'}
          </p>
        </div>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}
