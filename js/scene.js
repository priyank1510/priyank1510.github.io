/* ==========================================================================
   LATENT FIELD — a GPU particle system that morphs between figures as the
   page scrolls. Every figure is a point cloud computed once on the CPU; the
   vertex shader blends between any two of them with per-particle stagger,
   a curl-ish swirl in flight, and a screen-space cursor repulsion.
   ========================================================================== */
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  AdditiveBlending,
  Color,
  Group,
} from "three";

const TAU = Math.PI * 2;

/* Figures, in order. `fig` is the caption shown in the corner of the page. */
export const FIGURES = [
  { id: "noise", fig: "Fig. 00 — Initialisation, N(0, σ²)" },
  { id: "sphere", fig: "Fig. 01 — Embedding sphere, unit-normalised" },
  { id: "knot", fig: "Fig. 02 — Manifold, torus knot (2, 3)" },
  { id: "landscape", fig: "Fig. 03 — Loss landscape, non-convex" },
  { id: "clusters", fig: "Fig. 04 — Latent clusters, k = 7" },
  { id: "tensor", fig: "Fig. 05 — Rank-3 tensor, 7 × 7 × 7" },
  { id: "disk", fig: "Fig. 06 — Accretion disk, open channel" },
];

/* Where each figure sits on screen. x/y in world units, s = scale,
   rx = tilt toward camera, o = opacity. Mobile collapses x offsets. */
const LAYOUT = [
  { x: 0, y: 0, s: 1, rx: 0, o: 1 },
  { x: 1.45, y: 0.05, s: 1, rx: 0.12, o: 1 },
  { x: -2.0, y: 0.1, s: 0.95, rx: 0.25, o: 0.55 },
  { x: 0, y: -0.95, s: 1.05, rx: 0.55, o: 0.58 },
  { x: 0, y: 0, s: 1.1, rx: 0.15, o: 0.42 },
  { x: 2.3, y: 0, s: 0.85, rx: 0.5, o: 0.55 },
  { x: 0, y: -0.15, s: 1.15, rx: 0.3, o: 1 },
];

/* -------------------------------------------------------------- helpers */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(1510);
const gauss = () => {
  let u = 0, v = 0;
  while (!u) u = rnd();
  while (!v) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
};
const randDir = () => {
  const z = rnd() * 2 - 1;
  const a = rnd() * TAU;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), r * Math.sin(a), z];
};

/* --------------------------------------------------------------- figures */
function buildNoise(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = randDir();
    const r = 4 + rnd() * 6;
    out.set([x * r, y * r, z * r - 2], i * 3);
  }
  return out;
}

function buildSphere(n) {
  const out = new Float32Array(n * 3);
  const R = 1.85;
  const tilt = 0.42; // ring tilt around z
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  const golden = Math.PI * (1 + Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const roll = rnd();
    let x, y, z;
    if (roll < 0.7) {
      const k = i + 0.5;
      const phi = Math.acos(1 - (2 * k) / n);
      const th = golden * k;
      const r = R + gauss() * 0.02;
      x = r * Math.cos(th) * Math.sin(phi);
      y = r * Math.cos(phi);
      z = r * Math.sin(th) * Math.sin(phi);
    } else if (roll < 0.88) {
      // orbital ring
      const a = rnd() * TAU;
      const r = R * (1.42 + Math.pow(rnd(), 2) * 0.32);
      const rx = r * Math.cos(a), rz = r * Math.sin(a), ry = gauss() * 0.015;
      x = rx * ct - ry * st;
      y = rx * st + ry * ct;
      z = rz;
    } else {
      const [dx, dy, dz] = randDir();
      const r = R * Math.pow(rnd(), 0.6) * 0.85;
      x = dx * r; y = dy * r; z = dz * r;
    }
    out.set([x, y, z], i * 3);
  }
  return out;
}

