
/* =====================================================================
   11. HUD, Panel, Pins, Tooltips, Eingaben
   ===================================================================== */
const $ = id => document.getElementById(id);
function el(tag, cls, txt){ const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function legend(pairs, money){ const dl = el('dl', 'legend' + (money ? ' money' : '')); pairs.forEach(([a, b]) => { dl.appendChild(el('dt', null, a)); dl.appendChild(el('dd', null, b)); }); return dl; }
function fillHud(){
  const P = state.portfolio;
  $('hud-total').textContent = fmtEUR(P.total, P.currency);
  const set = (id, v) => { const e = $(id); e.textContent = fmtSigned(v, P.currency); e.className = v >= 0 ? 'up' : 'down'; };
  set('hud-today', P.today); set('hud-week', P.week);
  const x = $('hud-xirr'); x.textContent = fmtPct(P.xirr); x.className = P.xirr >= 0 ? 'up' : 'down';
  const alloc = $('hud-alloc'); alloc.textContent = ''; P.holdings.slice(0, 10).forEach((h, i) => { const d = document.createElement('div'); d.style.width = Math.max(1, h.weight) + '%'; d.style.background = TEAM_COLORS[i % TEAM_COLORS.length]; alloc.appendChild(d); });
  $('score-eyebrow').textContent = P.source === 'live' ? '● DER SPIELSTAND · LIVE' : P.source === 'file' ? '● DER SPIELSTAND · DATEI' : '● DER SPIELSTAND · BEISPIEL';
  fillTicker();
}
function dataChip(){
  const c = $('data-chip'); const L = state.live; c.textContent = ''; c.className = 'chip';
  const asOf = L.asOf ? new Date(L.asOf).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
  if (state.portfolio.source === 'file'){ c.classList.add('live'); c.textContent = (L.label || 'Datei') + (asOf ? ' · ' + asOf : ''); }
  else if (state.portfolio.source === 'live'){ c.classList.add('live'); const d = el('span', 'ldot'); c.appendChild(d); c.appendChild(document.createTextNode('Live · Parqet' + (asOf ? ' · ' + asOf : ''))); }
  else if (L.status === 'loading'){ c.classList.add('ex'); c.textContent = 'Verbinde Parqet …'; }
  else if (L.status === 'error'){ c.classList.add('warn'); c.textContent = 'Beispieldaten · ' + liveErrorShort(L.code); }
  else { c.classList.add('ex'); c.textContent = 'Beispieldaten'; }
}
function liveErrorShort(code){
  return ({ server_not_connected: 'Parqet nicht verbunden', selection_required: 'Parqet wählen', needs_reauth: 'Parqet neu anmelden', not_in_manifest: 'Zugriff nicht erlaubt', blocked_by_policy: 'Zugriff gesperrt', approval_required: 'Freigabe nötig', server_unavailable: 'Parqet nicht erreichbar', tool_error: 'Parqet meldet Fehler', not_granted: 'kein Connector-Zugriff', capability_disabled: 'kein Connector-Zugriff' })[code] || 'keine Live-Daten';
}
function liveErrorLong(code){
  return ({ server_not_connected: 'Parqet ist in claude.ai nicht verbunden. Unter Einstellungen → Connectors hinzufügen, dann die Seite neu laden.', selection_required: 'Mehrere Parqet-Connectors gefunden. Beim nächsten Laden einen auswählen.', needs_reauth: 'Die Parqet-Anmeldung ist abgelaufen. Unter Einstellungen → Connectors neu verbinden.', not_in_manifest: 'Der Zugriff auf Parqet wurde für diese Seite abgelehnt. Im Permissions-Menü der Seite erlauben.', blocked_by_policy: 'Eine Richtlinie blockiert den Zugriff auf Parqet für diese Seite.', approval_required: 'Parqet braucht deine Freigabe für diese Seite.', server_unavailable: 'Parqet antwortet gerade nicht. Gleich noch einmal versuchen.', tool_error: 'Parqet hat die Abfrage mit einem Fehler beantwortet.', not_granted: 'Diese Ansicht darf keine Connectors nutzen.', capability_disabled: 'Diese Ansicht kann keine Connectors nutzen.' })[code] || 'Es sind gerade keine Live-Daten verfügbar.';
}
function fillTicker(){
  const P = state.portfolio, n = court1Numbers(), S = state.settings, work = S.mode === 'work';
  const best = P.holdings.slice().sort((a, b) => b.ret - a.ret)[0], worst = P.holdings.slice().sort((a, b) => a.ret - b.ret)[0];
  const items = [
    [['b', work ? 'Du vs. ' + (S.opponent || 'Gegner') : 'Wurftraining'], ['', work ? ' · Tag ' + n.a + ' geschafft, ' + n.b + ' bis zum Buzzer' : ' · Semesterwoche ' + n.a + ' von ' + n.b]],
    [['i', best ? best.short : 'Team'], ['', best ? ' führt die Scorerliste an: ' + fmtPct(best.ret) : '']],
    [['', 'Woche ' + fmtSigned(P.week, P.currency) + ' · heute ' + fmtSigned(P.today, P.currency)]],
    worst && worst.ret < 0 ? [['', 'Der Markt verteidigt gegen '], ['i', worst.short], ['', ': ' + fmtPct(worst.ret)]] : [['i', 'Alle Positionen im Plus'], ['', ' · der Markt kommt nicht durch']],
    [['', P.dividends > 0 ? 'Freiwürfe (Dividenden) bisher ' + fmtEUR(P.dividends, P.currency) : 'Noch keine Freiwürfe diese Saison']],
    [['', 'Nachtmarkt in der Yokochō-Gasse geöffnet · Zug fährt ein']]
  ];
  const track = $('track'); track.textContent = '';
  for (let rep = 0; rep < 2; rep++) items.forEach(parts => { const span = document.createElement('span'); parts.forEach(([tag, txt]) => { if (!txt) return; const e = tag ? document.createElement(tag) : document.createTextNode(txt); if (tag) e.textContent = txt; span.appendChild(e); }); track.appendChild(span); });
}
function applyMode(){
  const S = state.settings, work = S.mode === 'work';
  defenders.forEach(d => d.g.visible = work); referee.g.visible = work; trainingGear.visible = !work;
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)));
  $('mode-chip').textContent = work ? 'Modus: ' + (S.label || 'Praktikum') : 'Modus: Semester';
  $('pin1-label').textContent = work ? 'Court 1 · Du vs. ' + (S.opponent || 'Gegner') : 'Court 1 · Wurftraining';
  drawJumbo(); fillTicker();
  if (panelKind === 'court1') openPanel('court1', true);
}
document.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b){ state.settings.mode = b.dataset.mode; applyMode(); saveSettings(); SFX.click(); } });

