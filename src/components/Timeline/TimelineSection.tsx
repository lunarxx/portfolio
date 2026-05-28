'use client'

import { useState } from 'react'
import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './Timeline.module.css'

const timeline = [
  {
    id: 'sanshu',
    years: '2020 – 2023',
    title: 'Sanshu Studios',
    role: 'Lead 3D Artist',
    description: 'part of crypto\'s first decentralized design studio. created animated NFT trading cards in Blender for the Yokai Collection.',
    highlights: ['2,000 NFTs from 8 animated artworks', 'phase 1 sold out in 3 days', 'global remote team'],
  },
  {
    id: 'media3ms',
    years: '2023 – 2024',
    title: 'media3ms',
    role: '3D Marketing Agency',
    description: 'ran a 3-person agency making personalized 3D mascot animations for brands.',
    highlights: ['personalized 3D mascots in Blender', 'client-facing creative work', '3-person team'],
  },
  {
    id: 'builder',
    years: '2025 – Present',
    title: 'Product Engineering',
    role: 'AI + Full-Stack',
    description: 'building AI-powered products end-to-end. voice interfaces, vision pipelines, SaaS platforms, internal automation.',
    highlights: ['mooney — 19 beta testers', 'whofits — 25k creators crawled', 'aarttsii — live e-commerce'],
  },
]

export function TimelineSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <section className={styles.section} id="timeline">
      <ScrollReveal>
        <h2 className={styles.title}>the journey so far</h2>
      </ScrollReveal>

      <div className={styles.track}>
        {timeline.map(era => (
          <div key={era.id} className={styles.node} onClick={() => setExpandedId(expandedId === era.id ? null : era.id)}>
            <div className={styles.dot} />
            <div className={styles.years}>{era.years}</div>
            <div className={styles.card}>
              <h3 className={styles.eraTitle}>{era.title}</h3>
              <p className={styles.role}>{era.role}</p>
              {expandedId === era.id && (
                <div className={styles.expanded}>
                  <p className={styles.eraDescription}>{era.description}</p>
                  <ul className={styles.highlights}>
                    {era.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
