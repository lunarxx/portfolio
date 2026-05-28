'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { creators, qualifications } from '@/data/creators'
import { samples, type Sample } from '@/data/aarttsii-samples'
import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './ProjectCards.module.css'

const WhoFitsModel = dynamic(() => import('../WhoFits/WhoFitsModel').then(m => ({ default: m.WhoFitsModel })), {
  ssr: false,
  loading: () => <div style={{ height: 360 }} />,
})

type ScanPhase = 'idle' | 'scanning' | 'done'
type Tier = 'Mousse' | 'Chenille'
type Size = 'Mini' | 'Standard'
type EstStep = 'pick' | 'configure' | 'analyzing' | 'result'

const PRICE_BANDS: Record<Size, Record<Tier, { min: number; max: number }>> = {
  Mini: { Mousse: { min: 250, max: 800 }, Chenille: { min: 400, max: 1300 } },
  Standard: { Mousse: { min: 400, max: 1500 }, Chenille: { min: 700, max: 2500 } },
}
const MATERIALS: Record<Size, Record<Tier, number>> = {
  Mini: { Mousse: 80, Chenille: 120 }, Standard: { Mousse: 150, Chenille: 220 },
}
const HOURLY: Record<Tier, number> = { Mousse: 220, Chenille: 250 }

function calcPrice(ci: number, size: Size, tier: Tier) {
  const band = PRICE_BANDS[size][tier]
  const pos = Math.pow(Math.min(ci, 10) / 10, 0.65)
  const range = band.max - band.min
  const point = band.min + range * pos
  const v = point * 0.18
  const min = Math.round((point - v) / 10) * 10
  const max = Math.round((point + v) / 10) * 10
  const mat = MATERIALS[size][tier]
  const base = size === 'Mini' ? 80 : 100
  const labour = Math.max(min - mat - base, 0)
  const hours = Math.round((labour / HOURLY[tier]) * 4) / 4
  return { min, max, materials: mat, labour, hours, hourlyRate: HOURLY[tier], base }
}

