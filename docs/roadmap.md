# Programme de recherche et livraison

## Lot 0 — fondations (réalisé)

Vision, architecture de référence, modèle vérifiable, pièce originale et extraction, inventaire des 22 fiches, premiers exemples d'assertions, programme d'élargissement. Aucun site livré à ce stade.

Le graphe comprend un [parcours étayé sur SQL et l'entité-relation](sql-et-entite-relation.md), deux usages de JSON documentés et un métamodèle autonome. Les skills et la chaîne TypeScript sont opérationnels.

## Lot 1 — premier parcours qualifié (réalisé)

Le [parcours de Pascal à TypeScript](parcours-pascal-delphi-csharp-typescript.md) suit les acteurs, les concepts transmis, les problèmes traités et la continuité de Delphi. Les dates, les relations et leurs preuves sont dans le corpus. Le coût de migration et la diffusion de Delphi restent ouverts à une étude d'adoption.

## Lot 2 — première application React

L'application affiche le référentiel, la chronologie et les relations entrantes et sortantes avec leurs preuves. La recherche et la sélection sont communes aux trois vues. La visualisation à plusieurs sauts pourra étendre cette première navigation textuelle.

## Lot 3 — élargissement par questions

| Axe | Candidats à étudier (pas encore des filiations validées) |
|---|---|
| Origines et calcul scientifique | assembleurs, Fortran, ALGOL, APL, BASIC, PL/I |
| Fonctionnel et symbolique | Lisp, Scheme, Common Lisp, ML, SML, OCaml, Haskell, F#, Clojure |
| Objets et modularité | Simula, Smalltalk, Self, Pascal, Modula-2/3, Oberon, Ada, Eiffel, Objective-C |
| Systèmes et concurrence | BCPL, B, C, C++, CSP, Newsqueak, Limbo, Erlang, Elixir, Rust, Go |
| Scripts et diffusion | shell, awk, sed, Tcl, Perl, Python, Ruby, PHP, Lua, R |
| Plateformes et mobilité | JVM, CLR, Scala, Kotlin, Swift, Dart, JavaScript, TypeScript |
| Données et documents | SQL, Datalog, Prolog, SGML, HTML, XML, JSON, YAML, modèles réseau et hiérarchique |
| Après 2015 et spécialisation | Zig, Gleam, Roc, Mojo, Carbon ; distinguer annonce, maturité et usage réel |
| Quantique | Q#, OpenQASM, Silq ; distinguer langage, bibliothèque, représentation intermédiaire et matériel |

Prioriser ce qui explique un lien manquant, un compromis ou une trajectoire. Cette liste sert à programmer la recherche ; elle n'établit aucune date ni filiation. Étudier aussi les outils et écosystèmes lorsque leur rôle explique l'adoption.

## Maturité : question ouverte, premiers repères

L'arrêt de la préétude ne démontre pas la fin de l'innovation. Swift 6, annoncé le 17 septembre 2024, met notamment l'accent sur la sécurité de la concurrence : [annonce officielle](https://www.swift.org/blog/announcing-swift-6/), consultée le 18 novembre 2026. Cela donne un premier contre-exemple à l'idée que seul le quantique apporterait du changement.

La [spécification OpenQASM 3.0](https://openqasm.com/versions/3.0/index.html), consultée le 18 novembre 2026, décrit notamment types classiques et quantiques, contrôle et synchronisation. Elle ouvre un axe spécialisé ; elle ne prouve pas un remplacement général des langages classiques.

À instruire : sécurité mémoire, concurrence, typage, vérification, calcul hétérogène, langages spécialisés et impact de l'IA sur les outils et les pratiques. Séparer nouveauté conceptuelle, diffusion industrielle et évolution de l'outillage. Ne pas conclure à la maturité sur un simple décompte de nouveaux noms.
