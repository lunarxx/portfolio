/* moves: things his whole body does for a moment, set off by an ability (chat asks for a spin, a raid comes in). each
   is a timeline of the pose body.js takes ({ x, z, heading, stand, gait, moving, lean, reach, arms, armsK, chair }):
   arms is where his hands go ('up': a cheer, 'wave': both arms up, waving), armsK how far; chair is how far his chair is
   turned. at(s) -> pose + done. pure: the stage runs it.
   fails (his note: "people like seeing streamers fail a lot like when speed burned his own house doing firecrackers
   inside etc, we need octyn to fail too"): a move can be told to go wrong ({ fail }: FAILS lists each move's). every
   frame then says fail (which, while it's happening) and thuds (how many times he's hit something so far: the stage
   plays the thud, and he reacts) */
import { fall } from './falls.js';
import { danceRoutine } from './dance.js';
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const seg = (u, a, b) => Math.min(1, Math.max(0, (u - a) / (b - a)));
const pose = x => ({ x: 0, z: 0, heading: 0, stand: 0, gait: 0, moving: false, speed: 0, lean: 0, reach: null, arms: null, armsK: 0, chair: 0, ...x });
/* every frame: thuds so far, and the fail it's in the middle of */
function marked(dur, at, impacts = [], fails = []) {
  return { dur, impacts, fails, at(s) { const p = at(s), f = fails.find(([a, b]) => s >= a && s < b); return { ...p, thuds: impacts.filter(t => t <= s).length, ...(f ? { fail: f[2] } : {}) }; } };
}

/* chat says spin: arms up, one or two turns in his chair (a push off, fast, slowing), a wobble past his desk and back.
   bonk: too hard, and still going fast when his knees hit the desk */
export function chairSpin({ rand = Math.random, fail = null } = {}) {
  const turns = rand() < .6 ? 1 : 2, spin = 1.6 + turns * .9, bonk = fail === 'bonk', tail = bonk ? 1.8 : .7, dur = .35 + spin + tail + .25;
  const hitAt = .35 + spin;
  return marked(dur, s => {
    if (s >= dur) return { ...pose({}), done: true };
    const armsK = ease(seg(s, 0, .4)) * (1 - ease(seg(s, bonk ? hitAt : dur - .75, bonk ? hitAt + .25 : dur)));
    const u = seg(s, .35, .35 + spin), wob = seg(s, hitAt, hitAt + .7);
    if (bonk) {   // round and round and then the desk: a jolt forward, bouncing back, a shake of the head
      const turn = 2 * Math.PI * turns * (1 - Math.pow(1 - u, 1.25)), v = s - hitAt, h = s < .35 ? 0 : turn;
      const jolt = v > 0 ? .4 * Math.exp(-v * 5) * Math.cos(v * 14) : 0;
      return { ...pose({ heading: h, chair: h, arms: 'up', armsK, lean: -.08 * armsK + jolt }), nod: v > 0 ? .18 * Math.exp(-v * 2) : 0, look: v > .4 ? .2 * Math.sin((v - .4) * 12) * Math.max(0, 1 - (v - .4)) : 0, done: false };
    }
    const turn = 2 * Math.PI * turns * (1 - Math.pow(1 - u, 2.2)) + .22 * Math.sin(Math.PI * 2 * wob) * (1 - wob);
    const h = s < .35 ? 0 : turn;
    return { ...pose({ heading: h, chair: h, arms: 'up', armsK, lean: -.08 * armsK }), done: false };
  }, bonk ? [hitAt] : [], bonk ? [[hitAt, dur - .25, 'bonk']] : []);
}

/* a raid: he gets up out of his chair, waves both arms at the camera, sits back down */
export function standWave({ rand = Math.random } = {}) {
  const wave = 2.4 + rand() * .8, dur = 1.1 + wave + 1.1;
  return marked(dur, s => {
    if (s >= dur) return { ...pose({}), done: true };
    const stand = ease(seg(s, 0, 1.1)) * (1 - ease(seg(s, 1.1 + wave, dur)));
    const armsK = ease(seg(s, .8, 1.3)) * (1 - ease(seg(s, 1.1 + wave - .2, 1.1 + wave + .4)));
    return { ...pose({ stand, arms: 'wave', armsK, lean: .1 * Math.sin(Math.PI * seg(s, 0, 1.1)) + .1 * Math.sin(Math.PI * seg(s, 1.1 + wave, dur)) }), phase: s, done: false };
  });
}
export const MOVES = { spin: chairSpin, wave: standWave };

