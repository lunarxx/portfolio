'use client'

import { useState, type ReactNode } from 'react'
import styles from './shared.module.css'

export function ExpandToggle({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={styles.expandToggle}>
      <button className={styles.expandButton} onClick={() => setOpen(!open)}>
        <span className={styles.expandIcon} data-open={open}>+</span>
        {label}
      </button>
      {open && <div className={styles.expandContent}>{children}</div>}
    </div>
  )
}
