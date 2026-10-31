// the interview: a call with ashwini at his desk. a lobby to join from, then the call. what you
// say becomes the events the show sends on stream (a 'say' with timed words, gestures on their words, a babble voice
// his mouth follows, acts and moves from his own library). he offers things; a yes does them.
const show = () => window.__show
const emit = (m) => show() && show().emit(m)
const $ = (id) => document.getElementById(id)
const root = document.documentElement
const stage = () => window.stage
import { createCast, CAST, SKINS, TOPS, OPTIONS, ACCENTS, DEFAULT_LOOK } from './cast3d.js'
import { createFaceCam, createRetarget } from './facecam.js'

// ---------------------------------------------------------------- fit the 1920x1080 page into the window
function fit() { const k = Math.min(innerWidth / 1920, innerHeight / 1080); document.body.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px, ${(innerHeight - 1080 * k) / 2}px) scale(${k})` }
addEventListener('resize', fit); fit()

const ICON = {
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
}

// ---------------------------------------------------------------- his voice: a soft babble, one blip a syllable, so his mouth moves with it
const syl = (w) => Math.max(1, (w.toLowerCase().match(/[aeiouy]+/g) || []).length)
async function babble(words, dur) {
  const sr = 22050, off = new OfflineAudioContext(1, Math.ceil((dur + .3) * sr), sr)
  for (const [w, t0] of words) {
    const n = syl(w), step = Math.min(.12, .24 / n)
    for (let k = 0; k < n; k++) {
      const o = off.createOscillator(), g = off.createGain(), t = t0 + k * step
      o.type = 'triangle'; o.frequency.value = 190 + Math.random() * 70
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.32, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + step * .9)
      o.connect(g).connect(off.destination); o.start(t); o.stop(t + step)
    }
  }
  const buf = await off.startRendering(), d = buf.getChannelData(0), wav = new DataView(new ArrayBuffer(44 + d.length * 2))
  const str = (o, s) => [...s].forEach((c, i) => wav.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF'); wav.setUint32(4, 36 + d.length * 2, true); str(8, 'WAVEfmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 1, true)
  wav.setUint32(24, sr, true); wav.setUint32(28, sr * 2, true); wav.setUint16(32, 2, true); wav.setUint16(34, 16, true); str(36, 'data'); wav.setUint32(40, d.length * 2, true)
  for (let i = 0; i < d.length; i++) wav.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true)
  return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))
}

let lineId = 0, lastSaid = 0
async function say(text, { mark = null, act = null } = {}) {
  text = text.replace(/\{name\}/g, me.name || 'there')
  const words = []; let t = .15
  for (const w of text.split(/\s+/).filter(Boolean)) { words.push([w, t]); t += .1 + syl(w) * .085 + (/[.,?!]$/.test(w) ? .28 : 0) }
  const dur = t + .2, url = await babble(words, dur)
  emit({ type: 'say', id: `p${++lineId}`, text, url, words, dur, marks: mark ? [[0, mark]] : [], act })
  lastSaid = performance.now() + dur * 1000
  log('him', text)
}
const move = (name) => emit({ type: 'move', name })

// ---------------------------------------------------------------- the transcript
function log(who, text) {
  const d = document.createElement('div'); d.className = `m ${who}`
  d.innerHTML = `<span class="who">${who === 'him' ? 'Ashwini' : esc(me.name || 'You')}</span>`; d.append(text)
  $('logbox').append(d); $('logbox').scrollTop = 1e9
  if (who === 'you') { const c = $('mecap'); c.textContent = text; c.classList.add('on'); clearTimeout(c._t); c._t = setTimeout(() => c.classList.remove('on'), 3200) }
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// ---------------------------------------------------------------- what he says (drafts in ashwini's voice, for him to correct)
// offer: what a yes does next. next: the chips after this answer
const EMAIL = 'ashwinitiwari8888@gmail.com'
const A = {
  greet: { seeds: ['hi', 'hello', 'hey', 'yo', 'sup', 'good morning'], say: 'Hey {name}. Ask me anything, or say "show me" and I will.', mark: 'arms_up' },
  intro: { seeds: ['tell me about yourself', 'who are you', 'introduce yourself', 'whats your background', 'what do you do', 'apne baare mein batao'], say: "I'm Ashwini. I build AI systems that run parts of a business on their own.", mark: 'me', next: ['What have you built?', 'Why should we hire you?'] },
  show_work: { seeds: ['show me something you built', 'what have you built', 'what have you made', 'show me your work', 'what have you shipped', 'portfolio', 'show me', 'tumne kya banaya hai'], say: 'Three things. A voice expense app on the Play Store, a WhatsApp front desk for a crochet brand, and the sales engine my company runs on. Mooney first?', mark: 'present', offer: 'mooney', next: ['The front desk', 'The sales engine'] },
  mooney: { seeds: ['show me mooney', 'what is mooney', 'tell me about the expense app', 'the voice expense app', 'the app with the cow'], say: "Here, it's on my phone. Say what you spent and watch it log.", act: 'show_phone', after: () => setTimeout(mooneyDemo, 2200) },
  desk: { seeds: ['the front desk', 'tell me about the whatsapp bot', 'aarttsii', 'the crochet brand', 'tell me about the rag system', 'what is the desk'], say: "Aarttsii's front desk. Buyers message on WhatsApp or Instagram, it answers from her real catalogue and orders, takes the order, chases the payment. It only says what her data says.", mark: 'explain', offer: 'engine', next: ['How does it not make things up?', 'The sales engine'] },
  rag: { seeds: ['how does it not make things up', 'how does the rag work', 'what if it doesnt know', 'hallucination'], say: 'Every answer is pulled from her own records first. If nothing matches, it says so and hands the chat to a human. Same idea as how I understand you right now.', mark: 'point_screen', next: ['The sales engine', 'Why should we hire you?'] },
  engine: { seeds: ['the sales engine', 'tell me about octyn', 'what does your company do', 'outreach engine', 'how do you get clients'], say: 'Octyn finds the right people, reads up on each one, writes to them and follows up, every night, while I sleep.', mark: 'explain', next: ['Why should we hire you?', 'How do you use AI?'] },
  stream: { seeds: ['why are you a tv', 'what is octyn the character', 'why the tv head', 'is this a stream', 'who is octyn'], say: "That's Octyn, my stream character. He codes live, builds his own games and talks to chat.", mark: 'me', next: ['Wave', 'Dance', 'Pet the cat'] },
  why_hire: { seeds: ['why should we hire you', 'what makes you a good fit', 'convince me', 'sell yourself', 'what value would you bring'], say: 'I ship the whole thing, end to end, and it still works at 3am. You are sitting inside one right now.', mark: 'explain', next: ['What are your weaknesses?', 'How do I reach you?'] },
  strengths: { seeds: ['what are your strengths', 'what are you best at', 'whats your edge', 'what makes you special'], say: 'Speed and taste. Idea to live in days, and it feels right when you use it.', mark: 'thumbs_up' },
  weakness: { seeds: ['what is your biggest weakness', 'what are your weaknesses', 'what are you bad at', 'where do you struggle'], say: 'I start too many things. Working on finishing more of them.', mark: 'shrug' },
  ai_use: { seeds: ['how do you use ai', 'how do you work with claude', 'do you write the code yourself', 'do you vibe code', 'is it you or the ai'], say: "Claude's my team. I direct, review and test. This call was built that way.", mark: 'point_screen', next: ['What stack do you use?', 'Why should we hire you?'] },
  stack: { seeds: ['what tech stack do you use', 'what stack do you use', 'which languages do you know', 'what do you code in', 'do you know react', 'do you know python'], say: 'TypeScript, React, Flutter, Python, Postgres, three.js. And my own servers.', mark: 'explain' },
  salary: { seeds: ['what salary are you expecting', 'how much do you charge', 'whats your rate', 'compensation expectations'], say: "Depends on the role. Email me and we'll talk.", mark: 'shrug', offer: 'contact' },
  contact: { seeds: ['how can i contact you', 'how do i reach you', 'what is your email', 'linkedin', 'can i get your resume', 'resume'], say: "Email's quickest. Here.", mark: 'point', after: () => setTimeout(contactCard, 1200) },
  three_d: { seeds: ['tell me about your 3d work', 'did you do 3d art', 'what did you do at sanshu', 'the nft project'], say: 'Lead 3D artist at Sanshu before all this. This guy comes from there.', mark: 'float' },
  failure: { seeds: ['tell me about a failure', 'a mistake you learned from', 'your biggest failure'], say: 'My first agency never landed a client. Taught me to sell before I build.', mark: 'head_shake' },
  wave: { seeds: ['wave', 'wave at me'], say: 'Hi again, {name}.', move: 'wave' },
  dance: { seeds: ['dance', 'show me your moves', 'can you dance'], say: 'Okay, one song.', act: 'dance' },
  spin: { seeds: ['spin', 'spin in your chair', 'do a spin'], say: 'Wheee!', move: 'spin' },
  sip: { seeds: ['drink your coffee', 'take a sip', 'have some coffee'], say: 'Good idea.', act: 'sip' },
  stretch: { seeds: ['stretch', 'you look tired', 'take a break'], say: 'Yeah, been at this a while.', act: 'stretch' },
  cat: { seeds: ['pet the cat', 'is that your cat', 'cat', 'whats the cats name'], say: 'She runs this place.', act: 'pet_cat' },
}
const ALL = Object.entries(A)
const START = ['Who are you?', 'What have you built?', 'Why should we hire you?', 'Pet the cat']
const MORE = ['How do you use AI?', 'What stack do you use?', 'Tell me about a failure', 'How do I reach you?', 'Dance', 'Spin in your chair']
const YES = /^(y|ya|yes|yeah|yea|yep|yup|sure|ok|okay|k|go|go on|go ahead|please|pls|do it|lets go|let's go|show me|show it|of course|absolutely|why not|sounds good|haan|han|ha|bilkul|definitely|alright|cool|yes please|sure thing)\b/i
const NO = /^(no|nah|nope|not now|later|maybe later|skip|pass|nahi|na)\b/i

// the meaning matcher: a small sentence model in the browser, with a confidence gate (tested: 0 wrong answers played)
let embed = null, bank = []
;(async () => {
  try {
    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1')
    env.allowLocalModels = false
    embed = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' })
    for (const [id, a] of ALL) for (const s of a.seeds) bank.push({ id, v: await vec(s) })
  } catch (e) { console.warn('matcher offline, using words', e) }
})()
async function vec(t) { return Array.from((await embed(t, { pooling: 'mean', normalize: true })).data) }
async function match(q) {
  const words = ` ${q.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')} `
  for (const [id, a] of ALL) if (a.seeds.some((s) => words.trim() === s)) return id   // a chip or the exact words: no model needed
  if (embed && bank.length) {
    const v = await vec(q), sc = {}
    for (const b of bank) sc[b.id] = Math.max(sc[b.id] ?? -1, b.v.reduce((s, x, i) => s + x * v[i], 0))
    const r = Object.entries(sc).sort((a, b) => b[1] - a[1])
    return r[0][1] >= .57 && r[0][1] - r[1][1] >= .03 ? r[0][0] : null
  }
  for (const [id, a] of ALL) if (a.seeds.some((s) => words.includes(` ${s} `))) return id
  return null
}

