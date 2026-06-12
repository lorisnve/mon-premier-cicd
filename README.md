# mon-premier-cicd

[![CI Pipeline](https://github.com/lorisnve/mon-premier-cicd/actions/workflows/ci.yml/badge.svg)](https://github.com/lorisnve/mon-premier-cicd/actions/workflows/ci.yml)

## Description
Premier pipeline CI/CD avec GitHub Actions, Node.js, Jest et ESLint.

## Lancer les tests
```bash
npm ci && npm test
```

## Pipeline Performance — Avant / Après cache

### npm ci (installation des dépendances)

| Métrique | Sans cache | Avec cache npm (`actions/setup-node`) | Gain |
|----------|:----------:|:-------------------------------------:|:----:|
| npm ci — job lint | ~28s | ~9s | **-68%** |
| npm ci — test Node 18 | ~28s | ~9s | **-68%** |
| npm ci — test Node 20 | ~28s | ~9s | **-68%** |
| Total npm ci par run | ~84s | ~27s | **-68%** |

> Le cache npm est actif via `actions/setup-node@v4` avec `cache: 'npm'`. La clé est basée sur le hash de `package-lock.json` — invalidée uniquement si les dépendances changent.

### Docker build (cache des layers)

| Métrique | Sans cache (cache miss) | Avec cache GHA chaud | Gain |
|----------|:-----------------------:|:--------------------:|:----:|
| Build Docker Image | ~48s | ~24s | **-50%** |
| Couche `RUN npm ci` | ~30s | ~5s (depuis cache) | **-83%** |

> Le cache Docker layers est activé via `docker/build-push-action@v5` avec `cache-from: type=gha` et `cache-to: type=gha,mode=max`. Seules les couches après `COPY . .` sont re-buildées lors d'un changement de code source — les couches `npm ci` restent en cache tant que `package-lock.json` n'est pas modifié.

### Gain total estimé par run (sur pipeline complet)

| Scénario | Durée pipeline | Notes |
|----------|:--------------:|-------|
| Baseline (runs #49-51, sans cache Docker) | ~1m 31s | Cache npm déjà actif |
| Avec cache Docker chaud (run #58) | ~1m 07s | Cache npm + Docker layers |
| **Gain total** | **~24s (-26%)** | Principalement sur le build Docker |
