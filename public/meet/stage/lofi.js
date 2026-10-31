/* the lofi under the stream, written in the page as it plays (his note, 2026-09-28: "a big playlist of lofi bg songs so
   theres no unnecessary silence"; made here, so nothing is licensed). a song is planned whole: a key, a slow swung tempo,
   one of a few jazzy four-chord loops, a bass, drums that sit out the intro, a break and the end, and a sparse melody now
   and then; then it is played ahead of time on the audio clock. the playlist never repeats a key and loop back to back.
   planSong(rand) and playlist(rand) are plain data (tested in node); createLofi(ctx, out, ...) plays them */
const Q = { maj7: [0, 4, 7, 11], maj9: [0, 4, 7, 11, 14], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14], 7: [0, 4, 7, 10], 9: [0, 4, 7, 10, 14], '7sus': [0, 5, 7, 10], '69': [0, 4, 7, 9, 14] };
const PROGS = {
  'two-five': [[2, 'm9'], [7, '9'], [0, 'maj9'], [9, 'm7']],
  'four-three': [[5, 'maj7'], [4, 'm7'], [2, 'm9'], [0, 'maj7']],
  'six-four': [[9, 'm9'], [5, 'maj7'], [0, 'maj9'], [7, '7sus']],
  'soul': [[5, 'maj9'], [4, '7'], [9, 'm9'], [0, '9']],
  'drift': [[9, 'm9'], [2, 'm7'], [4, 'm7'], [9, 'm9']],
  'home': [[0, '69'], [5, 'maj7'], [2, 'm9'], [7, '7sus']],
};
const ADJ = ['late', 'cold', 'slow', 'quiet', 'small', 'blue', 'soft', 'sunday', 'paper', 'rainy', 'warm', 'last', 'dim', 'lazy', 'early', 'grey'];
const NOUN = ['bus', 'tea', 'window', 'moon', 'socks', 'radio', 'stairs', 'garden', 'ferry', 'lamp', 'kettle', 'tram', 'balcony', 'toast', 'laundry', 'rooftop'];
const PENTA = [0, 2, 4, 7, 9];
const pick = (rand, xs) => xs[Math.floor(rand() * xs.length)];

export function planSong(rand = Math.random, { avoid = null, titles = [] } = {}) {
  let key, prog;
  do { key = Math.floor(rand() * 12); prog = pick(rand, Object.keys(PROGS)); } while (avoid && key === avoid.key && prog === avoid.prog);
  let title; do { title = `${pick(rand, ADJ)} ${pick(rand, NOUN)}`; } while (titles.includes(title));
  const bpm = 70 + Math.round(rand() * 18), secs = 140 + rand() * 70;
  const n = Math.max(24, Math.round(secs * bpm / 240 / 4) * 4);
  const kickAlso = pick(rand, [[2.5], [1.5], [2.5, 3.5], [2]]), intro = rand() < .5 ? 2 : 4, brk = n > 56 ? 4 : 2, brkAt = Math.round(n * .55 / 4) * 4;
  const bars = [];
  for (let i = 0; i < n; i++) {
    const [deg, q] = PROGS[prog][i % 4], root = (key + deg) % 12;
    let chord = Q[q].map(x => 48 + root + x); chord = chord.map(x => x > 77 ? x - 12 : x).sort((a, b) => a - b);
    const bassRoot = 36 + root, bass = [{ beat: 0, note: bassRoot, len: 1.6 }];
    if (rand() < .7) bass.push({ beat: pick(rand, [2, 2.5]), note: rand() < .5 ? bassRoot - 5 : bassRoot, len: .8 });
    const quiet = i < intro || (i >= brkAt && i < brkAt + brk) || i >= n - 2;
    const drums = [];
    if (!quiet) {
      drums.push({ kind: 'kick', beat: 0, vel: .9 }); for (const b of kickAlso) drums.push({ kind: 'kick', beat: b, vel: .6 + rand() * .2 });
      drums.push({ kind: 'snare', beat: 1, vel: .8 }, { kind: 'snare', beat: 3, vel: .85 });
      for (let h = 0; h < 8; h++) if (rand() > .08) drums.push({ kind: 'hat', beat: h / 2, vel: (h % 2 ? .45 : .7) * (.8 + rand() * .3) });
    }
    const melody = [];
    if (!quiet && i >= intro + 4 && rand() < .35) {
      let beat = rand() < .5 ? 0 : .5;
      for (let k = 0, m = 2 + Math.floor(rand() * 3); k < m && beat < 4; k++) { melody.push({ beat, note: 72 + ((key + pick(rand, PENTA)) % 12), len: .5 + rand() }); beat += pick(rand, [.5, 1, 1.5]); }
    }
    bars.push({ chord, bass, drums, melody, push: !quiet && rand() < .2 });   // push: the chord comes an eighth early
  }
  return { title, key, prog, bpm, swing: .06 + rand() * .05, bars };
}

