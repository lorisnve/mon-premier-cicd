# EX.1

## Partie A — Questions de cours

### Q1 :
`npm audit` analyse uniquement les dépendances JavaScript du projet (listées dans `package.json`) en les comparant à une base de CVE connues. `Trivy` est un scanner plus large : il analyse les images Docker (OS, packages système, dépendances applicatives) et peut également détecter des secrets hardcodés dans les fichiers.

Dans le pipeline, on les place dans cet ordre :
1. **npm audit** (dans le job `lint` ou `test`, avant le build de l'image) — c'est le principe du *fail fast* : si une dépendance critique est vulnérable, on arrête tout de suite sans perdre du temps à construire une image.
2. **Trivy** (après le job `build`, sur l'image construite) — on scanne l'image complète une fois qu'elle existe, pour attraper les vulnérabilités au niveau de l'OS de base et des couches Docker.

### Q2 :
Le principe du moindre privilège appliqué aux secrets signifie qu'un job ou un workflow ne doit avoir accès qu'aux secrets strictement nécessaires à son exécution, et rien de plus.

Deux exemples concrets :
* Un job de `test` n'a besoin d'aucun secret de déploiement. Il ne doit donc pas avoir accès à `RENDER_DEPLOY_HOOK_PROD` ou `SLACK_WEBHOOK_URL`. On isole ces secrets dans des environnements GitHub (`staging`, `production`) pour qu'ils ne soient injectés que dans les jobs de déploiement.
* Un job qui publie une image Docker sur Docker Hub n'a besoin que de `DOCKERHUB_TOKEN`. Il ne doit pas avoir accès au token AWS ou à la clé de base de données de production, même si ces secrets existent dans le repo.

### Q3 :
Les 4 métriques DORA mesurent la performance d'une équipe DevOps :

1. **Deployment Frequency** — À quelle fréquence on déploie en production. Niveau élite : **plusieurs fois par jour**. Le pipeline CI/CD y contribue en automatisant entièrement le déploiement à chaque merge sur `main`, supprimant toute opération manuelle qui ralentirait la cadence.

2. **Lead Time for Changes** — Temps entre le premier commit et la mise en production. Niveau élite : **moins d'une heure**. Le pipeline réduit ce délai en exécutant lint, tests et déploiement en parallèle ou en chaîne automatiquement, sans attente humaine.

3. **Change Failure Rate** — Pourcentage de déploiements qui provoquent un incident en production. Niveau élite : **0 à 15 %**. Les jobs de tests automatisés, le scan de sécurité et l'environnement de staging agissent comme filtres pour empêcher les bugs d'atteindre la production.

4. **Mean Time to Restore (MTTR)** — Temps moyen pour rétablir le service après un incident. Niveau élite : **moins d'une heure**. Le pipeline contribue en permettant de rejouer rapidement un déploiement précédent (rollback) ou de pousser un hotfix en quelques minutes via le même workflow automatisé.

---

## Partie B — Vrai / Faux

1. **FAUX** : `--audit-level=high` fait échouer le pipeline si une vulnérabilité de sévérité **HIGH ou CRITICAL** est trouvée. HIGH est déjà inclus dans le seuil. Pour bloquer uniquement sur CRITICAL, il faudrait utiliser `--audit-level=critical`.

2. **VRAI** : Trivy dispose d'un scanner de secrets (`--scanners secret`) qui analyse le contenu des fichiers copiés dans l'image via les instructions `COPY` ou `ADD`. Il peut y détecter des patterns reconnus de clés API hardcodées (AWS, GitHub tokens, etc.).

3. **FAUX** : `if: failure()` placé sur un **job** s'exécute si un des jobs dont il dépend (via `needs:`) a échoué. Ce n'est pas lié aux steps du même job. Si on veut réagir à l'échec d'un step précédent *au sein du même job*, on place `if: failure()` sur un **step**, pas sur un job.

4. **VRAI** : Dependabot ouvre automatiquement des Pull Requests pour mettre à jour les dépendances, mais ne les merge jamais de lui-même par défaut. Une intervention humaine (review et merge) est toujours requise, sauf si on configure explicitement une règle d'auto-merge via GitHub.

5. **FAUX** : Faire un `git rm` sur le fichier ne supprime que sa présence dans les futurs commits. L'historique Git conserve tous les commits précédents, et le secret reste accessible via `git log` ou `git show`. Il faut impérativement **révoquer et régénérer le secret immédiatement**, puis réécrire l'historique avec un outil comme BFG Repo-Cleaner ou `git filter-branch` pour l'effacer définitivement.

---

# EX.2

## 2.1 — npm audit

### Q4 :
`npm audit` lancé en local retourne 0 vulnérabilité.
Le projet n'a donc aucune dépendance connue comme vulnérable, ni directe ni transitive, d'après la base de données d'audit npm.

### Q5 :
J'ai ajouté l'étape suivante à la fin du job `lint` dans `.github/workflows/ci.yml`.
J'ai choisi `--audit-level=high` : le pipeline échoue uniquement si une vulnérabilité **HIGH ou CRITICAL** est détectée. Les vulnérabilités LOW et MODERATE ne bloquent pas les livraisons — elles sont moins dangereuses et souvent situées dans des dépendances de développement uniquement. C'est un compromis pragmatique entre sécurité et vélocité.

## 2.2 — Trivy

### Q6 :
J'ai créé le job `security` suivant dans `ci.yml`.
Paramètres choisis :
* `image-ref` : référence l'image construite localement, taguée avec le SHA du commit pour garantir l'unicité et éviter de scanner une image en cache d'un commit précédent.
* `exit-code: '1'` : le job échoue (et bloque le pipeline) si une vulnérabilité est trouvée. Sans cette option, Trivy affiche les résultats mais ne bloque rien.
* `severity: 'HIGH,CRITICAL'` : on aligne le seuil avec `npm audit --audit-level=high` pour une cohérence globale. LOW et MODERATE ne bloquent pas.
* `format: 'table'` : sortie lisible directement dans les logs GitHub Actions.

### Q7 :
J'ai configuré `needs: [build-docker]`. Cet ordre est obligatoire car Trivy scanne une image Docker qui doit **exister** pour être analysée. Si le job `security` démarrait en parallèle ou avant `build-docker`, l'image `mon-premier-cicd:${{ github.sha }}` ne serait pas encore construite et Trivy échouerait avec une erreur "image not found". La dépendance garantit que l'artefact à scanner est disponible.

En complément, j'ai mis à jour `deploy-staging` pour dépendre de `security` (`needs: [security]`) : on ne déploie que si le scan de sécurité a passé.

### Q8 :
On ne peut pas corriger immédiatement des CVE dans l'image de base `node:18-alpine` car c'est de la responsabilité des mainteneurs de l'image. Sans bloquer tous les déploiements, plusieurs options sont possibles :

1. **Trivy `.trivyignore`** : créer un fichier `.trivyignore` à la racine du projet listant les CVE concernées avec un commentaire justificatif et une date de révision. Trivy les ignorera lors du scan. C'est la solution la plus courante pour les CVE connues et acceptées temporairement.
2. **`exit-code: '0'` temporaire + rapport** : passer `exit-code` à `0` pour ne plus bloquer le pipeline tout en conservant la sortie visible dans les logs. On combine avec `format: 'sarif'` pour uploader le rapport dans l'onglet Security de GitHub et assurer un suivi.
3. **Mise à jour de l'image de base** : surveiller régulièrement les nouvelles versions de `node:18-alpine` via Dependabot (en configurant un suivi Dockerfile) et migrer vers `node:20-alpine` ou une version corrigée dès que disponible.

La solution recommandée est la combinaison 1 + 3 : ignorer temporairement avec justification documentée, et planifier la correction via une issue de suivi.

---

# EX.3

## 3.1 — Notifications Slack

### Q9 :
J'ai remplacé l'ancien job `notify` par deux jobs dans `.github/workflows/ci.yml`.

Points clés de l'implémentation :
* `needs:` liste tous les jobs du pipeline pour intercepter n'importe quel échec, qu'il se produise au lint, aux tests ou au déploiement.
* `if: failure()` s'évalue à `true` si au moins un des jobs listés dans `needs` a le statut `failure` (les jobs `skipped` ne comptent pas).
* Le webhook URL est injecté via une variable d'environnement locale au step (`env:`) et non directement dans la commande `curl`, pour éviter qu'il apparaisse dans les logs.
* L'URL est stockée dans `${{ secrets.SLACK_WEBHOOK_URL }}` (configurée dans **GitHub Settings → Secrets → Actions**), jamais écrite en dur dans le YAML.

### Q10 :
Pour tester, j'ai décommenté la ligne `var unused = 42;` dans `src/calculator.js` et poussé le commit `test: ESLint violation to trigger notify-failure Slack`.

Le pipeline a échoué au step **ESLint** du job `lint`. Le job `notify-failure` s'est ensuite déclenché et a envoyé le message Slack suivant (reçu à 12h01) :

> ❌ **Pipeline échoué sur `main`**
> * **Repo** : `lorisnve/mon-premier-cicd`
> * **Branche** : `main`
> * **Commit SHA** : `34741c3ffc337b121d2749dba75f237471de1603`
> * **Logs** : https://github.com/lorisnve/mon-premier-cicd/actions/runs/27268516637

La notification contient bien toutes les informations attendues. Après confirmation, j'ai immédiatement corrigé en recommentant la ligne et poussé `fix: remove ESLint violation test`.

### Q11 :
J'ai ajouté le job `notify-success` qui se déclenche après un déploiement de production réussi :

Différences avec le message d'échec :
* La couleur de l'attachment passe de `#FF0000` (rouge) à `#36A64F` (vert).
* Le texte principal devient `✅ Déploiement réussi en production`.
* On remplace le champ **Logs** (utilisé pour investiguer) par un champ **URL Production** pointant vers l'application en ligne : `https://mon-premier-cicd-m7k0.onrender.com`. Cela permet de vérifier directement le résultat du déploiement en un clic.
* Le `needs` se limite à `[deploy-production]` au lieu de tous les jobs, car on ne veut célébrer que la réussite complète du déploiement final.

### Q12 :
Trois stratégies pour lutter contre la **notification fatigue** :

1. **Filtrer par sévérité et pertinence** : n'envoyer des notifications Slack qu'en cas d'échec sur `main` (ou les branches de release). Les branches `feature/**` n'envoient que des notifications en cas d'échec critique (pas les avertissements LOW). On ajoute une condition `if: failure() && github.ref == 'refs/heads/main'` pour cibler uniquement ce qui impacte la production.

2. **Regrouper et enrichir le contenu** : plutôt que d'envoyer un message par job échoué, utiliser un seul message récapitulatif à la fin du pipeline avec la liste des jobs en erreur et la cause précise (violation ESLint, test unitaire échoué, CVE détectée, etc.). Cela réduit le volume et augmente le signal utile par message.

3. **Différencier les canaux par audience** : créer plusieurs channels Slack dédiés (`#ci-alerts` pour les développeurs, `#deployments` pour les PO/DevOps, `#security` pour les CVE Trivy). Chaque équipe ne reçoit que les alertes qui la concernent directement, réduisant le bruit pour chaque individu.


