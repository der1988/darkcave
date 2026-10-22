# Campo Libero · 4 contro 4

Partita di calcio su un campetto d’asfalto consumato, con porte **a sinistra e a destra** e sponde esterne giocabili. Squadra **rossa** contro **blu**, quattro giocatori ciascuna: tre di movimento e un portiere.

- Controlli i rossi; i compagni, gli avversari e i portieri usano l’IA.
- Tutti i gol valgono uno, anche rasoterra. Vince chi arriva prima a **5 gol**.
- Passaggi, rimbalzi a terra e rimbalzi sulle pareti sono consentiti; niente falli laterali.
- Dopo un gol riparte da centrocampo la squadra che lo ha subito. I portieri possono prendere e rilanciare senza fermare la partita.
- Compagni e avversari alternano pressione, copertura, smarcamento, passaggio e tiro. Un anello identifica il rosso controllato; un triangolo indica il destinatario del passaggio.

Rossi: **Marco, Simone, Luca, David** (portiere). Blu: **Brad, Matt, Leo, Alex** (portiere). Sprite e animazioni provengono da [footballgame](https://github.com/der1988/footballgame); le porte laterali sono geometria 3D coerente con le collisioni.

## Comandi

All’avvio scegli PC o Smartphone.

| PC | Azione |
| --- | --- |
| Frecce | Movimento e direzione del passaggio |
| A tenuto e rilasciato | Tiro; carica ideale all’80%, ↑/↓ per orientarlo |
| S | Passaggio corto al compagno indicato |
| D | Con la palla: passaggio alto caricato. Senza palla: scivolata nella direzione indicata |
| Q | Cambia il rosso controllato |
| Spazio | Salto |
| R | Nuova partita |
| H | Mostra/nascondi comandi |
| Rotellina | Zoom |

Su smartphone: analogico a sinistra, A/S/D/Q a destra e selezione automatica del difensore. Il gioco richiede l’orientamento orizzontale; fullscreen e blocco dell’orientamento dipendono dal browser. I tocchi simultanei restano supportati. D usa lo stesso comportamento contestuale anche su smartphone.

Gli otto personaggi sono ridotti del 15% con collisioni proporzionate, a camera e campo invariati. Scivolate, cadute e corsa sbilanciata usano 56 pose originali aggiuntive di footballgame; il colpo di testa usa il timing originale. Un contrasto può far cadere l’avversario e deviare la palla; breve recupero e intervallo fra scivolate evitano concatenazioni continue. Anche l’IA può scivolare.

## Sviluppo e verifiche

Godot **4.6.3 Standard / Compatibility**, scena `scenes/football/main.tscn`. Moduli attivi: `scripts/football/team_match.gd`, `team_rules.gd`, `team_ai.gd`; fisica e sprite riutilizzati dai moduli del calcio esistenti.

```sh
godot --headless --editor --import --path . --quit
godot --headless --fixed-fps 60 --path . --script tests/team_match_test.gd
godot --headless --fixed-fps 60 --path . --script tests/player_actions_test.gd
godot --headless --fixed-fps 60 --path . --script tests/four_player_audio_test.gd
./tools/export_web.sh
```

L’export completo usa i template Web 4.6.3. Se assenti, lo script rigenera il pacchetto dati riutilizzando il runtime Web 4.6.3 versionato e aggiorna le dimensioni nel loader. Vercel serve `web/`; committare anche l’export. Anteprime in `screenshots/football-22/`.

Il precedente Undici rimane in `scenes/football/eleven.tscn` con i test storici del calcio; Father & Son in `scenes/main.tscn`. Non sono caricati nel nuovo avvio. Provenienza degli asset in `assets/football/README.md`.

Limiti attuali: partita locale contro IA, nessun multiplayer, fallo, fuorigioco o cronometro. Portieri automatici. Se il pallone supera in modo anomalo la recinzione, viene ripristinata la disposizione senza modificare il punteggio.

I blu hanno un profilo più tranquillo: velocità massima al 78% di quella dei rossi, pressione ritardata, scivolate soltanto da vicino dopo osservazione e almeno 4.5 s fra i tentativi. Le due ali mantengono corsie separate.

Effetti sonori discreti per tiro, passaggio, rimbalzo a terra e impatti sulle sponde/pali. Suoni PCM sintetizzati localmente, senza download o musica, abilitati alla scelta PC/Smartphone; soglie e intervalli evitano rumore continuo durante i piccoli contatti.
