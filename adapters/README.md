# Datenquellen

Court City liest das Depot in dieser Reihenfolge, die erste Quelle gewinnt:

| Quelle | Wann | Status |
|---|---|---|
| **Parqet über claude.ai** | Die Seite läuft als Artifact in claude.ai und hat den Parqet-Connector freigegeben. Abfrage läuft als angemeldete Person, alle 5 Minuten. | läuft |
| **`api/portfolio`** | Ein lokaler Server liefert das Depot, z. B. `adapters/parqet-connect`. | Server ungetestet |
| **`data/portfolio.json`** | Du trägst die Zahlen selbst ein oder exportierst sie per Skript. Vorlage: `data/portfolio.example.json`. | läuft |
| **Beispieldaten** | Nichts davon vorhanden. | läuft |

Alle Quellen landen im selben Format:

```json
{
  "currency": "EUR",
  "asOf": "2026-10-17T12:00:00Z",
  "total": 25000,
  "today": 120,
  "week": -310,
  "xirr": 8.4,
  "dividends": 310,
  "holdings": [ { "name": "Welt-ETF", "value": 10000, "ret": 9.1, "weight": 40, "type": "security" } ]
}
```

* `ret` ist die unrealisierte Rendite der Position in Prozent; sie bestimmt, wie oft die Position trifft.
* `weight` ist optional, sonst aus `value` berechnet.
* `today` und `week` sind absolute Beträge; eine negative Woche lässt den Markt Bälle klauen.
* `dividends` > 0 schaltet Freiwürfe frei.

## Parqet Connect (lokaler Server)

Parqet bietet keinen persönlichen API-Schlüssel, nur OAuth 2.0 für registrierte Integrationen. Ablauf:

1. Im [Parqet Developer Portal](https://developer.parqet.com/console) eine Integration anlegen, Redirect-URI `http://localhost:5173/auth/callback`.
2. `adapters/parqet-connect/.env.example` nach `.env` kopieren und die Client-ID eintragen.
3. `npm run build && npm run parqet`, dann im Browser `http://localhost:5173/auth/login` öffnen und das Depot freigeben.
4. Die Seite unter `http://localhost:5173` zeigt danach `Parqet Connect` als Quelle.

Der Server speichert Tokens in `adapters/parqet-connect/.tokens.json` (nicht eingecheckt). Die Endpunkte `GET /portfolios` und `POST /performance` stammen aus der [OpenAPI-Spezifikation](https://developer.parqet.com/api-spec/current.json); das Body-Schema von `/performance` konnte ich nicht nachlesen und habe es nach dem Muster des Parqet-MCP-Werkzeugs gesetzt. Wer das zuerst testet: Pull Request willkommen.

## Eigene Quelle anschließen

Ein Skript, das dein Depot aus Broker, Tabelle oder anderem Tracker in `data/portfolio.json` schreibt, reicht. Die Seite liest die Datei beim Laden.
