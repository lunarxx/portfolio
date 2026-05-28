'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { samples, type Sample } from '@/data/aarttsii-samples'
import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './Aarttsii.module.css'

export function AarttsiiSection() {
  const [selected, setSelected] = useState<Sample | null>(null)
  const [customEstimate, setCustomEstimate] = useState<Sample['estimate'] | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelected(null)
    setCustomEstimate(null)
    setAnalyzing(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const res = await fetch('/api/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image: base64, size: 'Standard (8-12 inches)' }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setCustomEstimate({ ...data, price_min: Math.round(data.ci * 280), price_max: Math.round(data.ci * 450) })
        setAnalyzing(false)
      }
    } catch {
      setError('analysis failed, try another image')
      setAnalyzing(false)
    }
  }

  const estimate = selected?.estimate || customEstimate

  return (
    <section className={styles.section} id="aarttsii">
      <ScrollReveal>
        <h2 className={styles.title}>
          no more <span className={styles.accent}>dm bargaining.</span>
        </h2>
        <p className={styles.tagline}>
          upload any image. ai scores its crochet complexity on 8 axes and gives you a price range instantly.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <div className={styles.demoArea}>
          <div className={styles.sampleRow}>
            {samples.map(s => (
              <div
                key={s.id}
                className={`${styles.sampleCard} ${selected?.id === s.id ? styles.sampleCardActive : ''}`}
                onClick={() => { setSelected(s); setCustomEstimate(null); setError('') }}
              >
                {s.label}
              </div>
            ))}
          </div>

          <div className={styles.uploadArea}>
            <button className={styles.uploadButton} onClick={() => fileRef.current?.click()}>
              or upload your own image
            </button>
            <input ref={fileRef} type="file" accept="image/*" className={styles.uploadInput} onChange={handleUpload} />
          </div>

          {analyzing && <p className={styles.analyzing}>analyzing complexity...</p>}
          {error && <p className={styles.error}>{error}</p>}

          {estimate && !analyzing && (
            <div className={styles.estimateCard}>
              <h3 className={styles.estimateTitle}>{selected?.label || 'Your Image'}</h3>
              <p className={styles.categoryLabel}>
                {estimate.category.replace(/_/g, ' ')}
              </p>

              <div className={styles.ciMeter}>
                <span className={styles.ciLabel}>complexity</span>
                <div className={styles.ciTrack}>
                  <div className={styles.ciFill} style={{ width: `${(estimate.ci / 10) * 100}%` }} />
                </div>
                <span className={styles.ciValue}>{estimate.ci}/10</span>
              </div>

              <ul className={styles.factors}>
                {estimate.factors.map((f, i) => <li key={i}>{f}</li>)}
              </ul>

              <div className={styles.details}>
                {estimate.detected_details.map((d, i) => (
                  <span key={i} className={styles.detail} data-impact={d.impact}>{d.label}</span>
                ))}
              </div>

              <div className={styles.priceRange}>
                <span>₹{estimate.price_min.toLocaleString()}</span>
                <span className={styles.priceDash}>—</span>
                <span>₹{estimate.price_max.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      <Link href="/case/aarttsii" className={styles.viewCase}>
        view case study →
      </Link>
    </section>
  )
}
