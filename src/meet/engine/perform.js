/* the performer: octyn works by default (left hand on the keyboard, right on the mouse); a phrase's gesture takes his
   hands off and gives them back. a gesture is where each wrist goes at its peak (relative to his chest), the hand's shape,
   which way the back of the hand faces, optionally where the fingers aim (the wrist bends), plus lean, lift and head moves. the talking library adds only head and eye life.
   sloppy on purpose (his note: "everything is too smooth make it a little sloppy"): the body moves on twos like the reels,
   hands arrive on springs that overshoot a touch, one hand leads and the other follows a beat late, every phrase lands
   its pose a little differently, and held poses drift. gestures that are only a look (no, nah, a nod) leave the hands
   on the keyboard and mouse; they just stop working. */
import * as THREE from 'three';
import { V3 } from './look.js';
import { setArm, drawFace, SHAPES } from './octyn.js';
import { DESK, ANCHOR } from './room.js';
import { ACTS, actAt } from './acts.js';
import { playHands } from './playhands.js';
const catRay = new THREE.Raycaster();   // finds her fur under his palm while he pets her

export const G = {
  /* a cheer: fists up, palms to the front, thumbs in (backs of the hands to the front had the thumbs pointing out: his
     "inverted thumbs") */
  arms_up: { R: [V3(-.46, .66, .2), 'fist', V3(-.35, 0, -1)], L: [V3(.5, .56, .24), 'fist', V3(.35, 0, -1)], lead: 'R', lean: -.05, face: 'happy' },
  thumbs_up: { R: [V3(-.3, .32, .36), 'thumbsup', V3(-1, 0, 0)], face: 'happy' },   // up by his chest, not at his hip
  lean_in: { lean: .2, head: { pitch: .12 } },
  look_up: { head: { pitch: -.1 }, face: 'look' },
  point: { R: [V3(-.2, .26, .5), 'point', V3(0, 1, 0)], lean: .08 },   // above the monitor's edge, where camera A sees it
  /* grabs the sides of his tv: palms in, fingers up, elbows out */
  hands_head: { R: [V3(-.315, .33, .05), 'flat', V3(-1, 0, 0)], L: [V3(.315, .35, .05), 'flat', V3(1, 0, 0)], lead: 'L', lean: -.03, face: 'angry' },
  slam: { R: [V3(-.2, -.3, .45), 'fist', V3(0, 1, 0)], L: [V3(.2, -.3, .45), 'fist', V3(0, 1, 0)], lead: 'R', lean: .12, slam: true, face: 'angry' },
  /* no / no no no: the head says it, the hands stay put */
  head_shake: { head: { shake: 1 }, lean: -.04, face: 'angry' },
  /* the flat stare: stops working, sits back a touch, half-lidded */
  deadpan: { lean: -.06, head: { pitch: .03 }, face: 'flat' },
  explain: { R: [V3(-.22, .2, .4), 'loose', V3(-.85, .2, -.45)], beat: 'R', talk: 'R' },   // talking: his hand keeps changing with the phrase (TALK, below), never one open palm held for the whole line
  /* acting out the words instead of beating the air (his note on the beats: "ai looking and same same"):
     present  "okay so basically": the mouse hand comes up, palm up, and offers it once
     float    "the jump feels like the moon": the hand is the jump, up slow and drifting down
     point_screen  "set gravity to two": points at the line on his screen, with a poke
     me       "that genius? me": flat hand on his chest */
  present: { R: [V3(-.22, .2, .42), 'open', V3(0, -1, 0), V3(-.25, .1, 1)], offer: 'R', lean: .03 },   // offered toward the camera, not a tray out at his side
  float: { R: [V3(-.44, .1, .3), 'flat', V3(0, 1, .2), V3(1, .15, .35)], path: { R: u => V3(.08 * u, .34 * Math.sin(Math.PI * Math.min(1, u * 1.1)), .05 * u) }, head: { pitch: -.04 } },   // the arc rises beside his screen, never across it
  point_screen: { R: [V3(-.14, .18, .46), 'point', V3(0, 1, 0), V3(.3, -.35, 1)], poke: 'R', lean: .1, head: { pitch: .06 } },
  me: { R: [V3(-.08, 0, .2), 'flat', V3(0, .2, 1), V3(1, 0, .1)], lean: -.03, face: 'flat' },   // flat on his chest, fingers across it, below the screen
  shrug: { R: [V3(-.36, .14, .3), 'open', V3(0, -1, 0)], L: [V3(.36, .14, .3), 'open', V3(0, -1, 0)], lead: 'R', lift: .05 },   // palms up at his sides, clear of the desk
  lean_back: { lean: -.16, face: 'happy' },
  /* smug: leans back and brushes the dust off his shoulder (hands behind the head hide behind the tv and read as hands up) */
  smug: { R: [V3(.2, .03, .13), 'flat', V3(-.3, .2, 1)], brush: 'R', lean: -.14, face: 'happy' },   // the far shoulder, below the screen's edge
  /* the brush-off: palm out to the camera (edge-on, an open hand reads as one raised finger) */
  wave_off: { R: [V3(-.36, .3, .32), 'open', V3(-.4, .3, -1)], wave: 'R', lean: -.08 },   // chest high, where the brush-off reads
  /* the meeting fork: a hello from his chair. hand up beside his screen, palm to the camera, fingers up, side to side */
  hello: { R: [V3(-.43, .33, .2), 'open', V3(-.3, 0, -1), V3(-.15, 1, 0)], wave: 'R', lean: -.04, face: 'happy' },   // elbow bent, forearm up, hand by his screen
  nod: { head: { nod: 1 }, face: 'flat' },
  peace: { R: [V3(-.3, .36, .3), 'peace', V3(0, 0, -1)], face: 'happy' },
  type: {}, mouse: {},
};
/* a hand while it talks (his note: an open palm the whole time): finger and thumb together making a point, a loose hand
   edge-on, one finger up, a relaxed curl, and only sometimes a half-open palm. each lasts a phrase or so, in no fixed order */
