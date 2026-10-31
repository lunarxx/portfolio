/* the abilities' effects, in his room (showcase spec, section 3). the engine (abilities/engine.js) says what starts
   and what a held effect's end is; this draws it:
     tv         words on his tv face, with a channel flip in and out
     face       an expression for a moment (happy, angry, look, flat)
     text       pixel words rising off an anchor (head, monitor, cat, desk, hands)
     banner     big words across the top of the stream
     particles  confetti, sparks, hearts or stars from an anchor, in the camera's own pixels; smoke puffs out of the
                vents on top of his tv (the tests failed), rising, growing and thinning out
     sound      a short sound made in the page (ding, blip, whoosh, static, cheer, pop)
     light      the lamp (or the whole room) flares a colour
     shake, zoom  the camera
     arm        a gesture from his vocabulary (arms_up, hands_head, point_screen, thumbs_up, peace, shrug, smug)
     monitor    his monitor flashes a colour
     cat        the cat wakes up and looks
     move       his whole body does something for a moment (moves.js: spin, wave), if he's free to
     box        a cardboard box drops onto his desk (once a stream) and the cat goes and sits in it
     cam        a camera held for a while (the cat cam: she takes over the stream for a minute)
     hat        a party hat goes on his tv and stays for the rest of the stream
     dark       the lights go off for a while: the room goes dark but for his tv face and the monitor's glow, and the
                cat (woken by it) looks on with her eyes shining amber. the walls are painted, not lit, so the dark is
                drawn over the camera like the other effects
   particles and text go on a 320x180 canvas over the camera, so they are the same pixels as the room */
import * as THREE from 'three';

