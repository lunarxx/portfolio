// his voice: a line of his, spoken by Deepgram's Flux (Cole, 1.05x; his pick, 31 Oct), as mp3. the page plays it through
// the tv he has for a head, so it comes out of the screen like the stream's. every line is cached by its words, so a
// written answer or a repeated one is spoken once and served from disk after; a visitor's rate and the day's total are
// capped, so the $200 credit can't be run down. when anything fails the page falls back to his babble
import { createHash } from 'crypto'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { deepgram } from '@/lib/deepgram'

const MODEL = 'flux-cole-en', SPEED = '1.05'
const KEY = process.env.DEEPGRAM_API_KEY
const CACHE = process.env.VOICE_CACHE || path.join(tmpdir(), 'octyn-voice')
const DAILY = Number(process.env.VOICE_DAILY_CHARS || 40000)   // ~ $1.80 a day at Flux's $0.045 per 1,000 characters
let day = '', spent = 0

// what reaches the voice: plain spoken words, nothing it would read out wrong. names it can't guess are respelled the
// way they're said (the captions keep the real spelling): aarttsii came out as "aart-sigh"
const SAY_AS: [RegExp, string][] = [[/\baarttsii\b/gi, 'artsy'], [/\boctyn\b/gi, 'awktin'], [/\bOCTYN\b/g, 'awktin']]   // "Ashwini" stays as written: his pick from the samples (1 Nov) over every respelling
const speakable = (t: string) => SAY_AS.reduce((s, [re, to]) => s.replace(re, to), t)
  .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/[*_`#>]/g, '').replace(/—|–/g, ', ').replace(/\s+/g, ' ').trim()

export async function POST(req: Request) {
  const { text } = await req.json().catch(() => ({}))
  const line = typeof text === 'string' ? speakable(text) : ''
  if (!line || line.length > 400) return new Response('no line', { status: 400 })
  if (!KEY) return new Response('no voice', { status: 503 })
  const id = createHash('sha1').update(`${MODEL}|${SPEED}|${line}`).digest('hex').slice(0, 20), file = path.join(CACHE, `${id}.mp3`)
  const send = (mp3: Buffer, from: string) => new Response(new Uint8Array(mp3), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Voice': from } })
  if (existsSync(file)) return send(readFileSync(file), 'cache')
  if (!rateLimit(`voice:${getClientIP(req)}`, 40, 60_000)) return new Response('slow down', { status: 429 })
  const today = new Date().toISOString().slice(0, 10); if (today !== day) { day = today; spent = 0 }
  if (spent + line.length > DAILY) return new Response('voice resting for today', { status: 429 })
  const res = await deepgram(`/v2/speak?model=${MODEL}&speed=${SPEED}&encoding=mp3`, { type: 'application/json', body: JSON.stringify({ text: line }), timeoutMs: 8000 }).catch(() => null)
  if (!res || res.status !== 200) return new Response('voice unavailable', { status: 502 })
  const mp3 = res.body; spent += line.length
  try { mkdirSync(CACHE, { recursive: true }); writeFileSync(file, mp3) } catch { /* served anyway, just not cached */ }
  return send(mp3, 'live')
}
