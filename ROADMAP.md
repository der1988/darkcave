# Roadmap · Campo Libero

## Smarcamenti e obiettivo gol al volo

- Modulo di supporto dedicato: compagno senza palla alterna piccole corse di smarcamento vicino al portatore, senza rimanere fermo in attesa di un passaggio. Scelta del lato coerente e spazio davanti alla porta; accelerazione/collisioni esistenti. Sprite rivolto alla palla anche durante il movimento.
- Sui passaggi alti il controllo passa al ricevente quando il pallone è vicino e ancora in aria, per preparare il tiro senza attendere il controllo a terra. Carica A mantenuta durante il cambio.
- Volée più accessibile: portata 1.8 e altezza relativa 2.3, anticipo massimo 0.38 s. Tiro eseguito soltanto al contatto utile; mezzo-volo ammesso entro 0.15 s dal rimbalzo. Nessuna attrazione o teletrasporto della palla.
- Obiettivo visibile: segnare al volo. Rilevamento continuo dell’attraversamento della linea fra gli alberi, altezza limite 2.44 m, margine del pallone ai pali, conteggio univoco per tiro. Tiri rasoterra e palloni fuori altezza non contano; la presa del portiere interrompe la qualifica di volée.
- 125/125 test del calcio superati: movimento/facing del compagno, separazione e passi fisici, controllo anticipato in ricezione, margini volée, gol valido, doppio conteggio rifiutato, tiro rasoterra e alto non validi, oltre alle verifiche esistenti. Anteprime in screenshots/football-13/. Export Web completato; avvio, passaggi, salto, tiro e H verificati in Chromium/WebGL senza errori o scroll. Deploy Vercel remoto non verificato.
- Limiti: smarcamento semplice di un singolo compagno, nessuna tattica di squadra o rete fisica aggiunta. La camera resta fissa.

## Compagno, passaggi e volée

- Aggiunto un secondo calciatore, stesso sprite/scala e collisioni reciproche. Un solo controllato alla volta: passaggio e ricezione trasferiscono il controllo al compagno senza riposizionare attori o palla.
- S ora esegue il passaggio basso verso il compagno, senza carica. Salto spostato su Spazio; help e input centralizzati aggiornati.
- D caricato esegue un passaggio alto: tap con velocità 3 orizzontale/8 verticale; carica piena 10.5/6, quindi più lungo e meno arcuato ma sempre alto. Ricevente verso la zona di atterraggio, poi verso la palla per controllarla dopo il rimbalzo.
- Tiro al volo A più permissivo: portata 1.45, altezza relativa 1.9 e anticipo massimo 0.22 s. Il calcio avviene soltanto quando il pallone entra davvero a portata; dribbling resta a terra. Buffer annullato su nuova carica o passaggio, focus perso, richiamo o cambio controllato.
- 117/117 test del calcio superati, inclusi passaggio basso, controllo al ricevente, variante alta corta/lunga e ricezione, buffer volée e rifiuto del tiro remoto. Anteprime in screenshots/football-12/. Export Web riuscito, comandi A/S/D/Spazio e H verificati in Chromium/WebGL senza errori o scroll. Deploy Vercel remoto non verificato.
- Limiti: singolo compagno, ricezione automatica e movimento di supporto solo sul passaggio; niente selezione manuale, squadre complete o tattiche aggiunte.

## Portiere originale: sprite, tuffi e recupero

- Importati tutti i 240 frame originali `goalkeeper_*`, senza ridisegno/ricampionamento; manifest con sequenze e timing originali. Importer riproducibile e animazione in modulo separato. Collegati fermo, corsa in otto direzioni, tuffi bassi/alti, salto, uscita bassa, presa e rilancio a mano; eliminati sprite/tinta del calciatore sostitutivo.
- Consultati `ai_goalie.c`, `gfx_goalie.c` e funzioni goalie di `entity_player.c` in footballgame. Adattati stati di protezione, tuffo fisico, salto, smother, recupero, presa e rilancio: reazione 0.15 s, soglia tiro 15 m/s, velocità tuffo 6 m/s, recupero 0.75 s, selezione lato/altezza dalla traiettoria prevista. Le palle direttamente sul corpo non richiedono un tuffo laterale.
- Collisioni native e postura bassa nei tuffi rasoterra; niente spostamenti istantanei. Prese delle palle lente con un solo proprietario e stessa istanza del pallone; rilancio originale a mano. R interrompe in sicurezza una presa. Respinte dipendenti dal punto d’impatto. Uscita bassa su palla lenta contesa entro 2.5 m solo con percorso libero.
- Alberi +12% in altezza, porta e camera conservate.
- 105/105 test del calcio superati: asset originali, reazione, tuffi bassi/alti, sequenze, salto, recupero, movimento senza teletrasporti, possesso/rilancio/R e smother, oltre alle verifiche precedenti. Screenshot in screenshots/football-11/, inclusi tuffo basso e alto. Import ed export Web riusciti, manifest delle animazioni incluso esplicitamente nel pacchetto; prova Chromium/WebGL senza errori. Deploy Vercel remoto non verificato.
- Limiti: adattamento della logica alla porta fra alberi e fisica Godot; non importati squadre, intera area di rigore, retropassaggi e decisioni tattiche del simulatore. Le palle veloci vengono respinte; presa sulle lente, senza casualità della presa intermedia della fonte.

## Camera fissa, porta in alto e portiere

