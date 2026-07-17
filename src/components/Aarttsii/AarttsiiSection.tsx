'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { samples, type Sample } from '@/data/aarttsii-samples'
import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './Aarttsii.module.css'

type Tier = 'Mousse' | 'Chenille'
type Size = 'Mini' | 'Standard'
type Step = 'pick' | 'configure' | 'analyzing' | 'result'

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

export function AarttsiiSection() {
  const [step, setStep] = useState<Step>('pick')
  const [selected, setSelected] = useState<Sample | null>(null)
  const [tier, setTier] = useState<Tier>('Mousse')
  const [size, setSize] = useState<Size>('Mini')
  const [customEstimate, setCustomEstimate] = useState<Sample['estimate'] | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const pickProduct = (s: Sample) => {
    setSelected(s)
    setCustomEstimate(null)
    setStep('configure')
  }

  const runEstimate = () => {
    setStep('analyzing')
    setTimeout(() => setStep('result'), 1600)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelected(null)
    setStep('analyzing')
    setError('')
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const res = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image: base64, size: `${size} (${size === 'Mini' ? '4-6' : '8-12'} inches)` }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setCustomEstimate(data)
        setStep('result')
      }
    } catch {
      setError('analysis failed, try another image')
      setStep('pick')
    }
  }

  const reset = () => { setStep('pick'); setSelected(null); setCustomEstimate(null); setError('') }

  const estimate = selected?.estimate || customEstimate
  const price = estimate ? calcPrice(estimate.ci, size, tier) : null

  return (
    <section className={styles.section} id="aarttsii">
      {/* crochet-blanket scalloped top edge */}
      <div className={styles.scallopTop} aria-hidden="true" />
      {/* cozy warm light + floating yarn */}
      <div className={styles.glow} aria-hidden="true" />
      <YarnBall className={`${styles.yarn} ${styles.yarn1}`} fill="#f3b7c6" line="#e491a4" />
      <YarnBall className={`${styles.yarn} ${styles.yarn2}`} fill="#a9d7c6" line="#78bfa7" />
      <YarnBall className={`${styles.yarn} ${styles.yarn3}`} fill="#f6d485" line="#e4b558" />

      <ScrollReveal>
        <div className={styles.brandMark}>
          <Image src="/aarttsii/logo.png" alt="aarttsii" width={160} height={160} className={styles.logo} />
          <span className={styles.handmade}>handmade, priced honestly</span>
        </div>
        <h2 className={styles.title}>
          no more <span className={styles.accent}>dm bargaining.</span>
        </h2>
        <p className={styles.tagline}>
          aarttsii is a crochet e-commerce site. customers upload a photo, ai scores its complexity,
          and they get a transparent price breakdown. try it.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className={styles.demoArea}>
          {step === 'pick' && (
            <>
              <div className={styles.sampleRow}>
                {samples.map(s => (
                  <div key={s.id} className={styles.sampleCard} onClick={() => pickProduct(s)}>
                    <div className={styles.sampleImg}>
                      <Image src={s.image} alt={s.label} width={500} height={500} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span className={styles.sampleLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
              <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>or upload your own image</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
              {error && <p className={styles.error}>{error}</p>}
            </>
          )}

          {step === 'configure' && selected && (
            <div className={styles.configPanel}>
              <div className={styles.configTop}>
                <Image src={selected.image} alt={selected.label} width={100} height={100} className={styles.configThumb} />
                <div>
                  <h3 className={styles.configName}>{selected.label}</h3>
                  <p className={styles.configHint}>choose yarn and size</p>
                </div>
              </div>

              <div className={styles.optionsRow}>
                <div className={styles.optGroup}>
                  <span className={styles.optLabel}>yarn type</span>
                  <div className={styles.optBtns}>
                    {(['Mousse', 'Chenille'] as Tier[]).map(t => (
                      <button key={t} className={`${styles.optBtn} ${tier === t ? styles.optActive : ''}`} onClick={() => setTier(t)}>
                        <strong>{t.toLowerCase()}</strong>
                        <small>{t === 'Mousse' ? 'soft, baby-safe' : 'velvet plush'}</small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.optGroup}>
                  <span className={styles.optLabel}>size</span>
                  <div className={styles.optBtns}>
                    {(['Mini', 'Standard'] as Size[]).map(s => (
                      <button key={s} className={`${styles.optBtn} ${size === s ? styles.optActive : ''}`} onClick={() => setSize(s)}>
                        <strong>{s.toLowerCase()}</strong>
                        <small>{s === 'Mini' ? '4-6 inches' : '8-12 inches'}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.configActions}>
                <button className={styles.backBtn} onClick={reset}>back</button>
                <button className={styles.goBtn} onClick={runEstimate}>get estimate</button>
              </div>
            </div>
          )}

          {step === 'analyzing' && (
            <div className={styles.analyzingPanel}>
              <div className={styles.spinner} />
              <p className={styles.analyzingText}>scoring complexity across 8 axes...</p>
            </div>
          )}

          {step === 'result' && estimate && price && (
            <div className={styles.resultPanel}>
              <div className={styles.resultTop}>
                <div>
                  <h3 className={styles.resultName}>{selected?.label || 'Your Image'}</h3>
                  <span className={styles.resultCat}>{estimate.category.replace(/_/g, ' ')}</span>
                </div>
                <div className={styles.ciScore}>
                  <span className={styles.ciNum}>{estimate.ci}</span>
                  <span className={styles.ciMax}>/10</span>
                </div>
              </div>

              <div className={styles.ciMeter}>
                <span className={styles.ciLabel}>complexity</span>
                <div className={styles.ciTrack}><div className={styles.ciFill} style={{ width: `${(estimate.ci / 10) * 100}%` }} /></div>
              </div>

              <ul className={styles.factors}>
                {estimate.factors.map((f, i) => <li key={i}>{f}</li>)}
              </ul>

              <div className={styles.breakdown}>
                <div className={styles.bRow}><span>{tier.toLowerCase()} yarn</span><span>₹{price.materials}</span></div>
                <div className={styles.bRow}><span>labour ({price.hours}h × ₹{price.hourlyRate}/h)</span><span>₹{price.labour}</span></div>
                <div className={styles.bRow}><span>base rate</span><span>₹{price.base}</span></div>
                <div className={`${styles.bRow} ${styles.bTotal}`}>
                  <span>estimate</span>
                  <span>₹{price.min.toLocaleString()} — ₹{price.max.toLocaleString()}</span>
                </div>
              </div>

              <button className={styles.tryAgain} onClick={reset}>try another product</button>
            </div>
          )}
        </div>
      </ScrollReveal>

      <Link href="/case/aarttsii" className={styles.viewCase}>view case study</Link>
    </section>
  )
}

function YarnBall({ className, fill, line }: { className?: string; fill: string; line: string }) {
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 100 108" width="100%" height="100%">
        <circle cx="50" cy="50" r="38" fill={fill} />
        <g stroke={line} strokeWidth="2.4" fill="none" opacity="0.75" strokeLinecap="round">
          <ellipse cx="50" cy="50" rx="38" ry="15" transform="rotate(34 50 50)" />
          <ellipse cx="50" cy="50" rx="38" ry="15" transform="rotate(-34 50 50)" />
          <path d="M15 44 Q50 22 85 44" />
          <path d="M14 58 Q50 36 86 58" />
        </g>
        {/* dangling thread */}
        <path d="M84 60 q13 8 8 22 q-4 10 6 20" stroke={line} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.8" />
      </svg>
    </div>
  )
}
