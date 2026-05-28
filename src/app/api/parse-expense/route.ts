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
