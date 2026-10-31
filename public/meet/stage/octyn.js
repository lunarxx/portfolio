/* octyn in 3d, to the studio redraw (lab design/studio-v7-sheet): a cream crt for a head, no neck, a normal body in a
   muted tee, jeans and white sneakers, white cartoon gloves with real fingers. seated in a mesh office chair.
   faces +z. the performer drives him through pose(): torso lean/turn/lift, head, each arm's wrist target and hand shape,
   and the face on his screen. */
import * as THREE from 'three';
import { C, toon, flat, add, B, RB, CY, SP, CAP, V3 } from './look.js';

const UP = V3(0, 1, 0);
/* a limb piece from a profile along its length (0 at a, 1 at b), shaped like muscle rather than a tube */
function limbGeo(profile) { return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 12); }
function orient(m, a, b) { const d = new THREE.Vector3().subVectors(b, a); m.position.copy(a); m.scale.set(1, Math.max(.001, d.length()), 1); m.quaternion.setFromUnitVectors(UP, d.normalize()); }

export function buildOctyn(scene, at = V3(0, 0, 0)) {
  const root = new THREE.Group(); root.position.copy(at); scene.add(root);
  const O = { root, seat: .5, shoulderW: .205, L1: .29, L2: .265, chest: V3(0, 1.0, 0) };

  /* ---------- the chair: mesh back in a frame, seat, arms, gas lift, five-star base on casters ---------- */
  const chair = O.chair = new THREE.Group(); scene.add(chair); chair.position.copy(at).add(V3(0, 0, -.05));   // the room's, not his: it stays when he gets up
  { const frame = toon(C.coal), mesh = toon(C.slate);
    add(chair, RB(.5, .09, .48, .035), frame, 0, .47, 0);
    add(chair, RB(.46, .03, .44, .012), mesh, 0, .52, 0);
    const back = new THREE.Group(); chair.add(back); back.position.set(0, .56, -.25); back.rotation.x = -.12;
    add(back, RB(.48, .62, .05, .04), frame, 0, .33, 0); add(back, RB(.4, .52, .02, .03), mesh, 0, .33, .02);
    add(back, RB(.34, .12, .06, .03), frame, 0, .72, .01);
    for (const s of [-1, 1]) { add(chair, B(.035, .2, .035), frame, s * .27, .6, -.02); add(chair, RB(.07, .035, .28, .012), frame, s * .27, .71, .02); }
    add(chair, CY(.028, .028, .34), toon(C.steel), 0, .28, 0); add(chair, CY(.045, .045, .08), toon(C.coal), 0, .13, 0);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, leg = add(chair, RB(.3, .035, .045, .012), frame, Math.cos(a) * .15, .07, Math.sin(a) * .15); leg.rotation.y = -a;
      add(chair, SP(.03, 8), frame, Math.cos(a) * .3, .03, Math.sin(a) * .3); } }

  /* ---------- legs: jeans, knees, shins, white sneakers; seated unless something stands him up (setLeg) ---------- */
  const denim = toon(C.jeans);
  O.hips = add(root, RB(.36, .16, .3, .07), denim, 0, .58, .0);                                  // hips in the seat
  O.legs = {};
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'R' : 'L', shoe = new THREE.Group(); root.add(shoe);
    add(shoe, RB(.21, .06, .11, .025), toon(C.white), 0, -.055, .03).rotation.y = Math.PI / 2;    // sneaker
    add(shoe, RB(.215, .02, .115, .008), toon(C.coal), 0, -.088, .03).rotation.y = Math.PI / 2;   // its sole
    add(shoe, B(.08, .012, .005), toon(C.ash), s * .058, -.05, .03).rotation.y = Math.PI / 2;
    O.legs[side] = { thigh: add(root, limbGeo([[.075, 0], [.08, .3], [.068, .85], [.06, 1]]), denim), knee: add(root, SP(.064, 10), denim),
      shin: add(root, limbGeo([[.058, 0], [.055, .3], [.045, .9], [.043, 1]]), denim), shoe };
    setLeg(O, side, V3(s * .1, .58, .02), V3(s * .115, .56, .44), V3(s * .12, .1, .5));
  }

  /* ---------- torso: a tee over a chest and waist, collar, hem, short sleeves at the shoulders ---------- */
  const torso = new THREE.Group(); root.add(torso); torso.position.copy(O.chest);
  const tee = toon(C.tee);
  { const prof = [[.0, -.44], [.16, -.44], [.175, -.4], [.168, -.28], [.172, -.15], [.19, -.02], [.198, .06], [.19, .1], [.15, .135], [.075, .145], [.06, .142], [.0, .14]];
    const t = add(torso, new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 18), tee); t.scale.set(1.12, 1, .66);
    add(torso, new THREE.TorusGeometry(.064, .013, 6, 16), toon(C.tee2), 0, .137, .004).rotation.x = Math.PI / 2;   // collar
    add(torso, new THREE.TorusGeometry(.176, .012, 6, 20), toon(C.tee2), 0, -.425, 0).scale.set(1.12, 1, .66);         // hem
    add(torso, RB(.07, .08, .01, .006), toon(C.tee2), .08, .02, .128);                                               // a chest pocket
    for (const s of [-1, 1]) add(torso, SP(.078, 12), tee, s * O.shoulderW, .06, 0).scale.set(1, .85, .9); }
  O.torso = torso;

  /* ---------- the crt: cream shell, rounded bezel, bulged dark screen with his face, dials and grille, stepped back ---------- */
  const face = document.createElement('canvas'); face.width = 64; face.height = 52;
  const faceTex = new THREE.CanvasTexture(face); faceTex.magFilter = faceTex.minFilter = THREE.NearestFilter; faceTex.colorSpace = THREE.SRGBColorSpace;
  const head = new THREE.Group(); root.add(head);
  { const shell = toon(C.white), shell2 = toon(C.shell);
    add(head, RB(.56, .44, .17, .045), shell, 0, 0, .07);                                        // the front of the set
    add(head, RB(.48, .38, .12, .05), shell2, 0, 0, -.07);                                        // the tube housing, stepped in
    add(head, RB(.34, .26, .07, .035), toon(C.shell2), 0, -.01, -.16);                           // and its back
    for (let k = 0; k < 4; k++) add(head, B(.28, .006, .014), toon(C.shell2), 0, .191, -.035 - k * .024);   // vents on top
    add(head, RB(.41, .34, .02, .035), toon(C.coal), -.055, 0, .157);                             // the screen's dark surround
    /* the screen: bulged a touch, like glass on a tube */
    const g = new THREE.PlaneGeometry(.385, .315, 12, 10), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i) / .19, y = p.getY(i) / .16; p.setZ(i, .012 * (1 - Math.min(1, (x * x + y * y) * .5))); }
    g.computeVertexNormals();
    const screen = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: faceTex })); screen.position.set(-.055, 0, .168); head.add(screen);
    /* the control column on the right: two dials, a speaker grille */
    for (const y of [.11, .03]) { add(head, CY(.03, .03, .03, 14), toon(C.steel), .215, y, .165).rotation.x = Math.PI / 2; add(head, B(.006, .03, .006), toon(C.ash), .215, y + .012, .182); }
    for (let k = 0; k < 5; k++) add(head, B(.06, .006, .004), toon(C.shell2), .215, -.06 - k * .022, .158);
    add(head, SP(.008, 6), flat(C.amber), .215, -.18, .16, false);                                // the power light
  }
  O.head = head; O.face = face; O.faceTex = faceTex;

  /* ---------- arms: sleeve, upper arm with a bicep, elbow, forearm tapering to the wrist ---------- */
  const skin = toon(C.skin), glove = toon(C.glove);
  O.arms = {};
  for (const s of ['R', 'L']) {
    const a = O.arms[s] = {
      sleeve: add(root, limbGeo([[.08, 0], [.078, .6], [.084, .95], [.084, 1]]), tee),
      upper: add(root, limbGeo([[.052, 0], [.058, .35], [.054, .7], [.046, 1]]), skin),
      elbow: add(root, SP(.047, 10), skin),
      fore: add(root, limbGeo([[.047, 0], [.05, .25], [.042, .7], [.034, 1]]), skin),
      hand: new THREE.Group(), fingers: [], thumb: [],
    };
    root.add(a.hand);
    /* a white glove: cuff, palm, four fingers of three joints, a thumb of two */
    add(a.hand, CY(.043, .047, .035, 12), glove, 0, 0, -.004).rotation.x = Math.PI / 2;
    add(a.hand, RB(.084, .032, .088, .014), glove, 0, 0, .05);
    /* hand space: back of the hand +y, fingers +z, so +x is his right hand's thumb side (the mirror for his left).
       the index sits next to the thumb, the pinky on the outside */
    const side = s === 'R' ? 1 : -1; a.side = side;
    const lens = [[.03, .024, .02], [.033, .026, .021], [.031, .025, .02], [.025, .019, .017]];
    for (let i = 0; i < 4; i++) {
      const chain = []; let parent = a.hand, z = .092;
      lens[i].forEach((l, j) => { const g = new THREE.Group(); g.position.set(j === 0 ? side * (1.5 - i) * .02 : 0, 0, j === 0 ? z : lens[i][j - 1]); parent.add(g);
        add(g, CAP(.0095 - j * .0006, l * .8, 6), glove, 0, 0, l / 2).rotation.x = Math.PI / 2; chain.push(g); parent = g; });
      a.fingers.push(chain);
    }
    let parent = a.hand;
    [[.028, V3(side * .045, -.005, .03)], [.024, null]].forEach(([l, pos], j) => { const g = new THREE.Group(); if (pos) g.position.copy(pos); else g.position.set(0, 0, .028); parent.add(g);
      add(g, CAP(.011, l * .8, 6), glove, 0, 0, l / 2).rotation.x = Math.PI / 2; a.thumb.push(g); parent = g; });
    a.thumb[0].rotation.set(0, side * .7, 0);
  }
  return O;
}

