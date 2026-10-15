# Roadmap · 0.2

## 0.2 · Movimento e IA del figlio

- Passo adattivo: 2.35 nominale, adeguamento alla camminata del padre fino a 2.6; recupero breve fino a 3.35 quando il distacco supera 2.3 m, disattivato sotto 1.35 m. Recupero accovacciato limitato a 1.65.
- Partenza/arresto con soglie 1.45/1.05 m; accelerazione, frenata e direzione del seguito smorzate.
- Posto laterale/arretrato validato sulla navmesh e contro i muri; alternative negli spazi stretti senza puntare al centro del padre. Percorsi stabili quando il padre è fermo.
- In attesa il bambino conserva la propria postura, senza copiare l'accovacciamento del padre. Q/F e modalità mano mantenuti.
- Modifiche di gioco concentrate in `scripts/child.gd`; nessuna modifica a livello, padre, motore o navigazione nativa.
- 62 controlli superati su Linux/Godot 4.6.3 (43 esistenti e 19 nella nuova suite `tests/child_follow_test.gd`): camminata continua, corsa/arresto, inversioni, auto/porta, attesa/postura, mano, collisioni e assenza di teletrasporti.
- Limite intenzionale: durante una corsa ininterrotta il padre può ancora distanziare il figlio; il recupero si completa rallentando o fermandosi.

## Pubblicazione Web

- Preset Web Godot 4.6.3 senza thread, esportazione inclusa in `web/`, script riproducibile `tools/export_web.sh` e pubblicazione statica configurata in `vercel.json`.
- Export release riuscito; avvio, rendering WebGL 2 e input movimento/Q/F verificati in Chromium su Linux, senza errori JavaScript/Godot.
- Deploy Vercel remoto non verificato da questo ambiente; browser Safari/Firefox e dispositivi mobili non verificati.

## 0.1 · Completato

- Nuovo progetto Godot Compatibility nella stessa repository; vecchia versione conservata nel ramo `backup/liminal-before-father-and-son-2026-10-15`.
- Distributore editabile, strada, auto e coperture fisiche; sprite originali padre/figlio/nemico.
- Movimento accelerato, corsa, accovacciamento e camera ortografica con zoom.
- Compagno con navigazione nativa, attesa, mano e piccolo scarto laterale per liberare il passaggio.
- Nemico con pattuglia, vista limitata, occlusione, inseguimento e cattura.
- Risorsa, uscita di entrambi, vittoria/fallimento, riavvio e HUD.
- 40 verifiche native più 3 verifiche di un percorso completo con nemico attivo, superate su Linux/Godot 4.6.3.
- Rendering OpenGL Compatibility verificato su display virtuale, comprese le schermate finali.

## Prossimi interventi

- Prova manuale su macOS e Windows, inclusi tastiera, trackpad e prestazioni.
- Revisione con l'utente di proporzioni, leggibilità e ritmo della pattuglia prima di ampliare il prototipo.

Esportazioni native Mac/Windows non ancora eseguite; nessuna dichiarazione di verifica su quelle piattaforme.
