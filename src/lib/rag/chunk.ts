// documents into chunks that follow their structure. markdown headings start sections (their trail is each chunk's
// context); list items and paragraphs stay whole where they fit; a long block splits on sentences to the budget, with a
// sentence of overlap when asked (none by default: docs/research.md). records and messages are one chunk each
import type { Doc, Chunk } from './types.ts'
import { sentences, tokens, hash } from './text.ts'

export interface ChunkOptions {
  maxTokens?: number; minTokens?: number; overlap?: number; itemsPerChunk?: number
  /** inline source tags to lift out of the text into meta.refs (about.md's `[where it's from]`) */
  refs?: RegExp
}

export function chunk(doc: Doc, o: ChunkOptions = {}): Chunk[] {
  const max = o.maxTokens ?? 220, min = o.minTokens ?? 40, perItem = o.itemsPerChunk ?? 1
  const base = { docId: doc.id, scope: doc.scope || 'global', kind: doc.kind || 'doc', source: doc.source || doc.id, at: doc.at || null, meta: doc.meta || {} }
  const out: Chunk[] = []
  const push = (text: string, trail: string[]) => {
    const refs: string[] = []
    if (o.refs) text = text.replace(new RegExp(o.refs.source, 'g'), (m, g) => { refs.push((g ?? m).trim()); return ' ' }).replace(/[ 	]{2,}/g, ' ')
    text = text.trim(); if (!text) return
    const context = [doc.title, ...trail].filter(Boolean).join(' › ')
    out.push({ ...base, meta: refs.length ? { ...base.meta, refs } : base.meta, id: `${doc.id}#${out.length}-${hash(text).slice(0, 6)}`, text, context, pos: out.length })
  }
  // a block too big for one chunk: sentences to the budget (with `overlap` sentences carried over, if set)
  const split = (block: string, trail: string[]) => {
    if (tokens(block) <= max) return push(block, trail)
    let cur: string[] = []
    for (const s of sentences(block)) {
      if (cur.length && tokens(cur.join(' ') + ' ' + s) > max) { push(cur.join(' '), trail); cur = o.overlap ? cur.slice(-o.overlap) : [] }
      cur.push(s)
    }
    if (cur.length) push(cur.join(' '), trail)
  }
  // a section's blocks: list items grouped `perItem` at a time (a fact a bullet stays one chunk by default), short
  // paragraphs merged up to the budget so nothing tiny floats alone
  const section = (lines: string[], trail: string[]) => {
    const blocks: { text: string; item: boolean }[] = []
    let para: string[] = []
    const flush = () => { if (para.length) { blocks.push({ text: para.join(' '), item: false }); para = [] } }
    for (const l of lines) {
      const item = /^\s*([-*+]|\d+[.)])\s+/.test(l)
      if (!l.trim()) flush()
      else if (item) { flush(); blocks.push({ text: l.replace(/^\s*([-*+]|\d+[.)])\s+/, ''), item: true }) }
      else if (blocks.length && blocks[blocks.length - 1].item && /^\s{2,}/.test(l)) blocks[blocks.length - 1].text += ' ' + l.trim()   // an item's continuation
      else para.push(l.trim())
    }
    flush()
    let buf: string[] = [], items = 0
    const out = () => { if (buf.length) { split(buf.join('\n'), trail); buf = []; items = 0 } }
    for (const b of blocks) {
      if (b.item) { if (items >= perItem || (buf.length && !items)) out(); buf.push(b.text); items++; if (items >= perItem) out() }
      else { if (items) out(); if (buf.length && tokens(buf.join(' ') + b.text) > max) out(); buf.push(b.text); if (tokens(buf.join(' ')) >= min) out() }
    }
    out()
  }
  if (!/^#{1,6}\s/m.test(doc.text)) { section(doc.text.split('\n'), []); return out }
  const trail: string[] = []; let lines: string[] = [], at: string[] = []
  for (const l of doc.text.split('\n')) {
    const h = l.match(/^(#{1,6})\s+(.*)$/)
    if (h) { section(lines, at); lines = []; trail.length = h[1].length - 1; trail[h[1].length - 1] = h[2].trim(); at = trail.filter(Boolean) }
    else lines.push(l)
  }
  section(lines, at)
  return out
}

/** what gets embedded and keyword-indexed: the chunk with its context in front (contextual retrieval) */
export const searchable = (c: Chunk) => (c.context ? `${c.context}\n${c.text}` : c.text)