// ---------------------------------------------------------------- the conversation
let offer = null, asked = new Set(), miss = 0
// when he doesn't know: short, and never the same twice running
const MISS = ['Not sure I follow. Try that another way?', "That one's better over email.", 'Hm. Ask me about something I built?', 'You lost me there, ha.']
async function ask(q) {
  q = q.trim(); if (!q) return
  log('you', q); me.talkUntil = performance.now() + Math.min(4000, 500 + q.length * 55)
  emit({ type: 'glance' })
  const pending = offer; offer = null
  // a real ask wins ("show me mooney" is a question, not a yes); only a bare yes or no answers his offer
  let id = await match(q)
  const bare = !id || id === 'greet' || id === 'show_work' && pending
  if (bare && pending && YES.test(q) && q.split(/\s+/).length <= 5) id = pending
  else if (bare && pending && NO.test(q)) { setTimeout(() => { say('Fair. What else do you want to know?', { mark: 'shrug' }); chips() }, 600); return }
  else if (!id && YES.test(q) && q.split(/\s+/).length <= 3) { setTimeout(() => { say('Yes to what? Ask me anything.', { mark: 'shrug' }); chips() }, 600); return }
  setTimeout(() => play(id), 650)
}
async function play(id) {
  if (!id) { await say(MISS[miss++ % MISS.length], { mark: 'shrug' }); chips(); return }
  const a = A[id]; asked.add(id)
  if (a.move) move(a.move)
  await say(a.say, { mark: a.mark || null, act: a.act || null })
  offer = a.offer || null
  chips(a.next)
  if (a.after) a.after()
}
function chips(next = []) {
  const done = (t) => { const id = ALL.find(([, a]) => a.seeds.includes(t.toLowerCase().replace(/[?]/g, '')))?.[0]; return id && asked.has(id) }
  const pool = [...next, ...START, ...MORE].filter((t, i, all) => all.indexOf(t) === i && !done(t))
  const list = offer ? ['Yes', 'Maybe later', ...pool.slice(0, 2)] : pool.slice(0, 4)
  $('tips').innerHTML = list.map((t) => `<button class="${t === 'Yes' ? 'yes' : ''}">${t}</button>`).join('')
  $('tips').querySelectorAll('button').forEach((b) => (b.onclick = () => ask(b.textContent)))
}
$('blog').onclick = () => root.classList.toggle('logon')
$('askf').addEventListener('submit', (e) => { e.preventDefault(); ask($('q').value); $('q').value = '' })

