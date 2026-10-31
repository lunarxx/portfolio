// your character in the call: the real skits cast (octyn-skits/work/blob_<name>.blend, exported by
// world/blob/export.py), posed live, in the skits' watercolour (ink.py, style 'water'): the parts in their colours with
// one soft shade away from a light up and to the left, pigment uneven inside a part and pooled at its edges, grained
// into the paper, a thin warm line round every part that boils on twos. the face is drawn after, from blobface.py's
// strokes, where the head is and the way it's turned, only on the head's own pixels.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
export const W = 640, H = 360

export const CAST = {
  Rory: { base: 'rory', skin: '#4FC6B8', top: '#2F3A52' },
  Pip: { base: 'pip', skin: '#B5E05A', top: '#D9483B' },
  Gus: { base: 'gus', skin: '#F27FB8', top: '#6E7A3A' },
  Theo: { base: 'theo', skin: '#6FB7F0', top: '#EDE3CF' },
  Dale: { base: 'dale', skin: '#F5B860', top: '#F2EEE6' },
}
export const SKINS = ['#4FC6B8', '#B5E05A', '#F27FB8', '#6FB7F0', '#F5B860', '#B08CE8', '#F28C6B', '#E8D46A']
export const TOPS = ['#2F3A52', '#D9483B', '#6E7A3A', '#EDE3CF', '#F2EEE6', '#E3A94F', '#4A4A4A', '#8FA38A']

// colours as the skits make them (palettes.py): top2 a shade of the top, the collar a line colour, strings cream
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
function hls(h, f, sat = 0) {   // colorsys-style lightness scale
  let [r, g, b] = rgb(h); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), L = (mx + mn) / 2, d = mx - mn
  let S = d === 0 ? 0 : L > .5 ? d / (2 - mx - mn) : d / (mx + mn), Hh = 0
  if (d) Hh = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) / 6
  const L2 = Math.min(1, L * f), S2 = Math.min(1, S + sat), q = L2 < .5 ? L2 * (1 + S2) : L2 + S2 - L2 * S2, p = 2 * L2 - q
  const t = (x) => { x = (x + 1) % 1; return x < 1 / 6 ? p + (q - p) * 6 * x : x < .5 ? q : x < 2 / 3 ? p + (q - p) * (2 / 3 - x) * 6 : p }
  return S2 === 0 ? [L2, L2, L2] : [t(Hh + 1 / 3), t(Hh), t(Hh - 1 / 3)]
}
function partColour(look, part) {
  return { skin: rgb(look.skin), top: rgb(look.top), top2: hls(look.top, .8, .04), bottom: rgb('#CDB083'), bottom2: hls('#CDB083', .8),
    shoe: rgb('#F4F1EA'), sole: rgb('#3A332D'), collar: rgb('#2A1F1A'), string: rgb('#F4F1EA') }[part] || [1, 0, 1]
}
// which outline group a mesh belongs to (blob.py's groups): a line goes between groups and between parts
// (the loader drops the dots from node names: rory.sleeve.R arrives as rorysleeveR)
const groupOf = (n) => /head$/.test(n) ? 1 : /neck|hood/.test(n) ? 2 : /(sleeve|cuff)R$/.test(n) ? 3 : /(sleeve|cuff)L$/.test(n) ? 4
  : /(palm|index|middle|ring|pinky|thumb|wrist)R$/.test(n) ? 5 : /(palm|index|middle|ring|pinky|thumb|wrist)L$/.test(n) ? 6 : /pant|cargo|seat/.test(n) ? 7 : /shoe|sole/.test(n) ? 8 : 9
const PARTS = ['skin', 'top', 'top2', 'bottom', 'bottom2', 'shoe', 'sole', 'collar', 'string']

