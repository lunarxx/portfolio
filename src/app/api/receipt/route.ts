// mooney's camera, in the call: a photo of a receipt comes in, the shop and the total go back. nothing is kept
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { readReceipt } from '@/lib/groq'

export async function POST(req: Request) {
  if (!rateLimit(`receipt:${getClientIP(req)}`, 6, 60_000)) return Response.json({ error: 'slow down' }, { status: 429 })
  const { image } = await req.json().catch(() => ({} as { image?: unknown }))
  if (typeof image !== 'string' || !image || image.length > 3_000_000) return Response.json({ error: 'no image' }, { status: 400 })
  try {
    return Response.json(await readReceipt(image))
  } catch (e) {
    console.error('[receipt]', e)
    return Response.json({ error: 'could not read it' }, { status: 502 })
  }
}
