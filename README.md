# Histoire et filiations des langages

Comprendre comment les idées circulent entre langages, personnes, organisations et usages. Le projet explique les choix de conception et leurs conséquences, plutôt que de juxtaposer des fiches produits.

**État au 18 novembre 2026.** Le référentiel, la chronologie et les filiations sont consultables dans l'application React. Le build fabrique le graphe publiable à partir du métamodèle et du corpus.

## Commencer

- [Vision et parcours pédagogiques](docs/vision.md)
- [Architecture adaptée de FLOW Étude Économique](docs/architecture.md)
- [Modèle de connaissance](docs/modele-connaissance.md)
- [Méthode de recherche et de qualification](docs/methode.md)
- [Analyse de la préétude](docs/analyse-preetude.md)
- [Parcours sourcé sur SQL et l'entité-relation](docs/sql-et-entite-relation.md)
- [Parcours de Pascal à TypeScript](docs/parcours-pascal-delphi-csharp-typescript.md)
- [Programme de recherche et prochaines étapes](docs/roadmap.md)
- [Livraison Git et GitHub Pages](docs/livraison.md)
- [Versions du métamodèle, du modèle et de l’application](docs/versioning.md)
- [Historique et dérives de performance](docs/performance.md)
- [Données initiales](source/connaissances.json) et [schéma](source/schema-connaissances.json)

## Organisation

| Répertoire | Responsabilité |
|---|---|
| `sources/` | Pièces reçues, conservées sans réécriture |
| `source/` | Connaissance structurée, assertions et preuves |
| `docs/` | Vision, méthode et décisions d'architecture |
| `packages/metamodel/` | Métamodèle autonome et règles du graphe |
| `packages/contracts/` | Contrat du modèle compilé et API navigateur |
| `packages/compiler/` | Validation et compilation du graphe publiable |
| `app/` | Site React statique et modèle compilé |
| `tools/` | Commandes TypeScript de validation, fabrication et extraction |
| `skills/` | Procédures Codex pour le modèle et le métamodèle |

Les assertions issues de la seule préétude restent **à vérifier**. Les parcours documentés et les usages de JSON disposent de liens étayés.

## Entretenir et fabriquer

Avec Node.js 24.12 ou plus récent et pnpm, lancer `pnpm install --frozen-lockfile`, puis `pnpm check`, `pnpm test` et `pnpm build`. On obtient le site statique dans `app/dist`. Les outils consignent leurs mesures de performance par commit.

- [Entretenir le corpus](skills/langages-entretenir-modele/SKILL.md)
- [Faire évoluer le métamodèle](skills/langages-faire-evoluer-metamodele/SKILL.md)
- [Commandes et contrôles](tools/README.md)
