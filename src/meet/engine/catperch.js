/* the cat goes and sits on him (his note: "cat can have lots of activies like it can sit on octyns head, or shoulders"):
   she gets up, walks the desk to the edge by him (spot), crouches, jumps up onto him and settles in her loaf there, stays
   a while, then gets up, jumps down to the spot and walks home. target(s) says where on him she sits, in the desk's
   frame ({ x, y, z, heading }), asked every frame, so she goes where his head or shoulder goes. at(s) -> { x, y, z,
   heading, stand, gait, moving, airborne, perched, done }. heading is her root's y rotation: forward is (cos, -sin) in
   x and z. pure: the stage moves the rig */
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const lerpAngle = (a, b, u) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * u; };
const facing = (dx, dz) => Math.atan2(-dz, dx);

export function perchVisit({ home, spot, target, stay = 25, speed = .2, stepHz = 2.4, hop = .12 }) {
  const out = facing(spot.x - home.x, spot.z - home.z), back = facing(home.x - spot.x, home.z - spot.z);
  const walk = Math.hypot(spot.x - home.x, spot.z - home.z) / speed;
  /* the timeline, in order: [name, seconds] */
  const plan = [['up', 1.2], ['turn', .5], ['walk', walk], ['crouch', .45], ['jump', .6], ['settle', 1], ['stay', stay], ['rise', 1], ['turnDown', .4], ['jumpDown', .5], ['land', .3], ['turnHome', .5], ['walkHome', walk], ['turnRest', .6], ['down', 1.2]];
  let t = 0; const seg = plan.map(([name, d]) => { const s = { name, t0: t, d }; t += d; return s; });
  const dur = t;
  function at(s) {
    const g = seg.find(x => s < x.t0 + x.d) || null, u = g ? Math.max(0, (s - g.t0) / g.d) : 1;
    const p = { x: home.x, y: 0, z: home.z, heading: home.turn, stand: 0, gait: 0, moving: false, airborne: false, perched: false, done: !g };
    if (!g) return p;
    const on = target(s), down = facing(spot.x - on.x, spot.z - on.z);
    switch (g.name) {
      case 'up': p.stand = ease(u); break;
      case 'turn': Object.assign(p, { stand: 1, heading: lerpAngle(home.turn, out, ease(u)) }); break;
      case 'walk': Object.assign(p, { stand: 1, heading: out, moving: true, gait: (s - g.t0) * stepHz, x: lerp(home.x, spot.x, u), z: lerp(home.z, spot.z, u) }); break;
      case 'crouch': Object.assign(p, { x: spot.x, z: spot.z, heading: lerpAngle(out, facing(on.x - spot.x, on.z - spot.z), ease(u)), stand: 1 - .45 * Math.sin(Math.PI * u) }); break;
      case 'jump': { const e = ease(u);
        Object.assign(p, { x: lerp(spot.x, on.x, e), z: lerp(spot.z, on.z, e), y: lerp(0, on.y, e) + hop * Math.sin(Math.PI * u) + Math.max(0, on.y) * .25 * Math.sin(Math.PI * u), heading: facing(on.x - spot.x, on.z - spot.z), stand: 1, moving: true, airborne: true }); break; }
      case 'settle': Object.assign(p, { x: on.x, y: on.y, z: on.z, heading: lerpAngle(facing(on.x - spot.x, on.z - spot.z), on.heading, ease(u)), stand: 1 - ease(u) }); break;
      case 'stay': Object.assign(p, { x: on.x, y: on.y, z: on.z, heading: on.heading, stand: 0, perched: true }); break;
      case 'rise': Object.assign(p, { x: on.x, y: on.y, z: on.z, heading: on.heading, stand: ease(u) }); break;
      case 'turnDown': Object.assign(p, { x: on.x, y: on.y, z: on.z, heading: lerpAngle(on.heading, down, ease(u)), stand: 1 }); break;
      case 'jumpDown': { const e = ease(u);
        Object.assign(p, { x: lerp(on.x, spot.x, e), z: lerp(on.z, spot.z, e), y: lerp(on.y, 0, u * u) + hop * Math.sin(Math.PI * u), heading: down, stand: 1, moving: true, airborne: true }); break; }
      case 'land': Object.assign(p, { x: spot.x, z: spot.z, heading: down, stand: 1 - .35 * Math.sin(Math.PI * u) }); break;
      case 'turnHome': Object.assign(p, { x: spot.x, z: spot.z, heading: lerpAngle(down, back, ease(u)), stand: 1 }); break;
      case 'walkHome': Object.assign(p, { stand: 1, heading: back, moving: true, gait: (s - g.t0) * stepHz, x: lerp(spot.x, home.x, u), z: lerp(spot.z, home.z, u) }); break;
      case 'turnRest': Object.assign(p, { stand: 1, heading: lerpAngle(back, home.turn, ease(u)) }); break;
      case 'down': Object.assign(p, { stand: 1 - ease(u) }); break;
    }
    return p;
  }
  const phaseAt = s => { const g = seg.find(x => s < x.t0 + x.d); return g ? g.name : 'done'; };
  return { dur, at, phaseAt, get perchAt() { return seg.find(x => x.name === 'stay').t0; } };
}
