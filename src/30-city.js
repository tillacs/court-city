
/* =====================================================================
   5. Die Stadt
   ===================================================================== */
const IX = 40, IZ = 30;
const NEON = ['#FF5FA2', '#5FE3FF', '#FFD24A', '#A98BFF', '#7CFFB2', '#FF7A45', '#FF3B6B'];
const WARM = ['#FFD9A0', '#FFE7C2', '#FFC98A', '#FFF1D6'];
const COOL = ['#BFE8FF', '#E8F6FF', '#9FD8FF'];

/* lokales Koordinatensystem: front = +z, gedreht um ry */
function frame(x0, z0, ry){ const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x0 + lx * c + lz * s, z0 - lx * s + lz * c]; }

/* Dachgeometrien (manuell, flat shaded) */
function roofGeo(w, d, h, hip){
  const pts = [], tri = (a, b, c) => pts.push(...a, ...b, ...c);
  const x = w / 2, z = d / 2;
  const r = hip ? Math.max(0, (w - d) / 2) : x;
  const A = [-x, 0, z], Bp = [x, 0, z], Cc = [x, 0, -z], D = [-x, 0, -z], E = [-r, h, 0], F = [r, h, 0];
  tri(A, Bp, F); tri(A, F, E);           // vorne
  tri(Cc, D, E); tri(Cc, E, F);          // hinten
  if (hip){ tri(Bp, Cc, F); tri(D, A, E); } else { tri(Bp, Cc, F); tri(D, A, E); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.computeVertexNormals(); return g;
}
const ROOF_COLS = ['#2C3A66', '#3A3358', '#2A4A5A', '#4A3A44', '#2E3F55'];
/* Strebe von A nach B (Box entlang einer beliebigen Richtung) */
const _up = new THREE.Vector3(0, 1, 0), _dir = new THREE.Vector3();
function strut(color, ax, ay, az, bx, by, bz, thick){
  _dir.set(bx - ax, by - ay, bz - az); const len = _dir.length(); _dir.normalize();
  let g = BOX.toNonIndexed(); g.deleteAttribute('uv');
  _q.setFromUnitVectors(_up, _dir); _p.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); _s.set(thick, len, thick); _m4.compose(_p, _q, _s); g.applyMatrix4(_m4);
  const n = g.attributes.position.count, arr = new Float32Array(n * 3), c = col(color);
  for (let i = 0; i < n; i++){ arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3)); litList.push(g);
}

/* ---- Insel ---- */
(function island(){
  const s = new THREE.Shape(); const r = 10;
  s.moveTo(-IX + r, -IZ); s.lineTo(IX - r, -IZ); s.quadraticCurveTo(IX, -IZ, IX, -IZ + r); s.lineTo(IX, IZ - r); s.quadraticCurveTo(IX, IZ, IX - r, IZ); s.lineTo(-IX + r, IZ); s.quadraticCurveTo(-IX, IZ, -IX, IZ - r); s.lineTo(-IX, -IZ + r); s.quadraticCurveTo(-IX, -IZ, -IX + r, -IZ);
  const g = new THREE.ExtrudeGeometry(s, { depth: 5, bevelEnabled: false, curveSegments: 8 }); g.rotateX(-Math.PI / 2); g.translate(0, -5, 0);
  B.geo(g, '#2A2850', 0, 0, 0, 1, 1, 1);
  B.geo(g, '#1E1C3E', 0, -0.01, 0, 0.985, 0.6, 0.985);
  for (let i = 0; i < 22; i++){ const a = (i / 22) * Math.PI * 2; const rr = R(0.8, 1.0); B.geo(DODE, pick(['#2B2252', '#241D48', '#352A60']), Math.cos(a) * IX * rr * 0.92, R(-10, -5), Math.sin(a) * IZ * rr * 0.92, R(9, 15), R(7, 12), R(9, 15), R(0, 3)); }
  for (let i = 0; i < 9; i++) B.geo(DODE, pick(['#241D48', '#2B2252']), R(-28, 28), R(-24, -17), R(-20, 20), R(10, 16), R(8, 12), R(10, 16), R(0, 3));
  B.geo(new THREE.ConeGeometry(1, 1, 8), '#1A1538', 0, -24, 0, 34, 18, 26, 0, Math.PI, 0);
  for (let i = 0; i < 24; i++){ const a = (i / 24) * Math.PI * 2; const px = Math.cos(a) * IX * 0.97, pz = Math.sin(a) * IZ * 0.97; glow('#5A3C9A', px, -7, pz, 10, 0.25); }
})();

/* ---- Straßen, Gehwege, Markierungen ---- */
const ROAD_X = [-21, 21], ROAD_Z = [-16, 16];
const asphalt = '#15142C', curb = '#2C2A4C', paint = '#D9DCF2', paintY = '#F0C85A';
ROAD_X.forEach(x => B.box(asphalt, x, 0.02, 0, 4.2, 0.05, IZ * 2 - 2));
ROAD_Z.forEach(z => B.box(asphalt, 0, 0.02, z, IX * 2 - 2, 0.05, 4.2));
function nearRoad(v, list){ return list.some(r => Math.abs(v - r) < 3.4); }
ROAD_X.forEach(x => { for (let z = -27; z <= 27; z += 2.4) if (!nearRoad(z, ROAD_Z)) B.box(paint, x, 0.06, z, 0.12, 0.02, 1.2); });
ROAD_Z.forEach(z => { for (let x = -37; x <= 37; x += 2.4) if (!nearRoad(x, ROAD_X)) B.box(paint, x, 0.06, z, 1.2, 0.02, 0.12); });
ROAD_X.forEach(rx => ROAD_Z.forEach(rz => {
  const scramble = rx === 21 && rz === 16;
  [-1, 1].forEach(s => { for (let k = -3; k <= 3; k++){ B.box(paint, rx + k * 0.5, 0.062, rz + s * 2.75, 0.28, 0.02, 1.1); B.box(paint, rx + s * 2.75, 0.062, rz + k * 0.5, 1.1, 0.02, 0.28); } });
  if (scramble){ [Math.PI / 4, -Math.PI / 4].forEach(rot => { for (let k = -4; k <= 4; k++){ const dd = k * 0.5; B.box(paint, rx + Math.cos(rot) * dd, 0.064, rz - Math.sin(rot) * dd, 0.26, 0.02, 1.3, rot); } }); }
  // Ampeln
  [[-1, -1], [1, 1]].forEach(([sx, sz]) => {
    const px = rx + sx * 3.2, pz = rz + sz * 3.2;
    B.box('#3A3E5E', px, 2.4, pz, 0.14, 4.8, 0.14); B.box('#3A3E5E', px - sx * 1.2, 4.6, pz, 2.4, 0.12, 0.12);
    B.box('#1A1A28', px - sx * 2.2, 4.3, pz, 0.9, 0.36, 0.3);
    B.glow('#38F07A', px - sx * 2.5, 4.3, pz + 0.17, 0.22, 0.22, 0.02); B.glow('#5A2A1A', px - sx * 1.9, 4.3, pz + 0.17, 0.22, 0.22, 0.02);
    glow('#38F07A', px - sx * 2.5, 4.3, pz + 0.3, 1.4, 0.5);
  });
}));
/* Gehweg-Platten */
const BLOCKS = [[-39, -23.3, -29, -18.4], [-18.6, 18.6, -29, -18.4], [23.3, 39, -29, -18.4], [-39, -23.3, -13.6, 13.6], [23.3, 39, -13.6, 13.6], [-39, -23.3, 18.4, 29], [-18.6, 18.6, 18.4, 29], [23.3, 39, 18.4, 29], [-18.6, 18.6, -13.6, 13.6]];
BLOCKS.forEach(([x0, x1, z0, z1]) => { B.box(curb, (x0 + x1) / 2, 0.11, (z0 + z1) / 2, x1 - x0, 0.22, z1 - z0); B.box('#34325A', (x0 + x1) / 2, 0.225, (z0 + z1) / 2, x1 - x0 - 0.5, 0.01, z1 - z0 - 0.5); });
const SLAB = 0.22;

