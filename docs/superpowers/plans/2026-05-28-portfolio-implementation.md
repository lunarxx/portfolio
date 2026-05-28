# Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive portfolio website where visitors experience Ashwini's products through live demos, not reading.

**Architecture:** Next.js 16 App Router with vanilla CSS modules per section. Each project section is a self-contained client component with its own demo logic. API routes handle Deepgram STT, Groq LLM parsing (Mooney), and Groq vision (aarttsii). WhoFits and internal tools use hardcoded mock data. No UI framework — custom CSS throughout.

**Tech Stack:** Next.js 16, TypeScript, CSS Modules, Deepgram SDK (STT), Groq API (LLM + vision), @dnd-kit (drag-and-drop), Vercel deployment.

**Project directory:** `/media/ashwtiw/Lunar_s Memory/Claude/portfolio/`

**Dev commands:** `source ~/.nvm/nvm.sh && cd "/media/ashwtiw/Lunar_s Memory/Claude/portfolio" && npm run dev`

---

## File Structure

```
portfolio/
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.local                          # DEEPGRAM_API_KEY, GROQ_API_KEY
├── .gitignore
├── public/
│   ├── characters/                     # 3D character images (mooney cow, whofits, aarttsii, sanshu)
│   ├── timeline/                       # era visuals (3D renders, screenshots)
│   └── aarttsii-samples/              # 3-4 pre-loaded crochet reference images
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # root layout, fonts, global styles
│   │   ├── page.tsx                    # main page composing all sections
│   │   ├── globals.css                 # CSS reset, variables, typography
│   │   ├── api/
│   │   │   ├── transcribe/route.ts     # Deepgram STT endpoint
│   │   │   ├── parse-expense/route.ts  # Groq LLM expense parsing
│   │   │   └── estimate/route.ts       # Groq vision crochet estimation
│   ├── components/
│   │   ├── Hero/
│   │   │   ├── Hero.tsx
│   │   │   └── Hero.module.css
│   │   ├── Mooney/
│   │   │   ├── MooneySection.tsx       # main section wrapper
│   │   │   ├── VoiceDemo.tsx           # mic button, recording, transcript display
│   │   │   ├── ReceiptCard.tsx         # receipt-themed parsed expense card
│   │   │   ├── PipelineDiagram.tsx     # expandable architecture diagram
│   │   │   └── Mooney.module.css
│   │   ├── WhoFits/
│   │   │   ├── WhoFitsSection.tsx      # main section wrapper
│   │   │   ├── CreatorCard.tsx         # draggable creator profile card
│   │   │   ├── QualificationDashboard.tsx  # drop target, shows qualification data
│   │   │   ├── HandDrawnArrow.tsx      # SVG curvy arrow component
│   │   │   ├── ArchitectureDiagram.tsx # expandable pipeline diagram
│   │   │   └── WhoFits.module.css
│   │   ├── Aarttsii/
│   │   │   ├── AarttsiiSection.tsx     # main section wrapper
│   │   │   ├── EstimatorDemo.tsx       # image selection + upload + estimate display
│   │   │   ├── EstimateCard.tsx        # estimate result breakdown card
│   │   │   ├── PipelineDiagram.tsx     # expandable vision pipeline diagram
│   │   │   └── Aarttsii.module.css
│   │   ├── InternalTools/
│   │   │   ├── InternalToolsSection.tsx
│   │   │   ├── ToolCard.tsx            # individual tool showcase card
│   │   │   └── InternalTools.module.css
│   │   ├── Timeline/
│   │   │   ├── TimelineSection.tsx     # horizontal scrollable timeline
│   │   │   ├── TimelineNode.tsx        # individual era node
│   │   │   └── Timeline.module.css
│   │   ├── Footer/
│   │   │   ├── Footer.tsx
│   │   │   └── Footer.module.css
│   │   ├── shared/
│   │   │   ├── ExpandToggle.tsx        # reusable expand/collapse wrapper
│   │   │   └── shared.module.css
│   ├── data/
│   │   ├── creators.ts                # 8 mock creator profiles for WhoFits
│   │   ├── qualifications.ts          # pre-computed qualification data per creator
│   │   ├── aarttsii-samples.ts        # hardcoded estimates for sample images
│   │   ├── timeline.ts                # timeline eras data
│   │   └── tools.ts                   # internal tools data
│   ├── lib/
│   │   ├── rate-limit.ts              # server-side rate limiter (from aarttsii)
│   │   └── groq.ts                    # Groq API helpers (vision + LLM)
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.env.local`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Initialize the project**

```bash
source ~/.nvm/nvm.sh
cd "/media/ashwtiw/Lunar_s Memory/Claude/portfolio"
npx create-next-app@latest . --typescript --app --src-dir --no-tailwind --no-eslint --import-alias "@/*" --yes
```

- [ ] **Step 2: Create .env.local with placeholder keys**

Create `/media/ashwtiw/Lunar_s Memory/Claude/portfolio/.env.local`:

```
DEEPGRAM_API_KEY=
GROQ_API_KEY=
GROQ_API_KEY_FALLBACK=
```

- [ ] **Step 3: Set up globals.css with design tokens**

Replace `src/app/globals.css` with CSS reset, custom properties for the portfolio's own identity. Define:
- `--bg`: deep dark background (not pure black — something like `#0a0a0c`)
- `--fg`: off-white text (`#e8e4df`)
- `--accent`: a distinctive accent color (pick something that feels raw/cutesy — not corporate blue)
- `--font-mono`: IBM Plex Mono or similar
- `--font-sans`: clean sans-serif
- `--radius`: border radius tokens
- `--section-gap`: spacing between project sections

No gradient orbs, no particle backgrounds. Raw, sleek.

- [ ] **Step 4: Set up root layout with fonts**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { IBM_Plex_Mono, Inter } from 'next/font/google'
import './globals.css'

const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' })
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Ashwini Tiwari',
  description: 'Product engineer. I build AI-powered products.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Create minimal page.tsx**

Replace `src/app/page.tsx`:

```tsx
import styles from './page.module.css'

export default function Home() {
  return (
    <main>
      <section style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <h1>Ashwini Tiwari</h1>
      </section>
    </main>
  )
}
```

- [ ] **Step 6: Verify dev server starts**

```bash
source ~/.nvm/nvm.sh
cd "/media/ashwtiw/Lunar_s Memory/Claude/portfolio"
npm run dev
```

Expected: Dev server starts on localhost:3000, page shows "Ashwini Tiwari".

- [ ] **Step 7: Initialize git and commit**

```bash
cd "/media/ashwtiw/Lunar_s Memory/Claude/portfolio"
git init
echo ".env.local" >> .gitignore
git add -A
git commit -m "feat: scaffold portfolio with Next.js"
```

---

## Task 2: Shared Utilities

**Files:**
- Create: `src/lib/rate-limit.ts`
- Create: `src/lib/groq.ts`
- Create: `src/components/shared/ExpandToggle.tsx`
- Create: `src/components/shared/shared.module.css`

- [ ] **Step 1: Create rate limiter**

Create `src/lib/rate-limit.ts` — in-memory rate limiter (copied from aarttsii, proven pattern):

```ts
const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}
```

- [ ] **Step 2: Create Groq helpers**

Create `src/lib/groq.ts` with two functions:

1. `parseExpense(transcript: string)` — calls Groq llama-3.1-8b with JSON mode to extract `{ amount, category, merchant, currency }` from a voice transcript. System prompt instructs it to parse expense intent.
2. `estimateFromImage(base64Image: string, size: string)` — calls Groq llama-4-scout vision model. Uses the exact prompt from aarttsii's `groq.ts` (the full complexity scoring prompt). Returns `GroqResult` with ci, category, factors, detected_details.

