# Modèle de connaissance v0.4

Le métamodèle est défini dans `packages/metamodel/model.ts`. Le JSON Schema est généré dans `source/schema-connaissances.json`. Le corpus éditable est `source/connaissances.json`.

## Objets

| Objet | Rôle |
|---|---|
| `Party` | Acteur de type `person` ou `organization` (entreprise, fondation, équipe identifiée) |
| `Technology` | `concept` pour une idée ou pratique, `product` pour une réalisation nommée |
| Assertion | Énoncé qualifié sur un nœud, par exemple une observation de vitalité |
| Relation | Arête orientée avec une preuve et une période facultative |
| Événement | Assertion datée, avec nature de jalon et précision de date |
| Source | Pièce ou publication identifiable, date de consultation, qualité et localisation |
| Preuve | Référence à une source et à un passage ; portée de ce que la source soutient |

Le graphe est la structure centrale. `parties` et `technologies` partagent un espace d'identifiants. Les assertions, événements et relations portent les preuves. Les identifiants du corpus initial sont conservés.

`product` désigne une réalisation identifiable, commerciale ou libre, comme C, SQL, JSON ou PostgreSQL. Un concept peut être un modèle (entité-relation), une famille (NoSQL) ou une pratique (stockage). Langage, format et plateforme peuvent servir de descriptions éditoriales. Une technologie peut avoir plusieurs usages. JSON a deux liens `used-for` vers l'échange et le stockage, chacun avec son contexte et sa preuve.

## Liens autorisés

De `Party` vers `Technology`, `created` attribue une création, `influenced` une influence humaine ou institutionnelle, `supports` un soutien ou un pilotage, et `contributes-to` une participation plus générale. Préciser le rôle et la période lorsque la source le permet.

De `Technology` vers `Technology` :

- `derived-from` : dérivation directe, du dérivé vers l'antécédent.
- `inherits-from` : continuité documentée, de l'héritier vers l'antécédent.
- `inspired-by` : influence sur un aspect précis, de la technologie influencée vers sa source d'inspiration.
- `resembles` : comparaison ; ne doit pas apparaître comme filiation.
- `implements` : réalisation qui fournit concrètement la technologie cible.
- `applies` : technologie qui met en pratique une autre technologie ou un concept.
- `succeeds` : succession documentée, distincte d'une supériorité technique.
- `used-for` : technologie vers un concept d'usage. La période indique la portée de l'attestation, par exemple PostgreSQL 9.2 pour le stockage de JSON en 2012.
- `addresses` : technologie vers un concept de rôle `problem`. Le texte du lien explique la réponse apportée dans son contexte. La preuve peut porter sur un objectif déclaré ou sur une réponse technique observée. Un problème peut recevoir plusieurs réponses, et une technologie peut répondre à plusieurs problèmes.

Formuler un problème en termes de besoin ou de contrainte, par exemple « Maintenir de grandes bases JavaScript ». Les mécanismes tels que le typage structurel restent des concepts techniques. Un lien `addresses` documente le rapport entre une solution et le problème. Il peut être exploré dans les deux sens.

Ne pas déduire A → C du seul chemin A → B → C. Plusieurs parents sont autorisés. Une contribution commune ne prouve pas qu'une idée a été transférée. La future vue peut inverser les flèches pour lire chronologiquement, en conservant la sémantique du contrat.

## Maturité, révisions et preuves

Chaque acteur, technologie, arête, assertion et événement porte `maturity`, `revision` et `evidence`. La maturité vaut `unverified`, `substantiated`, `disputed` ou `hypothesis`. Une citation indique directement `source`, `sourceRevision`, `locator` et `scope`. Une source bibliographique peut avoir plusieurs révisions simultanément pour que les anciennes citations gardent leur sens. Une pièce locale porte une empreinte SHA-256 dans sa notice révisée.

`substantiated` exige une citation primaire ou académique et une relecture de sa portée. Pour un nœud, cela étaye son identité. Les assertions sur son histoire ou son rôle ont leurs propres preuves. Les liens, événements et assertions publics exigent des nœuds étayés.

La révision éditoriale est un entier croissant par objet. L'identifiant reste stable. Le corpus contient l'état courant de ces objets. Conserver leurs états antérieurs dans l'historique du dépôt ou dans un instantané utilisé comme référence avec `pnpm check --against`. Pour revoir un document source, ajouter une nouvelle révision de sa notice. La version historique d'une technologie, par exemple Rust 1.0, est un libellé de jalon `versionLabel`. La version du métamodèle indique la compatibilité du fichier éditable. Le modèle public possède son propre numéro de format.

La sélection publiable embarque les citations dans le modèle sous forme d'indices, avec une seule entrée par passage et portée identiques pour une révision de source. La validation vérifie les références. La relecture historique vérifie ce que le passage permet d'affirmer.

## Dates

Un événement porte une plage d'années et une précision (`year`, `approximate`, `range`), plus un type de jalon. Ce premier modèle n'a pas besoin de précision au jour ; conserver le jour connu dans le texte ou le passage source. Une date d'annonce n'est pas une date de conception. L'absence de date n'est pas l'année zéro : ne pas créer d'événement avant de la qualifier.

## Survie, déclin et causalité

Ne pas stocker un simple booléen « vivant ». Une assertion de vitalité indique une date d'observation, un périmètre (langage, version, outil, pays, secteur) et ses indices. Séparer maintenance, usages, soutien institutionnel, enseignement, compatibilité et héritage conceptuel.

Une explication causale identifie mécanisme, période, domaine, preuve et explications concurrentes. « Il est meilleur » ou « il est soutenu » ne suffit pas. Étudier qui finance, normalise, maintient, enseigne ou impose l'usage, et avec quelles conséquences observables.
