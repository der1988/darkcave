# Campo Libero · 0.3

Prima base per un gioco di calcio arcade isometrico, con l’idea del pallone come strumento di movimento e gioco ispirata a Soccer Kid. Non è ancora una partita fra squadre.

- Un solo piccolo calciatore, circa 57 pixel di altezza a 1280×720, camera ortografica isometrica fissa con inseguimento morbido.
- Campo verde senza bordi: collisione infinita, superficie visiva ricentrata e trama ancorata al mondo. Nessuna stanza, torcia, compagno o nemico nella scena attiva.
- Sprite, pose e corsa in otto direzioni provengono da der1988/footballgame; stessa pixel art e palette della squadra di casa, senza ricampionare i frame.
- Le frecce muovono rispetto alla visuale; Shift scatta. Palla al piede automatica da vicino: correzioni di velocità e percorso attorno al corpo, nessun aggancio o teletrasporto durante il controllo.
- A tenuto e rilasciato carica il tiro nella direzione del giocatore. D fa un pallonetto corto, senza ridurne l’altezza. S salta: gravità e atterraggio sono fisici, senza doppio salto. La palla ha gravità, rimbalzi e resistenza dell’erba tramite fisica nativa.
- R richiama la palla vicino al giocatore per continuare a provare; è un comando esplicito del sandbox. H mostra/nasconde i comandi; la rotellina varia lo zoom entro i limiti.
- Godot 4.6.3, GDScript, Compatibility e Sprite3D. Export Web single-thread già presente nella repository, distribuito da Vercel.

Per ora l’obiettivo è studiare movimento, scala, animazioni e rapporto con il pallone. Porte, avversari, punteggi, livelli e altre meccaniche da piattaforme non fanno parte di questa prima prova.

Aspetto attuale: campo verde uniforme con segni pixel art molto radi; ridotti fortemente ciuffi e sassi decorativi, eliminate macchie di terra e zone umide. Sprite ingrandito del 25% mantenendo i piedi ancorati al terreno e gli stessi frame. Camminata 4.5 unità/s, corsa 10 unità/s.

Tiro al volo con A anche saltando: si colpisce soltanto una palla vicina entro altezza raggiungibile; il dribbling resta a terra. Anteprime in screenshots/football-04/.

Inquadratura attuale molto più vicina: dimensione ortografica 18, zoom manuale fra 12 e 34. La scala fisica del giocatore resta invariata.

Ultima modifica: sprite ridotto del 25%, stessa camera ravvicinata. Pallonetto caricato tenendo D e lanciato al rilascio: carica massima 0.85 s, impulso verticale 5–10, impulso orizzontale costante 3.16. La carica A per il tiro al volo resta disponibile.

Tiro aggiornato seguendo `footballgame/src/entity_ball.c` e `physics.c`: direzione normalizzata, carica con velocità 4.5–11 (prima 5–15), alzata bassa, volée leggermente discendente, resistenza quadratica dell’aria e rotolamento uniforme in ogni direzione. Il motore fisico resta Godot; pallonetto D e camera invariati.

Aggiornamento attuale: tiro massimo 14, alzata progressiva oltre 55% della carica; tap basso e volée discendente conservati. Ombre di contatto rafforzate. Tracce dei passi in un pool limitato a 128, durata 6 s, nessuna traccia in salto o da fermo. Due alberi (tronchi con collisione, chiome decorative) segnano una porta senza contatore gol.

Versione attuale del tiro: porting delle formule di `entity_player_aim_shot` e `entity_ball_shoot` da footballgame fdafcb36. Carica ideale 80%, sovraccarica meno potente e più alta, mira assistita alla porta con controllo laterale e verticale, limite di svolta 100° durante il movimento, split-lerp di altezza e forza, bonus/malus volée. Forza base 45 m/s; aria, rotolamento, restituzione e limite velocità riportati ai valori della fonte convertiti a metri. Collisioni e gravità rimangono native Godot: non è un porting del motore C. Pallonetto D personalizzato e nessun aftertouch aggiunto.

Ultimo stato: camera fissa a origine, dimensione ortografica iniziale 18.72 (+4%), rotellina ancora attiva. Porta in alto fra (-6,-2) e (-2,-6); portiere con stessi frame e scala del giocatore, tinta distinta, movimento laterale fisico e respinte di palloni raggiungibili. Camminata 4.68, corsa 10.4 (+4%). Nessun teletrasporto o parata automatica di palloni troppo alti.

Portiere aggiornato: animazioni `goalkeeper_*` originali e stati PROTECT/DIVE/JUMP/SMOTHER/RECOVER/HOLD/THROW. Predizione balistica, reazione 0.15 s e tuffo solo per palle veloci (>15 m/s) decentrate, lato e altezza scelti dalla traiettoria. Palle centrali parate in piedi o saltando; uscita bassa entro 2.5 m su palla lenta contesa, percorso libero. Movimento e collisioni nativi, postura di collisione abbassata nel tuffo basso. Possesso unico della stessa palla, rilancio e R sicuri. Alberi +12% in altezza. È un adattamento alla porta fra alberi: niente squadre, rigori, fuorigioco o regole del retropassaggio.

Versione attuale: due calciatori controllati uno alla volta, cambio automatico alla ricezione. S passaggio basso verso il compagno. D caricato: velocità orizzontale 3–10.5 e verticale 8–6, quindi tap alto/corto e pressione lunga più tesa/lunga, sempre aerea. Il ricevente si porta sul punto di arrivo e segue la palla dopo il rimbalzo. Salto su Spazio. Volée con A: portata 1.45, altezza relativa massima 1.9, anticipo massimo 0.22 s se la palla è già vicina; nessuna attrazione o spostamento istantaneo della palla.

Smarcamenti attivi del compagno: piccoli movimenti di supporto attorno al portatore, corpo sempre rivolto verso la palla, collisioni native. Ricezione alta trasferisce il controllo già in volo per preparare la volée. Portata volée 1.8 m, altezza relativa 2.3 m, buffer 0.38 s; mezzo-volo valido entro 0.15 s dal rimbalzo. Obiettivo gol al volo con attraversamento continuo della linea fra gli alberi, limite 2.44 m, identificativo del tiro per evitare duplicati. Tiri rasoterra, richiami e lanci del portiere non completano l’obiettivo.

Interfaccia iniziale obbligatoria PC/Smartphone, simulazione in pausa fino alla scelta. Modalità smartphone: layout responsive landscape senza bande tramite canvas expand; richiesta fullscreen/orientation dalla selezione utente, invito a ruotare in portrait. Joystick analogico sinistro con deadzone e corsa al bordo, A/S/D a destra con multi-touch indipendente e carica al rilascio. Feedback in alto, distinto dai comandi. Rilascio sicuro su focus perso e rotazione: niente tasti bloccati o tiri involontari. La compatibilità fullscreen/lock dipende dal browser, con fallback manuale.

Regolazione mobile attuale: nessuno scatto automatico, curva stick con deadzone 0.16, esponente 1.35 e intensità massima 0.85 della camminata (3.978 unità/s). Lettura input senza seconda deadzone per mantenere progressione continua. PC e Shift invariati.

Ultima calibrazione: eliminata la modalità sprint e l’azione Shift. Movimento unico a 4 unità/s su PC e a fondo analogico su smartphone; curva mobile progressiva 1.35 e deadzone 0.16 conservate, intensità massima 1.0. Dribbling e limite delle correzioni della palla proporzionati alla sola velocità di movimento.