/* ---------- goal payoffs away from his chair (his ask: "50 subscribers then 50 pushups ... 50 subs then a 1min dance
   away from the chair"). each walks him out to open floor and back: up out of the chair, out past its arm, the thing
   itself, back, down. extra pose fields: pitch (his whole body tipped forward from his feet: lying down for pushups),
   crouch (hips down, knees bent), spread (feet apart), y (off the ground: a hop), floorHands (how far his hands are
   on the floor under his shoulders), floor (sat down on the floor), chairZ (where his chair's got to), count/of/label
   (reps done, shown on screen), dancing and step. on the way back he can stub his toe (stubtoe), and sitting down,
   find his chair's rolled off (misschair) ---------- */
import { track, walker } from './chase.js';
const lerpAngle = (a, b, u) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * u; };
const toHis = d => d + Math.PI / 2;   // a path's heading (the cat's convention) as his
const CHAIR_BACK = -.43;   // his chair, rolled back as he stands
function outAndBack({ spot, face, inner, speed = .6, fail = null, rand = Math.random }) {
  const via = { x: .6, z: -.05 };   // out past the arm of his chair (it's rolled back behind him)
  const out = walker([{ x: 0, z: .06 }, via, spot], speed, 1.9), back = walker([spot, via, { x: 0, z: .06 }], speed, 1.9);
  const tr = track(), impacts = [], fails = [];
  const walk = (w, a, b) => (u, e) => { const p = w.at(a + (b - a) * u, e); return pose({ x: p.x, z: p.z, heading: toHis(p.dir), stand: 1, gait: p.gait, moving: true, speed }); };
  tr.add(1.1, u => pose({ stand: ease(u), z: .06 * ease(u), lean: .2 * Math.sin(Math.PI * u) }))
    .add(.45, u => pose({ stand: 1, z: .06, heading: lerpAngle(0, toHis(out.first), ease(u)) }))
    .add(out.d, walk(out, 0, 1))
    .add(.5, u => pose({ ...spot, stand: 1, heading: lerpAngle(toHis(out.last), face, ease(u)) }));
  const t0 = tr.end;
  for (const t of inner.impacts || []) impacts.push(t0 + t);
  for (const [a, b, k] of inner.fails || []) fails.push([t0 + a, t0 + b, k]);
  tr.add(inner.dur, (u, e) => { const p = inner.at(e); return pose({ ...spot, stand: 1, heading: face + (p.turn || 0), ...p, x: spot.x + (p.dx || 0), z: spot.z + (p.dz || 0) }); })
    .add(.5, u => pose({ ...spot, stand: 1, heading: lerpAngle(face, toHis(back.first), ease(u)), ...inner.after }));
  if (fail === 'stubtoe') {   // halfway back: his toe on something, hopping on the other foot, then limping the rest
    const at = back.at(.5, 0), HOP = 2.2;
    tr.add(back.d * .5, walk(back, 0, .5));
    impacts.push(tr.end); fails.push([tr.end, tr.end + HOP, 'stubtoe']);
    tr.add(HOP, (u, e) => pose({ x: at.x, z: at.z, heading: toHis(at.dir), stand: 1, y: .05 * Math.abs(Math.sin(Math.PI * 2.4 * e)) * seg(u, .08, .2) * (1 - seg(u, .85, 1)), lean: .28 * Math.sin(Math.PI * Math.min(1, u * 1.2)), feet: { L: [0, 0, 0], R: [0, .22 * Math.sin(Math.PI * seg(u, 0, 1)), -.14] }, arm: { L: [.36, -.02, .1], R: [.3, -.12, .12] }, armK: Math.sin(Math.PI * u), shape: 'open', nod: .2 * Math.sin(Math.PI * u) }))
      .add(back.d * .5 / .8, (u, e) => ({ ...walk(back, .5, 1)(u, e), speed: speed * .8, lean: .06 }));
  } else tr.add(back.d, walk(back, 0, 1));
  tr.add(.5, u => pose({ z: .06, stand: 1, heading: lerpAngle(toHis(back.last), 0, ease(u)) }));
  if (fail === 'misschair') {   // he sits, the chair's rolled off behind him, and he goes all the way to the floor
    const OFF = -.95, f = fall({ lead: 'back', sit: 1.4, rand });
    tr.add(.6, u => pose({ z: .06, stand: 1 - .45 * ease(u), lean: .2 * Math.sin(Math.PI * u), chairZ: CHAIR_BACK + (OFF - CHAIR_BACK) * ease(u) }));
    const down = tr.end;
    impacts.push(down + .25); fails.push([down, down + .25 + 1.4 + 1.3, 'misschair']);
    tr.add(.25, u => pose({ z: .06, stand: .55, floor: u * u, chairZ: OFF, lean: -.2 * u }))
      .add(1.4, u => ({ ...pose({ z: .06, stand: .55, chairZ: OFF }), floor: 1, lean: -.3, look: .3 * Math.sin(Math.PI * 2 * 1.4 * u) * (1 - u), nod: -.1 }))
      .add(1.3, u => pose({ z: .06, stand: .55 + .45 * ease(seg(u, .2, .9)), floor: 1 - ease(seg(u, .1, .75)), chairZ: OFF, lean: .45 * Math.sin(Math.PI * u) }))
      .add(1.0, u => pose({ z: .06, stand: 1, chairZ: OFF + (CHAIR_BACK - OFF) * ease(u), heading: -.5 * Math.sin(Math.PI * u), lean: -.1 * Math.sin(Math.PI * u) }));   // turns, pulls it back in
  }
  tr.add(1.2, u => pose({ z: .06 * (1 - ease(u)), stand: 1 - ease(u), lean: .2 * Math.sin(Math.PI * u) }));
  return marked(tr.end, s => s >= tr.end ? { ...pose({}), done: true } : { ...tr.at(s), done: false }, impacts, fails);
}
/* how he tires: each rep a little longer than the last, most at the end */
function repTimes(reps, base, rand, tired = .38) { const out = []; for (let i = 0; i < reps; i++) out.push(base * (1 + tired * (i / Math.max(1, reps - 1)) ** 2) * (1 + (rand() - .5) * .06)); return out; }
/* reps laid out in time, with a fail in one of them: rep k starts, goes wrong, the rest come after. -> at(e) gives
   { k (reps done), u (how far through this rep), inFail (seconds into the fail, or null) } */
