/* the cat, alive. she dozes in a loaf most of the time: she breathes, an ear flicks now and then (sometimes twice), the
   tail tip twitches. she wakes on her own, or when he gets loud (ears first, and only sometimes), lifts her head and
   looks: at him mostly, at the camera, around the room, with slow blinks and a slow tail swish, and settles again a
   little turned. now and then she gets up for a long stretch before she looks. petted, she pushes her head up into his
   hand with her eyes shut and her tail up, and stays awake a while after. nothing runs on a clock: every next thing is
   drawn from the random she is given.
   she also walks (his note: "make that cat alive as in walkable"): walk(plan, t) hands her a route (catwalk.js) and she
   gets up on her legs, head and tail up, feet going, follows it, and after it looks round a while before she dozes.
   createCat({ rand }).update(t, { him, cam, loud, petting }) -> pose; him and cam are the yaws (radians, her own frame)
   of his head and of the camera; a walking pose also carries at { x, y, z, heading }, stand and gait. applyCat(rig, pose)
   puts a pose on the rig room.js builds */
export function createCat({ rand = Math.random } = {}) {
  const r = (a, b) => a + (b - a) * rand();
  const cur = { lift: 0, yaw: 0, pitch: -.3, roll: 0, eyes: .05, tail: 0, swish: -1.2, curl: -.6, wave: 0, hook: 0, turn: 0 };
  const RATE = { lift: 4, yaw: 5, pitch: 4, roll: 3, eyes: 12, tail: 3, swish: 3, curl: 3, wave: 3, hook: 8, turn: 1.5 };
  let mode = 'doze', since = 0, until = r(25, 50), last = null, next = null, route = null;
  let earAt = r(2, 6), ear = { side: 1, t0: -9, amp: 0 }, earAgain = null, alertUntil = -1, quietUntil = -1;
  let tailAt = r(4, 12), tailT0 = -9, blinkAt = 0, blinkUntil = 0, gaze = 'him', gazeUntil = 0, roomYaw = 0, tilt = 0, turnTo = 0, breathP = r(2.8, 3.6);

  function go(m, t) {
    mode = m; since = t;
    if (m === 'doze') { until = t + r(20, 60); turnTo = r(-.18, .18); breathP = r(2.8, 3.6); }
    else if (m === 'stretch') { until = t + r(2.8, 3.6); next = 'look'; }
    else if (m === 'look') { until = t + r(6, 14); blinkAt = t + r(1, 3); gazeUntil = 0; }
    else if (m === 'walk') until = Infinity;
  }
  function flick(t) {
    ear = { side: rand() < .5 ? -1 : 1, t0: t, amp: r(.45, .7) };
    earAgain = rand() < .3 ? t + r(.3, .45) : null;
    earAt = t + r(3, 11);
  }
  return {
    wake(t) { if (mode !== 'walk') go('look', t); },   // out on a route she's awake already, and a wake mid-chase sent her home
    walk(plan, t) { route = { plan, t0: t }; go('walk', t); },
    get walking() { return mode === 'walk'; },
    get turn() { return cur.turn; },
    get mode() { return mode; },
    update(t, ctx = {}) {
      const dt = last === null ? 0 : Math.min(.1, Math.max(0, t - last)); last = t;
      let at = null, stand = 0, gait = 0, perched = false, dip = null, napping = false, carried = false;
      if (mode === 'walk') { const w = route.plan.at(t - route.t0); if (w.done) { route = null; go('look', t); } else { at = { x: w.x, y: w.y, z: w.z, heading: w.heading }; stand = w.stand; gait = w.gait; perched = !!w.perched; napping = !!w.nap; carried = !!w.carried; dip = Number.isFinite(w.pitch) ? w.pitch : null; } }
      if (ctx.petting && mode !== 'pet' && mode !== 'walk') go('pet', t);
      else if (!ctx.petting && mode === 'pet') { go('look', t); gaze = 'him'; gazeUntil = t + r(2, 4); until = t + r(4, 8); }
      if (ctx.loud && t > quietUntil && mode !== 'pet' && mode !== 'walk') {
        quietUntil = t + 20; alertUntil = t + r(.8, 1.4);
        if (mode === 'doze' && rand() < .5) go('look', t + .4);
      }
      if (mode !== 'pet' && mode !== 'walk' && t >= until) {
        if (mode === 'doze') go(rand() < .35 ? 'stretch' : 'look', t);
        else if (mode === 'stretch') go(next || 'look', t);
        else go('doze', t);
      }
      if (t >= earAt && mode !== 'pet') flick(t);
      if (earAgain !== null && t >= earAgain) { ear = { ...ear, t0: t }; earAgain = null; }

      const tg = { lift: 0, yaw: 0, pitch: -.3, roll: 0, eyes: .05, tail: 0, swish: -1.2, curl: -.6, wave: 0, hook: 0, turn: turnTo };
      let stretch = 0, breathe = 1 + .025 * Math.sin(2 * Math.PI * t / breathP);
      if (mode === 'walk' && napping) {   // asleep where she lay (his keyboard): head down, eyes shut, curled, breathing slow
        tg.lift = 0; tg.pitch = -.3; tg.eyes = .05; tg.tail = 0; tg.swish = -1.2; tg.curl = -.6; breathe = 1 + .03 * Math.sin(2 * Math.PI * t / 3.6);
      } else if (mode === 'walk' && carried) {   // lifted off it: legs hanging, head up, eyes open, tail hanging down, not amused
        tg.lift = 1; tg.pitch = .1; tg.eyes = .6; tg.tail = -.4; tg.swish = -.2; tg.curl = .2; tg.wave = .05;
      } else if (mode === 'walk' && perched) {   // up on him in her loaf, awake: looks about the room, at the camera, down at him
        if (t >= gazeUntil) { const k = rand(); gaze = k < .45 ? 'room' : k < .75 ? 'cam' : 'down'; roomYaw = r(-.9, .9); tilt = rand() < .3 ? r(-.25, .25) : 0; gazeUntil = t + r(1.5, 4); }
        tg.lift = 1; tg.pitch = gaze === 'down' ? -.25 : .05; tg.roll = tilt; tg.eyes = 1; tg.tail = .15; tg.curl = -.35; tg.wave = .16; tg.swish = -1 + .2 * Math.sin(t * .7);
        tg.yaw = gaze === 'cam' ? (ctx.cam ?? 0) : gaze === 'down' ? roomYaw * .3 : roomYaw;
        if (t >= blinkAt) { blinkUntil = t + r(.35, .7); blinkAt = blinkUntil + r(2.5, 6); }
        if (t < blinkUntil) tg.eyes = .05;
      } else if (mode === 'walk') {   // up and going: looking where she goes, eyes open, tail up with a hook at the tip
        tg.lift = 1; tg.pitch = dip ?? .05 + .06 * stand; tg.eyes = 1; tg.tail = .85; tg.swish = -.15 + .12 * Math.sin(t * 1.6); tg.curl = .1; tg.wave = .08; tg.hook = .55;
        if (t >= blinkAt) { blinkUntil = t + .25; blinkAt = t + r(3, 6); }
        if (t < blinkUntil) tg.eyes = .05;
      } else if (mode === 'look' && t >= since) {
        if (t >= gazeUntil) {
          const k = rand(); gaze = k < .6 ? 'him' : k < .8 ? 'cam' : 'room';
          roomYaw = r(-.9, .9); tilt = rand() < .3 ? r(-.25, .25) : 0; gazeUntil = t + r(1.5, 4);
        }
        tg.lift = 1; tg.pitch = gaze === 'him' ? .25 : .08; tg.roll = tilt; tg.eyes = 1; tg.tail = .15; tg.curl = -.35; tg.wave = .16;
        tg.yaw = gaze === 'him' ? (ctx.him ?? .5) : gaze === 'cam' ? (ctx.cam ?? 0) : roomYaw;
        tg.swish = -1 + .2 * Math.sin(t * .7);
        if (t >= blinkAt) { blinkUntil = t + r(.35, .7); blinkAt = blinkUntil + r(2.5, 6); }
        if (t < blinkUntil) tg.eyes = .05;
      } else if (mode === 'stretch') {
        const u = Math.min(1, (t - since) / Math.max(.1, until - since));
        stretch = Math.sin(Math.PI * u) ** .7;
        tg.lift = .8; tg.pitch = .2 + .3 * stretch; tg.eyes = .05; tg.tail = .5 + .4 * stretch; tg.swish = -.3; tg.curl = 0; tg.wave = .05; tg.hook = .7;
      } else if (mode === 'pet') {
        tg.lift = 1; tg.pitch = .4; tg.roll = .18 * Math.sin(t * 1.3); tg.eyes = .05; tg.tail = .85; tg.swish = -.3 + .15 * Math.sin(t * .9); tg.curl = -.05; tg.wave = .12; tg.hook = .6;
        tg.yaw = (ctx.him ?? .5) * .5; breathe = 1 + .02 * Math.sin(2 * Math.PI * t / 1.4);
      } else if (mode === 'doze') {
        if (t >= tailAt) { tailT0 = t; tailAt = t + r(5, 16); }   // the tail tip, once in a while
        if (t - tailT0 < .3) tg.hook = -.5;
      }
      for (const k of Object.keys(RATE)) cur[k] += (tg[k] - cur[k]) * (1 - Math.exp(-RATE[k] * dt));
      if (dt === 0) Object.assign(cur, tg);
      const e = t - ear.t0, f = e >= 0 && e < .22 ? ear.amp * Math.sin(Math.PI * e / .22) : 0;
      const alert = t < alertUntil ? .35 : 0;
      return { mode, phase: t, breathe, stretch, stand, gait, at, perched, ...cur, earL: (ear.side < 0 ? f : 0) + alert, earR: (ear.side > 0 ? f : 0) + alert };
    },
  };
}

