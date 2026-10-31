/* the stage, live: octyn in his room, driven by the show over server-sent events, rendered at 30 fps from one camera.
   a line arrives when it is time to say it ('say': its audio, word times, gesture marks, face, size, head frames): the
   page plays the audio, moves his mouth from it, lands the gestures on their words, reveals the captions word by word,
   and tells the show when it is done. between lines he works: typing, glancing at chat, idle head life. the director
   picks the camera and the layout. everything the page does is also a small event back to the show (perf, said) */
import * as THREE from 'three';
import { W, H, scene, render, V3 } from './look.js';
import { buildRoom, ANCHOR } from './room.js';
import { buildOctyn } from './octyn.js';
import { makePerformer, G } from './perform.js';
import { createPlayBot } from './playbot.js';
import { gestureWindows, gestureAt, captionWords } from './timeline.js';
import { createDirector } from './director.js';
import { createTypist } from './typist.js';
import { createCat, applyCat } from './cat.js';
import { keyboardWalk } from './catwalk.js';
import { createCatLife, catHands } from './catlife.js';
import { perchVisit } from './catperch.js';
import { mouseChase } from './chase.js';
import { keyboardNap } from './catnap.js';
import { mugKnock } from './mugknock.js';
import { createBody } from './body.js';
import { MOVES } from './moves.js';
import { boxDrop } from './boxdrop.js';
import { ACTS } from './acts.js';
import { createSound } from './sound.js';
import { createDesign } from './design.js';
import { createGameBridge } from './gamebridge.js';
import { createHands } from './hands.js';
import { createAbilities } from './abilities/engine.js';
import { createFx } from './fx.js';
import { drawFace } from './octyn.js';

const { mouse, props, cat, monitor, lights } = buildRoom();   // props: the things he picks up, and the box
const kitty = createCat();
const O = buildOctyn(scene);
const perform = makePerformer(O, mouse, { props, cat, away: () => !!state.away });
const offChair = createBody(O);
function ortho(halfH, center, dir, layers) {
  const c = new THREE.OrthographicCamera(-halfH * W / H, halfH * W / H, halfH, -halfH, .1, 30);
  c.position.copy(center.clone().addScaledVector(dir.clone().normalize(), 10)); c.lookAt(center);
  c.layers.disableAll(); for (const l of layers) c.layers.enable(l); return c;
}
const deg = Math.PI / 180, az = 30 * deg, el = 30 * deg, azB = 50 * deg, elB = 35 * deg;
const CAMS = {
  A: ortho(.52, V3(0, 1.265, .1), V3(0, Math.sin(28 * deg), Math.cos(28 * deg)), [0, 2, 3, 4, 6, 7]),
  B: ortho(.68, V3(-.05, 1.14, .3), V3(-Math.sin(azB) * Math.cos(elB), Math.sin(elB), Math.cos(azB) * Math.cos(elB)), [0, 2, 4, 5, 6, 7]),
  C: ortho(.62, V3(.02, 1.02, .5), V3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)), [0, 1, 3, 5, 6, 7]),
};
/* K: close on the cat, from in front of her and a little from C's side, for when she does something */
{ scene.updateMatrixWorld(true); const at = cat.root.getWorldPosition(V3(0, 0, 0)), fwd = cat.root.localToWorld(V3(1, 0, 0)).sub(at).setY(0).normalize();
  /* T: follows the cat and him round the room when she runs off with his mouse; high over the desk from the front, the
     wall behind the desk and his monitor out of its way */
  /* W: A pulled back and up, for when he stands at his desk (a raid wave): A crops his head once he's up */
  CAMS.W = ortho(.74, V3(0, 1.42, .1), V3(0, Math.sin(24 * deg), Math.cos(24 * deg)), [0, 2, 3, 4, 6, 7]);
  /* P: T's twin from behind him and to the right (C's angle), for pushups: from the front his rolled-back chair is in the way */
  CAMS.P = ortho(.8, V3(.4, .4, -1), V3(Math.sin(az) * Math.cos(38 * deg), Math.sin(38 * deg), -Math.cos(az) * Math.cos(38 * deg)), [0, 1, 3, 5, 6, 7]); CAMS.P.userData.dir = CAMS.P.position.clone().sub(V3(.4, .4, -1)).normalize();
  CAMS.T = ortho(.95, V3(0, .6, -.6), V3(-Math.sin(15 * deg) * Math.cos(52 * deg), Math.sin(52 * deg), Math.cos(15 * deg) * Math.cos(52 * deg)), [0, 2, 3, 4]); CAMS.T.userData.dir = CAMS.T.position.clone().sub(V3(0, .6, -.6)).normalize();
  CAMS.K = ortho(.2, at.clone().add(V3(0, .08, 0)), fwd.multiplyScalar(.8).add(V3(Math.sin(az), 0, -Math.cos(az)).multiplyScalar(.5)).setY(.7), [0, 2, 3, 4, 5, 6, 7]); }

const $ = id => document.getElementById(id);
const PAGE = document.getElementById('stageroot') || document.body;   // the meeting app: the stage's own root, not <body>
const post = () => Promise.resolve();   // the meeting fork: no show server to tell
const now = () => performance.now() / 1000;
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const HUES = ['#8FA38A', '#E3A94F', '#C98A7A', '#9A9D9F', '#F1D9A8', '#8E7456', '#6F86B0', '#B67E58'], hue = {};
const colour = h => hue[h] || (hue[h] = HUES[Object.keys(hue).length % HUES.length]);

const state = { segment: 'soon', line: null, glanceUntil: 0, chat: [], n: 0, petting: false, pane: 'code', show: null };
const director = createDirector();
const audio = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audio.createAnalyser(); analyser.fftSize = 1024;   // his mouth reads the dry voice; what you hear goes through the mic and the room
{ const tap = audio.createGain(); tap.gain.value = 0; analyser.connect(tap); tap.connect(audio.destination); }
const sound = createSound(audio, { tv: new URLSearchParams(location.search).get('tv') || 'warm', onSong: s => { $('song').textContent = `♪ ${s.title}`; post('/stage/log', { kind: 'song', title: s.title, bpm: s.bpm }); } });
const buf = new Float32Array(analyser.fftSize);
/* abilities: something happens on stream (chat, the game, the work, what he says), something happens in the room */
const fx = createFx({ O, cat, kitty, lights, monitor, audio, camPanel: document.getElementById('cam'), page: PAGE, voiceOut: sound.voiceIn, move: name => startMove(name), box: () => dropBox(), cam: (c, d) => holdCam(c, d), hat: () => partyHat() });
const abilities = createAbilities({ now: () => performance.now() / 1000, onFx: f => { fx.start(f); if (!f.hold) post('/stage/log', { kind: 'ability', id: f.ability, fx: f.kind }); }, onEnd: f => fx.end(f) });
Promise.reject().then(r => r.ok ? r.json() : []).then(defs => { abilities.load(defs); post('/stage/log', { kind: 'abilities', message: `${defs.length} loaded` }); }).catch(() => {});

/* ---------- lines ---------- */
async function say(item) {
  let src = null, dur = item.dur;
  try {
    const data = await (await fetch(item.url)).arrayBuffer(), ab = await audio.decodeAudioData(data);
    if (audio.state === 'suspended') await audio.resume();
    src = audio.createBufferSource(); src.buffer = ab; src.connect(analyser); src.connect(sound.voiceIn); dur = ab.duration;
  } catch (e) { post('/stage/log', { kind: 'audio', message: String(e) }); }
  const start = now() + 0.05;
  state.line = { ...item, shown: captionWords(item.text, item.words || []), cat: CAT.test((item.words || []).map(w => w[0]).join(' ') || item.text || ''), start, dur, windows: gestureWindows({ start, words: item.words || [], dur, marks: item.marks || [] }) };
  if (item.to) highlight(item.to);
  if (item.act && ACTS[item.act]) state.act = { name: item.act, t0: start + .3 };   // say it, do it: the act starts with the line
  const done = () => { if (state.line && state.line.id === item.id) state.line = null; $('cap').innerHTML = ''; post('/stage/said', { id: item.id }); };
  sound.lineStart();
  if (src) { src.onended = done; src.start(audio.currentTime + 0.05); } else setTimeout(done, dur * 1000 + 50);
}
function captions(t) {
  const l = state.line; if (!l) return;
  const words = l.words || [], k = t - l.start;
  // live captions, in pages: a page (up to two lines, broken at his own pauses) is laid out whole from its first word,
  // the words he hasn't said yet held invisible in their places, so nothing slides or reflows as he talks; the next
  // page replaces it once he's past it
  const pages = l.pages || (l.pages = pagesOf(l.shown));
  let n = -1; for (let i = 0; i < words.length; i++) if (k >= words[i][1]) n = i;
  if (n < 0) { if (l.capKey !== '') { l.capKey = ''; $('cap').innerHTML = ''; } return; }
  const pg = pages.find(([a, z]) => n >= a && n <= z) || pages[pages.length - 1], key = `${pg[0]}:${n}`;
  if (key === l.capKey) return; l.capKey = key;
  $('cap').innerHTML = `<b>${l.shown.slice(pg[0], pg[1] + 1).map((w, j) => pg[0] + j <= n ? esc(w) : `<i>${esc(w)}</i>`).join(' ')}</b>`;
}
// where the pages break: after a sentence once a page has 5 words, after a comma once it has 9, and never past 13
function pagesOf(ws) {
  const out = []; let a = 0;
  for (let i = 0; i < ws.length; i++) {
    const c = i - a + 1, w = ws[i] || '';
    if (i === ws.length - 1 || c >= 13 || (c >= 5 && /[.!?]$/.test(w)) || (c >= 9 && /[,;:]$/.test(w))) { out.push([a, i]); a = i + 1; }
  }
  return out.length ? out : [[0, Math.max(0, ws.length - 1)]];
}