function repClock(times, failAt = -1, failDur = 0, failFrom = .5) {
  const segs = []; let t = 0;
  times.forEach((d, k) => {
    if (k === failAt) { segs.push({ k, t0: t, d: d * failFrom, part: 'pre', full: d }); t += d * failFrom; segs.push({ k, t0: t, d: failDur, part: 'fail' }); t += failDur; }
    else { segs.push({ k, t0: t, d, part: 'rep' }); t += d; }
  });
  return { dur: t, failStart: segs.find(g => g.part === 'fail')?.t0 ?? null, at(e) {
    const g = segs.find(x => e < x.t0 + x.d);
    if (!g) return { k: times.length, u: 0, inFail: null };
    if (g.part === 'fail') return { k: g.k, u: 0, inFail: e - g.t0 };
    if (g.part === 'pre') return { k: g.k, u: (e - g.t0) / g.full, inFail: null };
    return { k: g.k, u: (e - g.t0) / g.d, inFail: null };
  } };
}
const failRep = (reps, rand) => Math.max(1, Math.min(reps - 1, Math.round(reps * (.5 + .3 * rand()))));

/* pushups on the open floor by the bed, lying along the room: down (a crouch, hands to the floor, legs back), the reps,
   up again. his shoulders go from an arm's length off the floor to a hand's. variants: hands wide or close together.
   faceplant: his arms give out on the way down, he's flat on the floor, lies there, and the rest come slower */
