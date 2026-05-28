import Image from 'next/image'
import styles from './Mooney.module.css'

export function SectionDivider() {
  return (
    <div className={styles.divider}>
      <div className={styles.dividerMascot}>
        <Image
          src="/mooney/waving.png"
          alt="mooney mascot waving"
          width={916}
          height={2018}
          draggable={false}
          priority
        />
      </div>
    </div>
  )
}
