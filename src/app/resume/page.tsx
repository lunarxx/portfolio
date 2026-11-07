'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './resume.module.css'

export default function ResumePage() {
  const [compact, setCompact] = useState(false)

  // print the full-text version: the print stylesheet sizes it to fill exactly one page
  const printResume = () => {
    const wasCompact = compact
    setCompact(false)
    setTimeout(() => {
      window.print()
      if (wasCompact) setCompact(true)
    }, 150)
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.resume} ${compact ? styles.compact : ''}`}>
        <Link href="/" className={styles.backLink}>back</Link>
        <button className={styles.printBtn} onClick={printResume}>print / save pdf</button>

        <button
          className={styles.modeToggle}
          onClick={() => setCompact(!compact)}
          title={compact ? 'expand to full' : 'compact to 1 page'}
        >
          <span className={styles.modeArrow}>{compact ? '→' : '←'}</span>
          <span className={styles.modeLabel}>{compact ? '  full' : '1 pg'}</span>
        </button>

        <div className={styles.header}>
          <h1 className={styles.name}>Ashwini Tiwari</h1>
          <p className={styles.headline}>
            i build AI systems that run parts of a business on their own. product designer and 3D artist before that.
          </p>
          <div className={styles.contact}>
            <span className={styles.contactItem}><a href="mailto:ashwinitiwari8888@gmail.com">ashwinitiwari8888@gmail.com</a></span>
            <span className={styles.contactItem}><a href="https://github.com/lunarxx">github.com/lunarxx</a></span>
            <span className={styles.contactItem}><a href="https://linkedin.com/in/ashwtiw">linkedin.com/in/ashwtiw</a></span>
            <span className={styles.contactItem}><a href="https://artstation.com/ashwtiw">artstation.com/ashwtiw</a></span>
            <span className={styles.contactItem}>open to full time, remote · india, IST</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>experience</h2>

          <div className={styles.expItem}>
            <div className={styles.expTop}>
              <span className={styles.expRole}>Co-Founder <span className={styles.expCompany}>at Octyn (Core Octyn Operations LLP)</span></span>
              <span className={styles.expDate}>2025 – present</span>
            </div>
            <ul className={styles.expList}>
              <li>we build a system for one company at a time, then keep running it for them. whoever does the consult also does the build and stays on for the run, so there's no handover</li>
              <li>i take client work from the paid consult to the thing running in production, like a guided product demo for a health-tech company. every client gets their own private proposal site, on our servers</li>
              <li>our sales runs on its own: outreach written from each prospect’s own work, and every agency gets a sample HQ from one link, with their name, teams and colours, to click around in before we talk</li>
              <li>octyn.co has live demos of our systems you can click through, so there isn't a screenshot on it</li>
              {!compact && (
                <li>we run our own infrastructure, a VPS and home servers, deploy on push, and i built one control panel for every service, scheduled job and agent session</li>
              )}
            </ul>
          </div>

          <div className={styles.expItem}>
            <div className={styles.expTop}>
              <span className={styles.expRole}>Co-Founder <span className={styles.expCompany}>at media3ms</span></span>
              <span className={styles.expDate}>2023 – 2024</span>
            </div>
            <ul className={styles.expList}>
              <li>my own 3D studio, three of us, making personalized mascot animations for brands. ran the full pipeline: modeling, texturing, lighting, compositing, editing</li>
            </ul>
          </div>

          <div className={styles.expItem}>
            <div className={styles.expTop}>
              <span className={styles.expRole}>Lead 3D Artist <span className={styles.expCompany}>at SANSHU!</span></span>
              <span className={styles.expDate}>2021 – 2023</span>
            </div>
            <ul className={styles.expList}>
              <li>one of the earliest team members. prototyped the mascot characters, in-game assets and the visual language of the brand</li>
              <li>designed the yokai mask NFT collection: 2,000 unique pieces from 8 animated artworks, with a remote team across time zones</li>
              {!compact && <li>sculpted characters and environments in blender, zbrush and substance painter</li>}
            </ul>
            <a href="/sanshu-lor.pdf" target="_blank" rel="noopener noreferrer" className={styles.lorLink}>
              letter of recommendation from CEO ↗
            </a>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>shipped products <span className={styles.expDate}>2025 – present</span></h2>
          <div className={styles.projectGrid}>
            <div className={styles.project}>
              <span className={styles.projectName}>cookie</span>
              <span className={styles.projectDesc}>
                {compact
                  ? 'a front desk agent for made-to-order businesses: quotes from their own costs, sends the proposal, collects the advance, chases the balance. ships her own small features behind gradual rollouts.'
                  : 'a front desk agent for made-to-order businesses: prices orders from their own costs, sends a branded proposal, collects the advance and chases the balance over whatsapp, instagram and email. client portal with teams and API keys, and an autobuild loop that ships her own small features as partial rollouts that pull back on failure.'
                }
              </span>
              <span className={styles.projectMeta}>live oct 2026</span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>mooney</span>
              <span className={styles.projectDesc}>
                {compact
                  ? 'voice first expense tracker, live on google play. speech to saved row in under 5 s, receipt scanning, overlay widget, 60+ countries.'
                  : 'voice first expense tracker, live on google play. hold a button, say what you spent, done: under 5 s from speech to saved row. layered voice pipeline with fallbacks, 3 tier receipt scanning, overlay widget, 60+ countries.'
                }
              </span>
              <span className={styles.projectMeta}>co founded</span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>aarttsii</span>
              <span className={styles.projectDesc}>
                {compact
                  ? 'all the tech behind a crochet brand that landed hocco from a cold email: a code drawn storefront, an ops portal, courier booking from telegram, and a price estimator that reads a photo.'
                  : 'all the tech behind a crochet brand that landed hocco from a cold email: a storefront drawn in code, an ops portal with CRM and shareable invoices, courier booking from telegram, and a photo price estimator whose model was picked on measured error.'
                }
              </span>
              <span className={styles.projectMeta}>solo built</span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>inkling</span>
              <span className={styles.projectDesc}>
                {compact
                  ? 'local first markdown workspace, shipped on desktop. your vault is a github repo. real time multiplayer editing on CRDTs, link graph, self updating.'
                  : 'local first markdown workspace, shipped and self updating on desktop. plain markdown on your disk, your vault is a github repo so sync is free. real time multiplayer editing built on CRDTs, presence, panes, canvas and a link graph.'
                }
              </span>
              <span className={styles.projectMeta}>solo built</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>engines i built</h2>
          <div className={styles.projectGrid}>
            <div className={styles.project}>
              <span className={styles.projectName}>AI streamer</span>
              <span className={styles.projectDesc}>
                {compact
                  ? 'a character that streams on its own: codes real projects live, talks to chat and plays the games it builds. a webcam rig gives it a body, and it draws and posts its own reels.'
                  : 'a character that streams on its own: codes real projects live, talks to chat and plays the games it builds, in a local voice tuned to human pitch and pace. a webcam rig gives it a body, and a pipeline draws and posts a reel every morning.'
                }
              </span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>RAG + memory</span>
              <span className={styles.projectDesc}>
                {compact
                  ? 'a RAG engine every agent shares: keyword and meaning search, reranking, answers that cite their sources and say when they don’t know, plus memory that retires a fact when it changes.'
                  : 'a RAG engine every agent shares: keyword and meaning search fused and reranked, answers that cite their sources and say when they don’t know, plus long term memory that retires a fact when it changes. on this portfolio it puts the right note first 75% of the time, up from 41% (measured 7 nov).'
                }
              </span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>outbound</span>
              <span className={styles.projectDesc}>
                {compact
                  ? 'omnichannel outbound for octyn and aarttsii: email, linkedin and instagram and x through cloud browsers, every message researched from the prospect’s own work.'
                  : 'omnichannel outbound for octyn and aarttsii: email, linkedin through its official API with a daily warm-up, instagram and x through cloud browser setups, every message written from the prospect’s own work and approved or skipped from telegram. 37 of 212 brands replied to aarttsii’s, 17%.'
                }
              </span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>email delivery</span>
              <span className={styles.projectDesc}>
                {compact
                  ? 'homegrown: our own sender on our VPS, 12 inboxes across 6 domains, every bounce and reply read back in, addresses verified before anything sends.'
                  : 'homegrown: our own sending service on our VPS, 12 inboxes across 6 domains, every bounce and reply read back in, and addresses verified before anything sends. deliverability measured, not guessed: a domain inbox landed 3.3x better than gmail.'
                }
              </span>
            </div>
            <div className={styles.project}>
              <span className={styles.projectName}>hq</span>
              <span className={styles.projectDesc}>
                {compact
                  ? 'one control panel for every timer, service, agent session and alert across my laptop and VPS, on a fixed action list with no shell.'
                  : 'one control panel for every timer, service, agent session and alert across my laptop and VPS, on a fixed action list with no shell.'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Full mode: separate "what i do" section */}
        <div className={`${styles.section} ${styles.fullOnly}`}>
          <h2 className={styles.sectionTitle}>what i do</h2>
          <div className={styles.skillGrid}>
            <div className={styles.skillGroup}>
              <strong>product design</strong>
              <span>working out what to build and who for, user research, competitive analysis, GTM</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>3D art</strong>
              <span>blender, zbrush, substance painter, character design, NFT collections, brand visuals</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>AI system design</strong>
              <span>agents, RAG and long term memory, real time tracking, voice, vision, eval sets, fallbacks that keep it running</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>research and strategy</strong>
              <span>pricing psychology, cold outreach, competitive audits, 40,000+ word research docs</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>brand and identity</strong>
              <span>visual identity, site design, tone of voice, how a product sounds and feels</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>ops and automation</strong>
              <span>self healing scheduled jobs, telegram control surfaces, browser automation, lead pipelines</span>
            </div>
          </div>
        </div>

        {/* Full mode: "how i think" with paragraphs */}
        <div className={`${styles.section} ${styles.fullOnly}`}>
          <h2 className={styles.sectionTitle}>how i think</h2>
          <div className={styles.thinkGrid}>
            <div className={styles.thinkItem}>
              <strong>research first, then build</strong>
              <span>i like having the question straight before i write any code. before aarttsii had a single screen i had written 40,000 words on pricing psychology, competitors and how we'd sell it.</span>
            </div>
            <div className={styles.thinkItem}>
              <strong>built around real problems</strong>
              <span>mooney came from every expense app making you type, and aarttsii’s estimator from watching crochet artists get lowballed in dms because nobody had a way to price the work. most of what i build starts with someone being annoyed, usually me.</span>
            </div>
            <div className={styles.thinkItem}>
              <strong>ai does the typing, i do the thinking</strong>
              <span>i direct it, review it and test it. what keeps me honest is that every system has a fixed eval set and every rule i care about is a test, so a change only ships when the numbers say it's better.</span>
            </div>
          </div>
        </div>

        {/* Compact mode: "how i think" as one-liners */}
        <div className={`${styles.section} ${styles.compactOnly}`}>
          <h2 className={styles.sectionTitle}>how i think</h2>
          <ul className={styles.thinkListCompact}>
            <li><strong>research first, then build</strong> i like having the question straight before i write any code. aarttsii had 40,000 words of research before it had a screen.</li>
            <li><strong>built around real problems</strong> most of what i build starts with someone being annoyed, usually me.</li>
            <li><strong>ai does the typing, i do the thinking</strong> every system has a fixed eval set, so a change only ships when the numbers say it's better.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>education</h2>
          <div className={styles.expItem}>
            <div className={styles.expTop}>
              <span className={styles.expRole}>BA (Hons) History <span className={styles.expCompany}>University of Delhi</span></span>
              <span className={styles.expDate}>2023 – 2026</span>
            </div>
            <ul className={styles.expList}>
              <li>
                {compact
                  ? 'final year project, palimpse: a source analysis engine that scores historical texts for author and reader bias across 6 parameters, with a comparative dashboard.'
                  : 'final year project, palimpse: a source analysis engine that scores historical texts for author and reader bias across 6 parameters (voice, framing, causality, power relations, evidence selection, assumptions). comparative dashboard lets users see how different authors shape the same event and where their own reading bias sits'
                }
              </li>
            </ul>
          </div>
        </div>

        {/* Full mode: separate "tech i work with" */}
        <div className={`${styles.section} ${styles.fullOnly}`}>
          <h2 className={styles.sectionTitle}>tech i work with</h2>
          <div className={styles.skillGrid}>
            <div className={styles.skillGroup}>
              <strong>frontend / mobile</strong>
              <span>next.js, react, typescript, flutter, three.js, framer motion, electron</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>backend / infra</strong>
              <span>postgres, pgvector, supabase, python, job queues, self hosted servers, telegram bots</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>AI</strong>
              <span>agents, retrieval and memory, local and on-device models, speech, vision, real time tracking</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>3D / creative / video</strong>
              <span>blender, zbrush, substance painter, after effects, premiere pro, photoshop, illustrator</span>
            </div>
          </div>
        </div>

        {/* Compact mode: merged "skills and tech" */}
        <div className={`${styles.section} ${styles.compactOnly}`}>
          <h2 className={styles.sectionTitle}>skills and tech</h2>
          <div className={styles.skillGrid}>
            <div className={styles.skillGroup}>
              <strong>product</strong>
              <span>working out what to build and who for, user research, competitive analysis, GTM, brand identity</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>AI</strong>
              <span>agents, retrieval and memory, eval sets, local and on-device models, speech, vision, real time tracking</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>frontend / mobile</strong>
              <span>next.js, react, typescript, flutter, three.js, framer motion, electron</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>backend / infra</strong>
              <span>postgres, pgvector, supabase, python, job queues, self hosted servers, telegram bots</span>
            </div>
            <div className={styles.skillGroup}>
              <strong>3D / creative</strong>
              <span>blender, zbrush, substance painter, after effects, premiere pro, photoshop, illustrator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