Both use key rotation with `GROQ_API_KEY` and `GROQ_API_KEY_FALLBACK`.

```ts
const GROQ_KEYS = [
  process.env.GROQ_API_KEY!,
  process.env.GROQ_API_KEY_FALLBACK,
].filter(Boolean) as string[]

async function callGroqText(prompt: string, system: string, maxTokens: number) {
  for (const key of GROQ_KEYS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
          max_tokens: maxTokens,
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      })
      if (res.status === 429) continue
      if (!res.ok) throw new Error(`Groq ${res.status}`)
      return res.json()
    } catch (err: any) {
      if (err.message?.includes('429') && GROQ_KEYS.indexOf(key) < GROQ_KEYS.length - 1) continue
      throw err
    }
  }
  throw new Error('All Groq keys rate limited')
}

async function callGroqVision(prompt: string, base64Image: string, maxTokens: number) {
  for (const key of GROQ_KEYS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{ role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            { type: 'text', text: prompt },
          ]}],
          max_tokens: maxTokens,
          temperature: 0,
        }),
      })
      if (res.status === 429) continue
      if (!res.ok) throw new Error(`Groq ${res.status}`)
      return res.json()
    } catch (err: any) {
      if (err.message?.includes('429') && GROQ_KEYS.indexOf(key) < GROQ_KEYS.length - 1) continue
      throw err
    }
  }
  throw new Error('All Groq keys rate limited')
}

export interface ParsedExpense {
  amount: number
  category: string
  merchant: string
  currency: string
}

export async function parseExpense(transcript: string): Promise<ParsedExpense> {
  const system = `You parse voice transcripts into expense data. Extract the amount, category, merchant/vendor name, and currency. If currency is unclear, default to INR. If merchant is unclear, use the category as merchant. Return JSON: { "amount": number, "category": string, "merchant": string, "currency": string }`
  const data = await callGroqText(transcript, system, 150)
  const raw = data.choices[0].message.content.trim()
  const parsed = JSON.parse(raw)
  return {
    amount: parsed.amount || 0,
    category: parsed.category || 'other',
    merchant: parsed.merchant || 'Unknown',
    currency: parsed.currency || 'INR',
  }
}

export interface DetectedDetail {
  label: string
  impact: 'low' | 'medium' | 'high'
}

export interface GroqEstimate {
  category: string
  ci: number
  colour_count: number
  confidence: 'High' | 'Medium' | 'Low'
  factors: string[]
  detected_details: DetectedDetail[]
  is_reference: boolean
}

export async function estimateFromImage(base64Image: string, size: string): Promise<GroqEstimate> {
  // Use exact prompt from aarttsii groq.ts — the full complexity scoring prompt
  const prompt = `You are a crochet complexity scorer for a handmade studio.
Analyse this image. Return CI score and detected details only.
Do NOT calculate prices. Do NOT return price_min or price_max.

STEP 0 - IS THIS AN ACTUAL CROCHET/YARN PIECE?
Look at the image carefully. Is this a photo of an actual crocheted/knitted/yarn item, OR is it something else being used as a reference (a logo, drawing, illustration, cartoon, screenshot, real animal photo, digital art, painting, 3D render, or any non-yarn object)?
If this is NOT an actual crochet piece, set "is_reference": true and still estimate what it would take to crochet this as a custom piece. Your CI and scoring should reflect the complexity of RECREATING this in crochet.
If this IS an actual crochet piece, set "is_reference": false.

Customer size: ${size}

STEP 1 - IDENTIFY CATEGORY and its baseline CI:
basic_geometric=0.5, simple_flower=0.8, complex_flower=2.0, bouquet=2.5,
simple_food=1.5, complex_food=3.0, basic_animal=2.0, standard_amigurumi=3.0,
complex_character=4.0, portrait_oc=3.5, portrait_human=5.0,
botanical_detailed=3.5, wearable=2.0, scene_diorama=7.0, structure=6.0

STEP 2 - SCORE AXES 0.0 to 1.0:
part_count: 1=0.0, 2-3=0.2, 4-6=0.4, 7-10=0.6, 11-15=0.8, 16+=1.0
colour_complexity: 1=0.0, 2=0.2, 3-4=0.4, 5-6=0.6, 7-9=0.8, 10+=1.0
surface_detail: None=0.0, Simple=0.2, Moderate=0.4, Detailed=0.6, Complex=0.8, Full=1.0
shape_regularity: Round=0.0, Mostly round=0.2, Mixed=0.4, Shaped=0.6, Organic=0.8
scale_detail: Standard+simple=0.1, Standard+moderate=0.35, Mini+moderate=0.6, Mini+high=0.85
wire_armature: None=0.0, Single=0.3, Multiple=0.5, Full=0.8
miniature_elements: None=0.0, Few=0.3, Several=0.5, Many=0.8
texture_variety: Single=0.0, Two=0.3, Three+=0.6

STEP 3 - CALCULATE CI:
weighted = (part_count*0.30)+(colour_complexity*0.12)+(surface_detail*0.15)+(shape_regularity*0.10)+(scale_detail*0.13)+(wire_armature*0.08)+(miniature_elements*0.07)+(texture_variety*0.05)
ci = min((weighted * 6) + category_baseline, 10.0)

STEP 4 - DETECT DETAILS: Max 5 items. Each: label (1-3 words), impact (low/medium/high).

STEP 5 - FACTORS: Exactly 3 items, each under 8 words, plain language.

Return ONLY raw JSON no markdown no backticks:
{ "is_reference": boolean, "category": "string", "ci": number, "colour_count": number, "confidence": "High"|"Medium"|"Low", "factors": ["string","string","string"], "detected_details": [{"label": "string", "impact": "low"|"medium"|"high"}] }`

  const data = await callGroqVision(prompt, base64Image, 400)
  const raw = data.choices[0].message.content.trim()
  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
    else throw new Error('Failed to parse Groq response')
  }
  return {
    category: parsed.category || 'unknown',
    ci: Math.min(Math.round((parsed.ci || 3) * 10) / 10, 10),
    colour_count: parsed.colour_count || 2,
    confidence: parsed.confidence || 'Medium',
    factors: parsed.factors || [],
    detected_details: parsed.detected_details || [],
    is_reference: parsed.is_reference || false,
  }
}
```

- [ ] **Step 3: Create ExpandToggle component**

Create `src/components/shared/ExpandToggle.tsx`:

```tsx
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
```

Create `src/components/shared/shared.module.css` with expand toggle styling — subtle, not flashy. The `+` rotates to `×` when open.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ src/components/shared/
git commit -m "feat: add shared utilities (rate limiter, groq, expand toggle)"
```

---

## Task 3: Hero Section

**Files:**
- Create: `src/components/Hero/Hero.tsx`
- Create: `src/components/Hero/Hero.module.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build Hero component**

Create `src/components/Hero/Hero.tsx`:
- Full viewport height section
- "Ashwini Tiwari" as the name, large, in mono font
- Short positioning line below (placeholder text for now — something honest, not exaggerated)
- Subtle 3D character image peeking from a corner (use placeholder div until real assets are added to `public/characters/`)
- Scroll indicator at bottom hinting at content below
- Navigation dots or small project name links that scroll to each section

- [ ] **Step 2: Style the hero**

Create `src/components/Hero/Hero.module.css`:
- Full viewport, centered name
- Name typography: large, mono, slightly tracked out
- Positioning line: smaller, sans-serif, muted color
- Character image: absolute positioned, partially clipped, low opacity or peeking from edge
- Scroll indicator: subtle animated chevron or line at bottom

- [ ] **Step 3: Wire into page.tsx**

Update `src/app/page.tsx` to import and render `<Hero />` as the first section.

- [ ] **Step 4: Verify in browser**