- Camera non insegue più il giocatore. Dimensione ortografica 18→18.72 (+4%), orientamento isometrico e zoom manuale conservati. Porta spostata verso l’alto della visuale, centro (-4,-4).
- Camminata 4.5→4.68 e corsa 10→10.4 (+4%); sprite, salto e dinamica del tiro conservati.
- Portiere in modulo e scena separati, stessi sprite e proporzioni con tinta distinta. Anticipa il punto di attraversamento della palla, si muove lateralmente fra i tronchi senza teletrasporti e respinge palloni entro altezza/portata fisiche. Collisioni abilitate con palla e giocatore.
- 89/89 test del calcio superati: camera resta fissa, nuove velocità, movimento laterale limitato, respinta e rifiuto di palloni troppo alti, oltre alle verifiche esistenti. Anteprime in screenshots/football-10/. Export Web completato; avvio e comandi verificati in Chromium/WebGL senza errori. Deploy Vercel remoto non verificato.
- Limiti: portiere semplice senza tuffi, prese o animazioni nuove; nessun contatore gol. La camera fissa non ricentra un giocatore che esce dalla visuale.

## Dinamica del tiro da footballgame

- Consultati `entity_player.c:1463`, `entity_ball.c:308`, `physics.c`, `game_play.c` e `math_ext_utils.c` nella fonte fdafcb36efea568e2003e3ae089a56b3da8daaa2.
- Portate in `scripts/football/shot_model.gd` le formule: carica ideale 80%; sovraccarica con perdita di forza e aumento altezza; split-lerp; mira assistita al centro della porta con regolazione lato/altezza tramite frecce; limite di svolta 100° per i tiri in movimento. Precisione variabile come nella fonte.
- Forza base originale 45 m/s, inerzia precedente azzerata al calcio; bonus 5% palla in discesa, 10% subito dopo un rimbalzo e malus 20% su contatto tardivo. Raggio e soglia virtuale della fonte convertiti da 10 pixel/metro.
- Resistenza quadratica dell’aria 0.013366, resistenza di rotolamento 4.905 con dipendenza dalla velocità, restituzione 0.5 e velocità massima 61; rimosso smorzamento lineare aggiuntivo e attrito nativo che si sommavano alle resistenze. Pallonetto D personalizzato conservato.
- 84/84 test del calcio superati, inclusi valori numerici di riferimento, carica 0/80/100%, mira, limite angolare, volée e rimbalzi, oltre alle regressioni del prototipo. Anteprime in screenshots/football-09/. Export Web riuscito; verifica Chromium/WebGL senza errori, comandi e H funzionanti. Deploy Vercel remoto non verificato.
- Limiti: stessa logica del tiro e parametri convertiti; collisioni e integrazione restano native Godot, quindi traiettorie non garantite identiche fotogramma per fotogramma al motore C. Nessun aftertouch o sistema di squadre introdotto.

## Tiro sollevato, ombre, tracce e porta tra alberi

- Tiro massimo A da 11 a 14; oltre 55% della carica aumenta gradualmente l’alzata, fino a una traiettoria chiaramente staccata da terra. Restano tap basso, volée e pallonetto D.
- Ombre di contatto più marcate sotto giocatore e pallone, sempre sul terreno anche durante salti e lanci.
- Modulo separato per tracce dei passi: impronte alternate, dissolvenza entro 6 secondi, pool fisso di 128 segni. Nessuna traccia da fermo, in salto o durante riposizionamenti di prova.
- Due alberi in scala davanti al punto iniziale delimitano la porta. Collisioni sui tronchi, spazio centrale libero; chiome decorative e ombre al suolo. Nessun sistema di punteggio aggiunto.
- 73/73 test del calcio superati: traiettoria del tiro forte, creazione e scomparsa tracce, collisioni alberi e apertura libera, oltre alle verifiche esistenti. Anteprime in screenshots/football-08/. Export Web completato; prova Chromium/WebGL senza errori, comandi e H funzionanti. Deploy Vercel remoto non verificato.

## Movimento +25% e tiro meno potente

- Camminata 3.6→4.5 e corsa 8→10 unità/s, entrambe +25%. Sprite, camera e salto invariati. Risposta del dribbling più pronta e velocità di correzione limitata per conservare la palla durante inversioni alla nuova velocità.
- Consultati `footballgame/src/entity_ball.c` e `physics.c`: tiro con direzione normalizzata e potenza 4.5–11, invece di 5–15; alzata bassa e volée leggermente verso il suolo. Aggiunta resistenza quadratica dell’aria e resistenza di rotolamento uniforme in tutte le direzioni. Pallonetto caricato D conservato.
- 67/67 test del calcio superati: nuove velocità, inversioni, potenza ridotta, rallentamento e distanza del tiro, carica pallonetto, salto e volée. Export Web riuscito e verifica visiva nativa; screenshot in screenshots/football-07/. Avvio e comandi verificati in Chromium/WebGL senza errori. Deploy Vercel remoto non verificato.

## Giocatore ridotto e pallonetto caricato

- Camera iniziale mantenuta a 18, intervallo 12–34 invariato. Sprite ridotto esattamente del 25% rispetto alla versione precedente, con ancoraggio dei piedi corretto. Fisica e velocità conservate.
- D ora carica il pallonetto e il rilascio lo esegue: durata massima 0.85 s, spinta verticale da 5 a 10. Velocità orizzontale fissa a 3.16: la carica regola l’altezza, pur aumentando naturalmente il tempo in volo. HUD distingue carica tiro/pallonetto; focus perso o R annullano la carica.
- 64/64 test del calcio superati: aggiunti attesa durante carica, limite, impulso verticale, velocità orizzontale, altezza fisica raggiunta e annullamento al cambio focus. Anteprime native e Web in screenshots/football-06/. Export Web completato; avvio, comandi e carica/rilascio di D verificati in Chromium senza errori. Deploy Vercel remoto non verificato.

