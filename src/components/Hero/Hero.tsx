'use client'

import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import styles from './Hero.module.css'

const cutouts = [
  { src: '/mooney/standing-front.png', w: 916, h: 2018, size: 160, className: 'cutout1', speed: 0.3 },
  { src: '/mooney/holding-a-receipt.png', w: 916, h: 2018, size: 110, className: 'cutout2', speed: 0.5 },
  { src: '/mooney/thinking.png', w: 916, h: 2018, size: 90, className: 'cutout3', speed: 0.2 },
  { src: '/aarttsii/logo.png', w: 200, h: 200, size: 70, className: 'cutout4', speed: 0.4 },
]

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -80])
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -160])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const parallaxYs = [y1, y2, y3, y4]

  return (
    <section className={styles.hero} ref={ref}>
      {/* Nav */}
      <nav className={styles.nav}>
        <span className={styles.navName}>AT.</span>
        <div className={styles.navLinks}>
          <a href="#mooney">work</a>
          <a href="#timeline">journey</a>
          <a href="https://linkedin.com/in/ashwtiw" target="_blank" rel="noopener noreferrer">resume</a>
          <a href="mailto:admin@octyn.co" className={styles.navCta}>say hi</a>
        </div>
      </nav>

      {/* Floating cutouts with parallax */}
      {cutouts.map((item, i) => (
        <motion.div
          key={i}
          className={`${styles.cutout} ${styles[item.className]}`}
          style={{ y: parallaxYs[i] }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={item.src}
            alt=""
            width={item.w}
            height={item.h}
            draggable={false}
            style={{ width: item.size, height: 'auto' }}
            priority={i < 2}
          />
        </motion.div>
      ))}

      {/* Sticky notes with personality */}
      <motion.div
        className={`${styles.stickyNote} ${styles.sticky1}`}
        style={{ y: y2 }}
        initial={{ opacity: 0, rotate: -8 }}
        animate={{ opacity: 1, rotate: -4 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        ex 3d artist turned<br />product engineer
      </motion.div>

      <motion.div
        className={`${styles.stickyNote} ${styles.sticky2}`}
        style={{ y: y3 }}
        initial={{ opacity: 0, rotate: 5 }}
        animate={{ opacity: 1, rotate: 3 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        19 real users on<br />my expense tracker
      </motion.div>

      <motion.div
        className={`${styles.stickyNote} ${styles.sticky3}`}
        style={{ y: y1 }}
        initial={{ opacity: 0, rotate: -3 }}
        animate={{ opacity: 1, rotate: 2 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        25k creators crawled<br />for whofits
      </motion.div>

      {/* Center content */}
      <motion.div className={styles.center} style={{ y: textY }}>
        <motion.h1
          className={styles.name}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          ASHWINI<br />TIWARI
        </motion.h1>
        <motion.p
          className={styles.tagline}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          i make things that work and sometimes they even have users
        </motion.p>

        <motion.div
          className={styles.pills}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <a href="#mooney" className={styles.pill}>mooney</a>
          <a href="#whofits" className={styles.pill}>whofits</a>
          <a href="#aarttsii" className={styles.pill}>aarttsii</a>
        </motion.div>
      </motion.div>

      {/* Scrolling marquee */}
      <div className={styles.marquee}>
        <motion.div
          className={styles.marqueeTrack}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
        >
          {['voice ai', 'flutter', 'next.js', 'supabase', 'groq vision', 'deepgram', 'blender', 'playwright', 'creator tools', 'full-stack',
            'voice ai', 'flutter', 'next.js', 'supabase', 'groq vision', 'deepgram', 'blender', 'playwright', 'creator tools', 'full-stack',
          ].map((tag, i) => (
            <span key={i} className={styles.marqueeItem}>
              {tag} <span className={styles.marqueeDot}>·</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
