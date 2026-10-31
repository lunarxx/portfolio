/* a box dropped onto the desk from above (a sub): it falls, lands with a squash (a moment flat on the desk), bounces a
   couple of times smaller each time, rocks and settles flat. at(s) -> { y (above where it rests), squash (1 is its own
   shape, less is flatter), tilt (radians, the rocking), done }. pure: the stage moves the prop */
const G = 9.8, TOUCH = .05;
export function boxDrop({ height = 1.4, bounce = .28, rand = Math.random } = {}) {
  /* the timeline: the fall, then per landing a touch on the desk and (if it has the speed) a hop */
  const fall = Math.sqrt(2 * height / G), hits = [];   // { t: lands, v: speed it lands at, up: speed it leaves at, hop: seconds in the air }
  let t = fall, v = G * fall;
  for (let k = 0; k < 4; k++) {
    const up = v * bounce, hop = up > .3 && k < 3 ? 2 * up / G : 0;
    hits.push({ t, v, up, hop });
    if (!hop) break;
    t += TOUCH + hop; v = up;
  }
  const last = hits[hits.length - 1], dur = last.t + TOUCH + .45, side = rand() < .5 ? -1 : 1;
  return {
    dur,
    at(s) {
      if (s >= dur) return { y: 0, squash: 1, tilt: 0, done: true };
      let y = 0;
      if (s < fall) y = height - G * s * s / 2;
      else for (const h of hits) { const e = s - h.t - TOUCH; if (h.hop && e >= 0 && e < h.hop) y = h.up * e - G * e * e / 2; }
      let squash = 1;
      for (const h of hits) if (s >= h.t) squash = Math.min(squash, 1 - Math.min(.22, h.v * .04) * Math.exp(-(s - h.t) / .06));
      const since = s - fall, tilt = since > 0 ? side * .12 * Math.exp(-since * 3.2) * Math.sin(since * 22) * Math.min(1, (dur - s) / .15) : 0;
      return { y: Math.max(0, y), squash, tilt, done: false };
    },
  };
}
