
/* =====================================================================
   9. Bewegtes Stadtleben: Riesenrad, Zug, Autos, Passanten, Dampf
   ===================================================================== */
crows.forEach(c => { B.box('#121218', c.x, c.y + 0.12, c.z, 0.34, 0.2, 0.18); B.box('#121218', c.x + 0.2, c.y + 0.24, c.z, 0.14, 0.14, 0.14); B.geo(CONE, '#F0B040', c.x + 0.3, c.y + 0.24, c.z, 0.06, 0.1, 0.06, 0, 0, -Math.PI / 2); });
const statics = flushStatic();
const signMesh = ATLAS.flush();
const wires = flushWires();

const wheelSpin = new THREE.Group(); wheelSpin.position.set(WHEEL.x, WHEEL.y, WHEEL.z); scene.add(wheelSpin);
const gondolas = [];
(function buildWheel(){
  const rimM = new THREE.MeshBasicMaterial(); rimM.color.copy(col('#5FE3FF')).multiplyScalar(0.9);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(WHEEL.r, 0.2, 6, 36), rimM); wheelSpin.add(rim); const rim2 = rim.clone(); rim2.scale.setScalar(0.55); wheelSpin.add(rim2);
  const spokeM = pmat('#C9D3FF');
  for (let i = 0; i < 12; i++){ const a = (i / 12) * Math.PI * 2; const sp = new THREE.Mesh(BOX, spokeM); sp.position.set(Math.cos(a) * WHEEL.r / 2, Math.sin(a) * WHEEL.r / 2, 0); sp.scale.set(0.12, WHEEL.r, 0.12); sp.rotation.z = a - Math.PI / 2; wheelSpin.add(sp);
    const gm = new THREE.MeshBasicMaterial(); gm.color.copy(col(NEON[i % NEON.length])); const gd = new THREE.Mesh(BOX, gm); gd.scale.set(1.1, 1.1, 1.1); scene.add(gd); gd.userData.night = true; gondolas.push({ m: gd, a }); }
  rimM.userData = { night: true }; rim.userData.night = true;
})();
/* Zug */
const train = [];
for (let i = 0; i < 4; i++){
  const g = new THREE.Group();
  g.add(pm(BOX, '#E6EAF4', 0, 1.2, 0, 5.8, 2.1, 2.3)); g.add(pm(BOX, '#3FAF6A', 0, 0.5, 0, 5.82, 0.32, 2.32)); g.add(pm(BOX, '#2A2E4F', 0, 2.3, 0, 5.4, 0.2, 1.8));
  const wm = new THREE.MeshBasicMaterial(); wm.color.copy(col('#FFF1C8')); const w = new THREE.Mesh(BOX, wm); w.position.set(0, 1.45, 0); w.scale.set(5.0, 0.62, 2.36); w.userData.night = true; g.add(w);
  scene.add(g); train.push(g);
}
let trainSfx = false;
/* Autos auf dem Ring (Linksverkehr) */
const RING = [[-21, -16], [21, -16], [21, 16], [-21, 16]]; const RING_LEN = 2 * (42 + 32);
function ringPos(t, dir){
  t = ((t % RING_LEN) + RING_LEN) % RING_LEN; let i = 0, acc = 0; const segs = [[0, 1], [1, 2], [2, 3], [3, 0]];
  for (; i < 4; i++){ const a = RING[segs[i][0]], b = RING[segs[i][1]]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (t <= acc + L){ const k = (t - acc) / L; const x = lerp(a[0], b[0], k), z = lerp(a[1], b[1], k); const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L; return { x, z, dx: dx * dir, dz: dz * dir }; } acc += L; }
  return { x: RING[0][0], z: RING[0][1], dx: 1, dz: 0 };
}
const glowDyn = glowPool(80);
const cars = [];
const CAR_COLS = ['#F2F4FF', '#FFCF3A', '#2B2E44', '#C2402F', '#6FBBFF', '#3FAF6A', '#E9EEF8', '#8A8FA8'];
for (let i = 0; i < 14; i++){
  const colr = pick(CAR_COLS); const taxi = colr === '#FFCF3A'; const bus = i === 13;
  const g = new THREE.Group();
  if (bus){ g.add(pm(BOX, '#3A8A5A', 0, 0.9, 0, 5.4, 1.5, 2.0)); const wm = new THREE.MeshBasicMaterial(); wm.color.copy(col('#FFF1C8')); const w = new THREE.Mesh(BOX, wm); w.position.set(0, 1.15, 0); w.scale.set(4.8, 0.55, 2.04); w.userData.night = true; g.add(w); }
  else { g.add(pm(BOX, colr, 0, 0.42, 0, 2.0, 0.5, 1.0)); g.add(pm(BOX, colr === '#2B2E44' ? '#3A3E5E' : '#E9EEF8', -0.1, 0.85, 0, 1.1, 0.38, 0.9)); if (taxi){ const tm = new THREE.MeshBasicMaterial(); tm.color.copy(col('#FFFFFF')); const t = new THREE.Mesh(BOX, tm); t.position.set(-0.1, 1.12, 0); t.scale.set(0.3, 0.14, 0.4); g.add(t); } }
  const tl = new THREE.MeshBasicMaterial(); tl.color.copy(col('#FF3B3B')); const tail = new THREE.Mesh(BOX, tl); tail.position.set(bus ? -2.71 : -1.01, 0.45, 0); tail.scale.set(0.03, 0.12, bus ? 1.6 : 0.8); tail.userData.night = true; g.add(tail);
  const hl = new THREE.MeshBasicMaterial(); hl.color.copy(col('#FFF6D6')); const head = new THREE.Mesh(BOX, hl); head.position.set(bus ? 2.71 : 1.01, 0.45, 0); head.scale.set(0.03, 0.14, bus ? 1.6 : 0.8); g.add(head);
  scene.add(g); cars.push({ g, t: R(0, RING_LEN), v: bus ? 4.2 : R(5, 8.5), dir: i % 2 ? 1 : -1, bus });
}
/* Passanten: Instanzen auf Wegen */
const PATHS = [
  [[-18.6, -13.6], [18.6, -13.6], [18.6, 13.6], [-18.6, 13.6], [-18.6, -13.6]],
  [[-23.4, -18.4], [23.4, -18.4], [23.4, 18.4], [-23.4, 18.4], [-23.4, -18.4]],
  [[-38, 23.7], [38, 23.7]], [[30.4, -13], [30.4, 13]], [[-24.6, -13], [-24.6, 13]],
  [[18.6, 13.6], [23.4, 18.4]], [[23.4, 13.6], [18.6, 18.4]], [[-34, 20.6], [-34, 28]], [[26, 24.5], [38, 24.5]]
];
const PEDS = 96; const peds = [];
for (let i = 0; i < PEDS; i++){ const path = PATHS[i < 8 ? 5 + (i % 4) : i % 5]; let L = 0; for (let k = 1; k < path.length; k++) L += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]); peds.push({ path, L, t: R(0, L), v: R(0.8, 1.6) * (rand() < 0.5 ? 1 : -1), ph: R(0, 6), side: R(-0.9, 0.9) }); }
const pedBody = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.22, 0.72, 6), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), PEDS);
const pedHead = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.15, 0), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 }), PEDS);
const PED_COLS = ['#2B2E44', '#E9EEF8', '#C2402F', '#6FBBFF', '#F5C66A', '#4A4F6E', '#FF8FB0', '#3FAF6A', '#8A5AB8'];
for (let i = 0; i < PEDS; i++){ pedBody.setColorAt(i, col(pick(PED_COLS))); pedHead.setColorAt(i, col(pick(SKINS))); }
pedBody.castShadow = true; scene.add(pedBody); scene.add(pedHead);
function pathPos(ped, out){
  let t = ((ped.t % ped.L) + ped.L) % ped.L; const p = ped.path;
  for (let k = 1; k < p.length; k++){ const L = Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]); if (t <= L){ const q = t / L; const dx = (p[k][0] - p[k - 1][0]) / L, dz = (p[k][1] - p[k - 1][1]) / L; out.set(lerp(p[k - 1][0], p[k][0], q) + dz * ped.side, 0, lerp(p[k - 1][1], p[k][1], q) - dx * ped.side); return out; } t -= L; }
  return out.set(p[0][0], 0, p[0][1]);
}
/* Dampf & Blüten (ein Shader, zwei Systeme) */
const steamMat = new THREE.ShaderMaterial({
  uniforms: { scale: { value: 300 }, tint: { value: new THREE.Color(1, 1, 1) }, alpha: { value: 0.35 } }, transparent: true, depthWrite: false,
  vertexShader: 'attribute float life; attribute float psize; attribute vec3 color; varying float vL; varying vec3 vC; uniform float scale; void main(){ vL = life; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = psize * (1.0 + (1.0 - life) * 1.6) * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'varying float vL; varying vec3 vC; uniform float alpha; void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 1.8) * vL * (1.0 - vL * 0.3) * alpha; gl_FragColor = vec4(vC, a); }'
});
function particleSystem(n, size, alpha){
  const g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), life = new Float32Array(n), ps = new Float32Array(n), cl = new Float32Array(n * 3), vel = new Float32Array(n * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('life', new THREE.BufferAttribute(life, 1)); g.setAttribute('psize', new THREE.BufferAttribute(ps, 1)); g.setAttribute('color', new THREE.BufferAttribute(cl, 3));
  const m = steamMat.clone(); m.uniforms.alpha.value = alpha; const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  return { g, pos, life, ps, cl, vel, n, next: 0, pts, size };
}
const steam = particleSystem(420, 1.0, 0.32), petals = particleSystem(220, 0.35, 0.9);
function spawn(sys, x, y, z, c, vx, vy, vz, size){ const i = sys.next = (sys.next + 1) % sys.n; sys.pos[i * 3] = x; sys.pos[i * 3 + 1] = y; sys.pos[i * 3 + 2] = z; sys.vel[i * 3] = vx; sys.vel[i * 3 + 1] = vy; sys.vel[i * 3 + 2] = vz; sys.life[i] = 1; sys.ps[i] = size; const cc = col(c); sys.cl[i * 3] = cc.r; sys.cl[i * 3 + 1] = cc.g; sys.cl[i * 3 + 2] = cc.b; }
function stepParticles(sys, dt, decay, grav, drift){ for (let i = 0; i < sys.n; i++){ if (sys.life[i] <= 0) continue; sys.life[i] -= dt * decay; sys.pos[i * 3] += (sys.vel[i * 3] + Math.sin(sys.pos[i * 3 + 1] * 2 + i) * drift) * dt; sys.pos[i * 3 + 1] += (sys.vel[i * 3 + 1] - grav * dt) * dt * 60 / 60; sys.vel[i * 3 + 1] -= grav * dt; sys.pos[i * 3 + 2] += sys.vel[i * 3 + 2] * dt; if (sys.life[i] <= 0) sys.pos[i * 3 + 1] = -50; } sys.g.attributes.position.needsUpdate = true; sys.g.attributes.life.needsUpdate = true; sys.g.attributes.psize.needsUpdate = true; sys.g.attributes.color.needsUpdate = true; }
const steamBurst = { until: 0, x: 0, y: 0, z: 0 };

