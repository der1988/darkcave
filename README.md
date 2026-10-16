# Campo Libero · calcio isometrico 0.3

Un piccolo giocatore e un pallone su un campo verde senza confini. Prima prova arcade ispirata a Soccer Kid, con sprite e animazioni originali del progetto [footballgame](https://github.com/der1988/footballgame), in vista isometrica.

## Giocare nel browser

web/ contiene l’export Godot pronto per Vercel. Il push su main attiva il deploy del progetto collegato. Apri il sito da un browser desktop con WebGL 2 e fai clic sul campo per dare il focus alla tastiera.

| Comando | Azione |
| --- | --- |
| Frecce | Muovi in otto direzioni rispetto allo schermo |
| Shift | Scatta |
| A tenuto e rilasciato | Carica e tira nella direzione del giocatore |
| D | Pallonetto corto |
| S | Salta |
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

Il terreno è volutamente semplice: verde uniforme, pochi segni pixel art, ciuffi e sassi radi. Il giocatore è circa il 25% più grande rispetto alla prima prova; la corsa con Shift raggiunge 8 unità/s (prima 6), la camminata resta a 3.6.

Carica A anche durante il pallonetto, avvicinati o salta con S e rilascia per colpire al volo una palla raggiungibile. Anteprime aggiornate in screenshots/football-04/.
