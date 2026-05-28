import styles from './Footer.module.css'

const links = [
  { label: 'GitHub', href: 'https://github.com/lunarxx' },
  { label: 'Twitter', href: 'https://x.com/ashwtiw' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/ashwtiw' },
  { label: 'Email', href: 'mailto:admin@octyn.co' },
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
