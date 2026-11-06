/* the room's sound, all made in the page (his notes, 2026-09-28: keyboard sounds; "sometimes he would push his mic away
   or close (not too repetitive please)"; lofi so there's no unnecessary silence).
   - his voice goes through a mic: close is fuller and drier, far is thinner, quieter and more of the room. where he sits
     from it follows his lean, and now and then (a minute or more apart, never on a clock) he pulls it close or pushes
     it away for a while, with a little handling bump
   - the keys he types click, space and enter a bit deeper, in the same small room
   - the lofi runs under everything and ducks while he talks
   createMic({ rand }).update(t, lean) -> { d (0 close .. 1 far), state, bump } is plain (tested in node);
   createSound(ctx, ...) -> { voiceIn, key(ch), update(t, { speaking, lean }) } is the graph */
import { createLofi } from './lofi.js';
import { createTv } from './tv.js';
import { createPlaylist } from './playlist.js';

export function createMic({ rand = Math.random } = {}) {
  let state = 'rest', until = 0, nextAt = 40 + rand() * 140, d = .42, last = null;
  return {
    update(t, lean = 0) {
      const dt = last === null ? 0 : Math.min(.5, Math.max(0, t - last)); last = t;
      let bump = false;
      if (state === 'rest' && t >= nextAt) { state = rand() < .5 ? 'close' : 'away'; until = t + 20 + rand() * 40; bump = true; }
      else if (state !== 'rest' && t >= until) { state = 'rest'; nextAt = t + 60 + rand() * 150; bump = true; }
      const base = state === 'close' ? .12 : state === 'away' ? .82 : .42;
      const target = Math.max(0, Math.min(1, base - lean * 1.2));
      d = dt === 0 ? target : d + (target - d) * Math.min(1, dt * 3);
      return { d, state, bump };
    },
  };
}

/* a small room: two channels of decaying noise, the highs damped as it dies */
function roomIR(ctx, rand, secs = .45) {
  const n = Math.round(ctx.sampleRate * secs), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const x = b.getChannelData(c); let lp = 0;
    for (let i = 0; i < n; i++) { const t = i / ctx.sampleRate, k = .25 + .7 * Math.min(1, t / secs); lp += (rand() * 2 - 1 - lp) * (1 - k); x[i] = lp * Math.exp(-t / .09); }
    for (const [ms, g] of [[7, .5], [13, .35], [21, .25]]) x[Math.round(ms / 1000 * ctx.sampleRate) + c * 11] += g;   // the desk and the near wall
  }
  return b;
}

const VOICE = .39;   // his voice into the tv and mic, before the room (3 dB down again, his note on stream 5)
const BED = .17;   // the music's level between his lines; under him it drops to 45% of that (3 dB down with the voice, stream 5)

