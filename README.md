# Campo Libero · 3 contro 3

Partita di calcio su un campetto d’asfalto consumato, con porte **a sinistra e a destra** e sponde esterne giocabili. Squadra **rossa** contro **blu**, tre giocatori ciascuna: due di movimento e un portiere.

- Controlli i rossi; il compagno, gli avversari e i portieri usano l’IA.
- Tutti i gol valgono uno, anche rasoterra. Vince chi arriva prima a **5 gol**.
- Passaggi, rimbalzi a terra e rimbalzi sulle pareti sono consentiti; niente falli laterali.
- Dopo un gol riparte da centrocampo la squadra che lo ha subito. I portieri possono prendere e rilanciare senza fermare la partita.
- Compagni e avversari alternano pressione, copertura, smarcamento, passaggio e tiro. Un anello identifica il rosso controllato; un triangolo indica il destinatario del passaggio.

Rossi: **Marco, Simone, David** (portiere). Blu: **Brad, Matt, Alex** (portiere). Sprite e animazioni provengono da [footballgame](https://github.com/der1988/footballgame); le porte laterali sono geometria 3D coerente con le collisioni.

## Comandi

All’avvio scegli PC o Smartphone.

| PC | Azione |
| --- | --- |
| Frecce | Movimento e direzione del passaggio |
| A tenuto e rilasciato | Tiro; carica ideale all’80%, ↑/↓ per orientarlo |
| S | Passaggio corto al compagno indicato |
| D tenuto e rilasciato | Passaggio alto caricato |
| Q | Cambia il rosso controllato |
| Spazio | Salto |
| R | Nuova partita |
| H | Mostra/nascondi comandi |
| Rotellina | Zoom |

Su smartphone: analogico a sinistra, A/S/D/Q a destra e selezione automatica del difensore. Il gioco richiede l’orientamento orizzontale; fullscreen e blocco dell’orientamento dipendono dal browser. I tocchi simultanei restano supportati.

## Sviluppo e verifiche

Godot **4.6.3 Standard / Compatibility**, scena `scenes/football/main.tscn`. Moduli attivi: `scripts/football/team_match.gd`, `team_rules.gd`, `team_ai.gd`; fisica e sprite riutilizzati dai moduli del calcio esistenti.

```sh
godot --headless --editor --import --path . --quit
godot --headless --fixed-fps 60 --path . --script tests/team_match_test.gd
./tools/export_web.sh
```

L’export completo usa i template Web 4.6.3. Se assenti, lo script rigenera il pacchetto dati riutilizzando il runtime Web 4.6.3 versionato e aggiorna le dimensioni nel loader. Vercel serve `web/`; committare anche l’export. Anteprime in `screenshots/football-20/`.

Il precedente Undici rimane in `scenes/football/eleven.tscn` con i test storici del calcio; Father & Son in `scenes/main.tscn`. Non sono caricati nel nuovo avvio. Provenienza degli asset in `assets/football/README.md`.

Limiti attuali: partita locale contro IA, nessun multiplayer, fallo, fuorigioco o cronometro. Portieri automatici. Se il pallone supera in modo anomalo la recinzione, viene ripristinata la disposizione senza modificare il punteggio.
