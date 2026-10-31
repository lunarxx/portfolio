// words, sentences, sizes and fingerprints

const STOP = new Set(('a an and are as at be but by can could did do does for from had has have he her him his how i if in into is it its ' +
  'me my no not of on or our she so than that the their them then there these they this to too up us was we were what when where which who ' +
  'why will with would you your about also any just more most some such only own same very s t don should now').split(' '))

/** a light stem: plurals and the common endings, so "deliveries" finds "delivery" and "invoiced" finds "invoice" */
export function stem(w: string): string {
  if (w.length <= 3) return w
  for (const [suf, rep] of [['ies', 'y'], ['sses', 'ss'], ['ing', ''], ['ed', ''], ['es', 'e'], ['s', ''], ['ly', '']] as const) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, -suf.length) + rep
  }
  return w
}
/** the words that matter, lowercased and stemmed; numbers kept (a price, a date, a size matters) */
export function terms(t: string): string[] {
  return t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9₹$€£%.\- ]+/g, ' ')
    .split(/\s+/).map((w) => w.replace(/^[.\-]+|[.\-]+$/g, '')).filter((w) => w && !STOP.has(w)).map(stem)
}
/** roughly how many tokens (for budgets): ~4 characters a token in English */
export const tokens = (t: string) => Math.ceil(t.length / 4)
/** sentences, kept whole (abbreviations and decimals don't split) */
export function sentences(t: string): string[] {
  return t.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).filter(Boolean)
}
/** a stable short fingerprint of a text */
export function hash(t: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < t.length; i++) { const c = t.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677) }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}
export const cosine = (a: number[], b: number[]) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s }
export const normalize = (v: number[]) => { const n = Math.hypot(...v) || 1; return v.map((x) => x / n) }
