# Performance de l'exécution et de la livraison

- **État** — Clos
- **Référence Git** — `66cff5ea6f2f3213ecc989495d4431c81f08ae77`
- **Mise à jour** — 2026-11-18

## Périmètre

Mesurer le temps de retour après une modification locale et le délai entre le premier déclenchement CI et la publication vérifiée. L'étude part de la [livraison de l'audit du socle](../2026-11-18-socle/PLAN.md). La chronologie GitHub ne permet pas de mesurer la durée de rédaction ou d'application de chaque lot du refactor.

## Mesures

### Livraison GitHub

Les durées sont calculées à partir de `createdAt` et `updatedAt` des runs. Les étapes sont lues dans `jobs[].steps` avec `gh run view --json createdAt,updatedAt,jobs,conclusion,event`.

| Run | Durée | Observation |
|---|---:|---|
| [Push initial](https://github.com/laurent-sintes/histoire-des-langages/actions/runs/44397946664) | 6 min 56 s | 5 min 51 s sur l'installation de Chromium et de ses dépendances avant annulation. |
| [Push corrigé](https://github.com/laurent-sintes/histoire-des-langages/actions/runs/44398939381) | 1 min 17 s | Chrome livré avec le runner. Tests et Pages réussis. |
| [Déclenchement manuel](https://github.com/laurent-sintes/histoire-des-langages/actions/runs/44399299487) | 1 min 19 s | Seconde voie de livraison, à vérifier pour le constat A2 du socle. |
| [Push du bilan documentaire](https://github.com/laurent-sintes/histoire-des-langages/actions/runs/44399764333) | 1 min 48 s | Réexécution complète pour le commit qui consigne les preuves de la livraison. |

Entre le premier déclenchement, à 21:06:12 UTC, et la fin du dernier run, à 21:18:21 UTC, il s'est écoulé **12 min 09 s**. Les deux premiers runs se chevauchent. Les trois runs réussis totalisent 4 min 24 s de temps écoulé. Les durées des étapes varient sur trois échantillons. Sur ces runs, le contrôle du corpus et des versions prend de 0 à 1 s affichée par étape, l'ensemble des 28 tests de 5 à 18 s, et la tâche Pages de 16 à 33 s. L'action qui effectue la publication prend 7 s dans chaque run réussi. Le reste de la tâche Pages comprend notamment la préparation du runner et la vérification de la référence.

### Commandes locales

Windows, Node 24.22.3 et checkout propre sur `66cff5e`. Cinq passages à chaud par commande, après un passage d'amorçage, en alternant l'ordre. Le temps complet est mesuré autour de chaque lancement Node. Les mesures internes viennent du lanceur instrumenté. Le corpus fait environ 95 Ko et le build publie 48 nœuds et 53 relations.

| Commande ou scénario | Médiane complète | Médiane interne | Pic RSS typique du processus mesuré |
|---|---:|---:|---:|
| Fabrication du modèle | 615 ms | 248 ms | 85,5 Mio |
| Sélection seule avec `--plan --files tools/performance/statistics.ts` | 492 ms | — | — |
| Fichier de test des statistiques lancé directement via le lanceur instrumenté | 405 ms | 25 ms | 73 Mio |
| Même fichier découvert et lancé via la sélection incrémentale | 896 ms | 25 ms | 73,2 Mio |
| `tsc --noEmit` instrumenté | 5,15 s | 4,74 s | 707 Mio |
| Même vérification avec `--incremental`, cache conservé, sans édition entre les passages | 2,05 s | 1,65 s | 365 Mio |

Le cache TypeScript a été initialisé dans un répertoire de travail local. Son premier passage a pris 4,95 s. Les 2,05 s représentent le cas sans édition, pas encore le temps après une modification réelle. Pour reproduire, comparer `node tools/performance/run.ts check-types node_modules/typescript/bin/tsc --noEmit` avec la même commande suivie de `--incremental --tsBuildInfoFile <fichier-local>`. Pour la sélection, comparer `node tools/test/run.ts affected --files tools/performance/statistics.ts` à l'appel direct instrumenté. Aucun essai de cette série ne contient le surcoût de l'entrée `pnpm`.

La rotation est exécutée après chaque commande instrumentée en local. Sept simulations de `rotateRuns`, sans suppression, ont donné une médiane de 98 ms sur les 53 dossiers réels, 113 ms sur 100 dossiers synthétiques et 1,17 s sur 1 000 dossiers synthétiques. Les dossiers synthétiques contenaient un échantillon court et un marqueur de fin.

## Préconisations validées

Les quatre préconisations P1 à P4 ont été validées par Laurent le 18 novembre 2026.

| ID | Priorité | Préconisation | Vérification |
|---|---|---|---|
| P1 | Haute | Éviter une republication Pages lorsqu'un push modifie uniquement le bilan d'audit et que le site fabriqué reste identique. Garder les contrôles et la suite complète au push. Réserver le second déclenchement manuel aux changements qui le justifient. | Mesurer de bout en bout un push documentaire et un push qui modifie l'artefact. Confirmer que la référence utilisée pour les versions et les révisions reste le dernier déploiement réussi. |
| P2 | Haute | Tester un cache TypeScript local hors de `tmp/`, avec la vérification complète conservée en CI. | Comparer après des modifications représentatives du React, du métamodèle et des outils. Vérifier que les mêmes erreurs sont signalées avec et sans cache, y compris après suppression et changement de branche. |
| P3 | Moyenne | Réutiliser le graphe de dépendances en mémoire en mode veille entre deux sauvegardes. Charger le sélecteur TypeScript uniquement lorsque nécessaire pour les autres commandes. | Rejouer la sélection de tests, les renommages et les entrées explicites du corpus. Comparer le délai entre la sauvegarde et le lancement du bon test. |
| P4 | Moyenne | Réduire la fréquence des inventaires complets de la rotation. Conserver les règles de rétention, le plafond et la protection des dossiers actifs. | Mesurer le coût avec 100 et 1 000 sessions, y compris lorsque la rotation est nécessaire. Vérifier les traitements simultanés et le maintien de la politique validée. |

## Benchmark comparatif proposé

Comparer le baseline `66cff5e` à chaque changement candidat sur la même machine et le même corpus. Alterner les versions. Effectuer dix passages à froid et trente à chaud comme prévu dans les [règles de mesure](../../docs/performance.md). Collecter médiane, p95, CPU et RSS pour les commandes locales. Pour GitHub, relever séparément file d'attente, préparation du runner, fabrication, tests et publication. Conserver les écarts de sélection et les erreurs détectées avec les mesures.

## Plan d'application

**Ordre retenu** — P1, P2, P3, P4. Les quatre lots sont indépendants. Utiliser le même protocole avant et après chaque modification et relever le SHA du code de référence et les chemins du lot. Après chaque lot, lancer les tests locaux concernés, reconstruire le site et vérifier l'aperçu, sur le port 4173 si possible. Consigner l'URL et les résultats. Chaque commit ou push exige une demande explicite.

### P1 — Éviter de republier Pages pour un bilan d'audit seul

- **Périmètre** — `.github/workflows/ci.yml`, `tools/git/pages.ts` et les tests de livraison correspondants.
- **Travaux** — À partir du dernier SHA effectivement publié, comparer le diff complet jusqu'au candidat. Pour un push dont les seuls changements relèvent de `audit/`, exécuter toutes les validations et l'archivage des mesures. Omettre le transfert de l'artefact Pages et le job de déploiement. Conserver le déclenchement manuel pour une republication demandée et faire apparaître la décision dans la CI.
- **Critère de fin** — Un changement purement documentaire dans `audit/` suit la voie sans déploiement. Un changement de site ou une livraison antérieure non publiée qui a touché le code ou le modèle conserve la voie de publication. Vérifier ces cas sur des historiques de test locaux. À la prochaine livraison demandée, comparer les durées de bout en bout et vérifier que la voie documentaire conserve le SHA Pages précédent.
- **Point d'arrêt** — Traiter tout chemin inconnu comme une modification potentiellement publiable. Une référence Pages introuvable ou invalide reste bloquante.

### P2 — Accélérer la vérification TypeScript locale

- **Périmètre** — Commande de contrôle dans `package.json` et lanceur TypeScript existant. Cache dans `.cache/`, propre au checkout.
- **Travaux** — Comparer la vérification complète et la vérification incrémentale après une édition représentative du React, du métamodèle et des outils. Essayer une erreur de type volontaire sur une copie isolée, une suppression et un changement de branche. Activer le cache local si le gain persiste après édition et si les diagnostics concordent. La CI conserve une vérification complète.
- **Critère de fin** — Comparaison reproductible des temps, du CPU et de la mémoire, à froid et à chaud. La version candidate détecte les mêmes erreurs et signale un gain mesurable après une édition réelle.
- **Point d'arrêt** — En cas d'écart de diagnostics ou de gain limité aux passages sans édition, consigner le résultat avant de retenir la configuration.

### P3 — Réutiliser le graphe du sélecteur entre les sauvegardes

- **Périmètre** — `tools/test/run.ts`, `tools/test/impact.ts` et leurs tests.
- **Travaux** — Conserver en mémoire la résolution des dépendances tant que le mode veille tourne. Invalider les entrées affectées à la sauvegarde et reconstruire la résolution si la configuration ou le catalogue des tests change. Charger TypeScript seulement lorsqu'une résolution est nécessaire. Le mode `--since` continue de partir de Git.
- **Critère de fin** — Comparer le délai entre sauvegarde et lancement du premier test. La sélection et les raisons produites restent correctes pour les imports transitifs, les fichiers supprimés ou renommés, les nouveaux tests et les entrées JSON déclarées. Une seconde sauvegarde indépendante sélectionne uniquement ses propres tests.
- **Point d'arrêt** — Si une invalidation ne peut être déterminée correctement, refaire la résolution complète pour ce lot de sauvegardes et mesurer ce cas séparément.

### P4 — Réduire le coût de la rotation locale

- **Périmètre** — `tools/temporary/runs.ts`, ses tests et l'appel depuis `tools/performance/run.ts`.
- **Travaux** — Tester un moyen de connaître le prochain contrôle utile à partir de la date d'expiration et du volume des dossiers terminés. Repartir d'un inventaire complet quand cette information manque ou ne peut être rapprochée des dossiers. Conserver la simulation et la commande manuelle.
- **Critère de fin** — Mesurer les passages qui nécessitent ou évitent l'inventaire à 100 et 1 000 sessions. Vérifier sous exécution concurrente les délais de 14 et 30 jours, le plafond de 500 Mio et la protection des traitements actifs, des jonctions et des preuves durables.
- **Point d'arrêt** — Conserver l'inventaire complet si l'optimisation permet de dépasser le plafond ou compromet la protection des données.

## Résultats par constat

| Date | Constat | Lot | État | Résultat, preuve et référence d'exécution |
|---|---|---|---|---|
| 2026-11-18 | P1 | P1 | À vérifier | 3 tests ciblés et actionlint réussis. Avec les commits existants, le diff `edb1a4f…66cff5e` se limite à `audit/` et omet Pages au push, `f3b847b…66cff5e` nécessite Pages et le lancement manuel conserve Pages. Avant, le push documentaire déclenchait un job Pages de 33 s sur un run de 108 s. Après, la décision locale omet ce job et le transfert de l’artefact. Le gain de bout en bout et le SHA conservé restent à mesurer sur GitHub lors d’un push demandé. Aperçu vérifié sur le port 4173. |
| 2026-11-18 | P2 | P2 | Résolu | Sur 30 paires après édition dans React, métamodèle ou outils, médiane 5,39 → 2,49 s et p95 5,60 → 2,66 s. CPU médian 10,27 → 4,44 s et RSS médiane 707 → 405 Mio. Dix passages avec cache TypeScript neuf donnent 5,21 → 5,20 s. Diagnostics identiques après erreur et suppression, puis dans un clone local basculé `66cff5e → f3b847b → 66cff5e`. Cache local activé, vérification complète conservée en CI. `pnpm check`, 29 tests sélectionnés et aperçu sur 4173 réussis. |
| 2026-11-18 | P3 | P3 | Résolu | Plan documentaire à froid, médiane de 346 à 93 ms sur dix passages par version. Sélection à chaud sur le dépôt, 60 à 2 ms sur trente passages, p95 de 65 à 5 ms. Huit sauvegardes réelles par version donnent 286 à 237 ms jusqu’à la sélection, avec le délai de regroupement. Trois tests ciblés, compilation TypeScript et aperçu 4173 réussis. Les renommages, les changements de configuration et les résolutions indéterminées déclenchent une redécouverte prudente. |
| 2026-11-18 | P4 | P4 | Résolu | Inventaire à chaud avec expiration, médiane de 118 à 13 ms sur 100 traitements, et de 1 237 à 122 ms sur 1 000 (p95 de 1 297 à 145 ms). Sans expiration, 1 211 à 123 ms sur 1 000. Dix démarrages Node par format à 1 000 donnent 1 488 à 261 ms. Les nouvelles mesures sont des fichiers fermés atomiquement, avec octets réels à chaque passage. La comparaison ne supprime aucun artefact. Les quatre tests ciblés vérifient rétention, plafond, jonctions et finalisations simultanées. Les anciens dossiers conservent leur mode de contrôle. Simulation réelle et aperçu 4173 réussis. |

## Historique de l'audit

| Date | Événement | Motif ou bilan | Suite |
|---|---|---|---|
| 2026-11-18 | Validation des préconisations | P1 à P4 validées | Plan d'application préparé |
| 2026-11-18 | Lancement | Plan validé, exécution locale depuis `66cff5e` | Sans commit ni push |
| 2026-11-18 | Vérification d'intégration | Les quatre lots ont été traités dans l'ordre. Les 32 tests concernés, le contrôle des types et des sources, le build et le parcours navigateur ont réussi. L'échantillon JSON local des tests a été retrouvé avec sa tâche et son SHA. | Mesurer P1 de bout en bout sur un futur push limité à `audit/`, après la mise en service du workflow optimisé. |
| 2026-11-18 | Clôture au commit | P2, P3 et P4 résolus. P1 vérifié localement. Les 32 tests concernés et `pnpm check` ont réussi avant la livraison. | Vérifier la CI et Pages lors de la livraison, puis vérifier P1 sur un push limité à `audit/`. |
| 2026-11-18 | Livraison | `caafdd1` publié avec le métamodèle 1.1.2, le modèle 1.1.1 et l'application 1.1.3. CI complète et archivage des mesures réussis en 85 s. [Run de livraison](https://github.com/laurent-sintes/histoire-des-langages/actions/runs/44406388529) | Le push de ce bilan sert à vérifier P1. La CI du commit documentaire doit garder `caafdd1` comme SHA publié et omettre la préparation de l'artefact et le déploiement Pages. |

## Reprise

P2, P3 et P4 sont vérifiés localement et la livraison a réussi. Pour P1, consulter la décision et le résultat du push documentaire dans la [CI de validation et publication](https://github.com/laurent-sintes/histoire-des-langages/actions/workflows/ci.yml). Le run documentaire de référence durait 108 s, dont 33 s pour le job Pages. Comme l'archivage et Pages tournaient en parallèle, ces 33 s ne constituent pas une mesure du gain total.

L'aperçu du build reste accessible sur [127.0.0.1:4173](http://127.0.0.1:4173/). Le suivi de P1 est conservé au bilan de clôture.