const TALK = [
  { at: V3(-.2, .21, .42), shape: 'pinch', back: V3(-.85, .25, -.45) },
  { at: V3(-.27, .15, .38), shape: 'loose', back: V3(-.9, .1, -.3) },
  { at: V3(-.18, .25, .44), shape: 'point', back: V3(-.7, .1, -.7), aim: V3(-.05, 1, .2) },
  { at: V3(-.24, .11, .36), shape: 'relaxed', back: V3(-.6, .5, -.5) },
  { at: V3(-.21, .17, .43), shape: 'pinch', back: V3(-.8, .05, -.6) },
  { at: V3(-.25, .19, .41), shape: 'loose', back: V3(.2, -.7, -.6) },
];
const TALK_STEP = .78;
const talkBeat = (id, t) => { const n = Math.floor(Math.max(0, t - id) / TALK_STEP), a = i => Math.floor(rnd(id, 20 + i) * TALK.length); let k = a(n); if (n && k === a(n - 1)) k = (k + 1) % TALK.length; return TALK[k]; };
/* at play: the right hand over the arrow keys (his right is -x), the left thumb on the space bar, nearest row */
const ARROWS = V3(ANCHOR.kb.x - .17, DESK.top + .055, ANCHOR.kb.z - .05), SPACE = V3(ANCHOR.kb.x + .04, DESK.top + .055, ANCHOR.kb.z - .065);
/* at the keys: his wrist sits well back of the home row, so his fingertips land on it (a wrist over the keyboard put them on
   the function row, his note). on the mouse: wrist behind it, palm over it, two fingers on the buttons */
const TYPE = { R: V3(ANCHOR.kb.x - .105, DESK.top + .07, ANCHOR.kb.z - .105), L: V3(ANCHOR.kb.x + .105, DESK.top + .07, ANCHOR.kb.z - .105) };
const HOME = { R: { t: V3(ANCHOR.mouse.x + .002, DESK.top + .068, ANCHOR.mouse.z - .105), shape: 'mouse' }, L: { t: TYPE.L, shape: 'type' } };
const AIM = { R: V3(.06, -.2, 1).normalize(), L: V3(-.06, -.2, 1).normalize(), mouse: V3(0, -.14, 1).normalize() };
/* one keystroke at a time, a person's: both hands, mostly the strong fingers, the odd reach up or down a row, a thumb for the
   space bar. the same t always gives the same key */