/* Panel */
const panel = $('panel'); let panelKind = null, selectedHolding = -1;
function openPanel(kind, keepView){
  panelKind = kind; const body = $('panel-body'); body.textContent = ''; const title = $('panel-title'), sub = $('panel-sub'); title.className = '';
  const P = state.portfolio, S = state.settings;
  if (kind === 'court1'){
    const work = S.mode === 'work', n = court1Numbers();
    title.textContent = 'COURT 1 · DU'; sub.textContent = work ? 'Ligaspiel gegen ' + (S.opponent || 'deinen Gegner') + ', bis das ' + (S.label || 'Praktikum') + ' endet.' : 'Wurftraining allein. Das Semester läuft, kein Gegner auf dem Feld.';
    const seg = el('div', 'seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Modus'); [['work', 'Arbeit'], ['study', 'Studium']].forEach(([m, l]) => { const b = el('button', null, l); b.type = 'button'; b.dataset.mode = m; b.setAttribute('aria-pressed', String(S.mode === m)); seg.appendChild(b); }); body.appendChild(seg);
    const card = el('div', 'card'); card.appendChild(el('span', 'label', work ? 'Spielstand' : 'Trainingsstand'));
    const sl = el('div', 'scoreline'); sl.appendChild(el('span', 'a', String(n.a))); sl.appendChild(el('span', 's', work ? ':' : '/')); sl.appendChild(el('span', 'b', String(n.b))); card.appendChild(sl);
    card.appendChild(el('span', 'note', n.cap)); const bar = el('div', 'bar'); const fill = el('div'); fill.style.width = Math.round(n.pct * 100) + '%'; bar.appendChild(fill); card.appendChild(bar);
    card.appendChild(el('span', 'note', n.real ? 'Berechnet aus deinen Daten unten.' : 'Beispielwerte. Trag unten Start und Ende ein.')); body.appendChild(card);
    const c2 = el('div', 'card'); c2.appendChild(el('span', 'label', 'Diese Sitzung')); c2.appendChild(el('span', null, state.session.c1hits + ' Treffer aus ' + state.session.c1shots + ' Würfen · ' + state.session.c1dunks + ' Dunks')); body.appendChild(c2);
    // Einstellungen
    const f = el('form', 'card'); f.id = 'settings-form'; f.appendChild(el('span', 'label', 'Dein Spiel einstellen'));
    const grid = el('div', 'form');
    const field = (lab, id, type, val, wide, extra) => { const L = el('label', wide ? 'wide' : null, lab); let inp; if (type === 'select'){ inp = el('select'); extra.forEach(([v, t]) => { const o = el('option', null, t); o.value = v; if (v === val) o.selected = true; inp.appendChild(o); }); } else { inp = el('input'); inp.type = type; inp.value = val == null ? '' : val; if (extra) Object.assign(inp, extra); } inp.id = id; inp.name = id; L.appendChild(inp); grid.appendChild(L); return inp; };
    field('Modus', 'f-mode', 'select', S.mode, false, [['work', 'Arbeit'], ['study', 'Studium']]);
    field('Bezeichnung', 'f-label', 'text', S.label, false, { placeholder: 'Praktikum' });
    field('Gegner (Arbeitgeber)', 'f-opp', 'text', S.opponent, true, { placeholder: 'z. B. BMW', maxLength: 24 });
    field('Start', 'f-start', 'date', S.start, false); field('Ende', 'f-end', 'date', S.end, false);
    field('Semesterwochen', 'f-weeks', 'number', S.semWeeks, true, { min: 1, max: 30 });
    const save = el('button', 'btn save', 'Speichern'); save.type = 'submit'; grid.appendChild(save); f.appendChild(grid);
    f.appendChild(el('p', 'note', settingsNote()));
    f.addEventListener('submit', ev => { ev.preventDefault(); S.mode = $('f-mode').value; S.label = $('f-label').value.trim() || 'Praktikum'; S.opponent = $('f-opp').value.trim() || 'Gegner'; S.start = $('f-start').value; S.end = $('f-end').value; S.semWeeks = clamp(parseInt($('f-weeks').value, 10) || 14, 1, 30); saveSettings(); applyMode(); SFX.chime(); });
    body.appendChild(f);
    const c3 = el('div', 'card'); c3.appendChild(el('span', 'label', 'So liest du den Court')); c3.appendChild(legend([['Gegner', 'dein Arbeitgeber im Praktikum'], ['Spielzeit', 'Laufzeit von Praktikum oder Semester'], ['Buzzer', 'dein letzter Tag'], ['Dunk', 'ein besonders guter Tag, der Gegner liegt am Boden'], ['Training', 'Studienphase, kein Gegner']])); body.appendChild(c3);
    if (!keepView) flyTo(new THREE.Vector3(COURT.c1, PY, -1.5), 40);
  } else if (kind === 'court2'){
    title.textContent = 'COURT 2 · DEIN GELD'; title.className = 'money'; sub.textContent = 'Dein Depot als Team. Große Spieler sind große Positionen, ein Korb ist Kursgewinn, die roten Verteidiger sind der Markt.';
    const lc = el('div', 'card'); lc.appendChild(el('span', 'label', 'Datenquelle'));
    const L = state.live;
    if (P.source === 'live'){ lc.appendChild(el('span', null, 'Live aus Parqet' + (L.asOf ? ' · Stand ' + new Date(L.asOf).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''))); const rb = el('button', 'btn', 'Aktualisieren'); rb.type = 'button'; rb.addEventListener('click', () => { refreshLive(); SFX.click(); }); lc.appendChild(rb); }
    else if (L.status === 'loading') lc.appendChild(el('span', null, 'Verbinde mit Parqet …'));
    else if (L.status === 'error'){ lc.appendChild(el('span', null, liveErrorLong(L.code))); if (L.code === 'approval_required' || L.code === 'server_unavailable' || L.code === 'upstream_error'){ const rb = el('button', 'btn', L.code === 'approval_required' ? 'Freigabe erteilen' : 'Noch einmal versuchen'); rb.type = 'button'; rb.addEventListener('click', () => { startLive(true); SFX.click(); }); lc.appendChild(rb); } lc.appendChild(el('p', 'note', 'Solange laufen Beispieldaten.')); }
    else if (P.source === 'file') lc.appendChild(el('span', null, 'Aus ' + (L.label || 'Datei') + (L.asOf ? ' · Stand ' + new Date(L.asOf).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '') + '. Datei ändern und neu laden.'));
    else lc.appendChild(el('span', null, 'Beispieldaten. Live-Daten kommen über Parqet in claude.ai oder über data/portfolio.json (siehe README).'));
    body.appendChild(lc);
    const card = el('div', 'card'); card.appendChild(el('span', 'label', 'Spielstand')); card.appendChild(el('span', 'big', fmtEUR(P.total, P.currency)));
    const kv = el('div', 'kv'); const plus = P.holdings.filter(h => h.ret > 0).length, minus = P.holdings.filter(h => h.ret < 0).length;
    [['Heute', fmtSigned(P.today, P.currency), P.today >= 0 ? 'up' : 'down'], ['Diese Woche', fmtSigned(P.week, P.currency), P.week >= 0 ? 'up' : 'down'], ['Saison (XIRR)', fmtPct(P.xirr), P.xirr >= 0 ? 'up' : 'down'], ['Team : Markt', plus + ' : ' + minus, ''], ['Freiwürfe (Dividenden)', fmtEUR(P.dividends, P.currency), '']].forEach(([a, b, c]) => { kv.appendChild(el('span', null, a)); kv.appendChild(el('b', c, b)); });
    card.appendChild(kv); body.appendChild(card);
    const k = el('div', 'card'); k.appendChild(el('span', 'label', 'Kader · antippen zum Hervorheben')); const rows = el('div', 'rows');
    P.holdings.slice(0, 10).forEach((h, i) => { const r = el('button', 'row'); r.type = 'button'; r.setAttribute('aria-pressed', String(selectedHolding === i)); const n = el('span', 'n', '#' + (i + 1)); n.style.color = TEAM_COLORS[i % TEAM_COLORS.length]; r.appendChild(n); const nm = el('span', 'nm', h.name); nm.title = h.name; r.appendChild(nm); r.appendChild(el('span', 'w', h.weight.toFixed(0) + ' %')); r.appendChild(el('span', 'r ' + (h.ret >= 0 ? 'up' : 'down'), fmtPct(h.ret))); r.addEventListener('click', () => { selectHolding(i); SFX.click(); }); rows.appendChild(r); });
    k.appendChild(rows); k.appendChild(el('p', 'note', 'Die ersten fünf stehen auf dem Feld, der Rest sitzt auf der Bank.')); body.appendChild(k);
    const c3 = el('div', 'card'); c3.appendChild(el('span', 'label', 'So liest du den Court')); c3.appendChild(legend([['Spieler', 'eine Position'], ['Größe', 'Anteil am Depot'], ['Korb', 'Kursgewinn, Trefferquote nach Plus oder Minus'], ['Freiwurf', 'Dividende'], ['Steal', 'schlechte Woche, der Markt punktet'], ['Bank', 'kleine Positionen']], true)); body.appendChild(c3);
    if (!keepView) flyTo(new THREE.Vector3(COURT.c2, PY, 1.5), 40);
  } else if (kind === 'coach'){
    title.textContent = 'COACH · SPÄTER'; sub.textContent = 'Das Glashäuschen an der Seitenlinie ist für Claude reserviert.';
    const c = el('div', 'card'); c.appendChild(el('span', 'label', 'Geplante Rolle')); c.appendChild(legend([['Kommentar', 'erklärt, was auf den Courts passiert'], ['Taktik', 'schlägt Spielzüge vor, etwa Umschichten'], ['Grenze', 'handelt nie selbst']])); body.appendChild(c);
    if (!keepView) flyTo(new THREE.Vector3(0, PY, 7), 30);
  }
  panel.hidden = false;
}
function closePanel(){ panel.hidden = true; panelKind = null; selectHolding(-1, true); }
$('panel-close').addEventListener('click', () => { closePanel(); SFX.click(); });
function selectHolding(i, silent){ selectedHolding = i; team.concat(bench).forEach(p => p.ring.visible = p.idx === i); if (!silent && panelKind === 'court2') openPanel('court2', true); }

