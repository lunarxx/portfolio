import type { Metadata } from 'next'
import { Caveat, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const hand = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
})

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'Ashwini Tiwari',
  description: 'Product engineer building AI-powered products.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${hand.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
