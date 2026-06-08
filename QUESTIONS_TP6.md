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

## 2.1 — Installation et configuration

### Q4 : 
npm init @eslint/config. J'ai choisi de vérifier la syntaxe et trouver les problèmes, syntaxe CommonJS car c'est du Node basique, pas de framework, et un fichier de configuration au format mjs.

### Q5 : 
J'ai ajouté une variable var unused = 42; jamais utilisée, une comparaison == au lieu de ===, et supprimé un point-virgule. Dans le terminal, la liste des fichiers apparaît avec les numéros de lignes en erreur, les règles non respectées (comme no-unused-vars, eqeqeq), et le script s'arrête en rouge avec un code d'erreur (exit 1).

### Q6 : 
J'ai choisi "semi": true pour forcer les points-virgules et éviter les bugs liés à l'insertion automatique (ASI). "singleQuote": true car c'est le standard de facto en JavaScript. "trailingComma": "all" pour avoir des diffs Git plus propres quand on ajoute un élément à un tableau/objet. "printWidth": 80 pour éviter d'avoir des lignes trop longues qui obligent à scroller horizontalement.

## 2.2 — Intégration dans le pipeline CI

### Q7 : 
Mon job lint commence par checkout pour récupérer le code, puis setup-node et npm ci pour avoir l'environnement et les dépendances. Ensuite, j'ai mis npm run format:check puis npm run lint. Cet ordre permet d'échouer le plus vite possible si c'est juste un problème de formatage bête (plus rapide à vérifier), avant de lancer l'analyse de code d'ESLint.

### Q8 : 
L'étape Vérification ESLint (ou Prettier si c'est le format qui est mauvais) est marquée d'une croix rouge et le job lint passe en statut "Failed". Les jobs suivants qui ont needs: [lint] (comme les tests ou le déploiement) sont automatiquement annulés (statut "Skipped") et ne s'exécutent pas.

### Q9 : 
Je lui réponds qu'accepter 5 warnings revient à accepter une dette technique invisible qui va s'accumuler. Le risque est que l'équipe prenne l'habitude de voir des avertissements, atteigne très vite la limite de 5, et que le 6ème warning (qui pourrait être un vrai bug) fasse planter le pipeline pour quelqu'un d'autre plus tard, alors qu'on aurait pu le régler en 2 secondes au moment de l'écriture du code.

# EX.3

## 3.1 — Adopter les Conventional Commits

### Q10 :
1. feat: ajout de la route de soustraction (Utilisé car c'est une nouvelle fonctionnalité ajoutée à l'API).


### Q11 :


### Q12 :


### Q13 :


## 3.2 — Connecter GitHub Actions à Render

### Q14 :


### Q15 :


# EX.4

### Q16 : 


### Q17 : 


### Q18 : 


### Q19 : 


# EX.5

## Sujet A — Deployment Environments API

### Q20 : 


## Sujet B — Environment variables vs Secrets

### Q21 : 


## Sujet C — Render Preview Environments

### Q22 : 