/* Kamera */
let fly = null;
function flyTo(target, dist){ fly = { t: 0, dur: 1.3, fromT: controls.target.clone(), toT: target.clone(), fromD: camera.position.distanceTo(controls.target), toD: dist }; }
function homeView(){ closePanel(); flyTo(HOME, isPhone() ? 150 : 108); }
$('btn-home').addEventListener('click', () => { homeView(); SFX.click(); });
$('btn-c1').addEventListener('click', () => { openPanel('court1'); SFX.click(); });
$('btn-c2').addEventListener('click', () => { openPanel('court2'); SFX.click(); });
$('btn-day').addEventListener('click', () => { state.day = !state.day; applyDay(); SFX.click(); });
$('btn-rot').addEventListener('click', e => { controls.autoRotate = !controls.autoRotate; e.currentTarget.setAttribute('aria-pressed', String(controls.autoRotate)); SFX.click(); });
$('btn-snd').addEventListener('click', e => { const on = SFX.toggle(); e.currentTarget.setAttribute('aria-pressed', String(on)); $('snd-lbl').textContent = on ? 'Sound an' : 'Sound aus'; if (on) SFX.chime(); try { localStorage.setItem('courtcity.sound', on ? '1' : '0'); } catch (err) {} });
$('pin-court1').addEventListener('click', () => { openPanel('court1'); SFX.click(); });
$('pin-court2').addEventListener('click', () => { openPanel('court2'); SFX.click(); });
$('pin-coach').addEventListener('click', () => { openPanel('coach'); SFX.click(); });
window.addEventListener('keydown', e => { if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'Escape'){ if (!panel.hidden) homeView(); } else if (e.key === '1') openPanel('court1'); else if (e.key === '2') openPanel('court2'); else if (e.key === 'r' || e.key === 'R') $('btn-rot').click(); });

