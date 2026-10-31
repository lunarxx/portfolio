/* dancing (his notes: "the dance looks kinda weird rn, i want you to add variations on the activities so every stream
   doesnt become repetitive, if you have a single dance then they will probably get bored"). a dance is a style (a
   tempo, how much he bounces, and its own steps), played as phrases of 4 or 8 beats, every one starting on the beat,
   never the same step twice running. under every step a groove: knees bouncing on the beat (the dad dance: off it),
   head nodding, hips swaying; robot: none, it ticks.
   a step is a function of beats since it started -> pose fields in his frame:
     arm  { L, R }: where each hand goes, [out, up, forward] from his shoulder; armK how far; shape (a hand shape)
     feet { L, R }: [out, lift, forward] off where the foot stands; sway (hips side to side, -1..1); twist (his chest
     turned from his hips); nod, look (his head); crouch; turn (all of him); dx, dz (off his spot); y (a hop)
   danceRoutine({ secs, style, bpm, rand, fail }) -> { dur, at(e), plan, style, bpm, impacts, fails }. fail 'trip' or
   'spinout': partway through he goes down (falls.js), gets up, dances on. pure */
import { fall } from './falls.js';

const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const fr = b => b - Math.floor(b);
const hit = (b, w = .3) => { const f = fr(b); return f < w ? Math.sin(Math.PI * f / w) : 0; };   // a punch on every beat
const snap = (b, w = .15) => ease(Math.min(1, fr(b) / w));   // moving to the next pose right on the beat, then holding it
const mix = (a, b, k) => a.map((x, i) => x + (b[i] - x) * k);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const shortTo0 = a => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const HANG = [.08, -.4, .06];