## Inquadratura ravvicinata

- Zoom iniziale ortografico da 34 a 18: personaggio circa 1.9 volte più grande sullo schermo, senza cambiare sprite, fisica o velocità. Conservati orientamento isometrico e inseguimento fluido.
- Rotellina mantenuta, nuovo intervallo 12–34 per permettere ulteriore avvicinamento e ritorno alla precedente vista ampia.
- 58/58 test del calcio superati, inclusi inquadratura, leggibilità e limiti rotellina. Export Web riuscito e verifica visiva nativa; anteprime in screenshots/football-05/.

## Calcio isometrico · campo semplificato e corsa

- Campo verde uniforme, rari segni d’erba pixel art; ciuffi ridotti da 145 a 18 e sassi da 12 a 2 per settore. Eliminate le grandi macchie di terra e le zone umide.
- Sprite del giocatore ingrandito del 25%, piedi mantenuti sul terreno; camera, asset originali e collisioni conservati. Corsa Shift da 6 a 8 unità/s (+33%), camminata invariata.
- Soglia di controllo della palla adattata alla velocità di corsa per evitare perdite involontarie nelle inversioni. Restano tiro, pallonetto, salto e tiro al volo.
- 56/56 test del calcio e 239/239 regressioni storiche, totale 295/295; verifica visiva nativa ed export Web. Anteprime in screenshots/football-04/. Deploy Vercel remoto non verificato.

## Calcio isometrico · 0.3 · pixel art e tiro al volo

- Terreno con pixel ancorati al mondo e palette discreta, sei famiglie ispirate al riferimento dell’utente: prato fitto, terra scoperta, erba bassa, vegetazione rada alta, terreno umido e tracce consumate. Ciuffi verticali più netti; mantenuti sassi, streaming e collisioni.
- Tiro al volo con la stessa carica A: portata orizzontale 1.2 e altezza relativa 0.15–1.6, controllate al rilascio. Funziona anche saltando; nessun aggancio o riposizionamento della palla. Il pallonetto e il dribbling conservano le precedenti restrizioni al suolo. Posa del calcio visibile anche in salto.
- 56/56 controlli del calcio, inclusa sequenza fisica pallonetto/carica/rincorsa/salto/tiro e rifiuto di palloni troppo alti; 239/239 regressioni storiche. Totale 295/295. Anteprime native e Web in screenshots/football-03/, inclusa posa del tiro al volo; export Web aggiornato. Avvio e comandi verificati in Chromium/WebGL senza errori, H ripristina correttamente la guida. Deploy Vercel remoto non verificato.
- Limiti: terreno ancora procedurale a palette pixel art, non un tileset dipinto; zone umide decorative e pose originali riutilizzate per il tiro al volo.

## Calcio isometrico · 0.2 · terreno e comandi

- Terreno con variazioni naturali di erba corta e zone secche, ciuffi tridimensionali di erba alta e piccoli sassi in scala. Modulo decorativo separato, deterministico e limitato a 25 settori attorno al giocatore; nessuna modifica alle collisioni della palla.
- Movimento con le frecce per evitare conflitti: A carica e rilascia il tiro, D esegue il pallonetto, S salta. Help generato dalla stessa configurazione degli input.
- Pallonetto accorciato orizzontalmente (a potenza abituale: 3.16 contro 8.5), mantenendo la spinta verticale di 6.05. Tiro rasoterra invariato.
- Salto fisico del giocatore con gravità, niente doppio salto; camera e ombra restano a terra. Durante il salto non si trascina né si calcia da remoto il pallone a terra. R richiama sempre il pallone al suolo.
- Verificati 50/50 test del calcio e 239/239 regressioni storiche, totale 289/289. Import e export Web release completati. Chromium/WebGL: avvio, movimento, carica con A, pallonetto D, salto S, richiamo R e H; nessun errore console o scroll. Screenshot nativi e Web in `screenshots/football-02/`.
- Limiti: erba alta e sassi sono decorativi; salto usa una posa originale esistente, senza nuove animazioni disegnate. Deploy Vercel remoto non verificato.

## Calcio isometrico · 0.1

