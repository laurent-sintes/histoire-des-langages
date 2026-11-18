---
name: langages-entretenir-modele
description: Enrichir ou corriger le graphe Histoire des langages avec des acteurs, technologies, filiations, usages, événements et preuves sourcées. Utiliser pour rechercher, qualifier ou réviser les données du corpus.
---

# Entretenir le modèle

Depuis la racine, lire [la méthode](../../docs/methode.md) et [le modèle](../../docs/modele-connaissance.md). Travailler dans `source/connaissances.json` et conserver les pièces reçues dans `sources/`.

1. Rechercher les identifiants et alias existants. Ajouter des liens orientés et préciser le rôle, l'idée transmise ou l'usage attesté. Pour une même technologie, plusieurs usages peuvent coexister.
2. Attacher la preuve au nœud, à l'arête, au jalon ou à l'assertion qu'elle soutient. Réutiliser la référence bibliographique exacte `source@sourceRevision`, en précisant passage et portée. Ajouter une révision de source lorsque le document de référence change.
3. Augmenter la révision des objets édités. Utiliser `substantiated` lorsque le passage permet de vérifier l'énoncé. Une arête publiée exige des extrémités étayées. Une preuve d'identité d'un nœud couvre son identification.
4. Exécuter `pnpm check` et `pnpm build:model`. Pour une révision d'un corpus existant au même format, garder une copie avant édition et contrôler avec `pnpm check --against chemin.json`. Examiner le nombre d'éléments qui entrent dans le modèle public.

Lors d'un ajout de pièce locale, enregistrer son empreinte SHA-256 dans la notice et vérifier avec `pnpm check:sources`.

Si le besoin concerne la structure des objets ou la sémantique d'un verbe, lire le skill [d'évolution du métamodèle](../langages-faire-evoluer-metamodele/SKILL.md).