export function createSound(ctx, { rand = Math.random, onSong = () => {}, out = ctx.destination, tv = 'warm' } = {}) {
  /* the last stage: a gentle glue, then a limiter that holds the peaks under -1 dBFS (leaning in through the blown tv
     clipped at 0 dBFS with the real lofi under him) */
  const limit = ctx.createDynamicsCompressor(); limit.threshold.value = -3; limit.knee.value = 0; limit.ratio.value = 20; limit.attack.value = .001; limit.release.value = .08;
  const trim = ctx.createGain(); trim.gain.value = .89; limit.connect(trim); trim.connect(out);
  const glue = ctx.createDynamicsCompressor(); glue.threshold.value = -16; glue.ratio.value = 2.5; glue.attack.value = .01; glue.release.value = .25; glue.connect(limit);
  const master = ctx.createGain(); master.connect(glue);
  const room = ctx.createConvolver(); room.buffer = roomIR(ctx, rand); room.connect(master);
  /* his voice through the mic */
  const voiceIn = ctx.createGain(); voiceIn.gain.value = VOICE;   // his note mid-stream 3: "gotta lower the voice volume" (5 dB down); the show can set it live (mix)
  const prox = ctx.createBiquadFilter(), air = ctx.createBiquadFilter(), mic = ctx.createGain(), send = ctx.createGain();
  prox.type = 'lowshelf'; prox.frequency.value = 180; air.type = 'highshelf'; air.frequency.value = 5000;
  const set = createTv(ctx, tv, { rand });   // the tv he has for a head, then the mic in the room
  voiceIn.connect(set.input); set.output.connect(prox); prox.connect(air); air.connect(mic); mic.connect(master); mic.connect(send); send.connect(room);
  /* the keys */
  const keys = ctx.createGain(), keySend = ctx.createGain(); keys.gain.value = .14; keySend.gain.value = .5; keys.connect(master); keys.connect(keySend); keySend.connect(room);
  const noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate); { const x = noise.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = rand() * 2 - 1; }
  /* the music, ducked under him */
  const duck = ctx.createGain(); duck.gain.value = BED; duck.connect(master);   // real tracks are denser than the generated chords: a lower bed (-21 dB between lines was as loud as him)
  const lofi = createPlaylist(ctx, duck, { rand, onSong, fallback: () => createLofi(ctx, duck, { rand, onSong }) });   // real tracks, else the generated chords
  const micModel = createMic({ rand }), db = x => 10 ** (x / 20);
  let talking = null, musicK = 1;
  /* his guitar: plucked strings (Karplus-Strong: a burst of noise fed round a delay as long as the note's period, losing a
     little each time), made once per note. each of the six strings rings until it's played again, like a real one */
  const ringing = [], SET_PLAY = { k: 1 };
  const plucks = new Map(), guitar = ctx.createGain(), guitarSend = ctx.createGain(), warm = ctx.createBiquadFilter(), body = ctx.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 1500; warm.Q.value = .4; body.type = 'lowshelf'; body.frequency.value = 220; body.gain.value = 3; guitar.gain.value = .95; guitarSend.gain.value = .4; guitar.connect(warm); warm.connect(body); body.connect(master); body.connect(guitarSend); guitarSend.connect(room);
  function pluck(f) {
    if (plucks.has(f)) return plucks.get(f);
    const sr = ctx.sampleRate, n = Math.round(sr / f), b = ctx.createBuffer(1, Math.round(sr * 2.4), sr), x = b.getChannelData(0); let lp = 0;
    for (let i = 0; i < x.length; i++) { if (i < n) { lp += (rand() * 2 - 1 - lp) * .22; x[i] = lp * 1.8; } else x[i] = .995 * .5 * (x[i - n] + x[i - n - 1 < 0 ? 0 : i - n - 1]); }
    plucks.set(f, b); return b;
  }

  function click(t, f, peak, decay, dest = keys) {
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 1.4; s.connect(bp); bp.connect(g); g.connect(dest);
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.0001, t + decay); s.start(t, rand() * .4); s.stop(t + decay + .01);
  }
  function thock(t, f, peak) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03); o.connect(g); g.connect(keys); o.start(t); o.stop(t + .04); }
  return {
    voiceIn, lofi, guitarOut: body,
    /* the meeting's two mutes, separate (his note: one button shouldn't do both). his voice: his mouth still reads the dry
       voice and the captions still run. the room: the music, his keyboard and his set's hum and static */
    muteVoice(on) { voiceIn.gain.setTargetAtTime(on ? 0 : VOICE, ctx.currentTime, .05); },
    muteRoom(on) { const now = ctx.currentTime; musicK = on ? 0 : 1; duck.gain.setTargetAtTime(BED * musicK * SET_PLAY.k * (talking ? .45 : 1), now, .05); keys.gain.setTargetAtTime(on ? 0 : .14, now, .05); set.hiss.gain.setTargetAtTime(on ? 0 : 1, now, .05); },
    /* the call's volume, everything together: 0 .. 1 */
    volume(v) { trim.gain.setTargetAtTime(.89 * v, ctx.currentTime, .03); },
    /* one string plucked: string 0 (low) .. 5, at a frequency, how hard, how soon. the note it was ringing stops */
    pluck(str, f, vel = .8, delay = 0) {
      const t = ctx.currentTime + .005 + delay, last = ringing[str]; if (last) { last.g.gain.setTargetAtTime(0, t, .012); last.s.stop(t + .08); }
      const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = pluck(Math.round(f * 100) / 100); g.gain.value = vel * (.85 - str * .07); s.connect(g); g.connect(guitar); s.start(t); ringing[str] = { s, g };
    },
    /* someone's playing the guitar: the music drops right back */
    playing(on) { SET_PLAY.k = on ? .22 : 1; duck.gain.setTargetAtTime(BED * musicK * SET_PLAY.k * (talking ? .45 : 1), ctx.currentTime, .25); },
    skip() { lofi.skip && lofi.skip(); },
    /* a line starts: the tv may flicker */
    lineStart() { set.lineStart(); },
    /* the show sets the mix live: voice and music as linear gains (1 = as built) */
    mix({ voice, music } = {}) { const t = ctx.currentTime; if (voice != null) voiceIn.gain.setTargetAtTime(VOICE * voice, t, .1); if (music != null) duck.gain.setTargetAtTime(BED * music * musicK, t, .1); },
    /* a key he pressed: a click and the key bottoming out */
    key(ch) {
      const t = ctx.currentTime + .005, v = .8 + rand() * .35;
      if (ch === ' ') { click(t, 1100 + rand() * 200, .3 * v, .05); thock(t, 150, .12 * v); }
      else if (ch === '\n') { click(t, 1500, .42 * v, .05); thock(t, 170, .16 * v); }
      else { click(t, 2200 + rand() * 1400, .26 * v, .028); thock(t, 190 + rand() * 40, .08 * v); }
    },
    /* every frame or so: where he is from the mic, and whether the music gets out of his way */
    /* away: how far he is from his mic, 0 at his desk .. 1 across the room (his note: "there is a mic source that would go
       lower when octyn is away"): thinner, quieter, more of the room */
    update(t, { speaking = false, lean = 0, away = 0 } = {}) {
      const m = micModel.update(t, lean), now = ctx.currentTime, k = m.bump ? .12 : .35, a = Math.max(0, Math.min(1, away));
      prox.gain.setTargetAtTime(5 - 7 * m.d - 6 * a, now, k); air.gain.setTargetAtTime(-5 * m.d - 3 * a, now, k);
      mic.gain.setTargetAtTime(db(1 - 6 * m.d - 9 * a), now, k); send.gain.setTargetAtTime(.05 + .25 * m.d + .4 * a, now, k);
      if (m.bump) { const g = ctx.createGain(); g.connect(master); click(now + .02, 160, .22, .12, g); }   // his hand on the mic
      if (speaking !== talking) { talking = speaking; duck.gain.setTargetAtTime(BED * musicK * SET_PLAY.k * (speaking ? .45 : 1), now, speaking ? .12 : .7); }
      return m;
    },
  };
}
