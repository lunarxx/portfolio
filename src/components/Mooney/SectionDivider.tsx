import Image from 'next/image'
import styles from './Mooney.module.css'

export function SectionDivider() {
  return (
    <div className={styles.divider}>
      <div className={styles.dividerMascot}>
        <Image
          src="/mooney/sitting.png"
          alt="mooney mascot sitting"
          width={1146}
          height={1373}
          draggable={false}
          priority
        />
      </div>
    </div>
  )
}
