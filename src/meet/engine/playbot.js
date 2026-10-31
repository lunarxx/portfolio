/* him playing his game (his notes: "game shouldnt feel like a recorded clip it should look like its actually being
   played", "the character drops out of platform immediately and hes still pressing buttons", "atleast give it some
   skills to play"): the stage presses the game's keys the way a person does.
   with the level to see (see(state): the game's { w, h, hero: { x, y, w, h, vx, vy, onGround }, platforms: [[x, y, w,
   h]] }) he plays it: picks a platform he can reach (a bit higher is better, not straight back where he came from),
   walks to the edge of the one he's on, sometimes hesitates, jumps (longer for a higher one), steers in the air, and
   never walks off an edge for nothing; a jump that ends in a fall is remembered and not tried again for a while. with
   no hero on the screen (fell off, not spawned) he presses nothing.
   without the level (an older game): stretches of going forward, a loose jump, a stop, a step back, turning back
   before the edges of the screen (steer({ x, w })).
   keys(t) -> { left, right, up, down, jump }; event(name, t) tells it what happened in the game. pure */
const NONE = () => ({ left: false, right: false, up: false, down: false, jump: false });
/* any side-on game that marks its things (the conventions: solid: stand on it, deadly: touching it kills) gets these
   reflexes too: the tops of solid things with nothing solid on them are ground, joined along a row; deadly things are
   what he keeps away from. -> a state in the platformer shape, or null when nothing's solid */
