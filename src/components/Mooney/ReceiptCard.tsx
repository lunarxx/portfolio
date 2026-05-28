import styles from './Mooney.module.css'

const INSIGHTS: Record<string, string> = {
  food: 'another meal logged. your stomach has a budget now.',
  coffee: 'caffeine addiction: tracked.',
  transport: 'getting places. financially too.',
  shopping: 'retail therapy, but make it responsible.',
  groceries: 'adulting, one receipt at a time.',
  entertainment: 'fun costs money. now you know exactly how much.',
  default: 'logged. your future self thanks you.',
}

interface Expense {
  amount: number
  category: string
  merchant: string
  currency: string
  transcript: string
}

export function ReceiptCard({ expense }: { expense: Expense }) {
  const key = Object.keys(INSIGHTS).find(k => expense.category.toLowerCase().includes(k))
  const insight = INSIGHTS[key || 'default']
  const symbol = expense.currency === 'INR' ? '₹' : expense.currency === 'USD' ? '$' : expense.currency

  return (
    <div className={styles.receiptCard}>
      <p className={styles.transcript}>&ldquo;{expense.transcript}&rdquo;</p>
      <div className={styles.receiptDivider} />
      <p className={styles.amount}>{symbol}{expense.amount}</p>
      <p className={styles.merchant}>{expense.merchant}</p>
      <p className={styles.category}>{expense.category}</p>
      <div className={styles.receiptDivider} />
      <p className={styles.insight}>{insight}</p>
    </div>
  )
}
