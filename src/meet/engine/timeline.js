/* a playing line's gestures as windows in page time (seconds). each mark starts on its word and holds to the next mark
   or the line's end; gestureAt ramps it in a little before the word (people move just before they speak) and out a
   little after. words: [[word, t0, t1]] from the line's start. id seeds each window's own take on the pose */
const ss = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
export function gestureWindows({ start, words, dur, marks }) {
  const ms = (marks || []).slice().sort((a, b) => a[0] - b[0]);
  const at = i => start + (words[i] ? words[i][1] : 0);
  return ms.map(([i, name], k) => ({ name, t0: at(i), t1: k + 1 < ms.length ? at(ms[k + 1][0]) : start + dur, id: at(i) }));
}
export function gestureAt(windows, t) {
  let best = null;
  for (const p of windows) {
    const w = Math.min(ss((t - (p.t0 - 0.2)) / 0.12), ss(((p.t1 + 0.3) - t) / 0.2));
    if (w > 0 && (!best || w > best.w)) best = { name: p.name, u: Math.min(1, Math.max(0, (t - p.t0) / Math.max(1e-3, p.t1 - p.t0))), w, id: p.id };
  }
  return best;
}

/* what the captions show for each spoken word: the line's own words, with its punctuation (the voice's word times come
   without it, and a spoken list read as a run of words), when they line up one to one; else the voice's words */
export function captionWords(text, words) {
  const toks = String(text || '').trim().split(/\s+/).filter(Boolean);
  return toks.length === words.length ? toks : words.map(w => w[0]);
}
