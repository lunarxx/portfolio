/* octyn's voice out of the tv he has for a head (his note, 2026-09-28: "add some sort of modulation so it sounds like a
   tv"): a small speaker's band, the cone's resonance, a soft lopsided overdrive like a cheap cone, a tiny cabinet, a
   crt hum and soft static under him, and now and then a flicker of static as he starts a line. warm, never bright:
   treble hurt his ears before. the same chain as spikes/voice/tv.py, where his ear picked from renders.
   createTv(ctx, preset, { rand }) -> { input, output, lineStart() }; preset 'off' passes the voice straight through */
export const TV = {
  warm: { band: [180, 4500], cone: [1000, 4], drive: 1.8, cab: [[4, .22], [9, .12]], hum: -46, stat: -50, burst: .4, burstDb: -30 },
  blown: { band: [260, 3700], cone: [900, 6], drive: 3.5, cab: [[4, .22], [9, .12]], hum: -46, stat: -50, burst: .4, burstDb: -30 },
  crt: { band: [180, 4500], cone: [1000, 4], drive: 1.8, cab: [[4, .22], [9, .12]], hum: -40, stat: -44, burst: .8, burstDb: -26 },
  off: null,
};

/* the overdrive: tanh with a small bias (a cheap cone is not symmetric), silence kept silent */
export function driveCurve(drive, bias = .08, n = 2049) {
  const c = new Float32Array(n), t = Math.tanh(drive);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = (Math.tanh(drive * (x + bias)) - Math.tanh(drive * bias)) / t; }
  return c;
}

export function createTv(ctx, preset = 'warm', { rand = Math.random } = {}) {
  const p = TV[preset], input = ctx.createGain(), output = ctx.createGain();
  if (!p) { input.connect(output); return { input, output, lineStart() {} }; }
  const db = x => 10 ** (x / 20);
  const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), cone = ctx.createBiquadFilter(), pre = ctx.createGain(), shaper = ctx.createWaveShaper(), post = ctx.createGain();
  hp.type = 'highpass'; hp.frequency.value = p.band[0]; lp.type = 'lowpass'; lp.frequency.value = p.band[1];
  cone.type = 'peaking'; cone.frequency.value = p.cone[0]; cone.gain.value = p.cone[1]; cone.Q.value = 1.1;
  pre.gain.value = 1.6; shaper.curve = driveCurve(p.drive); shaper.oversample = '2x'; post.gain.value = .55;
  input.connect(hp); hp.connect(lp); lp.connect(cone); cone.connect(pre); pre.connect(shaper); shaper.connect(post); post.connect(output);
  for (const [ms, g] of p.cab) { const d = ctx.createDelay(.05), k = ctx.createGain(); d.delayTime.value = ms / 1000; k.gain.value = g * .55; shaper.connect(d); d.connect(k); k.connect(output); }   // the box
  const hum = ctx.createGain(); hum.gain.value = db(p.hum) * .6; hum.connect(output);
  for (const [f, a] of [[60, 1], [120, .5], [180, .25]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = a; o.connect(g); g.connect(hum); o.start(); }
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); { const x = noise.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = rand() * 2 - 1; }
  { const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; s.loop = true; bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = .5; g.gain.value = db(p.stat); s.connect(bp); bp.connect(g); g.connect(output); s.start(); }
  return {
    input, output,
    /* a line starts: now and then the picture flickers */
    lineStart() {
      if (rand() > p.burst) return;
      const t = ctx.currentTime, n = .06 + rand() * .08, s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise; bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = .4; s.connect(bp); bp.connect(g); g.connect(output);
      g.gain.setValueAtTime(db(p.burstDb) * 2, t); g.gain.exponentialRampToValueAtTime(.0001, t + n); s.start(t, rand()); s.stop(t + n + .02);
    },
  };
}