// ---------------------------------------------------------------- you: name, your character, camera, mic
const me = { name: '', look: { ...DEFAULT_LOOK, ...CAST.Rory }, cam: null, mic: true, talkUntil: 0 }
// you come as one of the skits cast, the real models in their watercolour, and make them yours: who, their colours,
// what's on the cloth, a hat, a face
const sw = (key, list) => list.map((c) => `<button class="dot" data-k="${key}" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')
const seg = (key) => OPTIONS[key].map(([v, l]) => `<button data-k="${key}" data-v="${v}">${l}</button>`).join('')
const TABS = {
  Who: `<div class="who">${Object.keys(CAST).map((n) => `<button data-p="${n}"><img alt="" data-thumb="${CAST[n].base}"><b>${n}</b></button>`).join('')}</div>
    <div class="row"><span>Skin</span><div class="sw">${sw('skin', SKINS)}</div></div>`,
  Top: `<div class="row"><span>Colour</span><div class="sw">${sw('top', TOPS)}</div></div>
    <div class="row"><span>Print</span><div class="seg">${seg('pattern')}</div></div>
    <div class="row"><span>Accent</span><div class="sw">${sw('accent', ACCENTS)}</div></div>`,
  Hat: `<div class="row"><div class="seg">${seg('hat')}</div></div>
    <div class="row"><span>Colour</span><div class="sw">${sw('hatColour', ['#E3A94F', '#D9483B', '#2F3A52', '#8FA38A', '#F2EEE6', '#F27FB8', '#6FB7F0', '#4A4A4A'])}</div></div>`,
  Face: `<div class="row"><span>Eyes</span><div class="seg">${seg('eyes')}</div></div>
    <div class="row"><span>Cheeks</span><div class="seg">${seg('cheeks')}<button data-g>Glasses</button></div></div>
    <div class="row"><span>Head</span><input type="range" id="headk" min="0.85" max="1.2" step="0.01" value="1"></div>`,
}
$('look').innerHTML = `<div class="tabs">${Object.keys(TABS).map((t, i) => `<button data-tab="${t}" class="${i ? '' : 'on'}">${t}</button>`).join('')}
  <button class="shuffle" data-shuffle title="Surprise me"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3"/><circle cx="15" cy="15" r="1.3"/><circle cx="15" cy="9" r="1.3"/><circle cx="9" cy="15" r="1.3"/></svg>Shuffle</button></div>
  ${Object.entries(TABS).map(([t, h], i) => `<div class="pane" data-pane="${t}" ${i ? 'hidden' : ''}>${h}</div>`).join('')}`
function lookUi() {
  $('look').querySelectorAll('[data-k]').forEach((b) => b.classList.toggle('on', String(me.look[b.dataset.k]) === b.dataset.v))
  $('look').querySelectorAll('[data-p]').forEach((b) => b.classList.toggle('on', CAST[b.dataset.p].base === me.look.base))
  $('look').querySelector('[data-g]').classList.toggle('on', !!me.look.glasses)
  $('headk').value = me.look.head
}
const pick = (a) => a[Math.floor(Math.random() * a.length)]
$('look').onclick = (e) => {
  const b = e.target.closest('button'); if (!b) return
  if (b.dataset.tab) { $('look').querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x === b)); $('look').querySelectorAll('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== b.dataset.tab)); return }
  if (b.dataset.shuffle !== undefined) {
    const n = pick(Object.keys(CAST))
    me.look = { ...me.look, ...CAST[n], skin: pick(SKINS), top: pick(TOPS), accent: pick(ACCENTS), pattern: pick(OPTIONS.pattern)[0], hat: Math.random() < .6 ? pick(OPTIONS.hat)[0] : 'none',
      hatColour: pick(['#E3A94F', '#D9483B', '#2F3A52', '#8FA38A', '#F2EEE6', '#F27FB8']), eyes: pick(OPTIONS.eyes)[0], cheeks: pick(OPTIONS.cheeks)[0], glasses: Math.random() < .25, head: +(0.9 + Math.random() * .25).toFixed(2) }
  } else if (b.dataset.p) { const keep = me.look; me.look = { ...keep, ...CAST[b.dataset.p] } }
  else if (b.dataset.g !== undefined) me.look.glasses = !me.look.glasses
  else if (b.dataset.k) me.look[b.dataset.k] = b.dataset.v
  lookUi()
}
$('look').addEventListener('input', (e) => { if (e.target.id === 'headk') me.look.head = +e.target.value })
lookUi()
$('yourname').oninput = (e) => { me.name = e.target.value.trim(); $('tilelbl').textContent = $('melbl').textContent = me.name || 'You' }

// your character, every other frame (on twos, like the skits): your face and arms move it when the camera's on,
// else it idles (blinks, glances, talks when you send something)
let tracker = null, video = null, retarget = createRetarget(), idle = { blinkAt: 2, glance: 0, glanceAt: 3 }, arms = null, armsLost = {}
function idlePose(t) {
  if (t > idle.blinkAt + .14) idle.blinkAt = t + 2.5 + Math.random() * 3
  if (t > idle.glanceAt) { idle.glance = (Math.random() - .5) * .4; idle.glanceAt = t + 2 + Math.random() * 4 }
  const bl = t > idle.blinkAt ? 1 : 0
  // in the lobby with the camera off, your character slowly dozes off: lids heavy, head nodding, the odd yawn
  const doze = !root.classList.contains('joined') && !me.cam ? Math.min(1, Math.max(0, ((me.dozy || 0) - 5) / 6)) : 0
  const yawn = doze > .6 && (t % 9) < 1.6 ? Math.sin((t % 9) / 1.6 * Math.PI) : 0
  const lid = Math.max(bl, doze * .62)
  return { x: Math.sin(t * .6) * 5, y: doze * 6, z: 1, roll: Math.sin(t * .8) * .03 + doze * .08, yaw: idle.glance * (1 - doze), pitch: doze * (.18 + Math.sin(t * .7) * .06), blinkL: lid, blinkR: lid, jaw: yawn * .9, pucker: yawn * .3, smile: .3 * (1 - doze), browUp: yawn * .4 }
}
const talking = (t) => performance.now() < me.talkUntil ? Math.abs(Math.sin(t * 13)) * .6 : 0
let pose = idlePose(0), lastStep = -1, cast = null, busy = false
createCast().then(async (c) => {
  cast = c
  // a little portrait of each of the cast for the picker, in their own colours
  for (const n of Object.keys(CAST)) {
    const cv = await c.draw({ ...DEFAULT_LOOK, ...CAST[n] }, { ...idlePose(0), x: 0, roll: 0, yaw: 0, blinkL: 0, blinkR: 0, smile: .5 }, 0)
    const th = document.createElement('canvas'); th.width = 180; th.height = 140
    th.getContext('2d').drawImage(cv, cv.width * .3, 0, cv.width * .4, cv.height * .7, 0, 0, 180, 140)
    document.querySelectorAll(`[data-thumb="${CAST[n].base}"]`).forEach((im) => (im.src = th.toDataURL()))
  }
}).catch((e) => console.warn('cast failed', e))
function loop(now) {
  const t = now / 1000, step = Math.floor(t * 12)
  if (tracker && video) {
    const r = tracker.read(video, now)
    if (r !== undefined) { const p = retarget.step(r.face); if (p) pose = { ...p }; arms = holdArms(arms, r.arms) }
  } else { pose = lobbyPose(idlePose(t), t); arms = null }
  if (cast && !busy && step !== lastStep) {
    lastStep = step; busy = true
    cast.draw(me.look, { ...pose, jaw: Math.max(pose.jaw || 0, talking(t), micLevel * .9), arms, reach: typeof reachNow === 'function' ? reachNow() : null }, t).then((c) => {
      for (const id of ['avcv', 'mecv']) { const cv = $(id); cv.getContext('2d').drawImage(c, 0, 0, cv.width, cv.height) }
    }).finally(() => { busy = false })
  }
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
// arms and hands ease toward what the camera sees, and hold a moment when it loses one (a hand at the frame's edge
// drops in and out; dropping the arm each time made it flap)
const lerpDeep = (a, b, k) => Array.isArray(b) ? b.map((x, i) => lerpDeep(a?.[i], x, k)) : b && typeof b === 'object' ? Object.fromEntries(Object.entries(b).map(([key, v]) => [key, lerpDeep(a?.[key], v, k)])) : typeof a === 'number' ? a + (b - a) * k : b
function holdArms(prev, next) {
  const out = {}
  for (const side of ['left', 'right']) {
    const n = next && next[side], p = prev && prev[side]
    if (n) { armsLost[side] = 0; out[side] = p ? lerpDeep(p, n, .5) : n }
    else if (p && (armsLost[side] = (armsLost[side] || 0) + 1) < 6) out[side] = p
  }
  return Object.keys(out).length ? out : null
}

// your camera moves your character. the picture never shows and never leaves the browser
async function camera(on) {
  if (on && !me.cam) {
    try { me.cam = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false }) } catch { me.cam = null }
    if (me.cam) {
      video = document.createElement('video'); video.muted = true; video.playsInline = true; video.srcObject = me.cam; await video.play()
      root.classList.add('tracking-wait'); retarget.calibrate()
      try { tracker = tracker || await createFaceCam() } catch (e) { console.warn('tracker failed', e) }
      root.classList.remove('tracking-wait')
    }
  } else if (!on && me.cam) { me.cam.getTracks().forEach((t) => t.stop()); me.cam = null; video = null }
  for (const b of ['lcam', 'bcam']) { $(b).classList.toggle('off', !me.cam); $(b).classList.toggle('on', !!me.cam) }
  root.classList.toggle('tracking', !!me.cam); me.dozy = 0
}
$('lcam').onclick = $('bcam').onclick = () => camera(!me.cam)

// your mic: what you say goes to him as text (the browser's own speech recognition)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition
let rec = null
function listen() {
  if (!SR || rec) return
  rec = new SR(); rec.lang = navigator.language || 'en-US'; rec.interimResults = true
  rec.onresult = (e) => {
    const r = e.results[e.results.length - 1], said = r[0].transcript
    if (!root.classList.contains('joined')) { if (r.isFinal) heardInLobby(said); return }
    $('q').value = said; if (r.isFinal) { ask(said); $('q').value = '' }
  }
  rec.onend = () => { rec = null; $('bmic').classList.remove('live'); if (micStream && !root.classList.contains('joined')) setTimeout(listen, 300) }   // the lobby keeps an ear open
  rec.onerror = () => {}
  rec.start(); $('bmic').classList.add('live')
}
// your mic's loudness moves your character's mouth (the rig's lip shapes start the same way: from your voice)
let micStream = null, micLevel = 0
async function openMic() {
  if (micStream) return true
  try { micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }) } catch { return false }
  const ac = stage()?.audio; if (!ac) return true
  if (ac.state === 'suspended') try { await ac.resume() } catch {}
  const an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(micStream).connect(an)   // only read, never played
  const buf = new Float32Array(an.fftSize)
  ;(function tick() { an.getFloatTimeDomainData(buf); let s = 0; for (const v of buf) s += v * v; const rms = Math.sqrt(s / buf.length); micLevel = Math.max(Math.min(1, (rms - .015) * 14), micLevel * .82); requestAnimationFrame(tick) })()
  return true
}
// he's in the room behind the lobby: say hi and he hears you
let lobbyHeard = false
function heardInLobby(said) {
  if (lobbyHeard) return; lobbyHeard = true
  const hi = /\b(hi|hey|hello|yo|sup|namaste|hola|morning)\b/i.test(said)
  say(hi ? "Hey! I can hear you. Come in." : "I can hear you out there. Come in.", { mark: 'arms_up' })
  const line = document.querySelector('#join .who .in'); if (line) line.textContent = hi ? '“Hey! I can hear you. Come in.”' : '“I can hear you out there. Come in.”'
  document.querySelector('#join .who .av')?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-8px) rotate(-6deg)' }, { transform: 'translateY(0)' }], { duration: 500, iterations: 2 })
}
function micUi() { for (const b of ['lmic', 'bmic']) { $(b).classList.toggle('off', !micStream); $(b).classList.toggle('on', !!micStream) } root.classList.toggle('mic-off', !micStream) }
if (!SR) { $('lmic').querySelector('.tip').textContent = 'Your voice moves your mouth'; }
$('lmic').onclick = async () => { root.classList.add('mic-tried'); if (await openMic()) { micUi(); listen() } }
$('bmic').onclick = async () => { if (!micStream && !(await openMic())) return; micUi(); if (rec) rec.stop(); else listen() }
micUi()

// sound and the lofi under him
let muted = false
$('bsnd').onclick = () => { muted = !muted; stage()?.sound.mute(muted); $('bsnd').classList.toggle('off', muted); $('bsnd').querySelector('.on').style.display = muted ? 'none' : '' }
$('bskip').onclick = () => stage()?.sound.skip()

// ---------------------------------------------------------------- the camera: across the desk from him, like a call
// W when he stands up (A crops his head), the cat's close-up while he pets her, the desk while you're still in the lobby
function shots() {
  const s = stage(); if (s) {
    const st = s.state, act = st.act && st.act.name
    st.camHold = !root.classList.contains('joined') ? 'B' : st.move ? 'W' : act === 'pet_cat' ? 'K' : window.__camOverride || (s.CAMS.M ? 'M' : 'A')
  }
  requestAnimationFrame(shots)
}
requestAnimationFrame(shots)

// his phone runs mooney: the screen in his hand is the app's paper, a receipt and the mic
function paintPhone() {
  const p = stage()?.props?.phone; if (!p) return setTimeout(paintPhone, 300)
  p.traverse((m) => {
    if (!m.material?.map?.image || m.material.map.image.width !== 15) return
    const cv = m.material.map.image, g = cv.getContext('2d')
    g.fillStyle = '#F2EFE7'; g.fillRect(0, 0, 15, 30)
    g.fillStyle = '#1A1A1A'; g.fillRect(2, 3, 6, 2)                         // the total
    g.fillStyle = '#FFFFFF'; g.fillRect(1, 7, 13, 15)                       // the receipt
    for (const [y, c, w] of [[9, '#D4622A', 7], [13, '#3A6F9F', 5], [17, '#D4622A', 8]]) { g.fillStyle = c; g.fillRect(2, y, 1, 3); g.fillStyle = '#5A5650'; g.fillRect(4, y, w, 1); g.fillStyle = '#C4C0B8'; g.fillRect(4, y + 2, 3, 1) }
    g.fillStyle = '#B85F3A'; g.fillRect(10, 25, 3, 3)                       // the mic
    g.fillStyle = '#FFFFFF'; g.fillRect(2, 25, 7, 3)
    m.material.map.needsUpdate = true
  })
}
paintPhone()

// ---------------------------------------------------------------- joining
let joinedAt = 0
function meetingCam() {
  const s = stage(); if (!s || s.CAMS.M) return
  const d = Math.PI / 180, el = 34 * d, az = 10 * d
  s.CAMS.M = s.ortho(.64, new THREE.Vector3(.04, 1.1, .3), new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)), [0, 2, 3, 4, 6, 7])
}
async function join() {
  meetingCam()
  if (root.classList.contains('joined')) return
  me.name = $('yourname').value.trim().slice(0, 28)
  $('melbl').textContent = me.name || 'You'
  try { const a = stage()?.audio; if (a && a.state === 'suspended') await a.resume() } catch {}
  root.classList.add('joined', 'intro'); joinedAt = performance.now()
  const big = { innerHTML: '', classList: { add() {} } }; big.innerHTML = [...'Ashwini Tiwari'].map((c, i) => `<i style="animation-delay:${.05 * i}s">${c === ' ' ? '&nbsp;' : c}</i>`).join(''); big.classList.add('on')
  setTimeout(() => root.classList.remove('intro'), 2300)
  setTimeout(() => { move('wave'); say(me.name ? `Hey ${me.name}.` : 'Hey, come in.', { mark: 'arms_up' }); chips() }, 900)
  setInterval(() => { const s = Math.floor((performance.now() - joinedAt) / 1000); $('timer').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }, 1000)
}
$('go').onclick = join
$('yourname').onkeydown = (e) => { if (e.key === 'Enter') join() }

$('leave').onclick = () => {
  move('wave'); say(`Thanks for coming in${me.name ? `, ${me.name}` : ''}. Talk soon.`, {})
  setTimeout(() => contactCard(true), 2600)
}

// ---------------------------------------------------------------- the things he shows you
const pop = document.createElement('div'); $('share').querySelector('.body').append(pop)
const close = () => { pop.hidden = true; pop.className = ''; pop.innerHTML = ''; root.classList.remove('sharing') }
$('share').querySelector('.stop').onclick = () => close()

const CUR = (() => { const l = navigator.language || ''; return /-IN$/i.test(l) ? '₹' : /-GB$/i.test(l) ? '£' : /^(de|fr|es|it|nl|pt|fi|el)\b/i.test(l) ? '€' : '$' })()
const CATS = [
  ['food & drink', '#D4622A', /chai|coffee|tea|latte|lunch|dinner|breakfast|food|pizza|snack|burger|biryani|samosa|zomato|swiggy|groceries|beer|drinks?|cafe|sandwich/i],
  ['transport', '#3A6F9F', /uber|ola|lyft|auto|metro|bus|cab|taxi|fuel|petrol|gas|train|rapido|parking|subway/i],
  ['shopping', '#C49A1A', /amazon|flipkart|shoes?|shirt|clothes|jeans|shopping|myntra|zara|gift/i],
  ['entertainment', '#7A4BC9', /movie|cinema|netflix|spotify|concert|game|tickets?|bowling/i],
  ['health', '#C4624A', /medicine|doctor|gym|pharmacy|meds|dentist|pills/i],
  ['utilities', '#2A6B4F', /electricity|wifi|internet|recharge|bill|rent|phone|water/i],
  ['travel', '#1A7A9A', /flight|hotel|trip|airbnb|hostel|visa/i],
  ['client & work', '#4A4AAF', /client|office|software|domain|server|laptop|figma|notion/i],
]
const catOf = (t) => CATS.find(([, , re]) => re.test(t)) || ['other', '#7A7670']
function parse(text) {
  const parts = text.toLowerCase().replace(/[₹$£€]|rs\.?|rupees?|bucks|dollars?|inr|usd/g, ' ').split(/\s*(?:,| and | & |\+)\s*/)
  return parts.map((p) => {
    const amt = (p.match(/(\d+(?:\.\d+)?)/) || [])[1]; if (!amt) return null
    const what = p.replace(amt, ' ').replace(/\b(i|spent|paid|bought|got|for|on|a|an|the|to|at|of|just|today|some)\b/g, ' ').replace(/\s+/g, ' ').trim() || 'something'
    return { t: what[0].toUpperCase() + what.slice(1), a: +amt, c: catOf(what) }
  }).filter(Boolean)
}
function mooneyDemo() {
  const clock = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const rows = [{ t: 'Chai', a: 20, c: CATS[0], time: '9:12 AM' }, { t: 'Metro card', a: 200, c: CATS[1], time: '10:03 AM' }, { t: 'Lunch', a: 180, c: CATS[0], time: '1:40 PM' }]
  pop.hidden = false; pop.className = 'phone'; root.classList.add('sharing')
  pop.innerHTML = `<button class="x" aria-label="close">×</button>
  <div class="scr"><div class="sb"><span>${clock(new Date()).replace(/ (AM|PM)/, '')}</span><span>▴▴ ▮</span></div>
    <div class="hd"><div class="day">${ICON.left}<span>Today</span>${ICON.right}</div><img src="./mooney-cow.png" alt=""></div>
    <div class="tot"><b></b><span>Spent today</span></div>
    <div class="rcpt"><div class="lbl">RECEIPT · TODAY</div><div class="rows"></div></div>
    <div class="hint">Hold the mic, or type "chai 20"</div>
    <div class="ib"><div class="pill">${ICON.pen}<input placeholder="What did you spend?"><button class="cam" aria-label="scan a receipt">${ICON.cam}</button></div><button class="mic" aria-label="hold to talk">${ICON.mic}</button></div>
  </div><div class="real"><a href="https://play.google.com/store/apps/details?id=com.octyn.mooney" target="_blank" rel="noreferrer">The real one is on Google Play</a></div>`
  const draw = (fresh = 0) => {
    pop.querySelector('.tot b').textContent = `${CUR}${rows.reduce((s, r) => s + r.a, 0).toLocaleString()}`
    pop.querySelector('.rows').innerHTML = rows.map((r, i) => `<div class="row${i < fresh ? ' new' : ''}"><i style="background:${r.c[1]}"></i><div class="b"><div class="l1"><span>${esc(r.t)}</span><b>${CUR}${r.a}</b></div><div class="l2"><span>${r.c[0].replace(/\b\w/g, (c) => c.toUpperCase())}</span><span>${r.time}</span></div></div></div>`).join('')
  }
  draw()
  let logged = 0
  const add = (text) => {
    const got = parse(text)
    if (!got.length) { pop.querySelector('.hint').textContent = 'No amount in that. Try "chai 20"'; return }
    for (const g of got.reverse()) rows.unshift({ ...g, time: clock(new Date()) })
    draw(got.length); pop.querySelector('.hint').textContent = ''
    if (++logged === 1) setTimeout(() => { say(got.length > 1 ? `${got.length} in one go, each on its own line. That's Mooney.` : "Logged. That's Mooney. Want to see the front desk next?", { mark: 'thumbs_up' }); offer = 'desk'; chips(['The front desk']) }, 400)
    else say('Logged.', { mark: 'thumbs_up' })
  }
  const inp = pop.querySelector('input')
  inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.value.trim()) { add(inp.value); inp.value = '' } }
  pop.querySelector('.x').onclick = () => { close(); if (!logged) { say('The real one is on the Play Store. Want to see the front desk?', { mark: 'present' }); offer = 'desk'; chips(['The front desk']) } }
  const mic = pop.querySelector('.mic')
  if (!SR) { mic.onclick = () => inp.focus(); return }
  let r = null
  mic.onpointerdown = (e) => { e.preventDefault(); r = new SR(); r.lang = navigator.language || 'en-US'; r.interimResults = true
    r.onresult = (ev) => { const x = ev.results[ev.results.length - 1]; inp.value = x[0].transcript; if (x.isFinal) { add(x[0].transcript); inp.value = '' } }
    r.onend = () => mic.classList.remove('rec'); r.start(); mic.classList.add('rec') }
  mic.onpointerup = mic.onpointerleave = () => { r && r.stop(); r = null }
}
function contactCard(bye = false) {
  pop.hidden = false; pop.className = 'card'; root.classList.add('sharing')
  pop.innerHTML = `<button class="x" aria-label="close">×</button><h3>${bye ? `Thanks${me.name ? `, ${esc(me.name)}` : ''}` : 'Reach Ashwini'}</h3>
    <a href="mailto:${EMAIL}">${EMAIL}</a><br><a href="/resume">Resume</a><a href="https://linkedin.com/in/ashwtiw" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://x.com/ashwtiw" target="_blank" rel="noreferrer">X</a><a href="https://github.com/lunarxx" target="_blank" rel="noreferrer">GitHub</a>${bye ? '<br><a href="#" class="again">Back to the call</a>' : ''}`
  pop.querySelector('.x').onclick = close
  const again = pop.querySelector('.again'); if (again) again.onclick = (e) => { e.preventDefault(); close() }
}

