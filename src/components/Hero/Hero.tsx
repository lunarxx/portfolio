import styles from './Hero.module.css'

const projects = [
  {
    label: 'mooney',
    href: '#mooney',
    description: 'you talk, it logs your money. voice first expense tracker that actually parses what you say.',
    tags: ['flutter', 'deepgram', 'groq', 'supabase'],
    highlight: '19 beta testers',
    wide: true,
  },
  {
    label: 'whofits',
    href: '#whofits',
    description: 'finds creators worth working with. network aware qualification, not just follower counts.',
    tags: ['next.js', 'playwright', 'twitterapi', 'pagerank'],
    highlight: '5,254 creators crawled',
    wide: false,
  },
  {
    label: 'aarttsii',
    href: '#aarttsii',
    description: 'replaced "how much for this?" dms with ai powered instant commission pricing.',
    tags: ['next.js', 'groq vision', 'supabase'],
    highlight: 'live e-commerce',
    wide: false,
  },
  {
    label: 'internal tools',
    href: '#tools',
    description: 'the scrapers, engines and pipelines that feed everything above.',
    tags: ['tweetbrain', 'outreach scraper', 'automation'],
    highlight: '',
    wide: true,
  },
]

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.intro}>
        <h1 className={styles.name}>Ashwini Tiwari</h1>
        <p className={styles.tagline}>
          i make things that work and sometimes they even have users. scroll down to try them yourself.
        </p>
      </div>

      <div className={styles.bento}>
        {projects.map(p => (
          <a
            key={p.label}
            href={p.href}
            className={`${styles.card} ${p.wide ? styles.cardWide : ''}`}
          >
            <span className={styles.cardLabel}>{p.label}</span>
            <span className={styles.cardDescription}>{p.description}</span>
            <div className={styles.cardTags}>
              {p.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
            </div>
            {p.highlight && <span className={styles.cardHighlight}>{p.highlight}</span>}
          </a>
        ))}
      </div>

      <div className={styles.scrollHint}>
        <span>try them</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}
