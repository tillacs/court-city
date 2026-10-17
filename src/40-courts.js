
/* =====================================================================
   6. Zustand
   ===================================================================== */
const state = {
  portfolio: JSON.parse(JSON.stringify(SAMPLE)),
  settings: Object.assign({}, DEFAULT_SETTINGS),
  session: { c1shots: 0, c1hits: 0, c1dunks: 0, c2shots: 0, c2hits: 0, c2ft: 0, market: 0 },
  live: { status: 'sample', code: null, asOf: null, retried: false },
  day: false
};
function court1Numbers(){
  const S = state.settings, today = new Date(); today.setHours(0, 0, 0, 0);
  const d1 = S.start ? new Date(S.start + 'T00:00:00') : null, d2 = S.end ? new Date(S.end + 'T00:00:00') : null;
  const DAY = 86400000;
  if (S.mode === 'work'){
    if (d1 && d2 && d2 > d1){ const total = Math.round((d2 - d1) / DAY); const done = clamp(Math.round((today - d1) / DAY), 0, total); return { a: done, b: total - done, pct: done / total, real: true, cap: 'Tage geschafft : Tage übrig' }; }
    return { a: 42, b: 98, pct: 0.3, real: false, cap: 'Tage geschafft : Tage übrig' };
  }
  if (d1){ const wk = clamp(Math.floor((today - d1) / DAY / 7) + 1, 1, S.semWeeks || 14); return { a: wk, b: S.semWeeks || 14, pct: wk / (S.semWeeks || 14), real: true, cap: 'Semesterwoche' }; }
  return { a: 3, b: S.semWeeks || 14, pct: 3 / (S.semWeeks || 14), real: false, cap: 'Semesterwoche' };
}

/* =====================================================================
   7. Der Platz: Courts, Körbe, Tribünen, Jumbotron
   ===================================================================== */
