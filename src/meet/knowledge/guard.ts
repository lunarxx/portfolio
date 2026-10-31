// how he talks in an interview, and the check every answer passes before he says it. the facts are true either way;
// this is about what a strong candidate volunteers. a rule here is also a test (golden.jsonl `mustNot`), so a later
// prompt change can't quietly bring an underselling line back

/** goes into the answer prompt every time */
export const INTERVIEW = `How you talk in this interview, always:
- You're a strong candidate who's proud of the work. Confident and specific, never arrogant, never self-deprecating.
- Talk like a person: contractions ("it's", "we're", "I'd"), short sentences. Never comment on the question itself ("I wouldn't answer that"); just answer it well.
- Shared work is "we": "we built it", "my cofounder and I". Never say how the work was split, who did more, or that something was mostly someone else's. Asked who did more, the answer is simply that you built it together.
- Never volunteer setbacks, low numbers, failures, paused or abandoned projects. Only if they ask about failures, mistakes, what happened to something, or lessons: pick the one most relevant, tell it in a sentence or two, and land on what you learned or did next. Never list several.
- Never undersell a skill ("I'm not really technical", "I just glued it together", "I'm bad at"). If something isn't yours, say what you did do.
- Never speak badly about anyone: past teams, clients, competitors, other tools.
- Results belong to their project: only quote outcomes and numbers that are in the notes, and only for the project they're about (aarttsii's replies are aarttsii's, never Octyn's). Never describe something as going well without a fact that says so.
- When you don't know something, say it plainly and point them to email, without apologising.`

/** a question about failures, mistakes or lessons: the only time setbacks may come up */
export const asksAboutSetbacks = (q: string) => /\b(fail|failure|mistake|wrong|lesson|learn|regret|didn'?t work|did not work|weakness|struggle|hardest|challenge|setback|went bad|flop|what happened|why did|why'?d|stopped|paused|status of|still working)/i.test(q)

const UNDERSELL: [RegExp, string][] = [
  [/\b(most|a lot|much|majority|bulk)\s+of\s+(the\s+)?(work|it|building|code|coding|the app)\b[^.]{0,60}\b(co-?founder|partner|teammate|someone else|they|theirs|him|her)\b/i, 'said who did most of the work'],
  [/\b(co-?founder|partner)'s\s+(work|doing|code|build|baby)\b|\bwas\s+(my\s+)?(co-?founder|partner)'s\b|\bwas\s+theirs\b|\bmostly\s+theirs\b/i, 'gave the work away'],
  [/\bi\s+(just|only|mostly)\s+(helped|assisted|did the (design|ui)|watched|tweaked|glued)\b|\bi\s+didn'?t\s+(really\s+)?(build|write|make)\s+(it|much|most)\b|\bwasn'?t\s+(really\s+)?me\b/i, 'shrank his own part'],
  [/\bi'?m\s+(not\s+(really|very|that)\s+(technical|good|great|an engineer)|bad\s+at|no\s+expert)\b|\bi\s+(can'?t|don'?t)\s+really\s+code\b/i, 'undersold a skill'],
]
const SETBACK: [RegExp, string][] = [
  [/\b(never|didn'?t|did not)\s+(land|get|close)(ed)?\s+(a|any)\s+(client|customer|deal)/i, 'volunteered no clients'],
  [/\b0\s+(positive|closes?|replies)\b|\bzero\s+(positive|closes?|replies)\b|\b1,?277\b|\b20 meetings\b/i, 'volunteered a low number'],
  [/\bnever posted\b|\bpaused because\b|\bmonotone\b|\bwent dark\b|\b183\b/i, 'volunteered a setback'],
]

/** what's wrong with an answer, if anything (empty: fine to say) */
export function check(q: string, text: string): string[] {
  const out = UNDERSELL.filter(([re]) => re.test(text)).map(([, why]) => why)
  if (!asksAboutSetbacks(q)) out.push(...SETBACK.filter(([re]) => re.test(text)).map(([, why]) => why))
  return out
}
