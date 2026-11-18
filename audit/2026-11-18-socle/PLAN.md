# Consolidation du socle du projet

- **État** — Clos
- **Référence Git** — `f3b847bb1332dbe15a2c5efd0ee7f4deda82fad8`
- **Mise à jour** — 2026-11-18

## Périmètre et résultat attendu

Fiabiliser la livraison, la provenance des données et la reprise des traitements locaux avant d'élargir le corpus. Conserver le flux direct sur `main`, les trois versions de livraison et la séparation entre métamodèle, modèle et site. La CI de référence est verte. Les écarts ci-dessous décrivent les garanties encore manquantes. [Exécution de référence](https://github.com/laurent-sintes/histoire-des-langages/actions/runs/44382516867)

## Constats

| ID | Priorité | Constat et preuve |
|---|---|---|
| A1 | Haute | Deux avis élevés ont été signalés par `pnpm audit` dans l'outillage de développement, PDF.js 5.6.205 et Zod 4.1.13. Le contrôle production ne signalait aucun avis lors de l'audit. [PDF.js](https://github.com/advisories/GHSA-hq66-cqwq-w95j) · [Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |
| A2 | Haute | Un test sur trois commits temporaires a reproduit un contrôle de version contourné par la base de comparaison. Le changement applicatif est refusé entre A et B, puis la modification documentaire entre B et C est acceptée à partir de B. De plus, `workflow_dispatch` saute ce contrôle. [Workflow](../../.github/workflows/ci.yml) |
| A3 | Haute | La validation structurelle accepte une modification de nœud et de notice source à révision identique. La comparaison historique existe via `--against` et reste facultative en CI. [Outil de validation](../../tools/knowledge.ts) |
| A4 | Moyenne | Le validateur a accepté un cycle de dérivation à deux technologies lors d'un test sur une copie du corpus. [Validateur](../../packages/compiler/validate.ts) |
| A5 | Moyenne | Le test de contrat du site interroge sa configuration. Un contrôle en CI du site effectivement construit reste à ajouter. [Tests de contrat](../../tools/git/versions.test.ts) |
| A6 | Moyenne | Les skills sont joignables depuis `AGENTS.md` par lien explicite. Leur emplacement actuel ne correspond pas au répertoire de découverte automatique du dépôt. [Règles du dépôt](../../AGENTS.md) · [Documentation Codex](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills) |
| A7 | Moyenne | Une copie isolée a fabriqué le site et le graphe après un démarrage sans `tmp/`, avec les dépendances déjà installées. Le `tmp/` réel mélangeait traces, instantanés d'audit et cache pnpm. [Sorties du build](../../app/README.md) · [Mesures](../../docs/performance.md) |
| A8 | Moyenne | `pnpm test` lance les trois fichiers de tests à chaque appel. Le fichier des tests de versionnement importe aussi le métamodèle, le compilateur et la configuration Vite. Une modification locale ciblée peut ainsi déclencher des vérifications sans rapport avec elle. [Commandes](../../package.json) · [Tests de versionnement](../../tools/git/versions.test.ts) |

## Préconisations validées

| Constat | Solution recommandée | Variante ou compromis | Décision |
|---|---|---|---|
| A1 | Mettre à jour uniquement PDF.js et Zod, puis comparer le schéma et le graphe obtenus. | Une mise à jour générale étendrait le périmètre des régressions. Elle se justifie si les deux corrections ne peuvent pas être installées seules. | Validé |
| A2 | Comparer tout candidat au dernier SHA effectivement publié sur Pages. Utiliser la même règle sur push et lancement manuel, avec une livraison à la fois sur `main`. | Une référence Git dédiée faciliterait la lecture locale et les livraisons sans Pages, au prix d'un état supplémentaire à maintenir. | Validé |
| A3 | Exécuter en CI la comparaison des révisions du corpus avec ce même SHA. Prévoir une conversion explicite pour les changements de schéma. | Le contrôle local actuel garde une utilité avant le commit. La CI doit appliquer la règle sur les deux chemins de livraison. | Validé |
| A4 | Refuser les cycles des relations définies comme descendance. | Un contrôle sur toutes les arêtes rejetterait des influences réciproques légitimes. | Validé |
| A5 | Tester en CI un parcours court sur le site statique effectivement construit. | Une suite navigateur plus large couvrirait davantage d'interactions, avec plus de maintenance. | Validé |
| A6 | Regrouper les skills dans `.agents/skills/` avec un seul exemplaire par nom. | Les liens explicites actuels restent utilisables si le déplacement doit être reporté. | Validé |
| A7 | Séparer traces de traitement, preuves durables et sorties servies. Simuler une rotation sur les dossiers clos avec 14 jours pour les réussites, 30 pour les échecs et un plafond initial de 500 Mio. | Une règle par âge seul est plus simple, mais ne limite pas un pic de volume. Le futur serveur local reste un chantier distinct. | Validé |
| A8 | Sélectionner les fichiers de test qui dépendent des fichiers modifiés, directement ou par des imports intermédiaires. Utiliser la même sélection à la sauvegarde et après un lot Git. | Utiliser la résolution TypeScript déjà disponible et déclarer seulement les entrées lues hors imports. Une table par module serait plus simple, mais trop large pour reproduire le comportement attendu à la sauvegarde. | Validé |

### Arbitrages validés le 18 novembre 2026

- **Livraison** — Le dernier déploiement Pages réussi fait foi, même si une CI plus récente est verte.
- **Rotation** — 14 jours pour les réussites, 30 pour les échecs et un plafond de 500 Mio pour les dossiers clos. Simuler la rotation avant activation. Le serveur d'aperçu relève d'une demande distincte.
- **Tests locaux** — Sélection par fichier de test, mode veille pour la dernière sauvegarde et comparaison Git pour vérifier le lot entier avant de rendre la main.

## Plan d'application

**Ordre retenu** — Lots 1, 2, 3, 7, 4, 5, puis 6. Le lot 3 dépend techniquement du lot 2. Placer le lot 7 après les trois priorités hautes permet d'utiliser la sélection de tests dès le lot 4. Les autres lots peuvent avancer si l'un est bloqué, sous réserve de traiter les fichiers partagés dans un ordre compatible.

Au démarrage, relever le SHA et l'état du checkout, préserver les travaux en cours et réexaminer les constats si les fichiers concernés ont changé depuis la référence d'audit. Avant la disponibilité du lot 7, lancer les fichiers de test concernés avec le lanceur TypeScript instrumenté. Ensuite utiliser `pnpm test:affected --files <chemins…>` pour isoler les modifications du lot dans le checkout ou `pnpm test:affected --since <SHA>` pour un lot Git. Après chaque lot, consigner les vérifications, leurs résultats et une preuve durable par constat. L'exécution est locale. Chaque opération de commit ou de push exige une demande explicite qui la couvre. Lors d'une livraison demandée, appliquer les règles de versionnement des trois modules. La CI de push exécute la suite complète.

| Lot | Constats | Dépendance | Périmètre principal | État |
|---|---|---|---|---|
| 1 | A1 | — | `package.json`, `pnpm-lock.yaml`, schéma et extraction PDF | Terminé |
| 2 | A2 | — | `tools/git/delivery.ts`, `.github/workflows/ci.yml`, règles de livraison | Vérifié localement |
| 3 | A3 | 2 | `tools/knowledge.ts`, corpus de référence, contrôle CI | Vérifié localement |
| 7 | A8 | — | `package.json`, lanceur et fichiers de test sous `tools/`, `AGENTS.md` | Terminé |
| 4 | A4, A5 | — | Métamodèle, validateur, `app/dist/`, tests et CI | Vérifié localement |
| 5 | A6 | — | `skills/`, `.agents/skills/`, consignes et liens relatifs | Terminé |
| 6 | A7 | — | Producteurs de `tmp/`, rotation TypeScript, mesures et preuves d'audit | Terminé |

### Détail des lots

#### Lot 1 — Mettre à jour l'outillage concerné

- **Pourquoi et choix proposé** — Traiter les deux avis d'A1 par une mise à jour ciblée. Pour Zod, inspecter la différence du schéma généré avant de l'accepter. Une mise à jour plus large se justifie si les versions corrigées ne sont pas compatibles avec la chaîne actuelle.
- **Exécution** — Vérifier les avis en vigueur, puis mettre à jour les dépendances concernées dans `package.json` et `pnpm-lock.yaml`. Relancer la génération du schéma et examiner ses différences. Adapter le code d'extraction ou de validation uniquement si nécessaire.
- **Validation** — Exécuter `pnpm audit`, `pnpm check`, les tests locaux affectés par les mises à jour, `pnpm extract:pdf tmp/preetude-audit.txt` et `pnpm build`. Les avis ciblés doivent disparaître. L'extraction doit produire les dix pages et le graphe publiera le même contenu pour un corpus inchangé. La CI de push exécute la suite complète.
- **Point d'arrêt** — Si la mise à jour impose un changement de contrat du métamodèle ou une migration de données, documenter cet écart avant d'étendre le lot.

#### Lot 2 — Utiliser une référence de livraison validée

- **Pourquoi et choix proposé** — Empêcher qu'un commit refusé devienne la base du contrôle suivant. Prendre comme référence le dernier SHA dont la livraison Pages a réussi. Une référence Git dédiée serait plus simple à lire localement, mais introduirait un état supplémentaire à maintenir et à synchroniser.
- **Exécution** — Identifier dans GitHub la référence de livraison et vérifier qu'elle est ancêtre de la cible. Factoriser le contrôle dans `tools/git/delivery.ts`, puis le rendre obligatoire dans `.github/workflows/ci.yml` pour les deux déclencheurs. Avant publication, vérifier sous la même règle de concurrence que la cible est toujours en tête de `main` et que la référence de livraison est encore celle utilisée par les contrôles. Si la référence a changé, recalculer les contrôles de livraison sur la nouvelle base avant de publier. Attendre le résultat d'une livraison en cours avant de préparer de nouvelles versions. Après un refus, recalculer l'écart complet depuis le dernier déploiement réussi.
- **Validation** — Rejouer A→B→C dans un dépôt de test. A est livré, B modifie l'application sans incrément et C ajoute de la documentation. Le contrôle doit refuser B et C tant que la version manque. Vérifier l'acceptation après ajout de l'incrément, l'appel du même contrôle en déclenchement manuel et la réévaluation d'un candidat lorsque sa référence change pendant la CI.
- **Point d'arrêt** — Si la dernière livraison validée est introuvable ou si elle ne fait pas partie de l'historique de la cible, arrêter la livraison et consigner le SHA et le motif.

#### Lot 3 — Contrôler les révisions du corpus en CI

- **Pourquoi et choix proposé** — Rendre vérifiable la traçabilité des nœuds et des sources. Réutiliser la référence du lot 2 et le contrôle `--against`, afin que le versionnement de livraison et celui des objets comparent le même changement.
- **Exécution** — Extraire `source/connaissances.json` depuis le SHA de référence et passer cette copie au contrôle de révisions. Inclure ce contrôle dans la réévaluation du lot 2 si la référence change avant publication. Rendre ce contrôle réutilisable sans dupliquer ses règles. Documenter comment normaliser la référence lorsqu'une migration explicite change le format du corpus.
- **Validation** — Sur un corpus de test, refuser un changement de nœud sans hausse de révision et une réécriture d'une ancienne notice source. Accepter le même changement avec une nouvelle révision et une source dont les anciennes références restent résolubles. Exécuter `pnpm check` et les tests locaux affectés. La CI de push exécute la suite complète.
- **Point d'arrêt** — En cas de format historique non comparable, signaler le besoin de migration avant de valider la publication.

#### Lot 4 — Vérifier les filiations et le site fabriqué

- **Pourquoi et choix proposé** — Étendre les contrôles à deux angles morts d'A4 et A5. Cibler les relations de descendance pour les cycles. Tester un parcours utilisateur court sur la sortie statique pour garder la CI rapide.
- **Exécution** — Définir les types de liens de descendance dans le métamodèle et vérifier leurs cycles dans le validateur. Ajouter à la CI un test navigateur qui sert la sortie `app/dist/` après le build et fait la distinction entre démarrage du serveur et disponibilité du site.
- **Validation** — Une boucle de dérivation échoue et une influence réciproque étayée reste représentable. Sur le site, rechercher une technologie, ouvrir une preuve et vérifier les trois clés de `versions.json`.
- **Point d'arrêt** — Si un lien du corpus est détecté en cycle, examiner ses preuves et sa qualification avant de modifier les données. Si le parcours navigateur est bloqué, poursuivre le contrôle de filiation et consigner séparément les résultats d'A4 et d'A5.

#### Lot 5 — Rendre les skills découvrables

- **Pourquoi et choix proposé** — Permettre la découverte des skills depuis un clone du projet. Retenir un emplacement unique sous `.agents/skills/` pour éviter la divergence entre deux copies.
- **Exécution** — Déplacer les dossiers de skills et mettre à jour `AGENTS.md`, les index et les liens relatifs entre skills. Conserver les noms des skills.
- **Validation** — Vérifier les en-têtes et tous les liens locaux touchés. Confirmer la présence d'un seul fichier `SKILL.md` par nom au chemin documenté. Si la session permet de vérifier la découverte depuis un nouveau contexte Codex, consigner aussi le résultat.
- **Point d'arrêt** — Si le répertoire cible est protégé, laisser la route actuelle utilisable et noter le blocage.

#### Lot 6 — Organiser les traitements temporaires

- **Pourquoi et choix proposé** — Préserver la capacité de diagnostic et rendre `tmp/` sacrifiable. Distinguer les traces de traitement, les pièces d'audit durables et les sorties servies. Un aperçu stable peut utiliser une copie du build en dehors de `tmp/` si le besoin est confirmé.
- **Exécution** — Inventorier les traces à conserver, les instantanés uniques, les caches et les dépendances qui référencent `tmp/`. Mettre les pièces durables dans le dossier d'audit et donner aux caches un emplacement distinct des traces de traitement. Implémenter la rotation TypeScript sur les seuls dossiers de traitements clos. Appliquer les durées validées puis le plafond de 500 Mio, en sélectionnant les dossiers clos les plus anciens en premier si nécessaire. Simuler la rotation sur le répertoire réel avant activation. Pour un futur serveur d'aperçu, utiliser un emplacement hors de `tmp/`.
- **Validation** — Refaire un build à partir d'une copie sans `tmp/`. Tester la rétention, le plafond et la purge sur des dossiers de test. La simulation indique les seuls dossiers clos admissibles et préserve les traitements actifs, les jonctions et les preuves durables. Vérifier que la collecte des mesures de CI reste utilisable.
- **Point d'arrêt** — Identifier les instantanés uniques avant d'activer la purge. L'emplacement et la durée de conservation des aperçus restent à convenir si le skill de serveur local est demandé.

#### Lot 7 — Relancer localement les tests qui dépendent des fichiers modifiés

- **Pourquoi et choix proposé** — Travailler à la granularité du fichier de test. Réutiliser la résolution des imports TypeScript pour retrouver ses dépendances directes et transitives. Déclarer explicitement les rares entrées lues hors imports, comme le corpus JSON. Scinder les fichiers qui mélangent des tests indépendants. Garder le graphe en mémoire et recalculer les liens qui changent, sans cache persistant ni instrumentation de couverture.
- **Exécution** — Construire le sélecteur TypeScript et le brancher au lanceur instrumenté. Ajouter `pnpm test:watch` pour les dernières sauvegardes. Regrouper les événements d'une même sauvegarde et ignorer les sorties générées. Ajouter `pnpm test:affected --since <SHA>` pour vérifier l'ensemble d'un lot, même committé. Ce mode compare au dernier `origin/main` connu localement si aucun SHA n'est indiqué et inclut les changements indexés, non indexés, nouveaux, supprimés et renommés. Le mode `--plan` explique pourquoi chaque fichier de test est sélectionné.
- **Règle de travail** — Après toute modification de sources, lancer `pnpm test:affected` avant de rendre la main, avec le SHA de départ du lot si nécessaire. Indiquer les fichiers de test exécutés et leur résultat, ou signaler explicitement une sélection vide ou indéterminée. La règle figure dans `AGENTS.md` et s'applique aussi après un lot de refactorisation.
- **Validation** — Modifier la logique des statistiques et vérifier que seuls ses tests sont exécutés. Modifier le métamodèle et vérifier que les dépendances transitives sont prises en compte. Modifier un fichier JSON déclaré comme entrée et vérifier la relance de ses lecteurs. Faire deux sauvegardes indépendantes et vérifier que la seconde ne relance pas les tests de la première. Tester aussi un test ajouté, une dépendance renommée et un lot déjà committé. Un changement documentaire seul ne lance aucun test. La CI de push continue d'exécuter la suite complète.
- **Point d'arrêt** — Si un chargement dynamique ou une suppression empêche de déterminer précisément l'impact, élargir au seul périmètre connu et l'indiquer. Si le périmètre lui-même est inconnu, signaler la sélection indéterminée et identifier les vérifications ciblées encore possibles avant de rendre la main. Si A5 est retenu, la CI exerce le parcours navigateur sur le site fabriqué même lorsque la sélection locale omet ce parcours.

## Résultats par constat

À renseigner après l'exécution de chaque lot. La dernière entrée par constat donne son issue courante.

| Date | Constat | Lot | État | Résultat, preuve et référence d'exécution |
|---|---|---|---|---|
| 2026-11-18 | A7 | 6 | Résolu | Checkout principal sur `f3b847b`. Cache pnpm dans `.cache/pnpm-store` et installation figée vérifiée dans un dossier neuf. Simulation réelle avec zéro dossier admissible. Une copie sans `tmp/` ni build recrée le site et `tmp/runs/`. Chemin de collecte des mesures de CI vérifié en mode simulé. Les 28 tests concernés passent, dont les durées de rotation, le plafond, les traitements actifs et les jonctions. Les anciens dossiers non classés restent hors rotation. Quatre instantanés uniques ont été [archivés](preuves/instantanes-corpus.zip) et vérifiés par SHA-256. |
| 2026-11-18 | A6 | 5 | Résolu | Checkout principal sur `f3b847b`. Cinq skills déplacés sous `.agents/skills/`, un seul exemplaire chacun. En-têtes et liens des skills et des quatre documents d’entrée vérifiés. `codex debug prompt-input` détecte les cinq skills dans le contexte local. `test:affected` ne sélectionne aucun test pour ces changements documentaires. |
| 2026-11-18 | A4 | 4 | Résolu | Checkout principal sur `f3b847b`. Le test de contrat rejette une boucle mixte `derived-from` / `inherits-from` et accepte l’influence réciproque. Corpus réel, schéma, graphe et comparaison historique vérifiés. |
| 2026-11-18 | A5 | 4 | À vérifier | Checkout principal sur `f3b847b`. 26 tests concernés par les dépendances, dont la recherche TypeScript, l’ouverture d’une preuve et le manifeste des versions sur le build servi sous le chemin Pages. Le test passe aussi seul en mode préfabriqué. Exécution sur GitHub à confirmer lors d’une livraison demandée. |
| 2026-11-18 | A8 | 7 | Résolu | Checkout principal sur `f3b847b`. 24 tests concernés par la modification de `package.json`, contrôle TypeScript réussi. Les plans ciblent le seul test de statistiques, les dépendances transitives du métamodèle et les lecteurs déclarés du corpus. Markdown seul produit une sélection vide. Deux sauvegardes réelles dans une fixture relancent chacune le seul fichier attendu. Suppression et entrée hors imports testées. Comparaison Git vérifiée sur un commit antérieur, sans créer de commit. |
| 2026-11-18 | A3 | 3 | À vérifier | Checkout principal sur `f3b847b`. 11 tests ciblés et `pnpm check` réussis. Le contrôle `--against-ref` passe sur le SHA réellement publié. Les scénarios locaux refusent une modification de nœud à révision égale et la réécriture d’une notice, puis vérifient la conservation des citations. Intégration au workflow à confirmer lors d’une livraison demandée. |
| 2026-11-18 | A2 | 2 | À vérifier | Checkout principal sur `f3b847b`. L’API confirme le déploiement réussi 7894190595 pour ce SHA. 9 tests ciblés, vérification TypeScript et contrôle de référence réelle réussis. Scénarios A→B→C et changement de référence couverts sur données de test sans création de commit. Exécution des deux déclencheurs et publication GitHub à confirmer lors d’une livraison demandée. |
| 2026-11-18 | A1 | 1 | Résolu | Checkout principal sur `f3b847b`, diff local des dépendances et du schéma. PDF.js 6.2.108 et Zod 4.6.6. `pnpm audit --json` donne 0 avis. Schéma équivalent par réutilisation de la définition du tableau et conservation de `minItems: 1`. Graphe de SHA-256 `B99B8D0A6DA038CEC13974EF45CCA0977CE52E0DB177EA3BDC224656829F934D` avant et après. 17 tests ciblés, 10 pages extraites, contrôle du corpus et build réussis. |
| 2026-11-18 | A2 | 2 | Résolu | Les contrôles de versions et le déploiement de `edb1a4f` ont réussi après un push puis un lancement manuel. [Run du push](https://github.com/laurent-sintes/histoire-des-langages/actions/runs/44398939381) · [Run manuel](https://github.com/laurent-sintes/histoire-des-langages/actions/runs/44399299487) |
| 2026-11-18 | A3 | 3 | Résolu | Le contrôle des révisions du corpus passe depuis la référence du dernier déploiement réussi sur les deux déclencheurs. Les mesures de `check-revisions` sont archivées pour `edb1a4f`. [Historique des mesures](https://github.com/laurent-sintes/histoire-des-langages/tree/performance-history/samples/edb1a4fdf827e179e2f1b2e8ff16a104d9bd5f5b) |
| 2026-11-18 | A5 | 4 | Résolu | Le run du push affiche 28 tests réussis, dont le parcours avec Chrome sur le build. Sur le site Pages public, la recherche TypeScript et l'ouverture d'une preuve fonctionnent. Le manifeste public annonce `metamodel 1.1.2`, `model 1.1.1` et `application 1.1.2`. [Site publié](https://laurent-sintes.github.io/histoire-des-langages/) · [Manifeste](https://laurent-sintes.github.io/histoire-des-langages/versions.json) |

## Historique de l'audit

| Date | Événement | Motif ou bilan | Suite |
|---|---|---|---|
| 2026-11-18 | Validation des préconisations | A1 à A8 et les trois arbitrages validés par Laurent | Plan d'application préparé pour relecture |
| 2026-11-18 | Exécution locale | Lots 1, 2, 3, 7, 4, 5 puis 6 traités depuis `f3b847b`. Résultats vérifiés par constat. Au dernier contrôle, 28 tests concernés passent, `pnpm check` et `pnpm check:sources` réussissent, `pnpm audit` indique zéro avis et actionlint valide le workflow. Le checkout contient les changements locaux. | Confirmer A2, A3 et A5 sur GitHub à l’occasion d’une livraison demandée. |
| 2026-11-18 | Clôture au commit | A1, A4, A6, A7 et A8 résolus. Les 28 tests concernés, le contrôle du corpus, les empreintes des sources et le build ont réussi avant le commit. | Confirmer A2, A3 et A5 pendant la livraison demandée. |
| 2026-11-18 | Vérification de la livraison | A2, A3 et A5 confirmés sur GitHub. Le premier run a été annulé après plusieurs minutes à l'étape d'installation de Chromium. Le correctif `edb1a4f` utilise Chrome fourni par le runner. | Résultats archivés. |

## Reprise

**Suivi après clôture** — A1 à A8 sont résolus. Le bilan, les résultats de CI et les preuves de publication sont consignés ci-dessus.