/* ---------- chat and the bar ---------- */
function drawChat() {
  $('chat').innerHTML = state.chat.map(x => `<div class="msg${x.reading ? ' reading' : ''}"><span class="who" style="color:${colour(x.handle)}">${esc(x.handle)}</span>${esc(x.text)}</div>`).join('');
}
const CAT = /\b(cat|cats|kitty|kitten|meow|purr)\b/i;   // she is on someone's lips: the director may cut to her
function addChat(m) { if (CAT.test(m.text || '')) state.chatCat = now(); state.chat.push(m); if (state.chat.length > 14) state.chat.shift(); drawChat(); }
/* the message he is answering lights up while he answers it */
function highlight(handle) {
  for (const x of state.chat) x.reading = false;
  const last = [...state.chat].reverse().find(x => x.handle.toLowerCase() === String(handle).toLowerCase());
  if (last) last.reading = true;
  drawChat();
}
/* ---------- the editor: monaco in his colours, the typist, the terminal, the game ---------- */
let typist = null, typing = Promise.resolve();
const monacoReady = new Promise(res => { window.require.config({ paths: { vs: '/node_modules/monaco-editor/min/vs' } }); window.require(['vs/editor/editor.main'], () => res(window.monaco)); });
monacoReady.then(monaco => {
  monaco.editor.defineTheme('octyn', { base: 'vs-dark', inherit: true,
    rules: [{ token: 'keyword', foreground: 'E3A94F' }, { token: 'string', foreground: '8FA38A' }, { token: 'number', foreground: 'C0664A' }, { token: 'comment', foreground: '6F6A60' },
      { token: 'identifier', foreground: 'D8D2C4' }, { token: 'delimiter', foreground: '9A9D9F' }, { token: 'type', foreground: 'F1D9A8' }, { token: 'tag', foreground: 'E3A94F' }, { token: 'attribute.name', foreground: '8FA38A' }],
    colors: { 'editor.background': '#1E1C1A', 'editorLineNumber.foreground': '#4A4640', 'editorLineNumber.activeForeground': '#8E8779', 'editorCursor.foreground': '#F1D9A8',
      'editor.selectionBackground': '#4A3A30', 'editor.lineHighlightBackground': '#24211E', 'editorIndentGuide.background1': '#2B2723' } });
  const editor = state.editor = monaco.editor.create($('monaco'), { theme: 'octyn', fontFamily: 'JetBrains Mono', fontSize: 20, lineHeight: 32, minimap: { enabled: false },
    scrollbar: { vertical: 'hidden', horizontal: 'hidden' }, overviewRulerLanes: 0, folding: false, renderLineHighlight: 'line', cursorBlinking: 'solid', automaticLayout: true,
    readOnly: false, occurrencesHighlight: 'off', selectionHighlight: false, quickSuggestions: false, wordWrap: 'off', padding: { top: 10 } });
  editor.focus();
  typist = createTypist({ monaco, editor,
    setTabs: (paths, on) => { state.typingPath = on; $('tabs').innerHTML = paths.map(p => `<div class="${p === on ? 'on' : ''}">${esc(p.split('/').pop())}</div>`).join(''); },
    onKey: ch => { state.lastKey = now(); sound.key(ch); state.codeDirty = true; },
    onLine: () => { const m = editor.getModel(), p = editor.getPosition(); post('/stage/line', { text: m && p ? m.getLineContent(Math.max(1, p.lineNumber - 1)).slice(0, 200) : '', path: state.typingPath || '' }); },   // the line he just finished, so he can explain it
    busy: () => state.segment !== 'build' || !!state.act || !!state.chase || !!state.move || !!state.away || !!state.handsBusy || !!(state.line && state.line.size === 'big') });   // his hand is off the keys for an act
  post('/stage/log', { kind: 'editor', message: 'ready' });
});
/* the cat over the keyboard (his note: "sometimes it could walk over the keyboard and now the code has random letters
   octyn is backspacing ... dont make it repetitive"): rare (catlife.js), only mid-line. she walks her route (catwalk.js),
   her paws put junk in at his cursor as they land, his hands come off the keys while she's over them, the show hears
   of it (he reacts in his own words), and once she's off he looks at it a beat and holds backspace. ?catwalk=<s> brings
   the first one forward (for checks) */
const sleepMs = ms => new Promise(r => setTimeout(r, ms));
const CATQ = new URLSearchParams(location.search);
const catLife = createCatLife({ scenes: { keys: { first: +(CATQ.get('catwalk') || 360), gap: [900, 2100] }, perch: { first: +(CATQ.get('catperch') || 780), gap: [1200, 2700] }, chase: { first: +(CATQ.get('catchase') || 1500), gap: [2400, 4200] }, nap: { first: +(CATQ.get('catnap') || 1200), gap: [1800, 3600] }, mug: { first: +(CATQ.get('catmug') || 900), gap: [1800, 3600] } }, apart: +(CATQ.get('catapart') || 300) });   // the launcher's --stage brings these forward for a test
/* the keys she can press: the front row counts too, since she walks the lane in front of the mug */
const KEYS = { x0: ANCHOR.kb.x - .23, x1: ANCHOR.kb.x + .23, z0: ANCHOR.kb.z - .14, z1: ANCHOR.kb.z + .08, h: .036 }, LANE = ANCHOR.kb.z - .1;
const catHome = () => ({ x: cat.home.x, z: cat.home.z, turn: cat.baseTurn + kitty.turn });
/* up on him (his note: "sit on octyns head, or shoulders"): on top of his tv, lying along it facing his left and a little
   to the front; asked every frame, so she rides his head as it moves. not his shoulders: the tv hangs out over them and
   she'd sit inside it */
const _pa = new THREE.Vector3(), _pb = new THREE.Vector3();
const PERCH = { head: () => [O.head, V3(-.02, .232, .03), V3(Math.cos(.5), 0, Math.sin(.5))] };
function perchTarget(where) {
  return () => { const [part, p0, fwd] = PERCH[where](), desk = cat.root.parent;
    part.updateWorldMatrix(true, false);
    const a = desk.worldToLocal(part.localToWorld(_pa.copy(p0))), b = desk.worldToLocal(part.localToWorld(_pb.copy(p0).add(fwd)));
    return { x: a.x, y: a.y - cat.home.y, z: a.z, heading: Math.atan2(-(b.z - a.z), b.x - a.x) }; };
}
const catPlan = (kind, where = 'head', stay = 30) => kind === 'chase' ? mouseChase({ home: catHome(), mouse: { x: ANCHOR.mouse.x, z: ANCHOR.mouse.z } }) : kind === 'perch'
  ? perchVisit({ home: catHome(), spot: { x: ANCHOR.kb.x + .28, z: ANCHOR.kb.z - .16 }, target: perchTarget(where), stay, speed: .2, stepHz: 2.4 })
  : keyboardWalk({ home: catHome(), keys: KEYS, lane: LANE, speed: .2, stepHz: 2.4 });