const VERT = `
#include <common>
#include <skinning_pars_vertex>
varying vec3 vN, vP; varying float vZ;
void main() {
  vP = position;   // where on the body, at rest: the paint is pinned here and moves with him
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <beginnormal_vertex>
  #include <skinnormal_vertex>
  #include <skinning_vertex>
  vN = normalize(mat3(modelMatrix) * objectNormal);
  #include <project_vertex>
  vZ = -mvPosition.z;
}`
const FRAG = `
precision highp float;
uniform vec3 col, col2; uniform float id, pattern, seed, yoke;
varying vec3 vN, vP; varying float vZ;
layout(location = 0) out vec4 gCol;
layout(location = 1) out vec4 gId;
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z) * 2. - 1.; }
void main() {
  vec3 base = col;
  // a pattern on the cloth, in the cloth (stripes round him, spots, a two-tone yoke)
  if (pattern > .5 && pattern < 1.5) base = mix(col, col2, step(.5, fract(vP.y / 5.5)));
  if (pattern > 1.5 && pattern < 2.5) { vec3 q = vP / 4.2; vec3 c0 = floor(q) + .5; base = mix(col, col2, step(length(q - c0 - vec3(0., 0., 0.)), .28)); }
  if (pattern > 2.5) base = mix(col, col2, step(yoke, vP.y));
  vec3 L = normalize(vec3(-.5, .67, .55));                       // ink.py's light, up and to the left, toward us
  float d = dot(normalize(vN), L);
  vec3 c = base * mix(vec3(.86, .85, .9), vec3(1.), smoothstep(-.12, .02, d));   // one soft shade
  // pigment uneven inside a part (ink.py's two noise scales), in the body's own space so it travels with him
  c *= 1. + n3(vP / 9. + seed) * .07 + n3(vP / 2.2 + seed * 3.) * .04;
  gCol = vec4(c, 1.);
  gId = vec4(id / 255., vZ / 400., 0., 1.);
}`
const POST = `
precision highp float;
uniform sampler2D tCol, tId, tFace; uniform vec2 res; uniform float boil; uniform vec3 glow;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y) * 2. - 1.; }
float idAt(vec2 px) { return floor(texture2D(tId, px / res).r * 255. + .5); }
float zAt(vec2 px) { float i = idAt(px); return i > 0. ? texture2D(tId, px / res).g : 99.; }
void main() {
  vec2 px = vUv * res;
  float id = idAt(px);
  vec3 paper = vec3(.949, .925, .878);
  float glowK = exp(-pow(length((vUv - vec2(.5, .58)) * vec2(1.6, 1.)) / .55, 2.));
  vec3 rgb = mix(paper, paper * mix(vec3(1.), glow, .35), glowK);
  if (id > 0.) {
    vec3 c = texture2D(tCol, vUv).rgb;
    // pigment pools at a part's edge: how much of the ring round here is another part
    float other = 0., tot = 0.;
    for (int k = 0; k < 12; k++) { float a = float(k) * .5236; for (int r = 1; r <= 3; r++) { float rr = float(r) * 2.2;
      other += (idAt(px + vec2(cos(a), sin(a)) * rr) != id ? 1. : 0.) / float(r); tot += 1. / float(r); } }
    float pool = other / tot;
    float grain = (hash(floor(px)) - .5) * .07;                     // the paper's tooth stays put: it's the paper
    c *= 1. + grain - .45 * pool;
    c = c * .82 + .18 * (1. - (1. - c) * .55);                     // lighter, like a wash
    vec4 f = texture2D(tFace, vUv);
    if (floor(id / 16.) == 1.) c = mix(c, f.rgb, f.a);   // the face only lands on his head
    rgb = c;
  }
  // the line: on the nearer side of a part boundary, pushed about by a slow noise field that boils on twos
  vec2 j = vec2(vnoise(px / 22. + boil * 7.31), vnoise(px / 22. + 40. + boil * 3.17)) * 1.1;
  vec2 q = px + j; float iq = idAt(q), zq = zAt(q), a = 0.;
  for (int k = 0; k < 8; k++) { float ang = float(k) * .7854; vec2 o = vec2(cos(ang), sin(ang)) * 1.35;
    float io = idAt(q + o); if (io != iq && (iq > 0.) && zq <= zAt(q + o) + .0001) a = 1.;
    if (iq > 0. && io == iq && zAt(q + o) - zq > .04 * zq) a = 1.; }
  rgb = mix(rgb, vec3(.29, .227, .267), a * .78);
  rgb *= 1. + .035 * (hash(floor(px) + 7.) - .5) * 2. + .02 * vnoise(px / 40.) - .02;
  gl_FragColor = vec4(rgb, 1.);
}`


