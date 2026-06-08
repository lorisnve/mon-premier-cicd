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
2. fix: gestion de l'erreur de division par zéro (Utilisé car cela répare un bug du code existant).
3. chore: mise à jour de la dépendance express (Utilisé car c'est une tâche de maintenance qui ne modifie pas la logique de l'application).
4. refactor: réorganisation du routeur principal (Utilisé car le code a été modifié pour être plus propre, sans ajouter de fonctionnalité ni corriger de bug).

### Q11 :
En tapant git commit -m "ajout de commitlint", le hook a bloqué le commit. Le terminal a affiché des erreurs en rouge (ex: type may not be empty [type-empty], subject may not be empty [subject-empty]). J'ai corrigé en respectant la convention : git commit -m "chore: ajout de commitlint", ce qui a permis de valider le commit.

## 3.2 — Connecter GitHub Actions à Render

### Q12 :
Dans mon git log, j'ai identifié plusieurs types de commits : feat, fix, chore, refactor, ci, et test. Selon les règles SemVer, les feat déclenchent une version MINOR et les fix une version PATCH. Je n'ai fait aucun commit de type BREAKING CHANGE (pas de !), donc il n'y a pas de saut MAJOR lié à une rupture de compatibilité. Puisque le niveau de changement le plus élevé est feat, cela devrait être une MINOR. Mais comme nous sommes au tout début du projet et qu'aucune version n'a encore été publiée, toutes ces features initiales forment la première version stable. La prochaine version sera donc la v1.0.0.

### Q13 :
Le collègue a tort. Étant donné que le paramètre est optionnel, les anciens clients qui appellent l'API sans ce paramètre continueront de fonctionner normalement. Il n'y a donc aucune rupture de compatibilité. Il s'agit d'un ajout de fonctionnalité rétrocompatible, ce qui correspond à une version MINOR, et non MAJOR.

# EX.4

## 4.1 — Créer le workflow de release

### Q14 :
Le déclencheur est on: push: tags: avec le pattern v*.*.*. La permission requise est contents: write, car le bot GitHub Actions a besoin du droit d'écriture pour créer la release sur le dépôt. Les étapes dans l'ordre sont : le checkout du code (pour avoir l'historique), l'utilisation de git-cliff-action pour lire les Conventional Commits et écrire le CHANGELOG.md, puis softprops/action-gh-release pour publier officiellement la release avec le fichier généré.

### Q15 :
Lors du push du tag, le job s'est déclenché. L'étape de checkout a téléchargé le dépôt. Ensuite, l'étape git-cliff a lu tout mon historique de commits et a généré un fichier markdown. Pour finir, l'étape de création de release a communiqué avec GitHub pour créer la version v1.0.0 dans l'onglet "Releases" du dépôt et a collé le texte du changelog dans la description.

### Q16 : 
Le CHANGELOG contient la liste de mes commits triés par catégories (Features, Bug Fixes) grâce au format Conventional Commits. C'est bien cohérent avec ce que j'ai fait. Par contre, il inclut aussi des éléments comme les commits chore ou ci qui n'intéressent pas vraiment les utilisateurs finaux de l'application. Je l'améliorerai en configurant git-cliff pour qu'il ignore ces types de commits.

### Q17 : 
Le tag :v1.0.0 est immuable: il garantit que le code déployé aujourd'hui sera exactement le même si on relance l'image dans 2 ans (indispensable pour la production et les rollbacks). Le tag :latest est un pointeur qui se déplace toujours vers la toute dernière version construite. On l'utilise plutôt dans des environnements de développement ou sur son poste local quand on veut juste tester l'application sans se soucier du numéro de version exact.

# EX.5

## 5A — Réflexion

### Q18 : 
Je lui expliquerais que Prettier n'est pas là pour remettre en question son style personnel, mais pour uniformiser le code de toute l'équipe. L'argument principal est le gain de temps : cela supprime totalement les débats inutiles sur les espaces ou l'indentation pendant les revues de code (PR) et ça évite les conflits Git (merge conflicts) causés uniquement par des différences de formatage entre deux développeurs.

### Q19 : 
Étant donné qu'il y a une rupture de compatibilité avec l'existant, c'est un "Breaking Change". Selon les règles de SemVer, je dois incrémenter la version majeure et publier la v4.0.0. Vis-à-vis des utilisateurs de l'API, je dois impérativement communiquer cette rupture via le Changelog et fournir un guide de migration pour leur expliquer exactement ce qui a changé et comment ils doivent mettre à jour leur code pour que ça refonctionne.

## 5B — Recherche autonome

### Q20 :
La différence majeure est que git-cliff est un simple générateur de texte : il lit l'historique des commits pour écrire le fichier CHANGELOG.md. En revanche, semantic-release est l'outil qui automatise la release de bout en bout sans aucune intervention manuelle : il lit les commits, calcule tout seul la prochaine version, génère le changelog, crée le tag Git et publie la Release sur GitHub.

### Q21 :
Pour imposer ces contraintes, il faut ajouter une section rules dans le fichier commitlint.config.js, par exemple : rules: { 'subject-empty': [2, 'never'], 'subject-min-length': [2, 'always', 10] }. Le hook commit-msg de Husky est le script qui se déclenche localement au moment exact où l'on valide notre message dans le terminal. Il attrape le texte, le passe à commitlint, et annule la création du commit si les règles ne sont pas respectées.