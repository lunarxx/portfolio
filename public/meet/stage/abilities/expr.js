/* ported from the reel lab's live/abilities/expr.js (2026-09-28, read only there): a small, safe expression language for
   ability definitions: conditions ("value('game.coins', 0) >= 3") and parameters ("{data.user} followed"). parsed once,
   cached, evaluated against a scope. no eval, no Function, no prototype access: a definition reads only what the scope
   hands it.
   values   numbers, 'strings' or "strings", true false null, [a, b] lists
   names    data.x (the event's data), vars.x (the ability's own), params.x (its settings), ev.name, ev.source
   ops      || && ! (also or and not), == != < <= > >=, ~ (matches: 'a|b' alternatives or '/re/i'), + - * / %, ??, c ? a : b, a.b a[b]
   calls    whatever the scope's fn has (senses.js) */
const BAD = new Set(['__proto__', 'prototype', 'constructor']);
const OPS = ['??', '||', '&&', '==', '!=', '<=', '>=', '<', '>', '~', '+', '-', '*', '/', '%', '!', '?', ':', '(', ')', '[', ']', ',', '.'];

function lex(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) { const m = /^(\d*\.?\d+(?:e[+-]?\d+)?)/i.exec(src.slice(i)); out.push({ k: 'num', v: +m[1] }); i += m[1].length; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1, s = '';
      while (j < src.length && src[j] !== c) { if (src[j] === '\\' && j + 1 < src.length) { s += src[j + 1]; j += 2; } else s += src[j++]; }
      if (j >= src.length) throw new Error('unclosed string in: ' + src);
      out.push({ k: 'str', v: s }); i = j + 1; continue;
    }
    if (/[A-Za-z_$]/.test(c)) { const m = /^[A-Za-z_$][\w$]*/.exec(src.slice(i))[0]; out.push({ k: 'id', v: m }); i += m.length; continue; }
    const op = OPS.find(o => src.startsWith(o, i));
    if (!op) throw new Error(`unexpected "${c}" in: ${src}`);
    out.push({ k: 'op', v: op }); i += op.length;
  }
  return out;
}

/* pratt parser -> a small tree of arrays */
function parse(src) {
  const T = lex(src); let p = 0;
  const peek = () => T[p], take = () => T[p++];
  const isOp = (v) => T[p] && T[p].k === 'op' && T[p].v === v;
  const isWord = (v) => T[p] && T[p].k === 'id' && T[p].v === v;
  const want = (v) => { if (!isOp(v)) throw new Error(`expected "${v}" in: ${src}`); p++; };
  const BIN = { '??': 1, '||': 2, or: 2, '&&': 3, and: 3, '==': 4, '!=': 4, '<': 5, '<=': 5, '>': 5, '>=': 5, '~': 5, '+': 6, '-': 6, '*': 7, '/': 7, '%': 7 };
  function prefix() {
    const t = take(); if (!t) throw new Error('unexpected end of: ' + src);
    if (t.k === 'num' || t.k === 'str') return ['lit', t.v];
    if (t.k === 'op' && (t.v === '!' || t.v === '-')) return [t.v === '!' ? 'not' : 'neg', expr(8)];
    if (t.k === 'op' && t.v === '(') { const e = expr(0); want(')'); return e; }
    if (t.k === 'op' && t.v === '[') { const items = []; if (!isOp(']')) { do items.push(expr(0)); while (isOp(',') && take()); } want(']'); return ['list', items]; }
    if (t.k === 'id') {
      if (t.v === 'true') return ['lit', true]; if (t.v === 'false') return ['lit', false]; if (t.v === 'null') return ['lit', null];
      if (t.v === 'not') return ['not', expr(8)];
      if (isOp('(')) { take(); const args = []; if (!isOp(')')) { do args.push(expr(0)); while (isOp(',') && take()); } want(')'); return ['call', t.v, args]; }
      return ['name', t.v];
    }
    throw new Error(`unexpected "${t.v}" in: ${src}`);
  }
  function expr(min) {
    let left = prefix();
    for (;;) {
      const t = peek(); if (!t) break;
      if (t.k === 'op' && t.v === '.') { take(); const n = take(); if (!n || n.k !== 'id') throw new Error('expected a name after "." in: ' + src); left = ['get', left, ['lit', n.v]]; continue; }
      if (t.k === 'op' && t.v === '[') { take(); const k = expr(0); want(']'); left = ['get', left, k]; continue; }
      if (t.k === 'op' && t.v === '?' && min <= 0) { take(); const a = expr(0); want(':'); const b = expr(0); left = ['if', left, a, b]; continue; }
      const op = t.k === 'op' ? t.v : (t.k === 'id' && (t.v === 'and' || t.v === 'or') ? t.v : null);
      const pr = op && BIN[op]; if (!pr || pr <= min) break;
      take(); left = [op === 'and' ? '&&' : op === 'or' ? '||' : op, left, expr(pr)];
    }
    return left;
  }
  const tree = expr(0);
  if (p < T.length) throw new Error(`unexpected "${T[p].v}" in: ${src}`);
  return tree;
}

