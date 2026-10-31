/* his whole body off the chair (the mouse chase: "octyn's chasing it around the room"): he stands up, walks and jogs,
   turns, bends to reach for something, sits back down. perform.js works him at the desk (his root at the room's origin);
   this takes over while he's away from it: apply(pose) with the chase's pose for him ({ x, z, heading, stand, gait,
   moving, speed, lean, reach }) puts his root in the room and everything else in his own frame. hands carry on from
   wherever perform left them and ease into place, so nothing pops when it takes over or hands back */
import * as THREE from 'three';
import { V3 } from './look.js';
import { setArm, setLeg, ik, SEATED, THIGH, SHIN } from './octyn.js';
import { ANCHOR, DESK } from './room.js';

const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const HIP_UP = .9, CHEST = .42;
/* seated rest for his hands: left on the keyboard, right on the mouse (perform's home), so handing back is seamless */
const REST = { L: V3(ANCHOR.kb.x + .1, DESK.top + .055, ANCHOR.kb.z - .06), R: V3(ANCHOR.mouse.x + .005, DESK.top + .05, ANCHOR.mouse.z - .07) };

export function createBody(O) {
  const hands = { R: null, L: null }, SH = { R: 'relaxed', L: 'relaxed' };
  const toLocal = p => O.root.worldToLocal(p.clone());
  return {
    /* take over: hands start where they are */
    begin() { for (const s of ['R', 'L']) hands[s] = O.arms[s].hand.position.clone(); },
    apply(p) {
      const k = p.stand, kf = Math.min(1, k * 1.6);   // his feet come back under him before he's all the way up
      /* his root: where he stands, a hop off the ground, facing, and tipped forward from his feet (pitch: lying down) */
      O.root.position.set(p.x, p.y || 0, p.z); O.root.rotation.set(p.pitch || 0, p.heading, 0, 'YXZ'); O.root.updateMatrixWorld(true);
      /* the chair: pushed back as he gets up (he'd walk through its arm), pulled in as he sits; turned with him in a spin */
      const cz = Number.isFinite(p.chairZ) ? p.chairZ : -.05 - .38 * ease(Math.min(1, k * 1.4)), ch = p.chair || 0;   // chairZ: it rolled off
      O.chair.position.set(Math.sin(ch) * cz, 0, Math.cos(ch) * cz); O.chair.rotation.y = ch;
      /* hips and legs: seated to standing; walking, each foot has a stance (back along the ground) and a swing (lifted) */
      const bob = p.moving ? .018 * Math.abs(Math.cos(Math.PI * 2 * p.gait)) : 0;
      /* a crouch (a squat, getting down to the floor): hips down and back, the knees come forward on their own */
      /* sat down on the floor (a fall): hips on the floor, knees up, leaning back on his hands */
      const F = ease(p.floor || 0), sw = (p.sway || 0) * .05 * k;   // sway: his hips side to side
      const cr = p.crouch || 0, hipY = THREE.MathUtils.lerp(THREE.MathUtils.lerp(.58, HIP_UP - (HIP_UP - .48) * cr, ease(k)) - bob, .17, F), hipZ = THREE.MathUtils.lerp(THREE.MathUtils.lerp(.02, 0, ease(k)) + (p.lean || 0) * -.08 * k - .14 * cr * k, -.1, F);
      O.hips.position.set(sw, hipY, hipZ - .02 * (1 - ease(k)));
      const stride = p.moving ? Math.min(.34, .16 + .22 * (p.speed || .5)) : 0;
      for (const s of ['R', 'L']) {
        const sx = s === 'R' ? -1 : 1, [h0, k0, a0] = SEATED[s];
        const hip = V3(sx * .1 + sw, hipY, hipZ);
        let foot = V3(sx * (.1 + .2 * (p.spread || 0)), .1, 0), lift = 0;   // feet apart for a jumping jack
        const fo = p.feet && p.feet[s];   // footwork: [out, lift, forward]
        if (fo) { foot.x += sx * fo[0]; foot.y += fo[1]; foot.z += fo[2]; lift = fo[1]; }
        if (p.moving) {
          const u = ((p.gait + (s === 'L' ? .5 : 0)) % 1 + 1) % 1;
          if (u < .6) foot.z = stride / 2 - stride * (u / .6);
          else { const v = (u - .6) / .4; foot.z = -stride / 2 + stride * ease(v); lift = .07 * Math.sin(Math.PI * v); }
          foot.y += lift;
        }
        let ankle = a0.clone().lerp(foot, ease(kf));
        /* the knee: seated as it was, standing from the leg's two bones, bending forward */
        let knee = k < .02 ? k0.clone() : k0.clone().lerp(ik(hip, ankle, THIGH, SHIN, V3(0, .15, 1)).E, ease(k)), H = h0.clone().lerp(hip, ease(k));
        if (F > 0) { H.lerp(V3(sx * .1, hipY, hipZ), F); ankle = ankle.lerp(V3(sx * .17, .07, .4), F); knee = knee.lerp(ik(H, ankle, THIGH, SHIN, V3(sx * .3, 1, .3)).E, F); }
        setLeg(O, s, H, knee, ankle, 0, -lift * 2);
      }
      /* torso over the hips, leaning into a jog or a reach; head on top */
      const lean = (p.lean || 0) + (p.moving ? .04 : 0);
      O.torso.rotation.set(lean * .7, p.twist || 0, -(p.sway || 0) * .07 * k, 'YXZ');   // twist: his chest turned from his hips; leaning off the sway
      O.torso.position.set(sw * .6, hipY + CHEST + (1 - k) * (1.0 - .58 - CHEST), hipZ + lean * .35);
      const tq = O.torso.quaternion;
      O.head.position.copy(V3(0, .42, lean * .1).applyQuaternion(tq).add(O.torso.position));
      const dz = p.dizzy || 0, t = p.phase || 0;   // dizzy after the spins: his head rolls round, his body sways
      O.head.rotation.set(lean * .5 - (p.pitch || 0) * .55 + (p.nod || 0) + (p.moving ? .04 * Math.sin(Math.PI * 4 * p.gait) : 0) + dz * .12 * Math.cos(t * 4.5), (p.look || 0) + dz * .15 * Math.sin(t * 3), dz * .3 * Math.sin(t * 4.5), 'YXZ');   // nod, look: his head on the beat, a shake
      if (dz) O.torso.rotation.z += dz * .12 * Math.sin(t * 4.5 - .6);   // lying down he looks ahead, not at the floor
      /* arms: seated they rest on the keyboard and mouse; up they hang and swing against the legs; the right one reaches */
      for (const s of ['R', 'L']) {
        const sx = s === 'R' ? -1 : 1;
        const S = V3(sx * O.shoulderW, .06, 0).applyQuaternion(tq).add(O.torso.position);
        const swing = p.moving ? Math.sin(Math.PI * 2 * (p.gait + (s === 'R' ? 0 : .5))) : 0, jog = p.speed > .7 ? 1 : 0;
        const hang = S.clone().add(V3(sx * .07, -.4 + jog * .1, .06 + jog * .08 + swing * (.1 + jog * .06)));
        let T = toLocal(REST[s]).lerp(hang, ease(k)), shape = k > .5 ? (jog ? 'fist' : 'relaxed') : s === 'R' ? 'mouse' : 'type', back = k > .5 ? V3(sx, 0, 0) : V3(0, 1, 0);
        /* a move's arms: up in a cheer, or both waving at the camera, open hands, palms out */
        if (p.arms && p.armsK > 0) {
          const w = p.arms === 'wave' ? Math.sin((p.phase || 0) * 7 + (s === 'R' ? 0 : 1.3)) : 0;
          const up = p.arms === 'wave' ? S.clone().add(V3(sx * (.3 + .09 * w), .4, .14)) : p.arms === 'forward' ? S.clone().add(V3(sx * .06, -.03, .46)) : S.clone().add(V3(sx * .22, .5, .08));
          T = T.lerp(up, p.armsK); if (p.armsK > .5) { shape = p.arms === 'forward' ? 'flat' : 'open'; back = p.arms === 'forward' ? V3(0, 1, 0) : V3(sx * .2, 0, -1); }
        }
        /* a hand anywhere (dancing, flailing, balancing): [out, up, forward] from his shoulder, a shape each */
        const A = p.arm && p.arm[s];
        if (A && p.armK > 0) {
          T = T.lerp(S.clone().add(V3(sx * A[0], A[1], A[2])), Math.min(1, p.armK));
          if (p.armK > .5) { shape = (p.shape && typeof p.shape === 'object' ? p.shape[s] : p.shape) || 'open'; back = A[1] > .15 ? V3(sx * .2, 0, -1) : A[2] > .25 ? V3(0, 1, 0) : V3(sx, 0, 0); }
        }
        /* sat on the floor: hands down behind him */
        if (F > 0) { T = T.lerp(V3(sx * .26, .05 - (p.y || 0), -.3), F); if (F > .5) { shape = 'flat'; back = V3(0, 1, 0); } }
        /* hands flat on the floor under his shoulders (pushups): the palm down to the real floor, whatever his tilt */
        if (p.floorHands > 0) { const w = O.root.localToWorld(S.clone()); w.y = .045; const side = O.root.localToWorld(V3(sx * (p.handsOut ?? .09), 0, 0)).sub(O.root.localToWorld(V3(0, 0, 0))); T = T.lerp(toLocal(w.add(side)), p.floorHands); if (p.floorHands > .5) { shape = 'flat'; back = V3(0, 1, 0).applyQuaternion(O.root.quaternion.clone().invert()); } }
        /* both hands somewhere (waiting on the desk, holding the cat): world points, k of the way from the keys */
        if (p.hands && p.hands.k > 0) { const h = p.hands[s]; T = T.lerp(toLocal(V3(h.x, h.y, h.z)), p.hands.k); if (p.hands.k > .5) { shape = 'open'; back = V3(0, 1, 0); } }
        /* one hand to something (his mouse on the bed, his mug on the floor) */
        if (p.reach && p.reach.k > 0 && s === (p.reach.hand || 'R')) { T = T.lerp(toLocal(V3(p.reach.x, p.reach.y + .04, p.reach.z)), p.reach.k); shape = p.reach.k > .8 ? 'mouse' : 'open'; back = V3(0, 1, 0); }
        hands[s] = hands[s] ? hands[s].lerp(T, .3) : T;
        if (hands[s].distanceTo(T) < .004) hands[s].copy(T);
        setArm(O, s, S, hands[s].clone(), shape, back.normalize());
      }
    },
    /* hand back to the desk: his root home, legs seated */
    end() { O.torso.rotation.order = 'XYZ'; O.root.position.set(0, 0, 0); O.root.rotation.set(0, 0, 0); O.chair.position.set(0, 0, -.05); O.chair.rotation.y = 0; O.hips.position.set(0, .58, 0); for (const s of ['R', 'L']) setLeg(O, s, ...SEATED[s]); },
  };
}
