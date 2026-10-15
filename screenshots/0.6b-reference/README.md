# Father & Son · Rifinitura dal riferimento

`confronto-pose.png` mostra le cinque pose reali dei nuovi sprite, padre e bambino, a scala intera 6×. È un ingrandimento dell’atlante usato nel gioco, non l’immagine concettuale di riferimento.

`animazioni-riferimento.mp4` mostra 10 secondi per il padre seguiti da 10 secondi per il bambino. Per ciascuno: fermo, camminata, corsa, accovacciato fermo, movimento furtivo, due secondi per stato. Registrazione Godot Compatibility a 1280×720 con audio e zoom costante (size 4 solo nella prova). IA sospesa, attori mossi fisicamente da `drive()`; nessuna modifica a velocità, navigazione o logica del gioco.

La regia e il ritaglio dei segmenti sono quelli documentati in `../0.6b/README.md`. La nuova tavola si riproduce con:

```sh
godot --path . --script tools/animation_comparison.gd -- --output=res://screenshots/0.6b-reference/confronto-pose.png
```

Sprite sempre a celle 24×48: il dettaglio del riferimento è semplificato per la scala del gioco. Le anteprime precedenti sono conservate. Revisione inclusa nella pubblicazione GitHub autorizzata dall’utente.
