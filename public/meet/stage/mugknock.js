/* the cat knocks his mug off the desk (the classic, and his "trouble"): she walks round behind it, and in a few paw
   pushes, looking at him between them, walks it to the front edge; over it goes, tipping onto its side on the floor.
   he gets up, steps over, squats right down and picks it up with his left hand, sits back down and puts it back where
   it lives; she watches from the edge, then goes home. one timeline for all three, in the room's frame (the desk's; its
   top is y .76): her pose as catwalk gives it, his as body.js takes it (reach: { x, y, z, k, hand }), and the mug
   { x, y, z, rx (tipped over), on: desk | falling | floor | hand }. pure: the stage runs it */
import { track, walker } from './chase.js';
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (u, a, b) => Math.min(1, Math.max(0, (u - a) / (b - a)));
const lerpAngle = (a, b, u) => { const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * u; };
const DESK_Y = .76, EDGE = .26, FACE_FRONT = Math.PI / 2;   // her facing toward him, the desk's front

export function mugKnock({ home, mug, save = false, rand = Math.random }) {
  const C = x => ({ x: home.x, y: 0, z: home.z, heading: home.turn, stand: 0, gait: 0, moving: false, airborne: false, ...x });
  const behind = { x: mug.x, z: mug.z + .2 };   // where she pushes from: her nose at the mug
  const cat = track(), there = walker([{ x: home.x, z: home.z }, { x: .55, z: .62 }, behind], .2, 2.4);
  cat.add(1.2, u => C({ stand: ease(u) }))
    .add(.5, u => C({ stand: 1, heading: lerpAngle(home.turn, there.first, ease(u)) }))
    .add(there.d, (u, e) => { const w = there.at(u, e); return C({ x: w.x, z: w.z, heading: w.dir, stand: 1, gait: w.gait, moving: true }); })
    .add(.6, u => C({ ...behind, stand: 1, heading: lerpAngle(there.last, FACE_FRONT, ease(u)) }));
  /* the pushes: a look at him, a paw (a lurch), the mug slides; she steps after it. the last one sends it over */
  const taps = 4, step = (mug.z - EDGE + .03) / taps, pushAt = cat.end, tap = 1.4 + rand() * .3;
  const mugZ = s => { const k = Math.min(taps, Math.max(0, (s - pushAt) / tap)), i = Math.floor(k), u = k - i; return mug.z - step * (i + ease(seg(u, .35, .6))); };
  const push = (u, e) => {
    const k = e / tap, i = Math.floor(k), v = k - i;
    const z = behind.z - step * (i + ease(seg(v, .7, 1))) - .015 * Math.sin(Math.PI * seg(v, .3, .6));
    return C({ x: behind.x, z, heading: FACE_FRONT, stand: 1, pitch: v < .3 ? .25 : -.2, moving: v > .7, gait: v * 2 });
  };
  const H = x => ({ x: 0, z: 0, heading: 0, stand: 0, gait: 0, moving: false, speed: 0, lean: 0, reach: null, crouch: 0, ...x });
  if (save) return caught();
  cat.add(taps * tap, push);
  const tipsAt = cat.end, fall = .45, at = { x: mug.x + .02, y: 0, z: EDGE - .12 };
  const edgeCat = { x: behind.x, z: behind.z - step * taps };
  cat.add(1.2, u => C({ ...edgeCat, heading: FACE_FRONT, stand: 1 - .6 * ease(u), pitch: -.35 }));   // she looks down at it

  /* him: a beat, up, over to it, down for it, back, sat, it goes home */
  /* his reaction first (the show cues it as it tips), then up */
  const him = track(tipsAt + fall + 2.8);
  const spot = { x: .3, z: 0 }, onFloor = { x: at.x, y: .05, z: at.z }, putAt = { x: mug.x, y: DESK_Y + .05, z: mug.z - .03 };
  him.add(1.1, u => H({ stand: ease(u), z: .06 * ease(u), lean: .2 * Math.sin(Math.PI * u) }))
    .add(.9, u => H({ stand: 1, x: lerp(0, spot.x, ease(u)), z: lerp(.06, spot.z, ease(u)), heading: .5 * Math.sin(Math.PI * u), moving: true, gait: u * 1.5, speed: .4 }))
    .add(1.4, u => H({ ...spot, stand: 1, crouch: 1.4 * ease(seg(u, 0, .7)), lean: 1.3 * ease(seg(u, 0, .7)), reach: { ...onFloor, k: ease(seg(u, .4, 1)), hand: 'L' } }));
  him.add(.6, () => H({ ...spot, stand: 1, crouch: 1.4, lean: 1.3, reach: { ...onFloor, k: 1, hand: 'L' } }));   // his hand closes on it
  const picked = him.end;
  him
    .add(1.1, u => H({ ...spot, stand: 1, crouch: 1.4 * (1 - ease(u)), lean: 1.3 * (1 - ease(u)), reach: { x: .3, y: .95, z: .25, k: 1 - .6 * ease(u), hand: 'L' } }))
    .add(.9, u => H({ stand: 1, x: lerp(spot.x, 0, ease(u)), z: lerp(spot.z, .06, ease(u)), heading: -.5 * Math.sin(Math.PI * u), moving: true, gait: u * 1.5, speed: .4 }))
    .add(1.2, u => H({ z: .06 * (1 - ease(u)), stand: 1 - ease(u), lean: .2 * Math.sin(Math.PI * u) }))
    .add(1.3, u => H({ lean: .18 * Math.sin(Math.PI * u), reach: { ...putAt, k: Math.sin(Math.PI * Math.min(1, u * 1.25)), hand: 'L' } }));
  const placed = him.end - 1.3 + 1.3 * .4, himDone = him.end;

  /* her, once it's back: up and home */
  const back = walker([edgeCat, { x: .55, z: .62 }, { x: home.x, z: home.z }], .2, 2.4);
  cat.add(Math.max(0, himDone + .8 - cat.end), () => C({ ...edgeCat, heading: FACE_FRONT, stand: .4, pitch: .2 }))
    .add(.6, u => C({ ...edgeCat, stand: 1, heading: lerpAngle(FACE_FRONT, back.first, ease(u)) }))
    .add(back.d, (u, e) => { const w = back.at(u, e); return C({ x: w.x, z: w.z, heading: w.dir, stand: 1, gait: w.gait, moving: true }); })
    .add(.6, u => C({ stand: 1, heading: lerpAngle(back.last, home.turn, ease(u)) }))
    .add(1.2, u => C({ stand: 1 - ease(u) }));

  const dur = Math.max(cat.end, himDone);
  function mugAt(s) {
    if (s < tipsAt) return { x: mug.x, y: DESK_Y, z: s < pushAt ? mug.z : mugZ(s), rx: 0, on: 'desk' };
    if (s < tipsAt + fall) { const u = (s - tipsAt) / fall; return { x: lerp(mug.x, at.x, u), y: DESK_Y * (1 - u * u), z: lerp(EDGE - .01, at.z, u), rx: -Math.PI / 2 * ease(u), on: 'falling' }; }
    if (s < picked) { const e = s - tipsAt - fall; return { ...at, rx: -Math.PI / 2 + .25 * Math.exp(-e * 5) * Math.sin(e * 25), on: 'floor' }; }
    if (s < placed) return { x: at.x, y: at.y, z: at.z, rx: 0, on: 'hand' };
    return { x: mug.x, y: DESK_Y, z: mug.z, rx: 0, on: 'desk' };
  }
  /* his note ("sometimes octyn can stop the cat from fully doing what it was trying to do"): he sees it coming and puts
     his hand on it at the edge from his chair; she gives up, looks at him, goes home; he slides it back */
  function caught() {
    const pushes = taps - 1, held = mug.z - step * pushes, edgeAt = { x: behind.x, z: behind.z - step * pushes };
    cat.add(pushes * tap, push);
    const saved = cat.end, onMug = z => ({ x: mug.x, y: DESK_Y + .06, z: z - .05 });
    const him = track(pushAt + (pushes - 1) * tap + .3), slide = 1.2, wait = 2.4;
    him.add(tap - .3, u => H({ lean: .18 * ease(u), reach: { ...onMug(held), k: ease(u), hand: 'L' } }))
      .add(wait, () => H({ lean: .18, reach: { ...onMug(held), k: 1, hand: 'L' } }))
      .add(slide, u => H({ lean: .18 * (1 - ease(u)), reach: { ...onMug(lerp(held, mug.z, ease(u))), k: 1, hand: 'L' } }))
      .add(.8, u => H({ reach: { ...onMug(mug.z), k: 1 - ease(u), hand: 'L' } }));
    const slideAt = saved + wait, himGoes = pushAt + (pushes - 1) * tap + .3, himDone = him.end;
    const back = walker([edgeAt, { x: .55, z: .62 }, { x: home.x, z: home.z }], .2, 2.4);
    cat.add(wait, u => C({ ...edgeAt, heading: FACE_FRONT, stand: 1 - .5 * ease(seg(u, 0, .3)), pitch: .25 }))   // sat, looking at him
      .add(.6, u => C({ ...edgeAt, stand: 1, heading: lerpAngle(FACE_FRONT, back.first, ease(u)) }))
      .add(back.d, (u, e) => { const w = back.at(u, e); return C({ x: w.x, z: w.z, heading: w.dir, stand: 1, gait: w.gait, moving: true }); })
      .add(.6, u => C({ stand: 1, heading: lerpAngle(back.last, home.turn, ease(u)) }))
      .add(1.2, u => C({ stand: 1 - ease(u) }));
    const dur = Math.max(cat.end, himDone);
    const mugAt = s => ({ x: mug.x, y: DESK_Y, z: s < pushAt ? mug.z : s < saved ? Math.max(held, mugZ(s)) : s < slideAt ? held : s < slideAt + slide ? lerp(held, mug.z, ease((s - slideAt) / slide)) : mug.z, rx: 0, on: 'desk' });
    return { dur, saved: true, marks: { pushAt, saved, tipsAt: Infinity, landed: Infinity, picked: Infinity, placed: Infinity, himGoes, himDone },
      at(s) { return { cat: cat.at(s), him: s < himGoes ? H({}) : him.at(s), mug: mugAt(s), done: s >= dur }; } };
  }
  return {
    dur, marks: { pushAt, tipsAt, landed: tipsAt + fall, picked, placed, himGoes: tipsAt + fall + 2.8, himDone },
    at(s) { return { cat: cat.at(s), him: him.at(s), mug: mugAt(s), done: s >= dur }; },
  };
}
