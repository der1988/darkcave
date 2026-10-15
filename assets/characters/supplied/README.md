# Animazioni fornite dall’utente

I 14 PNG in `spritesheets/` e `animation_metadata.json` provengono da `father_son_animazioni_complete.zip` e sono conservati byte per byte. Originali Aseprite, palette e README del pacchetto sono in `art/characters/supplied/`, esclusi dall’export Godot.

Ogni PNG contiene quattro righe: fronte, schiena, sinistra, destra. L’ordine dei sette fogli nelle scene dei personaggi è idle, walk, run, crouch_idle, crouch_walk, hand_idle, hand_walk. I riferimenti Texture2D espliciti nelle scene assicurano l’inclusione delle immagini nell’export Web.

`scripts/character_sprite.gd` gestisce solo la presentazione. Usa i tempi del pacchetto (4/9/13/4/6/4/9 FPS), adattando i cicli in movimento alla distanza percorsa rispetto alla velocità nominale del personaggio. Un attore bloccato non continua a camminare. In HAND accovacciato usa crouch_idle/crouch_walk: il pacchetto non contiene pose dedicate di contatto in questa postura.

Padre: celle 48×64, piedi alla riga 58, pixel_size .0409. Figlio: celle 40×48, piedi alla riga 44, pixel_size .0382. La scala conserva le altezze visive precedenti (circa 1.80 e 1.26 unità); l’ancoraggio deriva dalla baseline, senza ridimensionare verticalmente i frame accovacciati.

Per sostituire un foglio mantenere celle, righe e colonne; per cambiare layout o timing aggiornare scene, `FRAME_COUNTS`/`FPS` e test. Il vecchio `tools/build_character_sprites.gd` scrive solo i fogli storici `father.png`/`child.png`, non questi PNG e non modifica le animazioni attuali.
