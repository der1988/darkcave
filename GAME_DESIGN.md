# Campo Libero · 3 contro 3

Partita locale contro IA, su campetto d’asfalto all’aperto. Sei giocatori: rossi Marco e Simone con David in porta; blu Brad e Matt con Alex in porta. Tutti indossano il colore della propria squadra, inclusi i portieri. Sprite e animazioni originali conservati, GDScript/Godot 4.6.3 Compatibility/Web.

## Campo e regole

Campo di 24 × 14 m orientato orizzontalmente sullo schermo, porte a sinistra e a destra larghe 4.8 m e alte 2.44 m. Linee consumate, centrocampo e aree sull’asfalto. Porte 3D con pali, traversa e reti fisiche. La sponda esterna si trova oltre le linee dipinte, a ±13.4 m longitudinalmente e ±8.2 m trasversalmente; muretto e recinzione contengono la palla. Si può giocare anche nello spazio fra linea e sponda. Nessun fallo laterale.

Ogni gol vale uno, rasoterra oppure al volo. Vince la prima squadra a 5. Il pallone deve oltrepassare interamente la linea, fra i pali e sotto la traversa; controllo continuo del segmento percorso evita di saltare la linea ad alta velocità. Nessuna eliminazione o punteggio personale. Dopo il gol, breve pausa e calcio d’inizio alla squadra che lo ha subito. I portieri parano, trattengono e rilanciano senza interrompere l’azione.

Rimbalzi sul pavimento e sulle pareti restano in gioco. Solo un’uscita anomala oltre tutta la recinzione o sotto il terreno attiva il ripristino di sicurezza. Non ci sono fuorigioco, falli, tempo limite o multiplayer.

## Controllo e squadre

Il giocatore controlla un rosso alla volta, identificato dall’anello a terra. Q cambia il rosso controllato; su smartphone è presente il pulsante Q. Passando al compagno, il controllo passa al ricevente quando la palla è raggiungibile. In difesa viene selezionato automaticamente il rosso significativamente più vicino, con un intervallo per evitare continui cambi. Le frecce e l’analogico selezionano il destinatario: triangolo giallo sul compagno, condiviso da S e D. Nessun passaggio assistito seleziona avversari.

IA di entrambe le squadre: il più vicino pressa/intercetta, l’altro copre il centro e la strada verso la propria porta. In possesso si avanza, si cerca un appoggio se pressati e si tira dalla distanza utile verso un angolo libero. Il compagno offre larghezza e una linea diagonale. Movimenti fisici, accelerazioni graduali e separazione; posizioni ripristinate solo alle ripartenze. I due portieri difendono la propria porta con predizione, tuffi, presa e rilancio al compagno. L’IA non legge le frecce del giocatore per mirare i propri tiri.

## Comandi

Frecce: movimento, senza scatto. A: tiro caricato anche da terra; ↑/↓ durante il tiro orientano la mira attraverso la porta. S: passaggio corto. D: passaggio alto caricato quando si ha la palla, scivolata immediata senza palla. Spazio: salto. Q: cambia rosso. H: comandi. R: nuova partita. Rotellina: zoom. Smartphone: analogico e A/S/D/Q, landscape fullscreen quando consentito dal browser, pausa in verticale.

La camera mantiene la proiezione isometrica e una vista dell’intero campetto. I sei personaggi sono più piccoli del 15%, con ancoraggio dei piedi e collisioni ridimensionati; campo e distanza della camera restano invariati. Il tiro conserva la dinamica di footballgame, carica ottimale all’80%, sovraccarica meno potente e più alta.

## Moduli e storico

Scena attiva `scenes/football/main.tscn`; regia in `team_match.gd`, IA in `team_ai.gd`, regole in `team_rules.gd`. Input, cariche, passaggi, sprite e fisica vengono riutilizzati dai moduli precedenti. Il vecchio Undici è conservato in `scenes/football/eleven.tscn`, con le sue suite di regressione; Father & Son resta storico. Nessuno dei due viene caricato all’avvio.

## Contrasti e animazioni

`street_player.gd` estende il movimento esistente soltanto per il 3v3. Scivolata di 0.5 s, recupero di 0.18 s e intervallo di 1.6 s prima del contrasto successivo. La direzione si sceglie alla pressione di D; il rilascio non lancia un passaggio. Il movimento usa sempre `move_and_slide`, postura bassa e collisioni native. Contatto sulla palla basso: deviazione fisica; contatto con un avversario: caduta di 0.75 s, recupero e 0.6 s di corsa sbilanciata. Protezione temporanea impedisce di far ricadere continuamente chi si sta rialzando. Nessun contrasto su compagni, portieri, attraverso le pareti o in salto.

Durante scivolata, caduta e rialzata non si può saltare o giocare la palla. I giocatori a terra non sono selezionabili con Q o come destinatari assistiti. Le pose sono quelle originali: una scivolata, due pose di caduta e quattro di corsa sbilanciata per ciascuna delle otto direzioni. La rialzata breve riutilizza la prima posa di caduta in senso inverso: non esiste una sequenza originale dedicata. Le 96 pose precedenti restano identiche; il timing del colpo di testa è sincronizzato alla sequenza sorgente.
