# Campo Libero · 0.1

Prima base per un gioco di calcio arcade isometrico, con l’idea del pallone come strumento di movimento e gioco ispirata a Soccer Kid. Non è ancora una partita fra squadre.

- Un solo piccolo calciatore, circa 32 pixel di altezza a 1280×720, camera ortografica isometrica fissa con inseguimento morbido.
- Campo verde senza bordi: collisione infinita, superficie visiva ricentrata e trama ancorata al mondo. Nessuna stanza, torcia, compagno o nemico nella scena attiva.
- Sprite, pose e corsa in otto direzioni provengono da der1988/footballgame; stessa pixel art e palette della squadra di casa, senza ricampionare i frame.
- WASD/frecce muovono rispetto alla visuale; Shift scatta. Palla al piede automatica da vicino: correzioni di velocità e percorso attorno al corpo, nessun aggancio o teletrasporto durante il controllo.
- Spazio tenuto e rilasciato carica il tiro nella direzione del giocatore. E fa un pallonetto. La palla ha gravità, rimbalzi e resistenza dell’erba tramite fisica nativa.
- R richiama la palla vicino al giocatore per continuare a provare; è un comando esplicito del sandbox. H mostra/nasconde i comandi; la rotellina varia lo zoom entro i limiti.
- Godot 4.6.3, GDScript, Compatibility e Sprite3D. Export Web single-thread già presente nella repository, distribuito da Vercel.

Per ora l’obiettivo è studiare movimento, scala, animazioni e rapporto con il pallone. Porte, avversari, punteggi, livelli e altre meccaniche da piattaforme non fanno parte di questa prima prova.