/* the mouse chase (his note: "take the mouse and run away and octyn's chasing it around the room while the camera tracks"):
   chase.js has both of them; the stage runs her through kitty, him through body.js while he's off the chair, the mouse
   in her mouth, on the bed, in his hand; the show hears when she takes it and when he gets it back */
function catChase() {
  if (kitty.walking || kitty.mode === 'pet' || state.away) return false;
  const c = catPlan('chase');
  kitty.walk({ dur: c.dur, at: s => ({ ...c.at(s).cat, done: s >= c.dur }) }, now());
  state.catScene = { kind: 'chase' }; state.chase = { c, t0: now(), back: false }; state.catHands = 'shrug';
  post('/stage/cat', { what: 'chase', dur: +c.dur.toFixed(1) });
  return true;
}
/* a move (moves.js), set off by an ability: body.js has him for its length, if he's at his desk and free */
/* the box (a sub): it drops onto the desk once, bouncing, with a thud; then she goes and sits in it, a while. a later
   sub sends her back to it (if it fits, she sits) */
const box = props.box;
function dropBox() {
  if (!box.visible) { box.visible = true; state.boxDrop = { d: boxDrop({ height: 1.3 }), t0: now(), thud: false }; }
  state.boxCatAt = now() + (state.boxDrop ? state.boxDrop.d.dur + .9 : .3);
  post('/stage/log', { kind: 'box' });
  return true;
}
function catBox() {
  if (kitty.walking || kitty.mode === 'pet' || state.away) return false;
  const v = perchVisit({ home: catHome(), spot: { x: box.position.x + .08, z: box.position.z - .16 }, target: () => ({ x: box.position.x, y: .012, z: box.position.z, heading: -2.3 }), stay: 90 + Math.random() * 120, speed: .2, stepHz: 2.4, hop: .1 });
  kitty.walk(v, now()); state.catScene = { kind: 'box' };
  post('/stage/cat', { what: 'box' });
  return true;
}
function boxFrame(t) {
  const bd = state.boxDrop;
  if (bd) {
    const p = bd.d.at(t - bd.t0), sq = p.squash;
    box.position.y = box.userData.home.y + p.y; box.scale.set(1 + (1 - sq) * .5, sq, 1 + (1 - sq) * .5); box.rotation.z = p.tilt;
    if (!bd.thud && p.y === 0 && t - bd.t0 > .1) { bd.thud = true; fx.sfx('thud'); }
    if (p.done) state.boxDrop = null;
  }
  if (state.boxCatAt && t >= state.boxCatAt) { state.boxCatAt = null; catBox(); }
}
/* a nudge's card on stream as he asks (his note: "keep nudging to follow socials or subscribe or like"): slides in at
   the bottom left of his camera for a few seconds */
const card = document.createElement('div');
Object.assign(card.style, { position: 'absolute', left: '4%', bottom: '8%', font: "34px 'VT323', monospace", color: '#16171B', background: '#E3A94F', padding: '2px 16px 4px', border: '2px solid #F1D9A8', boxShadow: '4px 4px 0 #16171B', transform: 'translateX(-140%)', transition: 'transform .35s cubic-bezier(.3,1.4,.5,1)', zIndex: 3, whiteSpace: 'nowrap' });
document.getElementById('cam').appendChild(card);
const CARDS = { follow: '+ FOLLOW', sub: '★ SUBSCRIBE', like: '▲ LIKE THE STREAM', share: '↗ SHARE', socials: '@ SOCIALS' };
let cardOff = null;
function nudgeCard(kind) {
  card.textContent = CARDS[kind] || String(kind || '').toUpperCase(); card.style.transform = 'translateX(0)';
  clearTimeout(cardOff); cardOff = setTimeout(() => { card.style.transform = 'translateX(-140%)'; }, 5000);
}
/* a camera held for a while (the cat cam payoff) */
function holdCam(c, secs) { if (!CAMS[c]) return false; state.camHold = c; clearTimeout(state.camHoldOff); state.camHoldOff = setTimeout(() => { if (state.camHold === c) state.camHold = null; }, secs * 1000); return true; }
/* the party hat (a payoff): a striped cone on top of his tv with a pompom, popping on with a bounce, there for the rest of the stream */
const hatG = new THREE.Group(); O.head.add(hatG); hatG.position.set(-.04, .222, .03); hatG.rotation.z = -.18; hatG.visible = false;
{ const cone = new THREE.Mesh(new THREE.ConeGeometry(.075, .2, 14), new THREE.MeshToonMaterial({ color: 0xE3A94F })); cone.position.y = .1; hatG.add(cone);
  for (const [y, r] of [[.04, .062], [.1, .042], [.16, .02]]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(r, r + .006, .018, 14), new THREE.MeshToonMaterial({ color: 0xC0664A })); band.position.y = y; hatG.add(band); }
  const pom = new THREE.Mesh(new THREE.SphereGeometry(.028, 10, 8), new THREE.MeshToonMaterial({ color: 0xF1D9A8 })); pom.position.y = .205; hatG.add(pom); }
