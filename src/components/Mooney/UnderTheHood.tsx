'use client'

import { useState } from 'react'
import styles from './UnderTheHood.module.css'

const pipeline = [
  { label: 'Voice In', detail: 'MediaRecorder API captures audio as WebM blobs', color: '#2A6B4F' },
  { label: 'Deepgram Nova-3', detail: 'Speech-to-text in <200ms. 2-key rotation, 200 calls/day/device', color: '#2A6B4F' },
  { label: 'Groq 8b', detail: 'Primary LLM. Parses transcript into amount, category, merchant. JSON mode.', color: '#3a7a5e' },
  { label: 'Groq 70b', detail: 'Fallback for ambiguous inputs. Activates when 8b returns UNKNOWN.', color: '#4a8a6e' },
  { label: 'Cerebras', detail: 'Second fallback. Different provider entirely for resilience.', color: '#5a9a7e' },
  { label: 'OpenRouter', detail: 'Last resort free tier. Ensures the pipeline never fully dies.', color: '#6aaa8e' },
]

const techCards = [
  { title: 'Flutter + Kotlin', body: 'two android processes. main app + overlay system with file-based IPC.' },
  { title: 'Supabase Edge Functions', body: 'stt, llm parsing, receipt ocr, push notifications, cloud backup. all serverless.' },
  { title: 'Key Rotation', body: 'shared API key pool with RPM tracking and automatic 60s cooldown per key.' },
  { title: 'Receipt OCR', body: 'groq scout vision → groq 70b text → gemini flash. three-tier vision pipeline.' },
  { title: 'Multi-Currency', body: '60+ countries. per-country STT language codes, LLM prompt rules, OCR prompts.' },
  { title: 'Native Widgets', body: 'voice + type widgets on home screen. kotlin SummaryWidgetProvider, ProActionsWidgetProvider.' },
]

export function UnderTheHood() {
  const [open, setOpen] = useState(false)

  return (
    <div className={styles.wrapper}>
      <button className={styles.stimulus} onClick={() => setOpen(!open)}>
        <div className={styles.stimulusLine} />
        <span className={styles.stimulusText}>
          {open ? 'close' : 'what went into building this'}
        </span>
        <div className={styles.stimulusLine} />
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelLeft}>
            <h3 className={styles.panelTitle}>the ai pipeline</h3>
            <p className={styles.panelSubtitle}>4 providers. if one dies, the next catches it. it never breaks.</p>
            <div className={styles.pipelineFlow}>
              {pipeline.map((node, i) => (
                <div key={node.label} className={styles.pipelineNode}>
                  <div className={styles.nodeDot} style={{ background: node.color }} />
                  <div className={styles.nodeContent}>
                    <span className={styles.nodeLabel}>{node.label}</span>
                    <span className={styles.nodeDetail}>{node.detail}</span>
                  </div>
                  {i < pipeline.length - 1 && <div className={styles.nodeConnector} />}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panelDivider} />

          <div className={styles.panelRight}>
            <h3 className={styles.panelTitle}>what i actually built</h3>
            <p className={styles.panelSubtitle}>not just the app. the whole system behind it.</p>
            <div className={styles.techGrid}>
              {techCards.map(card => (
                <div key={card.title} className={styles.techCard}>
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
