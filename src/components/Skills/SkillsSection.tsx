import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './Skills.module.css'

const categories = [
  {
    icon: '🧠',
    title: 'AI & LLM Engineering',
    role: 'what i do best',
    skills: ['Multi-provider LLM pipelines', 'Groq', 'Deepgram STT', 'Groq Vision', 'Prompt engineering', 'JSON mode parsing', 'Fallback chains', 'Rate limiting & key rotation', 'Edge function deployment'],
    proof: 'built a 4-provider voice AI pipeline that processes speech to structured data in under 2 seconds. handles 200 calls/day with automatic failover.',
  },
  {
    icon: '🚀',
    title: 'Full-Stack Product Engineering',
    role: 'end to end',
    skills: ['Next.js 16', 'React', 'TypeScript', 'Flutter', 'Kotlin', 'Supabase', 'Postgres', 'Vercel', 'Razorpay', 'Playwright'],
    proof: '3 shipped products. mooney has 19 beta testers. aarttsii is a live e-commerce site. whofits crawled 25k creators.',
  },
  {
    icon: '🎨',
    title: 'Creative & 3D',
    role: 'where i started',
    skills: ['Blender', '3D Animation', 'Character Design', 'NFT Art', 'Brand Identity', 'Mascot Design', 'Motion Graphics'],
    proof: 'lead 3D artist at sanshu studios. designed the yokai NFT collection (2,000 NFTs, phase 1 sold out in 3 days). ran a 3D marketing agency.',
  },
  {
    icon: '📐',
    title: 'Product Thinking',
    role: 'how i approach problems',
    skills: ['User Research', 'Competitive Audit', 'Pricing Strategy', 'GTM Planning', 'A/B Thinking', 'Creator Economy', 'SaaS Architecture'],
    proof: 'wrote a 2,251-line GTM playbook for aarttsii. designed a 7-signal ranking formula for whofits. built internal tools that feed my own products.',
  },
]

export function SkillsSection() {
  return (
    <section className={styles.section} id="skills">
      <ScrollReveal>
        <h2 className={styles.title}>what i bring to the table</h2>
        <p className={styles.subtitle}>
          not a list of technologies. the actual things i can do and have done.
        </p>
      </ScrollReveal>

      <div className={styles.grid}>
        {categories.map((cat, i) => (
          <ScrollReveal key={cat.title} delay={i * 100}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>{cat.icon}</div>
              <h3 className={styles.cardTitle}>{cat.title}</h3>
              <p className={styles.cardRole}>{cat.role}</p>
              <div className={styles.cardSkills}>
                {cat.skills.map(s => <span key={s} className={styles.skill}>{s}</span>)}
              </div>
              <div className={styles.proof}>
                <p className={styles.proofItem}>{cat.proof}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