Expected: Full-screen hero with name, positioning line, scroll indicator.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero/ src/app/page.tsx
git commit -m "feat: add hero section"
```

---

## Task 4: Mooney Section — Voice Demo

**Files:**
- Create: `src/app/api/transcribe/route.ts`
- Create: `src/app/api/parse-expense/route.ts`
- Create: `src/components/Mooney/MooneySection.tsx`
- Create: `src/components/Mooney/VoiceDemo.tsx`
- Create: `src/components/Mooney/ReceiptCard.tsx`
- Create: `src/components/Mooney/Mooney.module.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create transcribe API route**

Create `src/app/api/transcribe/route.ts`:
- POST handler that receives audio blob (FormData with `audio` field)
- Sends to Deepgram Nova-3 STT API (`https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true`)
- Rate limited: 10 requests per minute per IP
- Returns `{ transcript: string }`

```ts
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  if (!rateLimit(`transcribe:${ip}`, 10, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  const formData = await req.formData()
  const audio = formData.get('audio') as Blob
  if (!audio) return Response.json({ error: 'No audio' }, { status: 400 })

  const buffer = Buffer.from(await audio.arrayBuffer())

  const res = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true', {
    method: 'POST',
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      'Content-Type': audio.type || 'audio/webm',
    },
    body: buffer,
  })

  if (!res.ok) return Response.json({ error: 'Transcription failed' }, { status: 502 })

  const data = await res.json()
  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
  return Response.json({ transcript })
}
```

- [ ] **Step 2: Create parse-expense API route**

Create `src/app/api/parse-expense/route.ts`:
- POST handler that receives `{ transcript: string }`
- Calls `parseExpense()` from `@/lib/groq`
- Rate limited: 10 requests per minute per IP
- Returns `{ amount, category, merchant, currency }`

```ts
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { parseExpense } from '@/lib/groq'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  if (!rateLimit(`parse:${ip}`, 10, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { transcript } = await req.json()
  if (!transcript) return Response.json({ error: 'No transcript' }, { status: 400 })

  try {
    const result = await parseExpense(transcript)
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Failed to parse' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Build VoiceDemo component**

Create `src/components/Mooney/VoiceDemo.tsx`:
- Client component using `MediaRecorder` API
- States: `idle` → `recording` → `transcribing` → `parsing` → `done`
- Mic button: large, prominent. Tap to start recording, tap again to stop.
- During recording: visual pulse animation on the mic button
- After recording: shows "Transcribing..." then "Parsing..." then triggers ReceiptCard
- Uses `navigator.mediaDevices.getUserMedia({ audio: true })` to get mic access
- Sends recorded audio to `/api/transcribe`, then transcript to `/api/parse-expense`
- On error or permission denied: show helpful message, not a crash

```tsx
'use client'

import { useState, useRef } from 'react'
import { ReceiptCard } from './ReceiptCard'
import styles from './Mooney.module.css'

type DemoState = 'idle' | 'recording' | 'transcribing' | 'parsing' | 'done' | 'error'

interface Expense {
  amount: number
  category: string
  merchant: string
  currency: string
  transcript: string
}