function partyHat() {
  if (hatG.visible) return false;
  hatG.visible = true; const t0 = now();
  const pop = () => { const u = Math.min(1, (now() - t0) / .45); hatG.scale.setScalar(Math.max(.01, u < .6 ? u / .6 * 1.25 : 1.25 - (u - .6) / .4 * .25)); if (u < 1) requestAnimationFrame(pop); };   // grows past full size, settles back
  pop(); return true;
}
function startMove(name, opts = {}) {
  if (!MOVES[name] || state.away || state.chase || state.move || state.act) return false;
  state.move = { name, plan: MOVES[name](opts), t0: now() }; state.away = true; offChair.begin();
  post('/stage/log', { kind: 'move', name, state: 'start', dur: +state.move.plan.dur.toFixed(1) });
  return true;
}
/* the reps on screen while he pays off a goal: PUSHUPS 12/50, the number popping as it goes up */
const reps = document.createElement('div');
Object.assign(reps.style, { position: 'absolute', left: '50%', bottom: '9%', transform: 'translateX(-50%)', font: "44px 'VT323', monospace", color: '#F1D9A8', background: '#16171Bdd', padding: '2px 18px 4px', border: '2px solid #34302B', display: 'none', zIndex: 3, transition: 'transform .12s' });
document.getElementById('cam').appendChild(reps);
const FAIL_CAM = { misschair: 'C', fallout: 'C', bonk: 'C', faceplant: 'P', stubtoe: 'T', trip: 'T', spinout: 'T', sitdown: 'T', stumble: 'T' };
const WORKOUTS = new Set(['pushups', 'squats', 'jumping_jacks', 'room_dance', 'spin_marathon']);
function recoverFrame(t) {
  const r = state.recover; if (!r) return;
  if (t - r.t0 > 22) { state.recover = null; return; }
  if (t >= r.next) { r.next = t + 2.6 + (t - r.t0) * .25 + Math.random() * 1.5; if (Math.random() < .7) fx.sfx(Math.random() < .5 ? 'inhale' : 'huff'); }   // heavy breaths, further apart as he recovers
}
function moveFrame(t) {
  const mv = state.move; if (!mv) return;
  const p = mv.plan.at(t - mv.t0);
  if (p.done) {
    state.move = null; state.away = false; offChair.end(); reps.style.display = 'none'; post('/stage/log', { kind: 'move', name: mv.name, state: 'end' });
    if (WORKOUTS.has(mv.name)) { fx.sfx('deepbreath'); state.recover = { t0: t, next: t + 3.5 }; }   // back down, a deep breath, then he gets his breath back
    return;
  }
  offChair.apply(p);
  /* a fail (his note: "people like seeing streamers fail a lot"): the thud as he hits the floor (or the desk, or his
     toe), and the moment it starts goes to the show so he reacts to it */
  if (p.fail && p.fail !== mv.failed) {   // cut to where it shows best (the chair rolling off: from behind him), for as long as it lasts
    mv.failed = p.fail; post('/stage/move', { name: mv.name, fail: p.fail });
    const w = (mv.plan.fails || []).find(f => f[2] === p.fail); holdCam(FAIL_CAM[p.fail] || 'T', w ? w[1] - w[0] + 1.2 : 4);
  }
  if ((p.thuds || 0) > (mv.thuds || 0)) { mv.thuds = p.thuds; fx.sfx('thud'); setTimeout(() => fx.sfx(Math.random() < .5 ? 'grunt' : 'huff'), 180); }
  /* his breath each rep: the push out (huh or hnn), and now and then a breath in halfway */
  if (p.label && p.of >= 4 && p.count !== mv.lastCount && (p.count === Math.ceil(p.of / 2) || p.count === p.of)) post('/stage/move', { name: mv.name, label: p.label.toLowerCase(), count: p.count, of: p.of });
  if (p.label && p.count !== mv.lastCount) { if (mv.lastCount !== undefined && p.count > mv.lastCount && p.label !== 'SPINS') fx.sfx(Math.random() < .6 ? 'huff' : 'grunt'); mv.lastCount = p.count; mv.inAt = t + .45 + Math.random() * .2; }
  if (mv.inAt && t >= mv.inAt && p.label && p.label !== 'SPINS') { mv.inAt = null; if (Math.random() < .5) fx.sfx('inhale'); }
  if (p.dancing) {   // dancing: a breath every couple of seconds, heavier as it goes; winded lines halfway and at the end
    if (!mv.breathAt || t >= mv.breathAt) { mv.breathAt = t + 1.4 + Math.random() * 1.6 - Math.min(.6, (p.phase || 0) / 60); fx.sfx(Math.random() < .55 ? 'huff' : 'inhale'); }
    mv.danceT = p.phase || 0; if (!mv.danceStart) mv.danceStart = t;
    if (!mv.half && t - mv.danceStart > (mv.plan.danceSecs || 30) / 2) { mv.half = true; post('/stage/move', { name: mv.name, label: 'dance', count: 1, of: 2 }); }
  } else if (mv.danceStart && !mv.danced) { mv.danced = true; post('/stage/move', { name: mv.name, label: 'dance', count: 2, of: 2 }); }
  if (p.label) { const txt = `${p.label} ${p.count}/${p.of}`; if (reps.textContent !== txt) { reps.textContent = txt; reps.style.display = 'block'; reps.style.transform = 'translateX(-50%) scale(1.18)'; setTimeout(() => { reps.style.transform = 'translateX(-50%)'; }, 120); } }
  if (p.stand > .5 || p.pitch) { const c = O.torso.getWorldPosition(_mw); trackT(c, c); trackT(c, c, CAMS.P); }   // his middle, not his feet (lying down they're far apart)
}
const _mw = new THREE.Vector3();
function chaseFrame(t) {
  const ch = state.chase; if (!ch) return;
  const s = t - ch.t0, p = ch.c.at(s), m = ch.c.marks;
  if (!state.away && s >= m.himGoes && s < m.himDone) { state.away = true; state.catHands = null; offChair.begin(); }
  if (state.away && s >= m.himDone) { state.away = false; offChair.end(); }
  if (state.away) offChair.apply(p.him);
  if (!ch.back && s >= m.took) { ch.back = true; post('/stage/cat', { what: 'chase.back' }); }
  const desk = mouse.parent;
  if (p.mouse.on === 'cat') { cat.head.updateWorldMatrix(true, false); mouse.position.copy(desk.worldToLocal(cat.head.localToWorld(_mw.set(.12, -.045, 0)))); mouse.rotation.set(0, cat.root.rotation.y + Math.PI / 2, 0); }
  else if (p.mouse.on === 'bed') { mouse.position.copy(desk.worldToLocal(_mw.set(p.mouse.at.x, p.mouse.at.y + .018, p.mouse.at.z))); mouse.rotation.set(0, .6, 0); }
  else if (p.mouse.on === 'hand') { O.arms.R.hand.updateWorldMatrix(true, false); mouse.position.copy(desk.worldToLocal(O.arms.R.hand.localToWorld(_mw.set(0, -.035, .05)))); mouse.rotation.set(0, O.root.rotation.y, 0); }
  else if (state.away || s >= m.grabbed) { mouse.position.copy(ANCHOR.mouse); mouse.rotation.set(0, 0, 0); }
  if (s >= m.himDone && state.catScene && state.catScene.kind === 'chase') state.catScene = { kind: 'home' };
  if (s >= ch.c.dur) state.chase = null;
  trackT(O.root.position, cat.root.getWorldPosition(_mw));
}
/* the tracking camera: between the two of them (or on him), easing, kept in the room */
function trackT(him, her, T = CAMS.T) {
  const want = V3((him.x + her.x) / 2, .55, Math.min(-.2, (him.z + her.z) / 2));
  want.x = Math.max(-1.3, Math.min(1.4, want.x)); want.z = Math.max(-1.1, want.z);
  T.userData.at = T.userData.at ? T.userData.at.lerp(want, .06) : want;
  T.position.copy(T.userData.at).addScaledVector(T.userData.dir, 10); T.lookAt(T.userData.at);
}
/* she naps on his keyboard (catnap.js): he stops typing, his hands wait on the desk, then he lifts her off with both
   hands and sets her down beside it; body.js has him from when she lies down until his hands are back on the keys */
function catNap() {
  if (kitty.walking || kitty.mode === 'pet' || state.away || state.move) return false;
  const n = keyboardNap({ home: catHome(), kb: { x: ANCHOR.kb.x, z: ANCHOR.kb.z, h: .036 } });
  kitty.walk({ dur: n.dur, at: s => ({ ...n.at(s).cat, done: s >= n.dur }) }, now());
  state.catScene = { kind: 'nap' }; state.nap = { n, t0: now(), told: {} };
  return true;
}
function napFrame(t) {
  const nz = state.nap; if (!nz) return;
  const s = t - nz.t0, m = nz.n.marks;
  if (s >= m.lies && !nz.told.lies) { nz.told.lies = true; post('/stage/cat', { what: 'nap' }); }
  if (s >= m.reachAt - 2.5 && !nz.told.lift) { nz.told.lift = true; post('/stage/cat', { what: 'nap.lift' }); }   // said as his hands go to her
  if (!state.away && s >= m.lies && s < m.himDone) { state.away = true; offChair.begin(); }
  if (state.away && s >= m.himDone) { state.away = false; offChair.end(); }
  if (state.away) offChair.apply(nz.n.at(s).him);
  if (s >= nz.n.dur) state.nap = null;
}
/* she knocks his mug off the desk (mugknock.js): pushes, over it goes, he gets up, squats down for it, puts it back */
const mugProp = props.mug;
function catMug() {
  if (kitty.walking || kitty.mode === 'pet' || state.away || state.move || props.box.visible) return false;
  const k = mugKnock({ home: catHome(), mug: { x: mugProp.userData.home.x, z: mugProp.userData.home.z }, save: Math.random() < .35 });   // now and then he stops her in time (his note)
  kitty.walk({ dur: k.dur, at: s => ({ ...k.at(s).cat, done: s >= k.dur }) }, now());
  state.catScene = { kind: 'mug' }; state.mugKnock = { k, t0: now(), told: false, thud: false };
  return true;
}
function mugFrame(t) {
  const mk = state.mugKnock; if (!mk) return;
  const s = t - mk.t0, p = mk.k.at(s), m = mk.k.marks;
  if (!mk.told && s >= m.pushAt) { mk.told = true; post('/stage/cat', { what: mk.k.saved ? 'mug.save' : 'mug' }); }   // as she starts pushing it: he's reacting while it goes over (his note: "octyn reacted very late")
  if (!mk.thud && s >= m.landed) { mk.thud = true; fx.sfx('mugdrop'); }   // his note: "cat dropping the mug does not make a drop sound"
  if (!state.away && s >= m.himGoes && s < m.himDone) { state.away = true; offChair.begin(); }
  if (state.away && s >= m.himDone) { state.away = false; offChair.end(); }
  if (state.away) { offChair.apply(p.him); const c = O.torso.getWorldPosition(_mw); trackT(c, c, CAMS.P); }
  const desk = mugProp.parent;
  if (p.mug.on === 'hand') { O.arms.L.hand.updateWorldMatrix(true, false); mugProp.position.copy(desk.worldToLocal(O.arms.L.hand.localToWorld(_mw.set(0, -.03, .06)).add(V3(0, -.06, 0)))); mugProp.rotation.set(0, 0, 0); }
  else { mugProp.position.set(p.mug.x, p.mug.y, p.mug.z); mugProp.rotation.set(p.mug.rx, 0, 0); }
  if (s >= m.himDone && state.catScene && state.catScene.kind === 'mug') state.catScene = { kind: 'home' };
  if (s >= mk.k.dur) { state.mugKnock = null; mugProp.position.copy(mugProp.userData.home); mugProp.rotation.set(0, 0, 0); }
}
function catPerch() {
  if (kitty.walking || kitty.mode === 'pet') return false;
  const where = 'head', v = catPlan('perch', where, 25 + Math.random() * 25);
  kitty.walk(v, now()); state.catScene = { kind: 'perch', where };
  post('/stage/cat', { what: 'perch', where, dur: +v.dur.toFixed(1) });
  return true;
}
function catWalk() {
  if (!typist || !typist.inText || kitty.walking || kitty.mode === 'pet') return false;
  state.catScene = { kind: 'keys' };
  typist.interrupt(async ({ put, back }) => {
    const plan = catPlan('keys');
    const t0 = now(); kitty.walk(plan, t0);
    state.catHands = Math.random() < .7 ? 'shrug' : 'hands_head';
    post('/stage/cat', { what: 'walk', keys: plan.keyCount, dur: +plan.dur.toFixed(1) });
    let seen = 0, junk = 0;
    while (now() - t0 < plan.dur) { const s = now() - t0; for (const ch of plan.keysBetween(seen, s)) { put(ch); sound.key(ch); junk++; } seen = s; await sleepMs(33); }
    state.catHands = null;
    await sleepMs(700 + Math.random() * 900);   // he looks at what she did
    for (let i = 0; i < junk; i++) { back(); state.lastKey = now(); sound.key('\b'); await sleepMs(i ? 45 + Math.random() * 25 : 260); }   // one press, then held
  });
  return true;
}
function typeCommit(m) { typing = typing.then(async () => { await atDesk(); state.pane = 'code'; await monacoReady; while (!typist) await new Promise(r => setTimeout(r, 100)); state.typingNow = true; await typist.type(m).finally(() => { state.typingNow = false; }); if (m.id) post('/stage/shown', { id: m.id }); else post('/stage/typed', { to: m.to }); }); }
/* the design tools: the whiteboard, the sprite, the level, made by hand; each tells the show when it's done (the next
   thing the maker did only comes then) */
