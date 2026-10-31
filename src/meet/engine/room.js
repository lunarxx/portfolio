/* octyn's room in 3d: the painting (rig/pixel.js) and the studio redraw (lab design/studio-v7-sheet) as one lived-in room.
   he faces +z. the desk stands against the front wall (his monitor faces him, the webcam on a stand behind it: camera A), the back wall
   is behind him (camera A's background). walls are painted (unlit) with painted glows, as the painting does.
   a wall between a camera and him is hidden for that camera only (a cutaway set), so every camera sees the same room.
   layers: 7 the pendant over him (out of the way of T, the chase camera, which looks down past it), 1 front wall, 2 back wall, 3 the wall at -x, 4 the wall at +x, 5 the desk's far side (hidden from camera A: it would
   stand in front of him), 6 his monitor (every camera sees it; camera A over its back). */
import * as THREE from 'three';
import { C, hex, scene, toon, soft, flat, tex, add, B, RB, CY, SP, CAP, plane, glowSpot, glows, V3 } from './look.js';

export const DESK = { top: .76, z0: .26, z1: 1.02, x0: -1.15, x1: 1.15 };
const FRONT_Z = 1.1, BACK_Z = -1.9, SIDE_X = 2.6, CEIL = 2.8;
export const ANCHOR = { kb: V3(.02, DESK.top + .012, .46), mouse: V3(-.4, DESK.top + .02, .46), pad: V3(-.4, DESK.top + .003, .47) };
const onLayer = (o, n) => { o.traverse(c => c.layers.set(n)); return o; };
const group = (n) => { const g = new THREE.Group(); scene.add(g); g.userData.layer = n; return g; };
const paintedWall = (w, h, color, lines) => new THREE.MeshBasicMaterial({ map: (() => { const t = tex(32, 64, (g, W, H) => { g.fillStyle = color; g.fillRect(0, 0, W, H); g.fillStyle = lines; for (let x = 0; x < W; x += 8) g.fillRect(x, 0, 1, H); g.fillStyle = '#211B17'; g.fillRect(0, H - 5, W, 5); }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / .55, 1); return t; })() });

/* ---------- small builders ---------- */
function book(parent, x, y, z, h, w, c, lean = 0, ry = 0) { const b = add(parent, RB(w, h, .15, .004), toon(c), x, y + h / 2, z); b.rotation.z = lean; b.rotation.y = ry; add(parent, B(w + .002, .01, .12), toon(C.paper), x, y + h * .7, z).rotation.z = lean; return b; }
const BOOKS = [C.brick, C.denim, C.sage, C.paper, C.ember, C.olive, C.navy, C.maroon, C.fog, C.cream, C.moss, C.rose];
export function bookRow(parent, x0, x1, y, z, seed = 1) {
  let x = x0, i = seed;
  while (x < x1 - .03) { const w = .028 + ((i * 7) % 5) * .006, h = .15 + ((i * 13) % 7) * .014, lean = (i % 9 === 0) ? .25 : 0;
    book(parent, x + w / 2, y, z, h, w, BOOKS[(i * 5) % BOOKS.length], lean); x += w + .004 + (lean ? .03 : 0); i++; if (i % 11 === 0) x += .06; }
}
export function pot(parent, x, y, z, s, c = C.brick) { add(parent, CY(.055 * s, .07 * s, .1 * s, 12), toon(c), x, y + .05 * s, z); add(parent, CY(.064 * s, .064 * s, .015 * s, 12), toon(c), x, y + .1 * s, z); }
export function succulent(parent, x, y, z, s = 1) { pot(parent, x, y, z, s * .8, C.paper); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, l = add(parent, CAP(.013 * s, .05 * s, 5), toon(i % 2 ? C.sage : C.moss), x + Math.cos(a) * .02 * s, y + .11 * s, z + Math.sin(a) * .02 * s); l.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); } }
export function leafy(parent, x, y, z, s = 1, c = C.brick) {
  pot(parent, x, y, z, s, c);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + i, r = .03 + (i % 3) * .015, l = add(parent, SP(.045 * s, 7), toon([C.leaf, C.moss, C.sage][i % 3]), x + Math.cos(a) * r * s, y + (.16 + (i % 4) * .04) * s, z + Math.sin(a) * r * s);
    l.scale.set(1, .35, .6); l.rotation.set(Math.cos(a) * .6, a, Math.sin(a) * .6); }
}
/* pothos trailing off a shelf edge: leaves down a stem */
export function pothos(parent, x, y, z, len = .5, seed = 1) {
  pot(parent, x, y, z, .7, C.paper);
  for (let v = 0; v < 3; v++) { const dx = (v - 1) * .05, n = Math.round(len / .05) - v;
    for (let i = 0; i < n; i++) { const yy = y + .06 - i * .05, l = add(parent, SP(.022, 6), toon(i % 2 ? C.leaf : C.moss), x + dx + Math.sin(i * 1.3 + seed + v) * .02, yy, z + .07 + Math.cos(i + v) * .015); l.scale.set(1.2, .5, .9); l.rotation.z = Math.sin(i + v) * .8; } }
}
export function frame(parent, x, y, z, w, h, t, ry = 0, border = C.bark) { const g = new THREE.Group(); parent.add(g); g.position.set(x, y, z); g.rotation.y = ry;
  add(g, RB(w, h, .025, .004), toon(border), 0, 0, 0); plane(g, w - .05, h - .05, t, 0, 0, .014); return g; }