export function VoiceDemo() {
  const [state, setState] = useState<DemoState>('idle')
  const [expense, setExpense] = useState<Expense | null>(null)
  const [error, setError] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => processAudio()
      mediaRef.current = recorder
      recorder.start()
      setState('recording')
    } catch {
      setError('Mic access needed to try this demo')
      setState('error')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    mediaRef.current?.stream.getTracks().forEach(t => t.stop())
  }

  const processAudio = async () => {
    setState('transcribing')
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const form = new FormData()
    form.append('audio', blob)

    try {
      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: form })
      if (!transcribeRes.ok) throw new Error()
      const { transcript } = await transcribeRes.json()

      setState('parsing')
      const parseRes = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (!parseRes.ok) throw new Error()
      const parsed = await parseRes.json()

      setExpense({ ...parsed, transcript })
      setState('done')
    } catch {
      setError('Something went wrong — try again')
      setState('error')
    }
  }

  const reset = () => {
    setState('idle')
    setExpense(null)
    setError('')
  }

  return (
    <div className={styles.voiceDemo}>
      {state === 'idle' && (
        <button className={styles.micButton} onClick={startRecording}>
          <MicIcon />
          <span>Try logging an expense</span>
        </button>
      )}
      {state === 'recording' && (
        <button className={`${styles.micButton} ${styles.recording}`} onClick={stopRecording}>
          <MicIcon />
          <span>Tap to stop</span>
        </button>
      )}
      {state === 'transcribing' && <p className={styles.status}>Transcribing...</p>}
      {state === 'parsing' && <p className={styles.status}>Parsing expense...</p>}
      {state === 'done' && expense && (
        <>
          <ReceiptCard expense={expense} />
          <button className={styles.tryAgain} onClick={reset}>Try another</button>
        </>
      )}
      {state === 'error' && (
        <>
          <p className={styles.error}>{error}</p>
          <button className={styles.tryAgain} onClick={reset}>Try again</button>
        </>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}
```

- [ ] **Step 4: Build ReceiptCard component**

Create `src/components/Mooney/ReceiptCard.tsx`:
- Receipt-themed card (mono font, dotted borders, paper texture feel)
- Shows: transcript (dimmed, italic), amount (large), category, merchant
- Entry animation: slides up and fades in
- Mini insight line at the bottom (hardcoded witty line based on category, e.g. "Another coffee? We see a pattern.")

```tsx
import styles from './Mooney.module.css'

const INSIGHTS: Record<string, string> = {
  food: 'Another meal logged. Your stomach has a budget now.',
  coffee: 'Caffeine addiction: tracked.',
  transport: 'Getting places. Financially too.',
  shopping: 'Retail therapy, but make it responsible.',
  default: 'Logged. Your future self thanks you.',
}

interface Expense {
  amount: number
  category: string
  merchant: string
  currency: string
  transcript: string
}

export function ReceiptCard({ expense }: { expense: Expense }) {
  const insight = INSIGHTS[expense.category.toLowerCase()] || INSIGHTS.default
  const symbol = expense.currency === 'INR' ? '₹' : expense.currency === 'USD' ? '$' : expense.currency

  return (
    <div className={styles.receiptCard}>
      <p className={styles.transcript}>"{expense.transcript}"</p>
      <div className={styles.receiptDivider} />
      <p className={styles.amount}>{symbol}{expense.amount}</p>
      <p className={styles.merchant}>{expense.merchant}</p>
      <p className={styles.category}>{expense.category}</p>
      <div className={styles.receiptDivider} />
      <p className={styles.insight}>{insight}</p>
    </div>
  )
}
```

- [ ] **Step 5: Build MooneySection wrapper**

Create `src/components/Mooney/MooneySection.tsx`:
- Section wrapper with Mooney branding
- Contains VoiceDemo as the interactive centerpiece
- Placeholder for cow mascot character (div with `public/characters/mooney-cow.png` when available)
- ExpandToggle wrapping PipelineDiagram (built in Task 5)
- Stats strip: "19 beta testers" · "voice-to-data in <2s" · "60+ countries"

- [ ] **Step 6: Style everything**

Create `src/components/Mooney/Mooney.module.css`:
- Receipt card: mono font, dotted top/bottom borders, slightly off-white background like thermal paper, subtle shadow
- Mic button: large circle, accent color, pulse animation when recording (CSS keyframes scale + opacity)
- Section background: subtle texture or color shift to distinguish from hero
- Stats strip: small text, mono, spaced with dots or pipes

- [ ] **Step 7: Wire into page.tsx**

Add `<MooneySection />` to `src/app/page.tsx` below Hero.

- [ ] **Step 8: Test the full flow in browser**

1. Click mic → grant permission → speak "spent 200 on coffee at starbucks" → stop
2. Should see: transcription → parsing → receipt card with ₹200, coffee, Starbucks
3. Click "Try another" → resets

Expected: Full flow works end-to-end with real APIs (needs valid DEEPGRAM_API_KEY and GROQ_API_KEY in .env.local).

- [ ] **Step 9: Commit**

```bash
git add src/components/Mooney/ src/app/api/transcribe/ src/app/api/parse-expense/ src/app/page.tsx
git commit -m "feat: add Mooney voice demo section with real STT + LLM parsing"
```

---

## Task 5: Mooney Pipeline Diagram

**Files:**
- Create: `src/components/Mooney/PipelineDiagram.tsx`
- Modify: `src/components/Mooney/MooneySection.tsx`

- [ ] **Step 1: Build interactive pipeline diagram**

Create `src/components/Mooney/PipelineDiagram.tsx`:
- Client component showing the multi-provider AI fallback chain as connected nodes
- Nodes: `Voice Input` → `Deepgram Nova-3` → `Groq 8b` → `Groq 70b (fallback)` → `Cerebras (fallback)` → `OpenRouter (fallback)` → `Parsed Expense`
- Each node is clickable — clicking reveals a tooltip/popover explaining what it does and why it's there
- Nodes connected by lines/arrows
- CSS-only — no canvas or SVG library needed. Flexbox row of node divs with `::after` pseudo-element connectors
- Active/highlighted state for the primary path (Deepgram → Groq 8b → Parsed), dimmed for fallbacks

Node descriptions (shown on click):
- Deepgram Nova-3: "Speech-to-text. <200ms latency. 2-key rotation, 200 calls/day/device."
- Groq 8b: "Primary LLM. Parses transcript into amount, category, merchant. JSON mode."
- Groq 70b: "Fallback for ambiguous inputs. Activated when 8b returns UNKNOWN."
- Cerebras: "Second fallback. Different provider for resilience."
- OpenRouter: "Last resort. Free tier. Ensures the pipeline never fully breaks."

- [ ] **Step 2: Wire into MooneySection**

Wrap PipelineDiagram in an ExpandToggle inside MooneySection:

```tsx
<ExpandToggle label="How the pipeline works">
  <PipelineDiagram />
</ExpandToggle>
```

- [ ] **Step 3: Verify in browser**

Expected: Expand toggle below the voice demo. Click to reveal pipeline diagram. Click nodes to see descriptions.

- [ ] **Step 4: Commit**

```bash
git add src/components/Mooney/
git commit -m "feat: add interactive pipeline diagram to Mooney section"
```

---

## Task 6: WhoFits Section — Drag-and-Drop Qualification

**Files:**
- Create: `src/data/creators.ts`
- Create: `src/data/qualifications.ts`
- Create: `src/components/WhoFits/WhoFitsSection.tsx`
- Create: `src/components/WhoFits/CreatorCard.tsx`
- Create: `src/components/WhoFits/QualificationDashboard.tsx`
- Create: `src/components/WhoFits/HandDrawnArrow.tsx`
- Create: `src/components/WhoFits/WhoFits.module.css`
- Modify: `src/app/page.tsx`
- Install: `@dnd-kit/core @dnd-kit/utilities`

- [ ] **Step 1: Install dnd-kit**

```bash
source ~/.nvm/nvm.sh
cd "/media/ashwtiw/Lunar_s Memory/Claude/portfolio"
npm install @dnd-kit/core @dnd-kit/utilities
```

- [ ] **Step 2: Create mock creator data**

Create `src/data/creators.ts` with 8 fictional but realistic-looking creator profiles:

```ts
export interface Creator {
  id: string
  handle: string
  name: string
  bio: string
  followers: number
  avatar: string  // placeholder URL or initials-based
  niche: string
}

export const creators: Creator[] = [
  {
    id: 'c1',
    handle: '@maya_codes',
    name: 'Maya Chen',
    bio: 'Building in public. AI/ML eng. Previously @stripe',
    followers: 24300,
    avatar: '',
    niche: 'tech',
  },
  {
    id: 'c2',
    handle: '@designwithraj',
    name: 'Raj Patel',
    bio: 'Product designer. Making interfaces that don\'t suck.',
    followers: 18700,
    avatar: '',
    niche: 'design',
  },
  {
    id: 'c3',
    handle: '@sarahbuilds',
    name: 'Sarah Kim',
    bio: 'Indie hacker. 3 exits. Currently building something new.',
    followers: 45200,
    avatar: '',
    niche: 'startups',
  },
  {
    id: 'c4',
    handle: '@devopsdave',
    name: 'Dave Morrison',
    bio: 'Infra nerd. Kubernetes opinions. Open source maintainer.',
    followers: 12100,
    avatar: '',
    niche: 'devops',
  },
  {
    id: 'c5',
    handle: '@contentqueen_',
    name: 'Priya Sharma',
    bio: 'Creator economy analyst. Writing about what works.',
    followers: 31500,
    avatar: '',
    niche: 'creator-economy',
  },
  {
    id: 'c6',
    handle: '@alexfromml',
    name: 'Alex Torres',
    bio: 'ML research → production. Papers to products.',
    followers: 8900,
    avatar: '',
    niche: 'ai-ml',
  },
  {
    id: 'c7',
    handle: '@uijulia',
    name: 'Julia Weber',
    bio: 'Frontend architect. React core contributor. CSS maximalist.',
    followers: 52000,
    avatar: '',
    niche: 'frontend',
  },
  {
    id: 'c8',
    handle: '@growthnik',
    name: 'Nik Andreev',
    bio: 'Growth eng at Series B startup. Data-driven everything.',
    followers: 15400,
    avatar: '',
    niche: 'growth',
  },
]
```

- [ ] **Step 3: Create mock qualification data**

Create `src/data/qualifications.ts` with pre-computed qualification results mapped by creator ID:

```ts
export interface Qualification {
  overallScore: number        // 0-100
  brandSafety: number         // 0-100
  engagementQuality: number   // 0-100
  nicheRelevance: number      // 0-100
  networkPosition: number     // 0-100
  niche: string
  audienceType: string
  topTopics: string[]
  risk: 'low' | 'medium' | 'high'
}

export const qualifications: Record<string, Qualification> = {
  c1: {
    overallScore: 87,
    brandSafety: 94,
    engagementQuality: 82,
    nicheRelevance: 91,
    networkPosition: 78,
    niche: 'AI/ML Engineering',
    audienceType: 'Technical decision-makers',
    topTopics: ['LLM deployment', 'ML ops', 'Python tooling'],
    risk: 'low',
  },
  c2: {
    overallScore: 74,
    brandSafety: 88,
    engagementQuality: 71,
    nicheRelevance: 69,
    networkPosition: 65,
    niche: 'Product Design',
    audienceType: 'Design & product teams',
    topTopics: ['UI patterns', 'Design systems', 'Figma workflows'],
    risk: 'low',
  },
  c3: {
    overallScore: 92,
    brandSafety: 90,
    engagementQuality: 95,
    nicheRelevance: 88,
    networkPosition: 94,
    niche: 'Startups & Indie Hacking',
    audienceType: 'Founders & builders',
    topTopics: ['Revenue growth', 'Product-market fit', 'Bootstrapping'],
    risk: 'low',
  },
  c4: {
    overallScore: 61,
    brandSafety: 85,
    engagementQuality: 54,
    nicheRelevance: 72,
    networkPosition: 48,
    niche: 'DevOps & Infrastructure',
    audienceType: 'Backend engineers',
    topTopics: ['Kubernetes', 'CI/CD', 'Cloud costs'],
    risk: 'medium',
  },
  c5: {
    overallScore: 83,
    brandSafety: 92,
    engagementQuality: 79,
    nicheRelevance: 95,
    networkPosition: 72,
    niche: 'Creator Economy',
    audienceType: 'Marketing & brand teams',
    topTopics: ['Creator tools', 'Platform economics', 'Sponsorship trends'],
    risk: 'low',
  },
  c6: {
    overallScore: 69,
    brandSafety: 96,
    engagementQuality: 62,
    nicheRelevance: 85,
    networkPosition: 55,
    niche: 'ML Research',
    audienceType: 'Researchers & ML engineers',
    topTopics: ['Transformer architectures', 'Fine-tuning', 'Benchmarks'],
    risk: 'low',
  },
  c7: {
    overallScore: 91,
    brandSafety: 93,
    engagementQuality: 89,
    nicheRelevance: 82,
    networkPosition: 96,
    niche: 'Frontend Engineering',
    audienceType: 'Web developers',
    topTopics: ['React internals', 'CSS techniques', 'Web performance'],
    risk: 'low',
  },
  c8: {
    overallScore: 72,
    brandSafety: 80,
    engagementQuality: 68,
    nicheRelevance: 76,
    networkPosition: 61,
    niche: 'Growth Engineering',
    audienceType: 'Startup operators',
    topTopics: ['A/B testing', 'Funnel optimization', 'Analytics'],
    risk: 'medium',
  },
}
```

- [ ] **Step 4: Build HandDrawnArrow**

Create `src/components/WhoFits/HandDrawnArrow.tsx`:
- SVG component rendering a curvy, hand-drawn style arrow
- Uses a cubic bezier path with slight irregularities to feel organic
- Dashed stroke (`stroke-dasharray`) for the line-line-line look
- Animated: dashes flow along the path (CSS animation on `stroke-dashoffset`)
- Arrow head at the end

```tsx
import styles from './WhoFits.module.css'

export function HandDrawnArrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 200 100" fill="none">
      <path
        d="M 10 50 C 50 20, 80 80, 120 45 S 170 30, 185 50"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeDasharray="8 6"
        strokeLinecap="round"
        className={styles.arrowPath}
      />
      <polygon
        points="185,50 175,44 175,56"
        fill="var(--accent)"
      />
    </svg>
  )
}
```

- [ ] **Step 5: Build CreatorCard**

Create `src/components/WhoFits/CreatorCard.tsx`:
- Draggable card using `@dnd-kit/core` `useDraggable`
- Shows: avatar (initials circle if no image), handle, name, bio (truncated), follower count formatted (e.g. "24.3K")
- Compact card, ~200px wide
- Visual feedback when dragging (slight scale, shadow)

```tsx
'use client'