const KEYS_PER_S = 5.5;
function keystroke(t) {
  const n = Math.floor(t * KEYS_PER_S), u = t * KEYS_PER_S - n, r = k => { const x = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
  const space = n % 6 === 5 && r(1) < .8, pick = r(2);
  return { n, space, hand: space ? 'R' : r(3) < .5 ? 'L' : 'R', finger: space ? 4 : pick < .46 ? 0 : pick < .78 ? 1 : pick < .94 ? 2 : 3, row: r(4) < .55 ? 0 : r(4) < .85 ? 1 : -1, press: u < .55 ? Math.sin(Math.PI * u / .55) : 0 };
}
const FPS = 30, TWOS = 2, DT = TWOS / FPS;
/* a phrase's own dice (seeded by when it starts), and a slow drift for held poses */
const rnd = (seed, k) => { const x = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
const wob = (t, k) => Math.sin(t * 1.3 + k * 1.7) * .6 + Math.sin(t * 2.9 + k * 3.1) * .4;
/* springs: arrive quick, overshoot a touch, settle (critically damped reads as machine smooth) */
function springV(x, v, T, w, z) { for (let i = 0; i < 4; i++) { const h = DT / 4; v.addScaledVector(T.clone().sub(x), w * w * h).addScaledVector(v, -2 * z * w * h); x.addScaledVector(v, h); } }
function springS(s, T, w, z) { for (let i = 0; i < 4; i++) { const h = DT / 4; s.v += (w * w * (T - s.x) - 2 * z * w * s.v) * h; s.x += s.v * h; } }
const shapeOf = n => { const [f, t] = Array.isArray(n) ? n : SHAPES[n] || SHAPES.relaxed; return [f.slice(), [t[0], t[1], t[2] ?? .7]]; };
function mixShape(a, b, k) { const [fa, ta] = shapeOf(a), [fb, tb] = shapeOf(b); return [fa.map((x, i) => x + (fb[i] - x) * k), ta.map((x, i) => x + (tb[i] - x) * k)]; }

/* acts: his hand goes to a place (acts.js says which, when), and a prop in his hand rides in his palm. a place is where
   the grip point (inside the curled fingers, in hand space) lands, with which way the back of the hand faces and where
   the fingers aim; the wrist target follows from those */
const GRIP = V3(0, -.045, .075), PALM = V3(0, -.035, .05), HELD = [[1.05, 1.05, 1.1, 1.15], [.7, .9]];
const CRADLE = [[.35, .3, .35, .45], [.25, .2, .9]], ON_PALM = V3(0, -.032, .05);   // a phone lying in the palm, fingertips just over its edges
const LIFT = { can: .06, mug: .05 };   // how far up from its base he holds it
const wristFor = (grip, back, aim, off = GRIP) => { const fd = aim.clone().normalize(), bk = back.clone().sub(fd.clone().multiplyScalar(back.dot(fd))).normalize();
  return grip.clone().sub(bk.multiplyScalar(off.y)).sub(fd.multiplyScalar(off.z)); };
const Q_UP = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));   // a can's up is along the hand's -x
const Q_PALM = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));   // phone space (screen +z, top +y) in hand space: screen out of the palm (-y), top along the fingers (+z)

