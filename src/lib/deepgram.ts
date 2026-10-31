// talking to Deepgram over one connection that stays open. node's fetch drops an idle connection after ~4 s, and
// people pause longer than that between things they say, so every clip paid for a new TLS handshake: ~2 s on the
// first request against ~0.5 s on a warm one (measured 31 Oct). this agent keeps the socket for a minute
import https from 'https'

const agent = new https.Agent({ keepAlive: true, keepAliveMsecs: 15_000, maxSockets: 8, timeout: 60_000 })
const KEY = process.env.DEEPGRAM_API_KEY

type Reply = { status: number; body: Buffer; headers: Record<string, string | string[] | undefined> }
type Opts = { method?: string; type?: string; body?: Buffer | string; timeoutMs?: number }

// a kept connection can be closed by Deepgram while it sat idle; a request that dies on a reused socket is sent once
// more on a fresh one (measured: the second clip of a pause failed in 77 ms without this)
export async function deepgram(path: string, o: Opts = {}): Promise<Reply> {
  try { return await once(path, o) } catch (e: any) { if (e?.reused) return once(path, o); throw e }
}

function once(path: string, o: Opts): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const req = https.request(`https://api.deepgram.com${path}`, {
      method: o.method || 'POST', agent,
      headers: { Authorization: `Token ${KEY}`, ...(o.type ? { 'Content-Type': o.type } : {}), ...(o.body ? { 'Content-Length': Buffer.byteLength(o.body) } : {}) },
    }, (res) => {
      const parts: Buffer[] = []
      res.on('data', (c) => parts.push(c)); res.on('end', () => resolve({ status: res.statusCode || 0, body: Buffer.concat(parts), headers: res.headers }))
    })
    req.setTimeout(o.timeoutMs ?? 10_000, () => req.destroy(new Error('deepgram timed out')))
    req.on('error', (e: any) => { e.reused = req.reusedSocket; reject(e) })
    if (o.body) req.write(o.body)
    req.end()
  })
}

/** open the connection ahead of the first clip (a free, tiny call) */
export const warm = () => deepgram('/v1/projects', { method: 'GET', timeoutMs: 5000 }).then(() => true, () => false)
