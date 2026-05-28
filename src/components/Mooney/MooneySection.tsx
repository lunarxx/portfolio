import { VoiceDemo } from './VoiceDemo'
import { ExpandToggle } from '../shared/ExpandToggle'
import styles from './Mooney.module.css'

export function MooneySection() {
  return (
    <section className={styles.section} id="mooney">
      <h2 className={styles.title}>mooney</h2>
      <p className={styles.subtitle}>
        talk to it, it logs your money. voice first expense tracker with a brain.
      </p>

      <VoiceDemo />

      <div className={styles.stats}>
        <span className={styles.stat}>19 beta testers</span>
        <span className={styles.stat}>voice to data in &lt;2s</span>
        <span className={styles.stat}>60+ countries</span>
      </div>

      <ExpandToggle label="how the pipeline works">
        <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem' }}>pipeline diagram coming soon</p>
      </ExpandToggle>
    </section>
  )
}