const design = createDesign($('design'), { busy: () => !!state.handsBusy });
let drawing = Promise.resolve();
/* his screens only change when he's at them (his note: "while octyn is away from his desk the code and game is still
   magically going on? weird"): drawing, the terminal and the game's reload wait until he's back in his chair */
const atDesk = async () => { while (state.away) await new Promise(r => setTimeout(r, 200)); };
function make(m, how) { drawing = drawing.then(atDesk).then(() => { state.pane = 'design'; return how(m); }).catch(e => post('/stage/log', { kind: 'design', message: String(e) })).then(() => { if (m.id) post('/stage/shown', { id: m.id }); }); }
async function term(lines) {
  $('term').innerHTML = '';
  for (const l of lines) { const d = document.createElement('div'); d.className = /✖|fail [1-9]|not ok/.test(l) ? 'bad' : /pass|ℹ fail 0|✔/.test(l) ? 'ok' : ''; d.textContent = l; $('term').appendChild(d); while ($('term').children.length > 3) $('term').firstChild.remove(); await new Promise(r => setTimeout(r, 220)); }
}
let startedAt = null;
$('term').innerHTML = '<div>$ </div>';
function status(s) {
  if (s.project) $('day').innerHTML = `day <b>${esc(s.day ?? '')}</b> · building <b>${esc(s.project)}</b>`;
  if (s.goals) {   // the bar keeps it short: how many are done, the one on screen, the next
    const done = s.goals.filter(g => g.done), now = s.goals.find(g => g.now), next = s.goals.find(g => !g.done && !g.now);
    $('goals').innerHTML = [done.length ? `<span class="done">✓ ${done.length} done</span>` : '', now ? `<span class="now">▸ ${esc(now.text)}</span>` : '', next ? `<span>next: ${esc(next.text)}</span>` : ''].join('');
  }
  if (s.startedAt) startedAt = s.startedAt;
  if (s.watching != null) state.watching = s.watching;
  if (s.game) $('gamelabel').textContent = s.game;
}

/* the stream goal on the bar: the first one not yet hit; one that just hit shows done for a few seconds first */
let goalHitAt = 0, goalHit = null;
function streamGoals(goals) {
  const el = $('sgoal'), justHit = goals.find(g => g.done && !(state.goalsDone || []).includes(g.id));
  state.goalsDone = goals.filter(g => g.done).map(g => g.id);
  if (justHit) { goalHit = justHit; goalHitAt = Date.now(); }
  const g = goalHit && Date.now() - goalHitAt < 8000 ? goalHit : goals.find(x => !x.done);
  if (!g) { el.className = ''; return; }
  el.className = `px on${g.done ? ' hit' : ''}`;
  el.innerHTML = `<span>${g.done ? '✓ ' : ''}<span class="v">${g.value}/${g.target}</span> ${esc(g.label)}</span><span class="b"><i style="width:${Math.min(100, Math.round(g.value / g.target * 100))}%"></i></span>`;
  if (goalHit === g) setTimeout(() => streamGoals(goals), 8100);
}
/* a chat poll (activities): the bars fill as chat votes, the countdown runs, the winner stays up a little */
let pollOff = null, pollId = null;
function poll(m) {
  const el = $('poll'), votes = m.votes || [0, 0], total = Math.max(1, votes[0] + votes[1]), done = m.winner != null;
  el.innerHTML = `<div class="q px">${done ? 'chat picked' : 'type 1 or 2 in chat'}<span>${esc(m.question || '')}</span></div>` +
    m.options.map((o, i) => `<div class="row px${m.winner === i ? ' win' : ''}"><span class="n">${i + 1}</span><span class="name">${esc(o)}</span><span class="bar"><i style="width:${Math.round(votes[i] / total * 100)}%"></i></span><span class="c">${votes[i]}</span></div>`).join('') +
    (done ? '' : '<div class="t"></div>');
  el.className = 'panel on';
  const t = el.querySelector('.t');
  if (t && m.endsIn) { t.style.width = `${Math.min(100, m.endsIn / 600)}%`; requestAnimationFrame(() => requestAnimationFrame(() => { t.style.transition = `width ${m.endsIn / 1000}s linear`; t.style.width = '0%'; })); }
  pollId = m.id; clearTimeout(pollOff);
  if (done) pollOff = setTimeout(() => { if (pollId === m.id) el.className = 'panel'; }, 12000);
}

/* ---------- the show's events ---------- */
const es = new EventSource('/stage/events');
es.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.type === 'say') say(m);
  else if (m.type === 'chat') addChat({ handle: m.handle, text: m.text });
  else if (m.type === 'glance') state.glanceUntil = now() + 1.6;
  else if (m.type === 'segment') state.segment = m.kind;
  else if (m.type === 'status') status(m);
  else if (m.type === 'type') typeCommit(m);
  else if (m.type === 'term') atDesk().then(() => term(m.lines || [])).then(() => { if (m.id) post('/stage/shown', { id: m.id }); });
  else if (m.type === 'board') make(m, design.board);
  else if (m.type === 'sketch') make(m, design.sketch);
  else if (m.type === 'pixels') make(m, design.pixels);
  else if (m.type === 'level') make(m, design.level);
  else if (m.type === 'note') { drawing = drawing.then(() => design.note(m)).catch(() => {}); }
  else if (m.type === 'showcase') { state.show = m.kind || null; if (m.kind === 'art') design.use('pixels'); else if (m.kind === 'level') design.use('level'); }
  else if (m.type === 'preview') atDesk().then(() => { bridge.reset(); $('game').src = m.url; });
  else if (m.type === 'inputs') hands.run(m.seq, m.id, now());
  else if (m.type === 'aim') playBot.aim(m.point, now());
  else if (m.type === 'playtest') state.playtest = !!m.on;   // he's testing: his hands follow the plan, his reflexes only where he sends them   // go there: his reflexes do the running and jumping   // the playtester's plan: his hands carry it out
  else if (m.type === 'snap') post('/stage/snap', { id: m.id, png: snapGame() });   // what the game looks like right now, for his eyes
  else if (m.type === 'reload') location.reload();
  else if (m.type === 'mix') sound.mix(m);
  else if (m.type === 'event') abilities.post({ name: m.name, data: m.data || {}, source: 'show' });
  else if (m.type === 'nudge') nudgeCard(m.kind);
  else if (m.type === 'move') state.moveWanted = { name: m.name, opts: m.opts || {} };   // a payoff: done as soon as he's free
  else if (m.type === 'poll') poll(m);
  else if (m.type === 'goals') streamGoals(m.goals || []);   // voice and music levels, live   // a fix mid-stream: the show sends where it is when the page is back
};