const SHOULDER = 1.38, HIGH = Math.acos(.52 / SHOULDER), LOW = Math.acos(.2 / SHOULDER), FLAT = Math.acos(.13 / SHOULDER);
const HANDS = { normal: .09, wide: .2, narrow: .03 };
export function pushups({ reps = 20, rand = Math.random, variant = 'normal', fail = null } = {}) {
  const base = 1.05 + rand() * .2, times = repTimes(reps, base, rand), down = 1.6, up = 1.6, out = HANDS[variant] ?? HANDS.normal;
  const plant = fail === 'faceplant', kf = plant ? failRep(reps, rand) : -1, PLANT = .35 + 1.6 + 1.1 + .6;
  if (plant) for (let k = kf; k < reps; k++) times[k] *= 1.25;   // after it, slower
  const clock = repClock(times, kf, PLANT);
  const dur = down + clock.dur + up;
  const inner = { dur, after: { count: reps, of: reps, label: 'PUSHUPS' }, impacts: plant ? [down + clock.failStart + .35] : [], fails: plant ? [[down + clock.failStart - .2, down + clock.failStart + PLANT, 'faceplant']] : [], at(e) {
    const base = { count: 0, of: reps, label: 'PUSHUPS', handsOut: out };
    if (e < down) { const u = e / down; return { ...base, crouch: ease(seg(u, 0, .45)) * (1 - ease(seg(u, .55, 1))), pitch: HIGH * ease(seg(u, .45, 1)), floorHands: ease(seg(u, .3, .6)) }; }
    const r = e - down;
    if (r < clock.dur) {
      const c = clock.at(r);
      if (c.inFail !== null) {   // the way down doesn't stop: flat on his front, a moment, pushing back up
        const v = c.inFail;
        if (v < .35) { const w = (v / .35) ** 2; return { ...base, count: c.k, pitch: LOW + (FLAT - LOW) * w, floorHands: 1 - .6 * w }; }
        if (v < 1.95) return { ...base, count: c.k, pitch: FLAT, floorHands: .4, nod: -.15 + .1 * Math.sin((v - .35) * 5) * Math.max(0, 1 - (v - .35)) };
        if (v < 3.05) { const w = ease((v - 1.95) / 1.1); return { ...base, count: c.k, pitch: FLAT + (HIGH - FLAT) * w, floorHands: .4 + .6 * ease(seg(w, 0, .4)) }; }
        return { ...base, count: c.k, pitch: HIGH, floorHands: 1 };
      }
      return { ...base, count: c.k, pitch: HIGH + (LOW - HIGH) * Math.sin(Math.PI * c.u) ** 2, floorHands: 1 };
    }
    const u = (r - clock.dur) / up;
    return { ...base, count: reps, crouch: ease(seg(u, 0, .45)) * (1 - ease(seg(u, .55, 1))), pitch: HIGH * (1 - ease(seg(u, 0, .55))), floorHands: 1 - ease(seg(u, .4, .7)) };
  } };
  return outAndBack({ spot: { x: 1.3, z: -1.0 }, face: -Math.PI / 2, inner, fail: plant ? null : fail, rand });
}
/* squats, facing the room's front (the tracking camera). variants: arms out in front as he goes down, hands behind his
   head, or jump squats (a hop off the top of each). sitdown: at the bottom of one he rocks back onto the floor */
