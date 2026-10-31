/* when the cat does something (his note on the keyboard walk: "ofc dont make it repetitive then it would seem like an
   act"): each scene (keys: over his keyboard; perch: up on his head or shoulder) comes first a few minutes in and then
   every gap[0] to gap[1] seconds, drawn fresh each time, only when the stage says it can happen now; and no two scenes
   come within apart seconds of each other. due(t, can) -> the scene to do now or null (can: { scene: true } for the ones
   that fit what he's doing); did(scene, t) books its next.
   catHands(at): how far his hands are off the keys (0 on, 1 off) for where she is on the desk: up as she comes over,
   down once she's past */
export function createCatLife({ rand = Math.random, scenes = { keys: { first: 360, gap: [900, 2100] } }, apart = 300 } = {}) {
  const next = {}; for (const [k, v] of Object.entries(scenes)) next[k] = v.first * (.75 + .5 * rand());
  let quietUntil = 0;
  return {
    due(t, can = {}) { if (t < quietUntil) return null; for (const k of Object.keys(next)) if (can[k] && t >= next[k]) return k; return null; },
    did(k, t) { const g = scenes[k].gap; next[k] = t + g[0] + (g[1] - g[0]) * rand(); quietUntil = t + apart; },
    next: k => next[k],
  };
}
const ss = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
export const catHands = (at, near = .42) => at ? ss((near - at.x) / .1) : 0;
