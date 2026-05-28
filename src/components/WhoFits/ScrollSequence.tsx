'use client'

import { useRef, useEffect, useState } from 'react'
import styles from './WhoFits.module.css'

const FRAME_COUNT = 40
const frames = Array.from({ length: FRAME_COUNT }, (_, i) =>
  `/whofits/seq/saas${String(i + 1).padStart(4, '0')}.png`
)

export function ScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let loadedCount = 0
    const images: HTMLImageElement[] = []

    frames.forEach((src, i) => {
      const img = new Image()
      img.src = src
      img.onload = () => {
        loadedCount++
        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = images
          setLoaded(true)
          drawFrame(0)
        }
      }
      images[i] = img
    })
  }, [])

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imagesRef.current[index]
    if (!canvas || !ctx || !img) return
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
  }

  useEffect(() => {
    if (!loaded) return

    const handleScroll = () => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const scrollProgress = Math.max(0, Math.min(1,
        -rect.top / (rect.height - window.innerHeight)
      ))
      const frameIndex = Math.min(FRAME_COUNT - 1, Math.floor(scrollProgress * FRAME_COUNT))
      drawFrame(frameIndex)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loaded])

  return (
    <div ref={containerRef} className={styles.sequenceContainer}>
      <div className={styles.sequenceSticky}>
        <canvas ref={canvasRef} className={styles.sequenceCanvas} />
      </div>
    </div>
  )
}