export const STEPS = {
  /* step touch: side to side, the other foot tapping in, a clap on the 2 and the 4 */
  stepTouch: b => {
    const s = Math.sin(Math.PI * b / 2), c = Math.floor(b) % 2 ? hit(b, .35) : 0, low = [.14, -.3, .18], clap = [.02, -.14, .32];
    return { dx: .07 * s, sway: .7 * s, feet: { L: [0, .06 * Math.max(0, -Math.sin(Math.PI * b)), 0], R: [0, .06 * Math.max(0, Math.sin(Math.PI * b)), 0] }, arm: { L: mix(low, clap, c), R: mix(low, clap, c) }, armK: 1, shape: c > .5 ? 'flat' : 'relaxed' };
  },
  /* hips swinging, arms loose, a snap of the fingers on the beat */
  hipSway: b => { const s = Math.sin(Math.PI * b); return { sway: s, twist: .14 * s, arm: { L: [.22, -.3 + .06 * hit(b), .12], R: [.22, -.3 + .06 * hit(b + .5), .12] }, armK: 1, shape: 'relaxed', look: .12 * s }; },
  /* the running man: one knee up, slid back, the other, arms pumping */
  runningMan: b => {
    const s = Math.sin(Math.PI * b), up = k => .17 * Math.max(0, k);
    return { crouch: .12, feet: { L: [0, up(s), .1 * Math.max(0, s) - .08 * Math.max(0, -s)], R: [0, up(-s), .1 * Math.max(0, -s) - .08 * Math.max(0, s)] }, arm: { L: [.12, -.22 + .1 * s, .16 * s + .08], R: [.12, -.22 - .1 * s, -.16 * s + .08] }, armK: 1, shape: 'fist', lean: .1 };
  },
  /* disco: the right hand points up and out, then down across him, left hand on his hip */
  discoPoint: b => {
    const upNow = Math.floor(b / 2) % 2 === 0, k = snap(b / 2, .2), from = upNow ? [-.1, -.34, .26] : [.34, .46, .14], to = upNow ? [.34, .46, .14] : [-.1, -.34, .26];
    const s = Math.sin(Math.PI * b);
    return { sway: .6 * s, feet: { L: [0, .05 * Math.max(0, s), 0], R: [0, .05 * Math.max(0, -s), 0] }, arm: { L: [.2, -.32, -.04], R: mix(from, to, k) }, armK: 1, shape: { L: 'relaxed', R: 'point' }, look: upNow ? -.25 * k : .1 };
  },
  /* raise the roof: palms up, pushing on every beat */
  raiseRoof: b => ({ arm: { L: [.2, .3 + .14 * hit(b, .4), .1], R: [.2, .3 + .14 * hit(b, .4), .1] }, armK: 1, shape: 'flat', crouch: .1 * hit(b, .4), sway: .3 * Math.sin(Math.PI * b) }),
  /* the robot: stiff arms at right angles, a new pose on each beat, head ticking */
  robot: b => {
    const P = [[[.3, -.05, .2], [.3, -.05, .2]], [[.34, .24, 0], [.08, -.4, .06]], [[.08, -.4, .06], [.34, .24, 0]], [[.36, .02, 0], [.36, .02, 0]], [[.2, -.1, .34], [.34, .24, 0]], [[.14, .1, .3], [.14, .1, .3]]];
    const i = Math.floor(b), a = P[Math.floor(hash(i) * P.length)], z = P[Math.floor(hash(i + 1) * P.length)], k = snap(b, .12);
    const t = Math.floor(b / 2), look = (hash(t + 7) - .5) * .7;
    return { arm: { L: mix(a[0], z[0], k), R: mix(a[1], z[1], k) }, armK: 1, shape: 'flat', look, turn: Math.round((hash(Math.floor(b / 4) + 3) - .5) * 2) * .3, crouch: .06 * (Math.floor(b) % 2) };
  },
  /* robot: arms locked, the whole of him turning in ticks */
  /* robot: marching in place, stiff, knees up on the beat */
  robotWalk: b => { const L = Math.floor(b) % 2 === 0, k = snap(b, .12) * (1 - snap(b - .5, .12) * (fr(b) >= .5)), sw = L ? 1 : -1; return { feet: { L: [0, L ? .1 * k : 0, L ? .06 * k : 0], R: [0, L ? 0 : .1 * k, L ? 0 : .06 * k] }, arm: { L: [.1, -.3, .14 * sw], R: [.1, -.3, -.14 * sw] }, armK: 1, shape: 'flat', look: .15 * sw }; },
  robotTick: b => { const n = Math.floor(b), k = snap(b, .1), turn = ((n % 4) + k) * .2 - .4; return { arm: { L: [.3, -.05, .2], R: [.3, -.05, .2] }, armK: 1, shape: 'flat', turn, look: -turn * .5, nod: .08 * (n % 2) }; },
  /* the floss: both arms swinging the same way, one in front, one behind, hips the other way */
  floss: b => { const s = Math.sin(Math.PI * b), c = Math.cos(Math.PI * b); return { arm: { L: [.1 + .22 * s, -.42, .12 * c], R: [.1 - .22 * s, -.42, -.12 * c] }, armK: 1, shape: 'fist', sway: -.9 * s }; },
  /* the sprinkler: a hand behind his head, the other out, ticking round, then sweeping back */
  sprinkler: b => { const n = Math.floor(b) % 4, turn = n < 3 ? -.22 * (n + snap(b, .15)) : -.66 * (1 - ease(fr(b))); return { arm: { L: [.16, .3, -.02], R: [.5, .05, .18] }, armK: 1, shape: { L: 'relaxed', R: 'flat' }, turn, crouch: .08 * hit(b) }; },
  /* the shopping cart: reaching out for something off a shelf on each beat, pulling it in */
  shoppingCart: b => { const k = hit(b, .5), s = Math.sin(Math.PI * b / 2); return { arm: { L: mix([.12, -.14, .22], [.1, -.06, .44], k), R: mix([.12, -.14, .22], [.1, -.06, .44], k) }, armK: 1, shape: k > .5 ? 'open' : 'fist', dx: .06 * s, sway: .5 * s, lean: .12 * k }; },
  /* the dab: bouncing into it, then held */
  dab: b => { const on = (b % 4) >= 2, k = on ? snap(b % 4 - 2, .15) : 0, rest = [.16, -.3, .14]; return { arm: { L: mix(rest, [.46, .32, .06], k), R: mix(rest, [-.02, .2, .3], k) }, armK: 1, shape: 'open', nod: .35 * k, look: .35 * k, crouch: on ? .05 : .12 * hit(b) }; },
  /* kicks, one foot then the other, arms out for balance */
  kick: b => { const L = Math.floor(b) % 2 === 0, k = hit(b, .55); return { feet: { L: [0, L ? .14 * k : 0, L ? .28 * k : 0], R: [0, L ? 0 : .14 * k, L ? 0 : .28 * k] }, arm: { L: [.34, -.1, .04], R: [.34, -.1, .04] }, armK: 1, shape: 'open', lean: -.08 * k }; },
  /* a hop on every beat, fists pumping */
  jump: b => { const k = hit(b, .45); return { y: .07 * k, crouch: .15 * (1 - k) * hit(b + .5, .5), arm: { L: [.2, .32 + .14 * k, .08], R: [.2, .32 + .14 * k, .08] }, armK: 1, shape: 'fist' }; },
  /* one fist pumping at the ceiling, the other hand on his hip */
  pump: b => { const k = hit(b, .4); return { arm: { L: [.2, -.32, -.04], R: [.16, .24 + .22 * k, .12] }, armK: 1, shape: { L: 'relaxed', R: 'fist' }, crouch: .1 * k, nod: .12 * k }; },
  /* round once, arms up */
  spin: b => ({ turn: 2 * Math.PI * ease(Math.min(1, b / 4)), arm: { L: [.24, .44, .08], R: [.24, .44, .08] }, armK: 1, shape: 'open' }),
  /* a shimmy: shoulders going fast, knees bent, arms out */
  shimmy: b => { const s = Math.sin(Math.PI * 4 * b); return { twist: .18 * s, sway: .25 * s, crouch: .16, arm: { L: [.3, -.08, .14], R: [.3, -.08, .14] }, armK: 1, shape: 'fist', look: .05 * s }; },
  /* the moonwalk, near enough: gliding back, heels coming up one after the other, then strolling forward again */
  moonwalk: b => { const s = Math.sin(Math.PI * b), g = Math.sin(Math.PI * Math.min(8, b) / 8); return { dz: -.09 * g, feet: { L: [0, .035 * Math.max(0, s), -.04 * Math.max(0, s)], R: [0, .035 * Math.max(0, -s), -.04 * Math.max(0, -s)] }, arm: { L: HANG, R: [.2, -.1, .2] }, armK: 1, shape: { L: 'relaxed', R: 'point' }, lean: -.05 }; },
  /* the dad dance: elbows flapping, bouncing off the beat */
  dadBounce: b => { const s = Math.sin(Math.PI * 2 * b); return { arm: { L: [.24 + .08 * s, -.16, .12], R: [.24 - .08 * s, -.16, .12] }, armK: 1, shape: 'fist', nod: .1 * hit(b + .5), look: .15 * Math.sin(Math.PI * b / 2) }; },
  /* finger guns, a kick back on every beat */
  fingerGuns: b => { const k = hit(b, .25), s = Math.sin(Math.PI * b / 2); return { arm: { L: [.12, -.04 + .06 * k, .42 - .08 * k], R: [.12, -.04 + .06 * k, .42 - .08 * k] }, armK: 1, shape: 'point', twist: .25 * s, turn: .15 * s }; },
};

