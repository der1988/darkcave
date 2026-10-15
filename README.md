# Father & Son · prototipo 0.6

Una strada provinciale, un distributore abbandonato, un padre e suo figlio di otto anni. Recupera la bottiglia d'acqua nello scaffale del negozio e raggiungi l'uscita segnalata a nord-est insieme al bambino, evitando il pattugliatore.

## Browser / Vercel

La cartella `web/` contiene l’esportazione giocabile Godot 4.6.3, pubblicata come sito statico da `vercel.json`. Il push sul ramo di produzione collegato a Vercel avvia il deploy. Non serve installare Godot per giocare: apri il sito da un browser desktop con WebGL 2 e fai clic sul gioco per dare il focus alla tastiera.

Per aggiornare la versione browser dopo modifiche al gioco, installa Godot **4.6.3** con i relativi export template e lancia:

```sh
./tools/export_web.sh
```

Includi nel commit anche i file aggiornati in `web/`. Vercel distribuisce questi file già esportati; non compila il progetto Godot. L’esportazione usa un solo thread e non richiede header di isolamento cross-origin. Se il progetto Vercel conserva impostazioni della vecchia app, usa la radice della repository come Root Directory; framework, comando di build e directory di output sono definiti in `vercel.json`.

## Avvio su Mac

1. Installa **Godot 4.6 stabile, edizione Standard** da godotengine.org. Non serve .NET.
2. Nel Project Manager scegli **Importa**, seleziona `project.godot` in questa cartella e aprilo. Attendi l'importazione degli sprite.
3. Premi **F5** per giocare. Per F6 apri prima `scenes/main.tscn`. Su alcune tastiere Mac occorre tenere premuto **Fn**.

Non occorrono npm, compilatori nativi o download di asset. Navmesh e scene sono già incluse. Il progetto usa Compatibility e può essere aperto anche su Windows. Le esportazioni native richiedono i template di Godot e non sono state verificate qui.

## Comandi

| Tasto | Azione |
| --- | --- |
| WASD | Movimento in otto direzioni, relativo alla visuale |
| Shift | Corsa |
| Ctrl | Accovacciamento; il figlio si abbassa insieme al padre |
| E | Raccogli la risorsa da vicino |
| Q | Il figlio aspetta / riprende a seguire |
| F | Prendi / lascia la mano, quando siete vicini |
| Rotellina | Zoom entro i limiti |
| H | Mostra / nascondi i comandi (visibili inizialmente per 7 secondi) |
| R | Ricomincia dopo vittoria o fallimento |

La corsa può lasciare indietro il bambino. Prendergli la mano limita la velocità del padre. Le coperture funzionano tramite collisioni e linea di vista: essere accovacciati allo scoperto non protegge dal nemico. L'uscita richiede acqua ed entrambi i personaggi.

Sotto minaccia il figlio si accovaccia, cerca un riparo vicino o si ferma se non trova un tragitto sicuro. Lo stato compare nell’HUD. Q e F conservano il comando richiesto, ma non forzano un’uscita dal riparo; la ripresa richiede due secondi senza minaccia e senza un tratto sorvegliato nel percorso immediato. Il contatto mano nella mano resta sospeso durante il pericolo: se il padre si allontana, il bambino si ricongiunge in FOLLOW quando può. Una copertura non garantisce salvezza se il nemico la aggira.

Il nemico ricorda soltanto l’ultima posizione osservata: quando perde la vista la investiga, cerca brevemente nei dintorni e torna alla pattuglia. Le coperture e i percorsi alternativi possono interrompere davvero l’inseguimento.

I passi reali emettono rumori discreti: camminare ha portata contenuta, correre si sente più lontano e accovacciarsi è quasi silenzioso. Il nemico investiga il punto udito senza conoscere gli spostamenti successivi della sorgente; i muri attenuano il rumore. Nel negozio, E può far cadere una lattina dal bancone una sola volta per partita: è una distrazione facoltativa e non sostituisce la raccolta dell’acqua. Il suggerimento contestuale indica l’interazione più vicina. Il primo clic/tasto abilita l’audio nel browser; il volume o il mute non influenzano lo stealth.

## Scene e verifiche

`scenes/main.tscn` collega il livello, gli attori, la camera e l'HUD. Il livello si modifica direttamente nell'editor in `scenes/environment/station.tscn`; i comportamenti sono separati in `scripts/`. La mappa completa è in AGENTS.md.

Con Godot nel PATH:

```sh
godot --headless --path . --editor --import --quit
godot --headless --fixed-fps 60 --path . --script tests/prototype_test.gd
godot --headless --fixed-fps 60 --path . --script tests/stealth_route_test.gd
godot --headless --fixed-fps 60 --path . --script tests/child_follow_test.gd
godot --headless --fixed-fps 60 --path . --script tests/hand_coordination_test.gd
godot --headless --fixed-fps 60 --path . --script tests/child_danger_test.gd
godot --headless --fixed-fps 60 --path . --script tests/enemy_memory_test.gd
godot --headless --fixed-fps 60 --path . --script tests/presentation_test.gd
godot --headless --fixed-fps 60 --path . --script tests/noise_test.gd
```

I test usano movimento fisico e navigazione reali. La prima suite verifica anche vista/coperture, vittoria, fallimento e riavvio; la seconda completa una partita con il nemico attivo. Per rigenerare la navmesh dopo aver modificato gli ostacoli:

```sh
godot --headless --path . --script tools/bake_navigation.gd
```

`tests/render_smoke.gd` richiede un display grafico e salva schermate in `user://` (o nella cartella indicata da `FATHER_SON_SCREENSHOT_DIR`). Non eseguirlo con rendering headless/dummy.

Verificato su Linux con Godot **4.6.3**: importazione, 178 controlli e rendering Compatibility. macOS e Windows non sono stati eseguiti in questo ambiente.

La precedente versione è preservata nel ramo Git locale `backup/liminal-before-father-and-son-2026-10-15`. Nessun push è stato eseguito per questa sostituzione.