/* =====================================================================
   10. Spielzüge
   ===================================================================== */
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
function arc(out, from, to, k, height){ out.lerpVectors(from, to, k); out.y += Math.sin(Math.PI * k) * height; return out; }
function distPan(x, z){ const d = Math.hypot(camera.position.x - x, camera.position.z - z); return { v: clamp(1.5 - d / 90, 0.25, 1), pan: clamp((x - controls.target.x) / 40, -0.7, 0.7) }; }
function idle(p, t, amp){ p.armL.rotation.x = Math.sin(t * 2 + p.ph) * 0.22 * amp; p.armR.rotation.x = -Math.sin(t * 2 + p.ph) * 0.22 * amp; p.legL.rotation.x = p.legR.rotation.x = 0; p.g.position.y = PY; }
function walkCycle(p, t, speed){ p.legL.rotation.x = Math.sin(t * speed) * 0.6; p.legR.rotation.x = -p.legL.rotation.x; p.armL.rotation.x = -p.legL.rotation.x * 0.6; p.armR.rotation.x = p.legL.rotation.x * 0.6; }
function dribbleHand(p, t, out, side){ return out.set(0.36 * side, 0, 0.34).multiplyScalar(p.scale).applyQuaternion(p.g.quaternion).add(p.g.position); }
let lastBounce1 = 0, lastBounce2 = 0;
function dribbleBall(ball, p, t, side, speed){
  dribbleHand(p, t, _a, side); const ph = Math.abs(Math.sin(t * speed)); ball.position.set(_a.x, PY + 0.21 + ph * 0.95, _a.z);
  const phase = Math.floor(t * speed / Math.PI); return phase;
}
function stepCourt1(dt, t){
  const S = s1; S.t += dt; const RIM = RIM1; const work = state.settings.mode === 'work';
  const spot = SPOTS1[S.spot];
  if (S.cele > 0){ S.cele -= dt; you.armL.rotation.x = you.armR.rotation.x = -2.9; }
  if (S.phase === 'walk'){
    const dur = Math.max(0.5, S.from.distanceTo(_a.set(spot[0], PY, spot[1])) / 3.2); const k = Math.min(1, S.t / dur);
    you.g.position.lerpVectors(S.from, _a, ease(k)); face(you, spot[0], spot[1] - 1 + (RIM.pos.z - spot[1]) * 0.001); face(you, RIM.pos.x, RIM.pos.z); walkCycle(you, S.t, 11);
    const ph = dribbleBall(ball1, you, S.t, 1, 7); if (ph !== S.bph){ S.bph = ph; const d = distPan(you.g.position.x, you.g.position.z); SFX.bounce(d.v * 0.7, d.pan); }
    if (k >= 1){ S.phase = 'dribble'; S.t = 0; S.dur = R(1.0, 1.6); you.legL.rotation.x = you.legR.rotation.x = 0; }
  } else if (S.phase === 'dribble'){
    face(you, RIM.pos.x, RIM.pos.z); const side = S.t > S.dur * 0.5 ? -1 : 1;
    you.armR.rotation.x = side > 0 ? -0.7 + Math.sin(S.t * 9) * 0.25 : 0; you.armL.rotation.x = side < 0 ? -0.7 + Math.sin(S.t * 9) * 0.25 : 0;
    const ph = dribbleBall(ball1, you, S.t, side, 4.5); if (ph !== S.bph){ S.bph = ph; const d = distPan(you.g.position.x, you.g.position.z); SFX.bounce(d.v, d.pan); }
    // Verteidiger stellt sich dazwischen
    if (S.t >= S.dur){
      const r = mrand(); S.act = work ? (r < 0.17 ? 'dunk' : r < 0.42 ? 'layup' : 'jumper') : (r < 0.1 ? 'dunk' : r < 0.35 ? 'layup' : 'jumper');
      S.t = 0; if (S.act === 'jumper'){ S.phase = 'jumper'; S.made = mrand() < (work ? 0.68 : 0.76); } else { S.phase = 'drive'; S.from.copy(you.g.position); S.side = mrand() < 0.5 ? -1 : 1; S.target = new THREE.Vector3(RIM.pos.x + S.side * 1.0, PY, RIM.pos.z + 2.4); }
    }
  } else if (S.phase === 'drive'){
    const k = Math.min(1, S.t / 0.75); you.g.position.lerpVectors(S.from, S.target, ease(k)); face(you, RIM.pos.x, RIM.pos.z); walkCycle(you, S.t, 16);
    const ph = dribbleBall(ball1, you, S.t, S.side, 9); if (ph !== S.bph){ S.bph = ph; const d = distPan(you.g.position.x, you.g.position.z); SFX.bounce(d.v * 0.8, d.pan); }
    if (k >= 1){ S.phase = S.act; S.t = 0; S.from.copy(you.g.position); S.made = S.act === 'dunk' ? true : mrand() < 0.88; }
  } else if (S.phase === 'layup' || S.phase === 'dunk'){
    const dunk = S.phase === 'dunk'; const dur = dunk ? 1.0 : 0.8; const k = Math.min(1, S.t / dur);
    _b.set(RIM.pos.x + (dunk ? 0 : S.side * 0.3), PY, RIM.pos.z + (dunk ? 0.45 : 0.9));
    you.g.position.lerpVectors(S.from, _b, k); you.g.position.y = PY + Math.sin(Math.PI * Math.min(1, k * 1.05)) * (dunk ? 1.95 : 1.05);
    you.legL.rotation.x = -0.9; you.legR.rotation.x = 0.4; face(you, RIM.pos.x, RIM.pos.z);
    you.armL.rotation.x = you.armR.rotation.x = -3.0 * Math.min(1, S.t * 3);
    const rel = dunk ? 0.58 : 0.55;
    if (k < rel){ handPos(you, ball1.position); ball1.position.y += 0.35; S.rel = null; }
    else { if (!S.rel){ S.rel = ball1.position.clone(); S.relT = S.t; } const kk = Math.min(1, (S.t - S.relT) / (dunk ? 0.22 : 0.3)); if (dunk) ball1.position.lerpVectors(S.rel, _c.set(RIM.pos.x, RIM.pos.y - 0.6, RIM.pos.z), kk); else arc(ball1.position, S.rel, _c.copy(RIM.pos).add(_a.set(S.made ? 0 : 0.35, 0.28, S.made ? 0 : 0.2)), kk, 0.7);
      if (kk >= 1 && !S.done){ S.done = true; outcome1(dunk ? 'dunk' : 'layup'); } }
    if (k >= 1){ S.phase = 'land'; S.t = 0; S.done = false; }
  } else if (S.phase === 'jumper'){
    const k = Math.min(1, S.t / 1.0);
    you.g.position.y = PY + Math.sin(Math.PI * Math.min(1, S.t * 2.0)) * 0.55; face(you, RIM.pos.x, RIM.pos.z);
    you.armL.rotation.x = you.armR.rotation.x = -2.8 * Math.min(1, S.t * 4);
    if (S.t < 0.28){ handPos(you, ball1.position); ball1.position.y += 0.4; S.rel = null; }
    else { if (!S.rel){ S.rel = ball1.position.clone(); } const kk = Math.min(1, (S.t - 0.28) / 0.85); arc(ball1.position, S.rel, _c.copy(RIM.pos).add(_a.set(S.made ? 0 : 0.33, 0.3, S.made ? 0 : 0.15)), kk, 3.0); if (kk >= 1 && !S.done){ S.done = true; outcome1('jumper'); } }
    if (k >= 1 && S.done){ S.phase = 'land'; S.t = 0; S.done = false; }
  } else if (S.phase === 'land'){
    you.g.position.y += (PY - you.g.position.y) * Math.min(1, dt * 10); you.legL.rotation.x = you.legR.rotation.x = 0; if (S.cele <= 0) you.armL.rotation.x = you.armR.rotation.x = 0;
    const k = Math.min(1, S.t / (S.made ? 0.45 : 0.5));
    if (S.made) ball1.position.lerpVectors(S.rel2, _c.set(RIM.pos.x, PY + 0.21, RIM.pos.z + 0.6), k); else arc(ball1.position, S.rel2, S.rebound, k, 1.2);
    if (k >= 1){ S.phase = 'roll'; S.t = 0; S.from.copy(you.g.position); S.ballFrom = ball1.position.clone(); S.spot = (S.spot + 1) % SPOTS1.length; S.bounces = 0; }
  } else if (S.phase === 'roll'){
    const ns = SPOTS1[S.spot]; const dur = 1.1; const k = Math.min(1, S.t / dur);
    ball1.position.lerpVectors(S.ballFrom, _c.set(ns[0], PY + 0.21, ns[1]), k); ball1.position.y = PY + 0.21 + Math.abs(Math.sin(k * Math.PI * 3)) * 0.6 * (1 - k);
    const bph = Math.floor(k * 3); if (bph !== S.bounces && bph < 3){ S.bounces = bph; const d = distPan(ball1.position.x, ball1.position.z); SFX.bounce(d.v * 0.5, d.pan); }
    _a.set(ns[0], PY, ns[1]); you.g.position.lerpVectors(S.from, _a, ease(k)); face(you, ns[0], ns[1] + (ns[1] - you.g.position.z) * 0.001); face(you, ball1.position.x, ball1.position.z); walkCycle(you, S.t, 10);
    if (k >= 1){ S.phase = 'dribble'; S.t = 0; S.dur = R(1.0, 1.6); }
  }
  ball1.rotation.x += dt * 7; ball1.rotation.z += dt * 3;
  // Verteidiger / Training
  const guard = defenders[S.guard];
  defenders.forEach((d, i) => {
    if (!work) return;
    if (d.fall > 0){ d.fall -= dt; const f = d.fall > 1.0 ? Math.min(1, (1.6 - d.fall) / 0.25) : Math.max(0, d.fall / 0.6); d.g.rotation.x = -1.35 * f; d.g.position.y = PY + 0.2 * f; d.armL.rotation.x = d.armR.rotation.x = -2.0 * f; return; }
    d.g.rotation.x = 0;
    if (i === S.guard && (S.phase === 'dribble' || S.phase === 'drive' || S.phase === 'jumper' || S.phase === 'walk' || S.phase === 'roll')){
      _a.copy(RIM.pos).sub(you.g.position); _a.y = 0; _a.normalize(); _b.copy(you.g.position).addScaledVector(_a, 1.4); _b.y = PY;
      d.g.position.x += (_b.x - d.g.position.x) * Math.min(1, dt * 4); d.g.position.z += (_b.z - d.g.position.z) * Math.min(1, dt * 4);
      d.g.position.y = PY + (S.phase === 'jumper' && S.t < 0.6 ? Math.sin(Math.PI * Math.min(1, S.t * 1.8)) * 0.6 : 0);
      d.armL.rotation.x = d.armR.rotation.x = -2.6; face(d, you.g.position.x, you.g.position.z); walkCycle(d, t, 9);
    } else {
      d.g.position.x += (d.home.x + Math.sin(t * 1.4 + d.ph) * 0.5 - d.g.position.x) * Math.min(1, dt * 2.5); d.g.position.z += (d.home.z + Math.cos(t * 1.1 + d.ph) * 0.3 - d.g.position.z) * Math.min(1, dt * 2.5); d.g.position.y = PY;
      d.armL.rotation.x += (-1.2 - d.armL.rotation.x) * Math.min(1, dt * 4); d.armR.rotation.x = d.armL.rotation.x; d.legL.rotation.x = d.legR.rotation.x = Math.sin(t * 6 + d.ph) * 0.15; face(d, you.g.position.x, you.g.position.z);
    }
  });
  if (referee.signal > 0){ referee.signal -= dt; referee.armR.rotation.x = -3.0; } else { referee.armR.rotation.x += (0 - referee.armR.rotation.x) * Math.min(1, dt * 6); idle(referee, t, 0.3); referee.armR.rotation.x = referee.signal > 0 ? -3 : referee.armR.rotation.x; }
  face(referee, you.g.position.x, you.g.position.z);
}
function outcome1(kind){
  const S = s1, RIM = RIM1, d = distPan(RIM.pos.x, RIM.pos.z); state.session.c1shots++;
  S.rel2 = ball1.position.clone();
  if (S.made){
    state.session.c1hits++; S.cele = 0.9; referee.signal = 1.2; cheer.c1 = 1.3;
    if (kind === 'dunk'){ state.session.c1dunks++; RIM.shake = 0.6; burst(RIM.pos.x, RIM.pos.y + 0.5, RIM.pos.z); SFX.slam(d.v, d.pan); floatText('DUNK!', '#FFB070', _a.copy(RIM.pos).add(_b.set(0, 1.4, 0))); SFX.cheer(d.v * 1.2, d.pan); if (state.settings.mode === 'work'){ const g = defenders[S.guard]; g.fall = 1.6; } }
    else { SFX.swish(d.v, d.pan); floatText(state.settings.mode === 'work' ? '+2' : 'TREFFER', '#FFB070', _a.copy(RIM.pos).add(_b.set(0, 1.3, 0))); SFX.cheer(d.v * 0.8, d.pan); }
    RIM.shake = Math.max(RIM.shake, 0.25);
  } else { SFX.rim(d.v, d.pan); RIM.shake = 0.35; floatText('KNAPP', '#9DB2DD', _a.copy(RIM.pos).add(_b.set(0, 1.3, 0))); S.rebound.set(RIM.pos.x + R(-2.2, 2.2), PY + 0.21, RIM.pos.z + R(1.8, 3.8)); }
  S.guard = Math.floor(mrand() * defenders.length);
  drawJumbo();
}
/* Court 2 */
function weightedShooter(){ const tot = team.reduce((s, p) => s + p.h.weight, 0); let r = mrand() * tot; for (const p of team){ r -= p.h.weight; if (r <= 0) return p; } return team[0]; }
function newPossession(){
  const S = s2; S.poss++; const P = state.portfolio;
  S.ft = P.dividends > 0 && S.poss % 4 === 0; S.steal = !S.ft && P.week < 0 && S.poss % 3 === 2;
  const shooter = weightedShooter(); const others = team.filter(p => p !== shooter);
  for (let i = others.length - 1; i > 0; i--){ const j = Math.floor(mrand() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
  S.chain = others.slice(0, 2 + Math.floor(mrand() * 2)).concat([shooter]); S.step = 0; S.shooter = shooter;
  if (S.ft){ S.phase = 'ftsetup'; S.t = 0; S.ftShot = 0; team.forEach((p, i) => { p.target = p === shooter ? new THREE.Vector3(COURT.c2, PY, 3.4) : new THREE.Vector3(COURT.c2 + (i % 2 ? 1.75 : -1.75), PY, 5.2 + Math.floor(i / 2) * 1.1); }); }
  else { S.phase = 'pass'; S.t = 0; team.forEach(p => { p.target = new THREE.Vector3(ZONES2[p.zone][0] + R(-1.2, 1.2), PY, ZONES2[p.zone][1] + R(-1.0, 1.0)); }); handPos(S.chain[0], ball2.position); }
}
function stepCourt2(dt, t){
  const S = s2; S.t += dt; if (!team.length) return;
  team.forEach(p => { if (p.target){ p.g.position.x += (p.target.x - p.g.position.x) * Math.min(1, dt * 2.2); p.g.position.z += (p.target.z - p.g.position.z) * Math.min(1, dt * 2.2); } if (p !== S.shooter || (S.phase !== 'shoot' && S.phase !== 'ft')){ face(p, ball2.position.x, ball2.position.z); idle(p, t, 1); const mv = p.target ? Math.hypot(p.target.x - p.g.position.x, p.target.z - p.g.position.z) : 0; if (mv > 0.3) walkCycle(p, t, 9); } });
  market.forEach((m, i) => { if (m === S.stealer && (S.phase === 'steal' || S.phase === 'stealrun' || S.phase === 'steallay')) return; m.g.position.x = m.home.x + Math.sin(t * 0.8 + m.ph) * 1.3; m.g.position.z = m.home.z + Math.cos(t * 0.6 + m.ph) * 0.9; m.g.position.y = PY; m.g.rotation.x = 0; face(m, ball2.position.x, ball2.position.z); m.armL.rotation.x = m.armR.rotation.x = -1.3; m.legL.rotation.x = m.legR.rotation.x = Math.sin(t * 5 + m.ph) * 0.2; });
  bench.forEach(p => { p.armL.rotation.x = -0.5 + Math.sin(t * 1.5 + p.ph) * 0.1; });
  if (S.phase === 'reset'){ if (S.t > 0.6) newPossession(); return; }
  if (S.phase === 'pass'){
    const a = S.chain[S.step], b = S.chain[S.step + 1]; const k = Math.min(1, S.t / 0.6);
    handPos(a, _a); handPos(b, _b); arc(ball2.position, _a, _b, k, 1.0); a.armR.rotation.x = -1.5 * (1 - k); a.armL.rotation.x = -1.5 * (1 - k);
    if (S.steal && S.step === 1 && k > 0.5){ S.phase = 'steal'; S.t = 0; S.stealer = market[Math.floor(mrand() * market.length)]; S.from = ball2.position.clone(); return; }
    if (k >= 1){ S.t = 0; S.step++; a.target = new THREE.Vector3(ZONES2[a.zone][0] + R(-1.3, 1.3), PY, ZONES2[a.zone][1] + R(-1.0, 1.0)); if (S.step >= S.chain.length - 1){ S.phase = 'shoot'; S.t = 0; S.made = mrand() < (S.shooter.h.ret > 0 ? 0.82 : 0.42); S.done = false; S.rel = null; } }
  } else if (S.phase === 'steal'){
    const st = S.stealer; const k = Math.min(1, S.t / 0.35); handPos(st, _b); ball2.position.lerpVectors(S.from, _b, k); st.armL.rotation.x = st.armR.rotation.x = -2.4; face(st, ball2.position.x, ball2.position.z);
    _a.copy(S.from); st.g.position.x += (_a.x - st.g.position.x) * Math.min(1, dt * 6); st.g.position.z += (_a.z + 0.8 - st.g.position.z) * Math.min(1, dt * 6);
    if (k >= 1){ S.phase = 'stealrun'; S.t = 0; S.from.copy(st.g.position); S.target = new THREE.Vector3(RIM2B.pos.x + 0.9, PY, RIM2B.pos.z + 2.3); floatText('STEAL', '#FF8B7A', _c.copy(st.g.position).add(_b.set(0, 2.6, 0))); SFX.whistle(); }
  } else if (S.phase === 'stealrun'){
    const st = S.stealer; const k = Math.min(1, S.t / 1.1); st.g.position.lerpVectors(S.from, S.target, ease(k)); face(st, RIM2B.pos.x, RIM2B.pos.z); walkCycle(st, S.t, 16);
    dribbleBall(ball2, st, S.t, 1, 9);
    if (k >= 1){ S.phase = 'steallay'; S.t = 0; S.from.copy(st.g.position); S.rel = null; S.done = false; }
  } else if (S.phase === 'steallay'){
    const st = S.stealer; const k = Math.min(1, S.t / 0.8); _b.set(RIM2B.pos.x + 0.3, PY, RIM2B.pos.z + 0.9); st.g.position.lerpVectors(S.from, _b, k); st.g.position.y = PY + Math.sin(Math.PI * Math.min(1, k * 1.05)) * 1.0; st.armL.rotation.x = st.armR.rotation.x = -3.0; face(st, RIM2B.pos.x, RIM2B.pos.z);
    if (k < 0.55){ handPos(st, ball2.position); ball2.position.y += 0.35; } else { if (!S.rel) S.rel = ball2.position.clone(); const kk = Math.min(1, (k - 0.55) / 0.4); arc(ball2.position, S.rel, _c.copy(RIM2B.pos).add(_a.set(0, 0.28, 0)), kk, 0.6); if (kk >= 1 && !S.done){ S.done = true; state.session.market++; const d = distPan(RIM2B.pos.x, RIM2B.pos.z); SFX.swish(d.v * 0.8, d.pan); floatText('MARKT +2', '#FF8B7A', _a.copy(RIM2B.pos).add(_b.set(0, 1.3, 0))); RIM2B.shake = 0.3; drawJumbo(); } }
    if (k >= 1){ S.phase = 'net'; S.t = 0; S.rim = RIM2B; S.rel2 = ball2.position.clone(); S.made = true; S.stealer.g.position.y = PY; }
  } else if (S.phase === 'ftsetup'){
    if (S.t > 1.3){ S.phase = 'ft'; S.t = 0; S.rel = null; S.done = false; S.made = mrand() < 0.9; handPos(S.shooter, ball2.position); }
  } else if (S.phase === 'ft' || S.phase === 'shoot'){
    const sh = S.shooter; const ft = S.phase === 'ft'; face(sh, RIM2.pos.x, RIM2.pos.z); const k = Math.min(1, S.t / (ft ? 1.3 : 1.0));
    if (!ft) sh.g.position.y = PY + Math.sin(Math.PI * Math.min(1, S.t * 1.8)) * 0.5;
    const relT = ft ? 0.55 : 0.28; sh.armL.rotation.x = sh.armR.rotation.x = -2.8 * Math.min(1, S.t * (ft ? 2 : 4));
    if (S.t < relT){ handPos(sh, ball2.position); ball2.position.y += 0.4; }
    else { if (!S.rel) S.rel = ball2.position.clone(); const kk = Math.min(1, (S.t - relT) / 0.8); arc(ball2.position, S.rel, _c.copy(RIM2.pos).add(_a.set(S.made ? 0 : 0.33, 0.3, S.made ? 0 : 0.15)), kk, ft ? 1.6 : 2.8);
      if (kk >= 1 && !S.done){ S.done = true; const d = distPan(RIM2.pos.x, RIM2.pos.z); state.session.c2shots++;
        if (S.made){ state.session.c2hits++; if (ft) state.session.c2ft++; cheer.c2 = 1.2; SFX.swish(d.v, d.pan); SFX.cheer(d.v * 0.7, d.pan); floatText(ft ? 'DIVIDENDE' : '+2 ' + sh.h.short.toUpperCase().slice(0, 9), '#8EF0C8', _a.copy(RIM2.pos).add(_b.set(0, 1.3, 0))); RIM2.shake = 0.25; }
        else { SFX.rim(d.v, d.pan); RIM2.shake = 0.35; floatText('KNAPP', '#9DB2DD', _a.copy(RIM2.pos).add(_b.set(0, 1.3, 0))); }
        drawJumbo(); S.rel2 = ball2.position.clone(); S.rim = RIM2; S.rebound = new THREE.Vector3(RIM2.pos.x + R(-2, 2), PY + 0.21, RIM2.pos.z - R(1.8, 3.6)); }
    }
    if (k >= 1 && S.done){ sh.g.position.y = PY; if (ft && S.ftShot === 0){ S.ftShot = 1; S.phase = 'ftagain'; S.t = 0; } else { S.phase = 'net'; S.t = 0; } }
  } else if (S.phase === 'ftagain'){
    const k = Math.min(1, S.t / 0.5); ball2.position.lerpVectors(S.rel2, _c.set(RIM2.pos.x, PY + 0.21, RIM2.pos.z - 0.6), k);
    if (k >= 1){ S.phase = 'ftback'; S.t = 0; S.from.copy(ball2.position); }
  } else if (S.phase === 'ftback'){
    const k = Math.min(1, S.t / 0.7); handPos(S.shooter, _b); arc(ball2.position, S.from, _b, k, 1.2); if (k >= 1){ S.phase = 'ft'; S.t = 0; S.rel = null; S.done = false; S.made = mrand() < 0.9; }
  } else if (S.phase === 'net'){
    const k = Math.min(1, S.t / 0.45); const rim = S.rim || RIM2;
    if (S.made) ball2.position.lerpVectors(S.rel2, _c.set(rim.pos.x, PY + 0.21, rim.pos.z - rim.dir * 0.6), k); else arc(ball2.position, S.rel2, S.rebound, k, 1.1);
    if (k >= 1){ S.phase = 'back'; S.t = 0; S.from.copy(ball2.position); S.next = team[Math.floor(mrand() * team.length)]; }
  } else if (S.phase === 'back'){
    const k = Math.min(1, S.t / 0.9); handPos(S.next, _b); arc(ball2.position, S.from, _b, k, 1.4); if (k >= 1){ S.phase = 'reset'; S.t = 0; }
  }
  ball2.rotation.x += dt * 7; ball2.rotation.z += dt * 2;
}
