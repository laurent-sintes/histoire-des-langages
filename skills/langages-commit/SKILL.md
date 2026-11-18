---
name: langages-commit
description: Préparer et créer un commit local sur main pour Histoire des langages. Utiliser lorsque l’utilisateur demande de committer des changements du projet.
---

# Commit sur main

Depuis la racine, exécuter `pnpm git:work plan`. Identifier les fichiers qui relèvent de la demande. Vérifier les changements et lancer les contrôles utiles, par exemple `pnpm check`, `pnpm test` et `pnpm build` pour une modification du modèle ou de l’application.

Écrire le message exact dans `tmp/`, puis exécuter `pnpm git:work commit tmp/message.txt chemin…` avec les seuls chemins retenus. L’outil protège les fichiers déjà indexés hors périmètre et vérifie le diff indexé. Rendre le SHA et le résultat des contrôles. Une demande de push active aussi [langages-push](../langages-push/SKILL.md).
