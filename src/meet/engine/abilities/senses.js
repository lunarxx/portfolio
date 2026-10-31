/* the one event stream abilities react to (after the reel lab's live/abilities/senses.js, read only there). an event is
   { name, source, data }; the bus stamps its time, keeps each name's recent times (count, since), switches (x.on / x.off)
   and values (rules below), and hands every event to its listeners.
   the functions ability expressions can call: on(name) value(name, d) since(name) count(name, secs) recent(name, secs)
   last(name) min max abs round floor ceil clamp lower upper len has pick str num */
import { template } from './expr.js';

const NAME = /^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/;
/* state kept as data: on an event, count something up, set it, or clear it */
export const RULES = [
  { on: 'game.coin', inc: 'game.coins' },
  { on: 'game.jump', inc: 'game.jumps' },
  { on: 'game.hit|game.fall|game.death', set: { 'game.streak': 0 } },
  { on: 'game.coin', inc: 'game.streak' },
  { on: 'chat.message', inc: 'chat.count' },
  { on: 'work.shipped', inc: 'work.steps' },
];
export function sanitize(v, depth = 0) {
  if (v == null) return v;
  if (typeof v === 'string') return v.slice(0, 200);
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'boolean') return v;
  if (depth >= 3 || typeof v !== 'object') return undefined;
  if (Array.isArray(v)) return v.slice(0, 20).map(x => sanitize(x, depth + 1));
  const o = {}; let n = 0;
  for (const k of Object.keys(v)) { if (n++ >= 40) break; if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue; const s = sanitize(v[k], depth + 1); if (s !== undefined) o[k.slice(0, 40)] = s; }
  return o;
}
const cache = new Map();
/* 'game.coin' against 'game.*', 'game.hit|game.fall', '*' */
export function nameMatches(pattern, name) {
  if (!pattern) return false;
  let re = cache.get(pattern);
  if (!re) { re = new RegExp('^(?:' + String(pattern).split('|').map(p => p.trim().replace(/[.+^${}()[\]\\]/g, '\\$&').replace(/\*/g, '.*')).join('|') + ')$'); cache.set(pattern, re); }
  return re.test(name);
}

export function createSenses({ now, rules = RULES } = {}) {
  const bus = { subs: [], last: {}, hist: {}, sw: {}, vals: {}, seq: 0, log: [] };
  const num = v => (typeof v === 'number' ? v : +v);
  bus.fn = {
    on: n => !!(bus.sw[n] && bus.sw[n].on),
    value: (n, d) => bus.vals[n] !== undefined ? bus.vals[n] : (bus.sw[n] ? bus.sw[n].on : (d === undefined ? null : d)),
    since: n => bus.last[n] ? now() - bus.last[n].at : Infinity,
    count: (n, secs = 10) => { const t = now(); let c = 0; for (const k in bus.hist) if (k === n || nameMatches(n, k)) for (const a of bus.hist[k]) if (t - a <= secs) c++; return c; },
    recent: (n, secs = 3) => bus.fn.count(n, secs) > 0,
    last: n => bus.last[n] ? bus.last[n].data : null,
    min: Math.min, max: Math.max, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil,
    clamp: (v, a, b) => Math.max(num(a), Math.min(num(b), num(v))),
    lower: s => String(s ?? '').toLowerCase(), upper: s => String(s ?? '').toUpperCase(), len: s => (s == null ? 0 : s.length || 0),
    has: (s, x) => s == null ? false : Array.isArray(s) ? s.includes(x) : String(s).toLowerCase().includes(String(x).toLowerCase()),
    pick: l => Array.isArray(l) && l.length ? l[Math.floor(Math.random() * l.length)] : l,
    str: v => String(v ?? ''), num: v => +v || 0,
  };
  bus.post = ev => {
    if (!ev || typeof ev !== 'object') return null;
    const name = String(ev.name || '').toLowerCase().trim();
    if (!NAME.test(name) || name.length > 80) return null;
    const e = { id: ++bus.seq, name, source: String(ev.source || 'stage').slice(0, 40), at: now(), data: sanitize(ev.data && typeof ev.data === 'object' ? ev.data : {}) || {} };
    bus.last[name] = e;
    const h = bus.hist[name] || (bus.hist[name] = []); h.push(e.at); while (h.length > 200 || (h.length && e.at - h[0] > 120)) h.shift();
    if (/\.(on|off)$/.test(name)) { const base = name.slice(0, name.lastIndexOf('.')); bus.sw[base] = { on: name.endsWith('.on'), since: e.at, data: e.data }; }
    if (e.data.value !== undefined && typeof e.data.value !== 'object') bus.vals[name] = e.data.value;
    for (const r of rules) if (nameMatches(r.on, name)) {
      if (r.inc) bus.vals[r.inc] = (+bus.vals[r.inc] || 0) + 1;
      if (r.set) for (const k in r.set) bus.vals[k] = template(r.set[k], { data: e.data, fn: bus.fn });
      if (r.clear) delete bus.vals[r.clear];
    }
    bus.log.push(e); if (bus.log.length > 200) bus.log.shift();
    for (const f of bus.subs.slice()) { try { f(e); } catch (err) { console.warn('[senses] ' + err.message); } }
    return e;
  };
  bus.listen = f => { bus.subs.push(f); return () => { const i = bus.subs.indexOf(f); if (i >= 0) bus.subs.splice(i, 1); }; };
  return bus;
}
