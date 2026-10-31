/* the cat naps on his keyboard (a cat's classic: she lies down right where he's typing): she walks the front of the desk
   to the keyboard, lies down across it and falls asleep; his hands come off the keys and wait on the desk; a while
   later he reaches in with both hands, lifts her off (her legs dangling), carries her past the end of the keyboard,
   sets her down, and she gives him a look and walks home. all of it within his reach from the chair.
   one timeline for both of them, in the room's frame (the desk's): her pose as catwalk gives it (y above the desk top;
   plus nap: asleep, carried: in his hands), his: { stand, hands: null or { L, R: world points, k: how far his hands are
   there instead of on the keys } }. pure: the stage runs it */
import { track, walker } from './chase.js';
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const lerpAngle = (a, b, u) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * u; };
const catFacing = (dx, dz) => Math.atan2(-dz, dx);
const DESK_Y = .76;

export function keyboardNap({ home, kb, rand = Math.random }) {
  const C = x => ({ x: home.x, y: 0, z: home.z, heading: home.turn, stand: 0, gait: 0, moving: false, airborne: false, ...x });
  const bed = { x: kb.x, z: kb.z - .02, y: kb.h }, drop = { x: .3, z: .3 }, lane = .36;
  /* where his hands take her: her near flank, one each side of her middle, a little above the desk */
  const flanks = (c) => ({ L: { x: c.x + .07, y: DESK_Y + c.y + .05, z: c.z - .1 }, R: { x: c.x - .07, y: DESK_Y + c.y + .05, z: c.z - .1 } });
  const rest = { L: { x: .22, y: DESK_Y + .04, z: .3 }, R: { x: -.2, y: DESK_Y + .04, z: .3 } };   // waiting on the desk, off the keys
  const mix = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u) });

  const cat = track();
  const there = walker([{ x: home.x, z: home.z }, { x: home.x - .1, z: lane }, { x: kb.x + .12, z: lane }, { x: bed.x, z: bed.z }], .2, 2.4);
  cat.add(1.2, u => C({ stand: ease(u) }))
    .add(.5, u => C({ stand: 1, heading: lerpAngle(home.turn, there.first, ease(u)) }))
    .add(there.d, (u, e) => { const w = there.at(u, e); return C({ x: w.x, z: w.z, y: kb.h * ease(Math.min(1, (w.z - lane) / .05)), heading: w.dir, stand: 1, gait: w.gait, moving: true }); })
    .add(.6, u => C({ ...bed, stand: 1, heading: lerpAngle(there.last, Math.PI, ease(u)) }));
  const lies = cat.end;
  const nap = 18 + rand() * 12;
  cat.add(1.2, u => C({ ...bed, heading: Math.PI, stand: 1 - ease(u) }))   // settling down; asleep once she's still
    .add(nap, () => C({ ...bed, heading: Math.PI, nap: true }));
  const reachAt = cat.end;
  cat.add(1.0, () => C({ ...bed, heading: Math.PI, nap: true }));   // his hands come to her
  const liftAt = cat.end;
  cat.add(.8, u => C({ x: bed.x, z: bed.z, y: bed.y + .14 * ease(u), heading: Math.PI, stand: ease(Math.min(1, u * 3)), carried: u > .3 }))
    .add(1.4, u => { const e = ease(u); return C({ x: lerp(bed.x, drop.x, e), z: lerp(bed.z, drop.z, e), y: lerp(bed.y + .14, .14, e) + .03 * Math.sin(Math.PI * u), heading: Math.PI, stand: 1, carried: true }); })
    .add(.6, u => C({ ...drop, y: .14 * (1 - ease(u)), heading: Math.PI, stand: 1, carried: u < .6 }));   // her feet find the desk
  const setDown = cat.end;
  const back = walker([drop, { x: home.x - .1, z: lane }, { x: home.x, z: home.z }], .2, 2.4);
  cat.add(1.0, () => C({ ...drop, heading: Math.PI, stand: 1, pitch: .15 }))   // a look at him
    .add(.6, u => C({ ...drop, stand: 1, heading: lerpAngle(Math.PI, back.first, ease(u)) }))
    .add(back.d, (u, e) => { const w = back.at(u, e); return C({ x: w.x, z: w.z, heading: w.dir, stand: 1, gait: w.gait, moving: true }); })
    .add(.6, u => C({ stand: 1, heading: lerpAngle(back.last, home.turn, ease(u)) }))
    .add(1.2, u => C({ stand: 1 - ease(u) }));

  /* him: from when she lies down until his hands are back on the keys */
  const him = track(lies), H = x => ({ x: 0, z: 0, heading: 0, stand: 0, gait: 0, moving: false, lean: 0, reach: null, hands: null, ...x });
  const onHer = s => flanks(cat.at(s));
  him.add(1.0, u => H({ hands: { ...rest, k: ease(u) } }))
    .add(reachAt - lies - 1.0, () => H({ hands: { ...rest, k: 1 } }))
    .add(1.0, (u, e) => { const f = onHer(reachAt + e); return H({ lean: .1 * ease(u), hands: { L: mix(rest.L, f.L, ease(u)), R: mix(rest.R, f.R, ease(u)), k: 1 } }); })
    .add(setDown - liftAt, (u, e) => { const f = onHer(liftAt + e); return H({ lean: .1, hands: { ...f, k: 1 } }); })
    .add(.6, (u, e) => { const f = onHer(setDown); return H({ lean: .1 * (1 - ease(u)), hands: { L: mix(f.L, rest.L, ease(u)), R: mix(f.R, rest.R, ease(u)), k: 1 } }); })
    .add(.8, u => H({ hands: { ...rest, k: 1 - ease(u) } }));
  const himDone = him.end;
  const dur = Math.max(cat.end, himDone);
  return {
    dur, marks: { lies, reachAt, liftAt, setDown, himDone },
    at(s) { return { cat: cat.at(s), him: s < lies ? H({}) : him.at(s), done: s >= dur }; },
  };
}
