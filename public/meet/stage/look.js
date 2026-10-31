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
renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
export const scene = new THREE.Scene(); scene.background = hex('#120F0D');

/* flat toon bands (the brightest below white so lit cream and skin don't blow out) for things; soft light where wanted */
const grad = (() => { const d = new Uint8Array([55, 55, 55, 255, 115, 115, 115, 255, 175, 175, 175, 255, 220, 220, 220, 255]); const t = new THREE.DataTexture(d, 4, 1); t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
export const toon = (c, o = {}) => new THREE.MeshToonMaterial({ color: hex(c), gradientMap: grad, ...o });
export const soft = (c, o = {}) => new THREE.MeshLambertMaterial({ color: hex(c), ...o });
export const flat = c => new THREE.MeshBasicMaterial({ color: hex(c) });
export function tex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t; }
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

/* ---------- the pixel pass ---------- */
const rt = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType }); rt.depthTexture = new THREE.DepthTexture(W, H);
const rtN = new THREE.WebGLRenderTarget(W, H, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const normalMat = new THREE.MeshNormalMaterial();
/* straight from the hex, in srgb (THREE.Color hands back linear values, and the snap works in srgb) */
const palette = PAL.map(h => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255));
const post = new THREE.ShaderMaterial({
  uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, tNormal: { value: rtN.texture }, pal: { value: palette }, res: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D tColor, tDepth, tNormal; uniform vec3 pal[${PAL.length}]; uniform vec2 res;
    float bayer(vec2 p){ int x = int(mod(p.x, 4.)), y = int(mod(p.y, 4.)); int i = x + y * 4;
      float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
      for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16. - .5; return 0.; }
    void main(){
      vec2 px = 1. / res; vec3 c = texture2D(tColor, vUv).rgb;
      float d = texture2D(tDepth, vUv).r; vec3 n = texture2D(tNormal, vUv).rgb * 2. - 1.; float e = 0.;
      for (int k = 0; k < 2; k++) { vec2 o = k == 0 ? vec2(px.x, 0.) : vec2(0., -px.y);
        float d2 = texture2D(tDepth, vUv + o).r; vec3 n2 = texture2D(tNormal, vUv + o).rgb * 2. - 1.;
        if (abs(d2 - d) > .004) e = 1.; if (dot(n, n2) < .72 && abs(d2 - d) > .0004) e = 1.; }
      vec2 q = vUv - .5; c *= 1. - dot(q, q) * .35;
      c = pow(c, vec3(1. / 2.2)) + bayer(gl_FragCoord.xy) * .028;
      vec3 best = pal[0]; float bd = 1e9;
      for (int k = 0; k < ${PAL.length}; k++) { vec3 w = pal[k] - c; float dd = dot(w * vec3(.3, .59, .11), w); if (dd < bd) { bd = dd; best = pal[k]; } }
      if (e > .5) best = pal[0];
      gl_FragColor = vec4(best, 1.);
    }` });
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
/* one frame from a camera, through the pixel pass, onto the canvas (live: nothing else) */
export function render(cam) {
  renderer.setRenderTarget(rt); renderer.render(scene, cam);
  glows.forEach(g => g.visible = false);
  scene.overrideMaterial = normalMat; renderer.setRenderTarget(rtN); renderer.render(scene, cam); scene.overrideMaterial = null;
  glows.forEach(g => g.visible = true);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}
/* one frame from a camera, through the pixel pass, as a png data url (stills and offline capture) */
export function shoot(cam) {
  renderer.setRenderTarget(rt); renderer.render(scene, cam);
  glows.forEach(g => g.visible = false);
  scene.overrideMaterial = normalMat; renderer.setRenderTarget(rtN); renderer.render(scene, cam); scene.overrideMaterial = null;
  glows.forEach(g => g.visible = true);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  return document.getElementById('c').toDataURL('image/png');
}
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
