// calling an API without falling over: a timeout on every call, and a retry with backoff (jittered, honouring the
// server's own wait) when it's rate limited or briefly down. anything else fails at once, for the caller's fallback
export class HttpError extends Error {
  status: number
  constructor(status: number, body: string) { super(`${status}: ${body.slice(0, 300)}`); this.status = status }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const RETRY = new Set([408, 429, 500, 502, 503, 504])

/** how long the server asked us to wait, in ms: a Retry-After header, or Google's "retry in 28.6s" / retryDelay */
function askedWait(res: Response, text: string): number {
  const h = Number(res.headers.get('retry-after')); if (h > 0) return h * 1000
  const m = text.match(/retry in ([\d.]+)s/i) || text.match(/"retryDelay":\s*"([\d.]+)s"/)
  return m ? Math.ceil(Number(m[1]) * 1000) + 250 : 0
}

/** `maxWaitMs`: the longest it will sit out a rate limit (indexing can wait a minute; a live search can't, it fails
 *  at once so the caller's fallback runs) */
export async function post<T = any>(url: string, body: unknown, o: { headers?: Record<string, string>; timeoutMs?: number; tries?: number; maxWaitMs?: number } = {}): Promise<T> {
  const tries = o.tries ?? 3
  for (let i = 0; ; i++) {
    let res: Response
    try {
      res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...o.headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(o.timeoutMs ?? 15000) })
    } catch (e) {
      if (i + 1 >= tries) throw e
      await sleep(300 * 2 ** i + Math.random() * 200); continue   // a timeout or a dropped connection
    }
    if (res.ok) return res.json() as Promise<T>
    const text = await res.text().catch(() => '')
    if (!RETRY.has(res.status) || i + 1 >= tries) throw new HttpError(res.status, text)
    const asked = askedWait(res, text), wait = asked || 400 * 2 ** i + Math.random() * 300
    if (wait > (o.maxWaitMs ?? 8000)) throw new HttpError(res.status, text)
    await sleep(wait)
  }
}
