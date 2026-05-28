'use client'

import Link from 'next/link'
import styles from './resume.module.css'

export default function ResumePage() {
  return (
    <div className={styles.page}>
      <div className={styles.resume}>
        <Link href="/" className={styles.backLink}>back</Link>
        <button className={styles.printBtn} onClick={() => window.print()}>print / save pdf</button>

        <div className={styles.header}>
          <h1 className={styles.name}>Ashwini Tiwari</h1>
          <p className={styles.headline}>
            generalist. product designer, 3D artist, and AI system designer who builds end to end.
          </p>
          <div className={styles.contact}>
            <span className={styles.contactItem}><a href="mailto:ashwinitiwari8888@gmail.com">ashwinitiwari8888@gmail.com</a></span>
            <span className={styles.contactItem}><a href="https://x.com/ashwtiw">x.com/ashwtiw</a></span>
            <span className={styles.contactItem}><a href="https://linkedin.com/in/ashwtiw">linkedin.com/in/ashwtiw</a></span>
            <span className={styles.contactItem}><a href="https://artstation.com/ashwtiw">artstation.com/ashwtiw</a></span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>experience</h2>

          <div className={styles.expItem}>
            <div className={styles.expTop}>
              <span className={styles.expRole}>Lead 3D Artist <span className={styles.expCompany}>at SANSHU!</span></span>
              <span className={styles.expDate}>2021 onwards</span>
            </div>
            <ul className={styles.expList}>
              <li>one of the earliest team members. prototyped digital mascot characters, in-game assets, and the visual language that still defines the brand</li>
              <li>designed the yokai mask NFT collection: 2,000 unique pieces, phase 1 sold out in 3 days</li>
              <li>sculpted characters and environments in blender, zbrush, substance painter</li>
              <li>remote collaboration with international team</li>
            </ul>
            <a href="/sanshu-lor.pdf" target="_blank" rel="noopener noreferrer" className={styles.lorLink}>
              letter of recommendation from co-founder ↗
            </a>
          </div>

          <div className={styles.expItem}>
            <div className={styles.expTop}>
              <span className={styles.expRole}>Co-Founder <span className={styles.expCompany}>at media3ms</span></span>
              <span className={styles.expDate}>after sanshu</span>
            </div>
            <ul className={styles.expList}>
              <li>3D marketing agency doing character design, product renders, brand visuals, and video editing for clients</li>
              <li>handled the full creative pipeline from concept to final delivery: modeling, texturing, lighting, compositing, editing</li>
            </ul>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>shipped products</h2>
          <div className={styles.projectGrid}>
            <div className={styles.project}>
              <span className={styles.projectName}>mooney</span>
              <span className={styles.projectDesc}>voice first expense tracker. hold a button, say what you spent, done. 4 layer voice pipeline (deepgram, groq, cerebras, openrouter), receipt scanning, overlay widget. 19 beta testers.</span>
              <span className={styles.projectMeta}>co founded</span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>aarttsii</span>
              <span className={styles.projectDesc}>crochet e-commerce with AI pricing. upload a photo, AI scores complexity across 8 axes, returns a transparent price breakdown. groq vision, power curve pricing engine, razorpay payments.</span>
              <span className={styles.projectMeta}>solo built</span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>whofits</span>
              <span className={styles.projectDesc}>creator discovery platform for agencies. crawled 25,000+ profiles, 7 signal ranking formula (engagement velocity, audience overlap, brand safety, consistency, growth, niche relevance, response rate).</span>
              <span className={styles.projectMeta}>co founded</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>internal tools</h2>
          <div className={styles.projectGrid}>
            <div className={styles.project}>
              <span className={styles.projectName}>TweetBrain</span>
              <span className={styles.projectDesc}>personality learning tweet generator. signal based personality model, layered generation, content intelligence.</span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>ImageToPattern</span>
              <span className={styles.projectDesc}>upload any image, CLIP finds the closest matching crochet pattern from 92,000 indexed patterns. pgvector similarity search.</span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>Blue Collar Dashboard</span>
              <span className={styles.projectDesc}>lead gen scraper for local businesses. finds prospects, scores them, builds outreach lists automatically.</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>what i do</h2>
          <div className={styles.skillGrid}>
            <div className={styles.skillGroup}>
              <strong>product design</strong>
              <span>zero to one product thinking, user research, competitive analysis, GTM strategy</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>3D art</strong>
              <span>blender, zbrush, substance painter, character design, NFT collections, brand visuals</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>AI system design</strong>
              <span>LLM pipelines, vision AI, speech to text, embedding search, multi-provider fallback architecture</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>research and strategy</strong>
              <span>pricing psychology, creator economy analysis, competitive audits, 40,000+ word research docs</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>brand and identity</strong>
              <span>visual identity, site design, tone of voice, full product personality</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>data and automation</strong>
              <span>web crawlers, scrapers, ranking formulas, data pipelines, playwright automation</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>tech i work with</h2>
          <div className={styles.skillGrid}>
            <div className={styles.skillGroup}>
              <strong>frontend / mobile</strong>
              <span>next.js, react, typescript, flutter, framer motion, three.js</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>backend / data</strong>
              <span>supabase, postgres, edge functions, pgvector</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>AI / ML</strong>
              <span>groq, deepgram, openai, cerebras, CLIP, ollama, prompt engineering</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>3D / creative / video</strong>
              <span>blender, zbrush, substance painter, after effects, premiere pro, photoshop, illustrator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