- Nuova direzione richiesta dall’utente: un solo calciatore piccolo, circa 32 pixel a 1280×720, su un campo verde senza bordi. Avvio in `scenes/football/main.tscn`; la precedente scena Father & Son resta conservata ma non viene caricata. Nessuna torcia, stanza, NPC o nemico nel nuovo gioco attivo.
- Riferimento confermato: `der1988/footballgame`, commit `fdafcb36efea568e2003e3ae089a56b3da8daaa2`. Riutilizzati 48 frame originali del giocatore e 32 del pallone, otto direzioni. Palette indicizzata risolta secondo la maglia di casa, celle e maschere corporee conservate senza ricampionare; sostituita solo l’ombra piatta con contatto sul piano 3D. Sorgenti Aseprite conservati in `art/football/` e import riproducibile con `tools/import_football_art.gd`.
- Godot/Compatibility mantenuto. Moduli separati per input, giocatore, palla e coordinamento del sandbox. Movimento WASD/frecce, Shift per scattare; animazione originale ferma/corsa guidata dallo spostamento effettivo e posa breve del piede quando si calcia.
- Palla RigidBody3D nativa, massa 0.43, gravità, urti e rimbalzi. Controllo ravvicinato con velocità e punti intermedi attorno al corpo, senza agganci né teletrasporti durante il dribbling. Tiro caricato con Spazio, pallonetto con E e breve separazione dopo il calcio. R richiama esplicitamente la palla: reset applicato in `_integrate_forces` per restare affidabile anche dal browser mentre vola.
- Pavimento fisico WorldBoundaryShape3D infinito; erba visiva ricentrata e shader con coordinate mondiali continue. Testato a 5.000 unità dall’origine senza cadute o bordo del campo. Camera ortografica isometrica fluida (size iniziale 34, limiti 24–46), HUD minimo, percentuale del tiro e comandi consultabili con H dalla configurazione comune.
- 39/39 controlli nuovi: avvio, unico personaggio/assenza luci, scala e griglie originali, otto direzioni, camminata/scatto, controllo fisico della palla, inversioni improvvise, carica/rilascio, tiro a distanza rifiutato, gravità/rimbalzo, attrito, richiamo in volo, ombra a terra, H/focus e campo lontano dall’origine. Tutti i 239 controlli precedenti nuovamente superati senza modificarli: totale 278/278.
- Anteprime native in `screenshots/football/` con sequenza da 10 s alla scala effettiva. Import/export Web release riusciti; in Chromium/WebGL 2 verificati avvio, movimento con frecce, H, carica/tiro, R dopo un tiro e successivo pallonetto, senza errori né scroll della pagina. Richiamo e palla sollevata verificati anche sulle immagini del browser; indicatore di carica ASCII per evitare glifi mancanti. Export Web aggiornato per la pubblicazione GitHub autorizzata; esito del deploy Vercel remoto da verificare.
- Limiti della prima base: campo di prova libero, senza porte, squadre, punteggio o livelli; niente salto del personaggio o azioni da piattaforme ancora. Le pose di tiro sono quelle disponibili nella fonte (shoot diagonale / tackle cardinale); il pallonetto è fisico, non una nuova animazione disegnata.

## Storico · Father & Son

## 0.6B · Integrazione ZIP animazioni dell’utente

- Importati direttamente tutti i 14 PNG di `father_son_animazioni_complete.zip`, senza ridisegno o ricampionamento; confronto byte per byte con lo ZIP riuscito. Conservati metadata originali, palette, README e tre sorgenti Aseprite; gli originali editabili in `art/characters/supplied/` sono esclusi dall’export.
- Le due scene referenziano sette fogli per attore: idle, walk, run, crouch_idle, crouch_walk, hand_idle, hand_walk. Quattro righe fronte/schiena/sinistra/destra, due o sei colonne secondo lo stato. Celle padre 48×64 e figlio 40×48: adattati pixel_size e baseline per conservare altezza nel mondo e appoggio dei piedi; nessuno squash del crouch.
- `character_sprite.gd` commuta texture/griglia con reset sicuro dell’indice prima dei cambi 6→2 colonne. FPS di riferimento 4/9/13/4/6/4/9 dal pacchetto; camminata/corsa/stealth restano legate alla distanza fisica effettiva e alla velocità nominale. HAND usa i fogli dedicati; in HAND accovacciato usa le pose stealth fornite, perché manca una variante di contatto accovacciata nel pacchetto.
- IA, movimento fisico, collisioni, navmesh, nemico, camera, HUD, livello e audio invariati. Il vecchio autore procedurale non alimenta più i personaggi attuali; i PNG ricevuti sono la sorgente grafica del gioco.
- 239/239 controlli superati: tutti i 178 controlli di gameplay/presentazione e 61 sulle animazioni. Aggiornati i controlli sulla vecchia griglia e il test di presentazione che assumeva pixel_size .045: ora verifica le altezze visive nel mondo, la baseline e nearest-neighbor con canvas differenti. Verificati griglie dei sette stati, righe direzionali, timing idle, passaggio HAND walk/idle, fallback stealth, muro fisico e assenza di modifiche alla fisica da parte dell’animazione.
- Nuove prove visive in `screenshots/animation-pack/`: scena allo zoom normale, tavola delle pose effettive e video Godot da 20 s a scala costante. Import/export Web release riusciti; Chromium/WebGL 2: avvio, movimento e H verificati senza errori. Export Web aggiornato per la pubblicazione GitHub autorizzata; esito del deploy Vercel remoto da verificare.
- Limiti: qualità e differenze fra pose originali del padre e pose dinamiche restano quelle del pacchetto; non introdotte nuove pose o IK. Nessuna animazione HAND accovacciata dedicata.

## 0.6B · Rifinitura dal riferimento fornito

- Riprese le caratteristiche del foglio indicato dall’utente: padre con barba, cappotto lungo diviso sulle gambe, zaino e scarponi; bambino con giacca oliva, berretto lavorato, sciarpa bordeaux e piccolo zaino. Palette terrosa e desaturata, senza aumentare la risoluzione delle celle o la scala in gioco.
- Corsa con busto più avanzato e sei posizioni dei gomiti, passaggio e recupero delle braccia riconoscibili; falde del cappotto e sciarpa arretrano durante il movimento. Camminata con lieve flessione dei gomiti e stealth con ginocchia piegate, passi corti e carico in avanti. Le proporzioni del bambino restano specifiche.
- Solo PNG e autore offline delle pose (`tools/build_character_sprites.gd`): conservati griglia 576×432 / celle 24×48, quattro orientamenti, baseline e tutte le righe HAND. `character_sprite.gd`, IA, movimento, collisioni, navigazione, camera, ambiente, HUD e audio invariati. Il generatore della tavola accetta `--output=` per conservare le anteprime precedenti.
- Tutti i 220 controlli esistenti nuovamente superati su Godot 4.6.3/Linux; import ed export Web release riusciti. Chromium/WebGL 2: avvio, movimento e richiamo comandi con H verificati senza errori. Verifica visiva di orientamenti/pose e nuove registrazioni della scena reale a zoom costante: `screenshots/0.6b-reference/confronto-pose.png` e `animazioni-riferimento.mp4` (padre 10 s, figlio 10 s). Prove controllate con IA sospesa come per la precedente verifica delle animazioni.
- Export Web aggiornato incluso nella pubblicazione GitHub autorizzata di questa rifinitura; esito del deploy Vercel remoto da verificare. Restano i limiti della pixel art a bassa risoluzione: dettaglio semplificato rispetto al riferimento e quattro orientamenti, senza IK delle mani.

