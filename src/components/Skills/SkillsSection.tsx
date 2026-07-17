'use client'

import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'
import { ScrollReveal } from '../ScrollEngine/ScrollReveal'
import styles from './Skills.module.css'

const sites = [
  { name: 'mooney.octyn.co', url: 'https://mooney.octyn.co', color: '#2A6B4F' },
  { name: 'aarttsii.com', url: 'https://aarttsii.com', color: '#B5704A' },
  { name: 'whofits.co', url: 'https://whofits.co', color: '#d4a574' },
  { name: 'inkling.octyn.co', url: 'https://inkling.octyn.co', color: '#1f8fce' },
]

const thinkingPoints = [
  {
    title: 'i think before i build',
    body: 'every project starts with a question, not a codebase. before aarttsii had a single screen, there was a 40,000 word research doc covering pricing psychology, competitor teardowns, and a full go to market plan. whofits started with "what if follower count is meaningless" and turned into a 7 signal ranking formula (engagement velocity, audience overlap, brand safety, content consistency, growth trajectory, niche relevance, response rate). i need to understand a problem properly before i start solving it.',
  },
  {
    title: 'ai does the typing, i do the thinking',
    body: 'i use ai to build everything. this portfolio, every product, the tools behind them. but the interesting problems are never about code. mooney\'s voice pipeline took weeks to design not because api calls are hard, but because making 4 speech providers feel like one seamless experience is a product problem. i care about what gets built and why, not how many lines i wrote.',
  },
  {
    title: 'every product starts with a real frustration',
    body: 'mooney exists because expense tracking apps assume you want to type. nobody does. aarttsii exists because crochet artists were getting lowballed in dms because customers had no frame of reference for pricing. whofits exists because agencies waste days scrolling feeds to find creators who might be a fit. i don\'t build things because they sound cool. i build them because someone is annoyed enough.',
  },
]

const toolProjects = [
  {
    name: 'The Lead Engine',
    desc: 'a self tuning engine that finds a client\'s real buyers, qualifies them on genuine intent, and drafts outreach in the client\'s own voice. it derives its own weighting for each source from the ideal customer profile, then reprioritises whatever actually converts, so a channel that returns nothing gets dropped on its own. two separate gates check mentality and feasibility before anyone gets enriched, which is what stopped it drowning in junk.',
    tags: ['Groq', 'Python', 'self-tuning'],
  },
  {
    name: 'Lead Sourcer',
    desc: 'the discovery layer under the engine. it harvests a huge pool of free proxies and rotates proxy, search engine and fingerprint to pull clean lead lists at scale, resilient to blocks and never running through my own connection. source patterns regenerate per client instead of a fixed url list that goes stale.',
    tags: ['Python', 'distributed scraping', 'SERP'],
  },
  {
    name: 'WhoFits, blue collar',
    desc: 'whofits started as a creator matching tool, then pivoted to blue collar businesses where the money and the need actually are. the engine now turns free public building permit records into a weekly feed of ready to pitch leads plus a competitor tracker for contractors across california, washington and oregon. i sell the outcome, a steady stream of real jobs, not the plumbing behind it.',
    tags: ['permit data', 'ArcGIS', 'Supabase'],
  },
  {
    name: 'ImageToPattern',
    desc: 'upload any image, CLIP finds the closest matching crochet pattern from 92,000 indexed patterns',
    tags: ['CLIP', 'pgvector', 'Flutter'],
  },
]

const background = [
  { area: 'product design', detail: 'figuring out what to build, who its for, and why it should exist. every product here went through a proper research phase before anything got made.' },
  { area: '3D and character art', detail: 'blender, zbrush, substance painter. worked on sanshu\'s yokai collection for 3 years. ran a small 3D agency after that doing character design and brand visuals.' },
  { area: 'AI system design', detail: 'designing how AI fits into a product so it actually feels useful. voice pipelines, vision scoring, embedding search. the interesting part is always the product problem, not the model.' },
  { area: 'research and strategy', detail: 'competitive analysis, pricing models, go to market planning. i like understanding a space properly before committing to building in it.' },
  { area: 'brand and identity', detail: 'every product has its own visual language and personality. i design the sites, the tone, the whole experience. not just wireframes.' },
  { area: 'data and automation', detail: 'building systems that collect, score, and surface useful information. crawlers, scrapers, ranking formulas. turning noise into something actionable.' },
]

