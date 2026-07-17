'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './Inkling.module.css'

type FeatureKey = 'local' | 'git' | 'space'

const FEATURES: { key: FeatureKey; tab: string; title: string; body: string }[] = [
  {
    key: 'local',
    tab: 'local-first',
    title: 'lives on your disk',
    body: 'every note is plain markdown in a real folder. works fully offline, and your words never touch a server unless you want them to.',
  },
  {
    key: 'git',
    tab: 'git-native',
    title: 'your vault is a repo',
    body: 'point it at a github repo and sync is free. real version history, branches, and no proprietary backend to trust.',
  },
  {
    key: 'space',
    tab: 'think in space',
    title: 'panes, canvas, graph',
    body: 'split the editor into panes, spread notes on a freeform canvas, and watch wiki-links draw themselves into a graph.',
  },
]

// two people typing into the SAME word, live. this is how i actually proved
// the crdt worked: two of us fought over one word and it merged instead of breaking.
const STEPS = ['', 'w', 'wa', 'wav', 'wave', 'waves']
const OWNER: ('you' | 'sam')[] = ['you', 'sam', 'you', 'sam', 'you', 'sam']

function CollabDemo() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setI(STEPS.length - 1)
      return
    }
    let idx = 0
    const id = setInterval(() => {
      idx = (idx + 1) % (STEPS.length + 3) // +3 = hold on the finished word before looping
      setI(Math.min(idx, STEPS.length - 1))
    }, 560)
    return () => clearInterval(id)
  }, [])

  const word = STEPS[i]
  const active = OWNER[i]

  return (
    <div className={styles.editor}>
      <div className={styles.editorBar}>
        <span className={styles.drift} />
        <em>notes.md</em>
        <span className={styles.presence}>
          <i className={styles.pipYou} /> you
          <i className={styles.pipSam} /> sam
          <b>2 editing now</b>
        </span>
      </div>
      <div className={styles.editorBody}>
        <p className={styles.h1}>make waves, together</p>
        <p className={styles.line}>a note that lives on your disk.</p>
        <p className={styles.line}>
          let&rsquo;s make{' '}
          <span className={styles.liveWord}>
            {word}
            <span className={`${styles.caret} ${styles.caretSam} ${active === 'sam' ? styles.caretOn : ''}`}>
              <span className={styles.flagSam}>sam</span>
            </span>
            <span className={`${styles.caret} ${styles.caretYou} ${active === 'you' ? styles.caretOn : ''}`}>
              <span className={styles.flagYou}>you</span>
            </span>
          </span>{' '}
          today
        </p>
        <p className={styles.mergeNote}>no conflicts. it just merges.</p>
      </div>
    </div>
  )
}

export function InklingSection() {
  const [active, setActive] = useState<FeatureKey>('local')
  const feature = FEATURES.find(f => f.key === active)!

  return (
    <section className={styles.section} id="inkling">
      {/* beige wave cap so the top blends into aarttsii instead of leaking */}
      <div className={styles.waveTop} aria-hidden="true">
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
          <path d="M0,0 L1440,0 L1440,42 C1120,96 800,8 480,54 C300,80 140,74 0,58 Z" />
        </svg>
      </div>

      {/* sunny sky */}
      <div className={styles.sun} aria-hidden="true" />
      <div className={`${styles.cloud} ${styles.cloud1}`} aria-hidden="true" />
      <div className={`${styles.cloud} ${styles.cloud2}`} aria-hidden="true" />

      <div className={styles.inner}>
        <ScrollReveal>
          <div className={styles.brand}>
            <Image src="/inkling-drop.png" alt="Inkling" width={512} height={512} className={styles.drop} />
            <span className={styles.wordmark}>inkling</span>
          </div>
          <h2 className={styles.title}>
            notes that <span className={styles.accent}>never touch a server.</span>
          </h2>
          <p className={styles.tagline}>
            a markdown workspace that lives on your machine. your vault is a github repo, so sync and
            real-time collaboration come free. it&rsquo;s shipped and self-updating on desktop right now.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className={styles.showcase}>
            <CollabDemo />

            <div className={styles.features}>
              <div className={styles.tabs}>
                {FEATURES.map(f => (
                  <button
                    key={f.key}
                    className={`${styles.tab} ${active === f.key ? styles.tabActive : ''}`}
                    onClick={() => setActive(f.key)}
                  >
                    {f.tab}
                  </button>
                ))}
              </div>
              <div className={styles.featurePanel}>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureBody}>{feature.body}</p>
              </div>
              <div className={styles.ctas}>
                <a className={styles.primary} href="https://inkling.octyn.co" target="_blank" rel="noopener noreferrer">
                  visit inkling ↗
                </a>
                <a className={styles.secondary} href="https://inkling.octyn.co/download" target="_blank" rel="noopener noreferrer">
                  download
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* animated shoreline */}
      <div className={styles.waves} aria-hidden="true">
        {[styles.wave1, styles.wave2, styles.wave3].map((w, idx) => (
          <div key={idx} className={`${styles.waveLayer} ${w}`}>
            <svg viewBox="0 0 2400 120" preserveAspectRatio="none">
              <path d="M0,60 C150,24 450,24 600,60 C750,96 1050,96 1200,60 C1350,24 1650,24 1800,60 C1950,96 2250,96 2400,60 L2400,120 L0,120 Z" />
            </svg>
          </div>
        ))}
      </div>
    </section>
  )
}
