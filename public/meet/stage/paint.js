/* the order things are made by hand on stream (live build spec, "the display"), pure so it's tested:
   pixel art the way an artist paints it (the outline first, the big fills, the small highlights last, the brush
   moving to a near pixel), a level ground first then platforms then the few things on them, the roadmap's new lines
   and ticks. tileLook: what a level legend's name looks like in the level editor */
const lum = hex => { const n = parseInt(String(hex).replace('#', ''), 16); if (!Number.isFinite(n)) return .5; return (.2126 * (n >> 16 & 255) + .7152 * (n >> 8 & 255) + .0722 * (n & 255)) / 255; };
/* how far the brush moves: in steps (a diagonal counts as one), then straight before diagonal */
const far = (a, b) => { const dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]); return Math.max(dx, dy) * 4 + dx + dy; };
/* a walk through points: start top-left, always the nearest next (ties: higher up, then left) */
function walk(pts) {
  if (!pts.length) return [];
  const left = pts.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]), out = [left.shift()];
  while (left.length) {
    const at = out[out.length - 1];
    let best = 0;
    for (let i = 1; i < left.length; i++) {
      const d = far(at, left[i]), bd = far(at, left[best]);
      if (d < bd || (d === bd && (left[i][1] < left[best][1] || (left[i][1] === left[best][1] && left[i][0] < left[best][0])))) best = i;
    }
    out.push(left.splice(best, 1)[0]);
  }
  return out;
}
/* colour groups: the darkest (the outline) first, then by how much of the picture each covers, lighter last on a tie */
function groups(pixels, palette) {
  const by = new Map();
  for (const p of pixels) { if (!by.has(p[2])) by.set(p[2], []); by.get(p[2]).push(p); }
  const keys = [...by.keys()], L = k => k === '.' ? -1 : lum(palette[k]);
  const dark = keys.filter(k => k !== '.').sort((a, b) => L(a) - L(b))[0];
  keys.sort((a, b) => (a === '.' ? -2 : a === dark ? -1 : 0) - (b === '.' ? -2 : b === dark ? -1 : 0) || by.get(b).length - by.get(a).length || L(a) - L(b));
  return keys.flatMap(k => walk(by.get(k)));
}
export function pixelOrder(rows, palette) {
  const px = [];
  rows.forEach((row, y) => [...String(row)].forEach((k, x) => { if (palette[k]) px.push([x, y, k]); }));
  return groups(px, palette);
}
/* the next animation frame: only what changed, '.' where a pixel is erased */
export function frameOrder(prev, next, palette) {
  const px = [], h = Math.max(prev.length, next.length);
  for (let y = 0; y < h; y++) {
    const a = String(prev[y] || ''), b = String(next[y] || ''), w = Math.max(a.length, b.length);
    for (let x = 0; x < w; x++) {
      const was = palette[a[x]] ? a[x] : '.', now = palette[b[x]] ? b[x] : '.';
      if (was !== now) px.push([x, y, now]);
    }
  }
  return groups(px, palette);
}
/* a level: the most common tile first (the ground), fewer after; each laid from the bottom, left to right */
export function tileOrder(rows) {
  const by = new Map(), first = new Map();
  rows.forEach((row, y) => [...String(row)].forEach((c, x) => {
    if (c === '.' || c === ' ') return;
    if (!by.has(c)) { by.set(c, []); first.set(c, y * 1e4 + x); }
    by.get(c).push([x, y, c]);
  }));
  return [...by.keys()].sort((a, b) => by.get(b).length - by.get(a).length || first.get(a) - first.get(b))
    .flatMap(c => by.get(c).sort((p, q) => q[1] - p[1] || p[0] - q[0]));
}
const LOOKS = [
  ['enemy', /enemy|biscuit|cat\b|alien|monster|slime|bug|robot|foe/, '#C0664A'],
  ['player', /player|spawn|start|octyn|hero/, '#F1D9A8'],
  ['goal', /flag|goal|exit|door|finish|portal/, '#8FA38A'],
  ['hazard', /spike|lava|hazard|pit|acid|thorn/, '#9A9D9F'],
  ['coin', /coin|gem|star|pickup|collect|battery|crystal/, '#E3A94F'],
  ['platform', /platform|ledge|floating|bridge/, '#B08A5E'],
  ['solid', /ground|rock|wall|floor|solid|dirt|stone|block|moon|crater/, '#8E7456'],
];
export function tileLook(name) {
  const n = String(name || '').toLowerCase();
  for (const [kind, re, color] of LOOKS) if (re.test(n)) return { kind, color };
  return { kind: 'other', color: '#6F86B0' };
}
function roadmapOf(text) {
  const lines = String(text || '').split('\n');
  const title = (lines.find(l => /^# /.test(l)) || '').slice(2).trim();
  const about = (lines.find(l => l.trim() && !/^#/.test(l) && !/^- \[/.test(l)) || '').trim();
  const steps = lines.map(l => /^- \[( |x|X)\] (.+)$/.exec(l)).filter(Boolean).map(m => ({ done: m[1] !== ' ', text: m[2].trim() }));
  return { title, about, steps };
}
/* what the board has to do to go from one roadmap to the next */
export function boardChanges(before, after) {
  const a = roadmapOf(before), b = roadmapOf(after), out = [];
  if (b.title && b.title !== a.title) out.push({ kind: 'title', text: b.title });
  if (b.about && b.about !== a.about) out.push({ kind: 'about', text: b.about });
  b.steps.forEach((s, i) => {
    const was = a.steps[i];
    if (!was || was.text !== s.text) out.push({ kind: 'step', index: i, text: s.text, done: s.done });
    else if (s.done && !was.done) out.push({ kind: 'tick', index: i });
  });
  return out;
}
export { roadmapOf };
