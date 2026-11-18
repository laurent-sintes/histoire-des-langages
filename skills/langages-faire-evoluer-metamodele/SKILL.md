---
name: langages-faire-evoluer-metamodele
description: Faire évoluer le contrat du graphe Histoire des langages, notamment types de nœuds, verbes, révisions, maturité, citations et modèle compilé. Utiliser pour modifier la structure ou la sémantique du référentiel.
---

# Faire évoluer le métamodèle

Lire [les invariants du projet](../../AGENTS.md), [le modèle](../../docs/modele-connaissance.md) et [l'architecture](../../docs/architecture.md). Déclarer la structure, le vocabulaire anglais et les signatures de relations dans `packages/metamodel/model.ts`. Le validateur applique ces règles au corpus. Régénérer le JSON Schema avec `pnpm schema`.

- Tester le besoin sur des cas contrastés du corpus avant d'ajouter un type ou un attribut. Relier un usage par `used-for` et une réponse à un problème sourcé par `addresses` vers un `concept` de rôle `problem`.
- Pour une rupture de contrat, mettre à jour la version du métamodèle et migrer le corpus en gardant identifiants, révisions et références probantes. Versionner aussi le format public si sa représentation ou sa lecture devient incompatible. En cas de changement sémantique d'un objet, réviser cet objet et réexaminer la portée de ses preuves.
- Vérifier l'effet sur la validation, la sélection publiable et `packages/contracts/runtime.ts`. Toute donnée consommée par le frontend doit provenir du modèle compilé. Garder les pièces originales consultables à leur adresse.
- Exécuter `pnpm schema`, `pnpm check`, `pnpm test` et `pnpm build:model`. Utiliser les mesures du build pour évaluer toute proposition de changement du format public.
