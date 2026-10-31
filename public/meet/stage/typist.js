/* the typist, in the page: types a commit's script into the editor at a person's pace (part 1 spec section 11).
   about 9 characters a second with jitter, faster on spaces, a pause at each line end, the odd typo backspaced. it
   waits while he is turned to the camera (busy). past budgetChars a commit's remaining insertions are pasted, hunk by
   hunk, the way a streamer pastes boilerplate. each file ends exactly as the commit has it (a mismatch is set straight
   silently). onKey(ch) moves his fingers; onLine() is a natural pause for the chat batcher.
   interrupt(fn): something else at the keys mid-typing (the cat walking over them): while a line is being typed, fn runs
   at the cursor with put(ch) and back() and typing picks up after; resolves true, or false when he isn't typing text
   (nothing runs). whatever fn leaves, each file still ends as the commit has it */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const split = t => t === '' ? [] : t.split('\n');
const NEAR = 'qwertyuiopasdfghjklzxcvbnm';
const PASTED = new Set(['html', 'json', 'css', 'markdown', 'plaintext']);   // markup and config are pasted: the typing on stream is the logic

export function createTypist({ monaco, editor, setTabs, onKey = () => {}, onLine = () => {}, busy = () => false, fast = false }) {
  const models = new Map(), nap = ms => sleep(fast ? 0 : ms);
  let inText = false, pending = null;
  const modelFor = f => {
    let m = models.get(f.path);
    if (!m) { m = monaco.editor.createModel(f.before, f.lang); models.set(f.path, m); }
    else if (m.getValue() !== f.before) m.setValue(f.before);
    return m;
  };
  const delay = ch => ch === ' ' ? 40 + Math.random() * 50 : /[;{}()]/.test(ch) ? 90 + Math.random() * 110 : 50 + Math.random() * 90;   // about 11 a second
  function at(model, k) { return k < model.getLineCount() ? model.getOffsetAt({ lineNumber: k + 1, column: 1 }) : model.getValueLength(); }
  function put(model, offset, text) {
    const p = model.getPositionAt(offset);
    model.applyEdits([{ range: new monaco.Range(p.lineNumber, p.column, p.lineNumber, p.column), text }]);
    const q = model.getPositionAt(offset + text.length);
    editor.setPosition(q); editor.revealPositionInCenterIfOutsideViewport(q);
    return offset + text.length;
  }
  async function job(model, offset, j) {
    const from = offset;
    const put1 = ch => { offset = put(model, offset, ch); };
    const back = () => { if (offset <= from) return; const p = model.getPositionAt(offset - 1), q = model.getPositionAt(offset);
      model.applyEdits([{ range: new monaco.Range(p.lineNumber, p.column, q.lineNumber, q.column), text: '' }]); offset -= 1; editor.setPosition(p); };
    try { await j.fn({ put: put1, back }); j.done(true); } catch { j.done(false); }
    return offset;
  }
  async function typeText(model, offset, text) {
    inText = true;
    try { for (const ch of text) {
      if (pending) { const j = pending; pending = null; offset = await job(model, offset, j); }
      while (busy()) await nap(150);
      if (/[a-z]/.test(ch) && Math.random() < 0.015) {   // a typo, seen, backspaced
        const wrong = NEAR[(NEAR.indexOf(ch) + 1) % NEAR.length];
        offset = put(model, offset, wrong); onKey(wrong); await nap(180 + Math.random() * 200);
        const p = model.getPositionAt(offset - 1), q = model.getPositionAt(offset);
        model.applyEdits([{ range: new monaco.Range(p.lineNumber, p.column, q.lineNumber, q.column), text: '' }]); offset -= 1; onKey('\b'); await nap(120);
      }
      offset = put(model, offset, ch); onKey(ch);
      if (ch === '\n') { onLine(); await nap(250 + Math.random() * 450); } else await nap(delay(ch));
    } } finally { inText = false; if (pending) { pending.done(false); pending = null; } }
    return offset;
  }
  return {
    get inText() { return inText; },
    interrupt(fn) { if (!inText || pending) return Promise.resolve(false); return new Promise(done => { pending = { fn, done }; }); },
    /* one commit: resolves when every file is typed */
    async type(script, { budgetChars = 700 } = {}) {
      let typed = 0;
      for (const f of script.files) {
        const model = modelFor(f), mirror = split(f.before);
        editor.setModel(model); setTabs([...models.keys()], f.path); editor.setScrollTop(0);
        await nap(500);
        for (const h of f.hunks) {
          if (h.del) {   // select the lines, a beat, gone
            const s = at(model, h.at), e = at(model, h.at + h.del), ps = model.getPositionAt(s), pe = model.getPositionAt(e);
            editor.setSelection(new monaco.Range(ps.lineNumber, ps.column, pe.lineNumber, pe.column)); editor.revealLineInCenter(ps.lineNumber);
            await nap(450);
            model.applyEdits([{ range: new monaco.Range(ps.lineNumber, ps.column, pe.lineNumber, pe.column), text: '' }]);
          }
          mirror.splice(h.at, h.del);
          if (!h.ins.length) continue;
          const endOfDoc = h.at >= mirror.length, raw = model.getValue();
          const text = endOfDoc ? (raw.length && !raw.endsWith('\n') ? '\n' : '') + h.ins.join('\n') : h.ins.join('\n') + '\n';
          mirror.splice(h.at, 0, ...h.ins);
          const offset = at(model, h.at);
          if (PASTED.has(f.lang) || typed + text.length > budgetChars) { put(model, offset, text); await nap(260); }
          else await typeText(model, offset, text);
          if (!PASTED.has(f.lang)) typed += text.length;
        }
        if (model.getValue() !== f.after) model.setValue(f.after);
        await nap(600);
      }
    },
  };
}
