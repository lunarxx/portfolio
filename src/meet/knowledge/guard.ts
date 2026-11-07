// how he talks in an interview, and the check every answer passes before he says it. the facts are true either way;
// this is about what a strong candidate volunteers, and about sounding like a person. a rule here is also a test
// (golden.jsonl `mustNot`, and scripts/guard-test.ts runs every written line in the call through it), so a later prompt
// or copy change can't quietly bring a bad line back

/** goes into the answer prompt every time */
export const INTERVIEW = `How you talk in this interview, always:
- You're a strong candidate who's proud of the work. Confident and specific, never arrogant, never self-deprecating.
- Talk like a person: contractions ("it's", "we're", "I'd"), short sentences. Never comment on the question itself ("I wouldn't answer that"); just answer it well.
- Shared work is "we": "we built it", "my cofounder and I". Never say how the work was split, who did more, or that something was mostly someone else's. Asked who did more, the answer is simply that you built it together.
- Never volunteer setbacks, low numbers, failures, paused or abandoned projects. Only if they ask about failures, mistakes, what happened to something, or lessons: pick the one most relevant, tell it in a sentence or two, and land on what you learned or did next. Never list several.
- Never undersell a skill ("I'm not really technical", "I just glued it together", "I'm bad at"). If something isn't yours, say what you did do.
- Never speak badly about anyone: past teams, clients, competitors, other tools.
- Results belong to their project: only quote outcomes and numbers that are in the notes, and only for the project they're about (aarttsii's replies are aarttsii's, never Octyn's). Never describe something as going well without a fact that says so.
- When you don't know something, say it plainly and point them to email, without apologising.
- Sound like someone thinking out loud, never like a tagline. No slogans, no punchlines, no line that could go on a landing page. Stop when the thought is finished: a time, a place or a number goes inside the sentence or not at all, never hung on the end of a sentence that was already complete. Say what the thing does in plain words instead of describing how you work in general.`

