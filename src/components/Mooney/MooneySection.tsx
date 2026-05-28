'use client'

import { useState } from 'react'
import Image from 'next/image'
import { VoiceDemo } from './VoiceDemo'
import { SectionDivider } from './SectionDivider'
import styles from './Mooney.module.css'

const pipeline = [
  { label: 'Voice In', detail: 'MediaRecorder captures audio as WebM' },
  { label: 'Deepgram Nova-3', detail: 'STT in <200ms. 2-key rotation, 200 calls/day' },
  { label: 'Groq 8b', detail: 'primary LLM. parses into amount, category, merchant' },
  { label: 'Groq 70b', detail: 'fallback for ambiguous inputs' },
  { label: 'Cerebras', detail: 'second fallback. different provider for resilience' },
  { label: 'OpenRouter', detail: 'last resort. free tier. pipeline never fully dies' },
]

const techCards = [
  { title: 'Flutter + Kotlin', body: 'two android processes. main app + overlay with file-based IPC.' },
  { title: 'Supabase Edge Functions', body: 'stt, llm, ocr, push, cloud backup. all serverless.' },
  { title: 'Key Rotation', body: 'shared key pool. RPM tracking. auto 60s cooldown.' },
  { title: 'Receipt OCR', body: 'groq scout vision → 70b text → gemini flash. three-tier.' },
  { title: 'Multi-Currency', body: '60+ countries. per-country STT, LLM rules, OCR prompts.' },
  { title: 'Native Widgets', body: 'voice + type widgets. kotlin providers on home screen.' },
]

export function MooneySection() {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <SectionDivider />
      <section className={styles.section} id="mooney">
        {/* Floating bubbles */}
        {!expanded && (
          <>
            <div className={`${styles.bubble} ${styles.bubbleLeft}`}>
              third coffee today. at this point just <strong>buy the machine</strong>.
            </div>
            <div className={`${styles.bubble} ${styles.bubbleRight}`}>
              your gym membership is basically a <strong>monthly donation</strong>.
            </div>
          </>
        )}

        {/* Headline */}
        <h2 className={styles.title}>
          your money, <span className={styles.accent}>spoken for.</span>
        </h2>
        <p className={styles.tagline}>just say it. mooney tracks it.</p>

        {/* Main content area — always renders both sides, CSS handles visibility */}
        <div className={`${styles.contentArea} ${expanded ? styles.contentExpanded : ''}`}>
          {/* Demo side */}
          <div className={styles.demoSide}>
            <div className={styles.demoArea}>
              <div className={styles.mascotPeek}>
                <Image
                  src="/mooney/peeking-over.png"
                  alt="mooney mascot peeking"
                  width={1430}
                  height={830}
                  draggable={false}
                />
              </div>
              <div className={styles.demoCard}>
                <VoiceDemo />
              </div>
            </div>
          </div>

          {/* Breakdown side — always in DOM, animated via CSS */}
          <div className={styles.breakdownSide}>
            <div className={styles.breakdownPanel}>
              <h3 className={styles.breakdownTitle}>the ai pipeline</h3>
              <p className={styles.breakdownSub}>4 providers. if one dies, the next catches it.</p>
              <div className={styles.pipelineFlow}>
                {pipeline.map((node, i) => (
                  <div key={node.label} className={styles.pipelineNode}>
                    <div className={styles.nodeDot} />
                    <div className={styles.nodeContent}>
                      <span className={styles.nodeLabel}>{node.label}</span>
                      <span className={styles.nodeDetail}>{node.detail}</span>
                    </div>
                    {i < pipeline.length - 1 && <div className={styles.nodeConnector} />}
                  </div>
                ))}
              </div>

              <div className={styles.breakdownDivider} />

              <h3 className={styles.breakdownTitle}>what i actually built</h3>
              <p className={styles.breakdownSub}>not just the app. the whole system behind it.</p>
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
        </div>

        {/* Stimulus button */}
        <button className={styles.stimulus} onClick={() => setExpanded(!expanded)}>
          <div className={styles.stimulusLine} />
          <span className={styles.stimulusText}>
            {expanded ? 'close' : 'what went into building this'}
          </span>
          <div className={styles.stimulusLine} />
        </button>
      </section>
    </>
  )
}
