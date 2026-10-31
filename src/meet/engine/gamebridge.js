/* the game and the stage (showcase spec, section 1): the game in the preview frame posts what happens in it (src/stream.js,
   written by the maker with the first step where the game runs). events go to the show for the writer and the abilities,
   its keys to his hands, its state to the show twice a second (the level lists too: he has to see it). anything that isn't the game's is ignored, and what it
   sends is kept small */
const NAME = /^[a-z0-9_-]{1,30}$/;
function small(v, depth = 0) {
  if (v == null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
  if (typeof v === 'string') return v.slice(0, 80);
  if (Array.isArray(v)) {   // the level's lists (platforms, enemies, items: [[x, y, w, h], ...]) and points ([x, y]): short, numbers only
    if (depth >= 3) return undefined;
    const a = v.slice(0, 60).map(x => typeof x === 'number' ? small(x) : Array.isArray(x) ? small(x, depth + 1) : x && typeof x === 'object' ? small(x, depth + 1) : undefined).filter(x => x !== undefined);   // lists of things ({ kind, x, y, w, h }) too
    return a;
  }
  if (depth >= 3 || typeof v !== 'object') return undefined;
  const o = {}; let n = 0;
  for (const k of Object.keys(v)) { if (n++ >= 12 || k === '__proto__' || k === 'constructor' || k === 'prototype') continue; const s = small(v[k], depth + 1); if (s !== undefined) o[k.slice(0, 30)] = s; }
  return Object.keys(o).length ? o : undefined;
}
const NONE = () => ({ left: false, right: false, up: false, down: false, jump: false });

export function createGameBridge({ post, now = () => performance.now(), stateEveryMs = 500 }) {   // twice a second: he notices a fall as it happens
  let input = NONE(), ready = false, lastState = -Infinity;
  return {
    receive(m) {
      if (!m || typeof m !== 'object' || m.src !== 'game') return null;
      if (m.type === 'ready') { ready = true; post('/stage/game', { type: 'ready' }); }
      else if (m.type === 'event') {
        const name = String(m.name || '').toLowerCase();
        if (!NAME.test(name)) return null;
        post('/stage/game', { type: 'event', name, data: small(m.data) || {} });
      }
      else if (m.type === 'input') input = { left: !!m.left, right: !!m.right, up: !!m.up, down: !!m.down, jump: !!m.jump };
      else if (m.type === 'state') {
        if (now() - lastState < stateEveryMs) return 'state';
        lastState = now();
        const { src, type, ...rest } = m;
        post('/stage/game', { type: 'state', state: small(rest) || {} });
      }
      else return null;
      return m.type;
    },
    get input() { return input; },
    get ready() { return ready; },
    reset() { input = NONE(); ready = false; lastState = -Infinity; },
  };
}