// the customiser's choices (the page builds its buttons from these)
export const OPTIONS = {
  pattern: [['plain', 'Plain'], ['stripes', 'Stripes'], ['spots', 'Spots'], ['yoke', 'Two-tone']],
  hat: [['none', 'None'], ['beanie', 'Beanie'], ['cap', 'Cap'], ['bucket', 'Bucket'], ['headphones', 'Headphones'], ['party', 'Party hat'], ['sprout', 'Sprout']],
  eyes: [['dots', 'Dots'], ['tall', 'Tall'], ['round', 'Round'], ['lashes', 'Lashes'], ['sleepy', 'Sleepy']],
  cheeks: [['none', 'None'], ['blush', 'Blush'], ['freckles', 'Freckles']],
}
export const ACCENTS = ['#F2EEE6', '#E3A94F', '#2F3A52', '#D9483B', '#8FA38A', '#F27FB8', '#4A4A4A', '#6FB7F0']
export const DEFAULT_LOOK = { pattern: 'plain', accent: '#F2EEE6', hat: 'none', hatColour: '#E3A94F', eyes: 'dots', cheeks: 'none', glasses: false, head: 1 }
const PATTERN = { plain: 0, stripes: 1, spots: 2, yoke: 3 }

export async function createCast() {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, alpha: false })
  renderer.setSize(W * 2, H * 2, false); renderer.outputColorSpace = THREE.LinearSRGBColorSpace
  const rt = new THREE.WebGLRenderTarget(W * 2, H * 2, { count: 2, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.HalfFloatType })
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 2000)
  const face = document.createElement('canvas'); face.width = W * 2; face.height = H * 2
  const fg = face.getContext('2d'), faceTex = new THREE.CanvasTexture(face)
  const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: POST,
    uniforms: { tCol: { value: rt.textures[0] }, tId: { value: rt.textures[1] }, tFace: { value: faceTex }, res: { value: new THREE.Vector2(W * 2, H * 2) }, boil: { value: 0 }, glow: { value: new THREE.Vector3(1, 1, 1) } } }))
  const postScene = new THREE.Scene(); postScene.add(post); const postCam = new THREE.Camera()
  const loader = new GLTFLoader(), models = {}
  let cur = null, headAt = null
  const material = (id, part, seed) => {
    const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, glslVersion: THREE.GLSL3,
      uniforms: { col: { value: new THREE.Vector3() }, col2: { value: new THREE.Vector3() }, id: { value: id }, pattern: { value: 0 }, seed: { value: seed }, yoke: { value: 0 } } })
    m.userData.part = part; return m
  }

  async function load(base) {
    if (models[base]) return models[base]
    const g = await loader.loadAsync(new URL(`./cast/${base}.glb`, import.meta.url).href), root = g.scene, mats = [], seed = base.length * 3.7
    root.traverse((o) => {
      if (!o.isMesh) return
      const part = (o.material.name || '').split('.').pop(), grp = groupOf(o.name), pi = Math.max(0, PARTS.indexOf(part))
      o.material = material(grp * 16 + pi, part, seed); mats.push(o.material); o.frustumCulled = false
    })
    root.updateMatrixWorld(true)
    const bones = {}; root.traverse((o) => { if (o.isBone) bones[o.name] = o })
    // where his head is (the rig's HC point and its front and up), carried by the head bone
    const head = root.getObjectByName(`${base}head`), box = new THREE.Box3().setFromObject(head), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3())
    const hb = bones.head, inv = hb.matrixWorld.clone().invert()
    const H0 = { c: c.clone().applyMatrix4(inv), f: c.clone().add(new THREE.Vector3(0, 0, size.z / 2)).applyMatrix4(inv), u: c.clone().add(new THREE.Vector3(0, size.y / 2, 0)).applyMatrix4(inv), r: size.x / 2, size }
    const rest = {}; for (const [n, b] of Object.entries(bones)) rest[n] = { q: b.getWorldQuaternion(new THREE.Quaternion()), p: b.getWorldPosition(new THREE.Vector3()) }
    const frame = { top: box.max.y + size.y * .42, h: size.y * 2.2 }   // head and shoulders, like a webcam, room for a hat
    for (const mm of mats) mm.uniforms.yoke.value = box.min.y - size.y * .45
    models[base] = { root, mats, bones, H0, rest, frame, hats: {}, hat: null, seed, headMesh: head, headBox: box, headRest: head.matrixWorld.clone(), headInv: inv }
    return models[base]
  }

  // hats, fitted: the crown is his own head's surface above a line, pushed out a little (so a hat fits every head and
  // nothing pokes through), then a band, brim, pom or whatever the hat has. built where he stands at rest, then carried
  // into the head bone, so it turns and nods with him
  function hat(m, kind) {
    if (m.hat) { m.hat.visible = false; m.hat = null }
    if (kind === 'none') return
    if (!m.hats[kind]) {
      const hb = m.bones.head, hm = m.headMesh, box = m.headBox, h = box.max.y - box.min.y, g = new THREE.Group(), mats = []
      const toBone = m.headInv, grow = h * .035
      const add = (geo, which) => {
        const mat = material(10 * 16 + (which === 'main' ? 1 : 2), which === 'main' ? 'hat' : 'hat2', m.seed + 5); mats.push(mat)
        geo.applyMatrix4(toBone); geo.computeVertexNormals(); const me = new THREE.Mesh(geo, mat); me.frustumCulled = false; g.add(me)
      }
      const at = (geo, x, y, z, sx = 1, sy = 1, sz = 1, rz = 0) => geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz)), new THREE.Vector3(sx, sy, sz)))
      // a slice of his own head: every point pushed out along its normal, then squashed between two heights and spread
      // round the middle (a crown is the top of the head, a band a thin ring of it, a brim a flat spread ring). it
      // follows his head's exact shape, so nothing shows through and nothing is boxy
      function slice(lo, hi, push, spread = 1) {
        const src = hm.geometry, P = src.attributes.position, N = src.attributes.normal, Mw = m.headRest, Nm = new THREE.Matrix3().getNormalMatrix(Mw)
        const pos = new Float32Array(P.count * 3), r = ring((lo + hi) / 2)
        for (let i = 0; i < P.count; i++) {
          const p = new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(Mw), n = new THREE.Vector3().fromBufferAttribute(N, i).applyMatrix3(Nm).normalize()
          p.addScaledVector(n, push); p.y = Math.min(hi, Math.max(lo, p.y))
          p.x = r.cx + (p.x - r.cx) * spread; p.z = r.cz + (p.z - r.cz) * spread; pos.set([p.x, p.y, p.z], i * 3)
        }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); if (src.index) geo.setIndex(src.index.clone()); return geo
      }
      // how wide his head is at a height
      function ring(y) {
        const P = hm.geometry.attributes.position, Mw = m.headRest; let ex = 0, ez = 0, cx = 0, cz = 0, n = 0
        for (let i = 0; i < P.count; i++) { const p = new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(Mw); if (Math.abs(p.y - y) < h * .08) { cx += p.x; cz += p.z; n++ } }
        cx /= n || 1; cz /= n || 1
        for (let i = 0; i < P.count; i++) { const p = new THREE.Vector3().fromBufferAttribute(P, i).applyMatrix4(Mw); if (Math.abs(p.y - y) < h * .08) { ex = Math.max(ex, Math.abs(p.x - cx)); ez = Math.max(ez, Math.abs(p.z - cz)) } }
        return { cx, cz, ex: ex + grow, ez: ez + grow }
      }
      const top = box.max.y, cxz = ring(top - h * .15), T = top + grow * 2
      // the beanie's turned-up band sits on the brow, clear of the eyes
      if (kind === 'beanie') { const cut = top - h * .36; add(slice(cut, T, grow), 'main'); add(slice(cut - h * .01, cut + h * .11, grow * 2.2), 'trim'); add(at(new THREE.SphereGeometry(h * .1, 14, 10), cxz.cx, T + h * .07, cxz.cz), 'trim') }
      // the cap worn turned to the side: a round crown, the brim out over one ear, tipped a touch
      if (kind === 'cap') {
        const cut = top - h * .34; add(slice(cut, T, grow), 'main'); const r = ring(cut)
        const brim = new THREE.CylinderGeometry(1, 1, h * .045, 36, 1, false, -Math.PI / 2, Math.PI)
        brim.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(0, 0, .55), new THREE.Quaternion(), new THREE.Vector3(.75, 1, 1.15)))   // a half disc, out in front of the crown's edge
        brim.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(r.cx, cut + h * .02, r.cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(-.12, .85, 0, 'YXZ')), new THREE.Vector3(r.ex, 1, r.ez)))
        add(brim, 'trim'); add(slice(cut - h * .01, cut + h * .05, grow * 1.6), 'main')
      }
      if (kind === 'bucket') { const cut = top - h * .38; add(slice(cut, T, grow), 'main'); add(slice(cut - h * .03, cut, grow * 1.5, 1.32), 'trim') }
      if (kind === 'headphones') { const r = ring(top - h * .5); add(at(new THREE.TorusGeometry(1, .06, 10, 40, Math.PI), r.cx, top - h * .5, r.cz, r.ex * 1.04, h * .56, r.ex * 1.04), 'main'); for (const sd of [-1, 1]) add(at(new THREE.CylinderGeometry(h * .16, h * .16, h * .12, 20), r.cx + sd * (r.ex + h * .02), top - h * .52, r.cz, 1, 1, 1, Math.PI / 2), 'trim') }
      if (kind === 'party') { add(at(new THREE.ConeGeometry(h * .2, h * .55, 28), cxz.cx + h * .06, top + h * .22, cxz.cz, 1, 1, 1, -.22), 'main'); add(at(new THREE.SphereGeometry(h * .055, 12, 8), cxz.cx + h * .17, top + h * .5, cxz.cz), 'trim') }
      if (kind === 'sprout') { add(at(new THREE.CylinderGeometry(h * .012, h * .018, h * .2, 8), cxz.cx, top + h * .09, cxz.cz), 'trim'); for (const sd of [-1, 1]) add(at(new THREE.SphereGeometry(1, 16, 10), cxz.cx + sd * h * .08, top + h * .2, cxz.cz, h * .09, h * .035, h * .055, sd * .5), 'main') }
      hb.add(g); g.userData.mats = mats; m.hats[kind] = g
    }
    m.hat = m.hats[kind]; m.hat.visible = true
  }

  // a bone's world rotation set to (a rotation) x (its rest), whatever axes the export gave it
  const _pq = new THREE.Quaternion()
  function worldRot(b, q, rest) { b.parent.getWorldQuaternion(_pq); b.quaternion.copy(_pq.invert().multiply(q).multiply(rest.q)); b.updateMatrixWorld(true) }
  const aim = (from, to) => new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(), to.clone().normalize())
  const V = (a) => new THREE.Vector3(...a)
  // a hand's frame from its fingers and the line across its knuckles; (across, fingers, normal) is right-handed, a true rotation
  const frameQ = (f, a) => { f = f.clone().normalize(); const n = new THREE.Vector3().crossVectors(f, a).normalize(), ac = new THREE.Vector3().crossVectors(f, n); return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(ac, f, n)) }
  function arm(m, side, dirs) {
    const up = m.bones[`upper${side}`], fo = m.bones[`fore${side}`]; if (!up || !fo) return
    const R = m.rest, d0 = R[`fore${side}`].p.clone().sub(R[`upper${side}`].p), d1 = R[`hand${side}`].p.clone().sub(R[`fore${side}`].p)
    const q1 = aim(d0, dirs.upper); worldRot(up, q1, R[`upper${side}`])
    const q2 = aim(d1.clone().applyQuaternion(q1), dirs.fore).multiply(q1); worldRot(fo, q2, R[`fore${side}`])
    const hb = m.bones[`hand${side}`]; if (!hb) return
    if (!dirs.palm) { worldRot(hb, q2, R[`hand${side}`]); return }
    // the hand as your hand is: the palm's frame (fingers, across the knuckles) from the hand tracker, then every finger bone
    const B = (n) => R[`${n}${side}`]?.p, fR = B('middle0').clone().sub(R[`hand${side}`].p), aR = B('index0').clone().sub(B('pinky0'))
    const qh = frameQ(V(dirs.palm.fingers), V(dirs.palm.across)).multiply(frameQ(fR, aR).invert())
    worldRot(hb, qh, R[`hand${side}`])
    for (const [n, segs] of Object.entries(dirs.palm.bones)) {
      let qa = qh
      for (let i = 0; i < 3; i++) {
        const b = m.bones[`${n}${i}${side}`]; if (!b) break
        const next = B(`${n}${i + 1}`), prev = i ? B(`${n}${i - 1}`) : null
        const dr = next ? next.clone().sub(B(`${n}${i}`)) : B(`${n}${i}`).clone().sub(prev)
        const qi = aim(dr.applyQuaternion(qa), V(segs[i])).multiply(qa); worldRot(b, qi, R[`${n}${i}${side}`]); qa = qi
      }
    }
  }

  // blobface.py's strokes, made continuous: every expression channel moves the face a little, none flips it
  const EYES = { dots: [.62, 1.25], tall: [.62, 1.7], round: [.95, .95], lashes: [.62, 1.25], sleepy: [.62, 1.25] }
  function strokes(x, look) {
    const S = [], ey = -1.4, [ew, eh] = EYES[look.eyes] || EYES.dots
    const happy = (x.smile > .55 && x.squint > .2) || x.smile > .8
    for (const [side, bl] of [[-1, x.blinkL], [1, x.blinkR]]) {
      const x0 = side * 4.6 + (x.lookX || 0) * .9, y0 = ey - (x.lookY || 0) * .5
      if (bl > .6) S.push(['line', happy ? [[x0 - 1.1, ey + .6], [x0, ey - .3], [x0 + 1.1, ey + .6]] : [[x0 - 1.1, ey + .3], [x0 + 1.1, ey + .3]]])
      else if (happy) S.push(['line', [[x0 - 1.1, ey + .6], [x0, ey - .5], [x0 + 1.1, ey + .6]]])
      else {
        const k = (1 + (x.wide || 0) * .4) * (1 - (x.squint || 0) * .3)
        if (look.eyes === 'sleepy') { S.push(['halfeye', [x0, y0 - .1, ew * 1.3, eh * k * .85 * (1 - bl * .5)]]); S.push(['line', [[x0 - 1.05, y0 - .1], [x0 + 1.05, y0 - .1]]]) }   // half-lidded: the lid's line, the eye under it
        else S.push(['oval', [x0, y0, ew * (1 + (x.wide || 0) * .25), eh * k * (1 - bl * .6)]])
        if (look.eyes === 'lashes') S.push(['line', [[x0 + side * .5, y0 - eh * k * .8], [x0 + side * 1.3, y0 - eh * k * 1.25]]])
      }
      // brows: raised, knitted (angry) or worried (sad), and only as much as you show
      const bu = x.browUp || 0, bd = x.browDown || 0, bs = x.browSad || 0, show = Math.min(1, Math.max(bu, bd, bs) * 2.2)
      if (show > .05) { const by = ey - 2.9 - bu * 1.4 + bd * .7, t = side * (bd * .9 - bs * .9); S.push(['line', [[x0 - 1.1, by + t], [x0 + 1.1, by - t]], show]) }
    }
    const my = 3, sm = x.smile || 0, fr = x.frown || 0, pk = x.pucker || 0, sk = x.smirk || 0
    if (x.jaw > .12) {
      const w = Math.max(.7, 1.6 + x.jaw * 1.1 + sm * .8 - pk * .9), h = .5 + x.jaw * 2.2
      S.push([sm > .5 ? 'grin' : 'mouth', [0, my + (sm > .5 ? -.3 : 0), w, h]])
    } else if (pk > .45) S.push(['ring', [0, my, .7, .9]])
    else if (sm > .6) S.push(['grin', [0, my - .3, 1.8 + sm * .4, 1.4]])
    else if ((x.press || 0) > .55) S.push(['line', [[-1, my], [1, my]]])
    else {
      const cl = my - .2 - .45 * sm + .6 * fr - sk * .55, cr = my - .2 - .45 * sm + .6 * fr + sk * .55, mid = my + .35 * (.3 + sm) - .35 * fr
      S.push(['line', [[-1.5, cl], [-.6, mid], [.6, mid], [1.5, cr]]])
    }
    return S
  }
  function drawFace(m, x, look, headK) {
    fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, face.width, face.height)
    const hb = m.bones.head, P = (v) => { const p = v.clone().applyMatrix4(hb.matrixWorld).project(cam); return [(p.x + 1) / 2 * face.width, (1 - p.y) / 2 * face.height] }
    const c = P(m.H0.c), f = P(m.H0.f), u = P(m.H0.u)
    const fwd = new THREE.Vector3().subVectors(m.H0.f, m.H0.c).applyMatrix4(new THREE.Matrix4().extractRotation(hb.matrixWorld)).normalize()
    const facing = fwd.z; if (facing < .15) { faceTex.needsUpdate = true; return }
    let down = [c[0] - u[0], c[1] - u[1]]; const dl = Math.hypot(...down) || 1; down = [down[0] / dl, down[1] / dl]
    let across = [-down[1], down[0]]; if (across[0] < 0) across = [-across[0], -across[1]]
    const r = m.H0.r * headK * face.height / (cam.top - cam.bottom), s = r / 13, sq = Math.max(.3, facing)
    const mid = [c[0] + (f[0] - c[0]) * .92 + down[0] * r * .1, c[1] + (f[1] - c[1]) * .92 + down[1] * r * .1]
    headAt = { x: c[0], y: c[1], r, w: face.width, h: face.height }   // where the head is, for the page's speech bubbles
    const T = ([px, py]) => [mid[0] + across[0] * px * s * sq + down[0] * py * s, mid[1] + across[1] * px * s * sq + down[1] * py * s]
    const INK = '#2A1F1A', IN = '#7A2E3A'
    // cheeks first, soaked in under the eyes
    const blush = look.cheeks === 'blush' ? .4 : 0, puff = (x.puff || 0) * .35
    if (blush + puff > .02) { fg.save(); fg.filter = `blur(${Math.max(2, s * .6)}px)`; fg.fillStyle = `rgba(232,112,122,${Math.min(.6, blush + puff)})`
      for (const sd of [-1, 1]) { const [px, py] = T([sd * 5.8, 1.4]); fg.beginPath(); fg.ellipse(px, py, s * 1.9 * sq, s * 1.1, 0, 0, Math.PI * 2); fg.fill() } fg.restore() }
    if (look.cheeks === 'freckles') { fg.fillStyle = 'rgba(90,52,40,.75)'; for (const sd of [-1, 1]) for (const [dx, dy] of [[5, .9], [6.2, 1.5], [5.4, 2.2]]) { const [px, py] = T([sd * dx, dy]); fg.beginPath(); fg.arc(px, py, Math.max(1.2, s * .2), 0, Math.PI * 2); fg.fill() } }
    fg.lineCap = 'round'; fg.lineJoin = 'round'; fg.lineWidth = Math.max(2, s * .55)
    for (const [kind, g, alpha = 1] of strokes(x, look)) {
      fg.globalAlpha = alpha; fg.strokeStyle = INK; fg.fillStyle = INK
      if (kind === 'line') { fg.beginPath(); g.forEach((p, i) => (i ? fg.lineTo : fg.moveTo).call(fg, ...T(p))); fg.stroke() }
      else {
        const [cx, cy, rx, ry] = g, pts = []
        for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2; if ((kind === 'grin' || kind === 'halfeye') && Math.sin(a) < 0) continue; pts.push(T([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry])) }
        fg.beginPath(); pts.forEach((p, i) => (i ? fg.lineTo : fg.moveTo).call(fg, ...p)); fg.closePath()
        if (kind === 'oval' || kind === 'halfeye') fg.fill()
        else if (kind === 'ring') fg.stroke()
        else { fg.fillStyle = IN; fg.fill(); fg.stroke() }
      }
    }
    fg.globalAlpha = 1
    if (look.glasses) {   // round frames over his eyes, drawn like the face
      fg.lineWidth = Math.max(2, s * .45); fg.strokeStyle = INK
      for (const side of [-1, 1]) { fg.beginPath(); for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2, p = T([side * 4.6 + Math.cos(a) * 2.6, -1.4 + Math.sin(a) * 2.3]); i ? fg.lineTo(...p) : fg.moveTo(...p) } fg.stroke() }
      fg.beginPath(); fg.moveTo(...T([-2, -2])); fg.quadraticCurveTo(...T([0, -3]), ...T([2, -2])); fg.stroke()
    }
    faceTex.needsUpdate = true
  }

  // one frame: the look and the pose
  //   look: { base, skin, top, pattern, accent, hat, hatColour, eyes, cheeks, glasses, head }
  //   pose: { x, y, z, yaw, pitch, roll, blink*, jaw, smile, ... , arms: { left, right } (screen sides; { upper, fore, palm? }) }
  async function draw(look, pose, t) {
    look = { ...DEFAULT_LOOK, ...look }
    const m = await load(look.base)
    if (cur !== m) { if (cur) scene.remove(cur.root); scene.add(m.root); cur = m }
    for (const mat of m.mats) {
      mat.uniforms.col.value.set(...partColour(look, mat.userData.part))
      const top = mat.userData.part === 'top'
      mat.uniforms.pattern.value = top ? PATTERN[look.pattern] || 0 : 0; mat.uniforms.col2.value.set(...rgb(look.accent))
    }
    hat(m, look.hat)
    if (m.hat) for (const mat of m.hat.userData.mats) mat.uniforms.col.value.set(...(mat.userData.part === 'hat' ? rgb(look.hatColour) : look.hat === 'headphones' ? [.18, .16, .17] : hls(look.hatColour, .78, .04)))
    post.material.uniforms.glow.value.set(...rgb(look.skin))
    post.material.uniforms.boil.value = Math.floor(t * 12)
    // pose: rest, then the body, the head, the arms
    m.root.position.set(0, 0, 0); m.root.updateMatrixWorld(true)
    for (const [n, b] of Object.entries(m.bones)) { b.scale.setScalar(1); worldRot(b, new THREE.Quaternion(), m.rest[n]) }
    const k = m.H0.r / 90
    // the camera first (the reach is aimed in its picture): head and shoulders, 16:9, following the size you sit at
    const fr = m.frame, hh = fr.h / 2 / (pose.z || 1), cy = fr.top - fr.h / 2 + (fr.h / 2 - hh) * .6
    cam.top = cy + hh; cam.bottom = cy - hh; cam.left = -hh * W / H; cam.right = hh * W / H
    cam.position.set(0, 0, 500); cam.lookAt(0, 0, 0); cam.position.y = 0; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true)
    m.root.position.x = (pose.x || 0) * k * .9; m.root.position.y = -(pose.y || 0) * k * .5; m.root.updateMatrixWorld(true)
    const E = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'YXZ'))
    const sideOf = (s) => (m.rest[`upper${s}`].p.x > 0 ? 'right' : 'left')
    // reaching into his tile (pose.reach: { d how far 0..1, y where it crosses the seam, in tile pixels }): your arm goes
    // straight out of your tile's left edge at that height, and you lean over just enough for it to get there. the page
    // draws it on from the same point on the seam, so it's one arm
    const R = pose.reach && pose.reach.d > .02 ? pose.reach : null, reachSide = ['R', 'L'].find((s) => sideOf(s) === 'left')
    const pxu = 690 / (cam.top - cam.bottom), tileX = (p) => (p.x - cam.left) * pxu - (W * 2 * 690 / (H * 2) - 920) / 2, tileY = (p) => (cam.top - p.y) * pxu
    let reachDir = null
    if (R) {
      const Rr = m.rest, up = `upper${reachSide}`, fo = `fore${reachSide}`, ha = `hand${reachSide}`
      const armLen = (Rr[fo].p.distanceTo(Rr[up].p) + Rr[ha].p.distanceTo(Rr[fo].p)) * pxu   // shoulder to wrist (the hand itself is in his tile)
      const sh0 = m.bones[up].getWorldPosition(new THREE.Vector3())
      const dyS = R.y - tileY(sh0), reachX = Math.sqrt(Math.max(0, armLen * armLen - dyS * dyS))   // how far across the arm gets, aimed at that height
      const shift = Math.max(0, tileX(sh0) - reachX + 14) * Math.min(1, R.d * 2.5)   // lean until the wrist is just past the edge
      m.root.position.x -= shift / pxu; m.root.updateMatrixWorld(true)
      const sh = m.bones[up].getWorldPosition(new THREE.Vector3())
      reachDir = V([0 - tileX(sh), -(R.y - tileY(sh)), 0]).normalize(); reachDir.z = .04
    }
    const lean = R ? Math.min(1, R.d * 1.6) : 0
    if (m.bones.chest) worldRot(m.bones.chest, E(0, pose.yaw * .2 - lean * .3, -pose.roll * .25 + lean * .1), m.rest.chest)
    m.bones.head.scale.setScalar(look.head); worldRot(m.bones.head, E(pose.pitch * .8, pose.yaw, -pose.roll), m.rest.head)
    // arms: down by the sides unless your camera sees your hand; the reaching one goes out to the seam
    for (const s of ['R', 'L']) {
      let a = pose.arms && pose.arms[sideOf(s)]; const out = sideOf(s) === 'right' ? 1 : -1
      if (reachDir && s === reachSide) { arm(m, s, { upper: reachDir, fore: reachDir }); m.bones[`hand${s}`].scale.setScalar(.001); continue }   // the hand is past the edge, in his tile
      arm(m, s, a ? { upper: V(a.upper), fore: V(a.fore), palm: a.palm } : { upper: V([out * .22, -1, .08]), fore: V([out * .1, -1, .25]) })
    }
    m.root.updateMatrixWorld(true)
    drawFace(m, pose, look, look.head)
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam)
    renderer.setRenderTarget(null); renderer.render(postScene, postCam)
    return renderer.domElement
  }
  return { draw, load, canvas: renderer.domElement, get head() { return headAt } }
}