/* ---- Platz: Podium mit Treppen und Lichtkante ---- */
const PLZ = 1.0;
B.box('#2E2C56', 0, SLAB + PLZ / 2, 0, 35, PLZ, 25);
B.box('#3B3966', 0, SLAB + PLZ + 0.02, 0, 34.4, 0.04, 24.4);
for (let x = -16; x <= 16; x += 2) B.box('#33315C', x, SLAB + PLZ + 0.05, 0, 0.06, 0.01, 24);
for (let z = -11; z <= 11; z += 2) B.box('#33315C', 0, SLAB + PLZ + 0.05, z, 34, 0.01, 0.06);
B.glow('#FFB070', 0, SLAB + PLZ - 0.12, 12.52, 34.8, 0.08, 0.04); B.glow('#FFB070', 0, SLAB + PLZ - 0.12, -12.52, 34.8, 0.08, 0.04);
B.glow('#FFB070', 17.52, SLAB + PLZ - 0.12, 0, 0.04, 0.08, 24.8); B.glow('#FFB070', -17.52, SLAB + PLZ - 0.12, 0, 0.04, 0.08, 24.8);
[[0, 13.3, 8, 0], [18.3, 0, 6, Math.PI / 2], [0, -13.3, 6, Math.PI], [-18.3, 0, 6, -Math.PI / 2]].forEach(([x, z, w, ry]) => { const f = frame(x, z, ry); for (let i = 0; i < 3; i++){ const p = f(0, i * 0.33 - 0.33); B.box('#3A3866', p[0], SLAB + PLZ - 0.17 - i * 0.33, p[1], w, 0.33, 0.33, ry); } });

/* ---- Bausteine ---- */
let signCounter = 0;
const SIGN_WORDS = ['夜市', 'カラオケ', 'ゲーム', 'ラーメン', '未来', '映画', 'ホテル', '電気', '本屋', '音楽', 'バスケ', '寿司', '薬局', '質屋', '喫茶', '眼鏡', '時計', '写真', '銀行', '麻雀'];

function windowsOn(x0, y0, z0, w, h, d, ry, floors, cols, lit, pal){
  // Fenster auf allen vier Seiten, lokale Frame-Berechnung
  const f = frame(x0, z0, ry); const fh = h / floors;
  for (let fl = 0; fl < floors; fl++){
    const y = y0 + fh * (fl + 0.55);
    [[w, d / 2 + 0.03, 0], [w, -d / 2 - 0.03, Math.PI], [d, w / 2 + 0.03, Math.PI / 2], [d, -w / 2 - 0.03, -Math.PI / 2]].forEach(([len, off, rot], side) => {
      const n = Math.max(1, Math.round(len / 2.2)); const ww = Math.min(1.1, len / n * 0.55);
      for (let i = 0; i < n; i++){
        if (rand() > lit) continue;
        const u = (i + 0.5) / n * len - len / 2;
        const lx = side < 2 ? u : (side === 2 ? off : off), lz = side < 2 ? off : u;
        const p = side < 2 ? f(u, off) : f(off, u);
        win(pick(pal || WARM), p[0], y, p[1], ww, fh * 0.42, ry + rot);
      }
    });
  }
}

function tower(x, z, w, d, h, ry, o){
  o = o || {};
  const wall = o.wall || pick(['#3A3F6A', '#434463', '#2F3A5A', '#4A4068', '#3B4A6B']);
  const floors = Math.max(3, Math.round(h / 2.6));
  B.box(wall, x, SLAB + h / 2, z, w, h, d, ry);
  windowsOn(x, SLAB, z, w, h, d, ry, floors, 3, o.lit == null ? 0.62 : o.lit, rand() < 0.5 ? WARM : COOL);
  const f = frame(x, z, ry); const top = SLAB + h;
  B.box('#2A2E4F', x, top + 0.25, z, w + 0.3, 0.5, d + 0.3, ry);
  const r = rand();
  if (r < 0.4){ // Warnlicht
    const p = f(w * 0.25, -d * 0.25); B.box('#8A90B0', p[0], top + 2.2, p[1], 0.18, 4, 0.18);
    B.glow('#FF3B3B', p[0], top + 4.3, p[1], 0.4, 0.4, 0.4); blinkers.push({ x: p[0], y: top + 4.3, z: p[1], ph: R(0, 6) });
  } else if (r < 0.75){ // Neonschild auf dem Dach
    const word = o.word || pick(SIGN_WORDS), c = pick(NEON);
    const uv = ATLAS.signH(word, { color: c, bg: '#0B0D22', border: c, bw: 5, glow: 16 });
    const sw = Math.min(w * 0.9, 7.5); const p = f(0, -d * 0.1);
    ATLAS.plane(uv, sw, sw * 0.25, p[0], top + 1.6 + sw * 0.125, p[1], ry, true);
    B.box('#5A5F80', p[0], top + 0.9, p[1], 0.14, 1.6, 0.14); glow(c, p[0], top + 1.6 + sw * 0.125, p[1], sw * 1.4, 0.35);
  } else { // Wassertank & Technik
    const p = f(w * 0.2, d * 0.2); B.geo(CYL, '#6E7396', p[0], top + 1.1, p[1], 1.6, 1.6, 1.6); B.box('#7A80A0', f(-w * 0.25, -d * 0.2)[0], top + 0.8, f(-w * 0.25, -d * 0.2)[1], 1.4, 0.8, 1);
  }
  if (rand() < 0.5){ const c = pick(NEON); const p = f(w / 2 + 0.06, d / 2 + 0.06); B.glow(c, p[0], SLAB + h * 0.5, p[1], 0.16, h * 0.78, 0.16); }
  pickBox({ kind: 'tip', title: o.name || 'Bürohaus', jp: o.jp || 'ビル', sub: floors + ' Stockwerke · Kulisse' }, x, SLAB + h / 2, z, w, h, d, ry);
}

