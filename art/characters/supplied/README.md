# Father & Son — Pacchetto animazioni Aseprite / Godot

## Contenuti
- `aseprite/father_full.aseprite` — 120 frame del padre, 28 tag di animazione.
- `aseprite/child_full.aseprite` — 120 frame del bambino, 28 tag di animazione.
- `aseprite/original_user_father.aseprite` — tuo file originale conservato senza modifiche.
- `spritesheets/` — 7 PNG per personaggio, ciascuno con 4 direzioni (front/back/left/right) disposte in righe.
- `previews/father_son_demo.gif` e `.mp4` — anteprima animata comparativa.
- `previews/<personaggio>_<stato>.gif` — preview specifica dello stato (4 direzioni).
- `previews/overview_all_states.png` — tavola comparativa degli stati.
- `animation_metadata.json` — dimensioni, FPS, tag e ordine righe.

## Canvas e stati
Padre 48x64 px, bambino 40x48 px. Piedi allineati alla riga 58 e 44.
Stati: idle (2), walk (6), run (6), crouch_idle (2), crouch_walk (6), hand_idle (2), hand_walk (6).
4 direzioni: front/back/left/right. 120 frame per personaggio, totale 240.

## Integrazione Godot
Ogni sheet ha 4 righe (front, back, left, right) e N colonne (N frame).
Per frame: x=indice_frame*larghezza_cella, y=indice_direzione*altezza_cella.
AnimationPlayer/AnimatedSprite3D consigliati per impostare FPS diversi a seconda dello stato.
NON sostituire direttamente i file di gameplay esistenti senza aggiornare lo script di selezione animazioni.

## Nota artistica
Il padre IDLE principale usa il tuo originale (fronte/dietro/lato). Le pose dinamiche e il bambino
sono una prima versione di produzione procedurale, editabile in Aseprite; non sono animazioni
professionali disegnate manualmente una per una. Serve rifinitura artistica per un risultato definitivo.
