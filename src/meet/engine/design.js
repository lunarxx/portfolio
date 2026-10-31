/* the design tools on stream (live build spec, "the display"): what the maker writes, made by hand in front of chat.
     the whiteboard   the roadmap written out in marker, steps ticked, chat's ideas on sticky notes, sketches drawn
                      stroke by stroke with the pen moving along them
     the sprite tool  pixel art painted pixel by pixel (paint.js: outline, fills, highlights), frames copied and
                      changed, the animation playing in the preview
     the level tool   a level laid tile by tile, ground first, with its legend
   every call resolves when it's done drawing. the sketches the maker writes are cleaned before they touch the page:
   shapes and text only, geometry and stroke attributes only, nothing that loads or runs anything */
import { pixelOrder, frameOrder, tileOrder, tileLook, boardChanges, roadmapOf } from './paint.js';

/* his hands (his note: "again hands are on the air but white board is being typed on"): every stroke waits while his
   hands are off the mouse, and the tools' own clock stops with it, so nothing catches up in a burst after */
let handsBusy = () => false, paused = 0;
const dnow = () => performance.now() - paused;
const sleep = async ms => { await new Promise(r => setTimeout(r, ms)); if (handsBusy()) { const p0 = performance.now(); while (handsBusy()) await new Promise(r => setTimeout(r, 100)); paused += performance.now() - p0; } };
const frame = () => new Promise(r => requestAnimationFrame(r));
const NS = 'http://www.w3.org/2000/svg';
const INK = '#1B1D22', RED = '#B4553E', HAND = "'Gochi Hand', cursive", PX = "'VT323', monospace";
const NOTE = ['#F3D38A', '#CFE0C3', '#F2C4B8', '#F6E7C8'];
const W = 1236, H = 756;

