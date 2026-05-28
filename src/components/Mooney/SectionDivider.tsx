import Image from 'next/image'
import styles from './Mooney.module.css'

export function SectionDivider() {
  return (
    <div className={styles.divider}>
      <div className={styles.dividerMascot}>
        <Image
          src="/mooney/holding-a-mic.png"
          alt="mooney mascot with microphone"
          width={140}
          height={200}
          draggable={false}
        />
      </div>
      <svg
        className={styles.dividerWave}
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 80C240 20 480 140 720 80C960 20 1200 140 1440 80V160H0V80Z"
          fill="#F2EFE7"
        />
      </svg>
    </div>
  )
}
