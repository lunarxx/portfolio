import Link from 'next/link'
import styles from '../case.module.css'

export default function MooneyCaseStudy() {
  return (
    <article className={styles.page} style={{
      '--case-fg': '#1A1A1A',
      '--case-body': '#3a3a3a',
      '--case-muted': '#9E9A94',
      '--case-accent': '#2A6B4F',
      '--case-callout': 'rgba(42, 107, 79, 0.06)',
      '--case-border': '#E0DDD7',
      background: '#F2EFE7',
    } as React.CSSProperties}>
      <Link href="/" className={styles.back}>back</Link>

      <div className={styles.hero}>
        <h1 className={styles.title}>the expense tracker that listens</h1>
        <p className={styles.subtitle}>
          mooney is a voice first expense tracker. you hold a button, say what you spent, and it logs everything automatically. no typing, no categories, no spreadsheets.
        </p>
        <div className={styles.meta}>
          <div className={styles.metaItem}>role<strong>co founded</strong></div>
          <div className={styles.metaItem}>stack<strong>flutter, supabase, deepgram, groq</strong></div>
          <div className={styles.metaItem}>status<strong>19 beta testers</strong></div>
          <div className={styles.metaItem}>platform<strong>android</strong></div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>the problem</p>
          <h2 className={styles.sectionTitle}>expense apps assume you want to type</h2>
          <p className={styles.body}>
            every expense app works the same way. open it, pick a category from a dropdown, type an amount, maybe add a note. it takes 30 seconds per entry and most people give up after a week. the problem isn&apos;t the app. it&apos;s the interaction model. nobody wants to stop what they&apos;re doing to manually log &ldquo;40 rupees auto.&rdquo;
          </p>
          <div className={styles.callout}>
            mooney lets you hold a button, say &ldquo;300 rupees uber&rdquo;, and the expense is saved in under 2 seconds. that&apos;s the whole pitch.
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>voice pipeline</p>
          <h2 className={styles.sectionTitle}>four providers deep, and it never breaks</h2>
          <p className={styles.body}>
            your voice goes to deepgram nova 3 for transcription, then to groq&apos;s llama 8b for parsing out the amount, category, and description. if the 8b model can&apos;t figure it out, it escalates to the 70b model. if that fails, cerebras. if that fails, openrouter&apos;s free tier. four layers of fallback. the user never sees any of this.
          </p>
          <p className={styles.body}>
            the design challenge wasn&apos;t writing API calls. it was making four different providers feel like one seamless experience where nothing ever visibly fails.
          </p>
          <div className={styles.callout}>
            deepgram sometimes hears &ldquo;20 rupees&rdquo; as &ldquo;20 arrests.&rdquo; the on device OCR reads the rupee symbol as random letters depending on the font. stuff like that needed regex post processing and keyword boosting to handle properly.
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.section}>
          <p className={styles.sectionLabel}>architecture</p>
          <h2 className={styles.sectionTitle}>two android processes talking through a file</h2>
          <p className={styles.body}>
            the app runs two separate android processes. the main app, and an overlay process that lets you log expenses from a home screen widget without opening anything. the catch: the overlay can&apos;t access the local database, supabase, or the main dart runtime. so all communication happens through a json file on disk. it&apos;s weird, but it works.
          </p>
          <div className={styles.grid}>
            <div className={styles.gridCard}><strong>10 edge functions</strong><span>stt, llm parsing, receipt ocr, push notifications, backup, reports, bill splitting</span></div>
            <div className={styles.gridCard}><strong>60+ countries</strong><span>per country stt language codes, llm prompt rules, and ocr prompts</span></div>
            <div className={styles.gridCard}><strong>3 tier receipt scanning</strong><span>on device ml kit, groq scout vision, gemini flash fallback</span></div>
            <div className={styles.gridCard}><strong>reverse trial</strong><span>all paid features available for 7 days from install</span></div>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>receipt scanning</p>
          <h2 className={styles.sectionTitle}>reading receipts is harder than it sounds</h2>
          <p className={styles.body}>
            three tier vision pipeline. on device ml kit for free users (with extensive regex to fix the rupee symbol misreads). groq scout vision for paid users. gemini flash as the final fallback. the system detects columns in receipts using bounding box y grouping so it doesn&apos;t mix up item names and prices when they&apos;re side by side.
          </p>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionLabel}>status</p>
          <h2 className={styles.sectionTitle}>in beta, being tested</h2>
          <p className={styles.body}>
            19 beta testers on android in closed testing. the voice pipeline, receipt scanner, and overlay all work. still iterating on edge cases and figuring out what the onboarding should feel like.
          </p>
        </div>
      </div>
    </article>
  )
}