function midrise(x, z, w, d, floors, ry, o){
  o = o || {}; const fh = 2.7, h = floors * fh;
  const wall = o.wall || pick(['#4C4A72', '#5A5278', '#46587A', '#5C4A5E', '#4A5A6C']);
  B.box(wall, x, SLAB + h / 2, z, w, h, d, ry);
  const f = frame(x, z, ry);
  // Erdgeschoss: Laden mit warmem Licht + Markise
  const front = d / 2;
  const sp = f(0, front + 0.03); win(pick(['#FFC37A', '#FFE7B0', '#BFEFFF', '#FFD9F2']), sp[0], SLAB + 1.2, sp[1], w * 0.8, 1.9, ry);
  const ap = f(0, front + 0.5); B.box(o.awn || pick(['#C2402F', '#2D5C8A', '#3A6A4A', '#8A4A8A', '#C98A2A']), ap[0], SLAB + 2.45, ap[1], w * 0.92, 0.1, 1.0, ry, 0.3);
  // Obergeschosse: Fenster vorn + Balkone
  for (let fl = 1; fl < floors; fl++){
    const y = SLAB + fh * (fl + 0.55);
    const n = Math.max(1, Math.round(w / 2.4));
    for (let i = 0; i < n; i++){ const u = (i + 0.5) / n * w - w / 2; const p = f(u, front + 0.03); win(rand() < 0.65 ? pick(WARM) : '#2A2E50', p[0], y, p[1], 1.0, 1.0, ry); }
    if (rand() < 0.7){ const bp = f(0, front + 0.3); B.box('#8A8FA8', bp[0], SLAB + fh * fl + 0.04, bp[1], w * 0.9, 0.08, 0.6, ry); for (let i = -2; i <= 2; i++){ const rp = f(i * w * 0.2, front + 0.58); B.box('#8A8FA8', rp[0], SLAB + fh * fl + 0.5, rp[1], 0.05, 0.9, 0.05); } const hp = f(0, front + 0.58); B.box('#9AA0B8', hp[0], SLAB + fh * fl + 0.95, hp[1], w * 0.9, 0.05, 0.05, ry);
      if (rand() < 0.5){ const lp = f(R(-w * 0.3, w * 0.3), front + 0.45); B.box(pick(['#F2F4FF', '#9FD8FF', '#FFC0D8']), lp[0], SLAB + fh * fl + 0.6, lp[1], 0.4, 0.5, 0.04, ry); } }
    // Seitenfenster
    [[1, Math.PI / 2], [-1, -Math.PI / 2]].forEach(([s, rot]) => { for (let i = 0; i < Math.max(1, Math.round(d / 2.4)); i++){ const u = (i + 0.5) / Math.max(1, Math.round(d / 2.4)) * d - d / 2; const p = f(s * (w / 2 + 0.03), u); if (rand() < 0.5) win(pick(WARM), p[0], y, p[1], 0.9, 0.9, ry + rot); } });
  }
  // Senkrechtes Neonschild an der Kante
  const word = o.word || pick(SIGN_WORDS), c = pick(NEON);
  const uv = ATLAS.signV(word, { color: '#FFFFFF', bg: c });
  const sgn = f(w / 2 + 0.6, front - 0.4); const sh = Math.min(h * 0.6, 4.4);
  ATLAS.plane(uv, 1.0, sh, sgn[0], SLAB + h * 0.55, sgn[1], ry + Math.PI / 2, true); glow(c, sgn[0], SLAB + h * 0.55, sgn[1], 4.2, 0.4);
  B.box('#5A5F80', f(w / 2 + 0.3, front - 0.4)[0], SLAB + h * 0.55 + sh / 2 - 0.1, f(w / 2 + 0.3, front - 0.4)[1], 0.6, 0.06, 0.06, ry);
  // Dach: AC, Antenne, Wasserbehälter
  const top = SLAB + h; B.box('#2A2E4F', x, top + 0.2, z, w + 0.2, 0.4, d + 0.2, ry);
  const acp = f(-w * 0.3, -d * 0.2); B.box('#C9CCD8', acp[0], top + 0.7, acp[1], 0.9, 0.6, 0.6, ry);
  if (rand() < 0.6){ const tp = f(w * 0.3, d * 0.1); B.geo(CYL, '#8A90B0', tp[0], top + 1.1, tp[1], 1.2, 1.4, 1.2); B.box('#8A90B0', tp[0], top + 0.3, tp[1], 0.1, 0.6, 0.1); }
  if (rand() < 0.5){ const an = f(w * 0.1, -d * 0.35); B.box('#8A90B0', an[0], top + 1.4, an[1], 0.06, 2.4, 0.06); B.box('#8A90B0', an[0], top + 2.4, an[1], 0.8, 0.04, 0.04, ry); }
  pickBox({ kind: 'tip', title: o.name || 'Geschäftshaus', jp: word, sub: floors + ' Etagen · Laden unten · Kulisse' }, x, SLAB + h / 2, z, w + 1, h, d + 1, ry);
}

