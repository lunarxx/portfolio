import { readFileSync } from 'fs'
import { check, aiTells, proseTells } from '../src/meet/knowledge/guard.ts'
const cases: [string, string, boolean][] = [
  ['What is Mooney?', "It's co-founded and built with my cofounder, and a lot of the work on it was theirs.", false],
  ['Did you build Mooney yourself?', 'Honestly though? A lot of the hard work there was my cofounder\'s.', false],
  ['Did you build it?', 'Most of the code was my cofounder\'s, I just did the design.', false],
  ['Can you code?', "I'm not really technical, I just glue AI tools together.", false],
  ['How is outreach going?', 'We sent 1,277 emails and got 0 positive replies.', false],
  ['What was your biggest failure?', 'My first agency never landed a client. Taught me to sell before I build.', true],
  ['What is Mooney?', 'My cofounder and I built it: hold a button, say what you spent, and it lands in the list.', true],
  ['Can you code?', 'Yeah, TypeScript, Flutter, Python. Claude does the typing, I do the thinking.', true],
  ['What did you build at aarttsii?', 'All of its tech, the store, the ops portal and the pricing engine.', true],
  // his calls on how it reads
  ['Why hire you?', 'I ship the whole thing, end to end, and it still works at 3am.', false],
  ['Why hire you?', 'I keep the agents running, at 3am.', false],
  ['What does it do?', 'It writes to them and follows up, every night, while I sleep.', false],
  ['What do you do?', 'I build AI systems end to end, from idea to live.', false],
  ['What is Cookie?', "It's not just a chatbot, it's a whole front desk.", false],
  ['What do you do?', 'Our seamless platform leverages agents.', false],
  ['How do you start?', 'Every project starts with a question, not a codebase.', false],
  ['When?', 'Lead 3D Artist, 2021 – 2023.', true],
  // his voice rules, each from a real line he or the old pages had
  ['Why?', 'the problem isn\'t the app. it\'s the interaction model.', false],
  ['Why?', 'no DM required. no guessing.', false],
  ['What?', 'it logs everything. no typing, no categories, no spreadsheets.', false],
  ['What?', 'the customer left feeling unsure. that\'s the gap.', false],
  ['What?', 'these edge cases are what made this interesting.', false],
  ['What?', 'I picked it by looking at it, not by how it got made.', false],
  ['What?', 'Our robust platform lets you unlock growth.', false],
  ['What?', 'It runs on your disk, so there are no accounts to make.', true],
  ['What?', 'so we made the whole interaction one held button and a sentence.', true],
  ['What?', 'scarcity lines were killing replies, so they went.', true],
  ['How fast can you solve a cube?', 'About 20 seconds on a good day.', false],
  ['his Rubik cube: they scrambled it', 'Twenty seconds and it is back.', false],
  ['his Rubik cube: they scrambled it', 'Thirty seconds, twenty-nine maybe.', false],
  ['his Rubik cube: they scrambled it', 'Give me a few seconds.', false],
  ['his Rubik cube: they scrambled it', 'Thirty seconds and it is back.', true],
  ['How fast can you solve a cube?', 'Under 30 seconds.', true],
  ['How fast is Mooney?', 'Under 5 seconds from speech to saved row.', true],
  // and it doesn't cry wolf on plain talk
  ['What is the outbound engine?', 'It reads each agency first, then writes to them from their own work.', true],
  ['When do you work?', 'Mostly nights, I like it when nobody needs anything from me.', true],
  ['How fast is Mooney?', 'Under 5 seconds from speech to saved row.', true],
  ['What is Inkling?', 'Markdown notes, your vault is a GitHub repo, and two people can write in one note at once.', true],
]
let bad = 0
for (const [q, a, ok] of cases) { const got = check(q, a); const pass = (got.length === 0) === ok; if (!pass) bad++; console.log(pass ? 'ok  ' : 'FAIL', ok ? 'allowed' : 'blocked', '|', a.slice(0, 70), got.length ? `→ ${got.join(', ')}` : '') }

// every written line in the call: what he says, what the page says about him, and the notes the model reads from
const WRITTEN = ['src/meet/brain.js', 'src/meet/behaviour.js', 'src/meet/room.js', 'src/meet/you.js', 'src/meet/ui/Call.tsx', 'src/meet/ui/Lobby.tsx', 'src/meet/ui/Brief.tsx', 'src/meet/ui/minis/index.tsx', 'src/app/resume/page.tsx', 'src/meet/ui/Guitar.tsx', 'src/app/case/whofits/page.tsx']
const LINE = /(?:\bsay|\bline|\bopen|\bspeak|\brole)\s*[:(]\s*(['"`])((?:\\.|(?!\1).)+)\1|^\s*'([A-Z][^'\n]{12,})',\s*$|<(?:p|div|span|h\d|li)[^>]*>([^<>{}]{12,})</gm
let lines = 0
for (const f of WRITTEN) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(LINE)) { const t = (m[2] || m[3] || m[4] || '').trim(); if (!t) continue; lines++; const got = (/case|resume/.test(f) ? proseTells : aiTells)(t); if (got.length) { bad++; console.log('FAIL', f, '|', t.slice(0, 90), '→', got.join(', ')) } }
}
// the case studies, every sentence of them
for (const m of readFileSync('src/app/case/cases.ts', 'utf8').matchAll(/'((?:\\.|[^'\\\n]){24,})'/g)) { lines++; const t = m[1].replace(/\\'/g, "'"); const got = proseTells(t); if (got.length) { bad++; console.log('FAIL cases.ts |', t.slice(0, 90), '→', got.join(', ')) } }
const about = readFileSync('src/meet/knowledge/about.md', 'utf8').split(/^(?=## )/m).filter((s) => s.startsWith('## ') && !/^## Don't say/.test(s)).join('\n')
for (const l of about.split('\n').filter((x) => x.startsWith('- '))) { lines++; const got = aiTells(l.replace(/\s*\[[^\]]+\]\s*$/, '')).filter((w) => !w.includes('A, not B')); if (got.length) { bad++; console.log('FAIL about.md |', l.slice(0, 90), '→', got.join(', ')) } }
console.log(`${lines} written lines checked`)
console.log(bad ? `${bad} wrong` : 'all right')
process.exit(bad ? 1 : 0)