const PY = SLAB + PLZ + 0.05;
const COURT = { c1: -7, c2: 7, w: 9, l: 16 };
function courtTexture(keyPaint, label){
  const c = document.createElement('canvas'); c.width = 512; c.height = 910; const g = c.getContext('2d');
  g.fillStyle = '#A9743A'; g.fillRect(0, 0, 512, 910);
  for (let x = 0; x < 512; x += 14){ g.fillStyle = (x / 14) % 2 ? 'rgba(70,40,15,.12)' : 'rgba(255,230,190,.03)'; g.fillRect(x, 0, 14, 910); }
  for (let y = 0; y < 910; y += 90){ g.fillStyle = 'rgba(60,30,10,.12)'; g.fillRect(0, y + ((y / 90) % 2) * 45, 512, 2); }
  g.strokeStyle = '#F6E7CF'; g.lineWidth = 6; g.strokeRect(12, 12, 488, 886);
  g.beginPath(); g.moveTo(12, 455); g.lineTo(500, 455); g.stroke();
  g.beginPath(); g.arc(256, 455, 64, 0, Math.PI * 2); g.stroke();
  [[12, 1], [898, -1]].forEach(([y, s]) => {
    g.fillStyle = keyPaint; g.fillRect(256 - 84, s > 0 ? y : y - 300, 168, 300); g.strokeRect(256 - 84, s > 0 ? y : y - 300, 168, 300);
    g.beginPath(); g.arc(256, y + s * 300, 64, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(30, y); g.lineTo(30, y + s * 140); g.moveTo(482, y); g.lineTo(482, y + s * 140); g.stroke();
    g.beginPath(); g.ellipse(256, y + s * 140, 226, 262, 0, s > 0 ? 0 : Math.PI, s > 0 ? Math.PI : 2 * Math.PI); g.stroke();
    for (let i = 1; i <= 4; i++){ g.fillStyle = '#F6E7CF'; g.fillRect(256 - 96, y + s * (60 + i * 42), 12, 4); g.fillRect(256 + 84, y + s * (60 + i * 42), 12, 4); }
  });
  g.save(); g.translate(256, 455); g.rotate(-Math.PI / 2); g.fillStyle = 'rgba(40,20,8,.4)'; g.font = '26px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 0, 0); g.restore();
  g.save(); g.translate(256, 150); g.rotate(-Math.PI / 2); g.fillStyle = 'rgba(255,240,220,.55)'; g.font = '14px "Press Start 2P", monospace'; g.textAlign = 'center'; g.fillText('COURT CITY', 0, 0); g.restore();
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
}
function buildCourt(cx, keyPaint, label, kind){
  B.box('#1F2244', cx, PY - 0.02, 0, COURT.w + 2.2, 0.06, COURT.l + 2.2);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(COURT.w, COURT.l), new THREE.MeshStandardMaterial({ map: courtTexture(keyPaint, label), roughness: 0.85 }));
  p.rotation.x = -Math.PI / 2; p.position.set(cx, PY + 0.03, 0); p.receiveShadow = true; scene.add(p);
  p.userData.pick = { kind }; pickables.push(p);
  return p;
}
buildCourt(COURT.c1, '#D9682A', 'DU', 'court1');
buildCourt(COURT.c2, '#2F9C7C', 'TEAM', 'court2');
const rims = [];
function hoop(cx, zEnd, dir){
  const poleZ = zEnd - dir * 1.1;
  B.box('#4A4F6E', cx, PY + 1.9, poleZ, 0.24, 3.8, 0.24); B.box('#4A4F6E', cx, PY + 3.7, poleZ + dir * 0.6, 0.16, 0.16, 1.2);
  B.box('#2A2E4F', cx, PY + 0.25, poleZ, 1.2, 0.5, 1.0);
  const bb = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: col('#F2F4FF').getHex(), roughness: 0.3, transparent: true, opacity: 0.85 })); bb.material.color.copy(col('#F2F4FF'));
  bb.position.set(cx, PY + 3.5, zEnd + dir * 0.1); bb.scale.set(1.9, 1.15, 0.08); bb.castShadow = true; scene.add(bb);
  B.box('#E25A2A', cx, PY + 3.3, zEnd + dir * 0.15, 0.62, 0.46, 0.02); B.box('#E25A2A', cx, PY + 2.95, zEnd + dir * 0.15, 1.9, 0.06, 0.03);
  const rimGroup = new THREE.Group(); rimGroup.position.set(cx, PY + 3.02, zEnd + dir * 0.47); scene.add(rimGroup);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 6, 18), new THREE.MeshStandardMaterial({ roughness: 0.4 })); rim.material.color.copy(col('#FF5A1F')); rim.rotation.x = Math.PI / 2; rimGroup.add(rim);
  const net = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.14, 0.44, 10, 2, true), new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.8 })); net.material.color.copy(col('#F0F2FF')); net.position.y = -0.24; rimGroup.add(net);
  // Wurfuhr
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const clock = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: tex })); clock.position.set(cx, PY + 4.35, zEnd + dir * 0.12); if (dir < 0) clock.rotation.y = Math.PI; scene.add(clock);
  B.box('#1A1A28', cx, PY + 4.35, zEnd + dir * 0.02, 1.1, 0.6, 0.14);
  const r = { pos: new THREE.Vector3(cx, PY + 3.02, zEnd + dir * 0.47), group: rimGroup, shake: 0, c, tex, t: 24, dir };
  rims.push(r); return r;
}
const RIM1 = hoop(COURT.c1, -7.8, 1), RIM1B = hoop(COURT.c1, 7.8, -1);
const RIM2B = hoop(COURT.c2, -7.8, 1), RIM2 = hoop(COURT.c2, 7.8, -1);
function drawClock(r){ const g = r.c.getContext('2d'); g.fillStyle = '#0A0A12'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#FF3B3B'; g.font = '44px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#FF3B3B'; g.shadowBlur = 8; g.fillText(String(Math.max(0, Math.ceil(r.t))).padStart(2, '0'), 64, 34); r.tex.needsUpdate = true; }
rims.forEach(drawClock);
/* Flutlichtmasten */
[[-15.5, -12], [15.5, -12], [-15.5, 12], [15.5, 12]].forEach(([x, z]) => {
  const ry = Math.atan2(-x, -z);
  B.box('#4A4F6E', x, PY + 5.6, z, 0.42, 11.2, 0.42); B.box('#2C3150', x, PY + 11.2, z, 2.8, 0.5, 0.5, ry);
  for (let i = -1; i <= 1; i++){ const f = frame(x, z, ry); const p = f(i * 0.9, 0.3); B.box('#2C3150', p[0], PY + 10.7, p[1], 0.7, 0.9, 0.5, ry); B.glow('#FFF4D6', p[0], PY + 10.7, p[1] , 0.6, 0.8, 0.06, ry); }
  glow('#FFE7B8', x, PY + 10.7, z, 11, 0.6);
  B.box('#2A2E4F', x, PY + 0.2, z, 1.2, 0.4, 1.2);
});
/* Tribünen und Publikum */
const crowdSeats = [];
[-1, 1].forEach(side => {
  for (let r = 0; r < 3; r++){
    const x = side * (13.4 + r * 1.1), y0 = PY + 0.3 + r * 0.5;
    B.box('#3A3F66', x, y0 - 0.05, 0, 1.1, 0.6 + r * 1.0, 15);
    B.box('#2C3150', x + side * 0.1, y0 + 0.28 + r * 0.5 - 0.02, 0, 0.9, 0.06, 15);
    for (let z = -6.8; z <= 6.8; z += 1.08) if (rand() < 0.86) crowdSeats.push({ x, y: y0 + 0.3 + r * 0.5, z: z + R(-0.12, 0.12), ph: R(0, 6), side, col: pick(['#FF8A3D', '#5EE6B0', '#F5C66A', '#6FBBFF', '#E9EEF8', '#FF5FA2', '#C49BFF', '#2A2E4F']), skin: pick(SKINS) });
  }
  B.box('#4A4F6E', side * 16.4, PY + 1.3, 7.6, 0.08, 2.6, 0.08); B.box('#4A4F6E', side * 16.4, PY + 1.3, -7.6, 0.08, 2.6, 0.08); B.box('#8A90B0', side * 16.4, PY + 2.55, 0, 0.06, 0.06, 15.2);
});
const crowdBody = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.25, 0.7, 6), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), crowdSeats.length);
const crowdHead = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.17, 0), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), crowdSeats.length);
const crowdArm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), crowdSeats.length);
crowdSeats.forEach((s, i) => { crowdBody.setColorAt(i, col(s.col)); crowdHead.setColorAt(i, col(s.skin)); crowdArm.setColorAt(i, col(s.skin)); });
[crowdBody, crowdHead, crowdArm].forEach(m => { m.castShadow = true; scene.add(m); });
const cheer = { c1: 0, c2: 0 };
/* Bänke, Anschreibertisch, Kamera, Coach-Häuschen */
[[COURT.c1, 'Bank · Court 1'], [COURT.c2, 'Bank · Court 2']].forEach(([cx]) => { B.box('#5A4A3A', cx, PY + 0.45, 10.6, 5.2, 0.12, 0.5); B.box('#5A4A3A', cx, PY + 0.9, 10.85, 5.2, 0.12, 0.08); [-2.2, 2.2].forEach(k => B.box('#3A3F66', cx + k, PY + 0.2, 10.6, 0.12, 0.42, 0.42)); for (let i = 0; i < 4; i++) B.box(pick(['#9FD8FF', '#F2F4FF', '#FFC0D8']), cx - 2 + i * 0.5, PY + 0.62, 10.35, 0.12, 0.3, 0.12); B.box('#E9EEF8', cx + 2, PY + 0.57, 10.6, 0.6, 0.1, 0.4); });
B.box('#2C3150', 0, PY + 0.45, 11.3, 5.6, 0.9, 0.9); B.box('#1A1A28', 0, PY + 0.95, 11.3, 5.8, 0.1, 1.0);
[-1.6, 0, 1.6].forEach(k => { B.box('#1A1A28', k, PY + 1.35, 11.0, 1.1, 0.7, 0.08, 0, -0.25); win(pick(['#5FE3FF', '#7CFFB2', '#FFD24A']), k, PY + 1.35, 10.96, 0.95, 0.55, Math.PI); });
glow('#5FE3FF', 0, PY + 1.4, 10.6, 4, 0.3);
(function camop(){ const x = -15.4, z = -10.8; B.box('#3A3F66', x, PY + 0.6, z, 1.8, 1.2, 1.8); B.box('#1A1A28', x, PY + 2.2, z, 0.12, 2, 0.12); B.box('#1A1A28', x, PY + 3.25, z, 0.7, 0.45, 0.9, Math.atan2(7 - x, 0 - z)); B.glow('#FF3B3B', x + 0.2, PY + 3.5, z, 0.08, 0.08, 0.08); pickBox({ kind: 'tip', title: 'Kameraplattform', jp: 'カメラ', sub: 'Überträgt auf den Jumbotron' }, x, PY + 2, z, 2, 4, 2); })();
const coachHut = new THREE.Group(); coachHut.position.set(0, PY, 7.2); scene.add(coachHut);
(function hut(){
  const glass = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.1 })); glass.material.color.copy(col('#9FC8FF')); glass.position.set(0, 1.25, 0); glass.scale.set(2.3, 2.5, 2.3); coachHut.add(glass);
  B.box('#2C3150', 0, PY + 2.6, 7.2, 2.7, 0.2, 2.7); B.box('#2C3150', 0, PY + 0.05, 7.2, 2.7, 0.1, 2.7);
  B.box('#4A4F6E', 0, PY + 0.45, 7.6, 1.5, 0.16, 0.6); B.box('#4A4F6E', 0, PY + 0.8, 7.25, 1.5, 0.7, 0.12);
  const uv = ATLAS.signH('COACH', { color: '#C7CCF0', bg: '#12173D', border: '#4A4A8A', bw: 4, font: '30px "Press Start 2P", monospace', dy: 2 }); ATLAS.plane(uv, 2.2, 0.55, 0, PY + 3.1, 8.55, 0, true);
  pickBox({ kind: 'coach' }, 0, PY + 1.4, 7.2, 2.6, 3.2, 2.6);
})();
/* Jumbotron: vier Seiten, von jedem Blickwinkel je ein Court lesbar */
const JUMBO = { x: 0, y: PY + 11.2, z: -11.6, w: 6.4, h: 3.9 };
const jumbo = {};
(function jumbotron(){
  B.box('#4A4F6E', -1.2, PY + 4.6, JUMBO.z, 0.36, 9.2, 0.36); B.box('#4A4F6E', 1.2, PY + 4.6, JUMBO.z, 0.36, 9.2, 0.36); B.box('#2A2E4F', 0, PY + 0.25, JUMBO.z, 3.2, 0.5, 1.2);
  B.box('#4A4F6E', 0, PY + 6.2, JUMBO.z, 2.8, 0.2, 0.2); B.box('#4A4F6E', 0, PY + 8.6, JUMBO.z, 2.8, 0.2, 0.2);
  const mk = () => { const c = document.createElement('canvas'); c.width = 512; c.height = 312; const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return { c, t, m: new THREE.MeshBasicMaterial({ map: t }) }; };
  jumbo.c1 = mk(); jumbo.c2 = mk();
  const dark = new THREE.MeshStandardMaterial({ roughness: 0.6 }); dark.color.copy(col('#14142A'));
  const cube = new THREE.Mesh(BOX, [jumbo.c2.m, jumbo.c2.m, dark, dark, jumbo.c1.m, jumbo.c1.m]); cube.position.set(JUMBO.x, JUMBO.y, JUMBO.z); cube.scale.set(JUMBO.w, JUMBO.h, JUMBO.w); cube.castShadow = true; scene.add(cube);
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => B.box('#1A1A28', JUMBO.x + sx * JUMBO.w / 2, JUMBO.y, JUMBO.z + sz * JUMBO.w / 2, 0.3, JUMBO.h + 0.3, 0.3));
  const led = new THREE.Mesh(new THREE.BoxGeometry(JUMBO.w + 0.5, 0.22, JUMBO.w + 0.5), new THREE.MeshBasicMaterial()); led.material.color.copy(col('#FF8A3D')); led.position.set(JUMBO.x, JUMBO.y + JUMBO.h / 2 + 0.28, JUMBO.z); led.userData.night = true; scene.add(led); jumbo.led = led;
  glow('#FF8A3D', JUMBO.x, JUMBO.y + JUMBO.h / 2 + 0.3, JUMBO.z, 10, 0.3); glow('#8EF0C8', JUMBO.x, JUMBO.y - 1.2, JUMBO.z, 9, 0.22);
  pickBox({ kind: 'tip', title: 'Jumbotron', jp: '大型ビジョン', sub: 'Vier Seiten, zwei Courts, immer lesbar' }, JUMBO.x, JUMBO.y, JUMBO.z, JUMBO.w + 0.6, JUMBO.h + 0.8, JUMBO.w + 0.6);
})();
function drawJumbo(){
  const P = state.portfolio, S = state.settings, n = court1Numbers();
  const draw = (j, fn) => { const g = j.c.getContext('2d'); g.fillStyle = '#050611'; g.fillRect(0, 0, 512, 312); for (let y = 0; y < 312; y += 4){ g.fillStyle = 'rgba(255,255,255,.028)'; g.fillRect(0, y, 512, 1); } g.textAlign = 'center'; g.textBaseline = 'middle'; fn(g); j.t.needsUpdate = true; };
  draw(jumbo.c1, g => {
    const work = S.mode === 'work';
    g.strokeStyle = '#FF8A3D'; g.lineWidth = 5; g.strokeRect(6, 6, 500, 300);
    g.fillStyle = '#FFB070'; g.font = '15px "Press Start 2P", monospace'; g.fillText(work ? 'LIGASPIEL · ' + (S.label || 'PRAKTIKUM').toUpperCase() : 'WURFTRAINING · SEMESTER', 256, 42);
    if (work){
      g.font = '20px "Press Start 2P", monospace'; g.fillStyle = '#FF8A3D'; g.fillText('DU', 118, 108); g.fillStyle = '#9DB2DD'; g.fillText((S.opponent || 'GEGNER').toUpperCase().slice(0, 9), 394, 108);
      g.font = '66px "Press Start 2P", monospace'; g.fillStyle = '#FF8A3D'; g.fillText(String(n.a), 118, 182); g.fillStyle = '#5B6390'; g.fillText(':', 256, 182); g.fillStyle = '#9DB2DD'; g.fillText(String(n.b), 394, 182);
      g.font = '12px "Press Start 2P", monospace'; g.fillStyle = '#8C97C2'; g.fillText(n.cap.toUpperCase(), 256, 246);
    } else {
      g.font = '66px "Press Start 2P", monospace'; g.fillStyle = '#FF8A3D'; g.fillText(n.a + '/' + n.b, 256, 160);
      g.font = '12px "Press Start 2P", monospace'; g.fillStyle = '#8C97C2'; g.fillText('SEMESTERWOCHE · KEIN GEGNER', 256, 236);
    }
    g.fillStyle = '#FFD08A'; g.font = '11px "Press Start 2P", monospace'; g.fillText('HEUTE ' + state.session.c1hits + '/' + state.session.c1shots + ' TREFFER · ' + state.session.c1dunks + ' DUNKS', 256, 282);
  });
  draw(jumbo.c2, g => {
    g.strokeStyle = '#5EE6B0'; g.lineWidth = 5; g.strokeRect(6, 6, 500, 300);
    g.fillStyle = '#8EF0C8'; g.font = '15px "Press Start 2P", monospace'; g.fillText(P.source === 'live' ? 'DEIN GELD · LIVE' : P.source === 'file' ? 'DEIN GELD · DATEI' : 'DEIN GELD · BEISPIEL', 256, 42);
    g.fillStyle = '#FFFFFF'; g.font = '44px "Press Start 2P", monospace'; g.fillText(fmtEUR(P.total, P.currency).replace(/\s/g, ''), 256, 112);
    const plus = P.holdings.filter(h => h.ret > 0).length, minus = P.holdings.filter(h => h.ret < 0).length;
    g.font = '18px "Press Start 2P", monospace'; g.fillStyle = P.today >= 0 ? '#5EE6B0' : '#FF8B7A'; g.fillText((P.today >= 0 ? '▲ +' : '▼ ') + Math.round(P.today) + '€ HEUTE', 256, 170);
    g.font = '13px "Press Start 2P", monospace'; g.fillStyle = '#C7CCF0'; g.fillText('TEAM ' + plus + ' : ' + minus + ' MARKT', 256, 222);
    g.font = '11px "Press Start 2P", monospace'; g.fillStyle = '#8C97C2'; g.fillText('WOCHE ' + (P.week >= 0 ? '+' : '') + Math.round(P.week) + '€ · XIRR ' + fmtPct(P.xirr).replace(/\s/g, ''), 256, 258);
    g.fillStyle = '#8EF0C8'; g.fillText('HEUTE ' + state.session.c2hits + '/' + state.session.c2shots + ' · FREIWÜRFE ' + state.session.c2ft + ' · MARKT ' + state.session.market, 256, 286);
  });
}
/* Bäume auf dem Platz */
[[-16.6, -7], [16.6, -7], [-16.6, 7], [16.6, 7]].forEach(([x, z]) => tree(x, z, 'tree', 0.7));

