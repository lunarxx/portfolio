'use client'

import { useState, useCallback, useRef, Fragment } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { creators, qualifications } from '@/data/creators'
import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './WhoFits.module.css'

const WhoFitsModel = dynamic(() => import('./WhoFitsModel').then(m => ({ default: m.WhoFitsModel })), {
  ssr: false,
  loading: () => <div className={styles.modelPlaceholder} />,
})

type Phase = 'seed' | 'scanning' | 'done'

const ENGINES = [
  {
    key: 'source',
    name: 'Lead Sourcer',
    tag: 'discovery',
    body: 'the discovery layer. it harvests a huge pool of free proxies and rotates proxy, search engine and fingerprint to pull clean lead lists at scale, resilient to blocks and never running through my own connection.',
  },
  {
    key: 'qualify',
    name: 'Qualification Engine',
    tag: 'scoring',
    body: 'the dashboard above. every lead gets scored on real intent and fit, then passed through two gates, mentality and feasibility, before anyone gets enriched. that is what stops it drowning in junk.',
  },
  {
    key: 'content',
    name: 'Content Engine',
    tag: 'octyn studio',
    body: 'turns one brief into campaign copy, statics and short videos in the client\'s own voice, in bulk, so outreach and ads always have something real to send.',
  },
  {
    key: 'outreach',
    name: 'Outreach Engine',
    tag: 'multi-channel',
    body: 'drafts email, x and linkedin in the client\'s real voice with cadence tuned per profile, controlled from telegram, and it never cold pitches a thread that is already live.',
  },
  {
    key: 'growth',
    name: 'Growth Engine',
    tag: 'feedback loop',
    body: 'the loop that closes it. it watches what actually lands and feeds it back, so every source and message gets reweighted toward whatever converts. a channel that returns nothing gets dropped on its own.',
  },
]

