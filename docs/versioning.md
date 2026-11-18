# Versions des composants

Chaque module porte sa propre version de livraison. La première livraison établit chacune à `1.1.1`. La fabrication du site assemble une vue en lecture des trois versions au chemin `versions.json` de GitHub Pages.

| Module | Périmètre | Version | Attentes testées |
|---|---|---|---|
| `metamodel` | Structures et règles du graphe, schéma éditorial et validation. | [Version](../packages/metamodel/version.json) | [Catalogue](../packages/metamodel/tests.json) |
| `model` | Corpus et pièces, compilation du graphe publiable et contrat de lecture. | [Version](../source/version.json) | [Catalogue](../source/tests.json) |
| `application` | Site React, fabrication du site et dépendances déclarées du projet. | [Version](../app/version.json) | [Catalogue](../app/tests.json) |

La version de livraison du métamodèle est distincte de l'identifiant de schéma que porte le corpus. La version de livraison du modèle est distincte du numéro de format du graphe compilé et des révisions de ses objets. Ces identifiants continuent à décrire la compatibilité ou la traçabilité de leurs propres données.

| Niveau | Quand l'utiliser | Exemple depuis 1.3.4 |
|---|---|---|
| `major` | Ajout structurant ou modification profonde d'un contrat d'interface. | `2.1.1` |
| `minor` | Nouvelle fonction ou extension compatible, par exemple un paramètre facultatif. | `1.4.1` |
| `patch` | Correction. | `1.3.5` |

Chaque rang est un entier positif. Remettre les rangs inférieurs à 1 après un incrément majeur ou mineur.

La comparaison des catalogues établit un niveau minimal pour chaque module. Les tests exécutent les attentes déclarées et vérifient que chaque entrée correspond à un test.

| Changement observé | Niveau minimal |
|---|---|
| Modification d'une attente `contract` existante ou retrait de la garantie | `major` |
| Ajout d'une garantie compatible (`contract` avec `introduction: extension`) ou ajout ou évolution d'un test `feature` | `minor` |
| Ajout ou évolution d'un test `regression` | `patch` |
| Couverture d'une garantie existante (`introduction: coverage`) ou réécriture technique du test avec la même attente | Aucun à lui seul |

Garder des identifiants stables et inscrire dans `expected` la garantie observable, plutôt que les détails des mocks ou du scénario. Une correction qui rétablit une garantie conserve son attente de contrat et ajoute un test de régression. Un ajout structurant peut justifier un niveau majeur même avec des tests compatibles.

Les commits ordinaires peuvent s'accumuler sur `main`. Avant de pousser, lancer `pnpm git:work version-plan`. Le push rafraîchit la référence GitHub et applique les niveaux déduits de l'écart complet. Pour un module modifié sans signal de test, préciser le niveau, par exemple `pnpm git:work push --model minor`. Les options permettent aussi d'augmenter le niveau déduit. Une modification documentaire ou d'outillage seule peut être livrée sans incrément.

Le push prépare un commit contenant les incréments avant le transfert. Si le transfert échoue, relancer sans incrément supplémentaire. La CI contrôle les transitions par rapport au SHA qui précédait le push. Si un push direct contourne la commande et ignore une version exigée, la CI bloque le déploiement Pages.