export function squats({ reps = 20, rand = Math.random, variant = 'forward', fail = null } = {}) {
  const times = repTimes(reps, (variant === 'jump' ? 1.7 : 1.5) + rand() * .2, rand), sit = fail === 'sitdown', ks = sit ? failRep(reps, rand) : -1;
  const F = sit ? fall({ lead: 'back', sit: 1.5, rand }) : null, clock = repClock(times, ks, F ? F.dur : 0);
  const dur = clock.dur + .4;
  return outAndBack({ spot: { x: .7, z: -1.15 }, face: 0, fail: sit ? null : fail, rand, inner: { dur, after: { count: reps, of: reps, label: 'SQUATS' }, impacts: F ? [clock.failStart + F.impact] : [], fails: F ? [[clock.failStart, clock.failStart + F.dur, 'sitdown']] : [], at(e) {
    const c = clock.at(e), base = { count: c.k, of: reps, label: 'SQUATS' };
    if (c.inFail !== null) return { ...base, ...F.at(c.inFail) };
    const u = c.k >= reps ? 0 : c.u, cr = .85 * Math.sin(Math.PI * u) ** 2;
    if (variant === 'head') return { ...base, crouch: cr, arm: { L: [.16, .3, -.02], R: [.16, .3, -.02] }, armK: 1, shape: 'relaxed', lean: .2 * cr };
    const hop = variant === 'jump' && u > .6 ? .09 * Math.sin(Math.PI * seg(u, .6, .95)) : 0;
    return { ...base, crouch: cr, arms: 'forward', armsK: Math.min(1, cr / .5), lean: .25 * cr, y: hop };
  } } });
}
/* jumping jacks: a hop, feet apart and arms up over his head (or out and clapping in front: seal jacks), back together.
   stumble: one lands wrong, a stagger, hands on his knees a moment */
export function jumpingJacks({ reps = 20, rand = Math.random, variant = 'normal', fail = null } = {}) {
  const times = repTimes(reps, .75 + rand() * .1, rand, .3), st = fail === 'stumble', kk = st ? failRep(reps, rand) : -1, ST = 2.6, side = rand() < .5 ? 1 : -1;
  const clock = repClock(times, kk, ST, .6), dur = clock.dur + .3;
  return outAndBack({ spot: { x: .7, z: -1.15 }, face: 0, fail: st ? null : fail, rand, inner: { dur, after: { count: reps, of: reps, label: 'JUMPING JACKS' }, impacts: st ? [clock.failStart + .45] : [], fails: st ? [[clock.failStart, clock.failStart + ST, 'stumble']] : [], at(e) {
    const c = clock.at(e), base = { count: c.k, of: reps, label: 'JUMPING JACKS' };
    if (c.inFail !== null) {
      const v = c.inFail;
      if (v < 1.0) { const w = Math.sin(Math.PI * v); return { ...base, dx: side * .1 * w, lean: .3 * w, look: side * .3 * w, feet: { L: [-.05 * w, .05 * w, 0], R: [-.05 * w, 0, .04 * w] }, arm: { L: [.4, .2, .1], R: [.36, .3, .06] }, armK: w, shape: 'open' }; }
      const w = Math.sin(Math.PI * seg(v, 1.0, ST));   // hands on his knees, getting his breath
      return { ...base, crouch: .3 * w, lean: .5 * w, arm: { L: [.1, -.44, .26], R: [.1, -.44, .26] }, armK: w, shape: 'flat', nod: .15 * w };
    }
    const u = c.k >= reps ? 0 : c.u, s = Math.sin(Math.PI * u) ** 2, y = .07 * Math.abs(Math.sin(2 * Math.PI * u));
    if (variant === 'seal') return { ...base, spread: s, arm: { L: [.02 + .44 * s, -.04, .4 - .3 * s], R: [.02 + .44 * s, -.04, .4 - .3 * s] }, armK: 1, shape: 'flat', y };
    return { ...base, spread: s, arms: 'up', armsK: s, y };
  } } });
}
/* a dance in the middle of the room (the goal: "a 1min dance away from the chair"): dance.js, in a style, on the beat */
export function roomDance({ secs = 60, rand = Math.random, style = null, fail = null } = {}) {
  const inner = danceRoutine({ secs, style, rand, fail: fail === 'trip' || fail === 'spinout' ? fail : null });
  return { ...outAndBack({ spot: { x: .7, z: -1.15 }, face: 0, inner, fail: inner.fails.length ? null : fail, rand }), danceSecs: inner.dur, style: inner.style, bpm: inner.bpm };
}
Object.assign(MOVES, { pushups, squats, jumping_jacks: jumpingJacks, room_dance: roomDance });   // room_dance: 'dance' is his seated act
/* a spin marathon (a goal: "10 subs, 10 chair spins"): arms up, round and round in his chair, each spin counted on
   screen, a wobble and then dizzy (his head rolls) before he comes back to his desk. fallout: dizzy, he tries to
   stand, staggers, and goes down on the floor */
