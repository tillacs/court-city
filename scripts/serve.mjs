#!/usr/bin/env node
// Kleiner Entwicklungsserver: liefert dist/index.html und data/*.json.
// Start: npm run dev → http://localhost:5173
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };
const port = Number(process.env.PORT || 5173);

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = url.pathname === '/' ? '/dist/index.html' : url.pathname;
  if (path.startsWith('/data/')) path = path; // data/portfolio.json, data/settings.json
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(port, () => console.log(`Court City läuft auf http://localhost:${port}`));