// ---------------------------------------------------------------- his room, to poke at
// tap anything in his tile and he reacts: him (a boop on the head), his mug and can (yours now; tap them in your tile
// to give them back), his phone (he shows you mooney), the cat, the record player (the next song), the lamps, his
// monitor, the shelves, the window... the cursor is your mitten; what you're over gets a little label
import * as THREE from 'three'
const reachCv = $('reach'), rg = reachCv.getContext('2d'), hitEl = $('hit'), TW = 920, TH = 690
// his picture is 16:9, scaled to the tile's height and trimmed at the sides
const PW = TH * 16 / 9, PX0 = (PW - TW) / 2
const hand = { on: false, x: 0, y: 0 }
let mine = null, pokes = 0, saidAt = 0, ripples = [], hoverName = ''
const pickOf = (a) => a[Math.floor(Math.random() * a.length)]
const fx = (f) => { try { stage()?.fx.start(f) } catch {} }
const talk = (line, mark = 'shrug', always = false) => { const now = performance.now(); if (!always && now - saidAt < 1300) return false; saidAt = now; say(line, { mark }); return true }
// a real switch on his lights: off, then back on. returns whether it's on now
function lightSwitch(name) { const L = stage()?.lights?.[name]; if (!L) return true; L.userData.off = !L.userData.off; return !L.userData.off }
const reachNow = () => null

