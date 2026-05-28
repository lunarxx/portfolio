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