const SHOPS = [
  { key: 'ramen', jp: 'ラーメン', de: 'Ramen-Bar', wall: '#EDE0C4', awn: '#C2402F', noren: '#B23A2A', lantern: '#FF5A3A', steam: true, roof: 'tile' },
  { key: 'sushi', jp: '寿司', de: 'Sushi-Theke', wall: '#F4EEE0', awn: '#2D5C8A', noren: '#2D5C8A', lantern: null, roof: 'tile' },
  { key: 'izakaya', jp: '居酒屋', de: 'Izakaya', wall: '#6E4A33', awn: '#3A2A20', noren: '#C2402F', lantern: '#FF5A3A', crates: true, roof: 'flat' },
  { key: 'yakitori', jp: '焼鳥', de: 'Yakitori-Grill', wall: '#7A5236', awn: '#2B2B2B', noren: '#E8E0CF', lantern: '#FF7A3A', steam: true, roof: 'tile' },
  { key: 'kissa', jp: '喫茶', de: 'Kissaten-Café', wall: '#C9B08A', awn: '#4E7A5A', noren: '#4E7A5A', lantern: null, plant: true, roof: 'flat' },
  { key: 'takoyaki', jp: 'たこ焼', de: 'Takoyaki-Stand', wall: '#F6D36B', awn: '#D9502A', noren: '#D9502A', lantern: '#FFB347', steam: true, small: true, roof: 'flat' },
  { key: 'udon', jp: 'うどん', de: 'Udon-Laden', wall: '#EFE3C8', awn: '#5B3F8A', noren: '#5B3F8A', lantern: null, roof: 'tile' },
  { key: 'dango', jp: '団子', de: 'Dango-Laden', wall: '#F4C9D6', awn: '#7A9A4A', noren: '#7A9A4A', lantern: null, small: true, roof: 'tile' },
  { key: 'curry', jp: 'カレー', de: 'Curry-Haus', wall: '#E8B54A', awn: '#7A3B1E', noren: '#7A3B1E', lantern: null, roof: 'flat' },
  { key: 'hana', jp: '花屋', de: 'Blumenladen', wall: '#DDEFE0', awn: '#E26D8E', noren: '#E26D8E', lantern: null, plant: true, roof: 'flat' },
  { key: 'sento', jp: '銭湯', de: 'Badehaus', wall: '#CFE2EE', awn: '#2D5C8A', noren: '#2D5C8A', lantern: '#FFC37A', chimney: true, roof: 'tile' },
  { key: 'hon', jp: '本屋', de: 'Buchladen', wall: '#D9CBB2', awn: '#3D4A2A', noren: '#3D4A2A', lantern: null, roof: 'flat' },
  { key: 'gyoza', jp: '餃子', de: 'Gyoza-Küche', wall: '#F1DCC2', awn: '#B8352A', noren: '#B8352A', lantern: '#FF5A3A', steam: true, roof: 'tile' },
  { key: 'taiyaki', jp: 'たい焼', de: 'Taiyaki-Stand', wall: '#F7E1B5', awn: '#D47A2A', noren: '#D47A2A', lantern: '#FFB347', small: true, steam: true, roof: 'flat' },
  { key: 'matcha', jp: '抹茶', de: 'Matcha-Teehaus', wall: '#E3EBD2', awn: '#3F7A4A', noren: '#3F7A4A', lantern: null, plant: true, roof: 'tile' },
  { key: 'onigiri', jp: 'おにぎり', de: 'Onigiri-Laden', wall: '#F6F2E8', awn: '#2E4A7A', noren: '#2E4A7A', lantern: null, small: true, roof: 'flat' },
  { key: 'tonkatsu', jp: 'とんかつ', de: 'Tonkatsu-Stube', wall: '#E4D3B0', awn: '#5A3A22', noren: '#5A3A22', lantern: '#FFC37A', roof: 'tile' },
  { key: 'tempura', jp: '天ぷら', de: 'Tempura-Bar', wall: '#F2E6D0', awn: '#8A2A2A', noren: '#8A2A2A', lantern: '#FF5A3A', steam: true, roof: 'tile' }
];
let shopIdx = 0;
const steamSpots = [];
function shop(x, z, ry, o){
  o = o || {}; const s = o.spec || SHOPS[shopIdx++ % SHOPS.length];
  const w = o.w || (s.small ? R(3.6, 4.4) : R(4.8, 5.8)), d = o.d || (s.small ? 3.6 : 4.6), h = o.h || (s.small ? R(2.8, 3.3) : R(3.4, 4.6));
  const f = frame(x, z, ry); const F = d / 2;
  B.box(s.wall, x, SLAB + h / 2, z, w, h, d, ry);
  B.box('#2A2A44', x, SLAB + 0.08, z, w + 0.6, 0.16, d + 0.8, ry);             // Schwelle
  // Dach
  if (s.roof === 'tile'){ B.geo(roofGeo(w + 0.9, d + 0.9, 1.1 + w * 0.12, rand() < 0.5), pick(ROOF_COLS), x, SLAB + h, z, 1, 1, 1, ry); }
  else { B.box('#3A3350', x, SLAB + h + 0.12, z, w + 0.5, 0.24, d + 0.5, ry); const ap = f(-w * 0.3, -d * 0.2); B.box('#C9CCD8', ap[0], SLAB + h + 0.55, ap[1], 0.9, 0.6, 0.6, ry); }
  // Front: Fenster/Tür warm, Holzlatten (koshi), Noren, Markise
  const wp = f(0, F + 0.02); win('#FFCF8A', wp[0], SLAB + 1.05, wp[1], w * 0.66, 1.9, ry);
  for (let i = -3; i <= 3; i++){ if (i === 0) continue; const lp = f(i * w * 0.09, F + 0.06); B.box('#3A2A1E', lp[0], SLAB + 1.0, lp[1], 0.07, 1.8, 0.05, ry); }
  const np = f(0, F + 0.1); const nuv = ATLAS.signH(s.jp, { color: '#FFFFFF', bg: s.noren, dy: 2 });
  ATLAS.plane(nuv, w * 0.6, w * 0.15, np[0], SLAB + 1.78, np[1], ry);
  const ap = f(0, F + 0.5); B.box(s.awn, ap[0], SLAB + 2.3, ap[1], w * 0.95, 0.1, 1.05, ry, 0.33);
  // Dachschild
  const suv = ATLAS.signH(s.jp, { color: '#2A1A10', bg: '#FFF1D6', border: s.awn, bw: 7 });
  const sp = f(0, F - 0.25); ATLAS.plane(suv, w * 0.78, w * 0.2, sp[0], SLAB + h + (s.roof === 'tile' ? 0.75 : 0.65), sp[1], ry);
  glow('#FFCF8A', sp[0], SLAB + h + 0.7, sp[1], w * 1.2, 0.28);
  // Laternen
  if (s.lantern){ [-1, 1].forEach(k => { const lp = f(k * w * 0.4, F + 0.85); B.box('#2A2A2A', lp[0], SLAB + 2.52, lp[1], 0.05, 0.3, 0.05); lantern(s.lantern, lp[0], SLAB + 2.05, lp[1], 0.55); }); }
  else { const lp = f(0, F + 1.1); glow('#FFC37A', lp[0], SLAB + 1.2, lp[1], 3.6, 0.3); }
  // Automat, Kisten, Pflanzen, Fahrrad
  if (rand() < 0.5){ const vp = f(w / 2 + 0.55, F - 0.35); B.box('#E9EEF8', vp[0], SLAB + 0.85, vp[1], 0.7, 1.7, 0.6, ry); const vl = f(w / 2 + 0.55, F - 0.03); win(pick(['#9FD8FF', '#FFFFFF', '#FFD1DC']), vl[0], SLAB + 1.05, vl[1], 0.55, 0.95, ry); glow('#BFE8FF', vl[0], SLAB + 1.0, vl[1] , 2.2, 0.35); }
  if (s.crates){ for (let i = 0; i < 3; i++){ const cp = f(-w / 2 - 0.45, F - 0.6 - i * 0.05); B.box(pick(['#2A5CA8', '#D9A52A', '#2A2A2A']), cp[0], SLAB + 0.2 + i * 0.36, cp[1], 0.6, 0.34, 0.5, ry); } }
  if (s.plant || rand() < 0.4){ const pp = f(-w / 2 + 0.3, F + 0.5); B.box('#5A3A2A', pp[0], SLAB + 0.22, pp[1], 0.45, 0.4, 0.45, ry); B.geo(ICO, pick(['#3E8A5A', '#2E7A55', '#E26D8E']), pp[0], SLAB + 0.75, pp[1], 0.75, 0.9, 0.75, R(0, 3)); }
  if (rand() < 0.35){ const bp = f(w * 0.35, F + 1.3); B.box('#2A2A2A', bp[0], SLAB + 0.3, bp[1], 0.08, 0.5, 1.5, ry); B.geo(new THREE.TorusGeometry(0.28, 0.04, 6, 12), '#1A1A1A', f(w * 0.35, F + 1.9)[0], SLAB + 0.3, f(w * 0.35, F + 1.9)[1], 1, 1, 1, ry); B.geo(new THREE.TorusGeometry(0.28, 0.04, 6, 12), '#1A1A1A', f(w * 0.35, F + 0.7)[0], SLAB + 0.3, f(w * 0.35, F + 0.7)[1], 1, 1, 1, ry); }
  if (s.chimney){ const cp = f(w * 0.25, -d * 0.2); B.box('#4A3A3A', cp[0], SLAB + h + 2.2, cp[1], 0.7, 4.4, 0.7); steamSpots.push({ x: cp[0], y: SLAB + h + 4.4, z: cp[1], rate: 1.2, size: 1.4, c: '#CFCFE0' }); }
  if (s.steam){ const vp = f(w * 0.25, -d * 0.1); B.box('#8A90B0', vp[0], SLAB + h + 0.4, vp[1], 0.4, 0.8, 0.4); steamSpots.push({ x: vp[0], y: SLAB + h + 0.8, z: vp[1], rate: 2.2, size: 0.9, c: '#E8E8F4' }); }
  // Rückseite: Rohre, Hinterausgang, AC
  const bp = f(w * 0.3, -F - 0.08); win('#FFB070', bp[0], SLAB + 1.0, bp[1], 0.6, 1.6, ry + Math.PI); B.box('#7A80A0', f(-w * 0.3, -F - 0.12)[0], SLAB + h * 0.5, f(-w * 0.3, -F - 0.12)[1], 0.12, h * 0.95, 0.12); B.box('#C9CCD8', f(-w * 0.1, -F - 0.4)[0], SLAB + 1.6, f(-w * 0.1, -F - 0.4)[1], 0.8, 0.55, 0.5, ry);
  pickBox({ kind: 'shop', title: s.de, jp: s.jp, sub: 'Antippen: Dampf & Glocke', x: f(0, F + 0.6)[0], z: f(0, F + 0.6)[1], y: SLAB + h + 0.6, key: s.key }, x, SLAB + h / 2, z, w + 1.2, h + 1, d + 1.2, ry);
  return { w, d, h };
}

