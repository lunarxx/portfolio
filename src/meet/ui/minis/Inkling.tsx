'use client'
// Inkling, small: a markdown note you can type in, and a second person in it with you, their cursor and their words
// arriving as they type (the real one merges both through a CRDT, so two people on one word never break it). the vault
// is plain files, synced as a GitHub repo; the corner shows the notes linking to each other
import { useEffect, useRef, useState } from 'react'
import m from './minis.module.css'

const FILES = ['ideas.md', 'portfolio.md', 'mooney launch.md', 'reading list.md']
const START = `# portfolio

the interview call is the portfolio. [[ideas]] has the rest.

- visitors join a lobby, dress a character
- their webcam moves it
- he answers from his notes, and can show them
`
// what the other person types, a line at a time, with pauses between
const THEIRS = ['- a shelf of everything we built [[mooney launch]]\n', '- every project opens small, and works\n', '- ask him anything, he shows his notes\n']

export function Inkling() {
  const [text, setText] = useState(START), [file, setFile] = useState('portfolio.md'), [them, setThem] = useState(START.length), [synced, setSynced] = useState(true)
  const at = useRef(START.length)   // their cursor, where their next letter lands
  useEffect(() => {
    let alive = true
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    ;(async () => {
      await sleep(1400)
      for (let n = 0; alive; n++) {
        const line = THEIRS[n % THEIRS.length]
        for (const ch of line) {
          if (!alive) return
          const i = at.current; setText((t) => t.slice(0, i) + ch + t.slice(i)); at.current = i + 1; setThem(at.current); setSynced(false)
          await sleep(ch === ' ' ? 150 : 55 + Math.random() * 95)
        }
        setSynced(true); await sleep(7000 + Math.random() * 3000)
      }
    })()
    return () => { alive = false }
  }, [])
  // your typing: anything before their cursor pushes it along (what the merge does)
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value, grew = next.length - text.length, caret = e.target.selectionStart
    if (caret - Math.max(0, grew) < at.current) { at.current = Math.max(0, at.current + grew); setThem(at.current) }
    setText(next); setSynced(false); setTimeout(() => setSynced(true), 900)
  }
  // the note drawn behind the textarea: headings and [[links]] coloured
  const paint = (t: string) => t.split('\n').map((line, i, all) => (
    <span key={i} className={/^#/.test(line) ? m.h : undefined}>
      {line.split(/(\[\[[^\]]+\]\])/).map((x, j) => /^\[\[/.test(x) ? <span key={j} className={m.lk}>{x}</span> : x)}{i < all.length - 1 ? '\n' : ''}
    </span>
  ))
  return (
    <div className={m.ink}>
      <div className={m.vault}>
        <small>vault · github</small>
        {FILES.map((f) => <button key={f} className={`${m.file} ${f === file ? m.fileOn : ''}`} onClick={() => setFile(f)}>{f}</button>)}
        <div className={m.sync}>{synced ? '● synced' : '○ syncing…'}</div>
      </div>
      <div className={m.note}>
        <div className={m.tabs}><span className={m.tabOn}>{file}</span><span>ideas.md</span>
          <div className={m.people}><i style={{ background: '#F1D9A8' }}>you</i><i style={{ background: '#8FA38A' }}>S</i>2 here</div></div>
        <div className={m.editor}>
          <pre aria-hidden>{paint(text.slice(0, them))}<span className={m.them} data-who="Sam" />{paint(text.slice(them))}</pre>
          <textarea value={text} onChange={onChange} spellCheck={false} aria-label="the note" />
        </div>
        <svg className={m.graph} viewBox="0 0 150 104">
          {[[40, 30, 100, 24], [40, 30, 70, 74], [100, 24, 118, 70], [70, 74, 118, 70]].map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#3A3B42" strokeWidth="1.5" />)}
          {([[40, 30, 'portfolio'], [100, 24, 'ideas'], [70, 74, 'mooney'], [118, 70, 'reading']] as [number, number, string][]).map(([x, y, n]) => (
            <g key={n}><circle cx={x} cy={y} r="5" fill={n === 'portfolio' ? '#F1D9A8' : '#8FB8D8'} /><text x={x + 7} y={y + 3} fontSize="8" fill="#8E8779" fontFamily="monospace">{n}</text></g>
          ))}
        </svg>
      </div>
    </div>
  )
}