/* Picking */
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(); const tip = $('tip');
function hit(cx, cy){
  const r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickables, true);
  for (const h of hits){ let o = h.object; while (o && !o.userData.pick) o = o.parent; if (o) return o.userData.pick; }
  return null;
}
function describe(p){
  if (!p) return null; const S = state.settings;
  if (p.kind === 'tip' || p.kind === 'shop') return p;
  if (p.kind === 'court1') return { title: S.mode === 'work' ? 'Court 1 · Du vs. ' + (S.opponent || 'Gegner') : 'Court 1 · Wurftraining', sub: 'Klicken für Details und Einstellungen' };
  if (p.kind === 'court2') return { title: 'Court 2 · Dein Geld', sub: 'Klicken für Kader und Live-Daten' };
  if (p.kind === 'coach') return { title: 'Coach-Häuschen', jp: 'コーチ', sub: 'Für Claude reserviert · später' };
  if (p.kind === 'holding'){ const h = state.portfolio.holdings[p.idx]; if (!h) return null; return { title: '#' + (p.idx + 1) + ' ' + h.name, sub: h.weight.toFixed(0) + ' % Gewicht · ' + fmtPct(h.ret) + (state.portfolio.source === 'live' ? '' : ' (Beispiel)') }; }
  return null;
}
function showTip(d, x, y){
  if (!d){ tip.hidden = true; return; } tip.textContent = '';
  const t = el('div', 't', d.title); if (d.jp) t.appendChild(el('span', 'jp', d.jp)); tip.appendChild(t); if (d.sub) tip.appendChild(el('div', 's', d.sub));
  tip.hidden = false; const r = app.getBoundingClientRect(); let lx = x - r.left + 14, ly = y - r.top + 14; if (lx + 260 > r.width) lx = x - r.left - 264; if (ly + 70 > r.height) ly = y - r.top - 74; tip.style.left = lx + 'px'; tip.style.top = ly + 'px';
}
let hoverReq = null, hoverKey = null, tipTimer = null;
canvas.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || e.buttons || hoverReq) return;
  hoverReq = requestAnimationFrame(() => { hoverReq = null; const p = hit(e.clientX, e.clientY); const d = describe(p); canvas.classList.toggle('pointer', !!p); const key = d ? d.title : null; if (key !== hoverKey){ hoverKey = key; if (d) SFX.hover(p.kind === 'shop' ? 1 : p.kind === 'holding' ? 2 : 0); } clearTimeout(tipTimer); showTip(d, e.clientX, e.clientY); });
});
canvas.addEventListener('pointerleave', () => { tip.hidden = true; hoverKey = null; });
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; hideHint(); });
canvas.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return; const p = hit(e.clientX, e.clientY); if (!p) return;
  if (p.kind === 'court1' || p.kind === 'court2' || p.kind === 'coach'){ tip.hidden = true; openPanel(p.kind); SFX.click(); }
  else if (p.kind === 'holding'){ if (panelKind !== 'court2') openPanel('court2'); selectHolding(p.idx); SFX.click(); }
  else { if (p.kind === 'shop'){ steamBurst.until = 1.2; steamBurst.x = p.x; steamBurst.y = p.y; steamBurst.z = p.z; SFX.chime(); SFX.steam(); } else SFX.click(); showTip(describe(p), e.clientX, e.clientY); clearTimeout(tipTimer); tipTimer = setTimeout(() => { tip.hidden = true; }, 2600); }
});
const hint = $('hint'); let hintGone = false;
function hideHint(){ if (hintGone) return; hintGone = true; hint.style.opacity = '0'; setTimeout(() => hint.hidden = true, 700); }
/* Pins über den Courts */
const PINS = [
  { el: $('pin-court1'), p: new THREE.Vector3(COURT.c1, PY + 5.2, 0) },
  { el: $('pin-court2'), p: new THREE.Vector3(COURT.c2, PY + 5.2, 0) },
  { el: $('pin-coach'), p: new THREE.Vector3(0, PY + 3.6, 7.2) }
];
const _v = new THREE.Vector3(); const pinRects = [];
function placePins(){
  const w = app.clientWidth, h = app.clientHeight; pinRects.length = 0;
  PINS.forEach((pin, i) => {
    _v.copy(pin.p).project(camera); let sx = (_v.x + 1) / 2 * w, sy = (1 - _v.y) / 2 * h; const behind = _v.z > 1;
    const pw = pin.el.offsetWidth || 150, ph = pin.el.offsetHeight || 38; let x0 = sx - pw / 2, y0 = sy - ph - 8;
    for (let k = 0; k < 8; k++){ const clash = pinRects.find(r => x0 < r.x1 + 6 && x0 + pw > r.x0 - 6 && y0 < r.y1 + 6 && y0 + ph > r.y0 - 6); if (!clash) break; y0 = clash.y1 + 10; }
    pinRects.push({ x0, y0, x1: x0 + pw, y1: y0 + ph });
    pin.el.style.transform = 'translate(' + x0.toFixed(1) + 'px,' + y0.toFixed(1) + 'px)'; pin.el.style.opacity = behind ? '0' : '1'; pin.el.style.pointerEvents = behind ? 'none' : 'auto';
  });
}

