# Architecture du graphe

Le projet reprend de FLOW Étude Économique la séparation des pièces reçues, des données éditoriales, des contrats et de la présentation React. Comme dans FLOW, le build fabrique un modèle que le navigateur sait exploiter. Le graphe actuel tient dans un module statique avec une API TypeScript et des index en mémoire. Cette forme correspond aux recherches prévues et au volume observé.

`pièces → qualification → corpus JSON → validation TypeScript → modèle public compact → React`

| Couche | Choix |
|---|---|
| Édition | JSON UTF-8 indenté. Il se relit dans les diffs, se valide et se parse directement avec Node. YAML apporte des commentaires mais demanderait un parseur et des conventions supplémentaires. Le corpus actuel tient dans un fichier. |
| Métamodèle | Modèle autonome dans `packages/metamodel/model.ts`, en TypeScript et Zod. Le contrat de validation, les types et le JSON Schema dérivent de sa définition. Il fixe aussi les signatures des relations que le validateur applique avant fabrication. |
| Fabrication | Node compile les objets étayés en un module statique. Les nœuds sont référencés par indice. Les citations identiques et les notices des sources sont mutualisées. Les révisions et la maturité restent accessibles dans la sortie. |
| Frontend | L'API du module effectue la recherche de libellés et d'alias et donne accès aux liens entrants et sortants, à la chronologie et aux preuves. Le navigateur construit les index une fois. |

Le build lit le corpus et embarque les métadonnées et les liens publics des sources. Les PDF, transcriptions et autres pièces originales restent dans `sources/`. Le contrôle d'empreintes des pièces locales se lance à la demande quand les pièces changent. Pour rendre une pièce consultable sur le site, lui attribuer une URL de publication. Le numéro de format public permet de faire évoluer sa représentation indépendamment du corpus éditorial.

## Recherche dans le navigateur

IndexedDB permet de conserver des objets et leurs index sur l'appareil. On pourrait y enregistrer les nœuds et les arêtes et indexer leurs extrémités. Les parcours à plusieurs sauts resteraient à écrire dans l'application. IndexedDB devient intéressant pour un cache persistant ou un mode hors ligne qui le justifie. [API IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

Un moteur embarqué peut exécuter des requêtes de graphe. Oxigraph, par exemple, charge un graphe RDF et expose SPARQL en WebAssembly. Ce choix apporterait un langage de requêtes libres, avec une conversion du graphe vers RDF et un coût de chargement à mesurer. [Oxigraph pour le navigateur](https://github.com/oxigraph/oxigraph/blob/main/js/README.md)

Pour la recherche par nom, la timeline et la navigation de proche en proche, le module compilé suffit au volume actuel. Suivre la taille compressée, le temps de chargement et la réactivité sur mobile. Si le chargement devient trop coûteux, mesurer d'abord le chargement différé des citations ou des ensembles de nœuds. Évaluer un moteur lorsque des parcours libres à plusieurs sauts ou des requêtes croisées deviennent un besoin du site.
