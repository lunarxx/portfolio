/* the cat steals his mouse and he chases her round the room (his note: "take the mouse and run away and octyn's chasing it
   around the room while the camera tracks"). one timeline for both of them and the mouse:
     she gets up, walks the front of the keyboard to his mouse, takes it in her mouth, jumps off the desk by his right,
     runs a loop round the room (a little different every time) and jumps up on the bed, drops it, lies down;
     he looks, gets up out of his chair, jogs after her, reaches over the bed for it, walks back, sits down and puts it
     back on its pad; a while later she comes home: off the bed, across the floor, up onto the desk, back to her spot.
   everything is in the room's frame (the desk's; its top is y .76). the cat's pose is what catwalk gives (y from the
   desk top, heading with forward (cos, -sin)); his: { x, z, heading (forward (sin, cos)), stand (0 seated .. 1 up), gait,
   moving, speed, lean, reach: null or { x, y, z, k } for his right hand }. mouse.on: desk, cat, bed (at), hand.
   pure: the stage moves the rigs */
import { polyline } from './catwalk.js';
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const lerpAngle = (a, b, u) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * u; };
const catFacing = (dx, dz) => Math.atan2(-dz, dx), hisFacing = (dx, dz) => Math.atan2(dx, dz);
const DESK_Y = .76, BED_TOP = .53, FLOOR = -DESK_Y;

/* a run of segments on one clock: add(seconds, u -> pose); at(s) holds the first pose before it starts and the last after */
export function track(t0 = 0) {
  const segs = []; let t = t0;
  return {
    add(d, f) { segs.push({ t0: t, d, f }); t += d; return this; },
    get end() { return t; },
    at(s) { if (s < segs[0].t0) return segs[0].f(0, 0); const g = segs.find(x => s < x.t0 + x.d); return g ? g.f((s - g.t0) / g.d, s - g.t0) : segs[segs.length - 1].f(1, segs[segs.length - 1].d); },
  };
}
/* a walk along points at a speed: its seconds, and the pose for how far along (heading along the path) */
export function walker(pts, speed, stepHz) {
  const p = polyline(pts);
  return { d: p.L / speed, at: (u, e) => ({ ...p.pos(u * p.L), dir: p.dir(u * p.L), gait: e * stepHz }), last: p.dir(p.L - .02), first: p.dir(.02) };
}