/* hand shapes: per finger (index, middle, ring, pinky) how far each curls, then the thumb [curl, across, splay (default .7;
   1.45 stands it straight out from the side of the hand, a thumbs up)] */
export const SHAPES = {
  open: [[.05, .05, .05, .05], [.1, .2]], flat: [[.12, .12, .15, .18], [.1, .4]], type: [[.45, .4, .45, .5], [.3, .5]],
  mouse: [[.5, .45, .7, .8], [.3, .6]], relaxed: [[.5, .6, .7, .8], [.3, .6]], fist: [[1.5, 1.5, 1.5, 1.5], [.9, 1.1]],
  point: [[0, 1.5, 1.5, 1.5], [.8, 1]], peace: [[0, 0, 1.5, 1.5], [.9, 1]], thumbsup: [[1.5, 1.5, 1.5, 1.5], [-.1, 0, 1.45]],
};
function shapeHand(a, name) {
  const [f, t] = Array.isArray(name) ? name : SHAPES[name] || SHAPES.relaxed;
  a.fingers.forEach((chain, i) => chain.forEach((g, j) => g.rotation.x = f[i] * [1, 1.1, .8][j]));
  a.thumb[0].rotation.x = t[0] * .6; a.thumb[1].rotation.x = t[0]; a.thumb[0].rotation.z = -a.side * t[1] * .4;   // across goes over the palm (-y)
  a.thumb[0].rotation.y = a.side * (t[2] ?? .7);
}
/* a leg, in his own frame: hip, knee, ankle, and which way the foot points (yaw, 0 ahead) */
export const SEATED = { R: [V3(-.1, .58, .02), V3(-.115, .56, .44), V3(-.12, .1, .5)], L: [V3(.1, .58, .02), V3(.115, .56, .44), V3(.12, .1, .5)] };
export const THIGH = .42, SHIN = .464;
export function setLeg(O, side, hip, knee, ankle, footYaw = 0, footPitch = 0) {
  const l = O.legs[side];
  orient(l.thigh, hip, knee); l.knee.position.copy(knee); orient(l.shin, knee, ankle);
  l.shoe.position.copy(ankle); l.shoe.rotation.set(footPitch, footYaw, 0, 'YXZ');
}
/* two bones from shoulder to target, the elbow towards the pole (down, out and back, like a person's) */
export function ik(S, T, L1, L2, pole) {
  const d = T.clone().sub(S), dist = THREE.MathUtils.clamp(d.length(), .05, L1 + L2 - .002), dir = d.normalize();
  const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  return { E: S.clone().addScaledVector(dir, a).addScaledVector(p, h), W: S.clone().addScaledVector(dir, dist) };
}
/* one arm: shoulder S (world) to wrist target T, a hand shape, which way the back of the hand faces, and optionally where
   the fingers aim (world), aimK of the way: the wrist bends (up to ~75 degrees) instead of the fingers always carrying on
   along the forearm (a raised forearm had every hand pointing at the ceiling) */