/* =====================================================================
   12. Einstellungen (db oder lokal) und Live-Daten (Parqet über mcp)
   ===================================================================== */
let dbApi = null, mcp = null, liveWatches = [], liveParts = { ov: null, wk: null, day: null }, liveIds = null;
function settingsNote(){ return dbApi ? 'Wird für diese Seite gespeichert, auf allen deinen Geräten.' : 'Wird nur in diesem Browser gespeichert.'; }
function loadLocalSettings(){ try { const s = JSON.parse(localStorage.getItem('courtcity.settings') || 'null'); if (s) Object.assign(state.settings, DEFAULT_SETTINGS, s); } catch (e) {} }
async function saveSettings(){
  try { localStorage.setItem('courtcity.settings', JSON.stringify(state.settings)); } catch (e) {}
  if (dbApi){ try { await dbApi.doc('settings/court1').set(Object.assign({}, state.settings, { savedAt: new Date().toISOString() })); } catch (e) { console.warn('settings not saved', e && e.code); } }
}
async function initDb(){
  if (!window.claude || !window.claude.use) return;
  try { dbApi = await window.claude.use('db'); } catch (e) { dbApi = null; }
  if (!dbApi) return;
  try { const snap = await dbApi.doc('settings/court1').get(); if (snap.exists){ const d = snap.data(); const s = {}; ['mode', 'opponent', 'label', 'start', 'end', 'semWeeks'].forEach(k => { if (d[k] != null) s[k] = d[k]; }); Object.assign(state.settings, s); applyMode(); } } catch (e) { console.warn('settings not loaded', e && e.code); }
}
const PARQET = 'Parqet';
function normalize(ov, wk, day){
  const total = ov.valuation ? ov.valuation.atIntervalEnd : 0; const alloc = (ov.netAllocations && ov.netAllocations.positive && ov.netAllocations.positive.holdings) || {};
  let asOf = 0;
  const holdings = ((ov.holdings && ov.holdings.largestByAbsoluteValue) || []).filter(h => !h.isSold && h.currentValue > 0).map(h => { if (h.quote && h.quote.datetime){ const t = Date.parse(h.quote.datetime); if (t > asOf) asOf = t; } return { id: h.id, name: h.nickname || h.name, short: shortName(h.nickname || h.name), value: h.currentValue, weight: alloc[h.id] != null ? alloc[h.id] : (total ? h.currentValue / total * 100 : 0), ret: h.unrealizedReturnNet || 0, gain: h.totalGainNet || 0, type: h.assetType }; }).sort((a, b) => b.value - a.value);
  return { total, currency: ov.currency || 'EUR', today: day && day.gains ? day.gains.totalNet : 0, week: wk && wk.gains ? wk.gains.totalNet : 0, xirr: ov.returns ? ov.returns.xirr : 0, dividends: ov.dividends ? ov.dividends.net : 0, holdings, asOf: asOf || null, source: 'live' };
}
function applyLive(){
  if (!liveParts.ov) return;
  const prev = state.portfolio.source;
  state.portfolio = normalize(liveParts.ov, liveParts.wk, liveParts.day);
  state.live.status = 'ok'; state.live.code = null; state.live.asOf = state.portfolio.asOf || state.live.asOf;
  buildTeam(); fillHud(); drawJumbo(); dataChip(); if (panelKind === 'court2') openPanel('court2', true);
  if (prev !== 'live') SFX.chime();
}
function setLiveError(code){ state.live.status = 'error'; state.live.code = code; dataChip(); if (panelKind === 'court2') openPanel('court2', true); }
async function startLive(userGesture){
  if (!mcp) return; liveWatches.forEach(u => { try { u(); } catch (e) {} }); liveWatches = []; state.live.status = 'loading'; dataChip();
  try {
    if (!liveIds){ const res = await mcp.callTool(PARQET, 'parqet_list_portfolios', {}); const items = (res.payload && res.payload.items) || []; liveIds = items.map(i => i.id); if (res.cache && res.cache.storedAt) state.live.asOf = res.cache.storedAt; }
    if (!liveIds.length){ setLiveError('tool_error'); return; }
  } catch (e){
    const code = e && e.code ? e.code : 'upstream_error';
    if ((code === 'server_unavailable' || (code === 'upstream_error' && e.retryable)) && !state.live.retried && !userGesture){ state.live.retried = true; setTimeout(() => startLive(false), (e.retryAfterMs || 1500) + Math.random() * 800); return; }
    setLiveError(code); return;
  }
  const watch = (key, input) => {
    const u = mcp.watchTool(PARQET, 'parqet_query_portfolio', input, ev => {
      if (ev.type === 'data'){ liveParts[key] = ev.result.payload; if (ev.result.cache && ev.result.cache.storedAt && !liveParts.ov) state.live.asOf = ev.result.cache.storedAt; applyLive(); }
      else { const code = ev.error && ev.error.code; if (['needs_reauth', 'server_not_connected', 'blocked_by_policy', 'approval_required', 'not_in_manifest', 'not_granted', 'capability_disabled', 'selection_required'].includes(code)){ liveParts = { ov: null, wk: null, day: null }; if (state.portfolio.source === 'live'){ state.portfolio = JSON.parse(JSON.stringify(SAMPLE)); buildTeam(); fillHud(); drawJumbo(); } setLiveError(code); } else if (!liveParts.ov) setLiveError(code || 'upstream_error'); }
    }, { cache: { staleTime: 120000, gcTime: 3600000 }, refetchInterval: 300000 });
    liveWatches.push(u);
  };
  watch('ov', { view: 'overview', portfolioIds: liveIds, topHoldingsLimit: 25 });
  watch('wk', { view: 'overview', portfolioIds: liveIds, intervalType: 'relative', intervalValue: '1w', topHoldingsLimit: 0 });
  watch('day', { view: 'overview', portfolioIds: liveIds, intervalType: 'relative', intervalValue: '1d', topHoldingsLimit: 0 });
}
/* Datei- und Server-Adapter: data/portfolio.json oder api/portfolio (siehe adapters/) */
function normalizeFile(j){
  const hs = (j.holdings || []).filter(h => h && h.name && Number(h.value) > 0).map(h => ({ name: String(h.name), value: Number(h.value), ret: Number(h.ret || 0), type: h.type || 'security' }));
  const total = Number(j.total) || hs.reduce((s, h) => s + h.value, 0);
  const holdings = hs.map((h, i) => ({ id: 'f' + i, name: h.name, short: h.short || shortName(h.name), value: h.value, weight: h.weight != null ? Number(h.weight) : (total ? h.value / total * 100 : 0), ret: h.ret, gain: 0, type: h.type })).sort((a, b) => b.value - a.value);
  return { total, currency: j.currency || 'EUR', today: Number(j.today || 0), week: Number(j.week || 0), xirr: Number(j.xirr || 0), dividends: Number(j.dividends || 0), holdings, asOf: j.asOf || null, source: 'file' };
}
async function initFileData(){
  if (!/^https?:$/.test(location.protocol)) return;
  for (const url of ['api/portfolio', 'data/portfolio.json']){
    try {
      const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) continue; const j = await r.json(); if (!j || !Array.isArray(j.holdings)) continue;
      if (state.portfolio.source === 'live') return;
      state.portfolio = normalizeFile(j); state.live.status = 'file'; state.live.asOf = state.portfolio.asOf; state.live.label = url === 'api/portfolio' ? 'Parqet Connect' : 'portfolio.json';
      buildTeam(); fillHud(); drawJumbo(); dataChip(); if (panelKind === 'court2') openPanel('court2', true); return;
    } catch (e) {}
  }
}
async function refreshLive(){ if (!mcp) return; try { await mcp.invalidate(PARQET, 'parqet_query_portfolio'); } catch (e) {} }
async function initMcp(){
  if (!window.claude || !window.claude.use) return;
  try { mcp = await window.claude.use('mcp'); } catch (e) { mcp = null; }
  if (!mcp) return; startLive(false);
}