// the room's things, where they stand (room.js), and what tapping each does
const SPOTS = [
  { name: 'record player', at: [-.43, .69, -1.67], tap: () => { stage()?.sound.skip(); talk(pickOf(['Next one.', 'Good pick.', 'Ooh, this one.']), 'thumbs_up') } },
  { name: 'records', at: [.07, .75, -1.66], tap: () => { stage()?.sound.skip(); talk('Pick anything.', 'present') } },
  { name: 'salt lamp', at: [.37, .78, -1.69], tap: () => { fx({ kind: 'light', a: { color: 'amber', strength: 1.2, where: 'room' }, dur: 1.2 }); talk("Don't mess with the lighting.") } },
  { name: 'desk lamp', at: [.62, 1.14, .84], tap: () => { const on = lightSwitch('lamp'); fx({ kind: 'sound', a: { sfx: 'blip' } }); talk(on ? 'Thank you.' : 'Hey, I need that.', on ? 'thumbs_up' : 'shrug', true) } },
  { name: 'pendant light', at: [-.1, 2.25, .1], tap: () => { const on = lightSwitch('pendant'); fx({ kind: 'sound', a: { sfx: 'blip' } }); talk(on ? 'Better.' : 'Who turned off the lights?', 'shrug', true) } },
  { name: 'his monitor', at: [0, 1.08, .84], tap: () => { talk("No peeking. It's this call's code, actually.", 'point_screen') } },
  { name: 'his pc', at: [1.0, 1.0, .72], tap: () => talk("That's where this call runs.", 'point') },
  { name: 'bookcase', at: [-1.3, 1.2, -1.7], tap: () => talk('Mostly books I mean to finish.', 'shrug') },
  { name: 'the print', at: [-.68, 1.52, -1.88], tap: () => talk('Nice eye.', 'thumbs_up') },
  { name: 'the window', at: [.72, 1.58, -1.89], tap: () => talk("It's always night in here.", 'shrug') },
  { name: 'guitar', at: [1.05, .6, -1.72], tap: () => talk("Don't. I'll start playing.", 'head_shake') },
  { name: 'clock', at: [.2, 2.4, -1.87], tap: () => talk("Don't look at the time. We're fine.", 'shrug') },
  { name: 'notebook', at: [-.72, .78, .52], tap: () => talk('My to-do list. It is long.', 'shrug') },
  { name: 'webcam', at: [.12, 1.52, .99], tap: () => talk("That's me looking at you.", 'point') },
]
const camNow = () => { const s = stage(); return s && s.CAMS[s.state.camHold || 'A'] }
const toTile = (v, c) => { const p = v.clone().project(c); return [(p.x + 1) / 2 * PW - PX0, (1 - p.y) / 2 * TH] }
// what's under a point in his tile: him, his things, the cat (a ray into his room), else the nearest spot
function under(x, y) {
  const s = stage(), c = camNow(); if (!s || !c) return null
  const ray = new THREE.Raycaster(); ray.layers.mask = c.layers.mask
  ray.setFromCamera(new THREE.Vector2((x + PX0) / PW * 2 - 1, -(y / TH * 2 - 1)), c)
  const owner = (o) => { for (let n = o; n; n = n.parent) { if (n === s.O.head) return 'head'; if (n === s.O.root) return 'him'; for (const k of ['mug', 'can', 'phone']) if (n === s.props[k]) return k; if (s.cat && n === s.cat.root) return 'cat' } return null }
  const scene = s.O.root.parent
  let solid = 0
  for (const h of ray.intersectObject(scene, true)) {   // past the see-through glows and light pools, the first solid things
    const mt = h.object.material; if (!h.object.visible || (mt && (mt.transparent || mt.depthWrite === false))) continue
    const k = owner(h.object); if (k) return { kind: k }; if (++solid >= 2) break
  }
  // small things are hard to hit exactly: near enough on screen counts
  for (const [k, o, up, r] of [['mug', s.props.mug, .05, 46], ['can', s.props.can, .06, 40], ['phone', s.props.phone, 0, 40], ['cat', s.cat && s.cat.head, 0, 50]]) {
    if (!o || !o.visible) continue; const [px, py] = toTile(o.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, up, 0)), c)
    if (Math.hypot(px - x, py - y) < r) return { kind: k }
  }
  let best = null, bd = 60
  for (const sp of SPOTS) { const [px, py] = toTile(new THREE.Vector3(...sp.at), c), d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = sp } }
  return best ? { kind: 'spot', spot: best } : { kind: 'none' }
}
const NAMES = { head: 'Ashwini', him: 'Ashwini', mug: 'his coffee', can: 'his energy drink', phone: 'his phone', cat: 'the cat' }