## 0.6B · Pose e timing dei protagonisti

- Analisi 0.6: celle 24×48, 12 frame (quattro orientamenti con un fermo e due passi), ciclo unico a 8 frame/s per camminata e corsa; crouch ottenuto con scala Y 0.72 e abbassamento dello sprite. Il tempo di animazione non dipendeva dalla distanza percorsa.
- Stesso Sprite3D, stessa scala .045, palette sobria, quattro orientamenti e punto d’appoggio. Nuovi fogli 576×432, con celle sempre 24×48: due pose ferme, sei di camminata, sei di corsa, due accovacciate ferme, sei furtive per orientamento. Le righe aggiuntive modificano soltanto il braccio in HAND.
- Padre: riposo lievemente curvo, gambe alternate e braccia in controfase, busto inclinato/falcata più ampia e gomiti piegati correndo; ginocchia realmente piegate e baricentro basso nello stealth. Furtivo distinto dall’accovacciamento fermo per busto avanzato, braccia raccolte e trasferimento del peso. Nessuna compressione verticale dei nuovi sprite.
- Bambino disegnato con testa, torso, sciarpa e arti propri; gambe più corte, ciclo più rapido, corsa più raccolta e piccola irregolarità dipinta nelle pose di passaggio. Non è l’immagine del padre rimpicciolita.
- `character_sprite.gd` seleziona le pose usando lo spostamento XZ effettivo di `move_and_slide()`. Cicli in metri, isteresi per partenza/arresto e passaggio camminata/corsa; il ciclo si ferma contro i muri e mantiene la fase fra le andature. Ancoraggio costante e pixel nearest-neighbor. Il nemico continua a usare i suoi fogli e il timing precedenti.
- HAND conserva integralmente il movimento: braccio di contatto più quieto quando vicini, lato corretto nelle viste frontali/posteriori; posa sospesa se il contatto è lontano, in pericolo o in fila nei passaggi stretti. Nessun aggancio fisico o allineamento forzato delle mani.
- IA del figlio/nemico, padre, furtività, audio/udito, camera, HUD, livello e navmesh verificati invariati tramite hash; nelle scene attori cambiano solo griglia e script Sprite3D. Corpo/capsula, accelerazione e `drive()` restano invariati.
- 220/220 controlli su Godot 4.6.3/Linux: tutti i 178 precedenti più 42 in `tests/animation_test.gd` (andature, quattro orientamenti, distanza percorsa, isteresi, posa reale crouch, muro fisico, HAND/WAIT/passaggio stretto, nemico legacy e assenza di scritture fisiche dall’animazione). Import ed export Web release riusciti; Chromium/WebGL 2: avvio, movimento e H verificati senza errori.
- Verifica visiva su rendering Compatibility: cinque pose singole confrontate, sequenze registrate dal gioco a scala costante (camera size 4 solo nel test), due secondi per andatura in ordine idle/walk/run/crouch idle/crouch walk. Video separati da 10 s e montaggio padre+figlio da 20 s in `screenshots/0.6b/`; confronto PNG dei veri frame dell’atlante a scala intera 6×. Prova controllata con IA sospesa e movimento fisico degli attori, non un filmato di gameplay autonomo del compagno. Escluso dal montaggio mezzo secondo di assestamento per stato.
- Arte riproducibile in `tools/build_character_sprites.gd`, regia di prova in `tools/animation_demo.gd`, tavola in `tools/animation_comparison.gd`. Export Web aggiornato incluso nella pubblicazione GitHub autorizzata della 0.6B; esito del deploy Vercel remoto da verificare.
- Limiti: quattro orientamenti cardinali visuali, sei pose per ciclo senza interpolazione; resta possibile uno scorrimento residuo dei piedi, soprattutto in diagonale o nelle sterzate. Le mani sono suggerite dalla posa, senza contatto anatomico/IK. Verificati Linux e Chromium; Safari/Firefox e sistemi nativi Mac/Windows non verificati.

## 0.6 · Udito, passi e distrazione

