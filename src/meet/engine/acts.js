/* acts: when a line says he does something, he does it (his note, 2026-09-28: "hes not gonna go back to coding and
   actually get up take a can ... and chug"). each act is a timeline over u (0 to 1 of its seconds): where the working
   hand goes key to key (home, the prop where it lies, his mouth, up to the camera, the cat, over his head), when the
   prop is in his hand, how far a drink tips, how far his head goes back. perform.js turns the places into positions.
   the seconds match src/motion/acts.json, which is what the writer is told */
const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
const ramp = (u, a, b, c, d) => u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u <= c ? 1 : smooth((d - u) / (d - c));
const DRINK = [[0, 'home'], [.14, 'grab'], [.2, 'grab'], [.34, 'mouth'], [.8, 'mouth'], [.9, 'grab'], [.95, 'grab'], [1, 'home']];

export const ACTS = {
  chug: { dur: 4.5, hand: 'L', prop: 'can', keys: DRINK, hold: [.17, .925], tilt: .95, head: -.45, lean: -.08, drink: [.34, .42, .74, .8] },
  sip: { dur: 3.5, hand: 'L', prop: 'mug', keys: DRINK, hold: [.17, .925], tilt: .75, head: -.14, drink: [.34, .44, .7, .8] },
  show_phone: { dur: 5, hand: 'L', prop: 'phone', keys: [[0, 'home'], [.12, 'grab'], [.18, 'grab'], [.32, 'show'], [.84, 'show'], [.92, 'grab'], [.96, 'grab'], [1, 'home']],
    hold: [.15, .94], head: .1, drink: [.3, .36, .5, .58] },   // he glances down at it, then back to the camera
  pet_cat: { dur: 4, hand: 'L', keys: [[0, 'home'], [.2, 'cat'], [.82, 'cat'], [1, 'home']], pet: [.2, .82], lean: .1 },
  stretch: { dur: 3, hand: 'both', keys: [[0, 'home'], [.3, 'up'], [.72, 'up'], [1, 'home']], lean: -.12, head: -.15, drink: [.2, .35, .7, .9] },
  /* a chair dance (his note, stream 5: "no dances so bad"): both arms up in front of him swaying on the beat, the head bobbing, the torso going with it */
  dance: { dur: 6, hand: 'both', keys: [[0, 'home'], [.12, 'dance'], [.88, 'dance'], [1, 'home']], groove: [.08, .18, .82, .92], bps: 1.9, face: 'happy' },
};

/* the act at u: { from, to, k } is where the hand is between two places (k eased), hold if the prop is in his hand,
   tilt (radians the drink tips toward him), head (pitch added, negative is back), lean, petting and stroke (0 to 1
   along her back) */
export function actAt(name, u) {
  const a = ACTS[name]; u = Math.max(0, Math.min(1, u));
  let i = 0; while (i < a.keys.length - 2 && u >= a.keys[i + 1][0]) i++;
  const [u0, from] = a.keys[i], [u1, to] = a.keys[i + 1];
  const k = u >= 1 ? 0 : smooth((u - u0) / Math.max(1e-6, u1 - u0));
  const env = a.drink ? ramp(u, ...a.drink) : 0;
  const hold = !!a.hold && u >= a.hold[0] && u < a.hold[1];
  const petting = !!a.pet && u >= a.pet[0] + .02 && u <= a.pet[1];
  const groove = a.groove ? ramp(u, ...a.groove) : 0, beat = u * a.dur * (a.bps || 2);   // beats since it started
  return { groove, beat, sway: groove * .14 * Math.sin(beat * Math.PI), bob: groove * .1 * Math.abs(Math.sin(beat * Math.PI)),
    from: u >= 1 ? a.keys[a.keys.length - 1][1] : from, to, k, hold, tilt: env ? (a.tilt || 0) * env : 0, head: env ? (a.head || 0) * env : 0,
    lean: (a.lean || 0) * ramp(u, .05, .25, .75, .95), petting, stroke: petting ? (1 - Math.cos((u - a.pet[0]) / (a.pet[1] - a.pet[0]) * Math.PI * 6)) / 2 : 0 };
}