/* the rig from room.js: root (turn), body (breathe, stretch), head (lift, yaw, pitch, roll), ears (flicks), eyes
   (amber open, or a shut line), tail (lift and swish at the root, curl and a travelling wave down the segments, a hook at the tip) */
const UP = .045, HIPS = [[.08, .05], [.08, -.05], [-.08, .05], [-.08, -.05]], PAIR = [0, 1, 1, 0];   // front left, front right, back left, back right
export function applyCat(c, p) {
  const stand = p.stand || 0, a = p.at;
  if (a) { c.root.position.set(a.x, c.home.y + (a.y || 0), a.z); c.root.rotation.y = a.heading; }
  else { if (c.home) c.root.position.set(c.home.x, c.home.y, c.home.z); c.root.rotation.y = c.baseTurn + p.turn; }
  c.body.scale.set(1.5 * (1 + .22 * p.stretch), .7 * p.breathe * (1 - .22 * p.stretch), .9 * (1 + (p.breathe - 1) * .6));   // standing, the same body as sitting (his note)
  c.body.position.set(.02 * p.stretch, .06 + UP * stand, 0); c.body.rotation.z = -.14 * p.stretch;
  c.head.position.set(.1 + .045 * p.stretch + .02 * stand, .058 + .042 * p.lift - .03 * p.stretch + UP * stand, .02);
  /* the legs hang from the hips to the desk (a leg is .1 long at scale 1); walking they swing in diagonal pairs and the
     one swinging forward lifts its paw */
  if (c.legs) c.legs.forEach((l, i) => {
    const hip = .02 + UP * stand, ph = 2 * Math.PI * (p.gait || 0) + (PAIR[i] ? Math.PI : 0), sw = a ? .5 * Math.sin(ph) : 0;
    l.visible = stand > .05; l.position.set(HIPS[i][0], hip, HIPS[i][1]); l.rotation.set(0, 0, sw);
    l.scale.set(1, hip / .1 * (1 - (a ? .18 * Math.max(0, Math.cos(ph)) : 0)) / Math.max(.3, Math.cos(sw)), 1);
  });
  c.tail.position.y = .025 + UP * stand;
  c.head.rotation.set(p.roll, p.yaw, p.pitch, 'YZX');
  c.ears.forEach((e, i) => { const s = i ? 1 : -1; e.rotation.set(s * (.12 + (i ? p.earR : p.earL)), 0, 0); });
  const open = p.eyes > .2;
  for (const e of c.eyes) { e.open.visible = open; e.open.scale.y = Math.min(1, p.eyes); e.shut.visible = !open; }
  c.tail.rotation.set(0, p.swish, -1.1 * p.tail, 'YZX');
  c.segs.forEach((g, k) => g.rotation.set(0, (k ? p.curl : 0) + p.wave * (k / 4 + .25) * Math.sin((p.phase || 0) * 1.2 - k * .7), k >= 3 ? p.hook : 0, 'YZX'));
}
