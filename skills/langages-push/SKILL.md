---
name: langages-push
description: Pousser main vers le dépôt personnel GitHub d’Histoire des langages, puis vérifier la CI, l’historique de performance et GitHub Pages quand il est activé.
---

# Push et vérification de la livraison

Vérifier l’état avec `pnpm git:work plan`. Si la demande couvre des changements locaux à livrer, les committer avec [langages-commit](../langages-commit/SKILL.md). Lire [les règles de version](../../docs/versioning.md) puis lancer `pnpm git:work version-plan`. La commande de push applique le niveau minimal déterminé par les tests typés. Compléter un changement sans signal de test ou choisir un niveau plus élevé si l'impact le justifie, par exemple avec `pnpm git:work push --model minor`. La première livraison à `1.1.1` s'effectue sans option.

L’outil actualise la référence GitHub et pousse exclusivement vers `laurent-sintes/histoire-des-langages`. Après un échec de transfert, reprendre la commande avec un checkout propre. Le commit de version déjà préparé est réutilisé si ses niveaux correspondent.

Relever le SHA et utiliser `pnpm git:work ci SHA` pour retrouver le run. Attendre son résultat avec `gh run watch` et consulter le résumé en cas d’échec ou de dérive. Vérifier la publication seulement si Pages est activé. Si l’historique signale une dérive, reprendre la proposition de test et d’audit du rapport avec les métriques concernées. Voir [livraison](../../docs/livraison.md) et [mesures](../../docs/performance.md).