function tap(x, y) {
  ripples.push({ x, y, t: performance.now() })
  const u = under(x, y); if (!u) return
  const s = stage()
  if (u.kind === 'head' || u.kind === 'him') {
    pokes++
    fx({ kind: 'shake', a: { amount: 1.4 }, dur: .3 }); fx({ kind: 'sound', a: { sfx: 'thud' } })
    fx({ kind: 'face', a: { mood: pokes > 3 ? 'angry' : 'surprised' }, dur: 1.3 })
    talk(u.kind === 'head' ? pickOf(pokes > 3 ? ['Okay, I felt that.', 'You do this to every candidate?'] : ['Hey.', 'Ow.', 'Is that part of the interview?']) : 'Personal space, please.', 'shrug')
  } else if (u.kind === 'mug' || u.kind === 'can') {
    if (mine) return
    s.props[u.kind].visible = false; mine = u.kind; root.classList.add('mug-mine'); root.dataset.mine = u.kind
    fx({ kind: 'sound', a: { sfx: 'blip' } }); fx({ kind: 'face', a: { mood: 'surprised' }, dur: 1.4 })
    setTimeout(() => talk(u.kind === 'mug' ? pickOf(["That's my coffee.", 'I was drinking that.', 'Bold move.']) : pickOf(["That's my energy drink.", 'You need that more than me?']), 'point'), 300)
  } else if (u.kind === 'phone') { if (!root.classList.contains('sharing')) play('mooney') }
  else if (u.kind === 'cat') { fx({ kind: 'particles', a: { kind: 'hearts', anchor: 'cat', n: 10 }, dur: 1.6 }); talk(pickOf(['She likes you.', 'Careful, she bites.', 'Now she will never leave.']), 'present') }
  else if (u.kind === 'spot') u.spot.tap()
  else { emit({ type: 'glance' }); if (Math.random() < .35) talk(pickOf(['Hm?', "What's that?", 'Lost something?']), 'shrug') }
}
// what you took, back where it was: tap it in your tile
$('me').addEventListener('click', () => {
  if (!mine) return
  stage().props[mine].visible = true; mine = null; root.classList.remove('mug-mine')
  fx({ kind: 'face', a: { mood: 'happy' }, dur: 1.2 }); talk(pickOf(['Thank you.', 'Finally.']), 'thumbs_up')
})

