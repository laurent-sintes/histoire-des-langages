# Site React

Contrat produit : ../docs/vision.md. Architecture : ../docs/architecture.md.

`pnpm build` fabrique le site statique dans `app/dist`. Le build Vite régénère le modèle public compilé. Les trois vues React partagent la recherche et la sélection. Les preuves s’ouvrent depuis la fiche, une relation ou un événement.

Pour servir le site localement, exécuter `pnpm exec vite app --config app/vite.config.ts`. Les chemins d’actifs relatifs permettent le déploiement sous le nom du dépôt dans GitHub Pages.
