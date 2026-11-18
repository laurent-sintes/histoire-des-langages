# Mesures de performance

Les outils mesurent par défaut le temps écoulé, la somme du temps CPU système et utilisateur et le pic de mémoire résidente (RSS). Les valeurs concernent le processus Node qui exécute l'outil. Les enfants natifs de Vite, la consommation du navigateur et le temps d'installation des dépendances sont en dehors de cette mesure. Le temps écoulé inclut le travail que Node attend de ses sous-processus. Les tests courent dans le processus mesuré.

Chaque appel écrit un échantillon JSON dans `tmp/performance/<commit>/<tâche>/`, avec profil d'exécution et code de sortie. Le profil distingue notamment système, architecture, version de Node et nombre de processeurs disponibles. Les outils marquent les exécutions locales dont le checkout est modifié. Les mesures antérieures au premier commit restent sous `uncommitted`.

Sur GitHub, la tâche de CI joint les mesures de la session à son exécution. Une tâche avec droit d'écriture limité les copie vers `samples/<commit>/<tâche>/` dans la branche `performance-history`. Les sessions successives du même commit conservent leurs échantillons. Cette branche constitue le référentiel durable et la soumission de nouveaux échantillons ne déclenche pas de build. En local, on peut analyser deux répertoires avec `node tools/performance/report.ts <historique> <mesures> <commit>`.

La comparaison exclut les échecs, les checkouts modifiés et les profils différents. Elle compare la médiane des mesures de la session à la médiane des dix derniers commits comparables au plus, avec un minimum de cinq. Pour signaler une dérive, l'écart doit atteindre à la fois le seuil relatif et le seuil absolu.

| Mesure | Seuil relatif | Seuil absolu |
|---|---:|---:|
| Temps écoulé | 20 % | 100 ms |
| Temps CPU | 20 % | 100 ms |
| Pic RSS | 15 % | 24 Mio |

La dérive apparaît dans le résumé Actions et dans une annotation. Le rapport propose de comparer deux commits sur le même runner et le même corpus, avec dix exécutions à froid et trente à chaud par version, puis d'examiner la médiane, le p95, le pic RSS et le CPU. Si l'écart se confirme, profiler le CPU et le tas, isoler la phase dominante et mesurer l'effet de la correction avec le même protocole. Les seuils constituent un signal de tri. Les machines hébergées peuvent varier même à profil identique.
