# Animazioni integrate dal pacchetto ZIP

- `nel-gioco.png`: personaggi nella scena esistente allo zoom normale 12.5.
- `confronto-pose.png`: cinque pose reali dei PNG forniti, ingrandite 4× nearest-neighbor.
- `animazioni-integrate.mp4`: 20 secondi, 1280×720 e 30 FPS, padre per 10 secondi e bambino per i successivi 10.

Per ciascun attore il video mostra due secondi per stato: fermo, camminata, corsa, accovacciato fermo, movimento furtivo. Camera a scala costante (size 4 solo nella prova), movimento tramite `drive()`/`move_and_slide()` e IA sospesa. Stesso harness `tools/animation_demo.gd` e montaggio dei segmenti documentato in `../0.6b/README.md`.

La tavola si rigenera con:

```sh
godot --path . --script tools/animation_comparison.gd -- --output=res://screenshots/animation-pack/confronto-pose.png
```

Le immagini originali non sono state ridisegnate. Gli Aseprite restano editabili in `art/characters/supplied/`.