/* ---------- the frame ---------- */
const level = () => { analyser.getFloatTimeDomainData(buf); let e = 0; for (const v of buf) e += v * v; return Math.sqrt(e / buf.length); };
/* his mouth from the voice, relative to how loud this voice gets (a running peak that eases down): a real voice sits
   near its own top for half of every line (Cole's median level put a fixed 9x gain at 0.98: the mouth just hung open),
   so it's scaled to its own range and opens on the loud syllables, closing between them (the meeting fork) */
let mouthPeak = .08;
const mouthOf = (lv) => { mouthPeak = Math.max(.05, lv, mouthPeak * .997); return Math.max(0, Math.min(1, (lv - .02) / (mouthPeak * .8))) ** 1.4; };
function idleHead(t) { return { yaw: .08 * Math.sin(t * .31) + .04 * Math.sin(t * .83), pitch: .05 * Math.sin(t * .23), roll: .03 * Math.sin(t * .41), bs: { eyeBlinkLeft: (t % 4.3) < .12 ? 1 : 0, eyeBlinkRight: (t % 4.3) < .12 ? 1 : 0 } }; }
/* where something is for the cat: the yaw from her head, in her own frame */
const _w = new THREE.Vector3();
function catYaw(world) { const p = cat.root.worldToLocal(_w.copy(world)); return Math.max(-1.1, Math.min(1.1, Math.atan2(-(p.z - cat.head.position.z), p.x - cat.head.position.x))); }
const catSees = () => ({ him: catYaw(O.head.getWorldPosition(_w)), cam: catYaw(CAMS.A.position) });
/* the game in the preview frame talks to the stage (its src/stream.js): its events go to the show, its keys to his hands */
const bridge = createGameBridge({ post: (p, b) => { if (b.type === 'state' && b.state && !(b.state.w > 0)) { try { const c = $('game').contentDocument.querySelector('canvas'); if (c) Object.assign(b.state, { w: c.width, h: c.height }); } catch {} }   // the screen's size: without it a fall off the bottom can't be seen
  post(p, b); if (b.type === 'event') { abilities.post({ name: `game.${b.name}`, data: b.data, source: 'game' }); playBot.event(b.name, now()); if (/^(fall|fell|die|death|dead)$/.test(b.name)) gameFellAt = now(); } } });
/* his ears on the game (his note: "give it eyes nose ears whatever no blind deaf"): its uncaught errors, failed promises
   and console errors go to the show as they happen */
$('game').addEventListener('load', () => {
  try {
    const w = $('game').contentWindow, say = message => post('/stage/game', { type: 'error', message: String(message).slice(0, 240) });
    w.addEventListener('error', e => say(`${e.message || 'error'}${e.filename ? ` at ${e.filename.split('/').pop()}:${e.lineno}` : ''}`));
    w.addEventListener('unhandledrejection', e => say(`unhandled promise: ${e.reason && e.reason.message || e.reason}`));
    const ce = w.console.error.bind(w.console); w.console.error = (...a) => { say(a.map(x => x && x.message ? x.message : String(x)).join(' ')); ce(...a); };
  } catch {}
});
/* and his eyes: once a second, the game's canvas in 16 by 9 pixels: blank (all one colour), or unchanged while keys are
   pressed (frozen); with which way he's holding, so the show can tell a hero that won't move */
const _fc = document.createElement('canvas'); _fc.width = 16; _fc.height = 9;
let _fh = null, _still = 0, _keysSec = { left: 0, right: 0, jump: 0, n: 0 }, _lastLook = 0, _codesSec = new Set();
function lookAtGame(t, keys, codes = new Set()) {
  _keysSec.n++; for (const k of ['left', 'right', 'jump']) if (keys[k]) _keysSec[k]++;
  for (const c of codes) _codesSec.add(c);
  if (t - _lastLook < 1) return;
  _lastLook = t;
  let c = null; try { c = $('game').contentDocument && $('game').contentDocument.querySelector('canvas'); } catch {}
  const held = { left: _keysSec.left > _keysSec.n / 2, right: _keysSec.right > _keysSec.n / 2 }, anyKey = _keysSec.left + _keysSec.right + _keysSec.jump > 0;
  _keysSec = { left: 0, right: 0, jump: 0, n: 0 };
  const pressedNow = [..._codesSec], mouseNow = state.mouseUsed > t - 1.05; _codesSec = new Set();
  if (!c || !c.width) { post('/stage/game', { type: 'frame', blank: false, stillSecs: 0, keys: anyKey || mouseNow, held, codes: pressedNow, mouse: mouseNow }); return; }
  const x = _fc.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0, 16, 9);
  const d = x.getImageData(0, 0, 16, 9).data; let hash = 0, blank = true;
  for (let i = 0; i < d.length; i += 4) { hash = (hash * 31 + d[i] * 7 + d[i + 1] * 3 + d[i + 2]) | 0; if (Math.abs(d[i] - d[0]) + Math.abs(d[i + 1] - d[1]) + Math.abs(d[i + 2] - d[2]) > 12) blank = false; }
  _still = hash === _fh && anyKey ? _still + 1 : 0; _fh = hash;
  post('/stage/game', { type: 'frame', blank, stillSecs: _still, keys: anyKey || mouseNow, held, codes: pressedNow, mouse: mouseNow });
}
/* the game's canvas as a small png (up to 480 wide), for the playtester to look at */
function snapGame() {
  try {
    const c = $('game').contentDocument.querySelector('canvas'); if (!c || !c.width) return null;
    const k = Math.min(1, 480 / c.width), o = document.createElement('canvas'); o.width = Math.round(c.width * k); o.height = Math.round(c.height * k);
    const x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, o.width, o.height);
    return o.toDataURL('image/png').split(',')[1];
  } catch { return null; }
}
/* a fall the game never said (he saw it go), and a hero that never came back (no respawn: a bug he'll call out) */
let gameFellAt = -Infinity, botFalls = 0, stuckSaid = false;
function watchFalls(t) {
  const s = playBot.status(t);
  if (s.falls > botFalls) { botFalls = s.falls; if (t - gameFellAt > 1.5) post('/stage/game', { type: 'event', name: 'fall', data: { seen: true } }); }
  if (s.goneFor > 4.5 && !stuckSaid) {   // never came back: he says so, and restarts it (his note: "dw i will respawn it and then try it again")
    stuckSaid = true; post('/stage/game', { type: 'event', name: 'stuck', data: {} });
    setTimeout(() => { const g = $('game'); if (g && g.src) { bridge.reset(); g.src = g.src.replace(/([?&])r=\d+/, '$1').replace(/[?&]$/, '') + (g.src.includes('?') ? '&' : '?') + 'r=' + Date.now(); } }, 3000);
  }
  if (!s.goneFor) stuckSaid = false;
}
/* him playing the game (his notes: "hands are off, octyn is totally off the chair but the game is still being played",
   "game shouldnt feel like a recorded clip"): the stage presses the game's keys (playbot.js), only while his hands are
   on them: a gesture, an act or getting up lets go and the hero stops. his hands press exactly those keys, and the keys
   show on the game's corner as they go down */