- Preparazione: verificati branch `work`, stato Git e presenza di 0.5/0.5B nel workspace; tutte le modifiche locali precedenti preservate.
- `NoiseBus` comunica eventi discreti con posizione, raggio, tipo e sorgente; nessuna dipendenza dall’output audio. Nessun autoload o framework aggiuntivo.
- `FootstepEmitter` riusato come nodo figlio dei due attori: distanza fisica realmente percorsa, cadenza minima 0.28 s, nessun evento da immobilità o spinta contro un muro. Padre: 0.4 m accovacciato, 2.5 camminando, 6 correndo; figlio: 0.3 / 1.8 / 4. Velocità reale e postura determinano il rumore, anche in HAND o durante il recupero della distanza; IA e velocità dei personaggi non modificate.
- Udito in `enemy.gd` integrato negli stati INVESTIGATE/SEARCH della 0.5. `last_heard` e `last_seen` distinti, nessun inseguimento automatico della sorgente invisibile. Vista prioritaria; un rumore non interrompe CHASE. Ricerca locale centrata sulla posizione udita quando l’investigazione è acustica.
- Un raggio fisico per evento nel raggio: ostacoli attenuano la portata al 55%, senza rendere l’udito equivalente alla vista. Soglia e attenuazione modificabili nell’Inspector.
- Aggiornamenti filtrati da cooldown 1.5 s, spostamento minimo della stessa sorgente 1.25 m e margine di significatività 0.3; rumori chiaramente più forti possono sostituire uno stimolo debole. Conservato soltanto un identificatore per filtrare ripetizioni, non un bersaglio da seguire.
- Una lattina sul bordo del bancone: E da vicino la fa cadere, un solo impatto da 8 m per partita e oggetto fermo a terra. Caduta animata semplice, senza RigidBody, nuove collisioni o inventario. Fra lattina e acqua viene scelta l’interazione raggiungibile più vicina, con priorità all’acqua a parità di distanza; obiettivo e condizioni finali invariati.
- Tre piccoli WAV mono originali e asciutti: passi padre, passi figlio e impatto metallico. AudioStreamPlayer3D e ascoltatore presso il padre, distinto dalla camera. Nei test headless viene omessa la riproduzione senza altoparlanti, ma gli eventi logici restano attivi; la silenziosità/mute non disabilita l’udito dell’IA.
- `tests/noise_test.gd`: 33 controlli su passi reali/immobilità, corsa/crouch, figlio e HAND, raggi, attenuazione, memoria udita, priorità visiva, cooldown, caduta unica, selezione vicina e indipendenza dall’audio. Tutti i 145 controlli precedenti superati senza modificare le suite: totale 178/178, inclusa vittoria con pattuglia attiva e comportamento del figlio sotto minaccia.
- Import e Web release riusciti; in Chromium verificati avvio, input e segnale audio effettivo dopo gesto utente, senza disabilitare le restrizioni di autoplay e senza errori. Non eseguiti ascolto soggettivo o prove native Mac/Windows. Esportazione Web inclusa per la pubblicazione su Vercel tramite GitHub; esito del deploy remoto da verificare.
- Limiti: attenuazione con un solo raggio, nessuna propagazione attorno alle porte/materiali, audio sobrio senza variazioni di superficie; la lattina è una distrazione animata monouso, non un oggetto fisico lanciabile. La distrazione non garantisce una fuga.

## 0.5B · Rifinitura visiva e cinematografica

- Inquadratura iniziale 12.5 invece di 14 (personaggi circa 12% più grandi), con stessi orientamento, inseguimento fluido e zoom manuale 10–22. Nessuna modifica alla geometria per adattare la camera.
- Fogli sprite e animazioni intatti: leggere tinte fredde sul padre e più calde sul figlio; offset di un pixel per allineare meglio i piedi alle superfici visive. Scala logica .045 e nearest-neighbor conservati.
- Due soli soggetti di leggibilità dichiarati nella scena: se un ostacolo copre il torso dalla camera, padre/figlio appaiono attenuati al 42%, con fade breve. Il depth test normale ritorna quando sono liberi. Nessuna trasparenza delle pareti o visualizzazione del nemico attraverso ostacoli; il controllo è esclusivamente grafico.
- Intonaco con poche colature/scrostature, pavimento interno separato dal cemento esterno tramite un materiale SVG leggero; asfalto invariato. Ombre più definite, riempimento ambientale leggermente ridotto e foschia esistente meno intensa, senza nuovi effetti pesanti.
- HUD con margini coerenti, obiettivo prioritario, stato del figlio attenuato, narrazione/interazione separati dalla fascia dei comandi. Comandi iniziali per 7 s, poi richiamo “H · Comandi”; H mostra/nasconde la fascia senza sospendere o modificare la simulazione. Etichette dei tasti generate dalle stesse associazioni usate dall’input.
- `tests/presentation_test.gd`: 12 controlli su timer/H fisico, movimento con comandi visibili, fine partita, limiti zoom, sagome solo dei protagonisti e ripristino della resa opaca.
- IA di padre/figlio/nemico, logica di gioco, navmesh, texture della strada e fogli sprite verificati invariati tramite hash; nodi/formazioni fisiche del livello confrontati prima/dopo senza differenze.
- Tre screenshot nativi 1280×720 in `screenshots/0.5b/` (strada a zoom normale, esterno, interno), con ZIP. Controllati anche zoom 10/22, personaggi vicini ai muri e narrazione insieme ai comandi. Scatti di composizione con attori posizionati e nemico fermo.
- 145/145 controlli superati su Godot 4.6.3/Linux (133 precedenti più 12 nuovi); import ed export Web release riusciti. In Chromium/WebGL 2 verificati avvio, movimento e H che mostra/nasconde realmente i comandi, senza errori. Nessun push o deploy della 0.5B.
- Limiti: la sagoma usa un semplice raggio al torso, senza maschere per le singole parti del corpo; la verifica visiva non copre ogni posizione possibile del livello. Nessun cambio alla percezione usata dall’IA.

## 0.5 · Memoria e investigazione del nemico