export function spinMarathon({ reps = 10, rand = Math.random, fail = null } = {}) {
  const per = 1.1 + rand() * .2, spin = reps * per, out = fail === 'fallout', dizzy = out ? 1.2 : 2.4, spun = .4 + spin + .6;
  const F = out ? fall({ lead: 'trip', sit: 1.8, rand }) : null, STAND = 1.0, OFF = -.8;
  const fallAt = spun + dizzy + STAND, dur = spun + dizzy + (out ? STAND + F.dur + .7 + 1.2 : 0);
  const full = 2 * Math.PI * reps;
  return marked(dur, s => {
    if (s >= dur) return { ...pose({}), done: true };
    const armsK = ease(seg(s, 0, .4)) * (1 - ease(seg(s, .4 + spin, .4 + spin + .6)));
    const u = seg(s, .4, .4 + spin), turn = 2 * Math.PI * reps * (u < .08 ? u * u / .16 / (1 - .04) : (u - .04) / (1 - .04));
    const wob = seg(s, .4 + spin, spun), h = s < .4 ? 0 : Math.min(full, turn) + .25 * Math.sin(Math.PI * 2 * wob) * (1 - wob);
    const counted = { count: Math.min(reps, Math.floor(u * reps + 1e-9)), of: reps, label: 'SPINS', phase: s, done: false };
    if (!out || s < spun + dizzy) { const dz = seg(s, .4 + spin, out ? spun + dizzy : dur), dizzyK = out ? Math.min(1, dz * 3) : Math.sin(Math.PI * dz); return { ...pose({ heading: h, chair: h, arms: 'up', armsK, lean: -.06 * armsK }), ...counted, dizzy: dizzyK }; }
    const b = pose({ heading: full, chair: full });
    if (s < fallAt) { const v = (s - spun - dizzy) / STAND; return { ...b, stand: ease(v), lean: .25 * Math.sin(Math.PI * v), chairZ: CHAIR_BACK + (OFF - CHAIR_BACK) * ease(v), sway: .5 * Math.sin(Math.PI * 3 * v), ...counted, dizzy: 1 }; }   // up out of it, the chair shoved back
    if (s < fallAt + F.dur) { const q = F.at(s - fallAt); return { ...b, ...q, heading: full + (q.turn || 0), stand: 1, chairZ: OFF, ...counted, dizzy: Math.max(q.dizzy || 0, .6 * (1 - seg(s, fallAt, fallAt + F.dur))) }; }
    const back = fallAt + F.dur;
    if (s < back + .7) { const v = (s - back) / .7; return { ...b, stand: 1, chairZ: OFF + (CHAIR_BACK - OFF) * ease(v), heading: full - .5 * Math.sin(Math.PI * v), ...counted }; }   // pulls it back in
    const v = (s - back - .7) / 1.2; return { ...b, stand: 1 - ease(v), lean: .2 * Math.sin(Math.PI * v), ...counted };
  }, out ? [fallAt + F.impact] : [], out ? [[spun + dizzy, fallAt + F.dur, 'fallout']] : []);
}
MOVES.spin_marathon = spinMarathon;
/* what can go wrong in each (the first is its own; stubbing a toe and missing the chair can end any walk out), and the
   ways each can be done */
export const FAILS = { spin: ['bonk'], pushups: ['faceplant', 'stubtoe', 'misschair'], squats: ['sitdown', 'stubtoe', 'misschair'], jumping_jacks: ['stumble', 'stubtoe', 'misschair'], room_dance: ['trip', 'spinout', 'stubtoe', 'misschair'], spin_marathon: ['fallout'] };
export const VARIANTS = { pushups: ['normal', 'wide', 'narrow'], squats: ['forward', 'head', 'jump'], jumping_jacks: ['normal', 'seal'] };