hitEl.addEventListener('pointermove', (e) => { const r = hitEl.getBoundingClientRect(); hand.on = true; hand.x = (e.clientX - r.left) / r.width * TW; hand.y = (e.clientY - r.top) / r.height * TH })
hitEl.addEventListener('pointerleave', () => { hand.on = false })
hitEl.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(hand.x, hand.y) })

// your mitten for a cursor, what's under it, and a ring where you tap
let hoverAt = 0
function drawTaps(now) {
  rg.clearRect(0, 0, reachCv.width, reachCv.height)
  if (root.classList.contains('sharing')) return
  ripples = ripples.filter((r) => now - r.t < 500)
  for (const r of ripples) { const u = (now - r.t) / 500; rg.strokeStyle = `rgba(241,217,168,${1 - u})`; rg.lineWidth = 3; rg.beginPath(); rg.arc(r.x, r.y, 10 + u * 34, 0, Math.PI * 2); rg.stroke() }
  if (!hand.on) return
  if (now - hoverAt > 120) { hoverAt = now; const u = under(hand.x, hand.y); hoverName = !u ? '' : u.kind === 'spot' ? u.spot.name : NAMES[u.kind] || '' }
  const L = me.look, ink = '#4A3A44'
  rg.save(); rg.translate(hand.x, hand.y); rg.rotate(-.35); rg.scale(1.4, 1.4); rg.fillStyle = L.skin; rg.strokeStyle = ink; rg.lineWidth = 2
  const blob = (bx, by, rx, ry, rot = 0) => { rg.beginPath(); rg.ellipse(bx, by, rx, ry, rot, 0, Math.PI * 2); rg.fill(); rg.stroke() }
  rg.fillStyle = L.top; blob(0, 26, 15, 7); rg.fillStyle = L.skin
  for (const [fx2, fy2, r] of [[-8, -14, -.2], [0, -17, 0], [8, -14, .2]]) blob(fx2, fy2, 5, 9, r)
  blob(-14, 4, 5, 8, -.9); blob(0, 5, 14, 13)
  rg.restore()
  if (hoverName) {
    rg.font = '600 18px "JetBrains Mono", monospace'; const w = rg.measureText(hoverName).width + 20, lx = Math.min(TW - w - 8, hand.x + 22), ly = hand.y - 40
    rg.fillStyle = '#16171Be6'; rg.beginPath(); rg.roundRect(lx, ly, w, 30, 8); rg.fill(); rg.fillStyle = '#F1D9A8'; rg.fillText(hoverName, lx + 10, ly + 21)
  }
}
function tapLoop(now) { if (root.classList.contains('joined')) drawTaps(now); requestAnimationFrame(tapLoop) }
requestAnimationFrame(tapLoop)

// ---------------------------------------------------------------- the nudge: turn your camera on, say hi
// in the lobby your character dozes off with the camera off and perks up when it's on; two notes point at the buttons.
// in the call, a while in with the camera still off, he mentions it, once
setInterval(() => { if (!me.cam && !root.classList.contains('joined')) me.dozy = (me.dozy || 0) + 1 }, 1000)
// only in a real lull: joined a while, him quiet, nothing said for a bit (on a timer it talked over his answers)
let camNudged = false
setInterval(() => {
  const st = stage()?.state, now = performance.now()
  if (camNudged || me.cam || !root.classList.contains('joined') || now - joinedAt < 40000 || st?.line || now - lastSaid < 8000) return
  camNudged = true; say('You can turn your camera on, by the way. Your character copies you. I never see your face.', { mark: 'point' })
}, 2000)

// ---------------------------------------------------------------- your character, alive in the lobby
// it talks in speech bubbles (typed out while its mouth moves), follows your cursor with its eyes and head, giggles when
// poked, reacts to what you put on it, dozes when you leave it, and when things go quiet it nudges you toward the next
// step: your name, the camera, the mic, the big button
const bubble = $('bubble'), btxt = bubble.querySelector('.txt')
let bubbleUntil = 0, bubbleTimer = null, typeTimer = null, lastLine = '', lastAction = performance.now()
const inLobby = () => !root.classList.contains('joined')
function speak(text, { small = false, force = false } = {}) {
  if (!inLobby() || (!force && performance.now() < bubbleUntil - 600) || text === lastLine) return
  lastLine = text; clearTimeout(bubbleTimer); clearInterval(typeTimer)
  bubble.classList.toggle('small', small); btxt.textContent = ''
  let i = 0; typeTimer = setInterval(() => { btxt.textContent = text.slice(0, ++i); placeBubble(); if (i >= text.length) clearInterval(typeTimer) }, 32)
  me.talkUntil = performance.now() + Math.min(2600, 300 + text.length * 42)
  bubble.style.setProperty('--rot', `${(Math.random() * 4 - 3).toFixed(1)}deg`)
  bubble.classList.remove('on'); void bubble.offsetWidth; bubble.classList.add('on'); placeBubble()
  const stay = 1400 + text.length * 60; bubbleUntil = performance.now() + stay
  bubbleTimer = setTimeout(() => { bubble.classList.remove('on'); lastLine = '' }, stay)
}
// beside the head, tail to it; on the other side when there's no room
function placeBubble() {
  const h = cast && cast.head; if (!h) return
  const tile = $('tile'), k = tile.clientWidth / h.w, hx = h.x * k, hy = h.y * k, r = h.r * k
  const bw = bubble.offsetWidth, bh = bubble.offsetHeight, flip = hx + r * .55 + bw > tile.clientWidth - 16
  bubble.classList.toggle('flip', flip)
  const x = flip ? hx - r * .55 - bw : hx + r * .55, y = Math.max(12, hy - r * 1.05 - bh)
  bubble.style.setProperty('--bx', `${Math.round(x)}px`); bubble.style.setProperty('--by', `${Math.round(y)}px`)
}
const any = (a) => a[Math.floor(Math.random() * a.length)]
const said = (k) => { lastAction = performance.now() }