export function ProjectCards() {
  // WhoFits
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle')
  const [scannedRows, setScannedRows] = useState(0)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)

  const startScan = useCallback(() => {
    if (scanPhase !== 'idle') return
    setScanPhase('scanning')
    setScannedRows(0)
    let row = 0
    const interval = setInterval(() => {
      row++
      setScannedRows(row)
      if (row >= creators.length) {
        clearInterval(interval)
        setTimeout(() => { setScanPhase('done'); setSelectedRow('c3') }, 300)
      }
    }, 280)
  }, [scanPhase])

  // Aarttsii
  const [estStep, setEstStep] = useState<EstStep>('pick')
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null)
  const [tier, setTier] = useState<Tier>('Mousse')
  const [size, setSize] = useState<Size>('Mini')

  const pickProduct = (s: Sample) => {
    setSelectedSample(s)
    setEstStep('configure')
  }

  const runEstimate = () => {
    setEstStep('analyzing')
    setTimeout(() => setEstStep('result'), 1800)
  }

  const estimate = selectedSample?.estimate
  const price = estimate ? calcPrice(estimate.ci, size, tier) : null

  return (
    <section className={styles.section} id="projects">
      <ScrollReveal>
        <h2 className={styles.sectionTitle}>more things i built</h2>
      </ScrollReveal>

      <ScrollReveal>
      <div className={styles.cardRow}>
        <div className={styles.card}>
          <div className={styles.cardLeft}>
            <span className={styles.badge} style={{ background: '#d4a574' }}>SaaS</span>
            <h3 className={styles.cardTitle}>whofits</h3>
            <p className={styles.cardDesc}>
              creator intelligence platform. agencies drop a seed list, get network-aware qualification
              across engagement, niche authority, and network centrality. 25,000 profiles crawled.
            </p>
            <div className={styles.cardMeta}>
              <span>Next.js</span><span>Supabase</span><span>Playwright</span><span>Three.js</span>
            </div>
            <Link href="/case/whofits" className={styles.caseLink}>view case study</Link>
          </div>
          <div className={styles.cardRight}>
            <div className={styles.wfDemo}>
              <div className={styles.modelSlot}><WhoFitsModel /></div>
              <div className={styles.engineWrap}>
                <div className={styles.engineBar}>
                  <div className={styles.dots3}><span style={{ background: '#ff5f57' }} /><span style={{ background: '#febc2e' }} /><span style={{ background: '#28c840' }} /></div>
                  <span className={styles.engineLabel}>DISCOVERY ENGINE</span>
                  {scanPhase === 'idle' && <button className={styles.qualBtn} onClick={startScan}>qualify all</button>}
                </div>
                {scanPhase === 'scanning' && <div className={styles.scanBar}><div className={styles.scanFill} style={{ width: `${(scannedRows / creators.length) * 100}%` }} /></div>}
                <table className={styles.table}>
                  <thead><tr><th>CREATOR</th><th>NETWORK</th><th>CONSISTENCY</th><th>STATUS</th></tr></thead>
                  <tbody>
                    {creators.map((c, i) => {
                      const q = qualifications[c.id]
                      const vis = scanPhase === 'done' || (scanPhase === 'scanning' && i < scannedRows)
                      return (
                        <tr key={c.id} className={`${vis ? '' : styles.rowDim} ${selectedRow === c.id ? styles.rowSel : ''}`}
                          onClick={() => scanPhase === 'done' && setSelectedRow(c.id)}>
                          <td><span className={styles.handle}>{c.handle.replace('@', '')}</span><br /><span className={styles.niche}>{c.nicheLabel}</span></td>
                          <td>{vis && scanPhase === 'done' ? <span className={styles.grade} data-g={q.networkGrade[0]}>{q.networkGrade} ({q.networkScore})</span> : vis ? <span className={styles.scanning}>...</span> : null}</td>
                          <td>{vis && scanPhase === 'done' ? q.consistencyScore : vis ? '...' : null}</td>
                          <td>{vis && scanPhase === 'done' ? <span className={styles.status} data-s={q.status}>{q.status}</span> : null}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>


        <div className={`${styles.card} ${styles.cardWarm}`}>
          <div className={styles.cardLeft}>
            <span className={styles.badge} style={{ background: '#B5704A' }}>E-commerce</span>
            <h3 className={styles.cardTitle}>aarttsii</h3>
            <p className={styles.cardDesc}>
              handmade crochet e-commerce with ai pricing. upload any photo, get a transparent breakdown
              of yarn cost, labour hours, and complexity. no more dm bargaining.
            </p>
            <div className={styles.cardMeta}>
              <span>Next.js</span><span>Groq Vision</span><span>Razorpay</span><span>Supabase</span>
            </div>
            <Link href="/case/aarttsii" className={styles.caseLinkWarm}>view case study</Link>
          </div>
          <div className={styles.cardRight}>
            <div className={styles.aaDemo}>
              {estStep === 'pick' && (
                <div className={styles.pickState}>
                  <p className={styles.pickLabel}>pick a product to estimate</p>
                  <div className={styles.productGrid}>
                    {samples.map(s => (
                      <div key={s.id} className={styles.productCard} onClick={() => pickProduct(s)}>
                        <div className={styles.productImg}>
                          <Image src={s.image} alt={s.label} width={200} height={200} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span className={styles.productName}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {estStep === 'configure' && selectedSample && (
                <div className={styles.configState}>
                  <div className={styles.configTop}>
                    <div className={styles.configPreview}>
                      <Image src={selectedSample.image} alt={selectedSample.label} width={120} height={120} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10 }} />
                    </div>
                    <div>
                      <h4 className={styles.configName}>{selectedSample.label}</h4>
                      <p className={styles.configHint}>choose yarn and size to get your estimate</p>
                    </div>
                  </div>
                  <div className={styles.configOptions}>
                    <div className={styles.optGroup}>
                      <span className={styles.optLabel}>yarn type</span>
                      <div className={styles.optBtns}>
                        {(['Mousse', 'Chenille'] as Tier[]).map(t => (
                          <button key={t} className={`${styles.optBtn} ${tier === t ? styles.optOn : ''}`} onClick={() => setTier(t)}>
                            <span className={styles.optBtnTitle}>{t.toLowerCase()}</span>
                            <span className={styles.optBtnDesc}>{t === 'Mousse' ? 'soft, baby-safe' : 'velvet plush'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={styles.optGroup}>
                      <span className={styles.optLabel}>size</span>
                      <div className={styles.optBtns}>
                        {(['Mini', 'Standard'] as Size[]).map(s => (
                          <button key={s} className={`${styles.optBtn} ${size === s ? styles.optOn : ''}`} onClick={() => setSize(s)}>
                            <span className={styles.optBtnTitle}>{s.toLowerCase()}</span>
                            <span className={styles.optBtnDesc}>{s === 'Mini' ? '4-6 inches' : '8-12 inches'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className={styles.estimateBtn} onClick={runEstimate}>estimate price</button>
                </div>
              )}

              {estStep === 'analyzing' && (
                <div className={styles.analyzingState}>
                  <div className={styles.spinner} />
                  <p className={styles.analyzingText}>scoring complexity...</p>
                </div>
              )}

              {estStep === 'result' && estimate && price && (
                <div className={styles.resultState}>
                  <div className={styles.resultHeader}>
                    <div>
                      <h4 className={styles.resultName}>{selectedSample?.label}</h4>
                      <span className={styles.resultCat}>{estimate.category.replace(/_/g, ' ')}</span>
                    </div>
                    <div className={styles.ciBlock}>
                      <span className={styles.ciNum}>{estimate.ci}</span><span className={styles.ciMax}>/10</span>
                    </div>
                  </div>
                  <div className={styles.ciBar}><div className={styles.ciFill} style={{ width: `${(estimate.ci / 10) * 100}%` }} /></div>
                  <ul className={styles.factors}>{estimate.factors.map((f, i) => <li key={i}>{f}</li>)}</ul>
                  <div className={styles.costBreakdown}>
                    <div className={styles.costRow}><span>{tier.toLowerCase()} yarn</span><span>₹{price.materials}</span></div>
                    <div className={styles.costRow}><span>labour ({price.hours}h × ₹{price.hourlyRate}/h)</span><span>₹{price.labour}</span></div>
                    <div className={styles.costRow}><span>base rate</span><span>₹{price.base}</span></div>
                    <div className={`${styles.costRow} ${styles.costTotal}`}><span>estimate</span><span>₹{price.min.toLocaleString()} — ₹{price.max.toLocaleString()}</span></div>
                  </div>
                  <button className={styles.tryAnother} onClick={() => { setEstStep('pick'); setSelectedSample(null) }}>try another</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </ScrollReveal>
    </section>
  )
}