const playBot = createPlayBot();
const hands = createHands();
/* any key into the game (a KeyboardEvent code), down and up as his plan says; its key value as a browser would give it */
const keyOf = c => c === 'Space' ? ' ' : /^Key[A-Z]$/.test(c) ? c.slice(3).toLowerCase() : /^Digit\d$/.test(c) ? c.slice(5) : /^(Shift|Control|Alt)/.test(c) ? c.replace(/(Left|Right)$/, '') : c;
const heldCodes = new Set();
function pressCodes(codes) {
  const w = $('game').contentWindow; if (!w) return;
  const send = (type, code) => { try { w.document.dispatchEvent(new w.KeyboardEvent(type, { code, key: keyOf(code), bubbles: true })); } catch {} };   // on the document: it reaches the window's listeners too
  for (const c of [...heldCodes]) if (!codes.has(c)) { heldCodes.delete(c); send('keyup', c); }
  for (const c of codes) if (!heldCodes.has(c)) { heldCodes.add(c); send('keydown', c); }
  const shown = [...heldCodes].map(c => CAP[c] || keyOf(c).toUpperCase()).slice(0, 4).join('|');
  if (capsEl.dataset.shown !== shown) { capsEl.dataset.shown = shown; capsEl.innerHTML = shown ? shown.split('|').map(k => `<i class="down">${esc(k)}</i>`).join('') : '<i>·</i>'; }
}
const CAP = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'SPACE', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT', ControlLeft: 'CTRL', Enter: 'ENTER', Escape: 'ESC' };
/* the mouse in the game's own pixels: pointer and mouse events on its canvas, where a person's would land */
function mouseAt(m) {
  try {
    const d = $('game').contentDocument, w = $('game').contentWindow, c = d.querySelector('canvas'); if (!c) return;
    const r = c.getBoundingClientRect(), x = r.left + m.x * r.width / c.width, y = r.top + m.y * r.height / c.height, button = m.action === 'right' ? 2 : 0;
    const ev = (T, type) => c.dispatchEvent(new T(type, { clientX: x, clientY: y, button, buttons: type.endsWith('down') ? (button ? 2 : 1) : 0, bubbles: true, pointerType: 'mouse' }));
    ev(w.PointerEvent, 'pointermove'); ev(w.MouseEvent, 'mousemove');
    if (m.action === 'click' || m.action === 'right' || m.action === 'down') { ev(w.PointerEvent, 'pointerdown'); ev(w.MouseEvent, 'mousedown'); }
    if (m.action === 'click' || m.action === 'right' || m.action === 'up') { ev(w.PointerEvent, 'pointerup'); ev(w.MouseEvent, 'mouseup'); ev(w.MouseEvent, m.action === 'right' ? 'contextmenu' : 'click'); }
    state.mouseUsed = now();
  } catch {}
}
/* the reflex bot's keys as codes, and codes back as his fingers (left, right, up, down, a press) */
const codesOf = k => new Set([...(k.left ? ['ArrowLeft'] : []), ...(k.right ? ['ArrowRight'] : []), ...(k.down ? ['ArrowDown'] : []), ...(k.jump ? ['Space', 'ArrowUp'] : []), ...(k.up ? ['ArrowUp'] : [])]);   // a jump is space and up: an older game reads either
const keysOf = cs => ({ left: cs.has('ArrowLeft') || cs.has('KeyA'), right: cs.has('ArrowRight') || cs.has('KeyD'), up: cs.has('ArrowUp') || cs.has('KeyW'), down: cs.has('ArrowDown') || cs.has('KeyS'),
  jump: [...cs].some(c => !/^(Arrow|KeyA$|KeyD$|KeyW$|KeyS$)/.test(c)) });
const capsEl = document.createElement('div'); capsEl.className = 'keycaps px';
capsEl.innerHTML = '<i>·</i>';
$('preview').appendChild(capsEl);
window.addEventListener('message', e => {
  if (e.source !== $('game').contentWindow) return;
  bridge.receive(e.data);
  /* where the hero is on the game's screen, so he keeps him on it (a game that lets you walk off the edge) */
  if (e.data && e.data.src === 'game' && e.data.type === 'state') { let w = 0, h = 0; try { const c = $('game').contentDocument.querySelector('canvas'); w = c ? c.width : 0; h = c ? c.height : 0; } catch {} playBot.see({ ...e.data, w: e.data.w || w, h: e.data.h || h }, now()); }   // the level as the game sees it: he plays it
});
/* his monitor shows what's up on the stream: the tool he's making something in, or his game */
const mon = monitor.image.getContext('2d');
let monWas = 'code';
function mirror() {
  const layout = PAGE.className, what = layout === 'design' ? 'design' : layout === 'play' ? 'game' : 'code';
  try {
    if (what === 'design') { mon.imageSmoothingEnabled = true; design.mirror(mon, monitor.image.width, monitor.image.height); monitor.needsUpdate = true; }
    else if (what === 'game') { const c = $('game').contentDocument && $('game').contentDocument.querySelector('canvas'); if (c) { mon.imageSmoothingEnabled = false; mon.drawImage(c, 0, 0, monitor.image.width, monitor.image.height); monitor.needsUpdate = true; } }
    else if (monWas !== 'code' || state.tinted || state.codeDirty || now() > (state.codeDrawnAt || 0) + .5) { drawEditor(); state.codeDirty = false; state.codeDrawnAt = now(); }
    const tint = fx.monitorTint();
    if (tint) { mon.globalAlpha = tint.a; mon.fillStyle = tint.c; mon.fillRect(0, 0, monitor.image.width, monitor.image.height); mon.globalAlpha = 1; monitor.needsUpdate = true; }
    state.tinted = !!tint;
  } catch {}
  monWas = what;
}
/* the editor on his monitor, as it is: the lines in view at their real lengths and indents, a hint of their colours
   (keywords amber, strings sage, comments dim), the line he's on and his cursor */
