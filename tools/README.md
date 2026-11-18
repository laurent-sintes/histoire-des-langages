# Outils du graphe

Installer avec `pnpm install --frozen-lockfile` sous Node.js 24.12 ou plus récent. Le verrou fixe les dépendances du métamodèle et des commandes.

| Commande | Usage |
|---|---|
| `pnpm schema` | Régénérer le JSON Schema après modification du métamodèle TypeScript. |
| `pnpm check` | Vérifier les types, le schéma généré, le corpus, les dates et les liens vers les sources. |
| `pnpm check --against ancien-corpus.json` | Comparer les révisions à un instantané du même métamodèle et contrôler la conservation des notices sources déjà référencées. |
| `pnpm check:sources` | Vérifier la présence des pièces locales et comparer leurs empreintes SHA-256. |
| `pnpm test` | Exécuter les contrôles de compilation et de lecture du graphe. |
| `pnpm build:model` | Produire le module public et afficher le volume brut et une estimation gzip des données. |
| `pnpm build` | Fabriquer l'application React statique dans `app/dist`. |
| `pnpm extract:pdf` | Rafraîchir la transcription paginée de la préétude avec PDF.js. Un chemin de sortie peut être fourni. |
| `node tools/migrate-v03-to-v04.ts ancien.json nouveau.json` | Migrer un corpus v0.3 vers le vocabulaire anglais de la v0.4 en conservant identifiants, révisions et citations. |

Les commandes utilisent Node.js et les dépendances verrouillées. PDF.js sert à l'extraction à la demande. La qualification historique s'appuie sur la lecture des sources.
