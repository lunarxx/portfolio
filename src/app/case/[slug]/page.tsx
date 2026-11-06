import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CASES, caseBySlug } from '../cases'
import styles from '../case.module.css'

export const generateStaticParams = () => CASES.map((c) => ({ slug: c.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = caseBySlug((await params).slug)
  return c ? { title: `${c.name} · Ashwini Tiwari`, description: c.subtitle } : {}
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const c = caseBySlug((await params).slug); if (!c) notFound()
  const k = c.colors
  return (
    <article className={styles.page} style={{ '--case-fg': k.fg, '--case-body': k.body, '--case-muted': k.muted, '--case-accent': k.accent, '--case-callout': k.callout, '--case-border': k.border, background: k.bg } as React.CSSProperties}>
      <Link href="/" className={styles.back}>back</Link>
      <div className={styles.hero}>
        <h1 className={styles.title}>{c.title}</h1>
        <p className={styles.subtitle}>{c.subtitle}</p>
        <div className={styles.meta}>
          {c.meta.map(([label, value]) => <div key={label} className={styles.metaItem}>{label}<strong>{value}</strong></div>)}
        </div>
      </div>
      <div className={styles.content}>
        {c.sections.map((sec) => (
          <div key={sec.title} className={styles.section}>
            <p className={styles.sectionLabel}>{sec.label}</p>
            <h2 className={styles.sectionTitle}>{sec.title}</h2>
            {sec.body.map((t) => <p key={t.slice(0, 24)} className={styles.body}>{t}</p>)}
            {sec.grid && <div className={styles.grid}>{sec.grid.map(([a, b]) => <div key={a} className={styles.gridCard}><strong>{a}</strong><span>{b}</span></div>)}</div>}
            {sec.callout && <div className={styles.callout}>{sec.callout}</div>}
          </div>
        ))}
        {c.href && <p className={styles.body}><a href={c.href[1]} target="_blank" rel="noopener noreferrer" style={{ color: k.accent, fontWeight: 600 }}>{c.href[0]} ↗</a></p>}
      </div>
    </article>
  )
}