/* =====================================================================
   8. Figuren
   ===================================================================== */
const matCache = {};
function pmat(hex){ let m = matCache[hex]; if (!m){ m = new THREE.MeshStandardMaterial({ roughness: 0.82, flatShading: true }); m.color.copy(col(hex)); matCache[hex] = m; } return m; }
function pm(geo, hex, x, y, z, sx, sy, sz){ const m = new THREE.Mesh(geo, pmat(hex)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; return m; }
function atlasPlane(uv, w, h){
  const p = new THREE.PlaneGeometry(w, h); const u = p.attributes.uv; const map = [[uv.u0, uv.v1], [uv.u1, uv.v1], [uv.u0, uv.v0], [uv.u1, uv.v0]]; for (let i = 0; i < 4; i++) u.setXY(i, map[i][0], map[i][1]);
  ATLAS.tex.needsUpdate = true;
  return new THREE.Mesh(p, new THREE.MeshBasicMaterial({ map: ATLAS.tex, transparent: true, alphaTest: 0.1 }));
}
const FACE_UV = ATLAS.square('• •', { color: '#1A1208', font: '26px Manrope, sans-serif', dy: -6 });
function makePlayer(o){
  const g = new THREE.Group(); const skin = o.skin || pick(SKINS); const shorts = o.shorts || '#1B1F38';
  const legL = new THREE.Group(), legR = new THREE.Group();
  [legL, legR].forEach((leg, i) => { leg.position.set(i ? 0.16 : -0.16, 0.92, 0); leg.add(pm(BOX, skin, 0, -0.36, 0, 0.2, 0.7, 0.22)); leg.add(pm(BOX, '#F2F4FF', 0, -0.62, 0, 0.21, 0.18, 0.23)); leg.add(pm(BOX, o.shoe || '#F2F4FF', 0, -0.78, 0.07, 0.24, 0.14, 0.4)); leg.add(pm(BOX, o.jersey, 0, -0.78, 0.07, 0.25, 0.05, 0.41)); g.add(leg); });
  g.add(pm(BOX, shorts, 0, 1.02, 0, 0.6, 0.4, 0.36));
  g.add(pm(BOX, o.jersey, 0, 1.47, 0, 0.62, 0.66, 0.36)); g.add(pm(BOX, o.accent || shorts, 0.3, 1.47, 0, 0.04, 0.66, 0.37)); g.add(pm(BOX, o.accent || shorts, -0.3, 1.47, 0, 0.04, 0.66, 0.37));
  if (o.number != null){ const uv = ATLAS.square(String(o.number), { color: o.ink || '#11132A' }); const f = atlasPlane(uv, 0.34, 0.34); f.position.set(0, 1.47, 0.185); g.add(f); const b = atlasPlane(uv, 0.34, 0.34); b.position.set(0, 1.47, -0.185); b.rotation.y = Math.PI; g.add(b); }
  const armL = new THREE.Group(), armR = new THREE.Group();
  [armL, armR].forEach((arm, i) => { arm.position.set(i ? 0.4 : -0.4, 1.74, 0); arm.add(pm(BOX, skin, 0, -0.3, 0, 0.16, 0.62, 0.18)); arm.add(pm(BOX, o.accent || '#F2F4FF', 0, -0.5, 0, 0.18, 0.08, 0.2)); g.add(arm); });
  g.add(pm(ICO1, skin, 0, 2.05, 0, 0.46, 0.46, 0.46));
  const hair = pm(new THREE.SphereGeometry(0.24, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), o.hair || '#2A1B12', 0, 2.08, -0.02, 1, 0.85, 1); g.add(hair);
  if (o.band){ const band = pm(new THREE.TorusGeometry(0.235, 0.035, 6, 16), o.band, 0, 2.12, 0, 1, 1, 1); band.rotation.x = Math.PI / 2; g.add(band); }
  const face = atlasPlane(FACE_UV, 0.3, 0.3); face.position.set(0, 2.03, 0.225); g.add(face);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.68, 24), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, side: THREE.DoubleSide })); ring.material.color.copy(col(o.ringColor || '#FFFFFF')); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; ring.visible = false; g.add(ring);
  g.scale.setScalar(o.scale || 1);
  const p = { g, armL, armR, legL, legR, ring, ph: R(0, 6), scale: o.scale || 1, tilt: 0 };
  g.traverse(m => { if (m.isMesh) m.userData.player = p; });
  return p;
}
function face(p, x, z){ p.g.lookAt(x, p.g.position.y, z); }
function handPos(p, out){ return out.set(0.1, 1.9, 0.34).multiplyScalar(p.scale).applyQuaternion(p.g.quaternion).add(p.g.position); }
function sitPose(p){ p.legL.rotation.x = p.legR.rotation.x = -Math.PI / 2 + 0.1; p.armL.rotation.x = p.armR.rotation.x = -0.5; }
function ballMesh(){
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#E8742A'; x.fillRect(0, 0, 64, 64); x.strokeStyle = '#4A1E08'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 32); x.lineTo(64, 32); x.moveTo(32, 0); x.lineTo(32, 64); x.stroke();
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 })); b.castShadow = true; scene.add(b); return b;
}
/* Schwebende Texte */
const floaters = [];
function floatText(text, color, pos){
  const c = document.createElement('canvas'); c.width = 256; c.height = 80; const g = c.getContext('2d'); g.fillStyle = color; g.font = '28px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = color; g.shadowBlur = 12; g.fillText(text, 128, 40);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); s.position.copy(pos); s.scale.set(3.4, 1.06, 1); scene.add(s); floaters.push({ s, t: 0 });
}
/* Konfetti */
const CONF = 160; const confGeo = new THREE.BufferGeometry(); const confPos = new Float32Array(CONF * 3), confVel = new Float32Array(CONF * 3), confLife = new Float32Array(CONF);
confGeo.setAttribute('position', new THREE.BufferAttribute(confPos, 3));
const confCol = new Float32Array(CONF * 3); for (let i = 0; i < CONF; i++){ const c = col(pick(NEON)); confCol[i * 3] = c.r; confCol[i * 3 + 1] = c.g; confCol[i * 3 + 2] = c.b; } confGeo.setAttribute('color', new THREE.BufferAttribute(confCol, 3));
const confetti = new THREE.Points(confGeo, new THREE.PointsMaterial({ size: 3.5, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false })); confetti.frustumCulled = false; confetti.visible = false; scene.add(confetti);
function burst(x, y, z){ for (let i = 0; i < CONF; i++){ confPos[i * 3] = x; confPos[i * 3 + 1] = y; confPos[i * 3 + 2] = z; confVel[i * 3] = (mrand() - 0.5) * 7; confVel[i * 3 + 1] = mrand() * 7 + 2; confVel[i * 3 + 2] = (mrand() - 0.5) * 7; confLife[i] = 1.4 + mrand() * 0.8; } confetti.visible = true; }