function buildKnot(n) {
  const out = new Float32Array(n * 3);
  const p = 2, q = 3, S = 0.6, tube = 0.3;
  const curve = (t) => {
    const r = 2 + Math.cos(q * t);
    return [r * Math.cos(p * t) * S, r * Math.sin(p * t) * S, Math.sin(q * t) * S];
  };
  for (let i = 0; i < n; i++) {
    const t = rnd() * TAU;
    const c = curve(t);
    const c2 = curve(t + 0.002);
    let tx = c2[0] - c[0], ty = c2[1] - c[1], tz = c2[2] - c[2];
    const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
    // normal = T × z
    let nx = ty, ny = -tx, nz = 0;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    // binormal = T × N
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    const a = rnd() * TAU;
    const r = tube * (0.55 + 0.45 * Math.sqrt(rnd()));
    const ca = Math.cos(a) * r, sa = Math.sin(a) * r;
    out.set([c[0] + nx * ca + bx * sa, c[1] + ny * ca + by * sa, c[2] + nz * ca + bz * sa], i * 3);
  }
  return out;
}

function buildLandscape(n) {
  // drawn as terrain scan-lines: rows along x, stacked in depth
  const out = new Float32Array(n * 3);
  const W = 10, D = 6.4, rows = 30;
  const per = Math.floor(n / rows);
  const f = (x, z) =>
    -1.15 * Math.exp(-((x - 1.3) ** 2 + (z + 0.4) ** 2) / 1.4) -
    0.8 * Math.exp(-((x + 1.9) ** 2 + (z - 0.9) ** 2) / 0.9) +
    0.6 * Math.exp(-((x + 0.1) ** 2 + (z + 1.7) ** 2) / 0.7) +
    0.45 * Math.exp(-((x - 3.2) ** 2 + (z - 1.6) ** 2) / 1.1) +
    0.13 * Math.sin(x * 1.9) * Math.cos(z * 1.7) +
    0.02 * (x * x + z * z);
  for (let i = 0; i < n; i++) {
    const row = Math.min(Math.floor(i / per), rows - 1);
    const x = (rnd() - 0.5) * W;
    const z = (row / (rows - 1) - 0.5) * D;
    out.set([x, f(x, z), z], i * 3);
  }
  return out;
}

function buildClusters(n, isAccent) {
  const out = new Float32Array(n * 3);
  const centers = [
    [1.15, 1.05, -0.6],
    [-2.7, 0.85, -0.4],
    [-0.9, -1.15, 0.8],
    [2.75, -0.7, 0.3],
    [0.15, 0.25, 1.6],
    [-2.0, -1.55, -1.5],
    [1.9, -1.75, -1.7],
  ];
  const sig = [0.34, 0.42, 0.4, 0.32, 0.26, 0.44, 0.36];
  for (let i = 0; i < n; i++) {
    let x, y, z;
    if (isAccent[i]) {
      const c = centers[0];
      x = c[0] + gauss() * sig[0]; y = c[1] + gauss() * sig[0]; z = c[2] + gauss() * sig[0];
    } else if (rnd() < 0.08) {
      x = (rnd() - 0.5) * 8; y = (rnd() - 0.5) * 4.6; z = (rnd() - 0.5) * 4;
    } else {
      const k = 1 + Math.floor(rnd() * 6);
      const c = centers[k], s = sig[k];
      x = c[0] + gauss() * s; y = c[1] + gauss() * s; z = c[2] + gauss() * s;
    }
    out.set([x, y, z], i * 3);
  }
  return out;
}

