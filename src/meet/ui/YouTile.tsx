'use client'
// your tile: your character on its canvas (drawn by you.js on twos), and in the lobby its speech bubble, typed out,
// beside its head with the tail pointing at it (on the other side when there's no room)
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { attach, head, poke, gazeAnchor } from '../you.js'
import { useMeet } from '../store.js'
import s from './meet.module.css'

export function YouTile({ lobby = false, children }: { lobby?: boolean; children?: React.ReactNode }) {
  const cv = useRef<HTMLCanvasElement>(null), box = useRef<HTMLDivElement>(null)
  useEffect(() => { const off = attach(cv.current); return () => { off() } }, [])
  useEffect(() => { gazeAnchor(box.current) }, [])   // the newest tile on screen is the one it looks out of
  return (
    <div ref={box} className={s.youTile}>
      <canvas ref={cv} width={1280} height={720} onPointerDown={poke} className={s.pokeable} />
      {lobby && <Bubble box={box} />}
      {children}
    </div>
  )
}

function Bubble({ box }: { box: React.RefObject<HTMLDivElement | null> }) {
  const { bubble } = useMeet()
  const [shown, setShown] = useState('')
  const el = useRef<HTMLDivElement>(null)
  // typed out, a letter at a time
  useEffect(() => {
    if (!bubble) return
    let i = 0; setShown('')
    const t = setInterval(() => { setShown(bubble.text.slice(0, ++i)); if (i >= bubble.text.length) clearInterval(t) }, 32)
    return () => clearInterval(t)
  }, [bubble])
  // beside the head, the tail pointing at it. it takes its full size up front (the whole text sits in it, invisible,
  // while the letters type over it), picks its side once per bubble, and glides after the head instead of snapping
  const side = useRef<{ id: number; flip: boolean } | null>(null), pos = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => {
    let raf = 0
    const place = () => {
      const h = head(), b = el.current, tile = box.current
      if (h && b && tile && bubble) {
        const k = tile.clientWidth / h.w, hx = h.x * k, hy = h.y * k, r = h.r * k, bw = b.offsetWidth, bh = b.offsetHeight
        if (!side.current || side.current.id !== bubble.id) { side.current = { id: bubble.id, flip: hx + r * .55 + bw > tile.clientWidth - 16 }; pos.current = null }
        const flip = side.current.flip, want = { x: flip ? hx - r * .55 - bw : hx + r * .55, y: Math.max(12, hy - r * 1.05 - bh) }
        const p = pos.current = pos.current || { x: Math.round(want.x), y: Math.round(want.y) }   // pinned where it first appears
        b.dataset.flip = flip ? '1' : ''
        b.style.transform = `translate(${p.x}px, ${p.y}px)`
      }
      raf = requestAnimationFrame(place)
    }
    raf = requestAnimationFrame(place)
    return () => cancelAnimationFrame(raf)
  }, [box, bubble])
  return (
    <div ref={el} className={s.bubbleAt}>
      <AnimatePresence>
        {bubble && (
          <motion.div key={bubble.id} className={`${s.bubble} ${bubble.small ? s.bubbleSmall : ''}`}
            initial={{ opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .8, transition: { duration: .15 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 18 }}>
            <span className={s.bubbleFull}>{bubble.text}</span><span className={s.bubbleTyped}>{shown}</span>
            <svg className={s.tail} viewBox="0 0 30 26"><path d="M3 0C7 9 6 18 1 25C11 20 19 11 27 0" /></svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