const COL = { amber: '#E3A94F', cream: '#F1D9A8', sage: '#8FA38A', brick: '#C0664A', rose: '#D98C8C', ink: '#1B1D22', blue: '#6F86B0', white: '#FFFFFF' };
const col = (c, d) => COL[c] || (/^#[0-9a-f]{6}$/i.test(String(c)) ? c : d);
const ease = u => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
const HEART = ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'];

export function createFx({ O, cat, kitty, lights, monitor, audio, camPanel, page, voiceOut = null, move = () => false, box = () => false, cam = () => false, hat = () => false, now = () => performance.now() / 1000, rand = Math.random }) {
  /* the overlay on the camera */
  const ov = document.createElement('canvas'); ov.width = 320; ov.height = 180;
  Object.assign(ov.style, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none' });
  camPanel.appendChild(ov);
  const g = ov.getContext('2d');
  const banner = document.createElement('div'); banner.className = 'fxbanner px'; page.appendChild(banner);
  const live = new Map();   // id -> { f, t0, ... }
  const base = Object.fromEntries(Object.entries(lights).map(([k, l]) => [k, { i: l.intensity, c: l.color.clone() }]));
  let camera = null;
  const W = new THREE.Vector3();
  function anchor(name) {
    if (name === 'top') return [160, 22];
    if (name === 'center') return [160, 90];
    const p = name === 'monitor' ? W.set(0, 1.12, .82) : name === 'cat' ? cat.head.getWorldPosition(W) : name === 'desk' ? W.set(.02, .8, .46)
      : name === 'hands' ? O.arms.R.hand.getWorldPosition(W) : O.head.getWorldPosition(W).add(new THREE.Vector3(0, .22, 0));
    if (!camera) return [160, 60];
    const v = p.clone().project(camera);
    return [(v.x + 1) / 2 * 320, (1 - v.y) / 2 * 180];
  }
  /* ---------- sounds, made here: no files ---------- */
  const out = audio.createGain(); out.gain.value = .22; out.connect(audio.destination);
  function tone(f0, f1, d, type = 'sine', at = 0, vol = 1, dest = out) {
    const o = audio.createOscillator(), e = audio.createGain(), t = audio.currentTime + at;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vol, t + .01); e.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(e); e.connect(dest); o.start(t); o.stop(t + d + .02);
  }
  function noise(d, from, to, vol = .6, at = 0, dest = out) {
    const n = Math.floor(audio.sampleRate * d), b = audio.createBuffer(1, n, audio.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = rand() * 2 - 1;
    const s = audio.createBufferSource(), f = audio.createBiquadFilter(), e = audio.createGain(), t = audio.currentTime + at;
    s.buffer = b; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + d);
    e.gain.setValueAtTime(vol, t); e.gain.exponentialRampToValueAtTime(.001, t + d);
    s.connect(f); f.connect(e); e.connect(dest); s.start(t);
  }
  const SFX = {
    ding: () => { tone(1320, 1318, .5, 'sine'); tone(1980, 1975, .35, 'sine', .0, .4); },
    blip: () => tone(660, 990, .09, 'square', 0, .35),
    pop: () => tone(420, 140, .12, 'triangle'),
    whoosh: () => noise(.45, 300, 3000, .5),
    static: () => noise(.35, 2500, 2400, .7),
    cheer: () => { noise(1.2, 900, 1400, .35); for (let k = 0; k < 4; k++) tone(520 + k * 130, 540 + k * 130, .25, 'triangle', k * .09, .5); },
    click: () => { noise(.03, 2500, 1800, .7); tone(1800, 1200, .02, 'square', 0, .3); },
    /* his breath working out, through his mic (his note: "out of breaths and force like uhh huh uhh huh"): the push out
       (huh), the strain (hnn), a breath in */
    huff: () => { const v = voiceOut || out; noise(.3, 1100, 380, 1.4, 0, v); tone(150, 105, .2, 'triangle', 0, .5, v); },
    grunt: () => { const v = voiceOut || out; tone(128, 92, .34, 'sawtooth', 0, .28, v); noise(.2, 650, 320, .8, 0, v); },
    inhale: () => { const v = voiceOut || out; noise(.34, 380, 1200, .7, 0, v); },
    /* heard on laptop speakers too (a 110 Hz thud alone disappears there: his note, the mug made no sound) */
    deepbreath: () => { const v = voiceOut || out; noise(.9, 300, 1100, .8, 0, v); noise(1.2, 1300, 300, 1.1, .95, v); tone(140, 95, .9, 'triangle', 1.0, .2, v); },
    thud: () => { tone(180, 70, .22, 'sine', 0, 1); noise(.14, 900, 220, 1.1); noise(.05, 2400, 1400, .5); },
    mugdrop: () => { noise(.07, 2600, 1400, 1.5); tone(2650, 2600, .28, 'sine', 0, .3); tone(3900, 3850, .18, 'sine', .005, .15);
      noise(.05, 2200, 1500, .8, .16); tone(2650, 2620, .15, 'sine', .16, .15); noise(.35, 1500, 900, .25, .24); },
    coin: () => { tone(988, 988, .08, 'square', 0, .35); tone(1319, 1319, .3, 'square', .08, .35); },
  };
  /* ---------- starting an effect ---------- */
  function start(f) {
    const a = f.a, t0 = now(), s = { f, t0, dur: f.hold ? Infinity : (f.dur || 1) };
    if (f.kind === 'sound') { try { if (audio.state === 'running') (SFX[a.sfx] || SFX.blip)(); } catch {} return; }
    if (f.kind === 'cat') { kitty.wake(t0); return; }
    if (f.kind === 'move') { move(a.move); return; }
    if (f.kind === 'box') { box(); return; }
    if (f.kind === 'cam') { cam(a.cam || 'K', +a.dur || 30); return; }
    if (f.kind === 'hat') { hat(); return; }
    if (f.kind === 'dark') kitty.wake(t0);
    if (f.kind === 'particles') {
      const [x, y] = anchor(a.anchor || 'head'), n = Math.min(80, +a.n || 18), kind = a.kind || 'spark', sp = +a.speed || 90;
      const cols = { confetti: ['amber', 'sage', 'rose', 'cream', 'blue', 'brick'], spark: ['amber', 'cream', 'white'], hearts: ['rose', 'brick'], stars: ['cream', 'amber'], smoke: ['#B5AFA4', '#9A958C', '#C9C3B8'] }[kind] || [a.color || 'amber'];
      s.ps = kind === 'smoke' ? Array.from({ length: n }, (_, i) => ({ x: x + (rand() - .5) * 14, y: y + 3, vx: (rand() < .5 ? -1 : 1) * (6 + rand() * 12), vy: -(4 + rand() * 5), c: col(cols[Math.floor(rand() * cols.length)], '#6E6A64'), delay: i / n * s.dur * .55 + rand() * .15, life: 1.6 + rand() * .8, grow: 4 + rand() * 4, ph: rand() * 6 })) : Array.from({ length: n }, () => {
        const ang = kind === 'hearts' ? -Math.PI / 2 + (rand() - .5) * .9 : kind === 'confetti' ? -Math.PI / 2 + (rand() - .5) * 2.4 : rand() * Math.PI * 2, v = sp * (.35 + rand() * .65);
        return { x: x + (rand() - .5) * 6, y: y + (rand() - .5) * 6, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v * (kind === 'hearts' ? .5 : 1), c: col(cols[Math.floor(rand() * cols.length)], COL.amber), life: s.dur * (.6 + rand() * .4), ph: rand() * 6 };
      });
      s.grav = { spark: 160, confetti: 70, hearts: -25, stars: 40, smoke: -6 }[kind] ?? 100; s.kind = kind;
    }
    if (f.kind === 'text') s.at = anchor(a.anchor || 'head');
    if (f.kind === 'banner') { banner.textContent = String(a.text || ''); banner.style.color = col(a.color, COL.cream); banner.className = 'fxbanner px on'; }
    live.set(f.id, s);
  }
  function end(f) { const s = live.get(f.id); if (s) s.dur = now() - s.t0 + .35; }
  /* ---------- the lights off ---------- */
  const P1 = new THREE.Vector3(), P2 = new THREE.Vector3();
  const onCam = p => { const v = p.clone().project(camera); return [(v.x + 1) / 2 * 320, (1 - v.y) / 2 * 180, v.z < 1]; };
  function glow(world, size, a) {   // a hole in the dark around something that gives light, as big as it is on this camera
    const [x, y] = onCam(world), [x2, y2] = onCam(P2.copy(world).add(new THREE.Vector3(size, 0, 0))), r = Math.max(6, Math.hypot(x2 - x, y2 - y));
    const grd = g.createRadialGradient(x, y, 0, x, y, r); grd.addColorStop(0, `rgba(0,0,0,${a})`); grd.addColorStop(.55, `rgba(0,0,0,${a * .6})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  function dark(t) {
    const s = active('dark'); if (!s || !camera) return;
    const u = (t - s.t0) / s.dur, k = Math.max(0, Math.min(1, u / .06, (1 - u) / .15));
    g.save(); g.globalAlpha = .84 * k; g.fillStyle = '#04050B'; g.fillRect(0, 0, 320, 180);
    g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out';
    glow(O.head.getWorldPosition(P1), .42, .95 * k);   // his face lights himself
    glow(P1.set(0, 1.12, .82), .55, .6 * k);           // the monitor's glow
    g.restore();
    /* her eyes in the dark: two amber points where they are, if she has them open */
    for (const e of cat.eyes) if (e.open.visible) { const [x, y, front] = onCam(e.open.getWorldPosition(P1)); if (front) { g.globalAlpha = k; g.fillStyle = '#F4C77E'; g.fillRect(Math.round(x), Math.round(y), 1, 1); g.globalAlpha = .35 * k; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); g.globalAlpha = 1; } }
  }
  /* ---------- every frame ---------- */
  let last = now();
  function frame(cam) {
    camera = cam;
    const t = now(), dt = Math.min(.1, t - last); last = t;
    g.clearRect(0, 0, 320, 180);
    dark(t);
    let flare = null, bannerOn = false;
    for (const [id, s] of live) {
      const u = (t - s.t0) / s.dur, a = s.f.a;
      if (u >= 1) { live.delete(id); continue; }
      if (s.f.kind === 'particles') {
        for (const p of s.ps) {
          if (s.kind === 'smoke') {   // a puff: small out of the vent, rising, drifting, growing, thinning
            const age = t - s.t0 - p.delay; if (age < 0 || age > p.life) continue;
            p.vy += s.grav * dt; p.x += (p.vx + Math.sin(t * 2 + p.ph) * 4) * dt; p.y += p.vy * dt;
            const k = age / p.life, r = Math.round(1 + k * p.grow), cx = Math.round(p.x), cy = Math.round(p.y);
            g.globalAlpha = Math.max(0, .9 * (1 - k * k) * Math.min(1, age * 8)); g.fillStyle = p.c;
            for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy)); g.fillRect(cx - w, cy + dy, 2 * w + 1, 1); }
            continue;
          }
          const age = t - s.t0; if (age > p.life) continue;
          p.vy += s.grav * dt; p.vx *= Math.exp(-1.6 * dt); p.vy *= Math.exp(-(s.kind === 'confetti' ? 1 : 1.6) * dt);
          p.x += p.vx * dt + (s.kind === 'confetti' ? Math.sin(t * 7 + p.ph) * 12 * dt : 0); p.y += p.vy * dt;
          g.globalAlpha = Math.max(0, Math.min(1, (1 - age / p.life) * 2.2)); g.fillStyle = p.c;
          if (s.kind === 'hearts') HEART.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'x') g.fillRect(Math.round(p.x) + i - 2, Math.round(p.y) + j - 2, 1, 1); }));
          else if (s.kind === 'confetti') g.fillRect(Math.round(p.x), Math.round(p.y), Math.floor(t * 8 + p.ph) % 2 ? 2 : 1, Math.floor(t * 8 + p.ph) % 2 ? 1 : 2);
          else g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        }
        g.globalAlpha = 1;
      }
      else if (s.f.kind === 'text') {
        const rise = (+a.rise || 22) * ease(u), [x, y] = s.at, size = Math.round(10 * (+a.size || 1));
        g.globalAlpha = u > .7 ? (1 - u) / .3 : 1;
        g.font = `${size}px 'VT323', monospace`; g.textAlign = 'center';
        g.fillStyle = COL.ink; for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillText(String(a.text ?? ''), Math.round(x) + ox, Math.round(y - rise) + oy);
        g.fillStyle = col(a.color, COL.amber); g.fillText(String(a.text ?? ''), Math.round(x), Math.round(y - rise));
        g.globalAlpha = 1;
      }
      else if (s.f.kind === 'banner') bannerOn = true;
      else if (s.f.kind === 'light') flare = { c: col(a.color, COL.amber), k: Math.sin(Math.PI * Math.min(1, u * (s.f.hold ? 4 : 1))) * (+a.strength || 1), room: a.where === 'room' };
    }
    if (!bannerOn && banner.classList.contains('on')) banner.className = 'fxbanner px';
    /* the lamp (or every light) toward the colour, and back */
    for (const [k, l] of Object.entries(lights)) {
      const b0 = base[k], on = l.userData.off ? 0 : 1;   // the meeting fork: a light switched off stays off
      if (!flare || (!flare.room && k !== 'lamp' && k !== 'rim')) { l.intensity = b0.i * on; l.color.copy(b0.c); continue; }
      l.intensity = b0.i * (1 + 1.4 * flare.k) * on; l.color.copy(b0.c).lerp(new THREE.Color(flare.c), .7 * flare.k);
    }
  }
  const active = kind => [...live.values()].filter(s => s.f.kind === kind).pop() || null;
  return {
    start, end, frame,
    sfx(name) { try { if (audio.state === 'running' && SFX[name]) SFX[name](); } catch {} },
    /* the gesture an ability puts on him, when no line has one: { name, w, u, id } like a line's */
    gesture() { const s = active('arm'); if (!s) return null; const u = (now() - s.t0) / s.dur; return { name: s.f.a.pose || s.f.a.name || 'arms_up', w: Math.min(1, u * 5, (1 - u) * 5), u, id: s.t0 }; },
    face() { const s = active('face'); return s ? String(s.f.a.expr || s.f.a.mood || 'happy') : null; },
    /* words on his face: drawn over it, after the face */
    tv(faceCanvas) {
      const s = active('tv'); if (!s) return false;
      const u = (now() - s.t0) / s.dur, ctx = faceCanvas.getContext('2d'), flip = u < .08 || u > .92;
      ctx.fillStyle = '#1B1D22'; ctx.fillRect(0, 0, 64, 52);
      if (flip) { for (let i = 0; i < 260; i++) { ctx.fillStyle = rand() < .5 ? '#9A9D9F' : '#3A3D44'; ctx.fillRect(Math.floor(rand() * 64), Math.floor(rand() * 52), 2, 1); } }
      else { const text = String(s.f.a.text || ''); ctx.fillStyle = col(s.f.a.color, COL.amber); ctx.textAlign = 'center'; ctx.font = `${text.length > 4 ? 16 : 26}px 'VT323', monospace`; ctx.fillText(text, 32, text.length > 4 ? 31 : 35); }
      return true;
    },
    /* the camera: a shake offset in world units, and a zoom factor */
    shake() { const s = active('shake'); if (!s) return null; const k = (1 - (now() - s.t0) / s.dur) * (+s.f.a.amount || 1) * .012; return [(rand() - .5) * k, (rand() - .5) * k]; },
    zoom() { const s = active('zoom'); if (!s) return 1; const u = (now() - s.t0) / s.dur; return 1 + (+s.f.a.amount || .12) * Math.sin(Math.PI * u); },
    /* his monitor: a colour washed over it for a moment */
    monitorTint() { const s = active('monitor'); if (!s) return null; const u = (now() - s.t0) / s.dur; return { c: col(s.f.a.color, COL.brick), a: .7 * (1 - u) }; },
    get count() { return live.size; },
  };
}
