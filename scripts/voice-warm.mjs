// say every fixed line once, so his written answers play from the voice cache instead of waiting ~1-2 s to be made.
// run against a live site after a deploy (or when lines change): node scripts/voice-warm.mjs [http://localhost:3311]
// lines with a name in them are left out (the name changes); everything else he says word for word is in
import { readFileSync } from 'fs'
import { pieces } from '../src/meet/voicetext.js'

const site = process.argv.slice(2).find((a) => a.startsWith('http')) || 'http://localhost:3311'
const files = ['brain.js', 'room.js', 'behaviour.js', 'you.js', 'gestures.js', 'ui/Meet.tsx', 'ui/Lobby.tsx', 'ui/Share.tsx'].map((f) => readFileSync(`src/meet/${f}`, 'utf8'))
const lines = new Set()
// say: '...' in the answer table, say('...') and talk('...') calls, and pick([...]) lists inside them
const lit = /(['"])((?:(?!\1)[^\\\n]|\\.){6,220}?)\1/g
for (const src of files) {
  for (const m of src.matchAll(/\b(?:say|talk)\s*[:(]\s*(?:tone\(\)\s*\+\s*)?(['"])((?:(?!\1)[^\\\n]|\\.)+)\1/g)) lines.add(m[2])
  for (const m of src.matchAll(/\b(?:say|talk)\s*\(\s*pick\(\[([^\]]+)\]/g)) for (const l of m[1].matchAll(lit)) lines.add(l[2])
}
const say = [...lines].map((l) => l.replace(/\\'/g, "'")).filter((l) => !/\{|\$\{/.test(l) && /[a-z]/i.test(l))
if (process.argv.includes('--dry')) { console.log(say.join('\n')); console.log(`${say.length} lines, ${say.join('').length} characters`); process.exit(0) }
let made = 0, cached = 0, failed = 0
for (const line of say) for (const piece of pieces(line)) {
  const r = await fetch(`${site}/api/voice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: piece }) }).catch(() => null)
  if (!r || !r.ok) { failed++; continue }
  r.headers.get('x-voice') === 'cache' ? cached++ : made++
  await r.arrayBuffer(); await new Promise((ok) => setTimeout(ok, 120))   // easy on the per-minute limit
}
console.log(`${say.length} lines: ${made} pieces made, ${cached} already cached, ${failed} failed`)
