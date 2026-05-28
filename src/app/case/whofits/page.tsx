import Link from 'next/link'
import styles from '../case.module.css'

export default function WhoFitsCaseStudy() {
  return (
    <article className={styles.page} style={{
      '--case-fg': '#F9F8F6',
      '--case-body': '#b5ada5',
      '--case-muted': '#8a8078',
      '--case-accent': '#d4a574',
      '--case-callout': 'rgba(212, 165, 116, 0.08)',
      '--case-border': '#2a2522',
      background: '#12100e',
    } as React.CSSProperties}>
      <Link href="/" className={styles.back}>back</Link>

      <div className={styles.hero}>
        <h1 className={styles.title}>finding creators worth working with</h1>
        <p className={styles.subtitle}>
          whofits is a creator discovery and qualification platform for influencer marketing agencies. instead of scrolling feeds for days, you upload a seed list and the system tells you who&apos;s actually worth reaching out to.
        </p>
        <div className={styles.meta}>
          <div className={styles.metaItem}>role<strong>co founded</strong></div>
          <div className={styles.metaItem}>stack<strong>next.js, supabase, grok, playwright</strong></div>
          <div className={styles.metaItem}>status<strong>crawler built, qualification shipping</strong></div>
          <div className={styles.metaItem}>data<strong>25,000+ creators crawled</strong></div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>the problem</p>
          <h2 className={styles.sectionTitle}>agencies spend days scrolling feeds</h2>
          <p className={styles.body}>
            influencer marketing agencies discover creators by manually scrolling their twitter feed. there&apos;s no structured way to find, vet, or defend creator selections to clients. they check profiles one by one, copy metrics into spreadsheets, and hope they didn&apos;t miss anyone good. it&apos;s slow, subjective, and impossible to scale.
          </p>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>the insight</p>
          <h2 className={styles.sectionTitle}>follower count is meaningless</h2>
          <p className={styles.body}>
            you can buy 50k followers overnight. what you can&apos;t fake is being embedded in a creator ecosystem. who replies to your tweets, who engages with your content consistently, where you sit in the network graph. whofits ranks creators by their actual position in the network, not by a number anyone can inflate.
          </p>
          <div className={styles.callout}>
            the product started with a simple question: what if follower count is actually a bad signal? that question led to crawling 25,000 profiles and building a 7 signal ranking formula to find out.
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.section}>
          <p className={styles.sectionLabel}>the crawler</p>
          <h2 className={styles.sectionTitle}>25,000 profiles, scored and ranked</h2>
          <p className={styles.body}>
            the pipeline takes csv seed lists from agencies, batch processes them through twitter&apos;s api for profile data, runs brand classification on each creator (60% llm, 40% heuristic rules), then sends playwright to crawl reply threads because that&apos;s the one signal without an api endpoint.
          </p>
          <p className={styles.body}>
            every reply gets scored by an llm on text quality, sentiment, and engagement. the whole thing runs with live terminal progress and auto saves per item so nothing gets lost if it crashes halfway through a 2,000 profile batch.
          </p>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>qualification</p>
          <h2 className={styles.sectionTitle}>seven signals, not seven opinions</h2>
          <p className={styles.body}>
            the ranking formula uses 7 signals: engagement velocity, audience overlap, brand safety, content consistency, growth trajectory, niche relevance, and response rate. each signal is weighted and combined into a composite score. the result isn&apos;t &ldquo;this creator is good.&rdquo; it&apos;s &ldquo;this creator is good for this specific campaign, and here&apos;s the evidence.&rdquo;
          </p>
          <div className={styles.grid}>
            <div className={styles.gridCard}><strong>engagement velocity</strong><span>how quickly and consistently their audience responds</span></div>
            <div className={styles.gridCard}><strong>audience overlap</strong><span>how much their followers match the target demographic</span></div>
            <div className={styles.gridCard}><strong>brand safety</strong><span>automated flag scanning across post history</span></div>
            <div className={styles.gridCard}><strong>content consistency</strong><span>do they post regularly or in random bursts</span></div>
            <div className={styles.gridCard}><strong>growth trajectory</strong><span>real organic growth vs bought spikes</span></div>
            <div className={styles.gridCard}><strong>niche relevance</strong><span>embedding similarity to the campaign brief</span></div>
          </div>
          <p className={styles.body}>
            deep qualification triggers a grok powered analysis that returns a qualification card with top 3 reasons, evidence posts with urls, integrity flags, and a qualified/monitor/reject verdict. all auditable. all reproducible.
          </p>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>status</p>
          <h2 className={styles.sectionTitle}>crawler running, qualification shipping next</h2>
          <p className={styles.body}>
            the crawler pipeline is built and has processed 25,000+ creator profiles. the qualification engine formulas are locked. the marketing site is live with a 3d character model. full mock dashboard with 50+ components. the plan is to ship qualification before discovery because agencies already have their own creator lists. they just need a better way to vet them.
          </p>
        </div>
      </div>
    </article>
  )
}