- `enemy.gd` estende la macchina a stati con INVESTIGATE, SEARCH e RETURN, conservando PATROL e CHASE. Una nuova osservazione interrompe immediatamente qualunque ricerca o ritorno; viene mantenuto il bersaglio attuale se ancora visibile, evitando continui cambi fra padre e figlio.
- `last_seen` viene aggiornata soltanto quando `can_see()` conferma un avvistamento. Alla perdita di vista il riferimento al bersaglio viene cancellato e il nemico raggiunge l’ultima posizione realmente vista, proiettata sulla navmesh.
- Investigazione a 2.1 m/s, ricerca a 1.0, ritorno a 1.4; mantenute pattuglia 1.6 e inseguimento 3.1. Accelerazione e recupero del passo graduali, pause e rotazioni leggibili usando gli sprite esistenti.
- Fino a tre punti deterministici vicini all’ultima osservazione, proiettati sulla navmesh e scartati se irraggiungibili o con percorso oltre 4.5 m. Pause di 0.65 s e ricerca limitata a 5.5 s; tempi/velocità modificabili nell’editor.
- Timeout di investigazione 6 s e ritorno 14 s per evitare blocchi; ritorno al punto di pattuglia con percorso valido più breve, senza spostamenti forzati. Se nessun punto locale è valido, il nemico osserva sul posto prima di rinunciare.
- Vista pubblica `can_see()` / `can_see_point()`, distanza 7 m, cono 75°, raycast, cattura fisica e IA del figlio 0.4 preservati. Nessun cambiamento a livello, camera, arte, input o obiettivi; nessun udito o indicatore di allerta.
- Nuova suite `tests/enemy_memory_test.gd`: 23 verifiche di pattuglia, memoria, investigazione, punti validi/deterministici, ricerca fisica, riavvistamento di entrambi i personaggi, ritorno e integrazione col figlio che trova riparo. Le suite precedenti non sono state modificate per la 0.5.
- Verifica finale: 133/133 controlli superati su Godot 4.6.3/Linux (110 precedenti e 23 nuovi); export Web release e avvio/input in Chromium/WebGL 2 riusciti senza errori. Nessun push o deploy della 0.5.
- Limiti: ricerca locale deterministica e breve, senza previsione delle vie di fuga; un bersaglio può essere ritrovato legittimamente se il nemico gira attorno alla copertura. I timeout fanno rinunciare a tragitti bloccati, senza teletrasporti.

## 0.4 · Reazione del figlio al pericolo

- `child_danger.gd` separa i sottostati CALM / SEEK_COVER / HIDDEN / HOLD dall’intenzione FOLLOW / WAIT / HAND; il controller è aggiornato da `child.gd`, con riscontro nello stato già mostrato dall’HUD.
- Vista condivisa con il nemico (stesso cono, distanza e raggi contro la geometria); pericolo anche entro 2.6 m con linea libera, soglia di rilascio 3.4 m. Le pareti impediscono reazioni attraverso ostacoli solidi.
- Controlli a 5 Hz del percorso nativo nei prossimi 2.4 m: il bambino non lascia un riparo per attraversare un tratto sorvegliato. Valuta anche l’altezza che avrebbe tornando alla postura normale, evitando ripetuti cicli nascondi/alzati.
- 18 Marker3D di copertura presso auto, scaffali, cassa, pompe e muri; nessuna modifica al layout, alla navmesh o alle collisioni. Selezione entro 3.6 m, proiezione sulla navmesh, percorso raggiungibile e breve (massimo 4.5 m), riparo verificato con raggi fisici. Un bambino già nascosto scarta tragitti esposti; se già esposto può percorrere un breve tratto scoperto per raggiungere il riparo.
- Il bambino si accovaccia con l’animazione esistente e raggiunge il riparo con CharacterBody3D/NavigationAgent3D. Senza un riparo valido si ferma; nessuna invulnerabilità o teletrasporto.
- Ripresa dopo 2 s di sicurezza continua; Q cambia l’intenzione senza annullare la prudenza, F richiede sempre vicinanza e linea libera. Durante il pericolo il contatto HAND è sospeso; se il padre si allontana, al termine il ricongiungimento avviene in FOLLOW. WAIT e la sua postura vengono ripristinati quando sicuri.
- 25 controlli nuovi in `tests/child_danger_test.gd`: vista, vicinanza, muri, copertura reale, attraversamento esposto, isteresi temporale, ricongiungimento, Q/F/HAND/WAIT e collisioni. Le suite di movimento, seguito e mano rimangono invariate.
- Il test di partita con pattuglia attiva attende ora il figlio dietro il distributore e attraversa quando il nemico è lontano: il vecchio percorso presupponeva che il bambino seguisse comunque in una zona esposta. Conservate le verifiche di acqua, nemico attivo e vittoria di entrambi.
- Verifica finale: 110/110 controlli superati su Linux/Godot 4.6.3 (40 base, 3 partita con pattuglia, 19 seguito, 23 mano, 25 pericolo). Export Web release riuscito; avvio/input in Chromium e stato di riparo nell’HUD nativo verificati. Nessun push o deploy della 0.4.
- Limiti: previsione locale rispetto alla posizione/orientamento attuali del nemico, punti di copertura espliciti e nessuna previsione della pattuglia. Una minaccia che si avvicina può invalidare un riparo; senza una via breve e sicura il bambino può restare fermo ed essere catturato.

## 0.3B · Prima art pass controllata