function house(x, z, ry, o){
  o = o || {}; const w = o.w || R(4.4, 5.4), d = o.d || R(4, 4.8), h = o.h || R(4.8, 5.8);
  const f = frame(x, z, ry); const F = d / 2;
  const wall = pick(['#E7E2D6', '#D9D2C4', '#C9D4DF', '#EAD9C8', '#D7E3D2', '#CFC2B8']);
  B.box(wall, x, SLAB + h / 2, z, w, h, d, ry);
  B.geo(roofGeo(w + 1.0, d + 1.0, 1.4, true), pick(ROOF_COLS), x, SLAB + h, z, 1, 1, 1, ry);
  for (let fl = 0; fl < 2; fl++){ const y = SLAB + 1.3 + fl * 2.6; [-0.25, 0.25].forEach(u => { const p = f(u * w, F + 0.03); win(rand() < 0.6 ? pick(WARM) : '#2A2E50', p[0], y, p[1], w * 0.24, 0.95, ry); }); }
  const bp = f(0, F + 0.35); B.box('#8A8FA8', bp[0], SLAB + 2.7, bp[1], w * 0.85, 0.08, 0.7, ry); const hp = f(0, F + 0.68); B.box('#9AA0B8', hp[0], SLAB + 3.2, hp[1], w * 0.85, 0.05, 0.05, ry);
  for (let i = 0; i < 3; i++){ const lp = f((i - 1) * w * 0.25, F + 0.55); B.box(pick(['#F2F4FF', '#9FD8FF', '#FFC0D8', '#FFE68A']), lp[0], SLAB + 2.95, lp[1], 0.42, 0.5, 0.04, ry); }
  const ac = f(w / 2 + 0.3, -d * 0.2); B.box('#C9CCD8', ac[0], SLAB + 1.0, ac[1], 0.5, 0.7, 0.9, ry);
  const dp = f(-w * 0.3, F + 0.03); B.box('#4A3A2E', dp[0], SLAB + 1.0, dp[1], 0.8, 2.0, 0.06, ry); glow('#FFD9A0', dp[0], SLAB + 2.1, dp[1] + 0.3, 1.6, 0.3);
  pickBox({ kind: 'tip', title: 'Wohnhaus', jp: '家', sub: 'Wäsche auf dem Balkon · Kulisse' }, x, SLAB + h / 2, z, w + 1, h + 1, d + 1, ry);
}

function konbini(x, z, ry){
  const w = 8, d = 5.5, h = 3.6; const f = frame(x, z, ry); const F = d / 2;
  B.box('#F4F6FA', x, SLAB + h / 2, z, w, h, d, ry);
  B.box('#2A2E4F', x, SLAB + h + 0.15, z, w + 0.3, 0.3, d + 0.3, ry);
  const wp = f(0, F + 0.02); win('#FFFFFF', wp[0], SLAB + 1.4, wp[1], w * 0.9, 2.5, ry);
  const band = f(0, F + 0.08); B.glow('#2DBF8A', band[0], SLAB + 3.0, band[1], w, 0.3, 0.05, ry); B.glow('#2E6BD6', band[0], SLAB + 3.3, band[1], w, 0.2, 0.05, ry);
  const uv = ATLAS.signH('コンビニ', { color: '#FFFFFF', bg: '#1E4FB8', dy: 2 }); ATLAS.plane(uv, 3.2, 0.8, band[0], SLAB + 2.1 + 1.3, f(0, F + 0.12)[1], ry);
  glow('#DFF3FF', f(0, F + 1.5)[0], SLAB + 1.4, f(0, F + 1.5)[1], 9, 0.5);
  for (let i = -1; i <= 1; i++){ const vp = f(w / 2 + 0.6, i * 1.0); B.box('#E9EEF8', vp[0], SLAB + 0.85, vp[1], 0.7, 1.7, 0.75, ry); win(pick(['#9FD8FF', '#FFD1DC', '#FFFFFF']), f(w / 2 + 0.96, i * 1.0)[0], SLAB + 1.05, f(w / 2 + 0.96, i * 1.0)[1], 0.6, 0.95, ry + Math.PI / 2); }
  for (let i = 0; i < 4; i++){ const bp = f(-w / 2 + 0.5 + i * 0.6, F + 1.2); B.box('#2A2A2A', bp[0], SLAB + 0.3, bp[1], 0.08, 0.5, 1.4, ry); }
  pickBox({ kind: 'tip', title: 'Konbini', jp: 'コンビニ', sub: '24 Stunden hell · Kulisse' }, x, SLAB + h / 2, z, w + 1, h, d + 1, ry);
}