function buildTensor(n) {
  const out = new Float32Array(n * 3);
  const g = 7, side = 2.7, h = side / 2;
  const step = side / (g - 1);
  const lineCount = g * g * 3;
  const onLines = Math.floor(n * 0.9);
  for (let i = 0; i < n; i++) {
    let x, y, z;
    if (i < onLines) {
      const line = i % lineCount;
      const axis = Math.floor(line / (g * g));
      const a = ((line % (g * g)) % g) * step - h;
      const b = Math.floor((line % (g * g)) / g) * step - h;
      const t = rnd() * side - h;
      if (axis === 0) { x = t; y = a; z = b; }
      else if (axis === 1) { x = a; y = t; z = b; }
      else { x = a; y = b; z = t; }
    } else {
      // "values" sitting on the lattice nodes
      x = Math.floor(rnd() * g) * step - h + gauss() * 0.03;
      y = Math.floor(rnd() * g) * step - h + gauss() * 0.03;
      z = Math.floor(rnd() * g) * step - h + gauss() * 0.03;
    }
    out.set([x, y, z], i * 3);
  }
  return out;
}

function buildDisk(n) {
  const out = new Float32Array(n * 3);
  const R = 2.35;
  for (let i = 0; i < n; i++) {
    const roll = rnd();
    let r, a, y;
    if (roll < 0.58) {
      a = rnd() * TAU;
      r = R + gauss() * 0.11;
      y = gauss() * 0.06;
    } else if (roll < 0.86) {
      const u = rnd();
      r = R * (0.22 + 0.78 * Math.pow(u, 0.7));
      a = rnd() * TAU + (R - r) * 1.7;
      y = gauss() * 0.035 * (r / R);
      // spiral arms
      a += Math.sin(a * 2) * 0.12;
    } else {
      a = rnd() * TAU;
      r = R + 0.25 + Math.pow(rnd(), 1.6) * 2.4;
      y = gauss() * 0.22;
    }
    out.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
  }
  return out;
}

/* --------------------------------------------------------------- shaders */
const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT = /* glsl */ `
uniform float uTime;
uniform float uFrom;
uniform float uTo;
uniform float uProgress;
uniform float uSize;
uniform float uPixelRatio;
uniform float uAgitate;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uAspect;
uniform vec3  uBase;
uniform vec3  uAccent;
uniform float uAccentRatio;
uniform float uPulse;

attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aP3;
attribute vec3 aP4;
attribute vec3 aP5;
attribute vec3 aP6;
attribute vec4 aRand;

varying vec3 vColor;
varying float vAlpha;

${SNOISE}

float accentPulse(float r){ return r < uAccentRatio ? 1.0 : 0.0; }

vec3 figure(float i){
  if (i < 0.5) return position;
  if (i < 1.5) return aP1;
  if (i < 2.5) return aP2;
  if (i < 3.5) return aP3;
  if (i < 4.5) return aP4;
  if (i < 5.5) return aP5;
  return aP6;
}

void main(){
  float delay = aRand.x * 0.45;
  float p = clamp((uProgress - delay) / 0.55, 0.0, 1.0);
  p = p * p * (3.0 - 2.0 * p);

  vec3 pos = mix(figure(uFrom), figure(uTo), p);

  float flight = sin(p * 3.14159265);
  float turbulence = flight * 1.15 + uAgitate * 0.3;
  if (turbulence > 0.001) {
    vec3 q = pos * 0.42 + vec3(0.0, uTime * 0.07, 0.0);
    pos += vec3(snoise(q), snoise(q + 17.3), snoise(q + 41.9)) * turbulence;
  }

  // idle shimmer
  float ph = aRand.w * 6.2831;
  pos += vec3(sin(uTime * 0.7 + ph), cos(uTime * 0.55 + ph * 1.3), sin(uTime * 0.6 + ph * 0.7)) * 0.018;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vec4 clip = projectionMatrix * mv;

  // screen-space repulsion around the cursor
  vec2 ndc = clip.xy / clip.w;
  vec2 diff = ndc - uMouse;
  diff.x *= uAspect;
  float dist = length(diff);
  float push = smoothstep(0.3, 0.0, dist) * uMouseStrength;
  vec2 dir = diff / max(dist, 1e-4);
  ndc += vec2(dir.x / uAspect, dir.y) * push * 0.085;
  clip.xy = ndc * clip.w;
  gl_Position = clip;

  float sizeVar = mix(0.5, 1.7, aRand.z * aRand.z);
  // music: brighter, bigger points on the beat — the accent particles most
  float beat = uPulse * (accentPulse(aRand.y) + 0.35);
  float size = uSize * uPixelRatio * sizeVar * (9.0 / max(-mv.z, 0.5)) * (1.0 + push * 1.2 + beat * 0.9);
  gl_PointSize = min(size, 34.0 * uPixelRatio);

  bool accent = aRand.y < uAccentRatio;
  vec3 col = accent ? uAccent : uBase;
  float bright = accent ? 1.0 : mix(0.3, 1.0, aRand.z);
  col = mix(col * bright, uAccent, push * 0.85);
  vColor = col;

  vAlpha = smoothstep(19.0, 5.0, -mv.z) * (1.0 + flight * 0.25 + beat * 0.6);
}`;

