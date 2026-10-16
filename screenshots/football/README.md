# Campo Libero · prima prova

Tre screenshot del gioco alla scala iniziale, un video nativo di circa 10 secondi e una verifica del browser. Un solo giocatore, la palla e il campo verde continuo.

La sequenza nativa usa gli stessi input e la stessa fisica del gameplay: fermo, palla al piede, pallonetto e cambio di direzione. Il tool tools/capture_football.gd non cambia scala o camera per nascondere la dimensione effettiva dell’omino.

```sh
godot --path . --resolution 1280x720 --fixed-fps 60 --write-movie /tmp/football.avi --script tools/capture_football.gd
```

Il video MP4 si ottiene dall’AVI con FFmpeg/H.264. Le anteprime non sono incluse nell’export del gioco grazie a screenshots/.gdignore.
