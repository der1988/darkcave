# Regole operative · Campo Libero

Valgono GAME_DESIGN.md e la richiesta corrente. Il gioco attivo è calcio 3 contro 3: rossi contro blu, due calciatori e un portiere per squadra, porte a sinistra/destra e sponde. Undici e Father & Son restano storici.

- Godot 4.6 stabile, GDScript e renderer Compatibility. Nessun framework o asset esterno necessario.
- Conservare `.git`, cronologia, branch e remote. L’utente ha autorizzato stabilmente il push finale su GitHub, anche quando il prompt dell’attività contiene la formula “non pushare”. Includere l’export Web aggiornato quando cambia il gioco e verificare l’esito del push.
- Modifiche circoscritte: leggere prima solo i moduli coinvolti. Non riscrivere sistemi funzionanti senza richiesta.
- Separare dati/scena e comportamento. Preferire nodi modificabili nell'editor; niente unico script che genera il mondo.
- Non aggiungere funzionalità, astrazioni o dipendenze per ipotetiche esigenze future.
- Aggiornare ROADMAP.md e i test soltanto quando cambia un comportamento rilevante. Distinguere controlli eseguiti da quelli non eseguiti.

## Gioco attivo · 3 contro 3

- Scena attiva: `scenes/football/main.tscn`. Regia/controllo rosso: `scripts/football/team_match.gd`, derivato dal controller precedente per riutilizzare input/cariche/passaggi.
- Regole di squadra e gol: `scripts/football/team_rules.gd`; primo a 5, tutte le conclusioni valide, rimbalzi sulle pareti in gioco. Test attivi: `tests/team_match_test.gd`.
- Azioni dei giocatori: `street_player.gd` estende `player.gd` solo nel 3v3 (scivolata, caduta, recupero e corsa sbilanciata). Atlas `player_actions.png`: primi 96 frame invariati, più 56 pose sorgente; import `tools/import_player_actions.gd`, test `tests/player_actions_test.gd`. D è contestuale (passaggio con palla, scivolata senza); mantenere il rilascio senza passaggi involontari.
- IA tattica: `scripts/football/team_ai.gd`; possesso, pressione, copertura, appoggio e conclusione. Due portieri riusano `goalkeeper.gd`, configurati con squadra e porta; `goalkeeper_sprite.gd` conserva le animazioni originali.
- Campo e porte: `assets/football/arena_asphalt.gdshader`, `scenes/football/side_goal.tscn`, `assets/football/net.gdshader`. I muri e la recinzione sono nodi modificabili nella scena principale.
- Input centralizzato: `controls.gd`; dispositivo e touch: `control_mode.gd`, con Q aggiuntivo solo nel gioco a squadre. Player/ball mantengono i moduli fisici e sprite esistenti. Il tiro sceglie la porta in base alla squadra; i comandi umani non influenzano la mira dell’IA.
- Destinatario e indicatore del passaggio: `pass_target.gd`; seleziona soltanto il compagno rosso. Controllo automatico al ricevente e al difensore più vicino, Q per cambio manuale.
- Partenza in pausa fino alla scelta PC/smartphone: test e capture devono chiamare `DeviceUI/ControlMode.choose_mode`.
- Storico Undici: `scenes/football/eleven.tscn`, `sandbox.gd`, `match_rules.gd`, `teammate_support.gd`, `volley_goal.gd`. Le suite football/control_mode/eleven/five_player/passing usano questa scena per verificare i moduli riutilizzati; non descrivono il regolamento attivo.
- Asset originali footballgame in `assets/football/`; autore Aseprite in `art/football/` escluso dall’export. Provenienza e import riproducibile in `assets/football/README.md`.
- Export/push: `tools/export_web.sh`, commit anche di `web/`, push finale autorizzato su `main`. Capture nativa: `tools/capture_football.gd`; screenshot Web in `screenshots/football-21/`.

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
