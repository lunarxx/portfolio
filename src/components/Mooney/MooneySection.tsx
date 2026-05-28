import Image from 'next/image'
import { VoiceDemo } from './VoiceDemo'
import styles from './Mooney.module.css'

export function MooneySection() {
  return (
    <>
      <div className={styles.transition} />
      <section className={styles.section} id="mooney">
        {/* Floating sarcastic bubbles */}
        <div className={`${styles.bubble} ${styles.bubbleLeft}`}>
          third coffee today. at this point just <strong>buy the machine</strong>.
        </div>
        <div className={`${styles.bubble} ${styles.bubbleRight}`}>
          your gym membership is basically a <strong>monthly donation</strong>.
        </div>

        {/* Headline */}
        <h2 className={styles.title}>
          your money, <span className={styles.accent}>spoken for.</span>
        </h2>
        <p className={styles.tagline}>just say it. mooney tracks it.</p>

        {/* Demo card with mascot */}
        <div className={styles.demoArea}>
          <div className={styles.mascotPeek}>
            <Image
              src="/mooney/peeking-over.png"
              alt="mooney mascot peeking"
              width={200}
              height={130}
              draggable={false}
            />
          </div>
          <div className={styles.demoCard}>
            <VoiceDemo />
          </div>
        </div>
      </section>
    </>
  )
}
