<script>
(async function(){
'use strict';

/* =====================================================================
   0. Konfiguration, Beispieldaten, Hilfen
   ===================================================================== */
const SAMPLE = {
  total: 25000, currency: 'EUR', today: 120, week: -310, xirr: 8.4, dividends: 310, asOf: null, source: 'sample',
  holdings: [
    { id: 's1', name: 'Welt-ETF', short: 'Welt-ETF', value: 10000, weight: 40, ret: 9.1, type: 'security' },
    { id: 's2', name: 'Aktie A', short: 'Aktie A', value: 5500, weight: 22, ret: 14.2, type: 'security' },
    { id: 's3', name: 'Schwellenländer-ETF', short: 'Schwellenl.', value: 3750, weight: 15, ret: 3.8, type: 'security' },
    { id: 's4', name: 'Anleihen-ETF', short: 'Anleihen', value: 3250, weight: 13, ret: -1.2, type: 'security' },
    { id: 's5', name: 'Tech-Aktie B', short: 'Tech B', value: 1500, weight: 6, ret: 22.0, type: 'security' },
    { id: 's6', name: 'Krypto', short: 'Krypto', value: 700, weight: 3, ret: -8.5, type: 'crypto' },
    { id: 's7', name: 'Cash', short: 'Cash', value: 300, weight: 1, ret: 0, type: 'cash' }
  ]
};
const DEFAULT_SETTINGS = { mode: 'work', opponent: 'Firma', label: 'Praktikum', start: '', end: '', semWeeks: 14 };
const TEAM_COLORS = ['#5EE6B0', '#F5C66A', '#6FBBFF', '#C49BFF', '#FF8FB8', '#8FD3FF', '#FFD08A', '#9CF0E0', '#E6A8FF', '#B5E07A'];
const SKINS = ['#E9B98F', '#D9A983', '#C49473', '#8E6448', '#F1C9A5', '#A8724E'];

const fmtEUR = (n, cur) => { const s = Math.round(n).toLocaleString('de-DE'); return s + ' ' + (cur === 'USD' ? '$' : cur === 'CHF' ? 'CHF' : '€'); };
const fmtSigned = (n, cur) => (n >= 0 ? '▲ +' : '▼ −') + fmtEUR(Math.abs(n), cur);
const fmtPct = n => (n >= 0 ? '+' : '−') + Math.abs(n).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPhone = () => window.innerWidth < 760;
function shortName(n){
  let s = String(n || '').replace(/\(ADR\)|UCITS|ETF|USD|EUR|ACC|DIST|\b1C\b|\b1D\b|Core|iShares|Amundi|Xtrackers|Vanguard|Lyxor|SPDR|Invesco|-|–/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.length > 16) s = s.slice(0, 15).trim() + '…';
  return s || String(n).slice(0, 16);
}
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = mulberry32(20261017);
const R = (a, b) => a + (b - a) * rand();
const pick = arr => arr[Math.floor(rand() * arr.length)];
const mrand = Math.random;   // echtes Zufallsrauschen für Spielzüge

if (!window.THREE || !THREE.OrbitControls || !THREE.EffectComposer || !THREE.UnrealBloomPass || !THREE.BufferGeometryUtils){
  document.getElementById('loading').innerHTML = '<div><b>3D konnte nicht laden</b><span style="font-family:var(--f-body);letter-spacing:0">Bitte Seite neu laden.</span></div>';
  return;
}
try { await Promise.race([Promise.all(['20px "DotGothic16"', '20px "Press Start 2P"', '800 14px Manrope'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}

/* =====================================================================
   1. Sound: alles synthetisch, startet erst nach Klick auf "Sound"
   ===================================================================== */
const SFX = (() => {
  let ctx = null, master = null, amb = null, on = false;
  function ensure(){
    if (ctx) return true;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    return true;
  }
  function noiseBuf(sec, brown){
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < n; i++){ const w = Math.random() * 2 - 1; if (brown){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function env(g, t0, a, peak, d, sus){ g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t0 + a + d); }
  function tone(type, f0, f1, dur, vol, pan){
    if (!on) return; const t = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.005, vol, dur); o.connect(g); if (p){ p.pan.value = pan || 0; g.connect(p); p.connect(master); } else g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, type, f, q, pan, sweepTo){
    if (!on) return; const t = ctx.currentTime; const s = ctx.createBufferSource(); s.buffer = noiseBuf(dur + 0.05, false);
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (sweepTo) fl.frequency.exponentialRampToValueAtTime(sweepTo, t + dur); fl.Q.value = q || 1;
    const g = ctx.createGain(); env(g, t, 0.01, vol, dur);
    s.connect(fl); fl.connect(g); const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (p){ p.pan.value = pan || 0; g.connect(p); p.connect(master); } else g.connect(master);
    s.start(t); s.stop(t + dur + 0.1);
  }
  return {
    get on(){ return on; },
    toggle(){
      if (!ensure()) return false;
      on = !on;
      if (on){
        if (ctx.state === 'suspended') ctx.resume();
        if (!amb){ amb = ctx.createBufferSource(); amb.buffer = noiseBuf(4, true); amb.loop = true; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; const g = ctx.createGain(); g.gain.value = 0.035; amb.connect(f); f.connect(g); g.connect(master); amb.start(); amb._g = g; }
        else amb._g.gain.setTargetAtTime(0.035, ctx.currentTime, 0.3);
        master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.1);
      } else { master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.1); }
      return on;
    },
    hover(k){ tone('sine', 1500 + (k || 0) * 120, 1150, 0.06, 0.035); },
    click(){ tone('triangle', 620, 420, 0.1, 0.07); },
    chime(){ tone('sine', 659, 659, 0.25, 0.05, -0.2); setTimeout(() => tone('sine', 880, 880, 0.35, 0.05, 0.2), 110); },
    bounce(v, pan){ noise(0.07, 0.11 * v, 'lowpass', 320, 1, pan); tone('sine', 150, 70, 0.09, 0.09 * v, pan); },
    swish(v, pan){ noise(0.22, 0.09 * v, 'bandpass', 3800, 1.4, pan, 900); },
    rim(v, pan){ tone('sine', 1180, 1100, 0.32, 0.05 * v, pan); tone('sine', 1720, 1600, 0.26, 0.03 * v, pan); noise(0.05, 0.05 * v, 'highpass', 2500, 1, pan); },
    slam(v, pan){ noise(0.16, 0.16 * v, 'lowpass', 220, 1, pan); tone('sine', 90, 45, 0.25, 0.14 * v, pan); tone('sine', 1250, 1100, 0.4, 0.04 * v, pan); },
    cheer(v, pan){ if (!on) return; const t = ctx.currentTime; const s = ctx.createBufferSource(); s.buffer = noiseBuf(1.6, false); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * v, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 1.6); },
    whistle(){ tone('square', 2400, 2600, 0.18, 0.025); },
    train(){ noise(1.8, 0.05, 'lowpass', 500, 0.8, 0.4, 180); },
    steam(){ noise(0.5, 0.03, 'highpass', 3000, 0.7, 0); }
  };
})();

/* =====================================================================
   2. Renderer, Kamera, Post-Processing
   ===================================================================== */
const app = document.getElementById('app');
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
const DPR = Math.min(window.devicePixelRatio || 1, isPhone() ? 1.25 : 1.6);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(24, 1, 1, 800);
const VIEW_DIR = new THREE.Vector3(1, 0.78, 1.05).normalize();
const HOME = new THREE.Vector3(0, 1.2, 1.5);
camera.position.copy(HOME).add(VIEW_DIR.clone().multiplyScalar(118));
camera.lookAt(HOME);

const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.11; controls.rotateSpeed = 0.62; controls.zoomSpeed = 0.9; controls.panSpeed = 0.8;
controls.minDistance = 26; controls.maxDistance = 190;
controls.minPolarAngle = 0.42; controls.maxPolarAngle = 1.22;
controls.screenSpacePanning = false;
controls.autoRotateSpeed = 0.45;
controls.target.copy(HOME);

/* Farben: Hex ist sRGB, die Szene rechnet linear */
const colCache = {};
function col(hex){ let c = colCache[hex]; if (!c){ c = new THREE.Color(hex).convertSRGBToLinear(); colCache[hex] = c; } return c; }

const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);
const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(1024, 1024), 0.62, 0.55, 0.62);
composer.addPass(bloom);
const FinalShader = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, time: { value: 0 }, tilt: { value: 1.0 }, vig: { value: 0.55 }, warm: { value: 1.0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 res; uniform float time; uniform float tilt; uniform float vig; uniform float warm; varying vec2 vUv;
    void main(){
      float d = abs(vUv.y - 0.52) * 2.0;
      float b = smoothstep(0.42, 1.0, d) * tilt * 2.6;
      vec2 px = vec2(b) / res;
      vec4 c = texture2D(tDiffuse, vUv) * 0.28;
      c += texture2D(tDiffuse, vUv + vec2(px.x, 0.0)) * 0.11; c += texture2D(tDiffuse, vUv - vec2(px.x, 0.0)) * 0.11;
      c += texture2D(tDiffuse, vUv + vec2(0.0, px.y)) * 0.11; c += texture2D(tDiffuse, vUv - vec2(0.0, px.y)) * 0.11;
      c += texture2D(tDiffuse, vUv + px) * 0.07; c += texture2D(tDiffuse, vUv - px) * 0.07;
      c += texture2D(tDiffuse, vUv + vec2(px.x, -px.y)) * 0.07; c += texture2D(tDiffuse, vUv + vec2(-px.x, px.y)) * 0.07;
      vec3 shadowTint = vec3(0.86, 0.9, 1.18); vec3 hiTint = vec3(1.08, 1.0, 0.9);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb *= mix(shadowTint, hiTint, smoothstep(0.05, 0.6, l)) * mix(vec3(1.0), vec3(1.0, 0.98, 0.96), warm);
      vec2 q = (vUv - 0.5) * vec2(1.0, res.y / res.x) * 2.0;
      float v = smoothstep(1.45, 0.3, length(q));
      c.rgb *= mix(1.0, v, vig);
      float n = fract(sin(dot(vUv * res + vec2(time * 7.0, time * 3.0), vec2(12.9898, 78.233))) * 43758.5453);
      c.rgb += (n - 0.5) * 0.022;
      gl_FragColor = LinearTosRGB(vec4(max(c.rgb, 0.0), 1.0));
    }`
};
const finalPass = new THREE.ShaderPass(FinalShader);
finalPass.renderToScreen = true;
composer.addPass(finalPass);

let quality = { bloom: true, shadows: true };
function resize(){
  const w = app.clientWidth, h = app.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); composer.setSize(w, h);
  finalPass.uniforms.res.value.set(w * DPR, h * DPR);
  bloom.resolution.set(Math.min(1024, w), Math.min(1024, h));
}
new ResizeObserver(resize).observe(app);
resize();

/* =====================================================================
   3. Licht, Himmel, Nebel
   ===================================================================== */
const hemi = new THREE.HemisphereLight(col('#6A74D8').getHex(), col('#1C1030').getHex(), 0.8);
hemi.color.copy(col('#6A74D8')); hemi.groundColor.copy(col('#1C1030'));
scene.add(hemi);
const moon = new THREE.DirectionalLight(0xffffff, 0.65);
moon.color.copy(col('#9FB0FF'));
moon.position.set(-60, 90, 30);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
Object.assign(moon.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 20, far: 260 });
moon.shadow.bias = -0.0008; moon.shadow.normalBias = 0.03; moon.shadow.camera.updateProjectionMatrix();
scene.add(moon);
const floods = [];
[[-15, -12, -7, 0], [15, -12, 7, 0], [-15, 12, -7, 0], [15, 12, 7, 0]].forEach(([x, z, tx, tz]) => {
  const s = new THREE.SpotLight(0xffffff, 1.15, 52, 0.7, 0.5, 1.0); s.color.copy(col('#FFE9C8'));
  s.position.set(x, 12.5, z); s.target.position.set(tx, 1, tz); scene.add(s); scene.add(s.target); floods.push(s);
});
const alleyLights = [];
[[0, 21.5, '#FF8A50'], [29, -8, '#FFB070'], [-30, 2, '#FF9F6A']].forEach(([x, z, c]) => { const p = new THREE.PointLight(0xffffff, 0.9, 26, 1.8); p.color.copy(col(c)); p.position.set(x, 4.5, z); scene.add(p); alleyLights.push(p); });

function gradientTex(stops){
  const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512); stops.forEach(([k, v]) => gr.addColorStop(k, v));
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
const SKY_NIGHT = gradientTex([[0, '#07061C'], [0.55, '#1C1246'], [0.85, '#4A2466'], [1, '#6B3056']]);
const SKY_DAY = gradientTex([[0, '#6FA8E8'], [0.6, '#BBD6F2'], [1, '#F6D9D0']]);
scene.background = SKY_NIGHT;
const FOG_NIGHT = col('#1B1240'), FOG_DAY = col('#C9D6EA');
scene.fog = new THREE.Fog(FOG_NIGHT.getHex(), 120, 330);
scene.fog.color.copy(FOG_NIGHT);

/* =====================================================================
   4. Builder: alles Statische landet in zwei Meshes (lit + emit)
   ===================================================================== */
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
const CYL6 = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
const CONE = new THREE.ConeGeometry(0.5, 1, 8);
const PYR = new THREE.ConeGeometry(0.72, 1, 4);
const WEDGE = new THREE.CylinderGeometry(0.5, 0.5, 1, 3);
const ICO = new THREE.IcosahedronGeometry(0.5, 0);
const ICO1 = new THREE.IcosahedronGeometry(0.5, 1);
const SPH = new THREE.SphereGeometry(0.5, 10, 8);
const DODE = new THREE.DodecahedronGeometry(0.5, 0);
const litList = [], emitList = [];
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function prep(geo, color, x, y, z, sx, sy, sz, ry, rx, rz, tint){
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  Object.keys(g.attributes).forEach(k => { if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); });
  _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz); _m4.compose(_p, _q, _s); g.applyMatrix4(_m4);
  const n = g.attributes.position.count, arr = new Float32Array(n * 3), c = col(color), nor = g.attributes.normal;
  for (let i = 0; i < n; i++){
    let f = 1; if (tint){ const ny = nor.getY(i); f = 0.88 + 0.12 * Math.max(0, ny); }
    arr[i * 3] = c.r * f; arr[i * 3 + 1] = c.g * f; arr[i * 3 + 2] = c.b * f;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
const B = {
  box: (c, x, y, z, w, h, d, ry, rx, rz) => litList.push(prep(BOX, c, x, y, z, w, h, d, ry, rx, rz, true)),
  geo: (geo, c, x, y, z, sx, sy, sz, ry, rx, rz) => litList.push(prep(geo, c, x, y, z, sx, sy, sz, ry, rx, rz, true)),
  glow: (c, x, y, z, w, h, d, ry, rx, rz) => emitList.push(prep(BOX, c, x, y, z, w, h, d, ry, rx, rz)),
  glowGeo: (geo, c, x, y, z, sx, sy, sz, ry, rx, rz) => emitList.push(prep(geo, c, x, y, z, sx, sy, sz, ry, rx, rz))
};
/* Fenster: dünne leuchtende Platte vor der Wand, Richtung ry (0 = +z) */
function win(c, x, y, z, w, h, ry){ B.glow(c, x, y, z, w, h, 0.05, ry); }
function flushStatic(){
  const lit = new THREE.Mesh(THREE.BufferGeometryUtils.mergeBufferGeometries(litList), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02, flatShading: true }));
  lit.castShadow = true; lit.receiveShadow = true; scene.add(lit);
  const emit = new THREE.Mesh(THREE.BufferGeometryUtils.mergeBufferGeometries(emitList), new THREE.MeshBasicMaterial({ vertexColors: true })); emit.material.color.setScalar(1.5);
  emit.userData.night = true; scene.add(emit);
  litList.length = 0; emitList.length = 0;
  return { lit, emit };
}

/* Text-Atlas: alle Schilder in einer Textur, ein Draw Call */
const ATLAS = (() => {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 2048; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  let h = 0, v = 0, s = 0; const geos = [];
  const PAD = 2;
  function cellH(){ const i = h++; return { x: (i % 8) * 256, y: Math.floor(i / 8) * 64, w: 256, h: 64 }; }       // 8×24 = 192
  function cellV(){ const i = v++; return { x: (i % 16) * 64, y: 1536 + Math.floor(i / 16) * 256, w: 64, h: 256 }; } // 32
  function cellS(){ const i = s++; return { x: 1024 + (i % 16) * 64, y: 1536 + Math.floor(i / 16) * 64, w: 64, h: 64 }; } // 128
  function draw(cell, text, o){
    g.save(); g.beginPath(); g.rect(cell.x, cell.y, cell.w, cell.h); g.clip();
    g.clearRect(cell.x, cell.y, cell.w, cell.h);
    if (o.bg){ g.fillStyle = o.bg; g.fillRect(cell.x + PAD, cell.y + PAD, cell.w - PAD * 2, cell.h - PAD * 2); }
    if (o.border){ g.strokeStyle = o.border; g.lineWidth = o.bw || 5; g.strokeRect(cell.x + PAD + g.lineWidth / 2, cell.y + PAD + g.lineWidth / 2, cell.w - PAD * 2 - g.lineWidth, cell.h - PAD * 2 - g.lineWidth); }
    g.fillStyle = o.color; g.font = o.font; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (o.glow){ g.shadowColor = o.color; g.shadowBlur = o.glow; }
    if (o.vertical){ const chars = Array.from(text); const step = (cell.h - 16) / chars.length; chars.forEach((ch, i) => g.fillText(ch, cell.x + cell.w / 2, cell.y + 8 + step * (i + 0.5))); }
    else g.fillText(text, cell.x + cell.w / 2, cell.y + cell.h / 2 + (o.dy || 0));
    g.restore();
    return { u0: (cell.x + PAD) / 2048, u1: (cell.x + cell.w - PAD) / 2048, v0: 1 - (cell.y + cell.h - PAD) / 2048, v1: 1 - (cell.y + PAD) / 2048 };
  }
  function plane(uv, w, hgt, x, y, z, ry, back){
    const p = new THREE.PlaneGeometry(w, hgt); const u = p.attributes.uv;
    const map = [[uv.u0, uv.v1], [uv.u1, uv.v1], [uv.u0, uv.v0], [uv.u1, uv.v0]];
    for (let i = 0; i < 4; i++) u.setXY(i, map[i][0], map[i][1]);
    let gg = p.toNonIndexed(); gg.deleteAttribute('normal');
    _e.set(0, ry || 0, 0); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(1, 1, 1); _m4.compose(_p, _q, _s); gg.applyMatrix4(_m4); geos.push(gg);
    if (back){ let b = p.toNonIndexed(); b.deleteAttribute('normal'); _e.set(0, (ry || 0) + Math.PI, 0); _q.setFromEuler(_e); _m4.compose(_p, _q, _s); b.applyMatrix4(_m4); geos.push(b); }
  }
  return {
    tex,
    signH: (text, o) => draw(cellH(), text, Object.assign({ font: '52px DotGothic16, sans-serif' }, o)),
    signV: (text, o) => draw(cellV(), text, Object.assign({ font: '44px DotGothic16, sans-serif', vertical: true }, o)),
    square: (text, o) => draw(cellS(), text, Object.assign({ font: '36px "Press Start 2P", monospace' }, o)),
    plane,
    flush(){
      if (!geos.length) return null;
      const m = new THREE.Mesh(THREE.BufferGeometryUtils.mergeBufferGeometries(geos), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.08, side: THREE.FrontSide }));
      m.userData.night = true; scene.add(m); geos.length = 0; tex.needsUpdate = true; return m;
    }
  };
})();

/* Leuchtkugeln als instanzierte Billboards: ein Draw Call für hunderte Lichter */
const glowMat = new THREE.ShaderMaterial({
  uniforms: { opacity: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `varying vec3 vC; varying vec2 vUv; void main(){ vC = instanceColor; vUv = uv; vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0,0.0,0.0,1.0); float s = length(vec3(instanceMatrix[0].x, instanceMatrix[0].y, instanceMatrix[0].z)); c.xy += position.xy * s; gl_Position = projectionMatrix * c; }`,
  fragmentShader: `varying vec3 vC; varying vec2 vUv; uniform float opacity; void main(){ float r = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 2.4) * opacity; gl_FragColor = vec4(vC * a, a); }`
});
function glowPool(n){
  const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), glowMat, n);
  m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  m.count = 0; m.frustumCulled = false; m.userData.night = true; scene.add(m); return m;
}
const glowStatic = glowPool(900);
const dummy = new THREE.Object3D();
function glow(c, x, y, z, size, strength){
  const m = glowStatic, i = m.count++; if (i >= 900) return;
  dummy.position.set(x, y, z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(size); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
  const cc = col(c); const k = strength == null ? 1 : strength; m.setColorAt(i, new THREE.Color(cc.r * k, cc.g * k, cc.b * k));
}

/* Laternen: instanziert, schwingen leicht */
const lanternGeo = new THREE.SphereGeometry(0.5, 8, 6); lanternGeo.scale(1, 1.25, 1);
const lanternMesh = new THREE.InstancedMesh(lanternGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), 260);
lanternMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(260 * 3), 3);
lanternMesh.count = 0; lanternMesh.userData.night = true; scene.add(lanternMesh);
const lanterns = [];
function lantern(c, x, y, z, size, strength){
  const i = lanternMesh.count++; if (i >= 260) return;
  lanterns.push({ x, y, z, s: size, ph: R(0, 6) });
  const cc = col(c), k = strength == null ? 1.3 : strength; lanternMesh.setColorAt(i, new THREE.Color(cc.r * k, cc.g * k, cc.b * k));
  glow(c, x, y - 0.1, z, size * 4.5, 0.55);
}

/* Stromleitungen: alle Kabel in einem LineSegments */
const wirePts = [];
function wire(ax, ay, az, bx, by, bz, sag){
  const N = 7; let px = ax, py = ay, pz = az;
  for (let i = 1; i <= N; i++){ const k = i / N; const x = lerp(ax, bx, k), z = lerp(az, bz, k), y = lerp(ay, by, k) - Math.sin(Math.PI * k) * (sag || 0.5); wirePts.push(px, py, pz, x, y, z); px = x; py = y; pz = z; }
}
function flushWires(){
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3));
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: col('#0B0A1C').getHex(), transparent: true, opacity: 0.9 })); l.material.color.copy(col('#0B0A1C')); scene.add(l); return l;
}

/* Anklickbare, unsichtbare Boxen */
const pickables = [];
const pickMat = new THREE.MeshBasicMaterial({ visible: false });
function pickBox(data, x, y, z, w, h, d, ry){
  const m = new THREE.Mesh(BOX, pickMat); m.position.set(x, y, z); m.scale.set(w, h, d); if (ry) m.rotation.y = ry; m.userData.pick = data; scene.add(m); pickables.push(m); return m;
}
/* Dampf-/Partikelquellen (später animiert) */
const emitters = [];