const KW = /^(const|let|var|function|export|import|from|return|if|else|for|while|new|class|async|await|of|in)$/;
function drawEditor() {
  const ed = state.editor, g = monitor.image.getContext('2d'), W = monitor.image.width, Hh = monitor.image.height;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#1B1D22'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#272A31'; g.fillRect(0, 0, 10, Hh);
  const model = ed && ed.getModel();
  if (model) {
    const vr = ed.getVisibleRanges()[0], first = vr ? vr.startLineNumber : 1, lh = 5, rows = Math.floor((Hh - 4) / lh), pos = ed.getPosition() || { lineNumber: 0, column: 0 };
    for (let i = 0; i < rows; i++) {
      const n = first + i; if (n > model.getLineCount()) break;
      const line = model.getLineContent(n), y = 3 + i * lh;
      if (n === pos.lineNumber) { g.fillStyle = '#24211E'; g.fillRect(10, y - 1, W - 10, lh); }
      g.fillStyle = '#4A4640'; g.fillRect(3, y + 1, 4, 2);   // the line number
      const comment = /^\s*\/\//.test(line);
      let x = 13, inStr = false;
      for (const tok of line.split(/(\s+)/)) {
        if (!tok) continue;
        const w = tok.length * 1.35;
        if (!/\S/.test(tok)) { x += w; continue; }
        g.fillStyle = comment ? '#6F6A60' : /^['"`]/.test(tok) || inStr ? '#8FA38A' : KW.test(tok.replace(/[^a-z]/g, '')) && /^[a-z]+/.test(tok) ? '#E3A94F' : /^\d/.test(tok) ? '#C0664A' : '#B9B3A6';
        if (/^['"`]/.test(tok) && !/['"`].*['"`]/.test(tok)) inStr = true; else if (inStr && /['"`]/.test(tok)) inStr = false;
        g.fillRect(Math.round(x), y + 1, Math.max(1, Math.round(w - .4)), 2); x += w; if (x > W - 2) break;
      }
      if (n === pos.lineNumber && Math.floor(now() * 2) % 2 === 0) { g.fillStyle = '#F1D9A8'; g.fillRect(Math.round(13 + (pos.column - 1) * 1.35), y, 1, 4); }   // his cursor
    }
  }
  g.restore(); monitor.needsUpdate = true;
}
const frameTimes = [];
let last = 0, cam = 'A', perfAt = now() + 5;
function frame() {
  requestAnimationFrame(frame);
  const t = now();
  if (t - last < 1 / 31) return;   // 30 fps
  last = t;
  const t0 = performance.now(), l = state.line, speaking = !!l && t >= l.start && t <= l.start + l.dur + .1;
  abilities.step();
  if (state.catScene && !kitty.walking) state.catScene = null;
  { const s = catLife.due(t, { keys: !!state.typingNow && !!typist && typist.inText, perch: !state.typingNow && !state.act && state.segment !== 'soon' && PAGE.className !== 'play' });
    // the chase wants him at his desk and not typing: the same moments as the perch
    if (!s && !state.typingNow && !state.act && state.segment !== 'soon' && PAGE.className !== 'play' && catLife.due(t, { chase: true }) === 'chase' && catChase()) catLife.did('chase', t);
    if (s && (s === 'keys' ? catWalk() : s === 'chase' ? catChase() : catPerch())) catLife.did(s, t);
    // the nap wants him typing, like the keyboard walk
    if (!s && !!state.typingNow && catLife.due(t, { nap: true }) === 'nap' && catNap()) catLife.did('nap', t);
    // the mug wants him at his desk, not typing, and the box not in her way
    if (!s && !state.typingNow && !state.act && state.segment !== 'soon' && !props.box.visible && catLife.due(t, { mug: true }) === 'mug' && catMug()) catLife.did('mug', t); }
  const catOff = state.catHands ? catHands(state.catAt) : 0;
  const g = (l ? gestureAt(l.windows, t) : null) || fx.gesture() || (catOff > 0 ? { name: state.catHands, w: catOff, u: .5, id: 7 } : null);
  const head = speaking && l.head ? l.head[Math.min(l.head.length - 1, Math.floor((t - l.start) * 30))] : null;
  const lib = head || idleHead(t);
  const look = t < state.glanceUntil ? { yaw: -.22, pitch: .12 } : (!speaking && state.segment === 'build' ? { yaw: 0, pitch: .1 } : null);
  const lv = speaking ? level() : 0;
  if (state.actHold) state.act = { name: state.actHold.name, t0: t - state.actHold.u * ACTS[state.actHold.name].dur };
  if (state.act && t > state.act.t0 + ACTS[state.act.name].dur) state.act = null;
  const acting = state.act && t >= state.act.t0 ? state.act : null;
  const layout = PAGE.className;
  const gd = g && G[g.name];
  state.handsBusy = !!(acting || state.away || (gd && (gd.R || gd.L) && g.w > .25));   // his hands off the mouse and keys: the work on his screens waits
  const handsFree = layout === 'play' && bridge.ready && !acting && !state.away && !(gd && (gd.R || gd.L) && g.w > .25);
  /* his hands: the playtester's plan when there is one (any keys, the mouse), else his reflexes (the play bot) */
  const hs = hands.tick(t);
  if (hs.done) post('/stage/hands', { id: hs.done });
  const planned = hands.busy || hs.held.size > 0;
  const codes = !handsFree ? new Set() : planned ? hs.held : !state.playtest || playBot.aiming(t) ? codesOf(playBot.keys(t)) : new Set();
  if (handsFree) for (const m of hs.mouse) mouseAt(m);
  const keysNow = keysOf(codes);   // for his fingers on the keyboard
  if (layout === 'play') { watchFalls(t); lookAtGame(t, keysNow, codes); }   // only a game he is playing
  if (layout === 'play' && bridge.ready) pressCodes(codes);
  capsEl.style.display = layout === 'play' ? 'flex' : 'none';
  $('preview').classList.toggle('stopped', layout !== 'play');   // his note: coding AND playing at once. the game runs when he launches it to play, not while he codes
  const body = perform(t, g, lib, mouthOf(lv), look, acting, layout === 'play' ? 'play' : layout === 'design' ? 'draw' : null, layout === 'play' ? keysNow : null, speaking && l.face ? l.face : null);
  if (state.afterPose) state.afterPose(t);   // the meeting fork: hands on the monitor he's picking up
  state.petting = !!(body && body.petting);
  if (body && body.pressed > (state.pressed || 0)) sound.key('a');   // a key going down at play clicks
  state.pressed = body ? body.pressed : 0;
  { const mood = fx.face(); if (mood) drawFace(O, { blink: 0, brow: mood === 'angry' ? -.5 : .3, angry: mood === 'angry', happy: mood === 'happy' && lv < .02 ? 1 : 0, smile: mood === 'happy' ? 1 : 0, jaw: Math.min(1, lv * 12), look: mood === 'look' ? 1 : 0, gx: 0, mood }); }
  if (fx.tv(O.face)) O.faceTex.needsUpdate = true;
  sound.update(t, { speaking, lean: O.torso.rotation.x, away: state.away ? Math.hypot(O.root.position.x, O.root.position.z) / 1.4 + (O.root.rotation.x ? .3 : 0) : 0 });   // off across the room, the mic hears him far
  if (++state.n % 2 === 0) { const cp = state.catPose || kitty.update(t, { ...catSees(), loud: speaking && (l.size === 'big' || lv > .18), petting: state.petting }); state.catAt = cp.at || null; applyCat(cat, cp); }   // on twos, like him
  if (state.moveWanted && startMove(state.moveWanted.name, state.moveWanted.opts)) state.moveWanted = null;
  chaseFrame(t); moveFrame(t); recoverFrame(t); boxFrame(t); napFrame(t); mugFrame(t);
  if (!!state.away !== !!state.wasAway) { state.wasAway = !!state.away; post('/stage/busy', { on: !!state.away, why: state.move ? state.move.name : state.catScene ? state.catScene.kind : '' }); }   // the show holds chat while he's up
  if (!Number.isFinite(O.torso.rotation.y + O.head.rotation.x + O.torso.position.y) && !state.nanSaid) { state.nanSaid = true; post('/stage/log', { kind: 'nan', message: 'his body went NaN' }); }
  captions(t);
  if (startedAt) { const s = Math.max(0, Math.floor((Date.now() - startedAt) / 1000)); $('clock').textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}${state.watching ? ` · ${state.watching} watching` : ''}`; }
  PAGE.className = director.layout(state.segment, { pane: state.pane, show: state.show });
  if (state.n % 3 === 0) mirror();
  const was = cam;
  cam = state.camHold || director.update(t, { segment: state.segment, speaking, big: speaking && l.size === 'big', boundary: !speaking || t - l.start < .15,
    act: acting ? acting.name : state.move ? state.move.name : null, catMode: !state.catScene ? kitty.mode : state.catScene.kind === 'home' ? 'look' : state.catScene.kind === 'box' ? 'box' : state.catScene.kind === 'nap' ? 'nap' : state.catScene.kind === 'mug' ? (state.away && !(state.mugKnock && state.mugKnock.k.saved) ? 'mugfetch' : 'mug') : state.catScene.kind === 'keys' ? 'walk' : state.catScene.kind, catSaid: speaking && l.cat, chatCat: state.chatCat || 0, typing: !!state.typingNow });
  if (cam !== was && !state.camHold) post('/stage/log', { kind: 'cut', cam, why: director.why });
  { const c = CAMS[cam], sh = fx.shake(), z = fx.zoom(), p0 = c.position.clone(), z0 = c.zoom;
    if (sh) c.position.add(new THREE.Vector3(sh[0], sh[1], 0)); if (z !== 1) { c.zoom = z0 * z; c.updateProjectionMatrix(); }
    render(c); fx.frame(c);
    c.position.copy(p0); if (z !== 1) { c.zoom = z0; c.updateProjectionMatrix(); } }
  frameTimes.push(performance.now() - t0); if (frameTimes.length > 300) frameTimes.shift();
  if (t > perfAt) { perfAt = t + 5; const s = frameTimes.slice().sort((a, b) => a - b); post('/stage/perf', { p50: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * .95)], cam }); }
}
requestAnimationFrame(frame);
window.addEventListener('error', e => post('/stage/log', { kind: 'error', message: String(e.message), at: `${e.filename}:${e.lineno}` }));
window.addEventListener('unhandledrejection', e => post('/stage/log', { kind: 'rejection', message: String(e.reason) }));
/* banner mode (?banner=1, his ask: "a looping switching animation that could work as a video banner"): only his room,
   full frame, cutting between shots every few seconds with a crt channel flip; each time round it marks the loop's start
   (/banner/loop) so the recording can be cut to one seamless loop */
{ const P = new URLSearchParams(location.search);
  if (P.has('banner')) {
    document.documentElement.classList.add('banner');
    const shots = (P.get('shots') || 'A,C,K,B').split(','), each = +(P.get('each') || 4000);
    const noise = document.createElement('canvas'); noise.width = 320; noise.height = 180; noise.id = 'flip'; PAGE.appendChild(noise);
    const ng = noise.getContext('2d');
    const flip = () => { const t0 = performance.now(); noise.style.opacity = 1;
      const draw = () => { const u = (performance.now() - t0) / 260; if (u >= 1) { noise.style.opacity = 0; return; }
        const img = ng.createImageData(320, 180); for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 200; img.data[i] = v; img.data[i + 1] = v * .95; img.data[i + 2] = v * .85; img.data[i + 3] = 255; }
        ng.putImageData(img, 0, 0); ng.fillStyle = 'rgba(241,217,168,.5)'; ng.fillRect(0, (u * 180 * 3) % 180, 320, 6); requestAnimationFrame(draw); };
      draw(); };
    let i = 0;
    state.segment = 'build';
    const cut = () => { if (i % shots.length === 0) post('/banner/loop', { t: Date.now() }); flip(); setTimeout(() => { state.camHold = shots[i % shots.length]; i++; }, 110); };
    setTimeout(() => { cut(); setInterval(cut, each); }, 2500);
  } }
window.stage = { O, cat, lights, ortho, sound, audio, props, state, kitty, catSees, CAMS, design, abilities, fx, catWalk, catPlan, catChase, startMove, dropBox, catNap, nudgeCard, catMug, partyHat, holdCam };   // for the stills script: state.camHold, state.catPose and state.actHold ({ name, u }) pin a shot
window.stageReady = true;