import { useDraggable } from '@dnd-kit/core'
import type { Creator } from '@/data/creators'
import styles from './WhoFits.module.css'

function formatFollowers(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

export function CreatorCard({ creator }: { creator: Creator }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: creator.id,
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.7 : 1 }
    : undefined

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={styles.creatorCard}>
      <div className={styles.avatar}>{creator.name.split(' ').map(n => n[0]).join('')}</div>
      <div className={styles.creatorInfo}>
        <p className={styles.handle}>{creator.handle}</p>
        <p className={styles.creatorName}>{creator.name}</p>
        <p className={styles.bio}>{creator.bio}</p>
        <p className={styles.followers}>{formatFollowers(creator.followers)} followers</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Build QualificationDashboard**

Create `src/components/WhoFits/QualificationDashboard.tsx`:
- Drop target using `@dnd-kit/core` `useDroppable`
- When empty: shows subtle dashed border + "Drop a creator here" text
- When a creator is dropped: animates in the qualification data
  - Overall score (large number with color: green >80, yellow >60, red <60)
  - Score breakdown bars: brand safety, engagement quality, niche relevance, network position
  - Niche label, audience type, top topics as tags
  - Risk badge (low=green, medium=yellow, high=red)

```tsx
'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Qualification } from '@/data/qualifications'
import styles from './WhoFits.module.css'

export function QualificationDashboard({ qualification }: { qualification: Qualification | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'dashboard' })

  return (
    <div ref={setNodeRef} className={`${styles.dashboard} ${isOver ? styles.dashboardOver : ''}`}>
      {!qualification ? (
        <p className={styles.dropHint}>Drop a creator here</p>
      ) : (
        <div className={styles.qualData}>
          <div className={styles.overallScore} data-level={qualification.overallScore >= 80 ? 'high' : qualification.overallScore >= 60 ? 'mid' : 'low'}>
            {qualification.overallScore}
          </div>
          <p className={styles.niche}>{qualification.niche}</p>
          <p className={styles.audience}>{qualification.audienceType}</p>
          <div className={styles.scores}>
            <ScoreBar label="Brand Safety" value={qualification.brandSafety} />
            <ScoreBar label="Engagement" value={qualification.engagementQuality} />
            <ScoreBar label="Niche Fit" value={qualification.nicheRelevance} />
            <ScoreBar label="Network" value={qualification.networkPosition} />
          </div>
          <div className={styles.topics}>
            {qualification.topTopics.map(t => <span key={t} className={styles.topic}>{t}</span>)}
          </div>
          <span className={styles.riskBadge} data-risk={qualification.risk}>{qualification.risk} risk</span>
        </div>
      )}
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.scoreBar}>
      <span className={styles.scoreLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${value}%` }} />
      </div>
      <span className={styles.scoreValue}>{value}</span>
    </div>
  )
}
```

- [ ] **Step 7: Build WhoFitsSection**

Create `src/components/WhoFits/WhoFitsSection.tsx`:
- Wraps everything in a `DndContext` from `@dnd-kit/core`
- State: `qualifiedCreatorId: string | null`
- On drag end: if dropped on dashboard, set `qualifiedCreatorId` to the dragged creator's ID
- Layout: left side = grid of CreatorCards, center = HandDrawnArrow (hidden once a creator is qualified), right side = QualificationDashboard
- WhoFits character placeholder
- ExpandToggle for architecture diagram (placeholder in this task, built in Task 7)

```tsx
'use client'

import { useState } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { creators } from '@/data/creators'
import { qualifications } from '@/data/qualifications'
import { CreatorCard } from './CreatorCard'
import { QualificationDashboard } from './QualificationDashboard'
import { HandDrawnArrow } from './HandDrawnArrow'
import { ExpandToggle } from '../shared/ExpandToggle'
import styles from './WhoFits.module.css'

