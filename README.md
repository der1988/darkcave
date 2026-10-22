# Campo Libero · Undici

Campetto d’asfalto all’aperto, consumato, in pixel art isometrica. Cinque partecipanti **Marco, Simone, Brad, Matt e David** partono con **11 punti**; David è inizialmente il portiere. Maglie rispettivamente rossa, blu, gialla, verde e viola, conservate ai cambi di ruolo. Pali e rete e sprite dei personaggi provengono da [footballgame](https://github.com/der1988/footballgame).

## Regole giocabili

- S o D avviano il servizio. I passaggi possono rimbalzare, essere recuperati e ripartire anche da terra; le conclusioni valide restano al volo.
- Gol di piede: il portiere perde **1** punto. Testa: **3**. Tacco o rovesciata: **5**.
- Se la palla esce dal campo, l’ultimo giocatore che l’ha toccata va in porta. I rimbalzi durante i passaggi non sono un errore. I punti seguono la persona, non il ruolo.
- Il tiro deve partire al volo; un rimbalzo successivo alla conclusione non annulla il tiro. Un tiro fermo e non riuscito chiude l’azione.
- A zero punti si viene eliminati. Dopo l’eliminazione del portiere, il marcatore prende il suo posto. Nel duello finale è possibile alzarsi il pallone per concludere. L’ultimo superstite vince.
- Cambio di ruoli e riposizionamento avvengono solo a palla morta. R o il pulsante **Nuova partita** permettono di ripartire dopo la vittoria.

Il tipo di contatto è automatico: altezza per piede/testa/petto; orientamento rispetto alla porta per il tacco; contatto alto all’indietro in salto per la rovesciata. La testa usa le animazioni originali; petto, tacco e rovesciata riutilizzano le pose disponibili e richiedono ulteriore rifinitura visiva.

## Controlli

All’avvio scegli PC o Smartphone. Su smartphone viene richiesto fullscreen landscape; se il browser non permette il blocco dell’orientamento, ruota manualmente il dispositivo.

| PC | Azione |
| --- | --- |
| Frecce | Movimento, senza scatto |
| A tenuto e rilasciato | Tiro; carica ideale all’80% |
| S | Passaggio corto aereo |
| D tenuto e rilasciato | Passaggio alto: breve/arcuato o lungo/teso |
| Spazio | Salto |
| R | Nuovo servizio; interrompere un’azione attiva conta come errore |
| H | Comandi |
| Rotellina | Zoom |

Su smartphone: analogico sinistro progressivo e A/S/D a destra, anche con più dita. Il controllo passa al ricevente in aria oppure alla ricezione a terra. Un piccolo triangolo sopra un compagno mostra il destinatario: frecce e analogico lo cambiano secondo la direzione, senza input vale l’orientamento del giocatore. S e D usano lo stesso indicatore. I compagni si smarcano con accelerazioni graduali, brevi pause e separazione.

## Sviluppo e verifiche

Godot **4.6.3 Standard / Compatibility**, scena `scenes/football/main.tscn`, moduli in `scripts/football/`. Nessuna libreria aggiuntiva.

```sh
godot --headless --editor --import --path . --quit
godot --headless --fixed-fps 60 --path . --script tests/football_test.gd
godot --headless --fixed-fps 60 --path . --script tests/control_mode_test.gd
godot --headless --fixed-fps 60 --path . --script tests/eleven_test.gd
godot --headless --fixed-fps 60 --path . --script tests/passing_test.gd
./tools/export_web.sh
```

L’export completo usa i template Web 4.6.3. Se assenti, lo script rigenera il pacchetto dati e riutilizza il runtime Web 4.6.3 già versionato, aggiornando le dimensioni nel loader. Vercel serve `web/`; committare anche l’export.

Provenienza e conversione degli asset in `assets/football/README.md`; porta importabile con `tools/import_goal_art.gd -- --source=/path/to/footballgame`. Anteprime attuali in `screenshots/football-19/`.

Il precedente Father & Son è conservato in `scenes/main.tscn` e nei test storici, senza essere caricato dal nuovo avvio.