function tree(x, z, kind, size){
  size = size || 1;
  if (kind === 'sakura'){ B.geo(CYL, '#4A3426', x, SLAB + 0.9 * size, z, 0.3, 1.8 * size, 0.3); const c = pick(['#F6B5CC', '#F29BBA', '#FAD0DE']); B.geo(ICO1, c, x, SLAB + 2.6 * size, z, 2.8 * size, 2.2 * size, 2.8 * size, R(0, 3)); B.geo(ICO, c, x + R(-0.7, 0.7), SLAB + 3.5 * size, z + R(-0.7, 0.7), 1.8 * size, 1.5 * size, 1.8 * size, R(0, 3)); glow('#FFB6D0', x, SLAB + 2.6 * size, z, 5 * size, 0.18); }
  else if (kind === 'pine'){ B.geo(CYL, '#4A3426', x, SLAB + 1.0 * size, z, 0.28, 2 * size, 0.28); for (let i = 0; i < 3; i++) B.geo(CONE, pick(['#2E6B4C', '#245A40']), x, SLAB + (1.8 + i * 1.0) * size, z, (2.6 - i * 0.6) * size, 1.4 * size, (2.6 - i * 0.6) * size); }
  else { B.geo(CYL, '#4A3426', x, SLAB + 0.8 * size, z, 0.3, 1.6 * size, 0.3); const c = pick(['#2E7A55', '#3A8A5E', '#256B4A']); B.geo(ICO1, c, x, SLAB + 2.3 * size, z, 2.4 * size, 2.0 * size, 2.4 * size, R(0, 3)); B.geo(ICO, c, x + R(-0.5, 0.5), SLAB + 3.1 * size, z + R(-0.5, 0.5), 1.5 * size, 1.3 * size, 1.5 * size, R(0, 3)); }
}
function lamp(x, z, ry){
  const f = frame(x, z, ry); const p = f(0, 0.5);
  B.geo(CYL, '#5A5F80', x, SLAB + 2.1, z, 0.14, 4.2, 0.14); B.box('#5A5F80', f(0, 0.3)[0], SLAB + 4.2, f(0, 0.3)[1], 0.12, 0.12, 0.7, ry);
  B.glow('#FFE2A8', p[0], SLAB + 4.15, p[1], 0.3, 0.14, 0.6, ry); glow('#FFD08A', p[0], SLAB + 4.0, p[1], 3.6, 0.55);
}
const blinkers = [];
const crows = [];
function pole(x, z){
  B.geo(CYL6, '#4A4A66', x, SLAB + 3.2, z, 0.22, 6.4, 0.22); B.box('#4A4A66', x, SLAB + 6.0, z, 1.6, 0.1, 0.1); B.box('#4A4A66', x, SLAB + 5.5, z, 1.2, 0.1, 0.1);
  B.box('#8A90B0', x + 0.55, SLAB + 6.05, z, 0.12, 0.25, 0.12); B.box('#8A90B0', x - 0.55, SLAB + 6.05, z, 0.12, 0.25, 0.12);
  B.box('#7A7A96', x, SLAB + 5.0, z + 0.25, 0.4, 0.6, 0.3);
  return { x, z };
}
function poleRow(pts, alongX){
  const ps = pts.map(([x, z]) => pole(x, z));
  for (let i = 1; i < ps.length; i++){ const a = ps[i - 1], b = ps[i]; wire(a.x + 0.55, SLAB + 6.1, a.z, b.x + 0.55, SLAB + 6.1, b.z, 0.6); wire(a.x - 0.55, SLAB + 6.1, a.z, b.x - 0.55, SLAB + 6.1, b.z, 0.65); wire(a.x, SLAB + 5.6, a.z, b.x, SLAB + 5.6, b.z, 0.5); if (rand() < 0.5) crows.push({ x: (a.x + b.x) / 2 + 0.55, y: SLAB + 6.1 - 0.5, z: (a.z + b.z) / 2, ph: R(0, 6) }); }
}