export function fairyLights(parent, x0, x1, y, z, ry = 0, n = 24) {
  const g = new THREE.Group(); parent.add(g); g.position.set(0, 0, z); g.rotation.y = ry;
  for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * i / (n - 1), yy = y - .06 * Math.abs(Math.sin(i * Math.PI / 5)); add(g, SP(.016, 6), flat(i % 3 ? C.amber : C.cream), x, yy, 0, false);
    const s = glowSpot(0, 0, 0, .3, i % 3 ? '#E3A94F' : '#F1D9A8', .26); s.position.copy(new THREE.Vector3(x, yy - .02, .02).applyMatrix4(g.matrixWorld.clone().compose(g.position, g.quaternion, g.scale))); parent.add(s); }
  return g;
}
export function blindsWindow(parent, x, y, z, w, h, ry = 0) {
  const g = new THREE.Group(); parent.add(g); g.position.set(x, y, z); g.rotation.y = ry;
  const city = tex(48, 64, (c, W, H) => { const s = c.createLinearGradient(0, 0, 0, H); s.addColorStop(0, '#15171C'); s.addColorStop(1, '#2A2D3A'); c.fillStyle = s; c.fillRect(0, 0, W, H);
    c.fillStyle = '#9A9D9F'; c.fillRect(34, 7, 3, 3); const tops = [40, 32, 46, 36, 28, 44]; c.fillStyle = '#101216'; tops.forEach((t, i) => c.fillRect(i * 8, t, 8, H - t));
    for (let i = 0; i < 50; i++) { const bx = (i * 19) % W, by = 30 + (i * 13) % 34; if (by > tops[Math.floor(bx / 8)] + 2) { c.fillStyle = i % 4 ? '#E3A94F' : '#F1D9A8'; c.fillRect(bx, by, 1, 1); } } });
  plane(g, w, h, city, 0, 0, 0, false);
  const fr = toon(C.trim); add(g, B(w + .08, .05, .08), fr, 0, h / 2 + .02, .03); add(g, B(w + .1, .06, .14), fr, 0, -h / 2 - .02, .06);
  add(g, B(.05, h + .06, .08), fr, -w / 2 - .02, 0, .03); add(g, B(.05, h + .06, .08), fr, w / 2 + .02, 0, .03);
  for (let i = 0; i < 11; i++) { const s = add(g, B(w, .018, .03), toon(C.paper), 0, h / 2 - .03 - i * .045, .045, false); s.rotation.x = -.9; }   // blinds, half up
  add(g, B(w + .04, .05, .05), toon(C.paper), 0, h / 2 - .02, .05);
  parent.add(glowSpot(x, y, z + .1 * Math.cos(ry), Math.max(w, h) * 1.2, '#6F86B0', .1));   // on the wall's layer, on the room's side of it
  return g;
}

/* the cat: body, a head on a neck pivot (ears, eyes), a tail on its own pivot, so she breathes, twitches, looks up,
   swishes, stretches (cat.js). the stream puts her on his desk; a reel puts her wherever she is in his home */
export function buildCat(parent, x, y, z, turn) {
  const cat = {};
  { const root = cat.root = new THREE.Group(); parent.add(root); root.position.set(x, y, z); root.rotation.y = turn; cat.baseTurn = root.rotation.y;
    const fur = toon(C.steel), pale = toon(C.ash), dark = flat(C.ink), lit = flat(C.amber);
    cat.body = add(root, SP(.1, 12), fur, 0, .06, 0); cat.body.scale.set(1.5, .7, .9);
    const head = cat.head = new THREE.Group(); root.add(head); head.position.set(.1, .08, .02);
    add(head, SP(.065, 10), fur, .03, .02, 0);
    add(head, SP(.03, 8), pale, .078, 0, 0).scale.set(.7, .75, 1.15);   // the muzzle, paler, so the face reads from across the room
    cat.ears = [-1, 1].map(s => add(head, new THREE.ConeGeometry(.022, .045, 4), fur, .05, .085, s * .035));
    /* an eye: open is amber with a slit pupil (it catches the light in a dark room); shut is a dark line */
    cat.eyes = [-1, 1].map(s => { const open = new THREE.Group(); head.add(open); open.position.set(.089, .03, s * .024);
      add(open, B(.004, .016, .013), lit, 0, 0, 0, false); add(open, B(.002, .012, .004), dark, .002, 0, 0, false);
      const shut = add(head, B(.004, .003, .016), dark, .09, .026, s * .024, false); return { open, shut }; });
    /* the tail: five segments on a chain from the rump, so it curls round her in a loaf, waves along its length, hooks at the tip */
    const tail = cat.tail = new THREE.Group(); root.add(tail); tail.position.set(-.13, .025, -.02); cat.segs = [];
    let par = tail; for (let k = 0; k < 5; k++) { const g = new THREE.Group(); par.add(g); if (k) g.position.x = -.036;
      add(g, CAP(.016 - k * .0017, .026, 6), fur, -.018, 0, 0).rotation.z = Math.PI / 2; cat.segs.push(g); par = g; }
    /* four legs from the hips, .1 long at scale 1 with a big pale paw at the end: short and thick (his note: "too thin, like
       tubes and way too long"), her body the same as when she sits; tucked away in a loaf, swinging when she walks (cat.js) */
    cat.legs = [[.085, .045], [.085, -.045], [-.085, .045], [-.085, -.045]].map(([x, z]) => { const l = new THREE.Group(); root.add(l); l.position.set(x, .02, z);
      add(l, CAP(.026, .05, 6), fur, 0, -.05, 0); add(l, SP(.027, 7), pale, .008, -.088, 0).scale.set(1.35, .55, 1.1); l.visible = false; return l; });
    cat.home = { x: root.position.x, y: root.position.y, z: root.position.z }; }
  return cat;
}

