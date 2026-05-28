import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './InternalTools.module.css'

const tools = [
  {
    name: 'TweetBrain',
    project: 'Personal',
    description: 'signal-based personality engine that learns my voice from conversations and generates tweets that sound like me, not a bot.',
    pipeline: ['signal extraction', 'topic weighting', 'layered generation', 'anti-slop filter', 'tweet'],
  },
  {
    name: 'Crochet Outreach Scraper',
    project: 'aarttsii',
    description: 'reddit and twitter scraper that finds crochet communities and potential customers for outreach.',
    pipeline: ['subreddit targeting', 'post extraction', 'interest scoring', 'outreach queue'],
  },
]

export function InternalToolsSection() {
  return (
    <section className={styles.section} id="tools">
      <ScrollReveal>
        <h2 className={styles.title}>
          the tools that <span className={styles.accent}>feed the products</span>
        </h2>
        <p className={styles.subtitle}>i don't just build apps. i build the automation behind them.</p>
      </ScrollReveal>

      <div className={styles.grid}>
        {tools.map(t => (
          <ScrollReveal key={t.name}>
            <div className={styles.toolCard}>
              <div className={styles.toolHeader}>
                <h3 className={styles.toolName}>{t.name}</h3>
                <span className={styles.toolProject}>{t.project}</span>
              </div>
              <p className={styles.toolDescription}>{t.description}</p>
              <div className={styles.pipeline}>
                {t.pipeline.map((step, i) => (
                  <span key={i} className={styles.pipelineStep}>
                    {step}{i < t.pipeline.length - 1 && <span className={styles.pipelineArrow}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