export function WhoFitsSection() {
  const [phase, setPhase] = useState<Phase>('seed')
  const [scannedRows, setScannedRows] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [fileDragging, setFileDragging] = useState(false)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [engine, setEngine] = useState('qualify')

  const startScan = useCallback(() => {
    if (phase !== 'seed') return
    setPhase('scanning')
    setScannedRows(0)
    setFileDragging(false)
    let row = 0
    const interval = setInterval(() => {
      row++
      setScannedRows(row)
      if (row >= creators.length) {
        clearInterval(interval)
        setTimeout(() => {
          setPhase('done')
          setSelectedRow('c3')
        }, 400)
      }
    }, 350)
  }, [phase])

  const selected = selectedRow ? qualifications[selectedRow] : null

  return (
    <section className={styles.section} id="whofits">
      <ScrollReveal>
        <p className={styles.label}>CREATOR INTELLIGENCE PLATFORM</p>
        <h2 className={styles.title}>
          The Complete<br />Scouting System.
        </h2>
        <p className={styles.subtitle}>
          whofits is a SaaS that helps influencer agencies find creators worth working with. not by follower count,
          but by where they sit in the network. 25,000 creators crawled. drop a seed list and watch it qualify.
        </p>
      </ScrollReveal>

      <div className={styles.showcase}>
        <div className={styles.characterWrap}>
          <WhoFitsModel />
        </div>

        {phase === 'seed' && (
          <div
            className={`${styles.floatingFile} ${fileDragging ? styles.fileDragging : ''}`}
            draggable
            onDragStart={() => setFileDragging(true)}
            onDragEnd={() => setFileDragging(false)}
          >
            <div className={styles.fileIcon}>
              <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
                <path d="M2 1h16l8 8v24H2V1z" fill="#272220" stroke="#d4a574" strokeWidth="1.2" />
                <path d="M18 1v8h8" stroke="#d4a574" strokeWidth="1.2" />
                <text x="14" y="24" textAnchor="middle" fill="#d4a574" fontSize="7" fontFamily="monospace">CSV</text>
              </svg>
            </div>
            <span className={styles.fileName}>seed_list.csv</span>
            <span className={styles.fileSize}>6 creators</span>
          </div>
        )}

        <ScrollReveal delay={200}>
          <div
            className={`${styles.engineContainer} ${dragOver ? styles.engineActive : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); startScan() }}
          >
            <div className={styles.engineHeader}>
              <div className={styles.windowDots}>
                <span className={styles.dot} style={{ background: '#ff5f57' }} />
                <span className={styles.dot} style={{ background: '#febc2e' }} />
                <span className={styles.dot} style={{ background: '#28c840' }} />
                <span className={styles.engineTitle}>QUALIFICATION ENGINE</span>
              </div>
            </div>

            {phase === 'seed' && (
              <div className={styles.dropZone} onClick={startScan}>
                <p className={styles.dropText}><span className={styles.desktopOnly}>drag the seed list here to qualify</span><span className={styles.mobileOnly}>tap to start qualification</span></p>
                <p className={`${styles.dropHint} ${styles.desktopOnly}`}>or click anywhere</p>
              </div>
            )}

            {(phase === 'scanning' || phase === 'done') && (
              <div className={styles.tableWrap}>
                {phase === 'scanning' && (
                  <div className={styles.scanBar}>
                    <div className={styles.scanFill} style={{ width: `${(scannedRows / creators.length) * 100}%` }} />
                  </div>
                )}
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>CREATOR</th>
                      <th>NETWORK</th>
                      <th>CONSISTENCY</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creators.map((c, i) => {
                      const q = qualifications[c.id]
                      const isVisible = i < scannedRows || phase === 'done'
                      const isScanning = phase === 'scanning' && i === scannedRows - 1
                      return (
                        <tr
                          key={c.id}
                          className={`${styles.row} ${!isVisible ? styles.rowHidden : ''} ${isScanning ? styles.rowScanning : ''} ${selectedRow === c.id ? styles.rowSelected : ''}`}
                          onClick={() => phase === 'done' && setSelectedRow(c.id)}
                        >
                          <td>
                            <div className={styles.creatorCell}>
                              <div className={styles.avatar}>{c.name.split(' ').map(n => n[0]).join('')}</div>
                              <div>
                                <span className={styles.creatorHandle}>{c.handle.replace('@', '').toUpperCase()}</span>
                                <span className={styles.creatorNiche}>{c.nicheLabel}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            {isVisible && phase === 'done' ? (
                              <span className={styles.networkGrade} data-grade={q.networkGrade[0]}>
                                {q.networkGrade} ({q.networkScore})
                              </span>
                            ) : isVisible ? (
                              <span className={styles.scanning}>scanning...</span>
                            ) : null}
                          </td>
                          <td>
                            {isVisible && phase === 'done' ? (
                              <span className={styles.consistency}>{q.consistencyScore}</span>
                            ) : isVisible ? (
                              <span className={styles.scanning}>...</span>
                            ) : null}
                          </td>
                          <td>
                            {isVisible && phase === 'done' ? (
                              <span className={styles.statusBadge} data-status={q.status}>{q.status}</span>
                            ) : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      {phase === 'done' && selected && (
        <ScrollReveal>
          <div className={styles.detailPanel}>
            <div className={styles.signals}>
              {[
                { label: 'Niche Relevance', desc: 'content alignment and niche authority', value: selected.nicheRelevance },
                { label: 'Engagement Quality', desc: 'authentic engagement signals', value: selected.engagementQuality },
                { label: 'Brand Safety', desc: 'content risk assessment', value: selected.brandSafety },
                { label: 'Network Centrality', desc: 'key connectors in niche', value: selected.networkPosition },
              ].map(s => (
                <div key={s.label} className={styles.signalCard}>
                  <div className={styles.signalHeader}>
                    <span className={styles.signalName}>{s.label}</span>
                    <span className={styles.signalValue}>{s.value}</span>
                  </div>
                  <p className={styles.signalDesc}>{s.desc}</p>
                  <div className={styles.signalBar}>
                    <div className={styles.signalFill} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal>
        <div className={styles.pipeline}>
          <p className={styles.pipelineLabel}>qualification is one of five engines behind whofits</p>
          <div className={styles.pipelineRow}>
            {ENGINES.map((e, i) => (
              <Fragment key={e.key}>
                <button
                  className={`${styles.engineNode} ${engine === e.key ? styles.engineNodeActive : ''}`}
                  onClick={() => setEngine(e.key)}
                >
                  <span className={styles.engineNodeIdx}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={styles.engineNodeName}>{e.name}</span>
                  <span className={styles.engineNodeTag}>{e.tag}</span>
                </button>
                {i < ENGINES.length - 1 && <span className={styles.engineArrow}>→</span>}
              </Fragment>
            ))}
          </div>
          <div className={styles.enginePanel}>
            <p>{ENGINES.find(e => e.key === engine)!.body}</p>
          </div>
        </div>
      </ScrollReveal>

      <Link href="/case/whofits" className={styles.viewCase}>
        view case study
      </Link>
    </section>
  )
}
