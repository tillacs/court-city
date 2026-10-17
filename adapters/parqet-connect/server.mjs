#!/usr/bin/env node
// Parqet Connect → Court City. Lokaler Server ohne Abhängigkeiten (Node 18+).
//
// Was er tut:
//   1. liefert dist/index.html und data/ aus
//   2. /auth/login  → schickt dich zu Parqet (OAuth 2.0 Authorization Code + PKCE)
//   3. /auth/callback → tauscht den Code gegen Tokens, speichert sie in .tokens.json
//   4. /api/portfolio → holt Depot + Performance und liefert das Court-City-Format
//
// Voraussetzung: eine Integration im Parqet Developer Portal (developer.parqet.com/console)
// mit Redirect-URI http://localhost:5173/auth/callback. Client-ID in .env eintragen.
//
// STATUS: ungetestet. Die Endpunkte /portfolios und POST /performance stammen aus der
// öffentlichen OpenAPI-Spec (developer.parqet.com/api-spec/current.json); das Request-Body-
// Schema von /performance (PortfolioPerformanceBodyDto) war dort nicht lesbar und ist
// in parqetPerformanceBody() nach bestem Wissen gesetzt. Bitte gegen die Spec prüfen.
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const env = await loadEnv(join(here, '.env'));
const PORT = Number(env.PORT || 5173);
const CLIENT_ID = env.PARQET_CLIENT_ID || '';
const CLIENT_SECRET = env.PARQET_CLIENT_SECRET || '';          // nur falls die Integration eines hat
const REDIRECT = env.PARQET_REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const AUTH_URL = env.PARQET_AUTH_URL || 'https://connect.parqet.com/oauth2/authorize';
const TOKEN_URL = env.PARQET_TOKEN_URL || 'https://connect.parqet.com/oauth2/token';
const API_BASE = env.PARQET_API_BASE || 'https://connect.parqet.com';
const TOKENS = join(here, '.tokens.json');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
let pkce = null;

async function loadEnv(p){ try { const t = await readFile(p, 'utf8'); return Object.fromEntries(t.split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })); } catch { return {}; } }
async function loadTokens(){ try { return JSON.parse(await readFile(TOKENS, 'utf8')); } catch { return null; } }
const b64url = b => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function tokenRequest(params){
  const body = new URLSearchParams(Object.assign({ client_id: CLIENT_ID }, CLIENT_SECRET ? { client_secret: CLIENT_SECRET } : {}, params));
  const r = await fetch(TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  if (!r.ok) throw new Error('Token-Endpunkt antwortet ' + r.status + ': ' + (await r.text()).slice(0, 300));
  const t = await r.json(); t.obtained_at = Date.now(); await writeFile(TOKENS, JSON.stringify(t, null, 2)); return t;
}
async function accessToken(){
  let t = await loadTokens(); if (!t) return null;
  const expired = t.expires_in && Date.now() > t.obtained_at + (t.expires_in - 60) * 1000;
  if (expired && t.refresh_token) t = await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh_token });
  return t.access_token;
}
async function api(path, token, init){
  const r = await fetch(API_BASE + path, Object.assign({ headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' } }, init || {}));
  if (!r.ok) throw new Error(path + ' antwortet ' + r.status + ': ' + (await r.text()).slice(0, 300));
  return r.json();
}
// Nach bestem Wissen: Felder wie beim Parqet-MCP-Werkzeug. Gegen PortfolioPerformanceBodyDto prüfen.
function parqetPerformanceBody(ids, interval){ return { portfolioIds: ids, interval: interval ? { type: 'relative', value: interval } : undefined, includeCharts: false }; }

// Parqet-Performance → Court-City-Format (gleiche Felder wie data/portfolio.example.json)
function normalize(ov, wk, day){
  const total = ov.valuation ? ov.valuation.atIntervalEnd : 0;
  const alloc = (ov.netAllocations && ov.netAllocations.positive && ov.netAllocations.positive.holdings) || {};
  const list = (ov.holdings && (ov.holdings.largestByAbsoluteValue || ov.holdings)) || [];
  const holdings = (Array.isArray(list) ? list : []).filter(h => !h.isSold && h.currentValue > 0).map(h => ({ name: h.nickname || h.name, value: h.currentValue, weight: alloc[h.id], ret: h.unrealizedReturnNet || 0, type: h.assetType }));
  return { currency: ov.currency || 'EUR', asOf: new Date().toISOString(), total, today: day && day.gains ? day.gains.totalNet : 0, week: wk && wk.gains ? wk.gains.totalNet : 0, xirr: ov.returns ? ov.returns.xirr : 0, dividends: ov.dividends ? ov.dividends.net : 0, holdings };
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const send = (code, body, type) => { res.writeHead(code, { 'content-type': type || 'application/json', 'cache-control': 'no-store' }); res.end(body); };
  try {
    if (url.pathname === '/auth/login'){
      if (!CLIENT_ID) return send(500, 'PARQET_CLIENT_ID fehlt in adapters/parqet-connect/.env', 'text/plain');
      const verifier = b64url(randomBytes(48)); const challenge = b64url(createHash('sha256').update(verifier).digest()); const stateV = b64url(randomBytes(16)); pkce = { verifier, state: stateV };
      const q = new URLSearchParams({ response_type: 'code', client_id: CLIENT_ID, redirect_uri: REDIRECT, scope: 'portfolio:read', state: stateV, code_challenge: challenge, code_challenge_method: 'S256' });
      res.writeHead(302, { location: AUTH_URL + '?' + q }); return res.end();
    }
    if (url.pathname === '/auth/callback'){
      if (!pkce || url.searchParams.get('state') !== pkce.state) return send(400, 'state passt nicht, bitte /auth/login neu starten', 'text/plain');
      await tokenRequest({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: REDIRECT, code_verifier: pkce.verifier });
      res.writeHead(302, { location: '/' }); return res.end();
    }
    if (url.pathname === '/api/portfolio'){
      const token = await accessToken(); if (!token) return send(401, JSON.stringify({ error: 'nicht angemeldet', login: '/auth/login' }));
      const ports = await api('/portfolios', token); const ids = (ports.items || ports || []).map(p => p.id).filter(Boolean);
      const [ov, wk, day] = await Promise.all([api('/performance', token, { method: 'POST', body: JSON.stringify(parqetPerformanceBody(ids)) }), api('/performance', token, { method: 'POST', body: JSON.stringify(parqetPerformanceBody(ids, '1w')) }), api('/performance', token, { method: 'POST', body: JSON.stringify(parqetPerformanceBody(ids, '1d')) })]);
      return send(200, JSON.stringify(normalize(ov, wk, day)));
    }
    let path = url.pathname === '/' ? '/dist/index.html' : url.pathname;
    const body = await readFile(join(root, path)); return send(200, body, types[extname(path)] || 'application/octet-stream');
  } catch (e){ console.error(e); send(e.code === 'ENOENT' ? 404 : 500, String(e.message || e), 'text/plain'); }
}).listen(PORT, () => console.log(`Court City + Parqet Connect: http://localhost:${PORT}  (anmelden: /auth/login)`));
