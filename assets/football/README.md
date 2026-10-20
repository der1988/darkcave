# Sprite originali · footballgame

Fonte: https://github.com/der1988/footballgame — commit fdafcb36efea568e2003e3ae089a56b3da8daaa2.

Frame presi da res/spritesheets/sprites.png e dalle regioni di sprites.json. Tempi e direzioni letti da res/animations/animations.json, comportamento di riferimento da src/gfx_player.c, src/system_player_on_the_ball.c e src/entity_ball.c.

- player.png: 96 celle originali 61×61; otto direzioni per colonna, fermo, quattro pose di corsa, posa del piede e sei frame di testa.
- ball.png: 32 celle originali 52×44, quattro pose di rotolamento per otto direzioni.
- Direzioni in senso orario partendo da destra: right, front_right, front, front_left, left, back_left, back, back_right.
- Corse e fermi originali; il breve gesto del calcio usa shoot sulle diagonali e le pose originali tackle sui cardinali, senza disegnare nuovi frame.

Il rosso dei PNG del giocatore sorgente è un indice, non un colore finale. tools/import_football_art.gd applica la stessa palette della maglia di casa (rosso, pantaloncini/calzettoni bianchi, pelle, capelli/scarpe scuri). L’indice 7 della vecchia ombra viene reso trasparente e sostituito da una piccola ombra di contatto sul piano 3D. Posizioni, maschere corporee e risoluzione dei frame sono conservate; niente riscalatura o generazione di nuove pose.

Riproduzione, con checkout della fonte accessibile localmente:

```sh
godot --headless --path . --script tools/import_football_art.gd -- --source=/path/to/footballgame
godot --headless --editor --import --path . --quit
```

Originali player.aseprite e ball.aseprite in art/football/. Il motore C/raylib della fonte non è importato: questa prova resta nel progetto Godot esistente.

Portiere: `goalkeeper.png` contiene tutti i 240 frame originali `goalkeeper_*` in celle 61×61, 16 colonne; `goalkeeper.json` conserva indice dei frame e tutte le sequenze/tempi di `animations.json` della fonte. Import con `godot --headless --path . --script tools/import_goalkeeper_art.gd -- --source=/path/to/footballgame`. Stessa conversione della palette indicizzata dell’import iniziale, senza ridisegno o ricampionamento. I frame includono fermo, corsa, tuffi bassi/alti, salti, uscita bassa, presa e passaggio a mano.

Porta: `posts_0.png` e `net_up_0.png` sono ritagli originali 100×56 di `sprites.png`, letti da `entity_goal.c` e `entity_goal_net.c`; importer `tools/import_goal_art.gd`. Alpha della rete conservato. Il foglio `player.png` ora contiene 96 celle (8×12): le 48 pose precedenti più sei frame di testa in tutte le otto direzioni, senza ridisegno.

`kit.gdshader` recolors only the original red jerseys at runtime. Five identity colors are defined in `scripts/football/roster.gd`; source sheets, skin, hair, shorts and goalkeeper animation frames are preserved.
