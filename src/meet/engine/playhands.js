/* his hands at play (showcase spec, section 2): right hand over the arrow keys, left thumb on the space bar. a game
   that says its keys (src/stream.js 'input') has him press exactly those; one that doesn't still gets him playing, in
   a loose rhythm. playHands(input | null, t) -> { R: { press, dx }, L: { press } }: press is how far a finger is down,
   dx how far the right hand has slid (+x is his left: the left arrow) */
const rnd = k => { const x = Math.sin(k * 12.9898) * 43758.5453; return x - Math.floor(x); };
export function playHands(input, t) {
  if (input) {
    const lr = input.left && !input.right ? .025 : input.right && !input.left ? -.025 : 0;
    return { R: { press: input.left || input.right || input.down ? 1 : 0, dx: lr }, L: { press: input.jump || input.up ? 1 : 0 } };
  }
  /* no keys from the game: he holds a direction for a while, then the other, and jumps now and then */
  const beat = Math.floor(t / .9), dir = rnd(beat) < .5 ? 1 : -1, held = (t % .9) < .9 * (.35 + .5 * rnd(beat + 7));
  const hop = Math.floor(t / 1.3), jumpAt = rnd(hop + 3) * .9, jumping = rnd(hop + 11) < .75 && (t % 1.3) >= jumpAt && (t % 1.3) < jumpAt + .25;
  return { R: { press: held ? 1 : 0, dx: held ? .025 * dir : 0 }, L: { press: jumping ? 1 : 0 } };
}
