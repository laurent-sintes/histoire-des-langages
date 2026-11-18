# Compilation du graphe

`build.ts` lit et valide `source/connaissances.json`. `compile.ts` sélectionne les objets étayés, remplace les références répétées par des indices et trie les événements de la chronologie.

Le module `app/generated/knowledge.ts` expose l'API de lecture. Les positions numériques sont locales à chaque build. Utiliser les identifiants stables dans les URL ou les sélections sauvegardées. Les révisions de sources et leurs citations peuvent être résolues directement depuis les objets publics.
