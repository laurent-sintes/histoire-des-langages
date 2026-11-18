---
name: langages-auditer-refactoriser
description: Préparer, consolider, amender, clore ou rouvrir un audit d’Histoire des langages et préparer ou exécuter son plan de refactorisation.
---

# Auditer et préparer un refactor

Lire [les conventions d'audit](../../../audit/README.md) et les consignes du dépôt. Utiliser le dossier existant pour la suite du même périmètre. Pour un nouveau dossier, partir du [modèle de plan](../../../audit/templates/PLAN.md) et noter le SHA analysé.

## Préparer et valider l'audit

1. Décrire le périmètre, le résultat attendu et les interfaces à préserver. Vérifier chaque constat actionnable et consigner la preuve et son impact.
2. Proposer une solution par problème, avec son compromis et une variante si elle éclaire le choix. Montrer les préconisations dans la conversation si l'utilisateur souhaite les examiner.
3. Suivre le [contrôle de consolidation](../../../audit/README.md#contrôle-de-consolidation) avant d'élaborer ou de modifier le plan. Sur demande explicite, relire l'audit dans son ensemble et enregistrer le résultat, même si aucun changement n'est nécessaire. Lors de la préparation du plan, réutiliser un contrôle valide. Intégrer dans la revue tout nouveau constat ou arbitrage pertinent reçu depuis le dernier contrôle.
4. Consigner la validation de l'utilisateur par constat. Produire la section `Plan d'application` à partir des choix validés après le contrôle de consolidation. Donner pour chaque lot ses dépendances, ses fichiers, ses étapes, ses vérifications et son point d'arrêt. Garder dans le dossier les résultats ou liens nécessaires pour reprendre après la suppression de `tmp/`.

## Exécuter sur demande

Une demande d'exécution porte sur le plan d'application et les lots à traiter. L'utilisateur peut valider les choix et demander leur exécution dans le même message. Quand il désigne seulement un plan d'application, prendre les lots prêts dans l'ordre prévu. Pour un démarrage différé, suivre l'heure et le contexte donnés par l'utilisateur.

Relire le plan et les derniers résultats par constat, vérifier l'état du checkout et comparer le SHA de référence au code actuel. Réexaminer les constats touchés par un décalage. Exécuter les travaux autorisés encore nécessaires et renseigner **Résultats par constat** après chaque lot. Marquer un lot terminé lorsque son critère de fin est vérifié. Si un lot est bloqué, noter la cause et continuer les lots indépendants qui restent dans le périmètre. Une fois le plan traité, passer l'audit en `Bilan à clore` et signaler les constats qui attendent encore une vérification ou une décision.

Pour un périmètre long ou un checkout déjà modifié, choisir un espace de travail adapté et inscrire son chemin dans le plan. Appliquer les règles de test du projet. Chaque commit ou push d'un plan exige une demande explicite qui couvre l'opération. Dans ce cas, utiliser le [skill de commit](../langages-commit/SKILL.md) ou [de push](../langages-push/SKILL.md).

## Clore, amender ou rouvrir

Suivre les [règles de clôture et de réouverture](../../../audit/README.md#résultats-clôture-et-réouverture). Pour une clôture manuelle, vérifier la dernière issue de chaque constat. Lors d'un commit demandé, le [skill de commit](../langages-commit/SKILL.md) clôt automatiquement les audits ouverts et conserve les vérifications restantes dans leur bilan. Pour un oubli dans le périmètre initial, repartir de l'historique et consolider l'audit amendé avant de réviser le plan. Pour un objectif nouveau, ouvrir un audit lié. La réouverture conserve les résultats précédents et suit les étapes habituelles de validation et d'exécution pour les seuls travaux restants.
