---
name: langages-push
description: Pousser main vers le dépôt personnel GitHub d’Histoire des langages, puis vérifier la CI, l’historique de performance et GitHub Pages quand il est activé.
---

# Push et vérification de la livraison

Vérifier l’état avec `pnpm git:work plan`. Si la demande couvre des changements locaux à livrer, les committer avec [langages-commit](../langages-commit/SKILL.md). Exécuter `pnpm git:work push`. L’outil pousse le commit de main uniquement vers `laurent-sintes/histoire-des-langages`.

Relever le SHA et utiliser `pnpm git:work ci SHA` pour retrouver le run. Attendre son résultat avec `gh run watch` et consulter le résumé en cas d’échec ou de dérive. Vérifier la publication seulement si Pages est activé. Si l’historique signale une dérive, reprendre la proposition de test et d’audit du rapport avec les métriques concernées. Voir [livraison](../../docs/livraison.md) et [mesures](../../docs/performance.md).
