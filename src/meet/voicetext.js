// how a line is cut for his voice, shared by the page (show.js) and the cache warm-up (scripts/voice-warm.mjs): the
// voice is cached per piece, so both must cut a line the same way
// a line in pieces: sentences, and a long sentence split at its commas, so the first piece is short (its voice is
// ready in about a second: Flux makes speech at ~1.6x real time) and every later one is made while the one before
// plays. short bits ride with the next, never a lone "Yeah."
export function pieces(text) {
  const out = []
  for (const s of text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [text]) {
    let t = s.trim(); if (!t) continue
    const clauses = t.length > 80 ? t.split(/(?<=,)\s+/) : [t]
    for (const c of clauses) {
      const limit = out.length ? 28 : 18
      if (out.length && (out[out.length - 1].length < limit || c.length < 14)) out[out.length - 1] += ' ' + c; else out.push(c)
    }
  }
  return out.length ? out : [text]
}
