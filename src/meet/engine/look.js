/* the look: renderer, the lab's palette, materials and shape helpers, and the pixel pass (ink outlines from depth and
   normals, soft vignette, gentle ordered dither, palette snap in srgb) at 320x180. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* 320x180 for the stream; a reel's page asks for its own (?w=180&h=320: 9:16 at the same pixel size) */
const SIZE = new URLSearchParams(location.search);
export const W = +(SIZE.get('w') || 320), H = +(SIZE.get('h') || 180);
export const hex = h => new THREE.Color(h);
/* the lab palette (rig/raster.js), the room's own colours (rig/pixel.js), and a few the studio redraw uses */
export const PAL = ['#0E0F12', '#1B1D22', '#272A31', '#363A42', '#4A4F59', '#6B707A', '#9A9D9F', '#D8D2C4', '#E3A94F', '#B97A2E', '#F1D9A8', '#7D5A45',
  '#5A3F31', '#8FA38A', '#3F5A4A', '#A9543F', '#EDE8DD', '#E8E4DA', '#C9C3B6', '#CFCBC2', '#A8A39A', '#5E626A', '#474B53', '#C98A7A', '#4D5E78',
  '#6E6B45', '#6E3434', '#4A3A30', '#221E1B', '#2B2521', '#352D27', '#1A1715', '#5A3A33', '#46302A', '#C9BFAE', '#4F5A48', '#B67E58', '#8D5B3C',
  '#34373D', '#D06A3A', '#F4C77E', '#7A4A2E', '#3A2E26', '#61707A', '#3B4A63', '#8E7456', '#5B6B4E', '#2F3A52', '#B9A68E', '#8A7E70'];   // the last two: warm-lit greys (else they snap to rose)
export const C = { wall: '#2B2521', wall2: '#352D27', trim: '#1A1715', floor: '#3A2E26', rug: '#5A3A33', rug2: '#46302A', wood: '#7D5A45', bark: '#5A3F31', cocoa: '#4A3A30',
  oak: '#8E7456', ink: '#0E0F12', night: '#1B1D22', coal: '#272A31', slate: '#363A42', steel: '#4A4F59', fog: '#6B707A', ash: '#9A9D9F', paper: '#D8D2C4', white: '#EDE8DD',
  amber: '#E3A94F', ember: '#B97A2E', cream: '#F1D9A8', glow: '#F4C77E', sage: '#8FA38A', moss: '#3F5A4A', leaf: '#5B6B4E', brick: '#A9543F', denim: '#4D5E78', navy: '#2F3A52',
  jeans: '#3B4A63', maroon: '#6E3434', olive: '#6E6B45', shell: '#CFCBC2', shell2: '#A8A39A', glove: '#E8E4DA', glove2: '#C9C3B6', skin: '#B67E58', skin2: '#8D5B3C',
  tee: '#6B707A', tee2: '#5E626A', shade: '#D06A3A', sheet: '#C9BFAE', blanket: '#4F5A48', rose: '#C98A7A' };

export const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, preserveDrawingBuffer: true });
/* the canvas: W x H stays the size of his pixels and the shape of every camera; the room is painted at this finer size */
const TOUCH = matchMedia('(pointer: coarse)').matches, RW = TOUCH ? 640 : 960, RH = RW * H / W;
renderer.setSize(RW, RH, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
export const scene = new THREE.Scene(); scene.background = hex('#120F0D');

/* flat toon bands (the brightest below white so lit cream and skin don't blow out) for things; soft light where wanted */
const grad = (() => { const d = new Uint8Array([55, 55, 55, 255, 115, 115, 115, 255, 175, 175, 175, 255, 220, 220, 220, 255]); const t = new THREE.DataTexture(d, 4, 1); t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
export const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: hex(c), gradientMap: grad, ...o });
export const soft = (c, o = {}) => new THREE.MeshLambertMaterial({ color: hex(c), ...o });
export const flat = c => new THREE.MeshBasicMaterial({ color: hex(c) });
export function tex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.LinearFilter; t.colorSpace = THREE.SRGBColorSpace; return t; }
export function add(parent, geo, m, x = 0, y = 0, z = 0, cast = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o; }
export const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const RB = (w, h, d, r = .01) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
export const CY = (r0, r1, h, s = 12) => new THREE.CylinderGeometry(r1, r0, h, s);
export const SP = (r, s = 10) => new THREE.SphereGeometry(r, s, Math.max(6, Math.round(s * .7)));
export const CAP = (r, l, s = 8) => new THREE.CapsuleGeometry(r, l, 3, s);
export function plane(parent, w, h, t, x, y, z, lit = true) { return add(parent, new THREE.PlaneGeometry(w, h), lit ? new THREE.MeshLambertMaterial({ map: t, transparent: true }) : new THREE.MeshBasicMaterial({ map: t, transparent: true }), x, y, z, false); }
/* a soft glow painted over what's behind it (the painting's halos): additive, hidden from the outline pass */
const glowTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
export const glows = [];
export function glowSpot(x, y, z, size, color, alpha) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: hex(color), opacity: alpha, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.position.set(x, y, z); s.scale.set(size, size, 1); scene.add(s); glows.push(s); return s; }

