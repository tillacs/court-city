# Aufbau

Eine HTML-Datei, kein Framework, kein Bundler. three.js r128 kommt vom CDN, alles andere steht in `src/`. `npm run build` hängt die Teile in alphabetischer Reihenfolge aneinander.

| Datei | Inhalt |
|---|---|
| `src/10-page.html` | CSS, HUD, Panel, Pins, Script-Tags für three.js |
| `src/20-core.js` | Beispieldaten, Hilfen, Sound-Engine (WebAudio, synthetisch), Renderer, Kamera, Post-Processing, Licht, Builder |
| `src/30-city.js` | Insel, Straßen, Blöcke, Läden, Häuser, Türme, Schrein, Hochbahn, Laternen |
| `src/40-courts.js` | Zustand, Podium, Courts, Körbe, Tribünen, Jumbotron, Figuren-Fabrik, Teamaufbau |
| `src/50-life.js` | Zug, Autos, Passanten, Partikel, Spielzüge beider Courts |
| `src/60-ui-data.js` | HUD, Panel, Tooltips, Pins, Einstellungen, Datenadapter, Tag/Nacht, Hauptschleife |

## Warum es flüssig läuft

* **Zwei Meshes für die ganze Stadt.** Jede Box, jedes Dach, jedes Fenster wird mit Vertex-Farben in eine von zwei Listen gelegt (`B.box`, `B.glow`) und am Ende zu einem beleuchteten und einem leuchtenden Mesh verschmolzen. Statt tausender Draw Calls sind es zwei.
* **Ein Textur-Atlas für alle Schilder.** `ATLAS.signH`, `signV`, `square` zeichnen Text in eine 2048er-Leinwand; alle Schild-Flächen teilen sich ein Material.
* **Instanzen für Wiederholtes.** Leuchtkugeln, Laternen, Publikum, Passanten sind `InstancedMesh`.
* **Automatik.** Fällt die Bildrate in den ersten Sekunden unter 25, schaltet die Seite Bloom, Schatten und hohe Auflösung ab.

## Der Look

Farben werden als sRGB-Hex geschrieben und mit `col()` in linearen Farbraum gewandelt; der Renderer nutzt ACES-Tone-Mapping und sRGB-Ausgabe. Dazu `UnrealBloomPass` und ein eigener Abschluss-Shader mit Tilt-Shift-Unschärfe oben und unten, Vignette, leichter Warm-Kalt-Trennung und Filmkorn.

## Datenfluss

```
Parqet (claude.ai-Connector)  ─┐
api/portfolio (lokaler Server) ─┼─► state.portfolio ─► buildTeam() · fillHud() · drawJumbo() · Ticker
data/portfolio.json            ─┤
Beispieldaten                  ─┘
```

Einstellungen für Court 1 liegen in `localStorage` und, wenn die Seite als Artifact läuft, zusätzlich in der Artifact-Datenbank (`settings/court1`).

## Was fehlt

* Zug fährt geradeaus statt im Kreis.
* Coach-Häuschen ist leer (reserviert für einen Kommentar-Agenten).
* Parqet-Connect-Server ist ungetestet.
* Keine Tests. Prüfung bisher per Headless-Screenshot.
