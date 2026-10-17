# Die Analogie

Jedes bewegte Teil auf den Courts hängt an einer Zahl. Nichts leuchtet nur zur Zierde; die Stadt drumherum ist Kulisse.

## Court 1 · Du

| Basketball | Bedeutung | Quelle |
|---|---|---|
| Spieler Nr. 7 | du | fest |
| Gegnerteam (blau) | dein Arbeitgeber im Praktikum | `settings.opponent` |
| Spielstand `42 : 98` | Tage geschafft : Tage übrig | `settings.start`, `settings.end` |
| Buzzer | dein letzter Tag | `settings.end` |
| Dunk, Gegner am Boden | ein besonders guter Tag | Zufall, Trefferquote nach Modus |
| Wurftraining mit Hütchen und Ballwagen | Studium: Semester läuft, kein Gegner | `settings.mode = study` |
| Semesterwoche `3/14` | Wochen seit Semesterstart | `settings.start`, `settings.semWeeks` |

## Court 2 · Dein Geld

| Basketball | Bedeutung | Quelle |
|---|---|---|
| Spieler | eine Depotposition | `holdings[]` |
| Spielergröße | Anteil am Depot | `weight` |
| Starting Five | die fünf größten Positionen | sortiert nach `value` |
| Bank | alle weiteren Positionen | `holdings[5..]` |
| Korb | Kursgewinn; Positionen im Plus treffen 82 %, im Minus 42 % | `ret` |
| Freiwurf | Dividende | `dividends > 0`, jede vierte Angriffsserie |
| Rote Verteidiger | der Markt | fest |
| Steal und Korb des Marktes | schlechte Woche | `week < 0`, jede dritte Angriffsserie |
| Anzeigetafel `TEAM 6 : 2 MARKT` | Positionen im Plus : im Minus | `ret` |
| Jumbotron-Betrag | Depotwert | `total` |
| Saison | Rendite (XIRR) | `xirr` |

## Analogie ändern

Die Zuordnung steckt in drei Funktionen, nicht verstreut im Code:

* `court1Numbers()` in `src/40-courts.js` rechnet Einstellungen in Spielstand und Fortschritt um.
* `newPossession()` in `src/50-life.js` entscheidet pro Angriff: wer wirft, Freiwurf ja/nein, Steal ja/nein.
* `normalize()` bzw. `normalizeFile()` in `src/60-ui-data.js` übersetzen die Datenquelle ins interne Format.

Wer Freiwürfe lieber an die Sparrate hängen will, ändert nur die Bedingung in `newPossession()` und das Label in `openPanel('court2')`.