const reCache = new Map();
function matches(v, pat) {
  if (v == null || pat == null) return false;
  const s = String(v), P = String(pat);
  if (P.length > 2 && P[0] === '/' && P.lastIndexOf('/') > 0) {
    let re = reCache.get(P); if (!re) { const j = P.lastIndexOf('/'); re = new RegExp(P.slice(1, j), P.slice(j + 1).replace(/[^imsu]/g, '')); reCache.set(P, re); }
    return re.test(s);
  }
  const low = s.toLowerCase().trim();
  return P.toLowerCase().split('|').some(a => a.trim() === low);
}
function get(o, k) {
  if (o == null) return undefined;
  if (typeof k !== 'string' && typeof k !== 'number') return undefined;
  if (BAD.has(String(k))) return undefined;
  if (typeof o === 'string') return k === 'length' ? o.length : undefined;
  if (typeof o !== 'object') return undefined;
  return Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined;
}
function run(n, S) {
  switch (n[0]) {
    case 'lit': return n[1];
    case 'list': return n[1].map(x => run(x, S));
    case 'name': return get(S, n[1]);
    case 'get': return get(run(n[1], S), run(n[2], S));
    case 'not': return !run(n[1], S);
    case 'neg': return -run(n[1], S);
    case 'if': return run(n[1], S) ? run(n[2], S) : run(n[3], S);
    case 'call': { const f = S.fn && Object.prototype.hasOwnProperty.call(S.fn, n[1]) ? S.fn[n[1]] : null; if (typeof f !== 'function') throw new Error('no function ' + n[1]); return f(...n[2].map(x => run(x, S))); }
    case '&&': return run(n[1], S) && run(n[2], S);
    case '||': return run(n[1], S) || run(n[2], S);
    case '??': { const a = run(n[1], S); return a == null ? run(n[2], S) : a; }
  }
  const a = run(n[1], S), b = run(n[2], S);
  switch (n[0]) {
    case '==': return a == b; // eslint-disable-line eqeqeq
    case '!=': return a != b; // eslint-disable-line eqeqeq
    case '<': return a < b; case '<=': return a <= b; case '>': return a > b; case '>=': return a >= b;
    case '~': return matches(a, b);
    case '+': return (typeof a === 'string' || typeof b === 'string') ? String(a ?? '') + String(b ?? '') : (+a || 0) + (+b || 0);
    case '-': return (+a || 0) - (+b || 0); case '*': return (+a || 0) * (+b || 0);
    case '/': return (+b) ? (+a || 0) / +b : 0; case '%': return (+b) ? (+a || 0) % +b : 0;
  }
  throw new Error('bad node ' + n[0]);
}

const cache = new Map();
function compile(src) {
  let c = cache.get(src);
  if (!c) { c = parse(String(src)); cache.set(src, c); if (cache.size > 5000) cache.clear(); }
  return c;
}
/* evaluate an expression; a broken one is false (and says so once), so a bad ability can never take the rig down */
const told = new Set();
function evaluate(src, scope) {
  try { return run(compile(src), scope); }
  catch (e) { if (!told.has(src)) { told.add(src); console.warn('[abilities] ' + e.message); } return undefined; }
}
/* a template: "{data.user} raided" -> a string; a template that is exactly one {expr} keeps the value's type */
function template(v, scope) {
  if (typeof v !== 'string' || v.indexOf('{') < 0) return v;
  const whole = /^\{([^{}]+)\}$/.exec(v);
  if (whole) return evaluate(whole[1], scope);
  return v.replace(/\{([^{}]+)\}/g, (_, e) => { const r = evaluate(e, scope); return r == null ? '' : String(r); });
}
/* every value in an object, templated (one level of nesting for lists and small objects) */
function templateAll(o, scope, skip) {
  const out = {};
  for (const k in o) {
    if (skip && skip.has(k)) { out[k] = o[k]; continue; }
    const v = o[k];
    out[k] = Array.isArray(v) ? v.map(x => template(x, scope)) : (v && typeof v === 'object') ? templateAll(v, scope) : template(v, scope);
  }
  return out;
}
/* for the build: does it parse */
function check(src) { try { parse(String(src)); return null; } catch (e) { return e.message; } }

export { parse, compile, evaluate, template, templateAll, matches, check };