// your cursor: it looks at it. moving wakes it up
const gaze = { yaw: 0, pitch: 0, lx: 0, ly: 0, want: { yaw: 0, pitch: 0, lx: 0, ly: 0 } }
addEventListener('pointermove', (e) => {
  if (!inLobby()) return
  const r = $('tile').getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .42
  const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width * .9))), dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height * .9)))
  gaze.want = { yaw: dx * .62, pitch: dy * .3, lx: dx, ly: -dy }
  gaze.over = e.target === $('avcv')
  if ((me.dozy || 0) > 9) speak(any(['Oh! I\'m up.', 'I wasn\'t sleeping.', 'Huh? Who\'s there?']), { force: true })
  me.dozy = 0
})
// poked: a squishy giggle
let pokedAt = -9
$('avcv').addEventListener('pointerdown', () => { pokedAt = performance.now() / 1000; me.dozy = 0; said(); speak(any(['Hey!', 'Hehe, stop.', 'Boop received.', 'That tickles.', 'Again? Okay.', 'I\'m ticklish there.']), { force: true }) })
// mixed into the idle pose each frame (the loop calls lobbyPose)
function lobbyPose(p, t) {
  if (!inLobby() || me.cam) return p
  for (const k of ['yaw', 'pitch', 'lx', 'ly']) gaze[k] += (gaze.want[k] - gaze[k]) * .12
  const doze = (me.dozy || 0) > 5, u = t - pokedAt, poke = u < .8 ? 1 - u / .8 : 0
  const q = { ...p }
  if (!doze) { q.yaw = gaze.yaw; q.pitch = gaze.pitch; q.lookX = gaze.lx * 1.2; q.lookY = gaze.ly * .9; q.roll = (q.roll || 0) - gaze.yaw * .22; q.x = (q.x || 0) + gaze.yaw * 22 }   // a curious tilt toward your cursor
  if (!doze && gaze.over) { q.smile = Math.max(q.smile || 0, .85); q.browUp = .5 }   // under your cursor: delighted
  if (poke) { q.smile = 1; q.squint = .6; q.blinkL = q.blinkR = 0; q.jaw = .35 * poke; q.roll = Math.sin(u * 28) * .12 * poke; q.y = -10 * Math.sin(u * Math.PI / .8) }
  return q
}

// what you put on it, it notices
const HAT = { beanie: 'Cozy.', cap: 'Very cool. Very sideways.', bucket: 'Gone fishing.', headphones: 'Can\'t hear you, vibing.', party: 'Is it a party? Is it MY party?', sprout: 'I\'m growing!', none: 'Hat hair. Sorry.' }
const PAT = { stripes: 'Stripes. Bold.', spots: 'Polka time.', yoke: 'Two-tone. Fancy.', plain: 'Classic.' }
const EYE = { lashes: 'Fluttery.', sleepy: 'Long day.', round: 'Wide awake!', tall: 'Hm. Tall eyes.', dots: 'Me again.' }
const CHEEK = { blush: 'Stop, you\'re making me blush.', freckles: 'Cute, right?', none: 'Fresh face.' }
function noticed(b) {
  said()
  if (b.dataset.shuffle !== undefined) return speak(any(['Whoa. New me.', 'Who am I now?', 'Again! Again!', 'Plot twist.']), { force: true })
  if (b.dataset.p) return speak(any([`${b.dataset.p}! Good pick.`, `Feeling very ${b.dataset.p} today.`, `${b.dataset.p} it is.`]), { force: true })
  if (b.dataset.g !== undefined) return speak(me.look.glasses ? 'I can see everything now.' : 'Blurry. Fine.', { force: true })
  const k = b.dataset.k, v = b.dataset.v
  if (k === 'hat') return speak(HAT[v], { force: true })
  if (k === 'pattern') return speak(PAT[v], { force: true })
  if (k === 'eyes') return speak(EYE[v], { force: true })
  if (k === 'cheeks') return speak(CHEEK[v], { force: true })
  if (k) speak(any(['Ooh, nice colour.', 'This one suits me.', 'Yes. Yes.', 'Hmm, okay.']))
}
$('look').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && !b.dataset.tab) setTimeout(() => noticed(b), 60) })
$('look').addEventListener('change', (e) => { if (e.target.id === 'headk') { said(); speak(+e.target.value > 1.08 ? 'Big brain.' : +e.target.value < .93 ? 'Tiny head, big ideas.' : 'Just right.', { force: true }) } })
let nameTimer = null
$('yourname').addEventListener('input', () => { said(); clearTimeout(nameTimer); nameTimer = setTimeout(() => { if (me.name) speak(any([`Hi, ${me.name}!`, `${me.name}. I like it.`, `Nice to meet me, ${me.name}.`]), { force: true }) }, 900) })
$('lcam').addEventListener('click', () => setTimeout(() => { said(); if (me.cam) speak('Ooh, I can move!', { force: true }) }, 1500))
$('lmic').addEventListener('click', () => setTimeout(() => { said(); if (micStream) speak('I can hear you!', { force: true }) }, 900))

// hello, and when things go quiet: a doze, or a nudge toward the next step (each once), the control it means wiggles
// its first words tell you where you are, nervously, as if you're the one being interviewed
setTimeout(() => speak("Psst… we're interviewing Ashwini. The guy with the TV for a head.", { force: true }), 1200)
setTimeout(() => speak(any(['Dress me up first?', 'Do I look okay?', 'Should I wear a hat?']), { force: true }), 6500)
const NUDGES = [
  { when: () => !me.name, line: 'Psst. Type your name, I\'m curious.', el: 'yourname' },
  { when: () => !me.cam, line: 'The camera button. I wanna move.', el: 'lcam' },
  { when: () => !micStream, line: 'Say something! Out loud!', el: 'lmic' },
  { when: () => true, line: 'Ready? The big orange button.', el: 'go' },
]
let dozeSaid = false
setInterval(() => {
  if (!inLobby()) return
  const quiet = performance.now() - lastAction
  if ((me.dozy || 0) > 7 && !dozeSaid) { dozeSaid = true; speak('Zzz…', { small: true }) }
  if ((me.dozy || 0) < 3) dozeSaid = false
  if (quiet < 7000 || performance.now() < bubbleUntil) return
  const n = NUDGES.find((x) => !x.done && x.when()); if (!n) return
  n.done = true; lastAction = performance.now(); speak(n.line, { force: true })
  const el = $(n.el); el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle')
}, 1000)

