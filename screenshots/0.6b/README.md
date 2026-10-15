# Father & Son · Verifica animazioni 0.6B

- `padre-e-figlio-animazioni.mp4`: sequenza completa da 20 secondi, 1280×720, 30 FPS, H.264/AAC.
- `father-cinque-andature.mp4` e `child-cinque-andature.mp4`: 10 secondi ciascuno.
- `confronto-pose.png`: cinque pose effettivamente usate dal gioco, padre e figlio, 6× nearest-neighbor e piedi sulla stessa linea.

Ogni video singolo mostra 0–2 s fermo, 2–4 camminata, 4–6 corsa, 6–8 accovacciato fermo, 8–10 camminata furtiva. Stessa camera ortografica e size 4 per entrambi, senza cambiare la camera del gioco.

È una prova visiva controllata: stessa scena e collisioni del prototipo, IA sospesa, attori mossi attraverso `drive()` e `move_and_slide()`. Il bambino cammina a 2.6, corre a 3.35 e si muove accovacciato a 1.25 m/s; non vengono modificate le sue velocità o decisioni nel gioco. L’altro attore è fuori inquadratura. Non dimostra una decisione autonoma del bambino di correre o nascondersi; quella logica è verificata dalle suite esistenti.

## Riproduzione

Con Godot 4.6.3 e un display grafico disponibile, dalla radice del progetto:

```sh
godot --headless --path . --script tools/build_character_sprites.gd
godot --headless --editor --import --path . --quit
godot --path . --script tools/animation_comparison.gd
godot --path . --resolution 1280x720 --fixed-fps 60 --write-movie /tmp/father.avi --script tools/animation_demo.gd -- --actor=father
godot --path . --resolution 1280x720 --fixed-fps 60 --write-movie /tmp/child.avi --script tools/animation_demo.gd -- --actor=child
```

La registrazione grezza contiene cinque segmenti di 150 frame più due frame di avvio/chiusura. Ogni segmento ha 30 frame di assestamento non inclusi nei video consegnati. Il montaggio conserva i frame 31–150, 181–300, 331–450, 481–600, 631–750 (indici FFmpeg), poi converte da 60 a 30 FPS. Non modifica la velocità del movimento.

Prove locali Linux/Compatibility e Chromium/WebGL 2. I file sono esclusi dall’export del gioco tramite il `.gdignore` della cartella screenshots e inclusi nella pubblicazione GitHub autorizzata della 0.6B.
