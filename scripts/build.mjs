#!/usr/bin/env node
// Baut dist/court-city.html aus den Teilen in src/ (alphabetische Reihenfolge).
// Eine Datei, keine Abhängigkeiten zur Laufzeit außer three.js vom CDN.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const files = (await readdir(src)).filter(f => /\.(html|js)$/.test(f)).sort();
let out = '';
for (const f of files) out += await readFile(join(src, f), 'utf8');

const standalone = process.argv.includes('--standalone');
if (standalone) {
  // Zum direkten Öffnen als Datei: eigenes Grundgerüst, sonst liefert es claude.ai beim Publish.
  out = '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n' + out + '\n</body>\n</html>\n';
}
await mkdir(join(root, 'dist'), { recursive: true });
const target = join(root, 'dist', standalone ? 'index.html' : 'court-city.html');
await writeFile(target, out);
console.log(`${files.length} Teile → ${target} (${Math.round(out.length / 1024)} KB)`);