export function playlist(rand = Math.random) {
  let last = null; const titles = [];
  return () => { const s = planSong(rand, { avoid: last, titles }); last = s; titles.push(s.title); if (titles.length > 8) titles.shift(); return s; };
}

const hz = m => 440 * 2 ** ((m - 69) / 12);
/* plays the playlist into `out`, ahead of time on the audio clock. onSong(song) as each one starts */
export function createLofi(ctx, out, { rand = Math.random, onSong = () => {} } = {}) {
  const next = playlist(rand);
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 5200; tone.connect(out);
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rand() * 2 - 1; }
  const wow = ctx.createOscillator(), wowAmt = ctx.createGain(); wow.frequency.value = .23; wowAmt.gain.value = 7; wow.connect(wowAmt); wow.start();   // tape wow, in cents
  const echo = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain(); fb.gain.value = .3; wet.gain.value = .25; echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(tone);
  { const hiss = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); hiss.buffer = noise; hiss.loop = true; bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = .6; g.gain.value = .006; hiss.connect(bp); bp.connect(g); g.connect(out); hiss.start(); }
  function env(g, t, peak, a, hold, rel) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(peak * .45, t + a, hold / 3); g.gain.setTargetAtTime(0, t + a + hold, rel / 4); }
  function voice(type, f, t, dur, peak, cut, dest = tone, cents = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f; o.detune.value = cents; wowAmt.connect(o.detune); lp.type = 'lowpass'; lp.frequency.value = cut;
    o.connect(lp); lp.connect(g); g.connect(dest); env(g, t, peak, .012, dur, .5); o.start(t); o.stop(t + dur + .8);
    o.onended = () => { try { wowAmt.disconnect(o.detune); } catch {} };
  }
  function hit(t, peak, decay, type, f, q = 1) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); fl.connect(g); g.connect(tone);
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.0001, t + decay); s.start(t, rand() * .8); s.stop(t + decay + .02);
  }
  function kick(t, vel) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + .12);
    g.gain.setValueAtTime(.55 * vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + .32); o.connect(g); g.connect(tone); o.start(t); o.stop(t + .35); }
  function snare(t, vel) { hit(t, .2 * vel, .15, 'bandpass', 1900, .8); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 185;
    g.gain.setValueAtTime(.08 * vel, t); g.gain.exponentialRampToValueAtTime(.0001, t + .08); o.connect(g); g.connect(tone); o.start(t); o.stop(t + .1); }
  function bar(b, t0, beat, swing) {
    const at = x => t0 + (x + (x % 1 === .5 ? swing : 0)) * beat + (rand() - .5) * .012;
    const ct = b.push ? t0 - beat / 2 + swing * beat : t0;
    b.chord.forEach((m, i) => { voice('sine', hz(m), ct + i * .006, beat * 3.6, .05, 2400, tone, (rand() - .5) * 8); voice('triangle', hz(m + 12), ct + i * .006, beat * 2, .008, 2400); });
    for (const n of b.bass) voice('sine', hz(n.note), at(n.beat), n.len * beat, .16, 700);
    for (const d of b.drums) (d.kind === 'kick' ? kick : d.kind === 'snare' ? snare : (t, v) => hit(t, .05 * v, .035, 'highpass', 7000))(at(d.beat), d.vel);
    for (const n of b.melody) { voice('triangle', hz(n.note), at(n.beat), n.len * beat, .035, 3000); voice('triangle', hz(n.note), at(n.beat), n.len * beat, .02, 3000, echo); }
    for (let k = 0, m = 1 + Math.floor(rand() * 5); k < m; k++) hit(t0 + rand() * 4 * beat, .015 + rand() * .04, .004, 'bandpass', 1500 + rand() * 2500, 2);   // vinyl pops
  }
  let song = null, i = 0, at = 0;
  function start(t) { song = next(); i = 0; at = t; echo.delayTime.setValueAtTime(Math.min(.9, .75 * 60 / song.bpm), t); setTimeout(() => onSong(song), Math.max(0, (t - ctx.currentTime) * 1000)); }
  start(ctx.currentTime + .3);
  const timer = setInterval(() => {
    const beat = 60 / song.bpm;
    while (at < ctx.currentTime + .5) {
      bar(song.bars[i], at, beat, song.swing * 2);
      at += 4 * beat; i++;
      if (i >= song.bars.length) { start(at + 1.2 + rand() * 1.5); break; }
    }
  }, 100);
  return { get song() { return song; }, stop() { clearInterval(timer); }, skip() { start(ctx.currentTime + .4); } };
}
