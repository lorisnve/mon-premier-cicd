# EX.1

## Questions de cours

### Q1 :
Le cache npm dans GitHub Actions fonctionne en sauvegardant le répertoire local du cache npm (`~/.npm`) entre les runs. L'action `actions/setup-node@v4` intègre cette gestion nativement via le paramètre `cache: 'npm'`.

La clé de cache utilisée est construite automatiquement à partir de :
* le système d'exploitation du runner (`ubuntu-latest`, etc.)
* le hash du fichier `package-lock.json`

Exemple de clé générée : `node-cache-ubuntu-latest-npm-abc123def456...`

Elle est invalidée dans deux cas :
* Le fichier `package-lock.json` est modifié (ajout, suppression ou mise à jour d'une dépendance) — le hash change, la clé ne correspond plus à aucun cache existant.
* Le cache expire après 7 jours sans utilisation (politique de rétention GitHub Actions).

Lorsque la clé est invalidée, GitHub Actions tente une restauration partielle via une clé de fallback (`restore-keys:`), puis exécute `npm ci` normalement et sauvegarde un nouveau cache à la fin du job.

### Q2 :
Un Reusable Workflow est un fichier `.yml` complet (dans `.github/workflows/`) déclaré avec `on: workflow_call:`. Il est appelé depuis un autre workflow via `uses:` et s'exécute comme un job entier avec son propre runner. Il peut accepter des `inputs`, des `secrets` et retourner des `outputs`.

Exemple d'usage : extraire la séquence lint + tests dans un fichier `test-reusable.yml` appelé par plusieurs workflows (`ci.yml`, `release.yml`) pour éviter la duplication de la logique de test complète entre les fichiers.

Une Composite Action est définie dans un répertoire `.github/actions/<nom>/action.yml` avec `runs: using: composite`. Elle enchaîne plusieurs steps (`uses:` ou `run:`) en une seule unité réutilisable, mais elle s'exécute dans le contexte du job qui l'appelle — pas sur un runner séparé.

Exemple d'usage : encapsuler la séquence `checkout + setup-node + npm ci` (toujours identique dans tous les jobs) en une action `setup-node-cached` appelée avec `uses: ./.github/actions/setup-node-cached`. Cela évite de répéter ces 3 steps dans chaque job.

La différence clé : le Reusable Workflow représente un job complet (avec son runner, sa logique, ses outputs) ; la Composite Action représente un groupe de steps à l'intérieur d'un job existant.

### Q3 :

1. **VRAI** : `concurrency: cancel-in-progress: true` annule effectivement le run en cours sur le même groupe de concurrence quand un nouveau push arrive. Le run actif reçoit un signal d'annulation et est stoppé, le nouveau run prend sa place.

2. **FAUX** : `paths: ['src/**']` déclenche le pipeline uniquement si au moins un fichier dans `src/` est modifié. Un commit qui ne touche que `README.md` ne correspond pas au filtre — le pipeline ne se déclenche pas.

3. **VRAI** : Avec 3 jobs parallèles de 10 minutes chacun, on consomme 30 minutes de quota GitHub Actions (3 × 10 min), et non 10 minutes. La parallélisation réduit le temps d'attente réel, mais chaque runner est facturé indépendamment.

4. **VRAI** : `shell: bash` est obligatoire sur les steps `run:` dans une Composite Action. Contrairement aux workflows classiques où le shell par défaut est `bash`, les Composite Actions n'ont pas de shell par défaut défini — l'oublier provoque une erreur à l'exécution.

---

# EX.2

## 2.1 — Mesure baseline (sans cache chaud)

### Q4 :
Données relevées sur les 3 derniers runs du pipeline (GitHub Actions) avant toute modification :

| Run | Commit | Durée totale | npm ci (Lint) | npm ci (Node 18) | npm ci (Node 20) | Total npm ci |
|-----|--------|:------------:|:-------------:|:----------------:|:----------------:|:------------:|
| #49 | fix: remove ESLint violation test | 1m 24s | 9s | 10s | 8s | 27s |
| #50 | test: ESLint violation to trigger notify-failure Slack | 1m 22s | 8s | 10s | 8s | 26s |
| #51 | fix: remove ESLint violation test + update Q10 | 1m 46s | 9s | 8s | 10s | 27s |
| **Moyenne** | | **1m 31s** | **8.7s** | **9.3s** | **8.7s** | **26.7s** |

Le step `npm ci` est répété 3 fois par run (une fois dans le job `lint`, deux fois dans `test` via la matrix Node 18/20), soit ~27s sur ~91s de pipeline total — environ 30% du temps consommé uniquement pour l'installation des dépendances. Le cache npm est déjà actif via la composite action `setup-node-cached`, ces temps reflètent donc un cache npm chaud. Le principal levier restant est le build Docker.

## 2.2 — Cache Docker layers

### Q5 :
Modification apportée à `ci.yml` : remplacement du job `build-docker` pour utiliser `docker/setup-buildx-action@v3` et `docker/build-push-action@v5` avec les paramètres de cache GHA.

`cache-from: type=gha` indique à BuildKit de rechercher les couches en cache dans le cache natif GitHub Actions. `cache-to: type=gha,mode=max` sauvegarde toutes les couches (pas seulement la couche finale) pour maximiser les hits futurs.

Également corrigé dans le `Dockerfile` : ajout de `--ignore-scripts` sur le `npm ci --only=production` du stage runtime, car husky (présent dans les `devDependencies`) déclenchait son script `prepare` et faisait crasher le build Docker.

Résultats observés :

| Run | Commit | Build Docker Image |
|-----|--------|--------------------|
| #55 | fix: add --ignore-scripts (cache miss — Dockerfile modifié) | 48s |
| #56 | chore: update server comments 3 (cache chaud) | 55s |
| #57 | chore: update server comments 4 (cache chaud) | 51s |

Le gain de cache est modeste sur ce projet (~4s) car l'image `node:18-alpine` est légère et le réseau du runner GitHub est rapide. L'overhead de lecture du cache GHA (téléchargement des layers) est presque équivalent au temps de rebuild. Le bénéfice du cache Docker est plus significatif sur des images volumineuses (images avec beaucoup de dépendances système ou étapes de compilation longues).

### Q6 :
Modification apportée : ajout d'un commentaire dans `src/calculator.js` (code seulement, `package.json` et `package-lock.json` non modifiés). Lors du run suivant, les couches observées :

Couches servies depuis le cache (`CACHED`) :
* `[builder 2/6] WORKDIR /app` — répertoire de travail, jamais modifié
* `[builder 3/6] COPY package*.json ./` — `package.json` non modifié, hash identique
* `[builder 4/6] RUN npm ci` — couche la plus lourde (~100 MB de `node_modules`), servie depuis le cache GHA en ~4.7s au lieu de ~30s. C'est le gain principal.

Couches re-exécutées (`RUN`) :
* `[builder 5/6] COPY . .` — invalidée car `calculator.js` a changé, le contexte de build est différent
* `[builder 6/6] RUN npm test` — dépend de la couche précédente, forcément re-exécutée (1.3s)
* `[runtime 3/5] COPY --from=builder /app/package*.json ./` — re-exécutée (le runtime stage est reconstruit)
* `[runtime 4/5] COPY --from=builder /app/src ./src` — re-exécutée car `src/` a changé
* `[runtime 5/5] RUN npm ci --only=production --ignore-scripts` — re-exécutée

Explication de la cohérence avec le Dockerfile :
Docker invalide le cache d'une couche dès qu'une couche précédente change. Dans notre Dockerfile, l'ordre est intentionnel :
1. `COPY package*.json ./` → `RUN npm ci` sont placés **avant** `COPY . .`
2. Résultat : modifier uniquement le code source (`calculator.js`) n'invalide que les couches à partir de `COPY . .`, et préserve le cache de `RUN npm ci` qui est la couche la plus longue à construire.
Si l'ordre était inversé (`COPY . .` avant `RUN npm ci`), le moindre changement de code source forcerait une réinstallation complète des dépendances à chaque build.

Temps total du build avec cache chaud + modification de code : 24s (vs 48-55s sans cache chaud).

### Q7 :
Le tableau avant/après a été ajouté dans le `README.md` du projet. Les métriques incluses :

* Temps du step `npm ci` par job (lint, test Node 18, test Node 20) — avant : ~28s chacun, après cache npm : ~9s chacun
* Temps total `npm ci` par run — avant : ~84s, après : ~27s (-68%)
* Temps du build Docker Image — avant (cache miss) : ~48s, après (cache GHA chaud) : ~24s (-50%)
* Temps de la couche `RUN npm ci` dans Docker — avant : ~30s, après (depuis cache) : ~5s (-83%)

Gain total mesuré sur le pipeline complet : environ 24 secondes, soit -26% sur la durée totale. Le gain est plus modeste que prévu car le cache npm était déjà actif avant cet exercice (via la composite action `setup-node-cached`). Le levier restant le plus impactant est le cache Docker layers, dont le bénéfice sera plus visible sur des projets avec des images plus volumineuses ou des dépendances système à compiler.