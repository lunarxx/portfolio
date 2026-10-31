/* abilities: what happens in the room when something happens on stream (showcase spec, section 3). the trigger and
   program logic is the reel lab's (live/abilities/engine.js, read only there), kept as it was; the effects are drawn by
   the stage (fx.js), which gets each one as it starts (onFx) and each held one as it ends (onEnd).
   a definition (config/abilities/*.json; every field but id optional):
     id, title, about, tags
     when       a trigger or a list (any one starts it): { on: 'game.coin' } (| alternatives, * wildcards),
                match: { field: 'a|b' or '/re/i' }, if: "condition", count: 3 + within: 5 (the 3rd inside 5 s),
                after: 'other.event' + within: 2 (only soon after it)
     require    a condition that must hold too; cooldown (s); chance 0..1; stack 'stack' | 'restart' | 'ignore'
     params     its settings (params.x); vars: its own variables for one run (vars.x)
     do         steps { at: seconds, fx, ...arguments, if }; an argument can be a template ("{upper(data.handle)}")
     hold       effects that last the whole run; until: an end event (same form as when) and/or max: seconds
     on         reactions while it runs: [{ on, match, if, set: { var: value }, do }]; end: steps when it ends
   step(t) every frame: queued events are handled, due steps fire, runs past their max end */
import { createSenses, nameMatches } from './senses.js';
import { evaluate, templateAll, template, matches } from './expr.js';

export const FX_KINDS = new Set(['tv', 'face', 'text', 'banner', 'particles', 'sound', 'light', 'shake', 'zoom', 'arm', 'monitor', 'cat', 'emit', 'move', 'box', 'dark', 'cam', 'hat']);
const DUR = { tv: 1.5, face: .8, text: 1.2, banner: 2.2, particles: 1.2, sound: 0, light: 1, shake: .25, zoom: .6, arm: 1.2, monitor: .5, cat: 0, emit: 0 };
const SKIP = new Set(['fx', 'at', 'if']);
const asList = v => v == null ? [] : Array.isArray(v) ? v : [v];

