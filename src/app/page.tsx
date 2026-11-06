import type { Metadata, Viewport } from 'next'
import { VT323, Gochi_Hand, JetBrains_Mono, IBM_Plex_Mono } from 'next/font/google'
import MeetClient from './MeetClient'

const vt = VT323({ subsets: ['latin'], weight: '400', variable: '--f-vt' })
const hand = Gochi_Hand({ subsets: ['latin'], weight: '400', variable: '--f-hand' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--f-mono' })
const plex = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--f-plex' })

export const metadata: Metadata = {
  title: 'Interview with Ashwini',
  description: 'Sit in on a call with Ashwini Tiwari at his desk. Ask him anything.',
}

// on a phone: edge to edge (the call pads itself clear of the notch and the home bar), and the keyboard shrinks the
// call instead of sliding over the ask box
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', interactiveWidget: 'resizes-content', themeColor: '#121214' }

export default function Page() {
  return <MeetClient fonts={`${vt.variable} ${hand.variable} ${mono.variable} ${plex.variable}`} />
}
