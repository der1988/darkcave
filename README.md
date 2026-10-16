# Campo Libero · calcio isometrico 0.3

Un piccolo giocatore e un pallone su un campo verde senza confini. Prima prova arcade ispirata a Soccer Kid, con sprite e animazioni originali del progetto [footballgame](https://github.com/der1988/footballgame), in vista isometrica.

## Giocare nel browser

web/ contiene l’export Godot pronto per Vercel. Il push su main attiva il deploy del progetto collegato. Apri il sito da un browser desktop con WebGL 2 e fai clic sul campo per dare il focus alla tastiera.

| Comando | Azione |
| --- | --- |
| Frecce | Muovi in otto direzioni rispetto allo schermo |
| Shift | Scatta |
| A tenuto e rilasciato | Carica e tira nella direzione del giocatore |
| D tenuto e rilasciato | Passaggio alto: breve/arcuato oppure lungo/teso |
| S | Passaggio corto al compagno |
| Spazio | Salta |
| R | Richiama la palla ai piedi |
| H | Mostra / nascondi i comandi |
| Rotellina | Zoom |

Avvicinati alla palla per controllarla; una palla veloce o alta resta libera. Il tiro funziona solo da vicino. Il controllo usa velocità e collisioni reali: la palla non è attaccata al personaggio. R è il solo riposizionamento esplicito di prova.

## Sviluppo

Apri project.godot con Godot **4.6.3 Standard / Compatibility**, poi F5. La scena di avvio è scenes/football/main.tscn; script separati in scripts/football/. Non servono npm o nuove librerie.

```sh
godot --headless --editor --import --path . --quit
godot --headless --fixed-fps 60 --path . --script tests/football_test.gd
./tools/export_web.sh
```

L’export richiede i template Web della stessa versione. Committare anche i file aggiornati in web/: Vercel distribuisce l’esportazione statica, senza compilare Godot.

## Asset e anteprime

Provenienza e conversione dei frame: assets/football/README.md. Originali editabili in art/football/, esclusi dall’export. Le immagini non sono ridisegnate: vengono estratti i frame originali e risolta la loro palette indicizzata.

Screenshot e video del gioco in screenshots/football/. Il piano fisico è infinito; la superficie verde segue il giocatore con coordinate della trama fisse nel mondo.

La precedente scena Father & Son e i suoi test sono conservati nello storico del progetto e in scenes/main.tscn; non vengono istanziati dal nuovo avvio. Per riprodurre una sua suite usare, ad esempio, godot --headless --fixed-fps 60 --path . --script tests/prototype_test.gd.

Il terreno è volutamente semplice: verde uniforme, pochi segni pixel art, ciuffi e sassi radi. Il giocatore è circa il 25% più grande rispetto alla prima prova; la corsa con Shift raggiunge 10 unità/s, la camminata 4.5.

Carica A anche durante il pallonetto, avvicinati o salta con S e rilascia per colpire al volo una palla raggiungibile. Anteprime aggiornate in screenshots/football-08/.

Camera ravvicinata: zoom iniziale 18 (prima 34), regolabile fra 12 e 34 con la rotellina.

Camera invariata; sprite ridotto del 25% rispetto alla versione precedente. D carica fino a 0.85 secondi: più a lungo tieni premuto, più alto sarà il pallonetto al rilascio.

Velocità aumentata del 25% sia camminando sia correndo. Il tiro A ha potenza 4.5–14, traiettoria bassa e resistenza dell’aria proporzionale al quadrato della velocità; il tiro al volo viene diretto leggermente verso il suolo.

Tiri A più forti: oltre il 55% di carica la palla inizia ad alzarsi progressivamente. Ombre di contatto più leggibili sotto giocatore e pallone. I passi lasciano tracce che svaniscono entro sei secondi. Due alberi davanti al punto iniziale delimitano una porta libera, senza punteggio automatico.

Dinamica tiro ora portata da footballgame: con A la potenza ideale è all’80%; oltre si perde forza e la palla sale di più. Mira assistita verso lo spazio fra gli alberi; le frecce durante la carica regolano lato e altezza del tiro. Valori originali convertiti da pixel a metri: forza base 45, neutralizzazione dell’inerzia al calcio, bonus/malus dei tiri dopo rimbalzo. Restano pallonetto caricato D e tiro al volo. Anteprime aggiornate in screenshots/football-09/.

Inquadratura attuale fissa (non insegue il giocatore), 4% più larga: size 18.72. Porta spostata nella parte alta e portiere reattivo fra gli alberi, con collisioni e respinte. Camminata 4.68 e corsa 10.4 unità/s (+4%). Anteprime in screenshots/football-10/.

Il portiere usa ora gli sprite originali `goalkeeper` di footballgame: 240 frame e tempi originali. Reazione di 150 ms, tuffi bassi/alti fino a 6 m/s, salto su palloni alti centrali, recupero di 0.75 s, uscita bassa su palla contesa, presa delle palle lente e rilancio a mano. Gli alberi sono alti il 12% in più. Anteprime aggiornate in screenshots/football-11/.

Due giocatori di movimento: S passa basso al compagno e alla ricezione il controllo passa a lui. D al tocco fa un passaggio alto corto e arcuato; tenuto fa un passaggio alto più lungo e teso. Spazio conserva il salto. A mantiene il tiro di footballgame, con finestra di anticipo di 0.22 s per una volée vicina; nessun tiro remoto. Anteprime attuali in screenshots/football-12/.
