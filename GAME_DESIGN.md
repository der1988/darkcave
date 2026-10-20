# Campo Libero · Undici sull’asfalto

Gioco locale contro IA: quattro giocatori di movimento e un portiere, identità Marco/Simone/Brad/Matt/David con 11 punti iniziali. Camera isometrica fissa, zoom iniziale 18.72, regolabile 12–34. Movimento senza scatto a 4 unità/s, sprite piccoli e pixel nitidi.

Il campo è una superficie d’asfalto con crepe, variazioni contenute e linee scolorite. I limiti giocabili sono 15 m di larghezza e 13 m davanti alla porta. Erba, alberi e tracce sull’erba non sono più istanziati. La porta usa gli originali `posts_0`/`net_up_0` di footballgame, con collisioni dei pali, traversa e fondo rete; larghezza 5.657 m, altezza 2.44 m.

## Partita

Il primo contatto è un servizio aereo da terra. Da quel momento niente dribbling o ricezione a terra: passaggi tramite piede, testa o petto e tiri soltanto al volo. Il controllo passa al ricevente in anticipo; il compagno si smarca e guarda il pallone. Una finestra di anticipo sul tiro agevola la volée senza attrarre la palla o permettere colpi remoti.

L’ultimo toccatore è responsabile di una caduta durante la costruzione o della palla fuori; va in porta senza perdere i punti personali. Il gol al volo toglie al portiere 1 punto di piede, 3 di testa o 5 di tacco/rovesciata, senza doppio conteggio. Un rimbalzo dopo il tiro non annulla la conclusione. A zero il portiere è eliminato; il marcatore subentra. Nel duello finale rimane il servizio personale. L’ultimo partecipante non eliminato vince; restart accessibile da tastiera o touch.

I contatti speciali sono classificati da altezza, orientamento e salto, non da tasti nuovi: testa da 1.2 m relativa, tacco se rivolti lontano dalla porta, rovesciata se all’indietro in salto e contatto da 0.8 m. Testa animata con i sei frame originali; petto/tacco/rovesciata richiedono pose visive dedicate in futuro. Nessuna scelta del tipo di tiro nell’interfaccia.

Le identità e i punti sono autorevoli in `match_rules.gd`; i cinque nodi attore rappresentano i posti in campo. Ai cambi di ruolo a palla morta si trasferiscono identità/punti e si riposizionano gli attori. Durante l’azione movimento e collisioni sono fisici, senza teletrasporti. Solo il terreno può essere una piattaforma per i personaggi: il pallone non può lanciarli in aria come un ascensore.

## Input e IA

PC: frecce, A tiro caricato, S passaggio corto aereo, D passaggio alto caricato, Spazio salto, H comandi, R servizio o rinuncia all’azione. Il tiro mantiene la curva di footballgame (80% ideale, sovraccarica meno potente/più alta). D va da corto/arcuato a lungo/teso. Smartphone: scelta iniziale, fullscreen landscape quando consentito, analogico a sinistra e A/S/D a destra; portrait mette in pausa e invita alla rotazione. Multi-touch e cancellazione su focus perso.

Portiere: sprite originali, predizione, tuffi, salto, uscita bassa, presa e rilancio adattati a Godot. Parata in presa chiude l’azione e prepara un nuovo servizio; nessuna IA di squadre complete o regole arbitrali aggiuntive.

Godot 4.6.3, GDScript e Compatibility/Web. Render e animazioni separati da regole, possesso e punteggi. Il mondo storico Father & Son resta inattivo.

I tre compagni senza palla occupano corsie distinte nella metà offensiva, guardano il pallone e si separano dai vicini. Il passaggio seleziona un compagno disponibile considerando distanza, direzione e avanzamento verso la porta; il ricevente intercetta il pallone alto prima di inseguirne la caduta. Palette e nomi sono centralizzati in `roster.gd`; lo shader cambia solo la maglia, preservando gli sprite originali.
