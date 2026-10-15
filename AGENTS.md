# Regole operative · Father & Son

Valgono GAME_DESIGN.md e la richiesta corrente; il vecchio gioco è abbandonato.

- Godot 4.6 stabile, GDScript e renderer Compatibility. Nessun framework o asset esterno necessario.
- Conservare `.git`, cronologia, branch e remote. Non fare push senza richiesta esplicita.
- Modifiche circoscritte: leggere prima solo i moduli coinvolti. Non riscrivere sistemi funzionanti senza richiesta.
- Separare dati/scena e comportamento. Preferire nodi modificabili nell'editor; niente unico script che genera il mondo.
- Non aggiungere funzionalità, astrazioni o dipendenze per ipotetiche esigenze future.
- Aggiornare ROADMAP.md e i test soltanto quando cambia un comportamento rilevante. Distinguere controlli eseguiti da quelli non eseguiti.

## Mappa dei file

- Input e trasformazione WASD: `scripts/controls.gd`.
- Movimento/collisioni/animazioni comuni: `scripts/human_actor.gd`; padre: `scripts/father.gd`.
- Compagno e comandi Q/F: `scripts/child.gd`; reazione al pericolo: `scripts/child_danger.gd`; nemico e visibilità: `scripts/enemy.gd`.
- Rumori: `scripts/noise_bus.gd`; passi: `scripts/footstep_emitter.gd`; lattina: `scripts/metal_distraction.gd`. Audio WAV originali in `assets/audio/`.
- Camera: `scripts/camera_rig.gd`; partita/obiettivo: `scripts/game.gd`; HUD: `scripts/hud.gd`.
- Livello: `scenes/environment/station.tscn`; attori: `scenes/actors/`; sprite: `assets/characters/`.
- Navmesh già inclusa. Dopo modifiche agli ostacoli: `godot --headless --path . --script tools/bake_navigation.gd`.
- Test: `godot --headless --fixed-fps 60 --path . --script tests/prototype_test.gd` e `tests/stealth_route_test.gd`.