/* ---------- walls and floor ---------- */
export function buildRoom() {
  let monitor = null;
  const front = group(1), back = group(2), wallL = group(3), wallR = group(4), mon = group(5), screen6 = group(6), room = group(0);
  add(room, B(2 * SIDE_X, .02, FRONT_Z - BACK_Z), soft(C.floor), 0, -.01, (FRONT_Z + BACK_Z) / 2, false);
  { const planks = tex(64, 64, (g, w, h) => { g.fillStyle = '#3A2E26'; g.fillRect(0, 0, w, h); g.fillStyle = '#33281F'; for (let y = 0; y < h; y += 8) { g.fillRect(0, y, w, 1); g.fillRect((y * 13) % w, y, 1, 8); } });
    planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(7, 4); const f = plane(room, 2 * SIDE_X, FRONT_Z - BACK_Z, planks, 0, .001, (FRONT_Z + BACK_Z) / 2); f.rotation.x = -Math.PI / 2; }
  add(room, RB(2.4, .015, 1.9, .007), soft(C.rug), 0, .008, .05, false); add(room, B(2.2, .016, 1.7), soft(C.rug2), 0, .009, .05, false);
  add(back, new THREE.PlaneGeometry(2 * SIDE_X, CEIL), paintedWall(2 * SIDE_X, CEIL, '#2B2521', '#302924'), 0, CEIL / 2, BACK_Z, false);
  add(front, new THREE.PlaneGeometry(2 * SIDE_X, CEIL), paintedWall(2 * SIDE_X, CEIL, '#2F2823', '#342C26'), 0, CEIL / 2, FRONT_Z, false).rotation.y = Math.PI;
  add(wallL, new THREE.PlaneGeometry(FRONT_Z - BACK_Z, CEIL), paintedWall(FRONT_Z - BACK_Z, CEIL, '#261F1B', '#2B2420'), -SIDE_X, CEIL / 2, (FRONT_Z + BACK_Z) / 2, false).rotation.y = Math.PI / 2;
  add(wallR, new THREE.PlaneGeometry(FRONT_Z - BACK_Z, CEIL), paintedWall(FRONT_Z - BACK_Z, CEIL, '#261F1B', '#2B2420'), SIDE_X, CEIL / 2, (FRONT_Z + BACK_Z) / 2, false).rotation.y = -Math.PI / 2;
  for (const [g, z, ry] of [[back, BACK_Z + .015, 0], [front, FRONT_Z - .015, Math.PI]]) add(g, B(2 * SIDE_X, .09, .03), toon(C.trim), 0, .045, z).rotation.y = ry;

  /* ---------- the back wall, behind him: the painting's wall, filled ---------- */
  /* a tall bookcase at the left, packed */
  { const bc = new THREE.Group(); back.add(bc); bc.position.set(-1.3, 0, BACK_Z + .2); const w = toon(C.wood), dk = toon(C.bark);
    add(bc, B(.9, 2.0, .04), dk, 0, 1.0, -.16); add(bc, B(.04, 2.0, .34), w, -.45, 1.0, 0); add(bc, B(.04, 2.0, .34), w, .45, 1.0, 0);
    for (let k = 0; k < 6; k++) add(bc, B(.9, .035, .34), w, 0, .05 + k * .39, 0);
    bookRow(bc, -.42, .1, .07, .0, 2); leafy(bc, .28, .07, 0, .9, C.sage);
    bookRow(bc, -.2, .42, .46, 0, 5); add(bc, RB(.14, .12, .12, .02), toon(C.cream), -.32, .52, 0);
    bookRow(bc, -.42, .0, .85, 0, 9); pothos(bc, .22, .87, 0, .45, 2); add(bc, SP(.05, 10), toon(C.amber), .08, .92, 0);
    frame(bc, -.2, 1.32, .02, .22, .16, tex(12, 9, (g) => { g.fillStyle = '#C9BFAE'; g.fillRect(0, 0, 12, 9); g.fillStyle = '#A9543F'; g.fillRect(3, 3, 6, 4); }), 0, C.coal); bookRow(bc, .05, .42, 1.24, 0, 3);
    bookRow(bc, -.42, .2, 1.63, 0, 7); succulent(bc, .32, 1.63, 0, 1.2);
    add(bc, RB(.18, .14, .14, .03), toon(C.denim), -.25, 2.09, 0); leafy(bc, .2, 2.02, 0, .8, C.paper); }
  /* framed sunset print (the studio sheet), the window with blinds, the posters, a clock */
  frame(back, -.68, 1.52, BACK_Z + .02, .5, .4, tex(31, 25, (g, w, h) => { g.fillStyle = '#E3A94F'; g.fillRect(0, 0, w, 11); g.fillStyle = '#F1D9A8'; g.fillRect(0, 4, w, 3);
    g.fillStyle = '#D06A3A'; g.beginPath(); g.arc(15, 12, 6, Math.PI, 0); g.fill(); g.fillStyle = '#7A4A2E'; g.fillRect(0, 12, w, 5); g.fillStyle = '#5A3F31'; for (let x = 0; x < w; x++) g.fillRect(x, 17 - Math.round(3 * Math.abs(Math.sin(x / 4))), 1, 8); g.fillStyle = '#3F5A4A'; g.fillRect(0, 21, w, 4); }), 0, C.paper);
  blindsWindow(back, .72, 1.58, BACK_Z + .01, .8, .9);
  plane(back, .42, .36, tex(21, 18, (g, w, h) => { g.fillStyle = '#4D5E78'; g.fillRect(0, 0, w, h); g.fillStyle = '#E3A94F'; for (const x0 of [4, 12]) { g.fillRect(x0, 5, 5, 1); g.fillRect(x0, 5, 1, 8); g.fillRect(x0, 12, 5, 1); g.fillRect(x0 + 4, 9, 1, 4); g.fillRect(x0 + 3, 9, 2, 1); } }), -.95, 2.35, BACK_Z + .01);
  plane(back, .34, .3, tex(17, 15, (g, w, h) => { g.fillStyle = '#D8D2C4'; g.fillRect(0, 0, w, h); g.fillStyle = '#A9543F'; g.fillRect(4, 3, 1, 7); g.fillRect(7, 3, 4, 1); g.fillRect(10, 3, 1, 7); g.fillStyle = '#9A9D9F'; g.fillRect(3, 12, 11, 1); }), -.66, 1.08, BACK_Z + .01);
  { add(back, CY(.12, .12, .03, 20), toon(C.paper), .2, 2.4, BACK_Z + .03).rotation.x = Math.PI / 2; add(back, B(.012, .08, .01), toon(C.ink), .2, 2.42, BACK_Z + .05); add(back, B(.06, .012, .01), toon(C.ink), .22, 2.4, BACK_Z + .05); }
  frame(back, 1.55, 1.7, BACK_Z + .02, .44, .54, tex(22, 27, (g, w, h) => { g.fillStyle = '#5A3F31'; g.fillRect(0, 0, w, h); g.fillStyle = '#1B1D22'; g.fillRect(6, 7, 1, 8); g.fillRect(15, 7, 1, 8); g.fillRect(7, 5, 8, 1); g.fillRect(5, 12, 3, 6); g.fillRect(14, 12, 3, 6); }), 0, C.ember);
  add(back, B(.12, .8, .02), toon(C.maroon), 1.3, 1.62, BACK_Z + .02);
  fairyLights(back, -2.5, 2.5, 2.62, BACK_Z + .06, 0, 28); fairyLights(back, -1.1, 1.1, 1.76, BACK_Z + .08, 0, 22);   // a second string draped across, in camera A's frame
  /* a low record cabinet right behind his chair: camera A looks down over his monitor, so the bottom metre of this wall is
     its whole background. a record player, a crate of records, a salt lamp glowing, a plant, a print leaning on the wall */
  { const sb = new THREE.Group(); back.add(sb); sb.position.set(-.05, 0, BACK_Z + .21); const w = toon(C.oak), dk = toon(C.bark);
    add(sb, RB(1.4, .05, .4, .01), w, 0, .62, 0); add(sb, B(1.36, .5, .36), dk, 0, .35, -.005);
    for (const x of [-.63, .63]) add(sb, B(.04, .1, .04), toon(C.ink), x, .05, .15);
    for (const x of [-.34, .34]) { add(sb, B(.62, .44, .01), w, x, .36, .18); add(sb, B(.012, .08, .012), toon(C.steel), x + (x < 0 ? .25 : -.25), .4, .19); }   // two doors, handles in
    const rp = new THREE.Group(); sb.add(rp); rp.position.set(-.38, .645, .02);
    add(rp, RB(.42, .08, .34, .015), toon(C.cream), 0, .04, 0); add(rp, CY(.14, .14, .012, 24), toon(C.ink), -.04, .085, 0);
    add(rp, CY(.045, .045, .014, 14), toon(C.brick), -.04, .088, 0); add(rp, CY(.006, .006, .2, 6), toon(C.steel), .1, .1, .02).rotation.set(Math.PI / 2, 0, .5);
    { const cr = new THREE.Group(); sb.add(cr); cr.position.set(.12, .645, .03); add(cr, B(.28, .2, .26), toon(C.wood), 0, .1, 0);
      for (let k = 0; k < 9; k++) add(cr, B(.27, .25, .006), toon(BOOKS[(k * 5 + 2) % BOOKS.length]), 0, .12 + (k % 3) * .006, -.1 + k * .025).rotation.x = -.18; }
    { add(sb, CY(.06, .05, .05, 10), toon(C.ink), .42, .67, .02); const salt = add(sb, SP(.085, 10), flat(C.shade), .42, .76, .02, false); salt.scale.set(1, 1.3, 1);
      sb.add(glowSpot(.42, .78, .1, .6, '#D99A6A', .25)); }
    leafy(sb, .6, .645, .03, .9, C.paper);
    frame(sb, -.05, .83, -.16, .3, .36, tex(15, 18, (g, W, H) => { g.fillStyle = '#3F5A4A'; g.fillRect(0, 0, W, H); g.fillStyle = '#F1D9A8'; g.beginPath(); g.arc(8, 7, 4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#5B6B4E'; g.fillRect(0, 12, W, 6); }), 0, C.paper).rotation.x = -.12; }
  const saltLamp = new THREE.PointLight(hex('#D99A6A'), .5, 1.2, 1.8); saltLamp.position.set(.37, .85, BACK_Z + .45); scene.add(saltLamp);
  /* the guitar leaning on the wall, a big floor plant, a beanbag, the floor lamp */
  { const gt = new THREE.Group(); back.add(gt); gt.position.set(1.05, .02, BACK_Z + .18); gt.rotation.z = -.12; gt.rotation.y = .2;
    add(gt, SP(.2, 14), toon(C.oak), 0, .28, 0).scale.set(1, 1.1, .35); add(gt, SP(.15, 14), toon(C.oak), 0, .56, 0).scale.set(1, 1, .35);
    add(gt, CY(.055, .055, .01, 14), flat(C.night), 0, .5, .058, false).rotation.x = Math.PI / 2; add(gt, B(.05, .62, .025), toon(C.bark), 0, 1.0, .02); add(gt, RB(.08, .14, .03, .01), toon(C.bark), 0, 1.36, .02); }
  leafy(back, 2.1, 0, BACK_Z + .35, 3.2, C.bark);
  add(room, SP(.4, 14), toon(C.olive), -1.55, .28, -1.2).scale.set(1.1, .6, 1);
  { const fl = new THREE.Group(); room.add(fl); fl.position.set(-2.2, 0, -.2); add(fl, CY(.13, .13, .03), toon(C.ink), 0, .015, 0); add(fl, CY(.015, .015, 1.6), toon(C.steel), 0, .8, 0);
    add(fl, CY(.2, .14, .22, 16), toon(C.cream), 0, 1.65, 0); add(fl, SP(.05, 8), flat(C.glow), 0, 1.6, 0, false); glowSpot(-2.2, 1.6, -.2, .9, '#F4C77E', .3); }
  /* the end of the bed at +x, with a poster above */
  { const bed = new THREE.Group(); wallR.add(bed); bed.position.set(2.0, 0, -.9);
    add(bed, RB(1.1, .3, 1.7, .05), toon(C.bark), 0, .15, 0); add(bed, RB(1.08, .16, 1.66, .06), toon(C.sheet), 0, .36, 0);
    add(bed, RB(1.1, .1, 1.1, .05), toon(C.blanket), 0, .47, .2); add(bed, RB(.5, .12, .3, .06), toon(C.white), 0, .5, -.62); add(bed, RB(.46, .1, .28, .05), toon(C.paper), 0, .6, -.6);
    plane(wallR, .5, .7, tex(10, 14, (g, w, h) => { g.fillStyle = '#2F3A52'; g.fillRect(0, 0, w, h); g.fillStyle = '#E3A94F'; g.fillRect(3, 3, 4, 4); g.fillStyle = '#8FA38A'; g.fillRect(0, 10, w, 4); }), SIDE_X - .01, 1.6, -.9).rotation.y = -Math.PI / 2; }

  /* ---------- the desk against the front wall ---------- */
  const desk = new THREE.Group(); room.add(desk);
  const dz = (DESK.z0 + DESK.z1) / 2, dw = DESK.x1 - DESK.x0, dd = DESK.z1 - DESK.z0;
  add(desk, RB(dw, .045, dd, .01), toon(C.oak), 0, DESK.top - .022, dz);
  for (const s of [-1, 1]) { add(desk, B(.05, .74, dd - .04), toon(C.wood), s * (dw / 2 - .05), .37, dz); }
  add(desk, B(.5, .5, dd - .06), toon(C.wood), .82, .47, dz); for (const y of [.62, .42]) { add(desk, B(.46, .16, .01), toon(C.cocoa), .82, y, DESK.z0 + .02); add(desk, RB(.12, .02, .02, .006), toon(C.ash), .82, y, DESK.z0 + .01); }
  add(desk, RB(1.2, .004, .36, .003), toon(C.night), -.12, DESK.top + .002, .47, false);   // the desk mat under keyboard and mouse
  /* the keyboard: full size, a row of caps you can read */
  { const kb = new THREE.Group(); desk.add(kb); kb.position.copy(ANCHOR.kb);
    add(kb, RB(.46, .026, .16, .008), toon(C.coal), 0, 0, 0);
    for (let r = 0; r < 5; r++) for (let c = 0; c < (r === 4 ? 3 : 15); c++) { const w = r === 4 ? (c === 1 ? .15 : .04) : .024, x = r === 4 ? [-.1, 0, .1][c] : -.2 + c * .0285 + (r % 2) * .006;
      add(kb, RB(w, .012, .022, .003), toon(r === 0 ? C.fog : C.ash), x, .018, .058 - r * .029, false); } }   // function row far from him, spacebar nearest
  const mouse = add(desk, RB(.07, .035, .115, .024), toon(C.ash), ANCHOR.mouse.x, ANCHOR.mouse.y, ANCHOR.mouse.z);
  add(desk, B(.004, .004, .03), toon(C.coal), ANCHOR.mouse.x, ANCHOR.mouse.y + .018, ANCHOR.mouse.z + .03, false);
  /* the red mug (the studio sheet), a notebook and pen, the phone on a stand, headphones on a stand, a succulent */
  /* things he picks up (say it, do it): each its own group, so a hand can take it and put it back */
  const props = {};
  { const mug = props.mug = new THREE.Group(); desk.add(mug); mug.position.set(.38, DESK.top, .5); mug.userData.home = mug.position.clone();
    add(mug, CY(.045, .045, .1, 16), toon(C.brick), 0, .05, 0); add(mug, new THREE.TorusGeometry(.028, .009, 6, 12), toon(C.brick), .05, .05, 0).rotation.y = Math.PI / 2;
    add(mug, CY(.04, .04, .005, 14), flat(C.cocoa), 0, .098, 0, false); }
  { const can = props.can = new THREE.Group(); desk.add(can); can.position.set(.24, DESK.top, .58); can.userData.home = can.position.clone();   // an energy drink, no brand
    add(can, CY(.033, .033, .12, 14), toon(C.moss), 0, .06, 0); add(can, CY(.0335, .0335, .03, 14), toon(C.cream), 0, .075, 0);
    add(can, B(.012, .026, .004), flat(C.amber), 0, .076, .034, false); add(can, CY(.03, .033, .008, 14), toon(C.ash), 0, .124, 0); }
  { const phone = props.phone = new THREE.Group(); desk.add(phone); phone.position.set(.3, DESK.top + .006, .38); phone.rotation.x = -Math.PI / 2; phone.userData.home = phone.position.clone(); phone.userData.homeRot = phone.rotation.clone();
    add(phone, RB(.075, .15, .01, .01), toon(C.ink), 0, 0, 0);
    const screen = tex(15, 30, (g, w, h) => { g.fillStyle = '#1B1D22'; g.fillRect(0, 0, w, h); g.fillStyle = '#9A9D9F'; g.fillRect(2, 2, 6, 1);   // a text from dad
      g.fillStyle = '#4D5E78'; g.fillRect(1, 6, 11, 7); g.fillStyle = '#D8D2C4'; for (let r = 0; r < 3; r++) g.fillRect(2, 7 + r * 2, 9 - (r % 2) * 3, 1);
      g.fillStyle = '#8FA38A'; g.fillRect(3, 16, 11, 4); g.fillStyle = '#1B1D22'; g.fillRect(4, 17, 7, 1); g.fillRect(4, 19, 5, 1); });
    plane(phone, .066, .135, screen, 0, 0, .0055, false); }
  { add(desk, RB(.2, .015, .26, .004), toon(C.paper), -.72, DESK.top + .008, .52).rotation.y = .2; for (let k = 0; k < 6; k++) add(desk, B(.15, .002, .004), toon(C.ash), -.72 + Math.sin(.2) * (k - 3) * .03, DESK.top + .016, .52 + Math.cos(.2) * (k - 3) * .03 - .02, false).rotation.y = .2;
    add(desk, CAP(.006, .14, 5), toon(C.ember), -.6, DESK.top + .02, .48).rotation.set(Math.PI / 2, 0, .5); }
  { add(mon, RB(.08, .01, .08, .003), toon(C.coal), .62, DESK.top + .005, .85); }   // the phone's charging pad; the phone is on the desk by his keyboard
  { add(mon, CY(.05, .06, .015), toon(C.coal), -.9, DESK.top + .008, .88); add(mon, CY(.008, .008, .26), toon(C.steel), -.9, DESK.top + .14, .88);
    const hp = add(mon, new THREE.TorusGeometry(.085, .014, 6, 16, Math.PI), toon(C.coal), -.9, DESK.top + .27, .88); for (const s of [-1, 1]) add(mon, RB(.035, .07, .06, .02), toon(C.slate), -.9 + s * .085, DESK.top + .23, .88); }
  succulent(desk, -1.02, DESK.top, .62, 1.1);
  /* the cat, in a loaf at the right end of the desk */
  const cat = buildCat(desk, .66, DESK.top, .45, .5);
  /* a cardboard box, out of sight until a sub drops one onto the desk (boxdrop.js); then it's hers for the stream. built
     from its bottom up, so it squashes onto the desk; open top, the flaps folded out, a strip of tape */
  { const box = props.box = new THREE.Group(); desk.add(box); box.position.set(.56, DESK.top, .68); box.rotation.y = .35; box.visible = false; box.userData.home = box.position.clone();
    const card = toon(C.oak), inside = toon(C.wood);
    add(box, B(.22, .01, .17), inside, 0, .005, 0);
    for (const s of [-1, 1]) { add(box, B(.22, .12, .008), card, 0, .06, s * .081); add(box, B(.008, .12, .17), card, s * .106, .06, 0); }
    for (const s of [-1, 1]) { add(box, B(.22, .006, .06), card, 0, .12 + .018, s * (.081 + .026)).rotation.x = s * -.75; add(box, B(.05, .006, .16), card, s * (.106 + .022), .12 + .014, 0).rotation.z = s * .75; }
    add(box, B(.06, .121, .0085), toon(C.paper), 0, .06, .082, false); }
  /* the pc on the desk's left, fan glowing through the glass side */
  { add(desk, RB(.22, .48, .44, .012), toon(C.coal), 1.0, DESK.top + .24, .72); add(desk, new THREE.CircleGeometry(.08, 14), flat(C.ember), .889, DESK.top + .3, .72, false).rotation.y = -Math.PI / 2;
    for (let k = 0; k < 5; k++) add(desk, B(.004, .012, .3), toon(C.fog), .889, DESK.top + .43 - k * .025, .72, false); glowSpot(.85, DESK.top + .3, .72, .5, '#B97A2E', .32); }
  /* the lamp: base on the desk's right, arm arching over the keyboard, the orange shade */
  { const lp = new THREE.Group(); desk.add(lp); lp.position.set(.98, DESK.top, .9);
    add(lp, CY(.075, .085, .025, 16), toon(C.ink), 0, .012, 0); add(lp, CAP(.011, .34, 6), toon(C.steel), -.04, .2, 0).rotation.z = .25;
    add(lp, CAP(.01, .3, 6), toon(C.steel), -.2, .42, -.03).rotation.z = 1.15; const sh = add(lp, CY(.04, .1, .12, 16), toon(C.shade), -.36, .38, -.06); sh.rotation.z = .85;
    add(lp, SP(.03, 8), flat(C.glow), -.38, .33, -.06, false); }
  /* his monitor, facing him, a little low so camera A sees him over its back; its glow spills round the edges */
  { const m = new THREE.Group(); screen6.add(m); m.position.set(0, 1.08, .84); m.rotation.y = Math.PI; props.monitorRig = m;   // the meeting fork: a visitor can knock it over
    add(m, RB(.74, .44, .035, .012), toon(C.coal), 0, 0, 0);
    const drawCode = (g, w, h) => { g.fillStyle = '#1B1D22'; g.fillRect(0, 0, w, h); g.fillStyle = '#272A31'; g.fillRect(0, 0, 14, h);
      for (let k = 0; k < 13; k++) { const ind = (k * 13) % 3 * 3; g.fillStyle = k % 4 === 0 ? '#E3A94F' : k % 3 ? '#8FA38A' : '#9A9D9F'; g.fillRect(17 + ind, 3 + k * 3, 8 + (k * 11) % 34, 1); }
      for (let k = 0; k < 8; k++) { g.fillStyle = '#6B707A'; g.fillRect(2, 3 + k * 5, 9, 1); } g.fillStyle = '#E3A94F'; g.fillRect(17, 42, 1, 2); };
    /* the screen is a canvas the stage draws into: the code by default, or what he's making (the whiteboard, the sprite,
       the level, the game) so camera C over his shoulder sees it */
    monitor = tex(148, 88, g => { g.scale(2, 2); drawCode(g, 74, 44); });
    monitor.userData.code = () => { const g = monitor.image.getContext('2d'); g.save(); g.setTransform(2, 0, 0, 2, 0, 0); drawCode(g, 74, 44); g.restore(); monitor.needsUpdate = true; };
    plane(m, .7, .4, monitor, 0, .006, .019, false);
    add(m, RB(.12, .12, .05, .01), toon(C.coal), 0, 0, -.04); add(m, B(.06, .2, .04), toon(C.coal), 0, -.25, -.05); add(m, RB(.28, .015, .18, .006), toon(C.coal), 0, -.32, -.05);
    /* its back, which camera A looks over: a vent strip, two stickers, the cable down to the desk */
    for (let k = 0; k < 6; k++) add(m, B(.3, .006, .004), toon(C.slate), 0, .15 - k * .012, -.02);
    add(m, CY(.035, .035, .003, 14), toon(C.amber), -.22, .09, -.019).rotation.x = Math.PI / 2; add(m, B(.07, .05, .003), toon(C.cream), .24, -.08, -.019);
    add(m, CY(.006, .006, .3, 6), toon(C.ink), .03, -.2, -.07);
    for (const [x, c] of [[-.3, C.cream], [.28, C.amber], [.33, C.rose]]) add(m, B(.04, .04, .002), toon(c), x, -.17, .02, false);   // sticky notes on the bezel
    screen6.add(glowSpot(0, 1.08, .74, 1.25, '#8FB2CF', .16)); }
  /* the webcam: a stand clamped behind the desk to the monitor's right, a short arm over the monitor, the camera looking down
     at him (camera A; A doesn't see it). off to the side so camera B's view of the monitor isn't cut in half by the pole */
  { add(mon, RB(.07, .03, .06, .008), toon(C.coal), .5, DESK.top + .015, 1.0); add(mon, CY(.011, .011, .76, 8), toon(C.steel), .5, DESK.top + .38, 1.0);
    add(mon, CY(.009, .009, .38, 8), toon(C.steel), .31, 1.52, 1.0).rotation.z = Math.PI / 2;
    const cam = add(mon, RB(.1, .055, .055, .014), toon(C.ink), .12, 1.52, .99); cam.rotation.x = -.45;
    add(mon, CY(.018, .018, .01, 12), toon(C.slate), .12, 1.51, .96).rotation.x = Math.PI / 2 - .45; add(mon, SP(.006, 6), flat(C.brick), .155, 1.535, .965, false); }
  for (const s of [-1, 1]) { add(mon, RB(.13, .22, .15, .012), toon(C.oak), s * .5, DESK.top + .11, .88); add(mon, CY(.04, .04, .01, 14), toon(C.coal), s * .5, DESK.top + .13, .805).rotation.x = Math.PI / 2; add(mon, CY(.018, .018, .01, 10), toon(C.coal), s * .5, DESK.top + .06, .805).rotation.x = Math.PI / 2; }

  /* ---------- the front wall, above the desk: two shelves, full, pothos trailing; a window with blinds; fairy lights ---------- */
  { const sh = new THREE.Group(); front.add(sh); sh.position.set(0, 0, FRONT_Z - .13); sh.rotation.y = Math.PI;
    for (const y of [1.62, 2.0]) { add(sh, B(1.5, .035, .24), toon(C.oak), 0, y, 0); for (const s of [-1, 1]) add(sh, B(.02, .06, .18), toon(C.steel), s * .6, y - .045, .02); }
    bookRow(sh, -.72, -.15, 1.64, 0, 4); pothos(sh, .05, 1.64, 0, .55, 1); add(sh, RB(.1, .14, .1, .02), toon(C.denim), .25, 1.71, 0); add(sh, SP(.04, 10), toon(C.amber), .42, 1.68, 0);
    frame(sh, .6, 1.74, .0, .18, .22, tex(9, 11, g => { g.fillStyle = '#8FA38A'; g.fillRect(0, 0, 9, 11); g.fillStyle = '#E3A94F'; g.fillRect(3, 3, 3, 3); }), 0, C.coal);
    leafy(sh, -.6, 2.02, 0, .8, C.sage); bookRow(sh, -.4, .25, 2.02, 0, 8); pothos(sh, .5, 2.02, 0, .7, 3); add(sh, CY(.05, .05, .09, 12), toon(C.cream), .32, 2.065, 0); }
  blindsWindow(front, -1.55, 1.8, FRONT_Z - .01, .9, 1.0, Math.PI);
  fairyLights(front, -2.5, 2.5, 2.62, FRONT_Z - .06, Math.PI, 28);
  /* the pendant light over him */
  const hang = group(7);
  { add(hang, CY(.006, .006, .5), toon(C.ink), -.1, CEIL - .25, .1); add(hang, CY(.06, .2, .16, 16), toon(C.coal), -.1, CEIL - .55, .1); add(hang, SP(.05, 8), flat(C.glow), -.1, CEIL - .6, .1, false); }

  /* ---------- light: warm and low. the lamp on his hands, the screen's cool wash on his face, the pendant, the rest ---------- */
  scene.add(new THREE.AmbientLight(hex('#3A2C22'), 1.6));
  scene.add(new THREE.HemisphereLight(hex('#50443C'), hex('#1E1612'), 1.1));
  const lamp = new THREE.SpotLight(hex('#FFC27A'), 14, 2.2, .5, .8, 1.4); lamp.position.set(.62, DESK.top + .38, .84); lamp.target.position.set(-.05, DESK.top, .45);
  lamp.castShadow = true; lamp.shadow.mapSize.set(512, 512); lamp.shadow.bias = -.002; scene.add(lamp, lamp.target);
  const screen = new THREE.PointLight(hex('#8FB2CF'), 3.2, 2.0, 1.4); screen.position.set(0, 1.1, .66); scene.add(screen);
  const pendant = new THREE.PointLight(hex('#F4C77E'), 2.4, 3.2, 1.3); pendant.position.set(-.1, CEIL - .7, .1); scene.add(pendant);
  const rim = new THREE.PointLight(hex('#E3A94F'), 1.6, 2.6, 1.5); rim.position.set(.9, 1.9, -1.0); scene.add(rim);
  const floorLamp = new THREE.PointLight(hex('#F4C77E'), 1.2, 2.2, 1.5); floorLamp.position.set(-2.2, 1.55, -.2); scene.add(floorLamp);
  glowSpot(.45, DESK.top + .22, .66, 1.0, '#E39A4F', .2);   // the lamp's pool, warm in the air
  hang.add(glowSpot(-.1, CEIL - .7, .1, 1.1, '#F4C77E', .18));

  /* the layers: a wall in the way hides for that camera only */
  for (const g of [front, back, wallL, wallR, mon, screen6, hang]) onLayer(g, g.userData.layer);
  for (const s of glows) { let p = s.parent; while (p && p.userData.layer === undefined) p = p.parent; if (p) s.layers.set(p.userData.layer); }
  return { mouse, props, cat, monitor, lights: { lamp, screen, pendant, rim } };
}