/* ---- Court 1: du ---- */
const you = makePlayer({ jersey: '#FF8A3D', shorts: '#2A1A40', accent: '#FFE3CC', skin: '#E9B98F', hair: '#5A3A22', number: 7, ink: '#1C0D03', ringColor: '#FF8A3D', band: '#FFFFFF', scale: 1.05 });
you.g.position.set(COURT.c1, PY, -2); scene.add(you.g); you.g.traverse(m => { if (m.isMesh) m.userData.pick = { kind: 'court1' }; }); pickables.push(you.g);
const defenders = [[-9.5, -5.6], [-4.6, -6.0], [-7, -4.2], [-10.3, -2.6], [-3.8, -2.2]].map(([x, z], i) => {
  const p = makePlayer({ jersey: '#7E95C2', shorts: '#20263F', accent: '#C7D3F0', skin: SKINS[i % SKINS.length], hair: pick(['#1E1A16', '#3A2A1A', '#5A3A22']), number: i + 10, ink: '#0E1530' });
  p.g.position.set(x, PY, z); p.home = new THREE.Vector3(x, PY, z); p.fall = 0; scene.add(p.g); return p;
});
const referee = makePlayer({ jersey: '#DADCE8', shorts: '#1A1A28', accent: '#1A1A28', skin: '#D9A983', hair: '#3A2A1A', number: null });
referee.g.position.set(COURT.c1 - 5.6, PY, 1.5); referee.signal = 0; scene.add(referee.g);
const trainingGear = new THREE.Group(); scene.add(trainingGear);
(function gear(){ const cart = pm(BOX, '#3B4472', COURT.c1 + 3.6, PY + 0.45, -0.5, 1.3, 0.55, 0.9); trainingGear.add(cart); for (let i = 0; i < 6; i++) trainingGear.add(pm(SPH, '#E8742A', COURT.c1 + 3.2 + (i % 3) * 0.4, PY + 0.85 + Math.floor(i / 3) * 0.32, -0.65 + (i % 2) * 0.3, 0.38, 0.38, 0.38)); [[-10.5, -2.5], [-3.5, -2.5], [-7, -0.6], [-11, -5], [-3, -5]].forEach(([x, z]) => trainingGear.add(pm(CONE, '#FF8A3D', x, PY + 0.25, z, 0.4, 0.5, 0.4))); })();
const ball1 = ballMesh();
const SPOTS1 = [[-7, -2.2], [-4.2, -3.6], [-9.8, -3.8], [-5.2, -1.2], [-8.8, -1.0], [-7, -4.6]];
const s1 = { phase: 'walk', t: 0, spot: 0, from: new THREE.Vector3(COURT.c1, PY, -2), act: 'jumper', made: true, guard: 2, rebound: new THREE.Vector3(), bounces: 0 };
/* ---- Court 2: dein Geld ---- */
let team = [], bench = [], market = [];
const ZONES2 = [[7, 4.6], [10.4, 1.6], [3.6, 2.2], [9.6, -2.4], [4.6, -3.4]];
const nameSprites = [];
function buildTeam(){
  team.forEach(p => scene.remove(p.g)); bench.forEach(p => scene.remove(p.g)); market.forEach(p => scene.remove(p.g)); nameSprites.forEach(s => scene.remove(s)); team = []; bench = []; market = []; nameSprites.length = 0;
  const H = state.portfolio.holdings.filter(h => h.value > 0).slice(0, 10);
  const maxW = Math.max(1, ...H.map(h => h.weight));
  H.forEach((h, i) => {
    const color = TEAM_COLORS[i % TEAM_COLORS.length];
    const p = makePlayer({ jersey: color, shorts: '#13253A', accent: '#0B1220', skin: SKINS[(i + 2) % SKINS.length], hair: pick(['#2A1B12', '#1E1A16', '#5A3A22', '#6A4A2A']), number: i + 1, ink: '#0B1220', ringColor: color, scale: 0.78 + 0.5 * (h.weight / maxW) });
    p.h = h; p.idx = i; p.g.traverse(m => { if (m.isMesh) m.userData.pick = { kind: 'holding', idx: i }; }); pickables.push(p.g); scene.add(p.g);
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.fillStyle = 'rgba(8,8,24,.75)'; g.fillRect(0, 10, 256, 44); g.fillStyle = color; g.font = '800 26px Manrope, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(h.short, 128, 32);
    const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.set(2.6, 0.65, 1); s.userData.p = p; scene.add(s); nameSprites.push(s);
    if (i < 5){ p.g.position.set(ZONES2[i][0], PY, ZONES2[i][1]); p.home = p.g.position.clone(); p.zone = i; team.push(p); }
    else { p.g.position.set(COURT.c2 - 2 + (i - 5) * 1.0, PY + 0.52, 10.7); p.g.rotation.y = Math.PI; sitPose(p); p.g.scale.setScalar(0.8); p.scale = 0.8; bench.push(p); }
  });
  [[8, 2.6], [11.4, 5.4]].forEach(([x, z], i) => {
    const p = makePlayer({ jersey: '#FF6A5A', shorts: '#3A1A1A', accent: '#FFD1C8', skin: SKINS[(i + 1) % SKINS.length], number: null, scale: 1.02 });
    p.g.position.set(x, PY, z); p.home = p.g.position.clone(); p.g.traverse(m => { if (m.isMesh) m.userData.pick = { kind: 'tip', title: 'Der Markt', jp: '市場', sub: 'Verteidigt. Sein Korb ist ein Kursverlust.' }; }); pickables.push(p.g); scene.add(p.g); market.push(p);
  });
}
const ball2 = ballMesh();
const s2 = { phase: 'reset', t: 0, chain: [], step: 0, poss: 0, shooter: null, made: true, ftShot: 0, stealer: null };
