/* his hands on any game (his note: "what if he makes his own better minecraft and tries playing it? there can be 100
   things"): a plan from the playtester is a sequence of steps, each one of
     { keys: [codes], ms }   hold these (KeyboardEvent codes: KeyW, Space, ShiftLeft, Digit1 ...) for ms
     { tap: [codes] }        press and let go
     { mouse: { action: 'click' | 'right' | 'move' | 'down' | 'up', x, y } }   in the game's own pixels
     { wait: ms }
   (a step can hold keys and use the mouse at once). run(seq, id, t) starts it (a new one replaces the old: he changed
   his mind); tick(t) -> { held: Set of codes down now, mouse: [what to do with the mouse now], done: the id just
   finished }. nothing odd gets through: codes are plain, a hold is 3 s at most, a plan 12 steps. pure */
const CODE = /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Enter|Escape|Tab|Backspace|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|F[1-9]|F1[0-2]|Numpad[0-9])$/;
const ACTIONS = new Set(['click', 'right', 'move', 'down', 'up']);
const ALIAS = { contextmenu: 'right', rightclick: 'right', 'right-click': 'right', right_click: 'right', secondary: 'right', left: 'click', leftclick: 'click', 'left-click': 'click', mousedown: 'down', mouseup: 'up', hover: 'move' };   // what a model calls them
const clean = seq => (Array.isArray(seq) ? seq : []).slice(0, 12).map(s => {
  if (!s || typeof s !== 'object') return null;
  const keys = (Array.isArray(s.keys) ? s.keys : Array.isArray(s.tap) ? s.tap : []).filter(k => CODE.test(String(k)));
  const act = s.mouse && (ALIAS[String(s.mouse.action).toLowerCase()] || String(s.mouse.action).toLowerCase());
  const m = s.mouse && ACTIONS.has(act) && Number.isFinite(+s.mouse.x) && Number.isFinite(+s.mouse.y) ? { action: act, x: +s.mouse.x, y: +s.mouse.y } : null;
  const ms = Array.isArray(s.tap) ? 90 : Math.min(3000, Math.max(0, +s.ms || +s.wait || (m && !keys.length ? 120 : 0)));
  if (!keys.length && !m && !(s.wait > 0)) return null;
  return { keys, mouse: m, ms: Math.max(ms, keys.length || m ? 60 : 0) };
}).filter(Boolean);

export function createHands() {
  let plan = [], id = null, t0 = 0, i = 0, stepAt = 0, sent = -1;
  return {
    run(seq, planId, t) { plan = clean(seq); id = planId; t0 = t; i = 0; stepAt = t; sent = -1; },
    get busy() { return i < plan.length; },
    tick(t) {
      const out = { held: new Set(), mouse: [], done: null };
      while (i < plan.length && t - stepAt >= plan[i].ms / 1000) { stepAt += plan[i].ms / 1000; i++; }
      if (i >= plan.length) { if (id !== null) { out.done = id; id = null; } return out; }
      const s = plan[i];
      for (const k of s.keys) out.held.add(k);
      if (s.mouse && sent !== i) { sent = i; out.mouse.push(s.mouse); }
      return out;
    },
  };
}
