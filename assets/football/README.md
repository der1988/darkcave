# Sprite originali · footballgame

Fonte: https://github.com/der1988/footballgame — commit fdafcb36efea568e2003e3ae089a56b3da8daaa2.

Frame presi da res/spritesheets/sprites.png e dalle regioni di sprites.json. Tempi e direzioni letti da res/animations/animations.json, comportamento di riferimento da src/gfx_player.c, src/system_player_on_the_ball.c e src/entity_ball.c.

- player.png: 48 celle originali 61×61; otto direzioni per colonna, fermo, quattro pose di corsa, posa breve del piede.
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
