import styles from './Hero.module.css'

export function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.name}>Ashwini Tiwari</h1>
      <p className={styles.tagline}>
        i make things that work and sometimes they even have users. scroll down to try them yourself.
      </p>
      <div className={styles.scrollHint}>
        <span>try them</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}