export function setArm(O, side, S, T, shape, back = V3(0, 1, 0), aim = null, aimK = 0) {
  const sx = side === 'R' ? -1 : 1, a = O.arms[side];
  const { E, W } = ik(S, T, O.L1, O.L2, V3(sx * .6, -1, -.45));
  const sl = S.clone().lerp(E, .42);
  orient(a.sleeve, S.clone().lerp(E, -.08), sl); orient(a.upper, S, E); a.elbow.position.copy(E); orient(a.fore, E, W);
  let fd = W.clone().sub(E).normalize();
  if (aim && aimK > 0) { const want = aim.clone().normalize(), k = aimK * Math.min(1, 1.3 / Math.max(.01, fd.angleTo(want))); fd = fd.clone().lerp(want, Math.min(1, k)).normalize(); }
  /* a lone extended finger never points up: from any camera that's the middle finger. it opens the hand instead */
  shape = Array.isArray(shape) ? shape : SHAPES[shape] || SHAPES.relaxed;
  if (shape[0][0] < .4 && shape[0][1] > 1 && shape[0][2] > 1 && fd.y > .45) { const k = Math.min(1, (fd.y - .45) / .2), o = SHAPES.open;
    shape = [shape[0].map((x, i) => x + (o[0][i] - x) * k), shape[1].map((x, i) => x + ((o[1][i] ?? .7) - x) * k)]; }
  const bk = back.clone().sub(fd.clone().multiplyScalar(back.dot(fd))).normalize();
  const x = new THREE.Vector3().crossVectors(bk, fd).normalize();
  a.hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, bk, fd)); a.hand.position.copy(W);
  shapeHand(a, shape);
}
/* the moods with their own whole face: eyes, brows and mouth together */
function drawMood(g, f, bx) {
  if (f.mood === 'laugh') {   // ^ ^ squeezed shut, brows up, the mouth wide open
    for (const cx of [20, 44]) { g.fillRect(cx - 4 + bx, 22, 2, 2); g.fillRect(cx - 2 + bx, 20, 4, 2); g.fillRect(cx + 2 + bx, 22, 2, 2); }
    g.fillRect(16 + bx, 11, 8, 1); g.fillRect(40 + bx, 11, 8, 1);
    const h = 6 + Math.round(f.jaw * 4); g.fillRect(21, 33, 22, h); g.fillStyle = '#1B1D22'; g.fillRect(23, 33, 18, Math.max(2, h - 3)); g.fillStyle = '#E3A94F';
  } else if (f.mood === 'surprised') {   // round eyes, brows high, a little o
    const eh = Math.max(1, Math.round(11 * (1 - f.blink))); g.fillRect(17 + bx, 22 - eh / 2, 7, eh); g.fillRect(41 + bx, 22 - eh / 2, 7, eh);
    g.fillRect(16 + bx, 8, 8, 1); g.fillRect(40 + bx, 8, 8, 1);
    g.fillRect(29, 34, 6, 1); g.fillRect(29, 40, 6, 1); g.fillRect(28, 35, 1, 5); g.fillRect(35, 35, 1, 5);
  } else {   // sad: low short eyes, brows up in the middle, a frown
    g.fillRect(18 + bx, 23, 5, 3); g.fillRect(42 + bx, 23, 5, 3);
    for (let k = 0; k < 7; k++) { g.fillRect(16 + k + bx, 14 - Math.floor(k / 2), 1, 1); g.fillRect(48 - k + bx, 14 - Math.floor(k / 2), 1, 1); }
    g.fillRect(26, 37, 12, 1); g.fillRect(25, 38, 1, 2); g.fillRect(38, 38, 1, 2);
  }
}
/* his face on the screen: amber on dark, with a line of glass across the top */
export function drawFace(O, f) {
  const g = O.face.getContext('2d'), a = '#E3A94F'; g.fillStyle = '#1B1D22'; g.fillRect(0, 0, 64, 52);
  g.fillStyle = '#272A31'; g.fillRect(3, 3, 58, 1); g.fillRect(3, 3, 1, 12);
  const bx = Math.round(f.gx * 3), ey = 22 - Math.round(f.look * 3);
  g.fillStyle = a;
  /* his notes on stream 6 ("add laughs and other types of expressive emotions"): laugh, surprised, sad */
  if (f.mood === 'laugh' || f.mood === 'surprised' || f.mood === 'sad') { drawMood(g, f, bx); O.faceTex.needsUpdate = true; return; }
  if (f.happy > .5) { for (const cx of [20, 44]) { g.fillRect(cx - 4 + bx, ey, 2, 2); g.fillRect(cx - 2 + bx, ey - 2, 4, 2); g.fillRect(cx + 2 + bx, ey, 2, 2); } }  // ^ ^
  else { const eh = Math.max(1, Math.round(9 * (1 - f.blink))), ew = 5; g.fillRect(18 + bx, ey - eh / 2, ew, eh); g.fillRect(42 + bx, ey - eh / 2, ew, eh); }
  const up = Math.round(f.brow * 3);
  if (f.angry) { for (let k = 0; k < 7; k++) { g.fillRect(16 + k + bx, 11 - up + Math.floor(k / 2), 1, 1); g.fillRect(48 - k + bx, 11 - up + Math.floor(k / 2), 1, 1); } }
  else { g.fillRect(16 + bx, 12 - up, 8, 1); g.fillRect(40 + bx, 12 - up, 8, 1); }
  const mw = 12 + Math.round(f.smile * 8), mh = Math.max(1, Math.round(f.jaw * 10));
  g.fillRect(32 - mw / 2, 37, mw, mh);
  if (f.smile > .3 && mh <= 2) { g.fillRect(32 - mw / 2 - 1, 36, 1, 1); g.fillRect(32 + mw / 2, 36, 1, 1); }
  O.faceTex.needsUpdate = true;
}
