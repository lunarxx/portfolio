'use client'

import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import styles from './Hero.module.css'

const MAILTO = 'mailto:ashwinitiwari8888@gmail.com'

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -160])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -60])
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -120])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -50])

  return (
    <section className={styles.hero} ref={ref}>
      <nav className={styles.nav}>
        <span className={styles.navName}>AT.</span>
        <div className={styles.navLinks}>
          <a href="#mooney">work</a>
          <a href="#about">about</a>
          <a href="#timeline">journey</a>
          <a href="/resume">resume</a>
          <a href="https://x.com/ashwtiw" target="_blank" rel="noopener noreferrer">twitter</a>
          <a href={MAILTO} className={styles.navCta}>say hi</a>
        </div>
      </nav>

      {/* Single mooney mascot */}
      <motion.div
        className={`${styles.cutout} ${styles.float1}`}
        style={{ y: y1 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image src="/mooney/waving.png" alt="" width={916} height={2018} draggable={false} style={{ width: 120, height: 'auto' }} priority />
      </motion.div>

      {/* Sticky notes scattered around */}
      <motion.div className={`${styles.stickyNote} ${styles.sticky1}`} style={{ y: y2 }}
        initial={{ opacity: 0, rotate: -8 }} animate={{ opacity: 1, rotate: -4 }} transition={{ delay: 0.5, duration: 0.5 }}>
        ex 3d artist turned<br />product engineer
      </motion.div>

      <motion.div className={`${styles.stickyNote} ${styles.sticky2}`} style={{ y: y3 }}
        initial={{ opacity: 0, rotate: 5 }} animate={{ opacity: 1, rotate: 3 }} transition={{ delay: 0.7, duration: 0.5 }}>
        25k creators crawled<br />for one product alone
      </motion.div>


      {/* 3ms character on right */}
      <motion.div
        className={`${styles.cutout} ${styles.float2}`}
        style={{ y: y4 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.chatBubble}>hire me maybe?</div>
        <Image src="/3ms-character.png" alt="" width={1080} height={1080} draggable={false} style={{ width: 440, height: 'auto' }} />
      </motion.div>

      <motion.div className={styles.center} style={{ y: textY }}>
        <motion.h1 className={styles.name}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          ASHWINI<br />TIWARI
        </motion.h1>
        <motion.p className={styles.tagline}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}>
          generalist. i build ai products, design 3d characters,<br />and somehow all of it works together
        </motion.p>
        <motion.div className={styles.pills}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}>
          <a href="#mooney" className={styles.pill}>mooney</a>
          <a href="#whofits" className={styles.pill}>whofits</a>
          <a href="#aarttsii" className={styles.pill}>aarttsii</a>
          <a href="#inkling" className={styles.pill}>inkling</a>
        </motion.div>
      </motion.div>
    </section>
  )
}