export function WhoFitsSection() {
  const [qualifiedId, setQualifiedId] = useState<string | null>(null)

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over?.id === 'dashboard') {
      setQualifiedId(event.active.id as string)
    }
  }

  const qual = qualifiedId ? qualifications[qualifiedId] : null

  return (
    <section className={styles.section} id="whofits">
      <h2 className={styles.title}>WhoFits</h2>
      <p className={styles.subtitle}>Drag a creator into the dashboard to qualify them</p>

      <DndContext onDragEnd={handleDragEnd}>
        <div className={styles.demoLayout}>
          <div className={styles.creatorList}>
            {creators.map(c => <CreatorCard key={c.id} creator={c} />)}
          </div>
          {!qualifiedId && <HandDrawnArrow />}
          <QualificationDashboard qualification={qual} />
        </div>
      </DndContext>

      <ExpandToggle label="How the qualification engine works">
        <p>Architecture diagram placeholder</p>
      </ExpandToggle>
    </section>
  )
}
```

- [ ] **Step 8: Style the WhoFits section**

Create `src/components/WhoFits/WhoFits.module.css`:
- Demo layout: flexbox row, creators on left (2-column grid), arrow in center, dashboard on right
- Creator cards: compact, subtle border, hover lift, cursor grab
- Dashboard empty state: dashed border, muted text
- Dashboard filled state: animated entry (slide in from right or fade up)
- Score bars: thin horizontal bars with accent color fill, animated width on mount
- Overall score: large number, color-coded
- Topics: small rounded tags
- Risk badge: small pill, color-coded
- Arrow: positioned between creator list and dashboard, vertically centered
- Responsive: stack vertically on mobile, arrow rotates 90 degrees

- [ ] **Step 9: Wire into page.tsx and test**

Add `<WhoFitsSection />` to page.tsx below Mooney. Test in browser:
1. See 8 creator cards on left, arrow in middle, empty dashboard on right
2. Drag any creator card → drop on dashboard
3. Dashboard populates with qualification data instantly
4. Drag a different creator → data swaps

- [ ] **Step 10: Commit**

```bash
git add src/components/WhoFits/ src/data/creators.ts src/data/qualifications.ts src/app/page.tsx package.json package-lock.json
git commit -m "feat: add WhoFits drag-and-drop qualification demo"
```

---

## Task 7: WhoFits Architecture Diagram

**Files:**
- Create: `src/components/WhoFits/ArchitectureDiagram.tsx`
- Modify: `src/components/WhoFits/WhoFitsSection.tsx`

- [ ] **Step 1: Build architecture diagram**

Create `src/components/WhoFits/ArchitectureDiagram.tsx`:
- Interactive node diagram showing the WhoFits pipeline
- Nodes in sequence: `CSV Seeds` → `TwitterAPI.io` → `Brand Classification` → `Playwright Replies` → `Network Edges` → `Grok Qualification` → `SBERT Embeddings` → `PageRank` → `Discovery API`
- Same interaction pattern as Mooney pipeline: click a node to see description
- Horizontal scrollable on mobile

Node descriptions:
- CSV Seeds: "Curated seed list of creators to start the discovery network."
- TwitterAPI.io: "Profile ingestion at $0.004/creator. Follower counts, bios, tweet history."
- Brand Classification: "Automated brand vs personal account detection."
- Playwright Replies: "Browser-based reply thread extraction — the only data without an API."
- Network Edges: "Who replies to whom. Builds the social graph."
- Grok Qualification: "AI-powered scoring across brand safety, engagement quality, niche fit."
- SBERT Embeddings: "Semantic similarity vectors for finding creators with similar audiences."
- PageRank: "Network position scoring. Who's actually influential vs just follower-rich."
- Discovery API: "7-signal ranking formula. The final output agencies use."

- [ ] **Step 2: Wire into WhoFitsSection**

Replace the placeholder inside ExpandToggle with `<ArchitectureDiagram />`.

- [ ] **Step 3: Verify and commit**

```bash
git add src/components/WhoFits/
git commit -m "feat: add WhoFits architecture diagram"
```

---

## Task 8: aarttsii Section — Estimator Demo

**Files:**
- Create: `src/app/api/estimate/route.ts`
- Create: `src/data/aarttsii-samples.ts`
- Create: `src/components/Aarttsii/AarttsiiSection.tsx`
- Create: `src/components/Aarttsii/EstimatorDemo.tsx`
- Create: `src/components/Aarttsii/EstimateCard.tsx`
- Create: `src/components/Aarttsii/PipelineDiagram.tsx`
- Create: `src/components/Aarttsii/Aarttsii.module.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create estimate API route**

Create `src/app/api/estimate/route.ts`:

```ts
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { estimateFromImage } from '@/lib/groq'

export async function POST(req: Request) {
  const ip = getClientIP(req)
  if (!rateLimit(`estimate:${ip}`, 5, 60_000)) {
    return Response.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 })
  }

  try {
    const { base64Image, size } = await req.json()
    if (!base64Image || !size) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (base64Image.length > 2 * 1024 * 1024) {
      return Response.json({ error: 'Image too large (max 1.5MB)' }, { status: 413 })
    }
    const result = await estimateFromImage(base64Image, size)
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Failed to analyse image' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create sample data**

Create `src/data/aarttsii-samples.ts` with 4 pre-loaded samples. Each has an image filename (to be placed in `public/aarttsii-samples/`), a label, and hardcoded estimate data:

```ts
import type { GroqEstimate } from '@/lib/groq'

export interface Sample {
  id: string
  label: string
  image: string    // path in /public/aarttsii-samples/
  size: string
  estimate: GroqEstimate & { price_min: number; price_max: number }
}

export const samples: Sample[] = [
  {
    id: 's1',
    label: 'Crochet Bear',
    image: '/aarttsii-samples/bear.jpg',
    size: 'Standard (8-12 inches)',
    estimate: {
      category: 'standard_amigurumi',
      ci: 4.2,
      colour_count: 3,
      confidence: 'High',
      factors: ['10 separately sewn parts', 'Three colour yarn changes', 'Embroidered face details'],
      detected_details: [
        { label: 'Bow tie', impact: 'medium' },
        { label: 'Embroidered eyes', impact: 'low' },
      ],
      is_reference: false,
      price_min: 1200,
      price_max: 1800,
    },
  },
  {
    id: 's2',
    label: 'Sunflower Bouquet',
    image: '/aarttsii-samples/sunflower.jpg',
    size: 'Standard (8-12 inches)',
    estimate: {
      category: 'bouquet',
      ci: 5.8,
      colour_count: 5,
      confidence: 'High',
      factors: ['22 petals crocheted individually', 'Wire stems for posing', 'Five different yarn colours'],
      detected_details: [
        { label: 'Wire armature', impact: 'medium' },
        { label: 'Petal detail', impact: 'low' },
        { label: 'Leaf shaping', impact: 'low' },
      ],
      is_reference: false,
      price_min: 2000,
      price_max: 3200,
    },
  },
  {
    id: 's3',
    label: 'Dragon Character',
    image: '/aarttsii-samples/dragon.jpg',
    size: 'Large (12-18 inches)',
    estimate: {
      category: 'complex_character',
      ci: 7.4,
      colour_count: 6,
      confidence: 'High',
      factors: ['18 parts including wings and tail', 'Complex organic shaping', 'Fine scale texture stitching'],
      detected_details: [
        { label: 'Wings', impact: 'high' },
        { label: 'Horns', impact: 'medium' },
        { label: 'Scale texture', impact: 'medium' },
        { label: 'Claws', impact: 'low' },
      ],
      is_reference: false,
      price_min: 3500,
      price_max: 5500,
    },
  },
  {
    id: 's4',
    label: 'Granny Square Bag',
    image: '/aarttsii-samples/bag.jpg',
    size: 'Standard',
    estimate: {
      category: 'bag_granny',
      ci: 3.8,
      colour_count: 4,
      confidence: 'High',
      factors: ['12 granny squares joined', 'Four colour pattern', 'Chain strap attachment'],
      detected_details: [
        { label: 'Chain strap', impact: 'medium' },
        { label: 'Square motifs', impact: 'low' },
      ],
      is_reference: false,
      price_min: 900,
      price_max: 1500,
    },
  },
]
```

Note: Actual images need to be placed in `public/aarttsii-samples/` — use placeholder colored divs until real images are sourced.

- [ ] **Step 3: Build EstimateCard**

Create `src/components/Aarttsii/EstimateCard.tsx`:
- Shows the estimate breakdown: category, complexity index (CI) as a visual meter/bar, factors as bullet points, detected details with impact badges, price range
- Style: clean, slightly craft-themed (not receipt-themed like Mooney — different identity)
- Entry animation: fade up

```tsx
import styles from './Aarttsii.module.css'

interface EstimateData {
  category: string
  ci: number
  colour_count: number
  confidence: string
  factors: string[]
  detected_details: { label: string; impact: string }[]
  price_min: number
  price_max: number
}

