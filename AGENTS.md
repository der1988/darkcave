# Regole operative · Campo Libero

Valgono GAME_DESIGN.md e la richiesta corrente. Il gioco attivo è il prototipo di calcio isometrico con un solo giocatore; Father & Son resta storico e non viene caricato all’avvio.

- Godot 4.6 stabile, GDScript e renderer Compatibility. Nessun framework o asset esterno necessario.
- Conservare `.git`, cronologia, branch e remote. L’utente ha autorizzato stabilmente il push finale su GitHub, anche quando il prompt dell’attività contiene la formula “non pushare”. Includere l’export Web aggiornato quando cambia il gioco e verificare l’esito del push.
- Modifiche circoscritte: leggere prima solo i moduli coinvolti. Non riscrivere sistemi funzionanti senza richiesta.
- Separare dati/scena e comportamento. Preferire nodi modificabili nell'editor; niente unico script che genera il mondo.
- Non aggiungere funzionalità, astrazioni o dipendenze per ipotetiche esigenze future.
- Aggiornare ROADMAP.md e i test soltanto quando cambia un comportamento rilevante. Distinguere controlli eseguiti da quelli non eseguiti.

## Gioco attivo · calcio isometrico

- Scena di avvio: `scenes/football/main.tscn`; giocatore e palla nelle due scene accanto.
- Input: `scripts/football/controls.gd`; movimento e animazione: `scripts/football/player.gd`.
- Fisica e controllo della palla: `scripts/football/ball.gd`; coordinamento, camera e HUD: `scripts/football/sandbox.gd`.
- Asset originali footballgame convertiti in `assets/football/`; autore Aseprite in `art/football/` (escluso dall’export). Provenienza e conversione in `assets/football/README.md`.
- Import riproducibile: `tools/import_football_art.gd -- --source=/path/to/footballgame`. Non ridisegnare gli sprite per cambiare il comportamento.
- Test attivi: `godot --headless --fixed-fps 60 --path . --script tests/football_test.gd`. Verifica visiva: `tools/capture_football.gd`.
- Export/push: `tools/export_web.sh`, commit anche di `web/`, push finale autorizzato su `main`.

## Mappa storica · Father & Son

- Input e trasformazione WASD: `scripts/controls.gd`.
- Movimento/collisioni/animazioni comuni: `scripts/human_actor.gd`; padre: `scripts/father.gd`.
- Compagno e comandi Q/F: `scripts/child.gd`; reazione al pericolo: `scripts/child_danger.gd`; nemico e visibilità: `scripts/enemy.gd`.
- Rumori: `scripts/noise_bus.gd`; passi: `scripts/footstep_emitter.gd`; lattina: `scripts/metal_distraction.gd`. Audio WAV originali in `assets/audio/`.
- Camera: `scripts/camera_rig.gd`; partita/obiettivo: `scripts/game.gd`; HUD: `scripts/hud.gd`.
- Livello: `scenes/environment/station.tscn`; attori: `scenes/actors/`; sprite: `assets/characters/`.
- Animazioni attuali: `scripts/character_sprite.gd`, sette PNG per attore in `assets/characters/supplied/spritesheets/`, riferiti dalle scene. Originali Aseprite in `art/characters/supplied/` (esclusi dall’export). `tools/build_character_sprites.gd` genera solo i vecchi fogli, non quelli forniti dall’utente.
- Navmesh già inclusa. Dopo modifiche agli ostacoli: `godot --headless --path . --script tools/bake_navigation.gd`.
- Test: `godot --headless --fixed-fps 60 --path . --script tests/prototype_test.gd` e `tests/stealth_route_test.gd`.
