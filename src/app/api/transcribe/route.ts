// what a visitor said, as text (Deepgram Nova-3, pre-recorded: paid by the second of audio sent). used by the Mooney
// demo (a recorded webm) and the interview (one 16 kHz wav clip per thing you say, cut by the page's own voice
// detection, so silence is never sent). a visitor's rate and the day's total seconds are capped
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { deepgram, warm } from '@/lib/deepgram'

const DAILY_SECONDS = Number(process.env.LISTEN_DAILY_SECONDS || 3600)   // an hour of speech a day: ~$0.26 at $0.0043 a minute
let day = '', heard = 0
// his names, so they're heard as names: without these, "it's Mooney not Octyn" came back "Muni, not Octane" (0 of 8 names
// right in the 31 Oct round trip; 8 of 8 with them, Indian and American voices)
const KEYTERMS = ['Mooney', 'Octyn', 'aarttsii', 'Ashwini', 'Inkling', 'Cookie'].map((k) => `keyterm=${encodeURIComponent(k)}`).join('&')

export async function POST(req: Request) {
  const ip = getClientIP(req)
  if (!rateLimit(`transcribe:${ip}`, 12, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  const formData = await req.formData()
  const audio = formData.get('audio') as Blob
  if (!audio) return Response.json({ error: 'No audio' }, { status: 400 })
  if (audio.size > 2_000_000) return Response.json({ error: 'Too long' }, { status: 413 })

  // how long it is: a 16 kHz mono wav is 32,000 bytes a second; anything else, a generous guess from its size
  const secs = audio.type === 'audio/wav' ? Math.max(0, audio.size - 44) / 32000 : audio.size / 4000
  const today = new Date().toISOString().slice(0, 10); if (today !== day) { day = today; heard = 0 }
  if (heard + secs > DAILY_SECONDS) return Response.json({ error: 'Listening is resting for today' }, { status: 429 })

  const buffer = Buffer.from(await audio.arrayBuffer())

  const res = await deepgram(`/v1/listen?model=nova-3&smart_format=true&${KEYTERMS}`, { type: audio.type || 'audio/webm', body: buffer }).catch(() => null)
  if (!res || res.status !== 200) return Response.json({ error: 'Transcription failed' }, { status: 502 })
  heard += secs

  const data = JSON.parse(res.body.toString())
  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
  return Response.json({ transcript })
}

// the page turned its mic on: open the connection now, so the first thing they say doesn't wait for a handshake
export async function GET(req: Request) {
  if (!rateLimit(`transcribe-warm:${getClientIP(req)}`, 6, 60_000)) return new Response(null, { status: 204 })
  await warm(); return new Response(null, { status: 204 })
}