export function EstimateCard({ estimate, label }: { estimate: EstimateData; label: string }) {
  const categoryLabel = estimate.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className={styles.estimateCard}>
      <h3 className={styles.estimateTitle}>{label}</h3>
      <p className={styles.categoryLabel}>{categoryLabel}</p>

      <div className={styles.ciMeter}>
        <span className={styles.ciLabel}>Complexity</span>
        <div className={styles.ciTrack}>
          <div className={styles.ciFill} style={{ width: `${(estimate.ci / 10) * 100}%` }} />
        </div>
        <span className={styles.ciValue}>{estimate.ci}/10</span>
      </div>

      <ul className={styles.factors}>
        {estimate.factors.map((f, i) => <li key={i}>{f}</li>)}
      </ul>

      <div className={styles.details}>
        {estimate.detected_details.map((d, i) => (
          <span key={i} className={styles.detail} data-impact={d.impact}>{d.label}</span>
        ))}
      </div>

      <div className={styles.priceRange}>
        <span>₹{estimate.price_min.toLocaleString()}</span>
        <span className={styles.priceDash}>—</span>
        <span>₹{estimate.price_max.toLocaleString()}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Build EstimatorDemo**

Create `src/components/Aarttsii/EstimatorDemo.tsx`:
- Client component with two modes: sample selection + custom upload
- Top: 4 sample image cards in a row. Click one → show its hardcoded estimate instantly via EstimateCard
- Below: "Or try your own" — file input that accepts images. On upload: converts to base64, calls `/api/estimate` with size "Standard (8-12 inches)", shows the real result via EstimateCard
- States: `idle` | `selected` (showing mocked result) | `uploading` | `analyzing` | `custom-result` | `error`

- [ ] **Step 5: Build AarttsiiSection**

Create `src/components/Aarttsii/AarttsiiSection.tsx`:
- Section wrapper with aarttsii identity
- Subtitle: "DM bargaining replaced by AI-powered instant pricing"
- Contains EstimatorDemo
- ExpandToggle with PipelineDiagram (shows vision pipeline: Image → Groq Scout Vision → Complexity Analysis → Price Calculation → Estimate)
- Character placeholder

- [ ] **Step 6: Build PipelineDiagram**

Create `src/components/Aarttsii/PipelineDiagram.tsx`:
- Simpler than Mooney/WhoFits — fewer nodes
- Nodes: `Reference Image` → `Groq Scout Vision` → `Complexity Scoring (9 axes)` → `Category Detection` → `Price Calculation` → `Instant Estimate`
- Same click-to-reveal pattern

Node descriptions:
- Groq Scout Vision: "Llama 4 Scout analyzes the image — identifies stitch patterns, parts, colours, construction complexity."
- Complexity Scoring: "9 weighted axes: part count, colour complexity, surface detail, shape, scale, wire, miniatures, texture."
- Category Detection: "Classifies into 25+ categories — amigurumi, bouquet, wearable, bag, scene."
- Price Calculation: "CI score × size multiplier × yarn tier = price range."

- [ ] **Step 7: Style everything**

Create `src/components/Aarttsii/Aarttsii.module.css`:
- Sample cards: image thumbnails (or colored placeholders) in a horizontal row, click highlight
- Estimate card: clean card with subtle craft texture, CI meter as horizontal bar
- Upload area: dashed border drop zone
- Price range: prominent, centered

- [ ] **Step 8: Wire into page.tsx and test**

Add `<AarttsiiSection />` to page.tsx. Test:
1. Click a sample image → instant estimate card appears
2. Click a different sample → swaps
3. Upload a real image → "Analyzing..." → real estimate from Groq appears (needs GROQ_API_KEY)

- [ ] **Step 9: Commit**

```bash
git add src/components/Aarttsii/ src/data/aarttsii-samples.ts src/app/api/estimate/ src/app/page.tsx
git commit -m "feat: add aarttsii commission estimator demo"
```

---

## Task 9: Internal Tools Section

**Files:**
- Create: `src/data/tools.ts`
- Create: `src/components/InternalTools/InternalToolsSection.tsx`
- Create: `src/components/InternalTools/ToolCard.tsx`
- Create: `src/components/InternalTools/InternalTools.module.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create tools data**

Create `src/data/tools.ts`:

```ts
export interface Tool {
  id: string
  name: string
  project: string
  description: string
  pipeline: string[]
  status: 'active' | 'building' | 'hidden'
}

export const tools: Tool[] = [
  {
    id: 'tweetbrain',
    name: 'TweetBrain',
    project: 'Personal',
    description: 'Signal-based personality engine that learns my voice from conversations and generates tweets that sound like me, not a bot.',
    pipeline: ['Signal extraction from chats', 'Topic weighting with time decay', 'Layered generation engine', 'Anti-slop deterministic filter', 'Tweet output'],
    status: 'active',
  },
  {
    id: 'aarttsii-scraper',
    name: 'Crochet Outreach Scraper',
    project: 'aarttsii',
    description: 'Reddit and Twitter scraper that finds crochet communities and potential customers for outreach.',
    pipeline: ['Subreddit + hashtag targeting', 'Post/comment extraction', 'Interest signal scoring', 'Outreach queue'],
    status: 'active',
  },
  {
    id: 'bluecollar-portfolio',
    name: 'Blue Collar Portfolio Dashboards',
    project: 'WhoFits Agency',
    description: 'Portfolio sites for blue collar contractors to showcase their work to potential clients.',
    pipeline: ['Client intake form', 'Auto-generated portfolio', 'SEO optimization', 'Lead capture'],
    status: 'hidden',
  },
]
```

- [ ] **Step 2: Build ToolCard**

Create `src/components/InternalTools/ToolCard.tsx`:
- Shows tool name, which project it serves, description, and the pipeline as a horizontal flow of small nodes
- Pipeline nodes connected by arrows (CSS `::after`)
- Compact card format

```tsx
import styles from './InternalTools.module.css'

import type { Tool } from '@/data/tools'

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div className={styles.toolCard}>
      <div className={styles.toolHeader}>
        <h3 className={styles.toolName}>{tool.name}</h3>
        <span className={styles.toolProject}>{tool.project}</span>
      </div>
      <p className={styles.toolDescription}>{tool.description}</p>
      <div className={styles.pipeline}>
        {tool.pipeline.map((step, i) => (
          <div key={i} className={styles.pipelineStep}>
            <span>{step}</span>
            {i < tool.pipeline.length - 1 && <span className={styles.pipelineArrow}>→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build InternalToolsSection**

Create `src/components/InternalTools/InternalToolsSection.tsx`:
- Filters tools to only show `status: 'active'`
- Different aesthetic from the project sections — slightly more raw/terminal feel
- Header: something like "Internal Tools" with subtitle "I don't just build products, I build the automation that feeds them"
- Renders ToolCards in a grid

```tsx
import { tools } from '@/data/tools'
import { ToolCard } from './ToolCard'
import styles from './InternalTools.module.css'

export function InternalToolsSection() {
  const visible = tools.filter(t => t.status === 'active')

  return (
    <section className={styles.section} id="tools">
      <h2 className={styles.title}>Internal Tools</h2>
      <p className={styles.subtitle}>I build the automation that feeds my products</p>
      <div className={styles.grid}>
        {visible.map(t => <ToolCard key={t.id} tool={t} />)}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Style with terminal aesthetic**

Create `src/components/InternalTools/InternalTools.module.css`:
- Slightly different background tone — darker, more raw
- Tool cards: monospace font for pipeline steps, subtle green/accent tint on arrows
- Pipeline: horizontal flow, each step in a small box connected by arrows
- Grid: 2 columns on desktop, 1 on mobile

- [ ] **Step 5: Wire into page.tsx and test**

Add `<InternalToolsSection />` to page.tsx. Verify only active tools show and hidden ones don't render.

- [ ] **Step 6: Commit**

```bash
git add src/components/InternalTools/ src/data/tools.ts src/app/page.tsx
git commit -m "feat: add internal tools section"
```

---

## Task 10: Interactive Timeline

**Files:**
- Create: `src/data/timeline.ts`
- Create: `src/components/Timeline/TimelineSection.tsx`
- Create: `src/components/Timeline/TimelineNode.tsx`
- Create: `src/components/Timeline/Timeline.module.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create timeline data**

Create `src/data/timeline.ts`:

```ts
export interface TimelineEra {
  id: string
  years: string
  title: string
  role: string
  description: string
  highlights: string[]
  image: string  // path in /public/timeline/
}

export const timeline: TimelineEra[] = [
  {
    id: 'sanshu',
    years: '2020 – 2023',
    title: 'Sanshu Studios',
    role: 'Lead 3D Artist',
    description: 'Part of crypto\'s first decentralized design studio. Created animated NFT trading cards in Blender for the Yokai Collection.',
    highlights: [
      '2,000 NFTs from 8 animated artworks',
      'Phase 1 sold out in 3 days',
      'Global remote team',
    ],
    image: '/timeline/sanshu.jpg',
  },
  {
    id: 'media3ms',
    years: '2023 – 2024',
    title: 'media3ms',
    role: '3D Marketing Agency',
    description: 'Ran a 3-person agency making personalized 3D mascot animations for brands.',
    highlights: [
      'Personalized 3D mascots in Blender',
      'Client-facing creative work',
      '3-person team',
    ],
    image: '/timeline/media3ms.jpg',
  },
  {
    id: 'builder',
    years: '2025 – Present',
    title: 'Product Engineering',
    role: 'AI + Full-Stack',
    description: 'Building AI-powered products end-to-end. Voice interfaces, vision pipelines, SaaS platforms, internal automation.',
    highlights: [
      'Mooney — voice expense tracker with 19 beta testers',
      'WhoFits — influencer qualification SaaS',
      'aarttsii — AI-powered commission pricing',
    ],
    image: '/timeline/builder.jpg',
  },
]
```

- [ ] **Step 2: Build TimelineNode**

Create `src/components/Timeline/TimelineNode.tsx`:
- A single era card in the timeline
- Shows: years, title, role, description
- On click/hover: expands to show highlights list and image
- Visual: small dot/circle on a horizontal line, card content below or above (alternating)

```tsx
'use client'

import { useState } from 'react'
import styles from './Timeline.module.css'

import type { TimelineEra } from '@/data/timeline'

export function TimelineNode({ era }: { era: TimelineEra }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.node} onClick={() => setExpanded(!expanded)}>
      <div className={styles.dot} />
      <div className={styles.years}>{era.years}</div>
      <div className={styles.card}>
        <h3 className={styles.eraTitle}>{era.title}</h3>
        <p className={styles.role}>{era.role}</p>
        {expanded && (
          <div className={styles.expanded}>
            <p className={styles.eraDescription}>{era.description}</p>
            <ul className={styles.highlights}>
              {era.highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build TimelineSection**

Create `src/components/Timeline/TimelineSection.tsx`:
- Horizontal scrollable strip on desktop
- A continuous horizontal line connecting all nodes
- Each TimelineNode sits along the line
- Section title above

```tsx
import { timeline } from '@/data/timeline'
import { TimelineNode } from './TimelineNode'
import styles from './Timeline.module.css'

export function TimelineSection() {
  return (
    <section className={styles.section} id="timeline">
      <h2 className={styles.title}>Journey</h2>
      <div className={styles.track}>
        <div className={styles.line} />
        {timeline.map(era => <TimelineNode key={era.id} era={era} />)}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Style the timeline**

Create `src/components/Timeline/Timeline.module.css`:
- Track: horizontal flex with `overflow-x: auto`, smooth scroll, hide scrollbar
- Line: thin horizontal line behind nodes (absolute positioned)
- Nodes: spaced evenly along the line
- Dot: small circle on the line, accent color, pulses on hover
- Card: below the dot, compact by default, expands on click
- Years: small label above the dot
- Mobile: keep horizontal scroll, touch-friendly

- [ ] **Step 5: Wire into page.tsx and test**

Add `<TimelineSection />` to page.tsx. Verify:
1. Horizontal scrollable strip with 3 nodes
2. Click a node → expands to show description and highlights
3. Click again → collapses

- [ ] **Step 6: Commit**

```bash
git add src/components/Timeline/ src/data/timeline.ts src/app/page.tsx
git commit -m "feat: add interactive timeline section"
```

---

## Task 11: Footer

**Files:**
- Create: `src/components/Footer/Footer.tsx`
- Create: `src/components/Footer/Footer.module.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build Footer**

Create `src/components/Footer/Footer.tsx`:

```tsx
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
    </footer>
  )
}
```

- [ ] **Step 2: Style footer**

Create `src/components/Footer/Footer.module.css`:
- Minimal: links centered, mono font, small text, separated by dots or pipes
- Subtle top border
- Padding bottom for breathing room

- [ ] **Step 3: Wire into page.tsx**

Add `<Footer />` as the last element in page.tsx.

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer/ src/app/page.tsx
git commit -m "feat: add footer with social links"
```

---

## Task 12: Final Page Assembly & Polish

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Assemble final page**

Update `src/app/page.tsx` to render all sections in order:

```tsx
import { Hero } from '@/components/Hero/Hero'
import { MooneySection } from '@/components/Mooney/MooneySection'
import { WhoFitsSection } from '@/components/WhoFits/WhoFitsSection'
import { AarttsiiSection } from '@/components/Aarttsii/AarttsiiSection'
import { InternalToolsSection } from '@/components/InternalTools/InternalToolsSection'
import { TimelineSection } from '@/components/Timeline/TimelineSection'
import { Footer } from '@/components/Footer/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <MooneySection />
      <WhoFitsSection />
      <AarttsiiSection />
      <InternalToolsSection />
      <TimelineSection />
      <Footer />
    </main>
  )
}
```

- [ ] **Step 2: Add smooth scroll and section spacing**

Update `src/app/globals.css`:
- `html { scroll-behavior: smooth; }`
- Each section: `min-height: 100vh` or auto height with generous padding
- Section transitions: subtle background color shifts between sections
- Consistent spacing between sections

- [ ] **Step 3: Add character image placeholders**

Create placeholder directories:
```bash
mkdir -p public/characters public/timeline public/aarttsii-samples
```

Add placeholder `.gitkeep` files so the directories are tracked. Real images will be added later.

- [ ] **Step 4: Full browser test**

Walk through the entire page:
1. Hero loads → scroll down
2. Mooney: mic button works, voice demo produces receipt card, expand shows pipeline
3. WhoFits: drag creator → dashboard populates, expand shows architecture
4. aarttsii: click sample → instant estimate, upload image → real estimate, expand shows pipeline
5. Internal Tools: TweetBrain and scraper cards visible with pipelines
6. Timeline: 3 nodes, click to expand
7. Footer: all links work
8. Mobile: responsive, nothing breaks

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: assemble complete portfolio with all sections"
```

---

## Task 13: Deploy to Vercel

- [ ] **Step 1: Link to Vercel**

```bash
source ~/.nvm/nvm.sh
cd "/media/ashwtiw/Lunar_s Memory/Claude/portfolio"
npx vercel link
```

Follow prompts to create a new Vercel project.

- [ ] **Step 2: Set environment variables**

```bash
npx vercel env add DEEPGRAM_API_KEY
npx vercel env add GROQ_API_KEY
npx vercel env add GROQ_API_KEY_FALLBACK
```

- [ ] **Step 3: Deploy preview**

```bash
npx vercel
```

- [ ] **Step 4: Test on preview URL**

Verify all demos work on the deployed version (especially API routes which need env vars).

- [ ] **Step 5: Deploy production**

```bash
npx vercel --prod
```

- [ ] **Step 6: Commit any Vercel config changes**

```bash
git add -A
git commit -m "chore: add Vercel config"
```
