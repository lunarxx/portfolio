/* the lofi playlist under the stream (his note, 2026-09-28: "when you stream this time add lofi bg music"): our own
   tracks (spikes/music/lofi_gen.py, served at /music/), every one once before any repeats, never the same one twice in
   a row, back to back with a crossfade, the title in the bar as each starts. no tracks: the page's own generated lofi */
export function order(n, rand = Math.random, last = -1) {
  const o = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  if (n > 1 && o[0] === last) [o[0], o[n - 1]] = [o[n - 1], o[0]];
  return o;
}

export function createPlaylist(ctx, out, { url = '/music/playlist.json', base = '/music/', rand = Math.random, onSong = () => {}, fallback = null, fade = 2.5 } = {}) {
  let tracks = null, queue = [], last = -1, stopped = false, fb = null, cur = null, gen = 0;
  const load = async t => ctx.decodeAudioData(await (await fetch(base + t.file)).arrayBuffer());
  async function play(at) {
    if (stopped) return;
    if (!queue.length) queue = order(tracks.length, rand, last);
    const k = queue.shift(); last = k;
    const t = tracks[k]; let buf;
    try { buf = await load(t); } catch { return play(at); }
    const s = ctx.createBufferSource(), g = ctx.createGain(), start = Math.max(at, ctx.currentTime + .05), end = start + buf.duration;
    s.buffer = buf; s.connect(g); g.connect(out);
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(1, start + fade); g.gain.setValueAtTime(1, end - fade); g.gain.linearRampToValueAtTime(0, end);
    s.start(start); s.stop(end + .05); cur = { g, my: ++gen };
    setTimeout(() => onSong(t), Math.max(0, (start - ctx.currentTime) * 1000));
    const my = gen; setTimeout(() => { if (my === gen) play(end - fade); }, Math.max(0, (end - fade - 8 - ctx.currentTime) * 1000));   // the next one loads early and fades in over this one's end
  }
  (async () => {
    try { tracks = await (await fetch(url)).json(); if (!Array.isArray(tracks) || !tracks.length) throw new Error('no tracks'); }
    catch { if (fallback) fb = fallback(); return; }
    play(ctx.currentTime + .3);
  })();
  return { stop() { stopped = true; }, skip() {
    if (fb) return fb.skip();
    if (!tracks) return;
    if (cur) { const t = ctx.currentTime; cur.g.gain.cancelScheduledValues(t); cur.g.gain.setValueAtTime(cur.g.gain.value, t); cur.g.gain.linearRampToValueAtTime(0, t + .6); }
    gen++; play(ctx.currentTime + .4);
  } };
}
