# EX.1

## Partie A — Définitions et distinctions

### Q1 : 
L'environnement de staging est une réplique de la production dédiée aux tests finaux. L'environnement de production est celui accessible aux utilisateurs finaux. Ex : le staging utilise une base de fausses données et des clés d'API de test, tandis que la production utilise les vraies données clients.

### Q2 : 
C'est une règle de sécurité (comme une approbation manuelle ou un délai) qui s'applique avant qu'un job ne puisse interagir avec un environnement. Cela résout le risque de déployer du code instable en production par accident en imposant un contrôle.

### Q3 : 
1. Le développeur pousse son code.
2. L'intégration continue (tests, build) s'exécute.
3. Le job de déploiement en production est mis en attente.
4. Une notification est envoyée aux personnes désignées.
5. Un validateur approuve manuellement via l'interface.
6. Le job reprend et le code est publié en production.

## Partie B — Vrai / Faux — Justifiez systématiquement

1. FAUX : L'environnement de staging doit être une copie la plus fidèle possible de la production pour garantir que le comportement testé sera identique à celui de la réalité et éviter les bugs de déploiement.

2. VRAI : Les deux environnements (l'ancien et le nouveau) tournant en parallèle, il suffit de modifier la redirection du trafic au niveau du routeur ou du load balancer vers l'ancien environnement ("Blue") pour annuler instantanément la mise à jour.

3. FAUX : Un Canary Release consiste à router initialement une petite fraction du trafic (par exemple 5%) vers la nouvelle version pour surveiller son comportement avant d'augmenter progressivement jusqu'à 100%.

4. VRAI : Si un secret porte le même nom, GitHub Actions donnera toujours la priorité à la valeur configurée spécifiquement pour l'environnement ciblé par le job par rapport au secret global du dépôt.

5. FAUX : Le mot-clé environment: sert principalement à lier le job aux règles de protection configurées (comme l'approbation manuelle) et à charger dynamiquement les secrets et variables propres à cet environnement.

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