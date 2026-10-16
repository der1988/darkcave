# Campo Libero · 0.3

Prima base per un gioco di calcio arcade isometrico, con l’idea del pallone come strumento di movimento e gioco ispirata a Soccer Kid. Non è ancora una partita fra squadre.

- Un solo piccolo calciatore, circa 32 pixel di altezza a 1280×720, camera ortografica isometrica fissa con inseguimento morbido.
- Campo verde senza bordi: collisione infinita, superficie visiva ricentrata e trama ancorata al mondo. Nessuna stanza, torcia, compagno o nemico nella scena attiva.
- Sprite, pose e corsa in otto direzioni provengono da der1988/footballgame; stessa pixel art e palette della squadra di casa, senza ricampionare i frame.
- Le frecce muovono rispetto alla visuale; Shift scatta. Palla al piede automatica da vicino: correzioni di velocità e percorso attorno al corpo, nessun aggancio o teletrasporto durante il controllo.
- A tenuto e rilasciato carica il tiro nella direzione del giocatore. D fa un pallonetto corto, senza ridurne l’altezza. S salta: gravità e atterraggio sono fisici, senza doppio salto. La palla ha gravità, rimbalzi e resistenza dell’erba tramite fisica nativa.
- R richiama la palla vicino al giocatore per continuare a provare; è un comando esplicito del sandbox. H mostra/nasconde i comandi; la rotellina varia lo zoom entro i limiti.
- Godot 4.6.3, GDScript, Compatibility e Sprite3D. Export Web single-thread già presente nella repository, distribuito da Vercel.

Per ora l’obiettivo è studiare movimento, scala, animazioni e rapporto con il pallone. Porte, avversari, punteggi, livelli e altre meccaniche da piattaforme non fanno parte di questa prima prova.

Il terreno alterna erba corta, zone secche, ciuffi alti e piccoli sassi decorativi in scala. Le decorazioni non cambiano le collisioni; venticinque settori vengono rigenerati deterministicamente durante il viaggio. Anteprime aggiornate in screenshots/football-02/.

Terreno pixel art a palette discreta, ispirato alle sei varianti fornite: prato fitto, erba con terra scoperta, tappeto basso, vegetazione rada alta, terreno umido e tratti consumati. Le zone umide restano decorative, senza meccaniche acquatiche. Il tiro con A può essere caricato in aria e rilasciato su un pallone vicino entro altezza raggiungibile, anche saltando; il dribbling rimane solo a terra. Anteprime in screenshots/football-03/.
