// about.md split the way the interview uses it: the sections he can look things up in (the searchable doc), and the
// "Don't say" list, which is never searched or shown, only given to the model as rules every time. the source tags
// ([mem/...]) are ours: they go into the index's metadata and never leave the server
import { readFileSync } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import type { Doc } from '@/lib/rag/types.ts'

export const ABOUT = path.join(process.cwd(), 'src/meet/knowledge/about.md')
export const INDEX = path.join(process.cwd(), 'src/meet/knowledge/index.json')
export const REFS = /\s*\[([^\]]+)\]\s*$/
// meaning counts double: on the golden set (31 Oct) 1:2 beat 1:1 and meaning alone on every metric (npm run rag:eval)
export const WEIGHTS = { keyword: 1, vector: 2 }

export function knowledge() {
  const md = readFileSync(ABOUT, 'utf8')
  const sections = md.split(/^(?=## )/m).filter((s) => s.startsWith('## '))
  const dont = sections.find((s) => /^## Don't say/.test(s)) || ''
  const text = sections.filter((s) => s !== dont).join('\n')
  const rules = dont.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.replace(REFS, '').trim()).join('\n')
  // the setbacks, whole: asked about a failure, he picks from these and nothing else (a search can miss them, and a
  // model asked for a failure it wasn't given makes one up)
  const setbacks = (sections.find((s) => /^## Setbacks/.test(s)) || '').split('\n').filter((l) => l.startsWith('- ')).map((l) => l.replace(REFS, '').trim()).join('\n')
  const hash = createHash('sha1').update(md).digest('hex').slice(0, 12)
  const doc: Doc = { id: 'about', title: 'Ashwini', text, kind: 'about', source: 'about.md' }
  return { doc, rules, setbacks, hash }
}
