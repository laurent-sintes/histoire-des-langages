# Plan de refactorisation — Sujet

- **État** — Analyse / Préconisations à valider / Plan d'application prêt / Exécution / Bilan à clore / Clos
- **Référence Git** — SHA analysé
- **Mise à jour** — AAAA-MM-JJ

## Périmètre et résultat attendu

Indiquer le problème à résoudre, les modules concernés et les invariants qui doivent être préservés. Décrire le résultat observable qui permet de clôturer le plan.

## Analyse

| ID | Priorité | Constat et preuve | Impact ou question ouverte |
|---|---|---|---|
| A1 | À préciser | Fichier, commande ou run CI et résultat observé | À préciser |

## Préconisations à valider

| Constat | Solution recommandée et raison | Variante ou compromis | Décision |
|---|---|---|---|
| A1 | Décrire un choix par problème | Variante et raison de l'écarter | À valider |

## Plan d'application

Vérifier `consolidation.json` avant d'élaborer ou de modifier cette section. Renseigner le plan après validation des préconisations. Identifier les décisions validées, leur date et les reports. Transformer les choix retenus en lots exécutables.

| Lot | Dépendances | Travaux et périmètre | Critère de fin | État |
|---|---|---|---|---|
| 1 | Aucune | Changements, interfaces touchées et précautions de reprise | Commandes et résultats attendus | À faire |

### Détail des lots

#### Lot 1 — Action et résultat

- **Pourquoi** — Relier le lot à un constat et expliquer ce que le changement apporte.
- **Choix à discuter** — Expliquer l'approche proposée et son principal compromis. Si une autre approche est plausible, indiquer dans quel cas elle serait préférable.
- **Exécution** — Indiquer les fichiers ou interfaces concernés, les étapes dans l'ordre et les limites du lot.
- **Validation** — Indiquer les commandes ou scénarios reproductibles, avec le résultat attendu pour chacun et la preuve à conserver.
- **Point d'arrêt** — Préciser la décision qui manque, l'échec qui doit interrompre ce lot ou la condition permettant de passer au suivant.

## Résultats par constat

Ajouter une ligne à chaque changement d'issue. La dernière entrée par identifiant indique l'état courant. Les états de suivi sont `À vérifier`, `Bloqué`, `Résolu`, `Reporté`, `Abandonné` et `Rouvert`.

| Date | Constat | Lot | État | Résultat, preuve et référence d'exécution |
|---|---|---|---|---|

## Historique de l'audit

Consigner chaque clôture et réouverture. Pour la clôture, résumer les résultats et les reports. Pour la réouverture, préciser le motif et les constats concernés.

| Date | Événement | Motif ou bilan | Suite |
|---|---|---|---|

## Reprise

Indiquer les éventuels écarts depuis la référence Git, le prochain lot et ce qui demande une décision. Pour un lot interrompu, écrire la première action à reprendre. Les preuves d'exécution restent dans **Résultats par constat**.