export const STYLES = {
  groove: { title: 'a chill groove', bpm: [90, 102], bounce: .09, steps: ['stepTouch', 'hipSway', 'moonwalk', 'shimmy', 'runningMan', 'spin'] },
  disco: { title: 'a disco dance', bpm: [108, 120], bounce: .07, steps: ['discoPoint', 'stepTouch', 'hipSway', 'shimmy', 'spin'] },
  robot: { title: 'the robot', bpm: [96, 110], bounce: 0, stiff: true, steps: ['robot', 'robotWalk', 'robotTick', 'moonwalk', 'robot', 'spin'] },
  club: { title: 'a club dance', bpm: [122, 130], bounce: .12, steps: ['raiseRoof', 'jump', 'pump', 'runningMan', 'kick', 'shimmy'] },
  meme: { title: 'every meme dance he knows', bpm: [100, 116], bounce: .08, steps: ['floss', 'sprinkler', 'shoppingCart', 'dab', 'runningMan'] },
  dad: { title: 'a dad dance', bpm: [88, 98], bounce: .11, offbeat: true, steps: ['dadBounce', 'fingerGuns', 'stepTouch', 'kick', 'spin'] },
};
const NUM = ['sway', 'twist', 'nod', 'look', 'crouch', 'turn', 'dx', 'dz', 'y', 'lean', 'armK'];
function blend(a, b, k) {   // from one step into the next, over the first half beat
  if (k >= 1) return b;
  const o = { ...b };
  for (const f of NUM) o[f] = (a[f] || 0) + ((b[f] || 0) - (a[f] || 0)) * k;
  const tb = b.turn || 0, d = (((a.turn || 0) - tb + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;   // out of a spin: the short way round, not back through it
  o.turn = tb + d * (1 - k);
  for (const [f, rest] of [['arm', HANG], ['feet', [0, 0, 0]]]) if (a[f] || b[f]) o[f] = { L: mix(a[f] && a[f].L || rest, b[f] && b[f].L || rest, k), R: mix(a[f] && a[f].R || rest, b[f] && b[f].R || rest, k) };
  if (k < .5) o.shape = a.shape;
  return o;
}

export function danceRoutine({ secs = 60, style = null, bpm = null, rand = Math.random, fail = null } = {}) {
  const names = Object.keys(STYLES), st = STYLES[style] ? style : names[Math.floor(rand() * names.length)], S = STYLES[st];
  const tempo = bpm || Math.round(S.bpm[0] + rand() * (S.bpm[1] - S.bpm[0])), beat = 60 / tempo;
  /* the order: shuffles of the style's steps, never the same one twice across a seam; phrases of 4 or 8 beats */
  const order = [];
  while (order.length < 60) {
    const deck = S.steps.slice(); for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    for (const n of deck) if (order[order.length - 1] !== n) order.push(n);
  }
  const plan = [];
  for (let b = 0, i = 0; b * beat < secs - 1e-9; i++) { const n = order[i], len = n === 'spin' ? 4 : rand() < .55 ? 8 : 4; plan.push({ n, t0: b * beat, d: Math.min(len * beat, secs - b * beat) }); b += len; }
  /* a fall partway (at the start of a phrase between a third and two thirds in): the dance waits for him */
  let F = null;
  if (fail === 'trip' || fail === 'spinout') {
    const mid = plan.filter(p => p.t0 > secs * .3 && p.t0 < secs * .7), at = (mid.length ? mid[Math.floor(rand() * mid.length)] : plan[Math.floor(plan.length / 2)]).t0;
    F = { t0: at, f: fall({ lead: fail === 'spinout' ? 'spin' : 'trip', rand }) };
  }
  const extra = F ? F.f.dur : 0, dur = secs + extra;
  const stepAt = e => {
    const p = plan.find(x => e < x.t0 + x.d) || plan[plan.length - 1], i = plan.indexOf(p), b = Math.max(0, e - p.t0) / beat;
    let o = STEPS[p.n](b);
    if (i > 0 && b < .5) o = blend(STEPS[plan[i - 1].n]((e - plan[i - 1].t0) / beat), o, ease(b / .5));
    return { ...o, step: p.n };
  };
  function at(e) {
    if (F && e >= F.t0 && e < F.t0 + extra) { const q = F.f.at(e - F.t0); return { ...q, step: 'fall', dancing: false, phase: e }; }
    const d = F && e >= F.t0 + extra ? e - extra : e, tire = 1 - .3 * Math.min(1, d / Math.max(20, secs));   // bigger at the start, tired by the end
    const o = stepAt(Math.min(d, secs - 1e-6)), B = d / beat + (S.offbeat ? .5 : 0);
    const bounce = S.stiff ? 0 : S.bounce * tire * (.5 + .5 * Math.cos(2 * Math.PI * B));
    const groove = S.stiff ? {} : { nod: (o.nod || 0) + .07 * tire * Math.cos(2 * Math.PI * B), sway: o.sway === undefined ? .25 * Math.sin(Math.PI * B) : o.sway * (.75 + .25 * tire) };
    /* the last beat: back square on his spot, so walking off from it doesn't jump */
    const end = Math.min(1, Math.max(0, (secs - d) / beat)), sq = end < 1 ? { dx: (o.dx || 0) * end, dz: (o.dz || 0) * end, turn: shortTo0(o.turn || 0) * end } : {};
    return { ...o, ...groove, ...sq, crouch: (o.crouch || 0) + bounce, y: (o.y || 0) * tire * end, dancing: true, phase: e };
  }
  return { dur, at, plan, style: st, title: S.title, bpm: tempo, impacts: F ? [F.t0 + F.f.impact] : [], fails: F ? [[F.t0, F.t0 + extra, fail]] : [], after: {} };
}
