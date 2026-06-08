# EX.1

## Partie A — Questions de cours

### Q1 : 
Un linter vérifie la qualité et les bonnes pratiques du code, alors qu'un formatter s'occupe uniquement de la mise en page visuelle. Oui, ils peuvent entrer en conflit si le linter impose des règles de formatage différentes de Prettier. On résout ça en utilisant une configuration (eslint-config-prettier par ex) qui désactive les règles de formatage du linter pour laisser Prettier gérer seul cet aspect.

### Q2 : 
* MAJOR : Changement qui casse la compatibilité avec l'existant. Ex : on modifie le format JSON de la réponse de toutes les routes de la calculatrice, ce qui cassera le code des applications qui l'utilisent déjà.
* MINOR : Ajout d'une nouvelle fonctionnalité rétrocompatible. Ex : on ajoute une nouvelle route /modulo sans modifier le comportement des routes d'addition ou de soustraction existantes.
* PATCH : Correction d'un bug rétrocompatible. Ex : on corrige un bug où la route /division crashait si on envoyait des lettres au lieu de chiffres.

### Q3 : 
C'est une norme stricte pour rédiger les messages de commit. Étant donné que le format est lisible par une machine, un outil automatique peut scanner l'historique pour générer le CHANGELOG et calculer seul la prochaine version sémantique (un commit feat déclenche une version MINOR, un commit fix déclenche une version PATCH).

## Partie B — Vrai / Faux — Justifiez systématiquement

1. FAUX : Le code peut parfaitement fonctionner et s'exécuter, mais échouer au linter s'il ne respecte pas les règles définies (par ex, déclarer une variable sans jamais l'utiliser, ou utiliser var au lieu de let).

2. FAUX : Prettier ne s'intéresse pas du tout à la logique, il se contente de réorganiser le texte. Seul ESLint analyse la structure et la logique du code pour y détecter des problèmes potentiels.

3. FAUX : Une correction dans un fichier README est un changement de documentation. Ca n'affecte pas le code source de l'application, donc ça ne doit pas incrémenter le numéro de version (PATCH concerne les correctifs de code).

4. VRAI : C'est recommandé de créer le tag Git et l'image Docker correspondante dans le même workflow automatisé pour garantir que l'image de production déployée correspond à la version immuable du code validée sur GitHub.

5. FAUX : Par défaut, la commande git push n'envoie pas les tags vers le serveur distant. Il faut explicitement utiliser une commande comme git push --tags ou git push origin v1.0.0.

# EX.2

## 2.1 — Mise en place

### Q4 : 
Restreindre le déploiement à la branche main uniquement, sans approbation manuelle, pour automatiser le déploiement en pré-production dès que le code est validé par l'intégration continue.

### Q5 : 
Le Tech Lead, le Product Owner ou le développeur responsable de la release, car cette personne possède l'autorité fonctionnelle ou technique pour valider l'impact d'une nouvelle version sur les utilisateurs réels.

### Q6 : 
Pour laisser le temps d'exécuter des tests de charge/sécurité automatisés longs sur le staging, ou pour s'assurer qu'un système de base de données a purgé son cache avant de basculer le trafic.

## 2.2 — Intégration dans le pipeline

### Q7 : 
- needs: [test]
- environment: staging
- run: echo "Déploiement en staging simulé"

### Q8 : 
Le job production se met en attente (statut "Waiting") juste avant son démarrage, une fois que le job staging a réussi. L'approbation est demandée à cet instant précis via l'interface Actions et une notification.

### Q9 : 
Le job est marqué comme rejeté et passe au statut "Failed" ou "Canceled". Il n'est pas perdu : il est possible de le relancer manuellement (bouton "Re-run jobs") depuis l'interface une fois le problème résolu.

## 3.1 — Configuration Render

### Q10 :
1. Le dépôt GitHub : pour savoir quel code source récupérer.
2. Le Runtime (Node) : pour savoir quel environnement d'exécution préparer.
3. La Build Command (npm install) : pour installer les dépendances requises.
4. La Start Command (npm start) : pour savoir comment lancer le serveur HTTP.

### Q11 :
https://mon-premier-cicd-m7k0.onrender.com. Je n'ai rien eu à configurer, la route /health était déjà implémentée dans le code source du projet.

### Q12 :
1. Mettre en place un ping régulier (via un service comme UptimeRobot ou un cron job) qui fait une requête HTTP toutes les 14 minutes pour empêcher le conteneur de s'endormir.
2. Passer à un plan payant (Starter) sur Render qui garantit une disponibilité 24/7 sans mise en veille.

### Q13 :
Le Deploy Hook déclenché par GitHub Actions. Étapes suivies : désactivation de l'auto-deploy sur Render, copie de l'URL du webhook Render, création d'un secret RENDER_DEPLOY_HOOK_PROD dans l'environnement GitHub, et ajout d'une étape curl -X POST dans le fichier YAML.

## 3.2 — Connecter GitHub Actions à Render

### Q14 :
Ajout de deux étapes à la fin du job : une commande sleep 45 pour donner le temps au serveur Render de redémarrer, suivie d'un curl --fail https://mon-app-tp-ci.onrender.com/health. Le flag --fail permet de faire crasher le pipeline GitHub Actions si la réponse n'est pas un code 200.

### Q15 :
AutoDeploy (Render surveille GitHub) :

- Avantages : Zéro configuration dans le pipeline, déploiement immédiat au push.
- Inconvénients : Aucun contrôle sur le flux (ça déploie même si on n'a pas eu d'approbation manuelle ou si des tests complexes ont échoué en parallèle).

Deploy Hook (GitHub Actions appelle Render via API) :

- Avantages : Contrôle total (on déclenche le déploiement uniquement à la fin du workflow, après les - validations et le staging).
- Inconvénients : Demande plus de configuration (gestion des secrets, écriture de requêtes HTTP dans le YAML).

# EX.4

### Q16 : 
Je lui répondrais que les tests unitaires vérifient le code de manière isolée, mais ne garantissent pas du tout le fonctionnement de l'application une fois assemblée. Le staging permet de tester l'intégration avec la vraie base de données, de vérifier la configuration réseau, et de s'assurer que le déploiement lui-même ne casse rien. Par exemple, une erreur de nom dans une variable d'environnement ne sera pas détectée par un test unitaire, mais fera crasher la production. Le staging est un filet de sécurité indispensable.

### Q17 : 
Le Canary Release. Étant donné que la fonctionnalité de paiement est critique, le risque financier est élevé en cas de bug. En déployant d'abord la nouveauté sur 5% des utilisateurs, on peut surveiller les taux de succès des transactions en temps réel. Si un bug critique empêche les paiements, seul un petit pourcentage de clients est impacté, et le rollback est rapide. Blue/Green serait une alternative, mais il expose directement 100% du trafic lors de la bascule, ce qui est trop risqué ici.

### Q18 : 
1. Je communique immédiatement à l'équipe sur notre canal de discussion que l'incident est identifié et en cours de résolution.
2. Je me rends sur l'interface GitHub Actions (ou l'outil de déploiement) pour retrouver l'exécution du pipeline précédent qui fonctionnait (la dernière version stable).
3. Je relance ce déploiement précédent pour écraser la version bugguée et rétablir le service au plus vite (rollback).
4. Une fois le service rétabli, je verrouille temporairement les déploiements en production et j'analyse les logs pour comprendre comment le bug est passé à travers la CI.

