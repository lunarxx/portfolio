import styles from './Hero.module.css'

const projects = [
  { label: 'mooney', href: '#mooney' },
  { label: 'whofits', href: '#whofits' },
  { label: 'aarttsii', href: '#aarttsii' },
  { label: 'tools', href: '#tools' },
  { label: 'journey', href: '#timeline' },
]

export function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.name}>Ashwini Tiwari</h1>
      <p className={styles.tagline}>
        i make <span>things that work</span> and sometimes they even have users
      </p>
      <nav className={styles.projectNav}>
        {projects.map(p => (
          <a key={p.label} href={p.href} className={styles.projectLink}>
            {p.label}
          </a>
        ))}
      </nav>
      <div className={styles.scrollHint}>
        <span>scroll</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}