- Padre e figlio: nuovi sprite originali, silhouette sottili, cappotto consumato, accenti ocra contenuti e palette coordinata. Conservati fogli da 288×48 pixel, 12 frame, scala, punti di appoggio e animazioni esistenti.
- Materiali leggeri in SVG a bassa risoluzione: asfalto segnato, cemento, intonaco irregolare, vernice consumata e segnaletica sbiadita; campionamento nearest-neighbor.
- `station_details.tscn` separa dettagli solo visivi: scaffali vuoti, copertine dei muri, auto con abitacolo rastremato/ruote/fanali, pompe e tubi, insegne e pochi fogli abbandonati.
- Palette fredda, luce direzionale più radente e foschia leggera compatibile con Compatibility/Web; zoom iniziale da 16 a 14, senza cambiare rotazione, comandi o limiti dello zoom.
- HUD meno invadente: obiettivo prioritario, stato del figlio leggibile, titolo e controlli più discreti; stessa logica e informazioni.
- Corpi fisici, forme di collisione, trasformazioni e navmesh verificati identici prima/dopo l’art pass. Gameplay, IA e movimento della 0.3A conservati.
- 85 controlli esistenti superati su Godot 4.6.3/Linux: movimento, FOLLOW/HAND/WAIT, interazione, nemico, vittoria, sconfitta e riavvio. Import ed export Web release riusciti; avvio, rendering e input verificati in Chromium/WebGL 2 senza errori.
- Tre screenshot rappresentativi in `screenshots/0.3b/`: strada, esterno e interno, con archivio ZIP. Scatti con personaggi posizionati per la composizione e nemico fermo; non sostituiscono i test di gameplay.
- Prima direzione artistica, non asset definitivi; nessuna animazione nuova, esportazione nativa Mac/Windows o pubblicazione remota della 0.3B.

## 0.3A · Mano nella mano coordinata

- F sceglie il lato più vicino e il bambino raggiunge fisicamente un posto laterale a circa 0.85 m; orientamento smorzato durante curve e inversioni.
- Il bambino combina il movimento del padre con la correzione del posto; il padre adegua gradualmente il passo alla separazione. Rimossa la brusca riduzione a 0.4.
- Arresto stabile con soglie distinte di assestamento/ripartenza; nessun aggancio rigido, teletrasporto o nuova animazione.
- Posto proiettato sulla navmesh e verificato contro i muri; formazione temporaneamente in fila nei punti stretti, con ritorno laterale dopo 0.5 s di spazio libero. Piccola deviazione fisica intorno al padre quando occorre cambiare lato.
- Accovacciamento condiviso in HAND; F torna a FOLLOW, Q termina HAND e passa a WAIT. Controller FOLLOW 0.2 e ambiente invariati.
- 85 controlli automatizzati superati su Linux/Godot 4.6.3: 62 precedenti più 23 in `tests/hand_coordination_test.gd`, incluse andata/ritorno dalla porta, auto, velocità condivisa, inversioni, arresti, modalità, collisioni e assenza di teletrasporti.
- Export Web rigenerato e avviato in Chromium/WebGL 2 senza errori; input movimento/Q/F verificati. Screenshot nativi acquisiti su display virtuale. Nessun push o deploy della 0.3A eseguito.
- Il contatto è approssimato tramite distanza e formazione: mani e braccia non sono ancora allineate da animazioni dedicate. Nei passaggi stretti il contatto può interrompersi temporaneamente.

## 0.2 · Movimento e IA del figlio

- Passo adattivo: 2.35 nominale, adeguamento alla camminata del padre fino a 2.6; recupero breve fino a 3.35 quando il distacco supera 2.3 m, disattivato sotto 1.35 m. Recupero accovacciato limitato a 1.65.
- Partenza/arresto con soglie 1.45/1.05 m; accelerazione, frenata e direzione del seguito smorzate.
- Posto laterale/arretrato validato sulla navmesh e contro i muri; alternative negli spazi stretti senza puntare al centro del padre. Percorsi stabili quando il padre è fermo.
- In attesa il bambino conserva la propria postura, senza copiare l'accovacciamento del padre. Q/F e modalità mano mantenuti.
- Modifiche di gioco concentrate in `scripts/child.gd`; nessuna modifica a livello, padre, motore o navigazione nativa.
- 62 controlli superati su Linux/Godot 4.6.3 (43 esistenti e 19 nella nuova suite `tests/child_follow_test.gd`): camminata continua, corsa/arresto, inversioni, auto/porta, attesa/postura, mano, collisioni e assenza di teletrasporti.
- Limite intenzionale: durante una corsa ininterrotta il padre può ancora distanziare il figlio; il recupero si completa rallentando o fermandosi.

## Pubblicazione Web

- Preset Web Godot 4.6.3 senza thread, esportazione inclusa in `web/`, script riproducibile `tools/export_web.sh` e pubblicazione statica configurata in `vercel.json`.
- Export release riuscito; avvio, rendering WebGL 2 e input movimento/Q/F verificati in Chromium su Linux, senza errori JavaScript/Godot.
- Deploy Vercel remoto non verificato da questo ambiente; browser Safari/Firefox e dispositivi mobili non verificati.

## 0.1 · Completato

- Nuovo progetto Godot Compatibility nella stessa repository; vecchia versione conservata nel ramo `backup/liminal-before-father-and-son-2026-10-15`.
- Distributore editabile, strada, auto e coperture fisiche; sprite originali padre/figlio/nemico.
- Movimento accelerato, corsa, accovacciamento e camera ortografica con zoom.
- Compagno con navigazione nativa, attesa, mano e piccolo scarto laterale per liberare il passaggio.
- Nemico con pattuglia, vista limitata, occlusione, inseguimento e cattura.
- Risorsa, uscita di entrambi, vittoria/fallimento, riavvio e HUD.
- 40 verifiche native più 3 verifiche di un percorso completo con nemico attivo, superate su Linux/Godot 4.6.3.
- Rendering OpenGL Compatibility verificato su display virtuale, comprese le schermate finali.

## Prossimi interventi

- Prova manuale su macOS e Windows, inclusi tastiera, trackpad e prestazioni.
- Revisione con l'utente di proporzioni, leggibilità e ritmo della pattuglia prima di ampliare il prototipo.

Esportazioni native Mac/Windows non ancora eseguite; nessuna dichiarazione di verifica su quelle piattaforme.