/* ---- Nord: Mittelhäuser vorn, Türme hinten ---- */
[-15, -9, -3, 3, 9, 15].forEach((x, i) => midrise(x, -21.5, 5.4, 5.2, 3 + (i % 3), 0, { word: ['カラオケ', '薬局', 'ゲーム', '時計', '眼鏡', '麻雀'][i] }));
[[-12, 26, '夜市'], [0, 32, '未来'], [12, 24, '電気']].forEach(([x, h, w]) => tower(x, -26.5, 8.5, 4.6, h, 0, { word: w, lit: 0.55 }));
/* Nordwest: Funkturm + Häuser */
(function lattice(){
  const x = -32, z = -24, H = 30;
  for (let i = 0; i < 4; i++){ const a = i * Math.PI / 2 + Math.PI / 4; const bx = x + Math.cos(a) * 3.2, bz = z + Math.sin(a) * 3.2; const tx = x + Math.cos(a) * 0.5, tz = z + Math.sin(a) * 0.5;
    strut(i % 2 ? '#E8433A' : '#F2F2F2', bx, SLAB, bz, tx, SLAB + H, tz, 0.3); }
  for (let k = 1; k <= 5; k++){ const y = SLAB + k * 5.2; const s = 6.4 - k * 1.05; B.box(k % 2 ? '#E8433A' : '#F2F2F2', x, y, z, s, 0.22, 0.22); B.box(k % 2 ? '#E8433A' : '#F2F2F2', x, y, z, 0.22, 0.22, s); }
  B.box('#F2F2F2', x, SLAB + 12, z, 3.2, 1.2, 3.2); win('#FFD9A0', x, SLAB + 12, z + 1.63, 2.8, 0.7, 0); win('#FFD9A0', x + 1.63, SLAB + 12, z, 2.8, 0.7, Math.PI / 2);
  B.box('#F2F2F2', x, SLAB + 22, z, 2.0, 1.0, 2.0); B.box('#E8433A', x, SLAB + H + 2.5, z, 0.2, 5, 0.2);
  B.glow('#FF3B3B', x, SLAB + H + 5.1, z, 0.5, 0.5, 0.5); blinkers.push({ x, y: SLAB + H + 5.1, z, ph: 0 });
  glow('#FFB070', x, SLAB + 12, z, 9, 0.35); glow('#FF9A5A', x, SLAB + 22, z, 6, 0.3);
  pickBox({ kind: 'tip', title: 'Funkturm', jp: '電波塔', sub: 'Wahrzeichen der Insel · Kulisse' }, x, SLAB + H / 2, z, 7, H + 5, 7);
})();
midrise(-26, -22, 5.2, 5, 3, 0, { word: '写真' }); house(-38, -21, Math.PI / 2);
/* Nordost: Riesenrad + Pachinko */
midrise(27, -22, 5.6, 5.2, 4, 0, { word: 'パチンコ', awn: '#FF3B6B', name: 'Pachinko-Halle', wall: '#5A2A4A' });
const WHEEL = { x: 34.5, y: SLAB + 9.5, z: -24, r: 7 };
(function wheel(){
  const { x, y, z, r } = WHEEL;
  [-1, 1].forEach(k => { const g = prep(BOX, '#7A80A0', x + k * 2.6, y / 2 + SLAB / 2, z, 0.36, y - SLAB, 0.36, 0, 0, k * 0.27); litList.push(g); });
  B.box('#7A80A0', x, y, z, 1.2, 0.5, 0.5);
  pickBox({ kind: 'tip', title: 'Riesenrad', jp: '観覧車', sub: 'Dreht die ganze Nacht · Kulisse' }, x, y, z, r * 2.2, r * 2.2, 2.5);
})();
/* ---- West: Einkaufsstraße ---- */
[[-10.5, 'konbini'], [-5, 'karaoke'], [0.5, 'hon'], [6, 'sento'], [11, 'curry']].forEach(([z, k]) => {
  if (k === 'konbini') konbini(-27.5, z, Math.PI / 2);
  else if (k === 'karaoke') midrise(-27.2, z, 5.2, 4.8, 4, Math.PI / 2, { word: 'カラオケ', awn: '#FF5FA2', name: 'Karaoke-Box', wall: '#4A2A5A' });
  else shop(-27.2, z, Math.PI / 2, { spec: SHOPS.find(s => s.key === k) });
});
[[-36, -9], [-36, -3], [-36, 3], [-36, 9]].forEach(([x, z]) => house(x, z, Math.PI / 2));
tree(-33, -12, 'tree', 0.9); tree(-33, 12.5, 'tree', 0.9); tree(-32.5, 0, 'tree', 0.8);
/* ---- Ost: Yokochō-Gasse ---- */
['ramen', 'izakaya', 'takoyaki', 'gyoza', 'tempura'].forEach((k, i) => shop(26.3, -10.5 + i * 5.3, Math.PI / 2, { spec: SHOPS.find(s => s.key === k) }));
['sushi', 'yakitori', 'onigiri', 'dango', 'kissa'].forEach((k, i) => shop(34.6, -10.5 + i * 5.3, -Math.PI / 2, { spec: SHOPS.find(s => s.key === k) }));
for (let z = -12; z <= 12; z += 2.2){ lantern(z % 4.4 === 0 || Math.abs(z % 4.4) < 0.01 ? '#FF4A2F' : '#FFB347', 30.4, 3.5, z, 0.42); }
B.box('#2B2B3A', 30.4, 3.9, 0, 0.04, 0.04, 26);
poleRow([[23.9, -13], [23.9, -4], [23.9, 5], [23.9, 13.5]]);
/* ---- Süd: große Essgasse ---- */
['udon', 'ramen', 'tonkatsu', 'izakaya', 'taiyaki', 'matcha', 'sushi'].forEach((k, i) => shop(-16.5 + i * 5.5, 20.6, 0, { spec: SHOPS.find(s => s.key === k) }));
['hana', 'yakitori', 'gyoza', 'kissa', 'takoyaki', 'hon', 'dango'].forEach((k, i) => shop(-16.5 + i * 5.5, 26.8, Math.PI, { spec: SHOPS.find(s => s.key === k) }));
for (let x = -18; x <= 18; x += 2.4){ lantern(Math.round(x / 2.4) % 2 === 0 ? '#FF4A2F' : '#FFB347', x, 3.6, 23.7, 0.44); }
B.box('#2B2B3A', 0, 4.0, 23.7, 38, 0.04, 0.04);
poleRow([[-19.5, 18.9], [-10, 18.9], [0, 18.9], [10, 18.9], [19.5, 18.9]]);
/* Südwest: Schrein + Sakura + Teich */
(function shrine(){
  B.box('#2F5A42', -31.5, SLAB + 0.03, 23.7, 15, 0.06, 10.4);
  B.geo(new THREE.CylinderGeometry(1, 1, 0.1, 18), '#2B5F86', -28, SLAB + 0.08, 25.5, 3.4, 1, 2.6);
  glow('#4FA3E8', -28, SLAB + 0.3, 25.5, 6, 0.2);
  for (let i = 0; i < 7; i++) tree(R(-38, -25), R(19.5, 28.5), 'sakura', R(0.8, 1.1));
  tree(-24.5, 20.5, 'pine', 0.9);
  const tx = -33, tz = 19.6; const tor = '#D8432F';
  B.geo(CYL, tor, tx - 1.4, SLAB + 2, tz, 0.36, 4, 0.36); B.geo(CYL, tor, tx + 1.4, SLAB + 2, tz, 0.36, 4, 0.36);
  B.box(tor, tx, SLAB + 4.0, tz, 4.2, 0.3, 0.45); B.box('#22222E', tx, SLAB + 4.3, tz, 4.6, 0.22, 0.55); B.box(tor, tx, SLAB + 3.3, tz, 3.3, 0.2, 0.3);
  B.box('#E9DFC8', -34, SLAB + 1.3, 26, 4.4, 2.6, 3.6); B.geo(roofGeo(5.6, 4.8, 1.5, true), '#3A3F55', -34, SLAB + 2.6, 26, 1, 1, 1, 0);
  win('#FFD9A0', -34, SLAB + 1.1, 27.83, 1.4, 1.6, 0);
  [-1.6, 1.6].forEach(k => { B.box('#9AA0B0', -34 + k, SLAB + 0.6, 23.4, 0.5, 1.2, 0.5); B.box('#9AA0B0', -34 + k, SLAB + 1.35, 23.4, 0.7, 0.3, 0.7); B.glow('#FFC37A', -34 + k, SLAB + 1.2, 23.4, 0.42, 0.3, 0.42); glow('#FFC37A', -34 + k, SLAB + 1.25, 23.4, 2.6, 0.5); });
  for (let i = 0; i < 6; i++) B.box('#8A8FA8', -34, SLAB + 0.04, 20.8 + i * 0.55, 1.4, 0.06, 0.4);
  pickBox({ kind: 'tip', title: 'Schrein im Kirschgarten', jp: '神社', sub: 'Blüten fallen das ganze Jahr · Kulisse' }, -31.5, SLAB + 2, 23.7, 15, 5, 10.4);
})();
/* Südost: Konbini, Taxistand, Koban */
konbini(28.5, 21.5, 0);
B.box('#3A3E5E', 35, SLAB + 0.03, 22.5, 7.5, 0.06, 7.5); for (let i = 0; i < 3; i++) B.box(paint, 33 + i * 2.2, 0.26, 22.5, 0.1, 0.02, 5);
(function koban(){ const x = 37, z = 27; B.box('#E8E3D6', x, SLAB + 1.4, z, 2.8, 2.8, 2.6); B.geo(roofGeo(3.6, 3.4, 0.9, true), '#2C3A66', x, SLAB + 2.8, z, 1, 1, 1, 0); win('#FFD9A0', x, SLAB + 1.2, z + 1.33, 1.6, 1.4, 0); B.glow('#FF3B3B', x, SLAB + 3.9, z, 0.3, 0.3, 0.3); glow('#FF3B3B', x, SLAB + 3.9, z, 2, 0.5); const uv = ATLAS.signH('交番', { color: '#FFFFFF', bg: '#1E4FB8' }); ATLAS.plane(uv, 1.6, 0.4, x, SLAB + 2.45, z + 1.36, 0); pickBox({ kind: 'tip', title: 'Kōban', jp: '交番', sub: 'Kleine Polizeistation · Kulisse' }, x, SLAB + 1.6, z, 3.4, 3.6, 3.2); })();
tree(24.5, 27.5, 'tree', 0.8); tree(38.5, 18.9, 'tree', 0.7);