const FRAG = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = 1.0 - smoothstep(0.0, 0.5, d);
  a *= a;
  gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
}`;

/* ------------------------------------------------------------- the scene */
export function createScene(canvas, opts = {}) {
  const { count = 48000, reducedMotion = false, onFigure = () => {} } = opts;

  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  /* geometry */
  const isAccent = new Uint8Array(count);
  const aRand = new Float32Array(count * 4);
  const ACCENT_RATIO = 0.085;
  for (let i = 0; i < count; i++) {
    const y = rnd();
    isAccent[i] = y < ACCENT_RATIO ? 1 : 0;
    aRand.set([rnd(), y, rnd(), rnd()], i * 4);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(buildNoise(count), 3));
  geometry.setAttribute("aP1", new BufferAttribute(buildSphere(count), 3));
  geometry.setAttribute("aP2", new BufferAttribute(buildKnot(count), 3));
  geometry.setAttribute("aP3", new BufferAttribute(buildLandscape(count), 3));
  geometry.setAttribute("aP4", new BufferAttribute(buildClusters(count, isAccent), 3));
  geometry.setAttribute("aP5", new BufferAttribute(buildTensor(count), 3));
  geometry.setAttribute("aP6", new BufferAttribute(buildDisk(count), 3));
  geometry.setAttribute("aRand", new BufferAttribute(aRand, 4));

  const uniforms = {
    uTime: { value: 0 },
    uFrom: { value: 0 },
    uTo: { value: 0 },
    uProgress: { value: 1 },
    uSize: { value: 2.3 },
    uPixelRatio: { value: 1 },
    uAgitate: { value: 0 },
    uMouse: { value: { x: 10, y: 10 } }, // mutated in place each frame
    uMouseStrength: { value: 0 },
    uAspect: { value: 1 },
    uBase: { value: new Color("#e1e9f5") },
    uAccent: { value: new Color("#5b9bff") },
    uAccentRatio: { value: ACCENT_RATIO },
    uOpacity: { value: 0.85 },
    uPulse: { value: 0 },
  };

  const material = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const rig = new Group();
  rig.add(points);
  scene.add(rig);

  /* layout / sizing */
  let width = 0, height = 0, mobile = false;
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // on touch devices, ignore the small height jumps caused by the URL bar
    const coarse = matchMedia("(pointer: coarse)").matches;
    if (w === width && (h === height || (coarse && Math.abs(h - height) < 120))) return;
    width = w; height = h;
    mobile = w < 760;
    const pr = Math.min(window.devicePixelRatio || 1, 1.6);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPixelRatio.value = pr;
    uniforms.uAspect.value = w / h;
    uniforms.uSize.value = 2.3 * Math.min(Math.max(h / 900, 0.75), 1.35);
  }

  function targetLayout(i) {
    const L = LAYOUT[i];
    if (!mobile) return L;
    return { x: 0, y: L.y * 0.6, s: L.s * 0.72, rx: L.rx, o: L.o * 0.7 };
  }

  const cur = { ...LAYOUT[0] };

  /* morph controller */
  let from = 0, to = 0, progress = 1, morphing = false, queued = null;
  let duration = 2, speed = 1;

  function goTo(i, { duration: d = 2.1 } = {}) {
    i = Math.max(0, Math.min(FIGURES.length - 1, i));
    if (morphing) {
      queued = i;
      speed = 2.4;
      return;
    }
    if (i === to) return;
    from = to;
    to = i;
    progress = 0;
    duration = reducedMotion ? 0.6 : d;
    speed = 1;
    morphing = true;
    onFigure(i);
  }

  /* pointer */
  const mouse = { x: 10, y: 10, tx: 10, ty: 10, strength: 0, target: 0 };
  function setPointer(nx, ny, active = true) {
    mouse.tx = nx;
    mouse.ty = ny;
    mouse.target = active ? 1 : 0;
    if (mouse.x > 5) { mouse.x = nx; mouse.y = ny; }
  }

  let pulse = 0, pulseTarget = 0;
  function setPulse(v) {
    pulseTarget = v;
  }

  let agitate = 0, agitateTarget = 0;
  function setVelocity(v) {
    agitateTarget = Math.min(Math.abs(v) / 40, 1);
  }

  /* loop */
  let raf = 0, running = false, last = performance.now(), time = 0;
  const parallax = { x: 0, y: 0 };

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;

    if (morphing) {
      progress += (dt / duration) * speed;
      if (progress >= 1) {
        progress = 1;
        morphing = false;
        from = to;
        speed = 1;
        if (queued !== null && queued !== to) {
          const q = queued;
          queued = null;
          goTo(q, { duration: 1.6 });
        } else queued = null;
      }
    }

    const L = targetLayout(to);
    const k = 1 - Math.exp(-dt * 1.8);
    cur.x += (L.x - cur.x) * k;
    cur.y += (L.y - cur.y) * k;
    cur.s += (L.s - cur.s) * k;
    cur.rx += (L.rx - cur.rx) * k;
    cur.o += (L.o - cur.o) * k;

    const mk = 1 - Math.exp(-dt * 6);
    mouse.x += (mouse.tx - mouse.x) * mk;
    mouse.y += (mouse.ty - mouse.y) * mk;
    mouse.strength += (mouse.target - mouse.strength) * (1 - Math.exp(-dt * 3));
    parallax.x += ((mouse.target ? mouse.tx : 0) - parallax.x) * (1 - Math.exp(-dt * 1.5));
    parallax.y += ((mouse.target ? mouse.ty : 0) - parallax.y) * (1 - Math.exp(-dt * 1.5));

    agitate += (agitateTarget - agitate) * (1 - Math.exp(-dt * 4));
    // fast attack, slow release, like a VU meter
    pulse += (pulseTarget - pulse) * (1 - Math.exp(-dt * (pulseTarget > pulse ? 18 : 4)));
    agitateTarget *= Math.exp(-dt * 3);

    rig.position.set(cur.x, cur.y, 0);
    rig.scale.setScalar(cur.s);
    rig.rotation.x = cur.rx - parallax.y * 0.12;
    rig.rotation.z = parallax.x * -0.04;
    points.rotation.y = time * (reducedMotion ? 0.015 : 0.06) + parallax.x * 0.25;

    uniforms.uTime.value = time;
    uniforms.uFrom.value = from;
    uniforms.uTo.value = to;
    uniforms.uProgress.value = progress;
    uniforms.uMouse.value.x = mouse.x;
    uniforms.uMouse.value.y = mouse.y;
    uniforms.uMouseStrength.value = mouse.strength;
    uniforms.uAgitate.value = reducedMotion ? 0 : agitate;
    uniforms.uOpacity.value = 0.85 * cur.o;
    uniforms.uPulse.value = reducedMotion ? 0 : pulse;

    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // compile shaders up front so the first frame doesn't hitch
  renderer.compile(scene, camera);

  return {
    goTo,
    setPointer,
    setVelocity,
    setPulse,
    start,
    stop,
    get figure() { return to; },
  };
}