export function makePerformer(O, mouse, world = {}) {
  const st = { lean: { x: 0, v: 0 }, lift: { x: 0, v: 0 }, toCat: { x: 0, v: 0 }, hands: { R: HOME.R.t.clone(), L: HOME.L.t.clone() }, vel: { R: V3(0, 0, 0), L: V3(0, 0, 0) },
    head: V3(0, 0, 0), headV: V3(0, 0, 0), hist: [], ready: false, face: null,
    shape: { R: shapeOf(HOME.R.shape), L: shapeOf(HOME.L.shape) }, back: { R: V3(0, 1, 0), L: V3(0, 1, 0) },
    aim: { R: V3(0, 0, 1), L: V3(0, 0, 1) }, aimK: { R: 0, L: 0 } };
  /* the gesture as it stood `ago` seconds back (the following hand runs a beat late) */
  const at = (t, ago) => { if (!ago) return st.hist.length ? st.hist[st.hist.length - 1].g : null; for (let i = st.hist.length - 1; i >= 0; i--) if (st.hist[i].t <= t - ago) return st.hist[i].g; return null; };
  function face(def, w, lib, mouth, lineFace = null) {
    const bs = (lib && lib.bs) || {}, mood = w > .5 && def.face ? def.face : lineFace;
    st.mood = mood;
    const blink = Math.max(bs.eyeBlinkLeft || 0, bs.eyeBlinkRight || 0) > .5 ? .9 : mood === 'flat' ? .45 : 0;
    drawFace(O, { blink, brow: (bs.browInnerUp || 0) * 1.4 - ((bs.browDownLeft || 0) + (bs.browDownRight || 0)) / 2,
      angry: mood === 'angry', happy: mood === 'happy' && mouth < .25 ? 1 : 0, smile: mood === 'happy' ? 1 : ((bs.mouthSmileLeft || 0) + (bs.mouthSmileRight || 0)) / 2,
      jaw: Math.min(1, mouth * 1.3), look: mood === 'look' ? 1 : 0, gx: 0, mood });
  }
  /* look: where his eyes go beyond the talking head ({ yaw, pitch } in radians: chat is to his left, the code ahead) */
  function place(where, s, a, ap, base, tq) {
    const out = sd => sd === 'L' ? 1 : -1;
    if (where === 'home') return { wrist: base[s].clone(), shape: HOME[s].shape, back: V3(0, 1, 0), aim: null };
    if (where === 'up') { const aim = V3(out(s) * .5, 1, -.2); return { wrist: V3(out(s) * .38, .64, -.08).applyQuaternion(tq).add(O.torso.position), shape: 'open', back: V3(0, 0, -1), aim }; }   // a V, outside his head (straight up went through it from the side)
    if (where === 'grab') {
      const p = world.props[a.prop], h = p.parent.localToWorld(p.userData.home.clone());
      if (a.prop === 'phone') { const back = V3(0, 1, 0), aim = V3(0, 0, 1); return { wrist: wristFor(h.add(V3(0, .012, 0)), back, aim), shape: HELD, back, aim }; }
      const back = V3(out(s), 0, 0), aim = V3(0, 0, 1); return { wrist: wristFor(h.add(V3(0, LIFT[a.prop], 0)), back, aim), shape: HELD, back, aim };
    }
    if (where === 'mouth') {   // the can at the bottom of his screen, tipped toward him by the drink
      const back = V3(out(s), 0, 0), aim = V3(0, Math.sin(ap.tilt), Math.cos(ap.tilt));
      O.head.updateMatrixWorld(true);   // in his head's own frame: under his mouth on the screen (left of the dials), in front of the glass
      return { wrist: wristFor(O.head.localToWorld(V3(-.055, -.13, .26)), back, aim), shape: HELD, back, aim };
    }
    if (where === 'dance') {   // hands in the air beside his screen, open, swaying together on the beat (his note on stream 6: the low fists were "really wonky")
      const sw = Math.sin(ap.beat * Math.PI), pump = Math.abs(Math.sin(ap.beat * Math.PI));
      return { wrist: V3(out(s) * .44 + sw * .06, .44 + pump * .06, .12).applyQuaternion(tq).add(O.torso.position), shape: 'open', back: V3(-out(s) * .3, 0, -1).normalize(), aim: V3(sw * .35, 1, 0) };
    }
    if (where === 'show') { const back = V3(0, -.15, -1), aim = V3(-out(s) * .12, 1, .1); return { wrist: V3(out(s) * .16, .2, .42).applyQuaternion(tq).add(O.torso.position), shape: CRADLE, back, aim }; }
    if (where === 'cat') {   // palm down on her, fingers along her back, stroking from her head down
      const c = world.cat, head = c.head.getWorldPosition(V3(0, 0, 0)), root = c.root.getWorldPosition(V3(0, 0, 0));
      const along = c.root.localToWorld(V3(-1, 0, 0)).sub(root).normalize(), back = V3(0, 1, 0);
      // the stroke runs from her head toward the middle of her body, so it stays on her whichever way she's turned
      const mid = c.body.getWorldPosition(V3(0, 0, 0));
      const contact = head.clone().lerp(mid, .2 + .6 * ap.stroke); contact.y = Math.max(head.y, mid.y) + .05;
      // the palm rides her actual fur: straight down onto her body at this point of the stroke (she curls up, stretches
      // out, naps lower), so the hand never strokes the air above a cat in a different pose (the meeting fork)
      catRay.set(contact.clone().add(V3(0, .4, 0)), V3(0, -1, 0)); catRay.far = .6;
      const fur = catRay.intersectObject(c.root, true).find((h) => h.object.visible);
      if (fur) contact.y = fur.point.y + .012;
      return { wrist: wristFor(contact, back, along, PALM), shape: 'flat', back, aim: along };
    }
    return { wrist: base[s].clone(), shape: HOME[s].shape, back: V3(0, 1, 0), aim: null };
  }
  /* a prop in his hand: where it rides, and the way it faces (a can upright in his grip, the phone turned from lying
     flat to facing the camera as he brings it up) */
  function carry(name, hand, ap) {
    const p = world.props[name]; hand.updateMatrixWorld(true);
    const grip = hand.localToWorld(GRIP.clone()), hq = hand.getWorldQuaternion(new THREE.Quaternion());
    let q, pos;
    if (name === 'phone') {
      const showK = (ap.from === 'show' ? 1 - ap.k : 0) + (ap.to === 'show' ? ap.k : 0);
      /* shown: in his palm, facing the way his palm does (to the camera), upright along his fingers, a bit bigger so it reads */
      const inPalm = hq.clone().multiply(Q_PALM);
      q = new THREE.Quaternion().setFromEuler(p.userData.homeRot).slerp(inPalm, showK);
      pos = grip.clone().lerp(hand.localToWorld(ON_PALM.clone()), showK).add(V3(0, -.012 * (1 - showK), 0));
      p.scale.setScalar(1 + .35 * showK);
    } else {
      q = hq.clone().multiply(Q_UP);
      pos = grip.clone().sub(V3(0, 1, 0).applyQuaternion(q).multiplyScalar(LIFT[name]));
    }
    p.position.copy(p.parent.worldToLocal(pos));
    p.quaternion.copy(p.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
  }
  function putBack(name) { const p = world.props[name]; p.scale.setScalar(1); p.position.copy(p.userData.home); if (p.userData.homeRot) p.rotation.copy(p.userData.homeRot); else p.rotation.set(0, 0, 0); }

  /* act: { name, t0 } while he does something (acts.js); mode: 'play' (hands on the game's keys, keys: what the game
     presses, or null) or 'draw' (the mouse hand drawing, the other at rest); returns { petting, pressed } */
  return function perform(t, g, lib, mouth, look = null, act = null, mode = null, keys = null, lineFace = null) {
    const A = act && ACTS[act.name], ap = A ? actAt(act.name, (t - act.t0) / A.dur) : null;
    const petting = !!(ap && ap.petting);
    if (st.carried && (!ap || !ap.hold || A.prop !== st.carried)) { putBack(st.carried); st.carried = null; }
    const def = (g && G[g.name]) || {}, w = g ? g.w : 0, u = g ? g.u : 0;
    /* the face every frame (the mouth follows the audio), the body on twos */
    face(A && A.face && ap.k !== undefined && (ap.groove || 0) > .3 ? { face: A.face } : def, A && A.face && (ap.groove || 0) > .3 ? 1 : w, lib, mouth, lineFace);   // an act's own face (a dance grins)
    if (world.away && world.away()) return { petting: false };   // off the chair: body.js has him
    if (st.ready && Math.round(t * FPS) % TWOS) return { petting };
    st.ready = true; st.hist.push({ t, g }); if (st.hist.length > 20) st.hist.shift();
    /* working: uneven bursts of taps on the keyboard hand, the mouse hand drifting with the mouse; a gesture stops both */
    const busy = 1 - w * (def.slam && u < .72 ? 0 : 1), burst = Math.max(0, Math.sin(t * 1.7) + .4 * Math.sin(t * 4.3));
    const playing = mode === 'play' && !ap, drawing = mode === 'draw' && !ap, keysDown = playing ? playHands(keys, t) : null;
    const working = !playing && !drawing && !ap, cyc = t % 23, mousing = drawing || (working && cyc > 16.5);   // a stretch at the keys, a while on the mouse
    st.mk = (st.mk || 0) + ((mousing ? 1 : 0) - (st.mk || 0)) * .2;
    const stroke = working && !mousing && busy > .4 && burst > .1 ? keystroke(t) : null;
    if (stroke && stroke.n !== st.lastKey) { st.lastKey = stroke.n; world.keyTap && world.keyTap(stroke.space ? ' ' : 'k'); }
    const drift = playing ? V3(0, 0, 0) : drawing
      ? V3(Math.sin(t * 1.7) * .05 + Math.sin(t * 4.1) * .012, 0, Math.cos(t * 1.3) * .035 + Math.sin(t * 3.3) * .01).multiplyScalar(busy)   // strokes, not a drift
      : V3(Math.sin(t * .9) * .03 + Math.sin(t * 2.3) * .006, 0, Math.cos(t * .7) * .02).multiplyScalar((.3 + .7 * busy) * st.mk);
    mouse.position.set(ANCHOR.mouse.x + drift.x, ANCHOR.mouse.y, ANCHOR.mouse.z + drift.z);
    const base = playing ? { R: ARROWS.clone().add(V3(keysDown.R.dx, -.012 * keysDown.R.press, 0)), L: SPACE.clone().add(V3(0, -.014 * keysDown.L.press, 0)) }
      : { R: mousing || !working ? HOME.R.t.clone().add(drift) : TYPE.R.clone(), L: TYPE.L.clone() };
    springS(st.lean, (def.lean || 0) * w + (ap ? ap.lean : 0), 9, .6); springS(st.lift, (def.lift || 0) * w + (st.mood === 'laugh' ? .02 + .018 * Math.sin(t * 21) : 0), 10, .6);   // a laugh shakes his shoulders
    const sway = lib ? (lib.sway ?? (lib.yaw || 0) * .3) * .5 : 0;   // live head frames carry no sway: it follows the yaw (a missing one was NaN, and NaN hid his whole body)
    O.torso.rotation.set(st.lean.x * .7, sway + (ap ? ap.sway || 0 : 0), (lib ? lib.roll * .2 : 0) + (ap ? (ap.sway || 0) * .4 : 0));
    O.torso.position.set(O.chest.x, O.chest.y + st.lift.x, O.chest.z + st.lean.x * .35);
    // petting her: in the meeting's room she naps a little past his arm, so he shifts and leans her way, just as far as
    // his reach is short (the meeting fork)
    springS(st.toCat, act && act.name === 'pet_cat' && world.cat ? 1 : 0, 7, .85);
    if (st.toCat.x > .001 && world.cat) {
      const to = world.cat.body.getWorldPosition(V3(0, 0, 0)).sub(O.chest).setY(0), short = Math.min(.14, Math.max(0, to.length() - .72));
      const k = st.toCat.x * short; to.normalize();
      O.torso.position.x += to.x * k; O.torso.position.z += to.z * k; O.torso.position.y -= k * .2;
      O.torso.rotation.x += k * .5 * Math.max(0, to.z);   // leans in; his arm stays long, so the palm still lies flat on her
    }
    const tq = O.torso.quaternion;
    const lag = g ? .05 + rnd(g.id || 0, 9) * .1 : 0;
    for (const s of ['R', 'L']) {
      const S = V3((s === 'R' ? -1 : 1) * O.shoulderW, .06 + st.lift.x, 0).applyQuaternion(tq).add(O.torso.position);
      const follows = def.lead ? def.lead !== s : s === 'L';
      const gh = follows ? at(t, lag) : g, dh = (gh && G[gh.name]) || {}, wh = gh ? gh.w : 0, uh = gh ? gh.u : 0;
      let target = base[s], shape = playing ? 'type' : s === 'R' && (mousing || !working) ? 'mouse' : 'type', back = V3(0, 1, 0), aimK = 0;
      let gs = dh[s]; const acting = ap && (A.hand === s || A.hand === 'both'), talkingHand = gs && dh.talk === s;
      if (talkingHand) { const b = talkBeat(gh.id || 0, t); gs = [b.at, b.shape, b.back, b.aim]; }
      if (acting) {
        const a0 = place(ap.from, s, A, ap, base, tq), a1 = place(ap.to, s, A, ap, base, tq);
        target = a0.wrist.lerp(a1.wrist, ap.k); shape = mixShape(a0.shape, a1.shape, ap.k);
        back = a0.back.clone().lerp(a1.back, ap.k).normalize();
        const aim = a0.aim && a1.aim ? a0.aim.clone().lerp(a1.aim, ap.k) : a0.aim ? a0.aim.clone() : a1.aim ? a1.aim.clone() : null;
        if (aim) { st.aim[s].copy(aim.normalize()); aimK = a0.aim && a1.aim ? 1 : a0.aim ? 1 - ap.k : ap.k; }
      } else if (gs && wh > 0) {
        const j = gh.id || 0, k = s === 'R' ? 0 : 3;
        const peak = gs[0].clone().add(V3((rnd(j, k + 1) - .5) * .05, (rnd(j, k + 2) - .5) * .05, (rnd(j, k + 3) - .5) * .04))
          .add(V3(wob(t, k + 1), wob(t, k + 2), wob(t, k + 3)).multiplyScalar(.009)).applyQuaternion(tq).add(O.torso.position);
        /* the slam: typing on through the line, a quick lift, then down on its last word (a held wind-up is a pose for nothing) */
        const windup = dh.slam && uh < .72;
        if (dh.slam) { if (windup) peak.copy(base[s]); else if (uh < .82) peak.y = O.chest.y + .04; else peak.y = DESK.top + .06; }
        if (dh.beat === s) peak.y += Math.max(0, mouth - .15) * .12;
        if (dh.wave === s && dh === G.hello) { const w = Math.sin(uh * Math.PI * 6); peak.x += w * .055; peak.y -= Math.abs(w) * .02; }   // a hello swings from the elbow: an arc, a few times
        else if (dh.wave === s) peak.x += Math.sin(uh * Math.PI * 3) * .08;
        if (dh.path && dh.path[s]) peak.add(dh.path[s](uh).applyQuaternion(tq));
        if (dh.offer === s) peak.z += Math.sin(Math.PI * Math.min(1, uh * 1.4)) * .05;
        if (dh.poke === s) peak.z += Math.sin(Math.PI * Math.min(1, Math.max(0, uh - .15) / .25)) * .05;   // lands, then pokes the screen once
        if (dh.brush === s) { const b = Math.max(0, Math.sin(uh * Math.PI * 7)); peak.x += b * .045; peak.y -= b * .03; }   // flicks off the shoulder
        target = base[s].clone().lerp(peak, wh);
        /* the fingers and the turn of the hand blend with the move; palm over goes through thumb up */
        const kk = windup ? 0 : Math.min(1, wh * 1.5);
        shape = mixShape(HOME[s].shape, gs[1], kk);
        if (talkingHand) shape[0] = shape[0].map((x, i) => Math.max(0, x + wob(t * 1.5, i + 11) * .09));   // the fingers never quite hold still
        back = V3(0, 1, 0).lerp(gs[2], kk).addScaledVector(V3(s === 'R' ? -1 : 1, 0, 0), Math.sin(Math.PI * kk) * .6).normalize();
        if (gs[3]) { st.aim[s].lerp(gs[3].clone().normalize().applyQuaternion(tq), .5).normalize(); aimK = kk; }
      } else if (!playing) {
        /* at work: fingers along the keys or the mouse, the wrist drifting a little, and each keystroke a real finger going down */
        const onMouse = s === 'R' && (mousing || !working);
        st.aim[s].lerp(onMouse ? AIM.mouse : AIM[s], .5).normalize(); aimK = 1;
        if (working && !onMouse) {
          const k = s === 'R' ? 0 : 5; target = target.clone().add(V3(Math.sin(t * .6 + k) * .012, 0, Math.sin(t * .43 + k) * .007));
          shape = shapeOf('type'); shape[0] = shape[0].map((x, i) => x + Math.sin(t * 1.1 + i * 1.9 + k) * .025);
          if (stroke && stroke.hand === s) {
            if (stroke.finger === 4) shape[1][0] += .55 * stroke.press;
            else { shape[0][stroke.finger] += (stroke.row > 0 ? .1 : .42) * stroke.press; target.x += (s === 'R' ? 1 : -1) * (stroke.finger - 1.2) * .006; target.z += stroke.row * .012; target.y -= .003 * stroke.press; }
          }
        } else if (onMouse && Math.floor(t * .7) % 5 === 0 && t * .7 % 1 < .2) { shape = shapeOf('mouse'); shape[0][0] += .22; }   // a click, now and then
      }
      const hit = dh.slam && uh > .82;
      springV(st.hands[s], st.vel[s], target, hit ? 26 : 15, hit ? .5 : .62);
      const T = st.hands[s].clone();
      if (T.y < DESK.top + .04 && T.z > DESK.z0 - .02 && T.z < DESK.z1) T.y = DESK.top + .04;   // never through the desk
      /* fingers and the turn of the hand ease to where they're going (one gesture handing to the next mid-phrase would pop) */
      const want = shapeOf(shape), cur = st.shape[s];
      cur[0] = cur[0].map((x, i) => x + (want[0][i] - x) * .5); cur[1] = cur[1].map((x, i) => x + (want[1][i] - x) * .5);
      st.back[s].lerp(back, .5).normalize();
      st.aimK[s] += (aimK - st.aimK[s]) * .5;
      setArm(O, s, S, T, [cur[0], cur[1]], st.back[s].clone(), st.aim[s].clone(), st.aimK[s]);
      if (acting && ap.hold && A.prop) { carry(A.prop, O.arms[s].hand, ap); st.carried = A.prop; }
    }
    /* the head floats over his shoulders: the library's head at half strength, gesture nods and shakes on top (a shake
       that loses steam, a nod that isn't a metronome) */
    const hd = def.head || {};
    let yaw = lib ? THREE.MathUtils.clamp(lib.yaw * .5, -.28, .28) : 0, pitch = lib ? THREE.MathUtils.clamp(lib.pitch * .5, -.15, .15) : 0, roll = lib ? THREE.MathUtils.clamp(lib.roll * .4, -.1, .1) : 0;
    if (hd.shake) yaw += Math.sin(u * Math.PI * 5 + .7 * Math.sin(u * 7)) * .34 * w * (1 - .45 * u);
    if (hd.nod) pitch += Math.max(0, Math.sin(u * Math.PI * 3 + .5 * Math.sin(u * 5))) * .16 * w;
    if (hd.pitch) pitch += hd.pitch * w;
    if (ap) pitch += ap.head + (ap.bob || 0);
    if (st.mood === 'laugh') pitch -= .07;   // and tips his head back
    if (look) { yaw += look.yaw || 0; pitch += look.pitch || 0; }
    springV(st.head, st.headV, V3(pitch, yaw, roll), 16, .55);
    O.head.rotation.set(st.head.x + st.lean.x * .5, st.head.y, st.head.z, 'YXZ');
    O.head.position.copy(V3(0, .42 + st.lift.x, st.lean.x * .1).applyQuaternion(tq).add(O.torso.position));
    return { petting, pressed: keysDown ? keysDown.R.press + keysDown.L.press : 0 };
  };
}