/* =====================================================================
   13. Tag/Nacht, Qualität, Hauptschleife
   ===================================================================== */
function applyDay(){
  const day = state.day;
  scene.background = day ? SKY_DAY : SKY_NIGHT; scene.fog.color.copy(day ? FOG_DAY : FOG_NIGHT); scene.fog.near = day ? 160 : 120; scene.fog.far = day ? 460 : 330;
  hemi.color.copy(day ? col('#DDE8FF') : col('#6A74D8')); hemi.groundColor.copy(day ? col('#7A6A58') : col('#1C1030')); hemi.intensity = day ? 1.6 : 0.8;
  moon.color.copy(day ? col('#FFF3E0') : col('#9FB0FF')); moon.intensity = day ? 2.3 : 0.65; moon.position.set(day ? 70 : -60, day ? 110 : 90, day ? 50 : 30);
  floods.forEach(l => l.intensity = day ? 0 : 1.15); alleyLights.forEach(l => l.intensity = day ? 0 : 0.9);
  statics.emit.material.color.setScalar(day ? 0.3 : 1.5); statics.lit.material.color.setScalar(day ? 1.45 : 1); signMesh && signMesh.material.color.setScalar(day ? 0.75 : 1); lanternMesh.material.color.setScalar(day ? 0.35 : 1);
  glowMat.uniforms.opacity.value = day ? 0.12 : 1;
  renderer.toneMappingExposure = day ? 1.3 : 1.25; bloom.strength = day ? 0.15 : 0.62; bloom.threshold = day ? 0.9 : 0.62; finalPass.uniforms.vig.value = day ? 0.25 : 0.55; finalPass.uniforms.warm.value = day ? 0.2 : 1;
  stars.visible = !day;
  $('day-lbl').textContent = day ? 'Tag' : 'Nacht'; $('btn-day').setAttribute('aria-pressed', String(day));
}
const starGeo = new THREE.BufferGeometry(); const starPos = [];
for (let i = 0; i < 500; i++){ const v = new THREE.Vector3(R(-1, 1), R(0.05, 1), R(-1, 1)).normalize().multiplyScalar(R(320, 420)); starPos.push(v.x, v.y, v.z); }
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8, fog: false })); stars.material.color.copy(col('#C9D3FF')); scene.add(stars);