/** a question about failures, mistakes or lessons: the only time setbacks may come up */
export const asksAboutSetbacks = (q: string) => /\b(fail|failure|mistake|wrong|lesson|learn|regret|didn'?t work|did not work|weakness|struggle|hardest|challenge|setback|went bad|flop|what happened|why did|why'?d|stopped|paused|status of|still working|on time|on schedule|\blate\b|delay|deadline)/i.test(q)

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
// what reads as generated, whoever wrote it. his calls: "at 3am is horribly ai sounding", "random additions you do to a
// totally complete sentence", "builds AI systems end to end, from idea to live" is cliche
const AI_VOICE: [RegExp, string][] = [
  [/\b([1-5])\s?(a\.?m\.?)\b|\bat midnight\b|\bin the middle of the night\b/i, 'a small-hours flourish'],
  [/\bwhile (you|i|we|they|everyone) (sleep|sleeps|slept)\b|\bin (your|my) sleep\b/i, 'a while-you-sleep flourish'],
  [/\bend[- ]to[- ]end\b|\bidea to (live|launch|production|prod|shipped)\b|\bzero to one\b|\bship(s|ped)? the whole\b/i, 'a builder cliche'],
  [/\b(and|that)\s+(it\s+)?(still|actually)\s+works?\b/i, 'a "still works" punchline'],
  [/\bnot just\b[^.?!]{0,70}\bbut\b|\bit'?s not (just )?[^.,?!]{1,40}[,;:] it'?s\b|\bmore than just\b/i, 'a negation pivot'],
  [/\b(seamless(ly)?|game[- ]?chang\w*|cutting[- ]edge|leverag\w+|passionate about|supercharg\w*|revolutioni[sz]\w*|delv(e|ing)|at the end of the day|the magic happens)\b/i, 'a hype word'],
  [/,\s*(every|each|all)\s+(single\s+)?(night|day|morning|week)[.!?]*\s*$/im, 'a tail hung on a finished sentence'],
  [/,\s*(at|by|around)\s+\d[^.,?!]{0,12}[.!?]*\s*$/im, 'a tail hung on a finished sentence'],
  // what his corrections keep finding, and what the old case studies were full of
  [/\bnot (?:the |just |only |a |an )?[^.,;?!]{1,40}[,;] (?:but|it'?s)\b|\bthe problem isn'?t\b|\bwasn'?t [^.,;?!]{1,40}[.,;] it was\b/i, 'a negation pivot'],
  [/, not [a-z]+(?: [a-z]+){0,5}[.!?]/i, 'an "A, not B" line'],
  [/\bno [a-z]+(?: [a-z]+)?[,.] no [a-z]+(?: [a-z]+)?[,.] (?:and )?no [a-z]+/i, 'a "no X, no Y, no Z" triad'],
  [/\bno [a-z]+(?: [a-z]+){0,2}\. no [a-z]+(?: [a-z]+){0,2}\./i, 'a "no X. no Y." beat'],
  [/\b(?:that'?s|this is|and that'?s) (?:the|what) (?:whole |real |entire )?(?:point|pitch|gap|difference|magic|secret|trick|makes (?:it|this|them))\b|\bwhat made this interesting\b|\bwhich is its own kind of\b|\bmade all the difference\b|\bthe rest is history\b/i, 'a closing punchline'],
  [/\b(here'?s the thing|turns out|at its core|when it comes to|the beauty of|in today'?s|deep dive|a testament to|pivotal|meticulous(?:ly)?|tapestry|nuanced?|boasts?|harness(?:es|ing)?|foster(?:s|ing)?|elevat(?:e|es|ing)|empower(?:s|ing)?|streamlin(?:e|es|ed|ing)|effortless(?:ly)?|robust|unlock(?:s|ing)?|journey)\b/i, 'a stock phrase'],
  [/—|(?<!\d)\s–\s/, 'an em dash'],   // (2021 – 2023 is a date range)
  [/, not (a|an|the) [a-z]+[.!?]/i, 'an "A, not B" line'],   // "starts with a question, not a codebase"
]

/** what reads as generated in any line he says or the page says (empty: fine) */
export const aiTells = (text: string): string[] => AI_VOICE.filter(([re]) => re.test(text)).map(([, why]) => why)

// his cube time is 30 seconds, his call: "never" any other number (the model made up 20 and 29)
const OTHER_NUMBER = /\b(?:ten|eleven|twelve|fifteen|eighteen|twenty(?:-\w+)?|twenty|twenty \w+|forty|fifty|sixty|ninety|(?!30\b|3\b)\d+)\b/i
const CUBE = /\b(cube|rubik|scrambl|solv)/i, OTHER_TIME = /\b(?!30\b|thirty(?![-\w]))(\d+(?:\.\d+)?|[a-z]+(?:-[a-z]+)?)\s*(?:seconds?|secs?|minutes?|mins?)\b/i

// on a written page, short sentences in a row are a drumbeat; out loud they're just how he talks ("Got it. Please don't.")
const FRAGMENTS = /(?:^|[.!?]\s+)(?:[a-z'-]+\s+){0,2}[a-z'-]+\.\s+(?:[a-z'-]+\s+){0,2}[a-z'-]+\.(?:\s|$)/i
/** the same, for pages people read */
export const proseTells = (text: string): string[] => [...aiTells(text), ...(FRAGMENTS.test(text) ? ['two punch fragments in a row'] : [])]

/** what's wrong with an answer, if anything (empty: fine to say) */
export function check(q: string, text: string): string[] {
  const out = UNDERSELL.filter(([re]) => re.test(text)).map(([, why]) => why)
  if (/\bhocco\b/i.test(q + ' ' + text) && /\b(on time|on schedule|ahead of schedule|as promised)\b/i.test(text) && !/\b(not|wasn'?t|didn'?t|late|past)\b/i.test(text)) out.push('said hocco was on time: it shipped about a month past the first date')
  if (/\bhocco\b/i.test(q + ' ' + text) && /\bour (scooperhero|mascots?)\b/i.test(text)) out.push('the scooperheroes are hocco\'s mascots')
  if (CUBE.test(q + ' ' + text) && (OTHER_TIME.test(text) || OTHER_NUMBER.test(text))) out.push('a cube time other than 30 seconds')
  if (!asksAboutSetbacks(q)) out.push(...SETBACK.filter(([re]) => re.test(text)).map(([, why]) => why))
  out.push(...aiTells(text))
  return out
}
