# Site React

Contrat produit : ../docs/vision.md. Architecture : ../docs/architecture.md.

`pnpm build` fabrique le site statique dans `app/dist`. Le build Vite régénère le modèle public compilé. Les trois vues React partagent la recherche et la sélection. Les preuves s’ouvrent depuis la fiche, une relation ou un événement.

## Aperçu local

Après une modification de code, exécuter `pnpm build` depuis la racine et servir `app/dist/` avec `node node_modules/vite/bin/vite.js preview app --config app/vite.config.ts --host 127.0.0.1 --port 4173 --strictPort`. Garder le processus actif après la réponse. Sous Windows, le lancer en arrière-plan avec `Start-Process -WindowStyle Hidden` depuis la racine du projet.

Si un aperçu de ce checkout est déjà actif, le build actualise les fichiers qu'il sert. Si le port 4173 est occupé par un autre service, essayer 4174 puis le premier port libre suivant. Vérifier l'identité du serveur avant de le réutiliser. Confirmer que la page et `versions.json` répondent et que les actifs référencés sont ceux du build courant. Communiquer l'URL réellement vérifiée, habituellement [http://127.0.0.1:4173/](http://127.0.0.1:4173/).