export function mouseChase({ home, mouse, rand = Math.random }) {
  const j = (a) => (rand() - .5) * 2 * a;   // a little different every time
  const cat = track(), C = (x) => ({ x: home.x, y: 0, z: home.z, heading: home.turn, stand: 0, gait: 0, moving: false, airborne: false, ...x });
  /* 1. to the mouse along the front of the keyboard, clear of the mug */
  const toMouse = walker([{ x: home.x, z: home.z }, { x: home.x - .1, z: .36 }, { x: mouse.x + .16, z: mouse.z - .06 }], .22, 2.4);
  const grabAt = { x: mouse.x + .16, z: mouse.z - .06 }, edge = { x: mouse.x - .12, z: .3 }, floorAt = { x: mouse.x - .38, z: .04 };
  cat.add(1.2, u => C({ stand: ease(u) }))
    .add(.5, u => C({ stand: 1, heading: lerpAngle(home.turn, toMouse.first, ease(u)) }))
    .add(toMouse.d, (u, e) => { const w = toMouse.at(u, e); return C({ x: w.x, z: w.z, heading: w.dir, stand: 1, gait: w.gait, moving: true }); })
    .add(.8, u => C({ ...grabAt, heading: toMouse.last, stand: 1, pitch: -.45 * Math.sin(Math.PI * u) }));
  const grabbed = cat.end;
  /* 2. off the desk by his right and round the room, up onto the bed */
  const loop = [floorAt, { x: -1.0 + j(.08), z: -.62 + j(.08) }, { x: -.4 + j(.1), z: -1.3 + j(.06) }, { x: .55 + j(.1), z: -1.32 + j(.06) }, { x: 1.18, z: -.72 + j(.06) }];
  const bed = { x: 1.72, z: -.62 }, run = walker(loop, 1.0, 4.2);
  const toEdge = catFacing(edge.x - grabAt.x, edge.z - grabAt.z), down = catFacing(floorAt.x - edge.x, floorAt.z - edge.z), up = catFacing(bed.x - loop[4].x, bed.z - loop[4].z);
  cat.add(.4, u => C({ ...grabAt, stand: 1, heading: lerpAngle(toMouse.last, toEdge, ease(u)) }))
    .add(Math.hypot(edge.x - grabAt.x, edge.z - grabAt.z) / .3, u => C({ x: lerp(grabAt.x, edge.x, u), z: lerp(grabAt.z, edge.z, u), heading: toEdge, stand: 1, moving: true, gait: u * 2 }))
    .add(.55, u => { const e = ease(u); return C({ x: lerp(edge.x, floorAt.x, e), z: lerp(edge.z, floorAt.z, e), y: lerp(0, FLOOR, u * u) + .08 * Math.sin(Math.PI * u), heading: down, stand: 1, moving: true, airborne: true }); })
    .add(run.d, (u, e) => { const w = run.at(u, e); return C({ x: w.x, z: w.z, y: FLOOR, heading: w.dir, stand: 1, gait: w.gait, moving: true }); })
    .add(.6, u => { const e = ease(u); return C({ x: lerp(loop[4].x, bed.x, e), z: lerp(loop[4].z, bed.z, e), y: lerp(FLOOR, BED_TOP - DESK_Y, e) + .18 * Math.sin(Math.PI * u), heading: up, stand: 1, moving: true, airborne: true }); })
    .add(.5, u => C({ ...bed, y: BED_TOP - DESK_Y, stand: 1, heading: lerpAngle(up, Math.PI, ease(u)), pitch: -.35 * Math.sin(Math.PI * u) }));
  const dropped = cat.end;
  cat.add(1, u => C({ ...bed, y: BED_TOP - DESK_Y, stand: 1 - ease(u), heading: Math.PI }));
  const onBed = { x: bed.x - .17, y: BED_TOP, z: bed.z - .02 };   // where the mouse lies, by her head

  /* 3. him: a beat to see it, up out of the chair, after her (a jog), the reach over the bed, back, down, the mouse home */
  const him = track(grabbed + .6), H = (x) => ({ x: 0, z: 0, heading: 0, stand: 0, gait: 0, moving: false, speed: 0, lean: 0, reach: null, ...x });
  const out = [{ x: 0, z: .06 }, { x: -.62, z: -.05 }, { x: -.98 + j(.05), z: -.66 }, { x: -.4, z: -1.2 + j(.05) }, { x: .5, z: -1.2 + j(.05) }, { x: 1.12, z: -.64 }];
  const chase = walker(out, .85, 2.6), back = walker([out[5], { x: .55, z: -.02 }, { x: 0, z: .06 }], .55, 1.8);
  const toHis = d => d + Math.PI / 2;   // the path's heading is the cat's convention: turn it to his
  him.add(.9, () => H({}))
    .add(1.3, u => H({ stand: ease(u), z: .06 * ease(u), lean: .25 * Math.sin(Math.PI * u) }))
    .add(.45, u => H({ stand: 1, z: .06, heading: lerpAngle(0, toHis(chase.first), ease(u)) }))
    .add(chase.d, (u, e) => { const w = chase.at(u, e); return H({ x: w.x, z: w.z, heading: toHis(w.dir), stand: 1, gait: w.gait, moving: true, speed: .85, lean: .12 }); });
  const arrived = him.end;
  const reachTo = { ...onBed, y: onBed.y + .02 }, facingBed = hisFacing(reachTo.x - out[5].x, reachTo.z - out[5].z);
  him.add(.4, u => H({ ...out[5], stand: 1, heading: lerpAngle(toHis(chase.last), facingBed, ease(u)) }))
    .add(1.4, u => H({ ...out[5], stand: 1, heading: facingBed, lean: .35 * Math.sin(Math.PI * u), reach: { ...reachTo, k: Math.sin(Math.PI * u) } }));
  const took = him.end - .7;
  him.add(.5, u => H({ ...out[5], stand: 1, heading: lerpAngle(facingBed, toHis(back.first), ease(u)) }))
    .add(back.d, (u, e) => { const w = back.at(u, e); return H({ x: w.x, z: w.z, heading: toHis(w.dir), stand: 1, gait: w.gait, moving: true, speed: .55 }); })
    .add(.5, u => H({ z: .06, stand: 1, heading: lerpAngle(toHis(back.last), 0, ease(u)) }))
    .add(1.3, u => H({ z: .06 * (1 - ease(u)), stand: 1 - ease(u), lean: .2 * Math.sin(Math.PI * u) }));
  const seated = him.end;
  const pad = { x: mouse.x, y: DESK_Y + .03, z: mouse.z };
  him.add(1.2, u => H({ reach: { ...pad, k: Math.sin(Math.PI * u) } }));
  const putBack = him.end - .6, himDone = him.end;

  /* 4. her, after he's back down: a while on the bed, then home */
  const stay = Math.max(dropped + 1, seated) + 2 + rand() * 4 - dropped - 1;
  const hop = { x: 1.25, z: -.36 }, below = { x: .72, z: .08 }, onDesk = { x: .66, z: .33 };
  const homeWalk = walker([hop, below], .45, 2.4);
  cat.add(stay, () => C({ ...bed, y: BED_TOP - DESK_Y, stand: 0, heading: Math.PI }))
    .add(1, u => C({ ...bed, y: BED_TOP - DESK_Y, stand: ease(u), heading: Math.PI }))
    .add(.5, u => { const e = ease(u); return C({ x: lerp(bed.x, hop.x, e), z: lerp(bed.z, hop.z, e), y: lerp(BED_TOP - DESK_Y, FLOOR, u * u) + .08 * Math.sin(Math.PI * u), heading: catFacing(hop.x - bed.x, hop.z - bed.z), stand: 1, moving: true, airborne: true }); })
    .add(homeWalk.d, (u, e) => { const w = homeWalk.at(u, e); return C({ x: w.x, z: w.z, y: FLOOR, heading: w.dir, stand: 1, gait: w.gait, moving: true }); })
    .add(.4, u => C({ ...below, y: FLOOR, heading: lerpAngle(homeWalk.last, catFacing(onDesk.x - below.x, onDesk.z - below.z), ease(u)), stand: 1 - .4 * Math.sin(Math.PI * u) }))
    .add(.6, u => { const e = ease(u); return C({ x: lerp(below.x, onDesk.x, e), z: lerp(below.z, onDesk.z, e), y: lerp(FLOOR, 0, e) + .2 * Math.sin(Math.PI * u), heading: catFacing(onDesk.x - below.x, onDesk.z - below.z), stand: 1, moving: true, airborne: true }); })
    .add(Math.hypot(home.x - onDesk.x, home.z - onDesk.z) / .2, (u, e) => C({ x: lerp(onDesk.x, home.x, u), z: lerp(onDesk.z, home.z, u), heading: catFacing(home.x - onDesk.x, home.z - onDesk.z), stand: 1, moving: true, gait: e * 2.4 }))
    .add(.6, u => C({ stand: 1, heading: lerpAngle(catFacing(home.x - onDesk.x, home.z - onDesk.z), home.turn, ease(u)) }))
    .add(1.2, u => C({ stand: 1 - ease(u) }));

  const dur = Math.max(cat.end, him.end);
  return {
    dur, marks: { grabbed, dropped, arrived, took, seated, putBack, himGoes: grabbed + .6, himDone },
    at(s) {
      const c = cat.at(s), h = him.at(s);
      const on = s < grabbed ? 'desk' : s < dropped ? 'cat' : s < took ? 'bed' : s < putBack ? 'hand' : 'desk';
      return { cat: c, him: h, mouse: on === 'bed' ? { on, at: onBed } : { on }, done: s >= dur };
    },
  };
}