/* ---------- the maker's svg, cleaned ---------- */
const TAGS = new Set(['svg', 'g', 'path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'text', 'tspan']);
const ATTRS = new Set(['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points', 'transform', 'fill', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'font-size', 'text-anchor', 'opacity', 'viewBox', 'dx', 'dy', 'font-weight']);
function clean(node) {
  if (node.nodeType === 3) return document.createTextNode(node.textContent);
  if (node.nodeType !== 1) return null;
  const tag = node.localName;
  if (!TAGS.has(tag)) return null;
  const el = document.createElementNS(NS, tag === 'svg' ? 'g' : tag);
  for (const a of [...node.attributes]) {
    if (!ATTRS.has(a.name) || /url\(|javascript:|expression|[<>]/i.test(a.value) || (tag === 'svg' && a.name !== 'viewBox')) continue;
    if (tag !== 'svg') el.setAttribute(a.name, a.value);
  }
  for (const c of node.childNodes) { const k = clean(c); if (k) el.appendChild(k); }
  return el;
}
function parseSketch(text) {
  const doc = new DOMParser().parseFromString(String(text || ''), 'image/svg+xml'), root = doc.documentElement;
  if (!root || root.localName !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;
  const vb = (root.getAttribute('viewBox') || '0 0 400 300').split(/[\s,]+/).map(Number);
  return { vb: vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0 ? vb : [0, 0, 400, 300], g: clean(root) };
}
const leaves = g => [...g.querySelectorAll('path,line,polyline,polygon,circle,ellipse,rect,text')];

export function createDesign(root, { onTool = () => {}, busy = null } = {}) {
  if (busy) handsBusy = busy;
  root.innerHTML = `<div class="dtabs"><div data-t="board">whiteboard</div><div data-t="pixels">sprite</div><div data-t="level">level</div></div>
    <div class="dtool" data-t="board"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"></svg></div>
    <div class="dtool" data-t="pixels"><canvas width="${W}" height="${H}"></canvas></div>
    <div class="dtool" data-t="level"><canvas width="${W}" height="${H}"></canvas></div>`;
  const $ = s => root.querySelector(s);
  const svg = $('.dtool[data-t=board] svg'), pc = $('.dtool[data-t=pixels] canvas'), lc = $('.dtool[data-t=level] canvas');
  let tool = 'board';
  function use(t) {
    tool = t;
    for (const el of root.querySelectorAll('[data-t]')) el.classList.toggle('on', el.dataset.t === t);
    onTool(t);
  }
  const mk = (tag, attrs = {}, parent) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); if (parent) parent.appendChild(el); return el; };

  /* ---------- the whiteboard ---------- */
  svg.innerHTML = `<defs><filter id="marker" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter></defs>
    <rect x="12" y="10" width="${W - 24}" height="${H - 24}" rx="8" fill="#EDE6D8" stroke="#CFC6B4" stroke-width="3"/>
    <rect x="12" y="10" width="${W - 24}" height="${H - 24}" rx="8" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1"/>`;
  const road = mk('g', { filter: 'url(#marker)' }, svg), sketches = mk('g', {}, svg), notes = mk('g', {}, svg);
  const pen = mk('circle', { r: 6, fill: INK, opacity: 0 }, svg);
  { const tray = mk('g', { transform: `translate(${W - 250} ${H - 30})` }, svg); mk('rect', { x: 0, y: 0, width: 200, height: 10, rx: 3, fill: '#BDB3A0' }, tray);
    [[18, INK], [74, RED], [130, '#C99A45']].forEach(([x, c]) => { mk('rect', { x, y: -9, width: 44, height: 10, rx: 4, fill: c }, tray); mk('rect', { x: x + 36, y: -9, width: 8, height: 10, rx: 2, fill: '#E8E1D3' }, tray); }); }
  const penAt = (x, y) => { pen.setAttribute('cx', x); pen.setAttribute('cy', y); pen.setAttribute('opacity', .85); };
  const penOff = () => pen.setAttribute('opacity', 0);
  let rm = { title: '', about: '', steps: [] };
  const rows = [];   // the steps' text elements
  async function write(el, text, cps = 24) {
    el.textContent = '';
    const x = +el.getAttribute('x'), y = +el.getAttribute('y');
    for (let i = 1; i <= text.length; i++) {
      el.textContent = text.slice(0, i);
      if (i % 2 === 0 || i === text.length) { let w = 0; try { w = el.getComputedTextLength(); } catch {} penAt(x + w + 4, y - 6); }
      await sleep(1000 / cps * (text[i - 1] === ' ' ? .5 : 1));
    }
  }
  async function stroke(el, speed = 620) {
    let len = 0; try { len = el.getTotalLength(); } catch {}
    if (!len) { el.style.visibility = 'visible'; return; }
    el.style.strokeDasharray = `${len} ${len}`; el.style.strokeDashoffset = len; el.style.visibility = 'visible';
    const ms = Math.max(160, Math.min(1500, len / speed * 1000)), t0 = dnow();
    const toBoard = svg.getScreenCTM() && svg.getScreenCTM().inverse();
    for (;;) {
      const u = Math.min(1, (dnow() - t0) / ms);
      el.style.strokeDashoffset = len * (1 - u);
      try { const p = el.getPointAtLength(len * u), m = el.getScreenCTM(); if (m && toBoard) { const q = new DOMPoint(p.x, p.y).matrixTransform(m).matrixTransform(toBoard); penAt(q.x, q.y); } } catch {}
      if (u >= 1) break;
      await frame();
    }
    el.style.strokeDasharray = ''; el.style.strokeDashoffset = '';
  }
  const shortStep = t => { const name = t.split(':')[0].trim(); return name.length > 34 ? name.slice(0, 33) + '…' : name; };
  let lh = 42;   // the steps' line height: as big as the board allows for how many there are
  const stepY = i => 162 + i * lh;
  async function tick(i) {
    const y = stepY(i);
    const p = mk('path', { d: `M 49 ${y - 13} L 57 ${y - 4} L 75 ${y - 30}`, fill: 'none', stroke: RED, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, road);
    p.style.visibility = 'hidden'; await stroke(p, 260);
    if (rows[i]) rows[i].setAttribute('fill', '#6B6558');
  }
  const board = {
    async roadmap(text) {
      use('board');
      const next = roadmapOf(text);
      if (!rm.steps.length && next.steps.length) {   // the ideas make room: their heading goes, the notes slide to the side
        if (ideasHead) { ideasHead.remove(); ideasHead = null; }
        while (notes.children.length > 6) notes.firstElementChild.remove();
        [...notes.children].forEach((g, k) => placeNote(g, k, false));
        await sleep(750);
      }
      if (!rm.steps.length) lh = Math.max(30, Math.min(48, Math.floor((H - 200) / Math.max(10, next.steps.length))));
      for (const c of boardChanges(rmText(rm), text)) {
        if (c.kind === 'title') { const t = road.querySelector('.title') || mk('text', { class: 'title', x: 44, y: 72, 'font-size': 54, fill: INK, 'font-family': HAND }, road); await write(t, c.text, 16); }
        else if (c.kind === 'about') { const t = road.querySelector('.about') || mk('text', { class: 'about', x: 46, y: 112, 'font-size': 23, fill: '#5A554C', 'font-family': HAND }, road); await write(t, c.text.length > 56 ? c.text.slice(0, 55) + '…' : c.text, 34); }
        else if (c.kind === 'step') {
          const y = stepY(c.index);
          if (!rows[c.index]) { const b = mk('rect', { x: 46, y: y - 23, width: 23, height: 23, rx: 2, fill: 'none', stroke: INK, 'stroke-width': 2.5 }, road); b.style.visibility = 'hidden'; await stroke(b, 300); }
          const t = rows[c.index] || (rows[c.index] = mk('text', { x: 84, y, 'font-size': Math.round(lh * .7), fill: INK, 'font-family': HAND }, road));
          await write(t, shortStep(c.text), 26);
          if (c.done) await tick(c.index);
        }
        else if (c.kind === 'tick') await tick(c.index);
        await sleep(120);
      }
      rm = next; penOff();
    },
    async note({ text, who }) {
      use('board');
      const big = !rm.steps.length, i = notes.children.length, col = NOTE[i % NOTE.length];
      if (big && !ideasHead) { ideasHead = mk('text', { x: 70, y: 118, 'font-size': 46, fill: INK, 'font-family': HAND, filter: 'url(#marker)' }, svg); await write(ideasHead, 'ideas from chat', 18); }
      if (i >= (big ? 12 : 6)) notes.firstElementChild.remove();
      [...notes.children].forEach((g, k) => placeNote(g, k, big));
      const g = mk('g', {}, notes);
      placeNote(g, notes.children.length - 1, big, true);
      mk('rect', { x: 0, y: 0, width: 136, height: 100, fill: col, stroke: '#00000018' }, g);
      mk('rect', { x: 0, y: 0, width: 136, height: 12, fill: '#00000010' }, g);
      const lines = wrap(text, 13).slice(0, 3);
      for (const [k, l] of lines.entries()) await write(mk('text', { x: 10, y: 34 + k * 21, 'font-size': 20, fill: INK, 'font-family': HAND }, g), l, 26);
      if (who) await write(mk('text', { x: 126, y: 92, 'font-size': 16, fill: '#5A554C', 'font-family': HAND, 'text-anchor': 'end' }, g), `- ${who}`, 30);
      penOff();
    },
    async sketch(text) {
      use('board');
      const s = parseSketch(text); if (!s) return;
      const old = [...sketches.children];
      if (old.length >= 2) old[0].remove();
      if (sketches.lastElementChild) place(sketches.lastElementChild, 1);
      const holder = mk('svg', { viewBox: s.vb.join(' '), preserveAspectRatio: 'xMidYMid meet', overflow: 'visible' }, sketches);
      place(holder, 0);
      const g = mk('g', { filter: 'url(#marker)', fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, holder);
      g.appendChild(s.g);
      const parts = leaves(g);
      for (const el of parts) el.style.visibility = 'hidden';
      for (const el of parts) {
        if (el.localName === 'text') { const full = el.textContent; el.style.visibility = 'visible'; if (!el.getAttribute('fill')) el.setAttribute('fill', INK); el.setAttribute('stroke', 'none'); el.setAttribute('font-family', HAND);
          el.textContent = ''; for (let i = 1; i <= full.length; i++) { el.textContent = full.slice(0, i); await sleep(45); } }
        else await stroke(el);
        await sleep(90 + Math.random() * 120);
      }
      penOff();
    },
  };
  const SLOTS = [[580, 28, 480, 356], [600, 398, 420, 300]];
  function place(el, k) { const [x, y, w, h] = SLOTS[k]; el.setAttribute('x', x); el.setAttribute('y', y); el.setAttribute('width', w); el.setAttribute('height', h); }
  /* a note's place: big across the board while there's no roadmap yet (ideas), a column at the side after */
  let ideasHead = null;
  function placeNote(g, k, big, now = false) {
    const x = big ? 70 + (k % 4) * 285 : 1080, y = big ? 160 + Math.floor(k / 4) * 190 : 24 + k * 110, sc = big ? 1.45 : 1, rot = [-2.5, 1.8, -1.2, 2.4, -1.8, 1.1][k % 6];
    Object.assign(g.style, { transformBox: 'fill-box', transformOrigin: 'center', transition: now ? 'none' : 'transform .7s ease' });
    g.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${sc})`;
  }
  function wrap(text, n) { const out = []; let cur = ''; for (const w of String(text).split(/\s+/)) { if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; }
  const rmText = r => r.title || r.steps.length ? `# ${r.title}\n${r.about}\n${r.steps.map(s => `- [${s.done ? 'x' : ' '}] ${s.text}`).join('\n')}\n` : '';

  /* ---------- the sprite tool ---------- */
  const px = pc.getContext('2d');
  let sprite = null, anim = 0;
  function spriteOf(art, path) {
    const palette = {}; for (const [k, v] of Object.entries((art && art.palette) || {})) if (k.length === 1 && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) palette[k] = v;
    let frames = Array.isArray(art && art.frames) ? art.frames : Array.isArray(art && art.pixels) ? [art.pixels] : [];
    frames = frames.filter(Array.isArray).map(f => f.map(String)).slice(0, 12);
    const w = Math.min(64, (art.size && +art.size[0]) || Math.max(1, ...frames.flat().map(r => r.length))), h = Math.min(64, (art.size && +art.size[1]) || Math.max(1, ...frames.map(f => f.length)));
    return { name: (art && art.name) || path.split('/').pop().replace('.json', ''), path, palette, frames, w, h, cells: frames.map(() => new Array(w * h).fill('.')), shown: 0, cur: null, pick: null };
  }
  function drawSprite(t = dnow()) {
    const s = sprite; px.fillStyle = '#1E1C1A'; px.fillRect(0, 0, W, H);
    if (!s) return;
    px.font = `26px ${PX}`; px.fillStyle = '#8E8779'; px.fillText(`${s.path}  ·  ${s.w}×${s.h}${s.frames.length > 1 ? `  ·  ${s.frames.length} frames` : ''}`, 24, 34);
    const keys = Object.keys(s.palette);
    keys.forEach((k, i) => { const y = 60 + i * 52; px.fillStyle = '#4A443C'; px.fillRect(22, y - 2, 46, 46); px.fillStyle = s.palette[k]; px.fillRect(24, y, 42, 42); if (s.pick === k) { px.strokeStyle = '#F1D9A8'; px.lineWidth = 3; px.strokeRect(20.5, y - 3.5, 49, 49); } });
    const cell = Math.max(2, Math.floor(Math.min(760 / s.w, 630 / s.h))), ox = 100 + Math.floor((780 - cell * s.w) / 2), oy = 56 + Math.floor((640 - cell * s.h) / 2);
    const f = s.cells[s.shown];
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const k = f[y * s.w + x];
      px.fillStyle = k !== '.' && s.palette[k] ? s.palette[k] : (x + y) % 2 ? '#2B2825' : '#25221F';
      px.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
    if (cell >= 12) { px.strokeStyle = '#00000030'; px.lineWidth = 1; for (let x = 0; x <= s.w; x++) { px.beginPath(); px.moveTo(ox + x * cell + .5, oy); px.lineTo(ox + x * cell + .5, oy + s.h * cell); px.stroke(); } for (let y = 0; y <= s.h; y++) { px.beginPath(); px.moveTo(ox, oy + y * cell + .5); px.lineTo(ox + s.w * cell, oy + y * cell + .5); px.stroke(); } }
    if (s.cur) { px.strokeStyle = '#F1D9A8'; px.lineWidth = 3; px.strokeRect(ox + s.cur[0] * cell - 1.5, oy + s.cur[1] * cell - 1.5, cell + 3, cell + 3); }
    /* the preview (playing, once there's more than one frame) and the frames */
    px.fillStyle = '#8E8779'; px.font = `22px ${PX}`; px.fillText('preview', 920, 76);
    px.fillStyle = '#16171B'; px.fillRect(920, 86, 290, 290);
    const ps = Math.max(1, Math.floor(250 / Math.max(s.w, s.h))), pf = s.done && s.frames.length > 1 ? Math.floor(t / 160) % s.frames.length : s.shown;
    mini(s.cells[pf], 920 + Math.floor((290 - ps * s.w) / 2), 86 + Math.floor((290 - ps * s.h) / 2), ps);
    if (s.frames.length > 1) {
      px.fillStyle = '#8E8779'; px.fillText('frames', 920, 412);
      const ts = Math.max(1, Math.floor(60 / Math.max(s.w, s.h)));
      s.frames.forEach((_, i) => { const x = 920 + (i % 4) * 74, y = 424 + Math.floor(i / 4) * 74; px.fillStyle = '#16171B'; px.fillRect(x, y, 68, 68); mini(s.cells[i], x + 4, y + 4, ts); if (i === s.shown && !s.done) { px.strokeStyle = '#E3A94F'; px.lineWidth = 2; px.strokeRect(x - 1, y - 1, 70, 70); } });
    }
  }
  function mini(cells, x0, y0, sc) { const s = sprite; for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const k = cells[y * s.w + x]; if (k !== '.' && s.palette[k]) { px.fillStyle = s.palette[k]; px.fillRect(x0 + x * sc, y0 + y * sc, sc, sc); } } }
  async function paintList(list, maxMs, f) {
    const s = sprite, rate = Math.max(26, list.length / (maxMs / 1000));
    let i = 0, t0 = dnow(), last = null;
    while (i < list.length) {
      const [x, y, k] = list[i];
      if (k !== last) { s.pick = k === '.' ? null : k; s.cur = [x, y]; drawSprite(); await sleep(last === null ? 250 : 380); t0 = dnow() - i / rate * 1000; last = k; }
      const want = Math.min(list.length, Math.floor((dnow() - t0) / 1000 * rate) + 1);
      while (i < want && list[i][2] === last) { const [a, b, c] = list[i]; s.cells[f][b * s.w + a] = c; s.cur = [a, b]; i++; }
      drawSprite(); await frame();
    }
    s.cur = null; drawSprite();
  }
  async function paintSprite(art, path) {
    use('pixels');
    cancelAnimationFrame(anim);
    sprite = spriteOf(art, path); drawSprite();
    const s = sprite;
    for (let f = 0; f < s.frames.length; f++) {
      s.shown = f;
      if (f === 0) await paintList(pixelOrder(s.frames[0], s.palette), 30000, 0);
      else { s.cells[f] = s.cells[f - 1].slice(); drawSprite(); await sleep(500); await paintList(frameOrder(s.frames[f - 1], s.frames[f], s.palette), 9000, f); }
      await sleep(250);
    }
    s.done = true; s.shown = 0;
    const loop = () => { if (sprite === s) { drawSprite(); anim = requestAnimationFrame(loop); } }; loop();
  }

  /* ---------- the level tool ---------- */
  const lx = lc.getContext('2d');
  let lvl = null;
  function drawTile(c, x, y, s) {
    const look = tileLook(lvl.legend[c] || c);
    const r = (k) => { const v = Math.sin((x * 31 + y * 17 + k) * 12.9898) * 43758.5453; return v - Math.floor(v); };
    lx.fillStyle = look.color;
    if (look.kind === 'solid') { lx.fillRect(x, y, s, s); lx.fillStyle = '#A88B68'; lx.fillRect(x, y, s, Math.max(2, s / 10)); lx.fillStyle = '#6E5A43'; for (let k = 0; k < 2; k++) lx.fillRect(x + r(k) * (s - 3), y + 4 + r(k + 5) * (s - 7), 3, 3); }
    else if (look.kind === 'platform') { lx.fillRect(x, y, s, s * .45); lx.fillStyle = '#CBA679'; lx.fillRect(x, y, s, Math.max(2, s / 10)); }
    else if (look.kind === 'coin') { lx.beginPath(); lx.arc(x + s / 2, y + s / 2, s * .28, 0, Math.PI * 2); lx.fill(); lx.fillStyle = '#F1D9A8'; lx.fillRect(x + s * .4, y + s * .32, 3, 3); }
    else if (look.kind === 'enemy') { lx.fillRect(x + s * .12, y + s * .25, s * .76, s * .75); lx.fillStyle = '#F1D9A8'; lx.fillRect(x + s * .3, y + s * .45, 3, 3); lx.fillRect(x + s * .6, y + s * .45, 3, 3); }
    else if (look.kind === 'player') { lx.fillRect(x + s * .15, y + s * .1, s * .7, s * .55); lx.fillStyle = '#1B1D22'; lx.fillRect(x + s * .25, y + s * .18, s * .5, s * .38); lx.fillStyle = '#F1D9A8'; lx.fillRect(x + s * .35, y + s * .65, s * .3, s * .35); }
    else if (look.kind === 'hazard') { lx.beginPath(); for (const o of [0, .5]) { lx.moveTo(x + s * o, y + s); lx.lineTo(x + s * (o + .25), y + s * .35); lx.lineTo(x + s * (o + .5), y + s); } lx.fill(); }
    else if (look.kind === 'goal') { lx.fillStyle = '#D8D2C4'; lx.fillRect(x + s * .2, y, 3, s); lx.fillStyle = look.color; lx.beginPath(); lx.moveTo(x + s * .2 + 3, y + 2); lx.lineTo(x + s * .9, y + s * .25); lx.lineTo(x + s * .2 + 3, y + s * .48); lx.fill(); }
    else { lx.fillRect(x + 1, y + 1, s - 2, s - 2); lx.fillStyle = '#16171B'; lx.font = `${Math.floor(s * .8)}px ${PX}`; lx.fillText(c, x + s * .3, y + s * .8); }
  }
  function drawLevel() {
    lx.fillStyle = '#1E1C1A'; lx.fillRect(0, 0, W, H);
    if (!lvl) return;
    const L = lvl;
    lx.font = `26px ${PX}`; lx.fillStyle = '#8E8779'; lx.fillText(`${L.path}  ·  ${L.cols}×${L.rows.length}`, 24, 34);
    Object.entries(L.legend).slice(0, 12).forEach(([c, name], i) => { const y = 60 + i * 44; drawTileAt(c, 24, y, 32); lx.fillStyle = '#D8D2C4'; lx.font = `22px ${PX}`; lx.fillText(`${c}  ${String(name).slice(0, 16)}`, 66, y + 24); });
    lx.fillStyle = '#16171B'; lx.fillRect(L.ox, L.oy, L.cell * L.cols, L.cell * L.rows.length);
    lx.fillStyle = '#211F1C'; for (let x = 0; x <= L.cols; x++) lx.fillRect(L.ox + x * L.cell, L.oy, 1, L.cell * L.rows.length); for (let y = 0; y <= L.rows.length; y++) lx.fillRect(L.ox, L.oy + y * L.cell, L.cell * L.cols, 1);
    for (const [x, y, c] of L.laid) drawTile(c, L.ox + x * L.cell, L.oy + y * L.cell, L.cell);
    if (L.cur) { lx.strokeStyle = '#F1D9A8'; lx.lineWidth = 2; lx.strokeRect(L.ox + L.cur[0] * L.cell - 1, L.oy + L.cur[1] * L.cell - 1, L.cell + 2, L.cell + 2); }
  }
  function drawTileAt(c, x, y, s) { drawTile(c, x, y, s); }
  async function layLevel(level, path) {
    use('level');
    const rows = (Array.isArray(level && level.rows) ? level.rows : []).map(String).slice(0, 60), cols = Math.min(120, Math.max(1, ...rows.map(r => r.length)));
    const cell = Math.max(4, Math.floor(Math.min(960 / cols, 640 / Math.max(1, rows.length))));
    lvl = { path, rows, cols, legend: (level && typeof level.legend === 'object' && level.legend) || {}, cell, ox: 250 + Math.floor((960 - cell * cols) / 2), oy: 56 + Math.floor((640 - cell * rows.length) / 2), laid: [], cur: null };
    drawLevel();
    const list = tileOrder(rows), rate = Math.max(18, list.length / 25);
    let i = 0, last = null, t0 = dnow();
    while (i < list.length) {
      if (list[i][2] !== last) { last = list[i][2]; lvl.cur = list[i]; drawLevel(); await sleep(300); t0 = dnow() - i / rate * 1000; }
      const want = Math.min(list.length, Math.floor((dnow() - t0) / 1000 * rate) + 1);
      while (i < want && list[i][2] === last) { lvl.laid.push(list[i]); lvl.cur = list[i]; i++; }
      drawLevel(); await frame();
    }
    lvl.cur = null; drawLevel();
  }

  /* ---------- the monitor in his room shows the tool he's using ---------- */
  let boardImg = null, boardAt = 0, boardBusy = false;
  function refreshBoard() {
    if (boardBusy || dnow() - boardAt < 1500) return;
    boardBusy = true; boardAt = dnow();
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    const img = new Image(); img.onload = () => { boardImg = img; boardBusy = false; URL.revokeObjectURL(url); }; img.onerror = () => { boardBusy = false; URL.revokeObjectURL(url); }; img.src = url;
  }
  use('board');
  return {
    board: m => board.roadmap(m.text),
    note: n => board.note(n),
    sketch: m => board.sketch(m.svg),
    pixels: m => paintSprite(m.art || {}, m.path || 'art/sprite.json'),
    level: m => layLevel(m.level || {}, m.path || 'levels/level.json'),
    use,
    get tool() { return tool; },
    /* draws the tool in use into a small canvas (the monitor's screen) */
    mirror(ctx, w, h) {
      if (tool === 'pixels') ctx.drawImage(pc, 0, 0, w, h);
      else if (tool === 'level') ctx.drawImage(lc, 0, 0, w, h);
      else { refreshBoard(); if (boardImg) ctx.drawImage(boardImg, 0, 0, w, h); else { ctx.fillStyle = '#EDE6D8'; ctx.fillRect(0, 0, w, h); } }
    },
  };
}
