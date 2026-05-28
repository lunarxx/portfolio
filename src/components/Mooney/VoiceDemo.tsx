'use client'

import { useState, useRef } from 'react'
import { ReceiptCard } from './ReceiptCard'
import styles from './Mooney.module.css'

type DemoState = 'idle' | 'recording' | 'transcribing' | 'parsing' | 'done' | 'error'

interface Expense {
  amount: number
  category: string
  merchant: string
  currency: string
  transcript: string
}

export function VoiceDemo() {
  const [state, setState] = useState<DemoState>('idle')
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
      setState('recording')
    } catch {
      setError('mic access needed to try this demo')
      setState('error')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    mediaRef.current?.stream.getTracks().forEach(t => t.stop())
  }

  const processAudio = async () => {
    setState('transcribing')
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const form = new FormData()
    form.append('audio', blob)

    try {
      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: form })
      if (!transcribeRes.ok) throw new Error()
      const { transcript } = await transcribeRes.json()

      setState('parsing')
      const parseRes = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (!parseRes.ok) throw new Error()
      const parsed = await parseRes.json()

      setExpense({ ...parsed, transcript })
      setState('done')
    } catch {
      setError('something went wrong — try again')
      setState('error')
    }
  }

  const reset = () => {
    setState('idle')
    setExpense(null)
    setError('')
  }

  return (
    <div className={styles.voiceDemo}>
      {state === 'idle' && (
        <>
          <button className={styles.micButton} onClick={startRecording}>
            <MicIcon />
          </button>
          <p className={styles.micLabel}>try logging an expense</p>
        </>
      )}
      {state === 'recording' && (
        <>
          <button className={`${styles.micButton} ${styles.recording}`} onClick={stopRecording}>
            <MicIcon />
          </button>
          <p className={styles.micLabel}>tap to stop</p>
        </>
      )}
      {state === 'transcribing' && <p className={styles.status}>transcribing...</p>}
      {state === 'parsing' && <p className={styles.status}>parsing expense...</p>}
      {state === 'done' && expense && (
        <>
          <ReceiptCard expense={expense} />
          <button className={styles.tryAgain} onClick={reset}>try another</button>
        </>
      )}
      {state === 'error' && (
        <>
          <p className={styles.error}>{error}</p>
          <button className={styles.tryAgain} onClick={reset}>try again</button>
        </>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}
