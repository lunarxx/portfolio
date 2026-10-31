/* falls (his note: "people like seeing streamers fail a lot like when speed burned his own house ... we need octyn to
   fail too"): him going down on the floor and getting back up. how he goes down:
     trip   his foot catches, a lurch forward with his arms out, down on his backside
     spin   a spin too many: round, a wobble, down
     back   from the bottom of a squat, rocking back and sitting down hard
   then he sits there a moment (a shake of the head), and gets up. poses are a routine's own fields (dx/dz off his spot,
   facing the room's front; floor: how far he's down on the floor, sitting). impact: when he lands (the thud). pure */
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const seg = (u, a, b) => Math.min(1, Math.max(0, (u - a) / (b - a)));
const easeIn = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u;

export function fall({ lead = 'trip', sit = 1.6, rand = Math.random } = {}) {
  const side = rand() < .5 ? 1 : -1;
  const LEAD = { trip: .55, spin: 2.0, back: .35 }[lead] ?? .55, DROP = .3, UP = 1.3, SETTLE = .4;
  const impact = LEAD + DROP, dur = impact + sit + UP + SETTLE;
  const lurch = lead === 'trip' ? .08 : 0;
  function at(e) {
    const base = { stand: 1, arm: null, armK: 0 };
    if (e < LEAD) {
      const u = e / LEAD;
      if (lead === 'trip') return { ...base, dz: lurch * ease(u), lean: .4 * ease(u), feet: { L: [0, 0, 0], R: [-.06, .09 * Math.sin(Math.PI * u), .12 * u] }, arm: { L: [.36, .28, .12], R: [.4, .08, .22] }, armK: ease(seg(u, 0, .5)), shape: 'open' };
      if (lead === 'back') return { ...base, crouch: .85, lean: .25 - .45 * ease(u), arm: { L: [.2, .05, .4], R: [.2, .05, .4] }, armK: ease(u), shape: 'open', nod: -.1 * u };
      const spin = seg(e, 0, 1.3), wob = seg(e, 1.3, LEAD);   // spin
      return { ...base, turn: 2 * Math.PI * (1 - Math.pow(1 - spin, 2)), sway: side * .9 * Math.sin(Math.PI * 3 * wob) * (1 - .3 * wob), lean: .2 * Math.sin(Math.PI * 2 * wob), look: side * .3 * Math.sin(Math.PI * 4 * wob), arm: { L: [.24, .44, .08], R: [.24, .44, .08] }, armK: 1 - .6 * wob, shape: 'open', dizzy: wob };
    }
    const turnEnd = lead === 'spin' ? 2 * Math.PI : 0;
    if (e < impact) {   // down: faster and faster, arms back to catch himself
      const u = easeIn((e - LEAD) / DROP);
      return { ...base, turn: turnEnd, dz: lurch, floor: u, crouch: lead === 'back' ? .85 * (1 - u) : .4 * Math.sin(Math.PI * u), lean: (lead === 'trip' ? .4 : -.2) * (1 - u) - .3 * u, armK: 0 };
    }
    if (e < impact + sit) {   // sat on the floor: a shake of the head
      const v = (e - impact) / sit, shake = Math.max(0, 1 - v * 1.4);
      return { ...base, turn: turnEnd, dz: lurch, floor: 1, lean: -.3 + .12 * ease(seg(v, .5, 1)), look: .28 * Math.sin(Math.PI * 2 * 1.6 * (e - impact)) * shake, nod: -.08 + .06 * Math.sin(Math.PI * v), dizzy: lead === 'spin' ? 1 - v : 0 };
    }
    if (e < impact + sit + UP) {   // up again: over his knees, a push off the floor, standing
      const u = (e - impact - sit) / UP;
      return { ...base, turn: turnEnd, dz: lurch * (1 - ease(u)), floor: 1 - ease(seg(u, .1, .75)), crouch: .7 * Math.sin(Math.PI * seg(u, .1, 1)), lean: .45 * Math.sin(Math.PI * seg(u, 0, .9)) };
    }
    const u = (e - impact - sit - UP) / SETTLE;
    return { ...base, turn: turnEnd, lean: .06 * Math.sin(Math.PI * u) };
  }
  return { dur, impact, at };
}
