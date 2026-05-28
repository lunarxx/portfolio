import styles from './Footer.module.css'

const links = [
  { label: 'GitHub', href: 'https://github.com/lunarxx' },
  { label: 'Twitter', href: 'https://x.com/ashwtiw' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/ashwtiw' },
  { label: 'Email', href: 'mailto:ashwinitiwari8888@gmail.com?subject=this%20better%20not%20be%20a%20prefilled%20subject%20line&body=(it%20was)%0A%0Aanyway%20what%20i%20actually%20wanted%20to%20say%3A%0A%0A' },
]

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        {links.map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
            {l.label}
          </a>
        ))}
      </div>
      <p className={styles.credit}>built by ashwini, obviously</p>
    </footer>
  )
}
