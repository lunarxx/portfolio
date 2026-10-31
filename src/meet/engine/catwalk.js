/* the cat walks (his notes: "make that cat alive as in walkable ... sometimes it could walk over the keyboard and now the
   code has random letters octyn is backspacing ... dont make it repetitive"). a walk is a timeline: she gets up, walks
   the desk across the keyboard to its far end, turns, walks back and settles where she was. lane: the z she walks the
   keys at, when her straight line from home would go through something (the mug); she angles over to it first. at(s)
   says where she is s seconds in: { x, y, z, heading, moving, stand (0 lying .. 1 up), gait (walk cycle phase), onKeys,
   done }; y is the step up onto the keyboard (keys.h high), eased over its edges. heading is her root's y rotation
   (forward is (cos, -sin) in x and z). keysBetween(s0, s1): the keys her paws press in that time, one a step while she's
   over the keyboard: garbage for the code on screen. pure: the stage moves the rig and types the keys */
const KEYS = "asdfghjkl;qwertyuiopzxcvbnm,./'[]0123456789 ";
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerpAngle = (a, b, u) => { let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * u; };
const facing = (dx, dz) => Math.atan2(-dz, dx);

/* a path through points: where she is d along it, and which way it goes there (looking a little either side, so she
   turns through a corner instead of snapping) */
export function polyline(pts) {
  const segs = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], len = Math.hypot(b.x - a.x, b.z - a.z); if (len > 1e-6) { segs.push({ a, b, len, d0: L }); L += len; } }
  const pos = d => { d = Math.max(0, Math.min(L, d)); const g = segs.find(s => d <= s.d0 + s.len) || segs[segs.length - 1], u = (d - g.d0) / g.len; return { x: g.a.x + (g.b.x - g.a.x) * u, z: g.a.z + (g.b.z - g.a.z) * u }; };
  const dir = d => { const p = pos(d - .04), q = pos(d + .04); return facing(q.x - p.x, q.z - p.z); };
  return { L, pos, dir };
}

export function keyboardWalk({ home, keys, speed = .12, far = null, lane = null, stepHz = 3, rand = Math.random }) {
  const end = far ?? keys.x0 - .08, z = lane ?? home.z;
  const pts = [{ x: home.x, z: home.z }]; if (Math.abs(z - home.z) > 1e-6) pts.push({ x: home.x - .1, z }); pts.push({ x: end, z });
  const out = polyline(pts), back = polyline(pts.slice().reverse());
  const up = 1.2, turnOut = .5, walk = out.L / speed, turnFar = .8, turnHome = .6, down = 1.2;
  const T = { up, out: up + turnOut, farT: up + turnOut + walk, back: up + turnOut + walk + turnFar, home: up + turnOut + 2 * walk + turnFar };
  const dur = T.home + turnHome + down;
  const west = out.dir(.04), turned = back.dir(.04), homeward = back.dir(back.L - .04);
  function at(s) {
    const p = { x: home.x, y: 0, z: home.z, heading: home.turn, moving: false, stand: 1, gait: 0, onKeys: false, done: s >= dur };
    if (s < up) { p.stand = ease(s / up); return p; }   // she's at home: off the keys, y stays 0
    if (s < T.out) { p.heading = lerpAngle(home.turn, west, ease((s - up) / turnOut)); return p; }
    if (s < T.farT) { const d = (s - T.out) * speed; Object.assign(p, out.pos(d)); p.heading = out.dir(d); p.moving = true; p.gait = (s - T.out) * stepHz; }
    else if (s < T.back) { Object.assign(p, out.pos(out.L)); p.heading = lerpAngle(out.dir(out.L), turned, ease((s - T.farT) / turnFar)); }
    else if (s < T.home) { const d = (s - T.back) * speed; Object.assign(p, back.pos(d)); p.heading = back.dir(d); p.moving = true; p.gait = (s - T.back) * stepHz; }
    else if (s < T.home + turnHome) { p.heading = lerpAngle(homeward, home.turn, ease((s - T.home) / turnHome)); }
    else { p.heading = home.turn; p.stand = 1 - ease((s - T.home - turnHome) / down); }
    p.y = (keys.h || 0) * ease(Math.min(p.x - keys.x0 + .03, keys.x1 - p.x + .03) / .05);
    p.onKeys = p.moving && p.x >= keys.x0 && p.x <= keys.x1 && p.z >= keys.z0 && p.z <= keys.z1;
    return p;
  }
  /* the steps: one every 1/stepHz s while walking; a step on the keys presses one */
  const steps = [];
  for (const [t0, t1] of [[T.out, T.farT], [T.back, T.home]]) for (let s = t0 + .5 / stepHz; s < t1; s += 1 / stepHz) {
    const p = at(s); if (p.onKeys) steps.push({ s, key: KEYS[Math.floor(rand() * KEYS.length)] });
  }
  return { dur, at, keysBetween: (s0, s1) => steps.filter(k => k.s >= s0 && k.s < s1).map(k => k.key), get keyCount() { return steps.length; } };
}