### Q19 : 
Je placerais les secrets globaux et non critiques dans les "Repository secrets". Ensuite, je créerais trois environnements GitHub distincts : dev, staging et prod. Dans chaque environnement, je configurerais les variables spécifiques sous le même nom, par exemple DB_PASSWORD et API_TOKEN dans les "Environment secrets". Lors du déploiement, GitHub Actions injectera automatiquement la valeur du DB_PASSWORD correspondant à l'environnement ciblé. Cela garantit une séparation stricte et évite par exemple que l'API de staging ne se connecte accidentellement à la base de données de production.

# EX.5

## Sujet A — Deployment Environments API

### Q20 : 
L'API GitHub Deployments permet aux outils tiers d'interagir avec GitHub pour enregistrer et mettre à jour l'état des déploiements. Elle trace les déploiements en associant des statuts (pending, success, failure) à des commits, visibles dans les Pull Requests ou l'onglet Environments. Cas d'usage : un pipeline CI notifie GitHub qu'un déploiement vers Render démarre, puis met à jour le statut en "success" une fois terminé, en ajoutant l'URL de l'environnement généré.

## Sujet B — Environment variables vs Secrets

### Q21 : 
Les Variables (vars.*) sont stockées en texte clair et lisibles dans les paramètres et les logs, tandis que les Secrets (secrets.*) sont chiffrés et masqués (***) dans les logs lors de l'exécution. Les variables servent à la configuration générale, les secrets aux données d'authentification sensibles. Exemples variables : NODE_ENV=production, API_URL=https://api.site.com. Exemples secrets : DB_PASSWORD, STRIPE_API_KEY.

## Sujet C — Render Preview Environments

### Q22 : 
Un Preview Environment est une instance éphémère de l'application déployée automatiquement pour chaque Pull Request. Il fonctionne en écoutant les événements de création de PR et en clonant la configuration du service. Il permet de tester visuellement et fonctionnellement une branche isolée de manière collaborative avant la fusion. Il ne remplace pas le staging, qui sert à tester l'intégration globale de la branche principale avant le déploiement en production.