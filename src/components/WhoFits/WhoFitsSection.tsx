'use client'

import { useState } from 'react'
import Link from 'next/link'
import { creators, qualifications, type Qualification } from '@/data/creators'
import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './WhoFits.module.css'

function formatFollowers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

export function WhoFitsSection() {
  const [qualifiedId, setQualifiedId] = useState<string | null>(null)
  const [dragOverDashboard, setDragOverDashboard] = useState(false)

  const qual: Qualification | null = qualifiedId ? qualifications[qualifiedId] : null

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('creatorId', id)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('creatorId')
    if (id) setQualifiedId(id)
    setDragOverDashboard(false)
  }

  return (
    <>
      <div className={styles.divider} />
      <section className={styles.section} id="whofits">
        <ScrollReveal>
          <h2 className={styles.title}>
            find creators <span className={styles.accent}>worth working with.</span>
          </h2>
          <p className={styles.tagline}>
            network aware qualification, not just follower counts. drag a creator to see it work.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className={styles.demoArea}>
            <div className={styles.creatorList}>
              {creators.map(c => (
                <div
                  key={c.id}
                  className={styles.creatorCard}
                  draggable
                  onDragStart={(e) => handleDragStart(e, c.id)}
                  onClick={() => setQualifiedId(c.id)}
                >
                  <div className={styles.avatar}>{c.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className={styles.handle}>{c.handle}</div>
                  <div className={styles.creatorName}>{c.name}</div>
                  <div className={styles.bio}>{c.bio}</div>
                  <div className={styles.followers}>{formatFollowers(c.followers)} followers</div>
                </div>
              ))}
            </div>

            {!qualifiedId && (
              <div className={styles.arrowArea}>
                <svg className={styles.arrow} viewBox="0 0 200 100" fill="none">
                  <path
                    d="M 10 50 C 50 20, 80 80, 120 45 S 170 30, 185 50"
                    stroke="var(--wf-accent)"
                    strokeWidth="2"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                    className={styles.arrowPath}
                  />
                  <polygon points="185,50 175,44 175,56" fill="var(--wf-accent)" />
                </svg>
              </div>
            )}

            <div
              className={`${styles.dashboard} ${dragOverDashboard ? styles.dashboardOver : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverDashboard(true) }}
              onDragLeave={() => setDragOverDashboard(false)}
              onDrop={handleDrop}
            >
              {!qual ? (
                <p className={styles.dropHint}>drop a creator here to qualify them</p>
              ) : (
                <div className={styles.qualData}>
                  <div className={styles.overallScore} data-level={qual.overallScore >= 80 ? 'high' : qual.overallScore >= 60 ? 'mid' : 'low'}>
                    {qual.overallScore}
                  </div>
                  <p className={styles.niche}>{qual.niche}</p>
                  <p className={styles.audience}>{qual.audienceType}</p>
                  <div className={styles.scores}>
                    {[
                      { label: 'Brand Safety', value: qual.brandSafety },
                      { label: 'Engagement', value: qual.engagementQuality },
                      { label: 'Niche Fit', value: qual.nicheRelevance },
                      { label: 'Network', value: qual.networkPosition },
                    ].map(s => (
                      <div key={s.label} className={styles.scoreBar}>
                        <span className={styles.scoreLabel}>{s.label}</span>
                        <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${s.value}%` }} /></div>
                        <span className={styles.scoreValue}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.topics}>
                    {qual.topTopics.map(t => <span key={t} className={styles.topic}>{t}</span>)}
                  </div>
                  <span className={styles.riskBadge} data-risk={qual.risk}>{qual.risk} risk</span>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        <Link href="/case/whofits" className={styles.viewCase}>
          view case study →
        </Link>
      </section>
    </>
  )
}