export function createAbilities({ defs = [], now, rand = Math.random, onFx = () => {}, onEnd = () => {}, rules } = {}) {
  const senses = createSenses({ now, rules });
  const A = { defs: [], byName: new Map(), wild: [], runs: [], queue: [], lastStart: {}, errors: [], seq: 0 };
  senses.listen(e => A.queue.push(e));
  const err = m => { if (!A.errors.includes(m)) A.errors.push(m); if (A.errors.length > 50) A.errors.shift(); };
  function load(list) {
    A.defs = []; A.byName = new Map(); A.wild = [];
    for (const d of list || []) {
      if (!d || typeof d !== 'object' || !d.id || d.enabled === false) continue;
      A.defs.push(d);
      for (const tr of asList(d.when)) for (const alt of String((tr && tr.on) || '').split('|').map(s => s.trim()).filter(Boolean)) {
        if (alt.includes('*')) A.wild.push({ d, tr }); else { if (!A.byName.has(alt)) A.byName.set(alt, []); A.byName.get(alt).push({ d, tr }); }
      }
    }
    return A.defs.length;
  }
  const scope = (run, e) => ({ data: (e && e.data) || (run && run.ev && run.ev.data) || {}, ev: e ? { name: e.name, source: e.source } : {}, params: (run && run.def.params) || {}, vars: run ? run.vars : {}, fn: senses.fn });
  const truthy = (src, sc) => src == null || src === '' ? true : !!evaluate(src, sc);
  function fits(tr, e, sc) {
    if (!tr) return false;
    if (tr.on && !nameMatches(tr.on, e.name)) return false;
    if (tr.match) for (const k in tr.match) if (!matches(e.data[k], tr.match[k])) return false;
    if (tr.count && senses.fn.count(tr.on || e.name, tr.within || 10) < tr.count) return false;
    if (tr.after && senses.fn.since(tr.after) > (tr.within || 5)) return false;
    if (tr.if && !truthy(tr.if, sc)) return false;
    return true;
  }
  function spawn(run, step, hold, ev) {
    const sc = scope(run, ev);
    if (step.if && !truthy(step.if, sc)) return null;
    if (!FX_KINDS.has(step.fx)) { err(`no effect ${step.fx} (${run.def.id})`); return null; }
    const a = templateAll(step, sc, SKIP);
    const f = { id: `${run.id}/${++A.seq}`, kind: step.fx, a, hold: !!hold, ability: run.def.id, dur: +a.dur || DUR[step.fx] };
    if (step.fx === 'emit') { senses.post({ source: 'abilities', name: String(a.name || ''), data: a.data || {} }); return f; }
    if (hold) run.held.push(f);
    try { onFx(f); } catch (e) { err(`${step.fx}: ${e.message}`); }
    return f;
  }
  const schedule = (run, steps, ev) => { for (const s of asList(steps)) if (s && typeof s === 'object') run.steps.push({ s, due: now() + (+s.at || 0), ev }); };
  function finish(run, quick) {
    if (run.ending) return; run.ending = true;
    if (!quick) schedule(run, run.def.end, run.ev);
    for (const f of run.held) { try { onEnd(f); } catch {} }
    run.held = [];
  }
  function start(d, e) {
    const sustained = !!(d.hold || d.until), stack = d.stack || (sustained ? 'ignore' : 'stack');
    const mine = A.runs.filter(r => r.def === d && !r.ending);
    if (mine.length && stack === 'ignore') return null;
    if (mine.length && stack === 'restart') for (const r of mine) finish(r, true);
    const run = { def: d, t0: now(), ev: e, vars: {}, steps: [], held: [], ending: false, id: `${d.id}#${++A.seq}` };
    for (const k in d.vars || {}) run.vars[k] = template(d.vars[k], scope(run, e));
    A.runs.push(run); A.lastStart[d.id] = now();
    schedule(run, d.do, e);
    for (const h of asList(d.hold)) if (h && typeof h === 'object') spawn(run, h, true, e);
    return run;
  }
  function handle(e) {
    for (const run of A.runs.slice()) {
      if (run.ending) continue;
      for (const h of asList(run.def.on)) if (h && fits(h, e, scope(run, e))) {
        const sc = scope(run, e);
        for (const k in h.set || {}) run.vars[k] = template(h.set[k], sc);
        schedule(run, h.do, e);
      }
      if (asList(run.def.until).some(u => u && u.on && fits(u, e, scope(run, e)))) finish(run);
    }
    const cands = (A.byName.get(e.name) || []).concat(A.wild.filter(w => asList(w.tr.on && String(w.tr.on).split('|')).some(p => p.includes('*') && nameMatches(p.trim(), e.name))));
    for (const { d, tr } of cands) {
      const sc = scope({ def: d, vars: {}, ev: e }, e);
      if (!fits(tr, e, sc)) continue;
      if (d.require && !truthy(d.require, sc)) continue;
      if (d.cooldown && now() - (A.lastStart[d.id] ?? -1e9) < d.cooldown) continue;
      if (d.chance != null && rand() >= d.chance) continue;
      start(d, e);
    }
  }
  load(defs);
  return {
    load,
    /* an event in: { name, data, source } */
    post: e => senses.post(e),
    step() {
      let n = 0; while (A.queue.length && n++ < 64) handle(A.queue.shift());
      A.queue.length = 0;
      for (const run of A.runs) {
        for (const s of run.steps) if (!s.fired && now() >= s.due) { s.fired = true; spawn(run, s.s, false, s.ev); }
        run.steps = run.steps.filter(s => !s.fired);
        const u = asList(run.def.until).find(x => x && x.max != null), max = u ? +u.max : (run.def.hold || run.def.until ? 120 : null);
        if (!run.ending && max != null && now() - run.t0 > max) finish(run);
      }
      A.runs = A.runs.filter(r => r.steps.length || (!r.ending && (r.def.hold || r.def.until)));
    },
    running: () => A.runs.map(r => r.def.id),
    errors: () => A.errors.slice(),
    senses,
  };
}
