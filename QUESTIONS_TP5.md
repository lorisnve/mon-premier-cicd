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