let frames = 0, slowFrames = 0, perfChecked = false;
function adaptQuality(frameMs){
  if (perfChecked) return; frames++; if (frameMs > 42) slowFrames++;
  if (frames >= 150){ perfChecked = true; if (slowFrames > 90){ quality.bloom = false; bloom.enabled = false; renderer.setPixelRatio(1); finalPass.uniforms.res.value.set(app.clientWidth, app.clientHeight); composer.setSize(app.clientWidth, app.clientHeight); moon.castShadow = false; finalPass.uniforms.tilt.value = 0.4; const c = el('span', 'chip ex', 'Leistung: reduziert'); $('mode-chip').parentNode.appendChild(c); } }
}

let last = performance.now(), elapsed = 0, clockTick = 0;
const speed = reduceMotion ? 0.4 : 1;
function tick(now){
  const raw = Math.min(0.05, (now - last) / 1000); const dt = raw * speed; last = now; elapsed += dt; const t = elapsed;
  if (fly){ fly.t += raw; const k = Math.min(1, fly.t / fly.dur), e = ease(k); const tgt = _a.lerpVectors(fly.fromT, fly.toT, e); const dir = _b.copy(camera.position).sub(controls.target).normalize(); controls.target.copy(tgt); camera.position.copy(tgt).addScaledVector(dir, lerp(fly.fromD, fly.toD, e)); if (k >= 1) fly = null; }
  controls.target.x = clamp(controls.target.x, -44, 44); controls.target.z = clamp(controls.target.z, -34, 34); controls.target.y = clamp(controls.target.y, -2, 14);
  controls.update();
  stepCourt1(dt, t); stepCourt2(dt, t);
  // Körbe wackeln, Wurfuhren
  rims.forEach(r => { if (r.shake > 0){ r.shake -= dt; r.group.position.y = r.pos.y + Math.sin(r.shake * 40) * 0.05 * r.shake; r.group.rotation.x = Math.sin(r.shake * 30) * 0.08 * r.shake; } else { r.group.position.y = r.pos.y; r.group.rotation.x = 0; } r.t -= dt; if (r.t < 0) r.t = 24; });
  clockTick += dt; if (clockTick > 1){ clockTick = 0; rims.forEach(drawClock); }
  // Publikum
  cheer.c1 = Math.max(0, cheer.c1 - dt); cheer.c2 = Math.max(0, cheer.c2 - dt);
  for (let i = 0; i < crowdSeats.length; i++){ const s = crowdSeats[i]; const c = s.side < 0 ? cheer.c1 : cheer.c2; const jump = c > 0 ? Math.abs(Math.sin(t * 11 + s.ph)) * 0.4 * Math.min(1, c) : Math.abs(Math.sin(t * 1.4 + s.ph)) * 0.03;
    dummy.position.set(s.x, s.y + 0.36 + jump, s.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); crowdBody.setMatrixAt(i, dummy.matrix);
    dummy.position.y += 0.52; dummy.updateMatrix(); crowdHead.setMatrixAt(i, dummy.matrix);
    dummy.position.set(s.x + s.side * -0.16, s.y + 0.6 + jump + (c > 0 ? 0.4 : 0), s.z + 0.18); dummy.rotation.set(c > 0 ? 0 : 0.6, 0, c > 0 ? 0 : 0.4); dummy.updateMatrix(); crowdArm.setMatrixAt(i, dummy.matrix); }
  crowdBody.instanceMatrix.needsUpdate = crowdHead.instanceMatrix.needsUpdate = crowdArm.instanceMatrix.needsUpdate = true;
  // Autos + Scheinwerfer
  let gd = 0;
  cars.forEach(c => { c.t += c.v * c.dir * dt; const p = ringPos(c.t, c.dir); const lx = p.dz, lz = -p.dx; c.g.position.set(p.x + lx * 1.15, SLAB - 0.2, p.z + lz * 1.15); c.g.rotation.y = Math.atan2(-p.dz, p.dx);
    _a.set(c.bus ? 2.9 : 1.2, 0.5, 0).applyQuaternion(c.g.quaternion).add(c.g.position); dummy.position.copy(_a); dummy.scale.setScalar(2.4); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); glowDyn.setMatrixAt(gd, dummy.matrix); glowDyn.setColorAt(gd, col('#FFF1C8')); gd++; });
  // Blinklichter
  blinkers.forEach(b => { const on = Math.sin(t * 2.6 + b.ph) > 0.5; dummy.position.set(b.x, b.y, b.z); dummy.scale.setScalar(on ? 2.6 : 0.001); dummy.updateMatrix(); glowDyn.setMatrixAt(gd, dummy.matrix); glowDyn.setColorAt(gd, col('#FF3B3B')); gd++; });
  // Bälle leuchten leicht
  [ball1, ball2].forEach(b => { dummy.position.copy(b.position); dummy.scale.setScalar(1.3); dummy.updateMatrix(); glowDyn.setMatrixAt(gd, dummy.matrix); glowDyn.setColorAt(gd, new THREE.Color(0.35, 0.18, 0.06)); gd++; });
  glowDyn.count = Math.min(80, gd); glowDyn.instanceMatrix.needsUpdate = true; if (glowDyn.instanceColor) glowDyn.instanceColor.needsUpdate = true;
  // Passanten
  for (let i = 0; i < PEDS; i++){ const p = peds[i]; p.t += p.v * dt; pathPos(p, _a); const bob = Math.abs(Math.sin(t * 7 + p.ph)) * 0.05; dummy.position.set(_a.x, SLAB + 0.36 + bob, _a.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); pedBody.setMatrixAt(i, dummy.matrix); dummy.position.y += 0.5; dummy.updateMatrix(); pedHead.setMatrixAt(i, dummy.matrix); }
  pedBody.instanceMatrix.needsUpdate = pedHead.instanceMatrix.needsUpdate = true;
  // Zug
  const tx = ((t * 8.5) % 160) - 80;
  train.forEach((g, i) => { const x = tx - i * 6.1; g.position.set(x, RAIL_Y + 0.1, RAIL_Z); g.visible = Math.abs(x) < 39.5; });
  if (tx > -10 && tx < -9.5 && !trainSfx){ trainSfx = true; SFX.train(); } if (tx > 40) trainSfx = false;
  // Riesenrad
  wheelSpin.rotation.z += dt * 0.1; gondolas.forEach(gg => { const a = gg.a + wheelSpin.rotation.z; gg.m.position.set(WHEEL.x + Math.cos(a) * WHEEL.r, WHEEL.y + Math.sin(a) * WHEEL.r - 0.7, WHEEL.z); });
  // Laternen schwingen
  if (!reduceMotion || frames < 2){ for (let i = 0; i < lanterns.length; i++){ const l = lanterns[i]; dummy.position.set(l.x + Math.sin(t * 1.6 + l.ph) * 0.06, l.y, l.z); dummy.rotation.set(0, 0, Math.sin(t * 1.6 + l.ph) * 0.12); dummy.scale.setScalar(l.s); dummy.updateMatrix(); lanternMesh.setMatrixAt(i, dummy.matrix); } lanternMesh.instanceMatrix.needsUpdate = true; }
  // Dampf, Blüten, Konfetti, Texte
  steamSpots.forEach(s => { if (mrand() < s.rate * dt * 1.2) spawn(steam, s.x + R(-0.2, 0.2), s.y, s.z + R(-0.2, 0.2), s.c, R(-0.15, 0.15), R(0.5, 0.9), R(-0.15, 0.15), s.size * R(0.8, 1.3)); });
  if (steamBurst.until > 0){ steamBurst.until -= dt; for (let i = 0; i < 3; i++) spawn(steam, steamBurst.x + R(-0.6, 0.6), steamBurst.y, steamBurst.z + R(-0.4, 0.4), '#F4F4FF', R(-0.4, 0.4), R(0.8, 1.6), R(-0.4, 0.4), R(0.8, 1.4)); }
  stepParticles(steam, dt, 0.33, -0.02, 0.1);
  if (mrand() < dt * 10) spawn(petals, R(-39, -24), R(3, 7), R(19.5, 29), pick(['#FFC2D8', '#FFD6E6', '#F7A8C6']), R(-0.4, 0.4), -0.35, R(-0.2, 0.2), R(0.25, 0.4));
  stepParticles(petals, dt, 0.12, 0.0, 0.3);
  if (confetti.visible){ let alive = false; for (let i = 0; i < CONF; i++){ if (confLife[i] <= 0) continue; alive = true; confLife[i] -= dt; confVel[i * 3 + 1] -= 9 * dt; confPos[i * 3] += confVel[i * 3] * dt; confPos[i * 3 + 1] += confVel[i * 3 + 1] * dt; confPos[i * 3 + 2] += confVel[i * 3 + 2] * dt; if (confPos[i * 3 + 1] < PY) confLife[i] = 0; } confGeo.attributes.position.needsUpdate = true; if (!alive) confetti.visible = false; }
  for (let i = floaters.length - 1; i >= 0; i--){ const f = floaters[i]; f.t += dt; f.s.position.y += dt * 1.1; f.s.material.opacity = Math.max(0, 1 - f.t / 1.5); if (f.t > 1.5){ scene.remove(f.s); f.s.material.map.dispose(); f.s.material.dispose(); floaters.splice(i, 1); } }
  // Namensschilder über dem Team
  const camD = camera.position.distanceTo(controls.target); const nameA = clamp((70 - camD) / 30, 0, 1);
  nameSprites.forEach(s => { const p = s.userData.p; s.position.set(p.g.position.x, p.g.position.y + 2.55 * p.scale + 0.3, p.g.position.z); s.material.opacity = nameA * (p === bench[0] || bench.includes(p) ? 0.7 : 1); s.visible = nameA > 0.02; });
  jumbo.led.material.color.copy(col('#FF8A3D')).multiplyScalar(0.45 + 0.2 * Math.sin(t * 3));
  finalPass.uniforms.time.value = t;
  placePins();
  composer.render();
  adaptQuality((performance.now() - now));
  requestAnimationFrame(tick);
}

/* =====================================================================
   14. Start
   ===================================================================== */
function start(){
  loadLocalSettings();
  try { if (localStorage.getItem('courtcity.sound') === '1') { /* Autoplay-Regel: erst nach Klick */ } } catch (e) {}
  buildTeam(); fillHud(); drawJumbo(); applyMode(); applyDay(); dataChip();
  controls.target.copy(HOME); camera.position.copy(HOME).add(VIEW_DIR.clone().multiplyScalar(230)); camera.position.y += 40; camera.lookAt(HOME);
  const homeD = isPhone() ? 150 : 108;
  if (location.hash === '#fast'){ camera.position.copy(HOME).add(VIEW_DIR.clone().multiplyScalar(homeD)); camera.lookAt(HOME); }
  else fly = { t: 0, dur: 2.6, fromT: HOME.clone(), toT: HOME.clone(), fromD: camera.position.distanceTo(HOME), toD: homeD };
  requestAnimationFrame(now => { last = now; tick(now); });
  setTimeout(() => $('loading').classList.add('done'), 250);
  initDb(); initMcp(); initFileData();
}
start();
})();
</script>