/* ---------- the final pass: he's pixel, the room is watercolour ---------- */
const rt = new THREE.WebGLRenderTarget(RW, RH, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.HalfFloatType }); rt.depthTexture = new THREE.DepthTexture(RW, RH);
const rtN = new THREE.WebGLRenderTarget(RW, RH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
/* the normals pass also says what's him, in its alpha: the room writes 0, then he's drawn again over it writing 1 (against
   the same depth, so his desk and his screen still cover him) */
const normalRoom = new THREE.MeshNormalMaterial({ transparent: true, opacity: 0, blending: THREE.NoBlending, side: THREE.DoubleSide }), normalHim = new THREE.MeshNormalMaterial({ transparent: true, opacity: 1, blending: THREE.NoBlending, side: THREE.DoubleSide });
const HIM = 31, CRISP = 30;
/* small things with fine detail (the rubik's cube) skip the paint's softening, or they turn to mush: alpha .4 in the normals pass */
const normalCrisp = new THREE.MeshNormalMaterial({ transparent: true, opacity: .4, blending: THREE.NoBlending, side: THREE.DoubleSide });
export const markCrisp = root => root.traverse(o => o.layers.enable(CRISP));
export const markHim = root => root.traverse(o => o.layers.enable(HIM));
/* straight from the hex, in srgb (THREE.Color hands back linear values, and the snap works in srgb) */
const palette = PAL.map(h => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255));
const post = new THREE.ShaderMaterial({
  uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, tNormal: { value: rtN.texture }, pal: { value: palette }, res: { value: new THREE.Vector2(W * 1.5, H * 1.5) }, fine: { value: new THREE.Vector2(RW, RH) }, boil: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D tColor, tDepth, tNormal; uniform vec3 pal[${PAL.length}]; uniform vec2 res, fine; uniform float boil;
    float bayer(vec2 p){ int x = int(mod(p.x, 4.)), y = int(mod(p.y, 4.)); int i = x + y * 4;
      float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
      for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16. - .5; return 0.; }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
    float fbm(vec2 p){ return vn(p) * .55 + vn(p * 2.1 + 3.1) * .3 + vn(p * 4.3 + 7.7) * .15; }
    /* him: the pixel pass as it always was, read on his 320x180 grid */
    vec3 pixelHim(vec2 uv, vec2 px, vec2 at){
      vec3 c = texture2D(tColor, uv).rgb;
      float d = texture2D(tDepth, uv).r; vec3 n = texture2D(tNormal, uv).rgb * 2. - 1.; float e = 0.;
      for (int k = 0; k < 2; k++) { vec2 o = k == 0 ? vec2(px.x, 0.) : vec2(0., -px.y);
        float d2 = textureLod(tDepth, uv + o, 0.).r; vec3 n2 = textureLod(tNormal, uv + o, 0.).rgb * 2. - 1.;
        if (abs(d2 - d) > .004) e = 1.; if (dot(n, n2) < .72 && abs(d2 - d) > .0004) e = 1.; }
      c = pow(c, vec3(1. / 2.2)) + bayer(at) * .028;
      vec3 best = pal[0]; float bd = 1e9;
      for (int k = 0; k < ${PAL.length}; k++) { vec3 w = pal[k] - c; float dd = dot(w * vec3(.3, .59, .11), w); if (dd < bd) { bd = dd; best = pal[k]; } }
      return e > .5 ? pal[0] : best;
    }
    /* the room: the skits' watercolour (cast3d's look), pigment on paper. shapes wobble a little, colour goes soft, the
       pigment is uneven inside a wash and pools where two things meet, a thin warm line boils over it, the paper's tooth
       stays put */
    vec3 paint(vec2 at){
      vec2 h = 1. / fine;
      vec2 uv = at + (vec2(fbm(at * 8.), fbm(at * 8. + 11.3)) - .5) * h * 5. + (vec2(vn(at * 46. + boil), vn(at * 46. + boil + 5.)) - .5) * h * 1.6;
      vec3 c = vec3(0.); float r = 2.2;
      c += texture2D(tColor, uv).rgb * .28;
      c += texture2D(tColor, uv + vec2(r, 0.) * h).rgb * .18; c += texture2D(tColor, uv - vec2(r, 0.) * h).rgb * .18;
      c += texture2D(tColor, uv + vec2(0., r) * h).rgb * .18; c += texture2D(tColor, uv - vec2(0., r) * h).rgb * .18;
      c = pow(max(c, vec3(0.)), vec3(1. / 2.2));
      float e = 0.; vec3 n = texture2D(tNormal, uv).rgb; float d = texture2D(tDepth, uv).r;
      for (int k = 0; k < 4; k++) { vec2 o = (k == 0 ? vec2(1., 0.) : k == 1 ? vec2(-1., 0.) : k == 2 ? vec2(0., 1.) : vec2(0., -1.)) * h * 1.4;
        vec3 n2 = textureLod(tNormal, uv + o, 0.).rgb; float d2 = textureLod(tDepth, uv + o, 0.).r;
        e = max(e, smoothstep(.18, .5, length(n - n2))); e = max(e, smoothstep(.0012, .006, abs(d - d2))); }
      vec3 paper = vec3(.949, .925, .878);
      vec3 wash = pow(c, vec3(.58));                                  // lifted off the dark, so it reads as pigment and not as night
      wash = mix(vec3(dot(wash, vec3(.3, .59, .11))), wash, 1.25);    // and keeps its colour
      float pig = fbm(at * 15.);
      wash *= .9 + .2 * pig;
      vec3 out3 = paper * mix(vec3(1.), clamp(wash, 0., 1.), .94);
      out3 *= 1. - .22 * e * (.6 + .8 * vn(at * 60.));                // pooled at the edge
      out3 = mix(out3, vec3(.27, .2, .22), .42 * smoothstep(.45, 1., e));  // the thin warm line
      out3 *= 1. + (hash(floor(gl_FragCoord.xy)) - .5) * .06;         // the paper's tooth
      vec2 q = at - .5; out3 *= 1. - dot(q, q) * .22;
      return out3;
    }
    void main(){
      vec2 px = 1. / res, cell = (floor(vUv * res) + .5) * px;
      if (texture2D(tNormal, cell).a > .5) { vec2 q = cell - .5; gl_FragColor = vec4(pixelHim(cell, px, floor(cell * res)) * (1. - dot(q, q) * .2), 1.); return; }
      /* one pixel of ink round him, so he sits on the painting like a sticker */
      float ring = max(max(texture2D(tNormal, cell + vec2(px.x, 0.)).a, texture2D(tNormal, cell - vec2(px.x, 0.)).a), max(texture2D(tNormal, cell + vec2(0., px.y)).a, texture2D(tNormal, cell - vec2(0., px.y)).a));
      float here = texture2D(tNormal, vUv).a;
      if (ring <= .5 && here > .2 && here < .6) { vec3 c = pow(max(texture2D(tColor, vUv).rgb, vec3(0.)), vec3(1. / 2.2)); gl_FragColor = vec4(c, 1.); return; }
      gl_FragColor = vec4(ring > .5 ? pal[0] : paint(vUv), 1.);
    }` });
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
function passes(cam) {
  renderer.shadowMap.autoUpdate = true;
  renderer.setRenderTarget(rt); renderer.render(scene, cam);
  renderer.shadowMap.autoUpdate = false;   // the colour pass made them; the rest of the frame reuses them
  glows.forEach(g => g.visible = false);
  const bg = scene.background, auto = renderer.autoClear, mask = cam.layers.mask;
  scene.background = null; renderer.setClearColor(0x000000, 0);
  scene.overrideMaterial = normalRoom; renderer.setRenderTarget(rtN); renderer.render(scene, cam);
  renderer.autoClear = false; cam.layers.set(HIM); scene.overrideMaterial = normalHim; renderer.render(scene, cam);
  cam.layers.set(CRISP); scene.overrideMaterial = normalCrisp; renderer.render(scene, cam);
  cam.layers.mask = mask; renderer.autoClear = auto; scene.overrideMaterial = null; scene.background = bg;
  glows.forEach(g => g.visible = true);
  post.uniforms.boil.value = Math.floor(performance.now() / 125);   // on twos, like the visitor's character
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}
/* one frame from a camera, through the final pass, onto the canvas (live: nothing else) */
export function render(cam) { passes(cam); }
/* one frame from a camera, through the final pass, as a png data url (stills and offline capture) */
export function shoot(cam) { passes(cam); return document.getElementById('c').toDataURL('image/png'); }
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
