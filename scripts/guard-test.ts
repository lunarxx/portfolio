import { check } from '../src/meet/knowledge/guard.ts'
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
]
let bad = 0
for (const [q, a, ok] of cases) { const got = check(q, a); const pass = (got.length === 0) === ok; if (!pass) bad++; console.log(pass ? 'ok  ' : 'FAIL', ok ? 'allowed' : 'blocked', '|', a.slice(0, 70), got.length ? `→ ${got.join(', ')}` : '') }
console.log(bad ? `${bad} wrong` : 'all right')