export function fromThings(s) {
  if (!s || !s.player || !Array.isArray(s.things)) return null;
  const solid = s.things.filter(t => t && t.solid && Number.isFinite(+t.x)).map(t => ({ x: +t.x, y: +t.y, w: +t.w || 1, h: +t.h || 1 }));
  if (!solid.length) return null;
  const covered = a => solid.some(b => b !== a && Math.abs(b.y + b.h - a.y) < 1 && b.x < a.x + a.w - .5 && b.x + b.w > a.x + .5);
  const tops = solid.filter(a => !covered(a)).sort((a, b) => a.y - b.y || a.x - b.x), platforms = [];
  for (const t of tops) { const p = platforms[platforms.length - 1]; if (p && p[1] === t.y && Math.abs(p[0] + p[2] - t.x) < 1 && p[3] === t.h) p[2] += t.w; else platforms.push([t.x, t.y, t.w, t.h]); }
  const enemies = s.things.filter(t => t && t.deadly && Number.isFinite(+t.x)).map(t => [+t.x, +t.y, +t.w || 1, +t.h || 1]);
  return { ...s, hero: { vx: 0, vy: 0, ...s.player, onGround: s.player.onGround !== false }, platforms, enemies };
}
export function createPlayBot({ rand = Math.random, reach = { up: 70, gap: 90 } } = {}) {
  let mode = 'go', until = 0, nextJump = .6, jumpUntil = -1, pauseUntil = -1, pos = null;
  let recentFall = null, seen = null, seenT = 0, dir = 0, target = -1, prev = -1, from = -1, holdUntil = -1, waitUntil = -1, patrolX = null, run = 120, tried = new Map();
  function pick(t) {
    const k = rand();
    if (k < .62) { mode = 'go'; until = t + 1.2 + rand() * 2.2; }
    else if (k < .82) { mode = 'stop'; until = t + .4 + rand() * .8; }
    else { mode = 'back'; until = t + .3 + rand() * .5; }
  }
  /* an old game gives no level, but an edge is learned (his note: "he runs off the platform deliberately rather than
     jumping across"): walked off one, next time he jumps from just before it; jumped from one and still fell, next time
     he takes off later */
  const edges = [];
  let wasGround = null, leave = null;
  function edgesSee(t) {
    const d = mode === 'go' ? 1 : mode === 'back' ? -1 : 0;
    if (wasGround === true && !pos.onGround) leave = { x: pos.x, dir: d || leave && leave.dir || 1, jumped: t - jumpStarted < .45 };
    if (pos.onGround) leave = null;   // down again on something: that one worked
    wasGround = pos.onGround;
  }
  function learnEdge() {
    if (!leave || !leave.dir) return;
    const e = edges.find(e => e.dir === leave.dir && Math.abs(e.x - leave.x) < 40);
    const lag = run * .12 + 10;   // where he left the ground is seen a moment late: the edge is that much before it
    const at = leave.x - leave.dir * lag;
    if (!leave.jumped) { if (e) e.at = leave.dir > 0 ? Math.min(e.at, at) : Math.max(e.at, at); else edges.push({ dir: leave.dir, x: leave.x, at }); }   // walked off it again: jump earlier
    else if (e) { e.jumps = (e.jumps || 0) + 1; if (e.jumps >= 2) e.dead = true; else e.at += leave.dir * 6; }   // took off too soon: a little later; twice, and there's nothing over there: a dead end
    leave = null;
  }
  let jumpStarted = -9;
  /* the loose way, for a game that doesn't show its level */
  function blind(t) {
    if (pos && pos.h && Number.isFinite(pos.y) && (pos.y > pos.h || pos.y < -60)) return NONE();   // the hero's off the screen: hands still
    if (t >= until) pick(t);
    if (pos && pos.w > 0) {   // near an edge of the screen he turns back
      if (pos.x > pos.w * .82 && mode !== 'back') { mode = 'back'; until = t + .6 + rand() * .8; }
      else if (pos.x < pos.w * .18 && mode !== 'go') { mode = 'go'; until = t + 1 + rand() * 1.5; }
    }
    const d0 = mode === 'go' ? 1 : mode === 'back' ? -1 : 0;
    if (d0 && pos && edges.some(e => e.dead && e.dir === d0 && Math.abs(pos.x - e.at) < 30)) { mode = d0 > 0 ? 'back' : 'go'; until = t + .8 + rand() * 1.2; }   // the end of the world: turn round
    let d = mode === 'go' ? 1 : mode === 'back' ? -1 : 0;
    /* past a known edge's jump point with no jump going: not the last few steps off it, he turns round */
    if (d && pos && pos.onGround && t >= jumpUntil && edges.some(e => !e.dead && e.dir === d && (d > 0 ? pos.x > e.at + 6 && pos.x <= e.x + 4 : pos.x < e.at - 6 && pos.x >= e.x - 4))) { mode = d > 0 ? 'back' : 'go'; until = t + .6 + rand() * .8; d = -d; }
    const edge = d && pos && pos.onGround && edges.find(e => !e.dead && e.dir === d && (d > 0 ? pos.x >= e.at - 4 && pos.x <= e.x : pos.x <= e.at + 4 && pos.x >= e.x));
    if (edge && t >= jumpUntil) { jumpUntil = t + .38; jumpStarted = t; nextJump = t + .9; }   // an edge he knows: jump it
    else if (!edge && t >= nextJump && mode !== 'stop' && !(d && pos && edges.some(e => e.dir === d && (d > 0 ? e.x - pos.x : pos.x - e.x) > -10 && (d > 0 ? e.x - pos.x : pos.x - e.x) < run * .9 + 20))) { jumpUntil = t + .16 + rand() * .22; jumpStarted = t; nextJump = t + (rand() < .2 ? .35 : .55 + rand() * .9); }   // a hop, never toward a drop he knows within a jump's reach
    const k = NONE(); if (mode === 'go') k.right = true; if (mode === 'back') k.left = true; k.jump = t < jumpUntil;
    return k;
  }
  const press = (d, jump) => ({ ...NONE(), left: d < 0, right: d > 0, jump: !!jump });
  /* what the hero can really do (his note: "make the bot good at the games it makes"): the game's physics if it says
     them, else found out from his own jumps (how high he got, how long he was up); a hop to feel it out first */
  const J = { apex: 0, air: 0, g: 0, v: 0, told: false };
  let takeoff = null, hopped = false, lastJump = null;
  const apex = () => J.told ? J.v * J.v / (2 * J.g) : J.apex;
  const airtime = () => J.told ? 2 * J.v / J.g : J.air;
  /* can he get from C onto p: up no higher than most of his jump, across no further than he'd get by that height */
  function can(C, p) {
    const A = apex(), T = airtime(), up = C.y - p.y, gap = Math.max(p.x - (C.x + C.w), C.x - (p.x + p.w), 0);
    if (!A || !T) return up <= 0 && up > -60 && gap < 24;   // not knowing yet: only little steps down
    if (up > A * .82) return false;
    const g = J.g || 8 * A / (T * T), r = Math.max(0, 1 - Math.max(0, up) / A), t = T * (1 + Math.sqrt(r)) / 2 + (up < 0 ? Math.sqrt(-2 * up / g) * .8 : 0);
    return gap + 4 <= run * t * .85;
  }
  /* he knows the level (his note: "usually devs know way more than players about levels"): the rocks he can get between,
     and the fewest jumps from where he is to the rock under the goal; the rocks with coins on them are worth a detour */
  const stepOff = (C, T, hw) => T.y > C.y && T.x < C.x + C.w && T.x + T.w > C.x && Math.max((T.x + T.w) - (C.x + C.w), C.x - T.x) >= hw;
  const hop = (C, T, hw) => can(C, T) || stepOff(C, T, hw);
  function under(P, pt) {   // the rock a point (the goal) sits on or over
    let best = -1, bd = Infinity;
    P.forEach((p, j) => { const dy = p.y - pt[1], dx = pt[0] < p.x ? p.x - pt[0] : pt[0] > p.x + p.w ? pt[0] - (p.x + p.w) : 0; const d = dx * 2 + (dy >= -4 ? dy : 200 - dy); if (d < bd) { bd = d; best = j; } });
    return best;
  }
  function route(P, from, to, hw) {   // the next rock on the fewest-jumps way, or -1
    if (from === to || from < 0 || to < 0) return -1;
    const prevOf = new Map([[from, -1]]), q = [from];
    while (q.length) {
      const i = q.shift();
      if (i === to) break;
      P.forEach((p, j) => { if (!prevOf.has(j) && j !== i && hop(P[i], p, hw)) { prevOf.set(j, i); q.push(j); } });
    }
    if (!prevOf.has(to)) return -1;
    let j = to; while (prevOf.get(j) !== from) j = prevOf.get(j);
    return j;
  }
  const holdFor = (C, T) => (T.y < C.y - 8 ? .34 : T.y > C.y + 10 ? .1 : .26);
  let retry = -1, falls = 0, gone = null, jumpDir = null, wasUp = false, landedAt = -1, hopUntil = -1, foes = [], aimAt = null, aimUntil = -1;
  const hold = new Map(), attempts = new Map();
  /* the skilled way */
  const holdCap = s => Math.min(s, airtime() ? airtime() * .6 : s);   // never still holding it when he lands (it'd jump again)
  function play(t) {
    const S = seen, h = S.hero;
    if (h && h.onGround && landedAt !== seenT && wasUp) { holdUntil = -1; jumpDir = null; }   // down again: jump let go
    if (h) { if (!h.onGround) wasUp = true; else if (wasUp) { wasUp = false; landedAt = seenT; } }
    if (!h || !Number.isFinite(h.x) || !Number.isFinite(h.y) || h.y > S.h || h.y + (h.h || 0) < -40 || h.x + (h.w || 0) < -10 || h.x > S.w + 10) { dir = 0; target = -1; return NONE(); }   // no hero on the screen: hands still
    const P = S.platforms.map(([x, y, w, hh]) => ({ x, y, w, h: hh })), hw = h.w || 12, hh = h.h || 14;
    const x = h.x + (h.onGround ? dir * run * Math.min(.5, t - seenT) : 0), cx = x + hw / 2, feet = h.y + hh;   // where he is by now (the state is a moment old)
    const on = xx => P.findIndex(p => Math.abs(feet - p.y) < 5 && xx + hw > p.x && xx < p.x + p.w);
    let cur = on(x);
    if (cur < 0 && h.onGround && on(h.x) >= 0) { if (dir) return press(dir, false); cur = on(h.x); }   // by now he's stepping off the edge he was walking to: keep going
    if (!h.onGround && feet > Math.max(...P.map(p => p.y)) + 4) { dir = 0; return NONE(); }   // dropping past everything: nothing left to press for
    if (!h.onGround && t < hopUntil) return press(jumpDir || 0, t < holdUntil);   // over an enemy: keep going the way he jumped
    if (!h.onGround) {   // in the air: steer for where he's going, and land well inside it
      const T = P[target >= 0 ? target : cur >= 0 ? cur : from] || null;
      if (!T) { dir = 0; return NONE(); }
      const m = Math.min(8, T.w / 3), lo = T.x + m, hi = T.x + T.w - hw - m;
      /* an enemy where he'll come down (where it will be by then, and one walking at him): land clear of it, on the rock */
      const f = h.vy > -80 && foesOn(T).find(f => { const fc = f.x + f.w / 2 + f.vx * .35; return Math.abs(fc - cx) < f.w / 2 + hw / 2 + 20 || (Math.abs(fc - cx) < 64 && Math.sign(cx - fc) * f.vx > 0); });
      let d = x < lo ? 1 : x > hi ? -1 : 0;
      if (f) { const away = Math.sign(cx - (f.x + f.w / 2 + f.vx * .35)) || 1; d = (away < 0 ? x > T.x + 2 : x + hw < T.x + T.w - 2) ? away : 0; }
      dir = d; return press(d, t < holdUntil);
    }
    if (t < holdUntil && jumpDir !== null) return press(jumpDir, true);   // a jump he's started: held for its time (the state lags it)
    if (cur < 0) { dir = 0; return NONE(); }
    if (h.onGround) { const d0 = dodge(t, P, P[cur], x, hw); if (d0) return d0; }
    if (cur !== from) { if (cur === target) { attempts.delete(`${from}>${target}`); if (retry === target) retry = -1; target = -1; } prev = from; from = cur; waitUntil = t + .6 + rand() * 1.4; }   // landed: a beat before the next
    if (t < waitUntil && target < 0 && patrolX === null) { dir = 0; return NONE(); }
    const C = P[cur];
    if (!apex() && !hopped) { hopped = true; holdUntil = t + .3; return press(0, true); }   // feeling the jump out, in place
    if (target < 0 || target === cur) {   // where next: one he can make, a bit higher is better, not straight back; one he fell on first, until he makes it
      const aimed = aimAt && t < aimUntil ? aimAt : null, point = aimed || (Array.isArray(S.goal) && S.goal.length >= 2 ? S.goal : null);   // where the playtester sent him, else the goal
      const goalAt = point ? under(P, point) : -1, next = goalAt >= 0 && goalAt !== cur ? route(P, cur, goalAt, hw) : -1;
      if (retry >= 0 && retry !== cur && P[retry] && can(C, P[retry])) target = retry;
      else if (next >= 0 && (tried.get(`${cur}>${next}`) || 0) < t && rand() < .85) target = next;   // mostly the way up, now and then a look around
      else {
        const opts = P.map((p, j) => ({ p, j })).filter(({ p, j }) => j !== cur && can(C, p) && (tried.get(`${cur}>${j}`) || 0) < t);
        const coins = p => (Array.isArray(S.items) ? S.items : []).some(([ix, iy, iw, ih]) => ix + iw > p.x && ix < p.x + p.w && iy + ih <= p.y + 2 && iy + ih > p.y - 60);
        const score = ({ p, j }) => rand() + (p.y < C.y ? .6 : 0) + (coins(p) ? 1 : 0) - (j === prev ? .9 : 0);
        const best = opts.map(o => ({ ...o, s: score(o) })).sort((a, b) => b.s - a.s)[0];
        target = best && rand() < .75 ? best.j : -1;   // now and then he just hangs about where he is
      }
      if (target < 0) { patrolX = C.x + 8 + rand() * Math.max(0, C.w - hw - 16); waitUntil = t + .6 + rand() * 1.4; }
    }
    if (target < 0) {   // hanging about on this one: stroll to a spot, stand, maybe a hop
      if (patrolX !== null && Math.abs(patrolX - x) > 4) { dir = Math.sign(patrolX - x); return press(dir, false); }
      dir = 0; if (t > waitUntil) { patrolX = null; if (rand() < .12) { holdUntil = t + .12; return press(0, true); } }
      return NONE();
    }
    const T = P[target], tc = T.x + T.w / 2, d = Math.sign(tc - cx) || 1, key = `${cur}>${target}`, extra = hold.get(key) || 0;
    const overlap = T.x < C.x + C.w && T.x + T.w > C.x;
    if (overlap && T.y > C.y) {   // below him: step off the side it sticks out from (if it does)
      const right = (T.x + T.w) - (C.x + C.w), left = C.x - T.x, side = right >= left ? 1 : -1;
      if (Math.max(right, left) < hw) { tried.set(key, t + 20); target = -1; dir = 0; return NONE(); }
      lastJump = key; dir = side; return press(side, false);
    }
    if (overlap) {   // above him: stand just past its near edge, then jump up and in
      const spot = d > 0 ? Math.max(C.x + 2, T.x - hw - 4) : Math.min(C.x + C.w - hw - 2, T.x + T.w + 4);
      if (Math.abs(spot - x) > 5) { dir = Math.sign(spot - x); return press(dir, false); }
      holdUntil = t + holdCap(.34 + extra); jumpDir = d; lastJump = key; dir = d; return press(d, true);
    }
    const edge = d > 0 ? C.x + C.w - (x + hw) : x - C.x;   // how far to the edge he's walking to
    if (edge > 5 + rand() * 3) { dir = d; return press(d, false); }
    if (waitUntil < t - .5 && rand() < .3) { waitUntil = t + .2 + rand() * .35; }   // a beat at the edge now and then
    if (t < waitUntil) { dir = 0; return NONE(); }
    /* where he'd come down (from the edge, as far as the jump carries him by T's height) and where each enemy on T will
       be by then: one there, he waits at the edge for it to walk off */
    const g = J.g || (airtime() ? 8 * apex() / (airtime() ** 2) : 900), v = J.v || (airtime() ? g * airtime() / 2 : 380), dy = T.y - C.y;
    const tl = Math.max(.2, (v + Math.sqrt(Math.max(0, v * v + 2 * g * dy))) / g), x0 = d > 0 ? C.x + C.w : C.x;
    const a = x0 + d * 4, b = x0 + d * Math.min(run * tl, Math.abs((d > 0 ? T.x + T.w : T.x) - x0));
    const [zl, zr] = a < b ? [a, b] : [b, a];
    if (foesOn(T).some(f => { const fc = f.x + f.w / 2 + f.vx * tl; return fc > zl - 22 && fc < zr + 22 + hw; })) { dir = 0; return NONE(); }
    lastJump = key;
    if (T.y > C.y + 10 && Math.max(T.x - (C.x + C.w), C.x - (T.x + T.w), 0) < 24) { dir = d; return press(d, false); }   // lower and close: he just steps off
    holdUntil = t + holdCap(holdFor(C, T) + extra); jumpDir = d; dir = d;
    return press(d, true);
  }
  /* gone off the bottom (the game may never say): counted once, and how long he's been gone */
  /* an enemy close on his rock, coming or in the way: he jumps it, over to its far side (even in the beat after a fall:
     a person still hops what walks at them) */
  const foesOn = C => foes.filter(f => Math.abs(f.y + f.h - C.y) < 8 && f.x + f.w > C.x && f.x < C.x + C.w);
  function dodge(t, P, C, x, hw) {
    const cx = x + hw / 2;
    for (const f of foesOn(C)) {
      const side = Math.sign(f.x + f.w / 2 - cx) || 1, gap = f.x > x + hw ? f.x - (x + hw) : x - (f.x + f.w);
      const closing = -side * f.vx + (dir === side ? run : 0);   // how fast the gap shuts
      if (gap < 30 && closing > 8 && apex() > f.h + 6) { jumpDir = side; dir = side; holdUntil = t + holdCap(.3); hopUntil = t + .5; lastJump = null; return press(side, true); }   // coming at him: over it
      if (gap < 12) { dir = -side; return press(-side, false); }   // going the same way, too close: let it walk on
    }
    return null;
  }
  function dodgeNow(t) {   // the same, from the last state alone (while his hands are otherwise still)
    const S = seen, h = S && S.hero;
    if (!h || !Array.isArray(S.platforms)) return null;
    if (!h.onGround) return t < hopUntil ? press(jumpDir || 0, t < holdUntil) : null;
    const P = S.platforms.map(([x, y, w, hh]) => ({ x, y, w, h: hh })), hw = h.w || 12, feet = h.y + (h.h || 14);
    const C = P.find(p => Math.abs(feet - p.y) < 5 && h.x + hw > p.x && h.x < p.x + p.w);
    return C ? dodge(t, P, C, h.x, hw) : null;
  }
  function gone_(off, t) {
    if (off && gone === null) { gone = t; if (recentFall === null || t - recentFall > 1.5) { recentFall = t; fell(t); } }
    if (!off) gone = null;
  }
  /* a fall, from the game or seen: hands off a beat (his note: "react to it and be like dw i will respawn it and then
     try it again"), then the same jump again, holding it longer; three misses and he leaves that one a while */
  function fell(t) {
    learnEdge();
    falls++; pauseUntil = t + 1.6 + rand() * .7; mode = 'go'; until = pauseUntil + 1; dir = 0;
    if (lastJump) {
      const n = (attempts.get(lastJump) || 0) + 1; attempts.set(lastJump, n); hold.set(lastJump, Math.min(.3, (hold.get(lastJump) || 0) + .08));
      if (n >= 3) { tried.set(lastJump, t + 25); retry = -1; } else retry = +lastJump.split('>')[1];
    }
    target = -1; lastJump = null;
  }
  return {
    keys(t) {
      if (t < pauseUntil) return (seen && seen.hero && dodgeNow(t)) || NONE();
      return seen && seen.hero && Array.isArray(seen.platforms) ? play(t) : blind(t);
    },
    /* what the game says is on its screen (its state message, plus the canvas size) */
    see(s, t = 0) {
      if (s && !s.hero && s.player && Array.isArray(s.things)) s = fromThings(s) || s;   // a game that marks what's solid and deadly: the same reflexes
      if (!s || !s.hero || !Array.isArray(s.platforms)) {
        if (s && Number.isFinite(+s.x)) { pos = { x: +s.x, y: +s.y, w: +s.w || 0, h: +s.h || 0, onGround: !!s.onGround }; edgesSee(t); gone_(pos.h > 0 && pos.y > pos.h, t); }   // an old game (x and y only): a fall is still a fall, and an edge he went off is remembered
        return;
      }
      const H = s.hero, ph = s.physics;
      if (ph && +ph.gravity > 0 && +ph.jump > 0) { J.told = true; J.g = +ph.gravity; J.v = +ph.jump; if (+ph.run > 0) run = +ph.run; }
      else if (seen && seen.hero && Number.isFinite(H.vx) && Math.abs(H.vx) > run * 1.05) run = Math.abs(H.vx);   // how fast he really runs
      /* his own jumps: from leaving the ground to landing, how high and how long */
      const feet = H.y + (H.h || 0), was = seen && seen.hero;
      if (was && was.onGround && !H.onGround && H.vy < 0) takeoff = { t: seenT, y: was.y + (was.h || 0), top: feet };
      if (takeoff && !H.onGround) takeoff.top = Math.min(takeoff.top, feet);
      if (takeoff && H.onGround) { const up = takeoff.y - takeoff.top, dy = feet - takeoff.y; if (Math.abs(dy) < 6 && up > 4) { J.apex = Math.max(J.apex, up); J.air = Math.max(J.air, t - takeoff.t - (t - seenT)); } takeoff = null; }
      /* gone off the bottom (the game may never say): counted once, and how long he's been gone */
      gone_(!Number.isFinite(H.y) || H.y > (s.h || Infinity), t);
      const was_ = foes, dt_ = Math.max(.02, t - seenT);   // the enemies, and which way each is going
      foes = (Array.isArray(s.enemies) ? s.enemies : []).filter(e => Array.isArray(e) && e.length >= 4).map(([x, y, w, h]) => {
        const p = was_.reduce((b, f) => (Math.abs(f.x - x) + Math.abs(f.y - y) < (b ? Math.abs(b.x - x) + Math.abs(b.y - y) : 40) ? f : b), null);
        return { x, y, w, h, vx: p ? (x - p.x) / dt_ : 0 };
      });
      seen = s; seenT = t;
    },
    steer(p) { if (p && Number.isFinite(+p.x) && Number.isFinite(+p.w)) pos = { x: +p.x, w: +p.w }; },
    event(name, t) {
      const n = String(name);
      if (/respawn|reset/.test(n)) return;
      if (/fall|death|die|lose/.test(n)) { if (recentFall === null || t - recentFall > 1.5) { recentFall = t; fell(t); } return; }
      if (/hit/.test(n)) { pauseUntil = t + .6 + rand() * .4; dir = 0; }
    },
    /* for the stage: falls so far, and how long the hero's been gone (the game never put him back: a bug) */
    aiming: t => !!aimAt && t < aimUntil,
    aim(point, t) { aimAt = Array.isArray(point) && point.length >= 2 ? [+point[0], +point[1]] : null; aimUntil = t + 10; target = -1; },   // the playtester: go there
    status(t) { return { falls, goneFor: gone === null ? 0 : t - gone, edges: edges.map(e => ({ dir: e.dir, x: Math.round(e.x), at: Math.round(e.at), dead: !!e.dead })) }; },
  };
}
