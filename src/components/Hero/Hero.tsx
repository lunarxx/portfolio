import styles from './Hero.module.css'

const projects = [
  { name: 'mooney', what: 'voice expense tracker', color: '#2A6B4F' },
  { name: 'whofits', what: 'creator qualification engine', color: '#d4a574' },
  { name: 'aarttsii', what: 'ai commission pricing', color: '#B5704A' },
]

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <h1 className={styles.name}>Ashwini Tiwari</h1>
        <p className={styles.tagline}>
          i make things that work and sometimes they even have users.
          scroll down to try them yourself.
        </p>
      </div>

      <div className={styles.projectStrip}>
        {projects.map(p => (
          <a key={p.name} href={`#${p.name}`} className={styles.projectPill}>
            <span className={styles.pillDot} style={{ background: p.color }} />
            <span className={styles.pillName}>{p.name}</span>
            <span className={styles.pillWhat}>{p.what}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
