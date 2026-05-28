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