export function SkillsSection() {
  const [expandedTool, setExpandedTool] = useState<number | null>(null)
  const [expandedSite, setExpandedSite] = useState<string | null>(null)
  const iframeWrapRef = useRef<HTMLDivElement>(null)

  const setIframeScale = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    iframeWrapRef.current = node
    const containerWidth = node.offsetWidth
    const scale = containerWidth / 1440
    node.style.setProperty('--iframe-scale', String(scale))
    node.style.height = `${900 * scale}px`
  }, [])

  return (
    <section className={styles.section} id="about">
      <ScrollReveal>
        <h2 className={styles.title}>about me</h2>
        <p className={styles.intro}>
          i am a generalist. i went from sculpting 3D characters in zbrush to designing AI powered products.
          i learn fast, i build end to end, and i obsess over making things that people actually want to use.
          mooney and whofits are co founded. aarttsii and everything else here is solo built.
        </p>
      </ScrollReveal>

      <ScrollReveal>
        <h3 className={styles.sectionLabel}>how i think</h3>
        <div className={styles.thinkingGrid}>
          {thinkingPoints.map(p => (
            <div key={p.title} className={styles.thinkingCard}>
              <h4 className={styles.thinkingTitle}>{p.title}</h4>
              <p className={styles.thinkingBody}>{p.body}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className={styles.sanshuCard}>
          <div className={styles.sanshuInfo}>
            <span className={styles.sanshuLabel}>work experience</span>
            <h3 className={styles.sanshuTitle}>SANSHU!</h3>
            <p className={styles.sanshuRole}>lead 3D artist, 2021 onwards</p>
            <p className={styles.sanshuBody}>
              one of the earliest members of the team. prototyped the digital mascot characters, built in game assets,
              and helped establish the visual language that still defines the brand today. designed the yokai mask NFT collection,
              2,000 unique pieces, phase 1 sold out in 3 days.
            </p>
            <p className={styles.sanshuBody}>
              after sanshu, i started media3ms, a 3D marketing agency where i took on client work
              doing character design, product renders, and brand visuals.
            </p>
            <div className={styles.sanshuLinks}>
              <a href="/sanshu-lor.pdf" target="_blank" rel="noopener noreferrer" className={styles.sanshuLor}>
                letter of recommendation ↗
              </a>
              <a href="https://artstation.com/ashwtiw" target="_blank" rel="noopener noreferrer" className={styles.sanshuArt}>
                artstation ↗
              </a>
            </div>
          </div>
          <div className={styles.sanshuGallery}>
            {[
              { src: '/art/sanshu-promo.jpg', alt: 'Sanshu Promo' },
              { src: '/art/yokai-masks.jpg', alt: 'Yokai Masks' },
              { src: '/art/namahage.jpg', alt: 'Namahage' },
              { src: '/art/sanshu-samurai.jpg', alt: 'Sanshu Samurai' },
            ].map(img => (
              <div key={img.alt} className={styles.sanshuImg}>
                <Image src={img.src} alt={img.alt} width={200} height={200} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <h3 className={styles.sectionLabel}>what i know</h3>
        <div className={styles.bgGrid}>
          {background.map(b => (
            <div key={b.area} className={styles.bgCard}>
              <span className={styles.bgArea}>{b.area}</span>
              <p className={styles.bgDetail}>{b.detail}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <h3 className={styles.sectionLabel}>the engines behind the products</h3>
        <p className={styles.toolsIntro}>
          not just the apps. these are the systems underneath. some i built to feed my own products,
          one became the thing whofits actually sells.
        </p>
        <div className={styles.toolsGrid}>
          {toolProjects.map((tool, i) => (
            <div
              key={tool.name}
              className={`${styles.toolCard} ${expandedTool === i ? styles.toolExpanded : ''}`}
              onClick={() => setExpandedTool(expandedTool === i ? null : i)}
            >
              <div className={styles.toolHeader}>
                <span className={styles.toolName}>{tool.name}</span>
                <span className={styles.toolToggle}>{expandedTool === i ? '−' : '+'}</span>
              </div>
              {expandedTool === i && (
                <div className={styles.toolBody}>
                  <p className={styles.toolDesc}>{tool.desc}</p>
                  <div className={styles.toolTags}>
                    {tool.tags.map(t => <span key={t} className={styles.toolTag}>{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal>
        <div className={styles.sites}>
          <h3 className={styles.sectionLabel}>sites i built (yes, all of them)</h3>
          <div className={styles.embedGrid}>
            {sites.map(site => (
              <button
                key={site.name}
                className={`${styles.embedCard} ${expandedSite === site.url ? styles.embedCardActive : ''}`}
                onClick={() => setExpandedSite(expandedSite === site.url ? null : site.url)}
              >
                <div className={styles.embedDot} style={{ background: site.color }} />
                <span>{site.name}</span>
                <span className={styles.embedToggle}>{expandedSite === site.url ? '✕' : 'view'}</span>
              </button>
            ))}
          </div>
          {expandedSite && (
            <div className={styles.embedFrame}>
              <div className={styles.embedBrowser}>
                <div className={styles.browserDots}>
                  <span style={{ background: '#ff5f57' }} />
                  <span style={{ background: '#febc2e' }} />
                  <span style={{ background: '#28c840' }} />
                </div>
                <span className={styles.browserUrl}>{expandedSite.replace('https://', '')}</span>
                <a href={expandedSite} target="_blank" rel="noopener noreferrer" className={styles.browserOpen}>open ↗</a>
              </div>
              <div className={styles.iframeWrap} ref={setIframeScale}>
                <iframe
                  src={expandedSite}
                  className={styles.iframe}
                  title={expandedSite}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>
    </section>
  )
}
