# Livraison Git et GitHub Pages

Le travail suit `main`. Chaque push déclenche la validation du corpus et des types, les tests, le contrôle des empreintes, l'extraction PDF de vérification et la fabrication React. Aucun environnement de branche intermédiaire n'est nécessaire pour ce flux.

Utiliser `pnpm git:work plan` pour vérifier l'état local. `pnpm git:work commit fichier-message chemin…` crée un commit sur un périmètre explicite. `pnpm git:work version-plan` montre les modules touchés et les niveaux déduits des tests typés. `pnpm git:work push` applique les [règles de version](versioning.md) avant le transfert. `pnpm git:work ci SHA` retrouve les exécutions GitHub du commit. Les skills [commit](../.agents/skills/langages-commit/SKILL.md) et [push](../.agents/skills/langages-push/SKILL.md) décrivent le déroulement.

Le workflow GitHub Actions archive les mesures sur `performance-history`. Une fois GitHub Pages configuré avec la source **GitHub Actions**, définir la variable de dépôt `PAGES_ENABLED` à `true`. La livraison prend `app/dist` et vérifie que le commit est toujours en tête de `main` avant de publier. Si le diff complet depuis le dernier SHA publié se limite à `audit/`, le push exécute tous les contrôles et conserve le déploiement existant. Le déclenchement manuel permet de republier.

La sortie Pages contient le site et les données compilées qui ont été qualifiées pour publication. Les originaux, les données éditoriales et les outils restent dans le dépôt Git. La visibilité du dépôt détermine qui peut consulter ces fichiers. Voir [le comportement de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