/* ---- Hochbahn entlang z = -16 ---- */
const RAIL_Z = -16, RAIL_Y = 7.6;
B.box('#4A4F6E', 0, RAIL_Y - 0.35, RAIL_Z, IX * 2 - 1, 0.7, 3.2);
B.box('#9AA0C0', 0, RAIL_Y + 0.08, RAIL_Z - 0.7, IX * 2 - 1, 0.16, 0.12); B.box('#9AA0C0', 0, RAIL_Y + 0.08, RAIL_Z + 0.7, IX * 2 - 1, 0.16, 0.12);
B.box('#5A6086', 0, RAIL_Y - 0.1, RAIL_Z - 1.75, IX * 2 - 1, 0.5, 0.1); B.box('#5A6086', 0, RAIL_Y - 0.1, RAIL_Z + 1.75, IX * 2 - 1, 0.5, 0.1);
for (let x = -36; x <= 36; x += 9){ B.box('#3E4363', x, (RAIL_Y - 0.7) / 2, RAIL_Z, 1.1, RAIL_Y - 0.7, 1.1); B.box('#3E4363', x, RAIL_Y - 1.2, RAIL_Z, 2.6, 0.5, 2.6); }
(function station(){
  const x0 = 6, x1 = 17, cx = (x0 + x1) / 2;
  B.box('#5A6086', cx, RAIL_Y + 0.05, RAIL_Z + 2.5, x1 - x0, 0.3, 2.0); B.box('#5A6086', cx, RAIL_Y + 0.05, RAIL_Z - 2.5, x1 - x0, 0.3, 2.0);
  B.box('#2C3150', cx, RAIL_Y + 3.6, RAIL_Z, x1 - x0 + 1, 0.3, 7.6);
  for (let x = x0 + 0.5; x <= x1; x += 3.4){ B.box('#8A90B0', x, RAIL_Y + 1.8, RAIL_Z + 3.3, 0.16, 3.6, 0.16); B.box('#8A90B0', x, RAIL_Y + 1.8, RAIL_Z - 3.3, 0.16, 3.6, 0.16); }
  for (let x = x0 + 1; x <= x1; x += 2.6){ B.glow('#F4F6FF', x, RAIL_Y + 3.4, RAIL_Z + 2.4, 1.6, 0.08, 0.3); glow('#F4F6FF', x, RAIL_Y + 3.2, RAIL_Z + 2.4, 3, 0.35); }
  const uv = ATLAS.signH('コート駅', { color: '#FFFFFF', bg: '#2E8A5A' }); ATLAS.plane(uv, 3.4, 0.85, cx, RAIL_Y + 2.6, RAIL_Z + 3.78, 0, true);
  // Treppe runter zur Straße
  for (let i = 0; i < 9; i++) B.box('#5A6086', x1 + 1.2, RAIL_Y - 0.4 - i * 0.8, RAIL_Z + 3.2 + i * 0.55, 1.6, 0.25, 0.6);
  B.box('#8A90B0', x1 + 2.05, RAIL_Y - 3.5, RAIL_Z + 5.4, 0.08, 7.5, 0.08); B.box('#8A90B0', x1 + 0.35, RAIL_Y - 3.5, RAIL_Z + 5.4, 0.08, 7.5, 0.08);
  pickBox({ kind: 'tip', title: 'Bahnhof Court', jp: 'コート駅', sub: 'Der Zug kommt alle paar Sekunden · Kulisse' }, cx, RAIL_Y + 1.8, RAIL_Z, x1 - x0 + 2, 4, 8);
})();
[-40.5, 40.5].forEach(x => { B.box('#2E2A4A', x, RAIL_Y + 1.5, RAIL_Z, 1.6, 4.4, 4.4); B.box('#07061A', x + (x > 0 ? -0.82 : 0.82), RAIL_Y + 1.3, RAIL_Z, 0.05, 3.2, 3.2); });

/* ---- Laternen entlang der Ringstraßen, Bäume, Katzen ---- */
for (let x = -36; x <= 36; x += 9){ if (!nearRoad(x, ROAD_X)){ lamp(x, 18.9, Math.PI); lamp(x, -13.1, 0); } }
for (let z = -12; z <= 12; z += 8){ lamp(-18.9, z, -Math.PI / 2); lamp(18.9, z, Math.PI / 2); lamp(-23.6, z, Math.PI / 2); lamp(23.6, z, -Math.PI / 2); }
[[-16.5, -13.1], [16.5, -13.1], [-16.5, 13.1], [16.5, 13.1], [-19.3, 0], [19.3, 0]].forEach(([x, z]) => tree(x, z, 'tree', 0.85));
const cats = [[-13.5, SLAB + 3.9, 20.6], [9.5, SLAB + 4.2, 26.8], [26.3, SLAB + 3.5, 5.3]];
cats.forEach(([x, y, z], i) => { B.box('#2A2A2E', x, y + 0.18, z, 0.6, 0.3, 0.26, i * 1.1); B.box('#2A2A2E', x + 0.25, y + 0.42, z, 0.26, 0.24, 0.24); B.geo(CONE, '#2A2A2E', x + 0.17, y + 0.6, z - 0.08, 0.1, 0.16, 0.1); B.geo(CONE, '#2A2A2E', x + 0.33, y + 0.6, z + 0.08, 0.1, 0.16, 0.1); B.glow('#9FFF6A', x + 0.37, y + 0.44, z - 0.05, 0.05, 0.03, 0.02); B.glow('#9FFF6A', x + 0.37, y + 0.44, z + 0.05, 0.05, 0.03, 0.02); pickBox({ kind: 'tip', title: 'Nachbarschaftskatze', jp: '猫', sub: 'Schaut dem Spiel zu' }, x, y + 0.3, z, 1, 0.8, 0.8); });
/* Dampf aus Straßenschächten */
steamSpots.push({ x: 21, y: 0.1, z: 24, rate: 0.8, size: 1.6, c: '#D8D8EA' }, { x: -21, y: 0.1, z: -8, rate: 0.6, size: 1.6, c: '#D8D8EA' });
