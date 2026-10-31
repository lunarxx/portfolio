'use client'
// his room: the stage engine (a fork of octyn-onair, never the original) needs its panels in the page before it loads.
// the stream's panels stay hidden; only the camera (#cam) and its captions (#cap) show, wherever the call puts them.
// the engine is booted once per page load (it runs at import, like the stream page)
import { useEffect } from 'react'
import s from './meet.module.css'

let booted = false
export function bootStage() {
  if (booted) return; booted = true
  const w = window as any
  w.require = function () {}; w.require.config = function () {}   // no editor in the meeting
  w.EventSource = class { onmessage: any = null; constructor() { w.__show = this } close() {} emit(m: unknown) { this.onmessage && this.onmessage({ data: JSON.stringify(m) }) } }
  import('../engine/live.js')
}

// the stream page's panels the engine writes to; none of them show in the meeting
export function StageHidden() {
  return (
    <div className={s.hidden} aria-hidden>
      <div id="bar"><span id="day" /><div id="goals" /><div id="sgoal" /><span id="clock" /></div>
      <div id="editor"><div id="tabs" /><div id="monaco" /></div>
      <div id="design" /><div id="term" />
      <div id="preview"><iframe id="game" src="about:blank" title="game" /><span id="gamelabel" /></div>
      <div id="chat" /><div id="poll" />
    </div>
  )
}

// his camera: the 320x180 pixel canvas, and his captions over it
export function StageView({ className }: { className?: string }) {
  useEffect(() => { bootStage() }, [])
  return (
    <div className={className}>
      {/* the engine writes its layout name on #stageroot every frame, so the call's own classes go on the wrapper */}
      <div id="stageroot" className="chat">
        <div id="cam" className={s.cam}><canvas id="c" width={320} height={180} /></div>
        <div id="cap" className={s.cap} />
      </div>
    </div>
  )
}
