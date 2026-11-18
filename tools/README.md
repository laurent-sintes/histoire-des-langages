# Outils du graphe

Installer avec `pnpm install --frozen-lockfile` sous Node.js 24.12 ou plus récent. Le verrou fixe les dépendances du métamodèle et des commandes.

| Commande | Usage |
|---|---|
| `pnpm schema` | Régénérer le JSON Schema après modification du métamodèle TypeScript. |
| `pnpm check` | Vérifier les types, le schéma généré, le corpus, les dates et les liens vers les sources. |
| `node tools/performance/run.ts check-revisions tools/knowledge.ts check --against ancien-corpus.json` | Comparer les révisions à un instantané du même métamodèle et contrôler la conservation des notices sources déjà référencées. |
| `pnpm check:sources` | Vérifier la présence des pièces locales et comparer leurs empreintes SHA-256. |
| `pnpm test` | Exécuter tous les tests locaux découverts sous `tools/`. |
| `pnpm test:affected --since <SHA>` | Sélectionner les tests concernés par les modifications Git depuis le SHA, par défaut `origin/main`. Ajouter `--plan` pour afficher les raisons ou utiliser `--files <chemins…>` pour isoler les fichiers d'un lot non commité. |
| `pnpm test:watch` | Relancer les tests associés à chaque groupe de sauvegardes. |
| `pnpm tmp:rotate` | Simuler la rotation des traitements locaux terminés. L'option `--apply` applique la rotation. |
| `pnpm build:model` | Produire le module public et afficher le volume brut et une estimation gzip des données. |
| `pnpm build` | Fabriquer l'application React statique dans `app/dist`. |
| `pnpm extract:pdf` | Rafraîchir la transcription paginée de la préétude avec PDF.js. Un chemin de sortie peut être fourni. |
| `node tools/migrate-v03-to-v04.ts ancien.json nouveau.json` | Migrer un corpus v0.3 vers le vocabulaire anglais de la v0.4 en conservant identifiants, révisions et citations. |

Les commandes utilisent Node.js et les dépendances verrouillées. Le contrôle TypeScript local réutilise `.cache/typecheck.tsbuildinfo`. La CI effectue une vérification complète. PDF.js sert à l'extraction à la demande. La qualification historique s'appuie sur la lecture des sources.

Le sélecteur suit les imports TypeScript par fichier. Déclarer dans `tools/test/impact.ts` les entrées lues hors imports. Une incertitude de résolution est signalée avec le code de sortie 2 après les tests connus. Les fichiers de configuration partagés déclenchent tous les tests concernés par l'environnement TypeScript.

Pour le parcours navigateur en local, installer Chromium avec `pnpm exec playwright install chromium`. Sous Windows le test peut aussi utiliser Chrome déjà installé. La CI fabrique le site et exécute le parcours avec le Chrome fourni par le runner Ubuntu. En local, le test sélectionné fabrique le site avant de le servir.

Les commandes instrumentées recréent `tmp/runs/` et contrôlent la rotation après leur exécution. Chaque nouvelle mesure passe d'un fichier actif à un JSON classé par renommage atomique. Le contrôle utilise la taille réelle du fichier. Les anciens dossiers restent contrôlés selon la même politique. Les traitements terminés sont admissibles après 14 jours en cas de réussite, 30 en cas d'échec, puis du plus ancien au plus récent si le plafond de 500 Mio est dépassé. Les traitements actifs, les éléments non classés et les répertoires contenant des jonctions restent en place. Utiliser `KNOWLEDGE_ROTATION_SIMULATE=true` pour simuler la rotation lors d'une commande instrumentée. Le cache pnpm est dans `.cache/pnpm-store`, les builds servis dans `app/dist` et les preuves durables dans `audit/`.
