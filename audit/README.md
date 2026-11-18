# Audits et plans de refactorisation

`audit/` conserve les constats, les décisions et les plans qui doivent survivre à plusieurs sessions et à la suppression de `tmp/`. Chaque audit demandé a son propre dossier. Une correction courte se traite dans le flux habituel.

Créer un dossier `AAAA-MM-JJ-sujet/` et copier le [modèle de plan](templates/PLAN.md) dans son `PLAN.md`. Ce fichier sert à relire le choix proposé et à exécuter les lots. Pour chacun, indiquer le pourquoi, le périmètre, l'ordre des étapes, les vérifications et le résultat attendu. Les décisions ouvertes et les points d'arrêt doivent être visibles. Si le dossier grossit, lier les preuves ou mesures détaillées depuis le plan.

Les preuves utiles mentionnent le SHA, les chemins du dépôt, des résultats courts ou un lien vers la CI. Les sorties brutes et les fichiers de calcul peuvent rester dans `tmp/`. Inscrire dans le dossier d'audit tout résultat indispensable à la reprise. Le dépôt est public sur GitHub. Avant de mettre un dossier sous Git, vérifier qu'il contient des éléments destinés à ce dépôt.

Le cycle de vie tient dans `PLAN.md`. Le fichier `consolidation.json` du même dossier mémorise la dernière revue de cohérence.

1. **Analyser.** Vérifier les problèmes, leur impact et leurs preuves.
2. **Préconiser.** Proposer une solution par problème et expliciter les choix que l'utilisateur peut discuter. Noter les solutions écartées lorsque le compromis est significatif.
3. **Consolider.** Relire l'audit transversalement dès que ses éléments ont changé. La consolidation peut être demandée séparément et sert de préalable à l'élaboration ou à la révision du plan.
4. **Valider les préconisations.** Consigner les choix validés, amendés ou reportés par l'utilisateur. Vérifier le contrôle de consolidation avant d'établir la section **Plan d'application** avec les seuls choix validés, leur ordre et leurs critères de réussite.
5. **Exécuter et vérifier.** Lancer les lots du plan d'application à la demande. Après chaque lot, consigner l'issue de chacun de ses constats. L'exécution est locale par défaut. Chaque commit ou push exige une demande explicite qui le couvre.
6. **Clore.** Clore automatiquement les audits ouverts lors d'un commit demandé. Une clôture manuelle reste possible à la demande. Le dossier reste consultable pour une reprise ciblée.

## Résultats, clôture et réouverture

Dans **Résultats par constat**, conserver une entrée datée par changement d'issue. Utiliser l'identifiant stable du constat, le lot, l'état, la preuve et la référence d'exécution. Une preuve peut être un test avec son résultat, un SHA ou une exécution CI. Pour un travail local, indiquer le checkout et le diff vérifié ou un lien durable vers celui-ci. Marquer `Résolu` uniquement lorsque le critère de fin du constat est vérifié. Si ce critère exige une publication, garder `À vérifier` jusqu'à sa confirmation. Un lot partiellement réussi peut donc contenir à la fois des constats résolus et des constats encore ouverts.

Pour une clôture manuelle, vérifier que chaque constat est `Résolu`, `Reporté` ou `Abandonné` et qu'aucun lot n'est en cours. Un report ou un abandon requiert une décision de l'utilisateur consignée avec sa raison. Pour un report, indiquer où reprendre le travail, avec un lien vers l'audit de suivi s'il existe. Dater la clôture dans **Historique de l'audit** et résumer les résultats et les suites reportées.

Après exécution, amender l'audit existant si l'oubli relève de son périmètre initial. Une demande d'amendement dans ce périmètre permet de rouvrir un audit `Clos`. Consigner la date, le motif et le retour à l'étape adaptée. Ajouter un identifiant pour un oubli distinct. Si une preuve montre qu'un constat résolu est de nouveau ouvert, garder son identifiant et ajouter une entrée datée qui renvoie à la preuve initiale et à la nouvelle. Le plan révisé s'appuie sur la dernière issue de chaque constat et reprend seulement les travaux encore nécessaires. Toute élaboration ou modification du plan suit de nouveau le contrôle de consolidation. Pour un nouvel objectif ou un élargissement du périmètre, créer un dossier d'audit et le relier au précédent.

### Clôture au commit

Après les vérifications préalables au commit demandé, passer à `Clos` chaque audit ouvert du checkout, dater l'événement **Clôture au commit** et inclure les plans modifiés dans le même commit. Conserver les résultats et le point de reprise de chaque constat restant, y compris les vérifications qui nécessitent un push. Clore le suivi de l'audit permet de conserver ces constats dans leur état réel. Après la livraison, consigner toute confirmation comme un résultat daté. En cas d'échec du commit, retirer les seules modifications de clôture préparées pour cette tentative et préserver les autres travaux.

## Contrôle de consolidation

Avant d'élaborer ou de modifier le contenu du plan, vérifier `consolidation.json`. Depuis le dossier d'audit, utiliser `git hash-object -- PLAN.md` et la même commande pour chaque annexe utilisée comme entrée de l'audit. Git calcule l'empreinte du fichier local, y compris avant commit. Comparer la liste des entrées et leurs empreintes à `reviewedFiles`. Un ajout, une suppression, une empreinte différente ou une nouvelle information pertinente impose une consolidation. Les traces de traitement et le fichier de contrôle restent hors de la liste des entrées.

Si le fichier manque, est illisible, porte un statut différent de `consolidated` ou si une entrée a changé, relire l'ensemble avant de travailler sur le plan. Croiser constats, preuves, préconisations, décisions, dépendances des lots, critères de fin, résultats d'exécution et consignes du projet. Corriger les incohérences qui ne changent pas un choix validé. Si un arbitrage reste nécessaire, le consigner et différer les lots concernés. Un arbitrage déjà identifié, avec son impact explicite et sans contradiction dans l'audit, est compatible avec une consolidation réussie.

Après la revue, enregistrer `status: "consolidated"`, `reviewedOn` au format `AAAA-MM-JJ`, `reviewedFiles` avec les chemins relatifs et les empreintes des fichiers finaux, et `summary` avec le résultat de la revue. Créer ou actualiser ce fichier même si la revue n'a entraîné aucune correction. Si la revue reste inachevée ou laisse une contradiction, enregistrer `status: "pending"` et expliquer le point ouvert dans `summary`. Un contrôle valide permet de passer directement au travail sur le plan. Une modification ultérieure de `PLAN.md` appelle une nouvelle vérification avant l'édition suivante. Les lignes de bilan de la consolidation restent dans le fichier de contrôle et ne changent pas l'empreinte du plan.

Le [skill du projet](../.agents/skills/langages-auditer-refactoriser/SKILL.md) décrit comment reprendre chaque étape.

Dossier initial issu de l'audit du socle. [Plan de consolidation](2026-11-18-socle/PLAN.md)
