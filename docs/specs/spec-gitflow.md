# spec-gitflow.md — Visualisation Gitflow

**Fichiers** :
- `composables/useGitHub.ts` (✅ scaffoldé)
- `server/api/github/gitflow.get.ts` (✅ scaffoldé)
- `server/api/github/repo.get.ts` (❌ à créer)
- `components/gitflow/GitflowViewer.vue` (✅ scaffoldé — amélioration souhaitée)

---

## Objectif

Permettre à l'enseignant de visualiser l'historique Git d'un projet élève directement dans VueGrade, sans ouvrir GitHub.

**Valeur ajoutée** : détecter des "commits dumps" (tout commité en une fois à la fin), vérifier l'utilisation de branches, voir la régularité du travail.

---

## Données affichées

### Stats globales
- Nombre total de commits
- Nombre de branches
- Date de dernière activité

### Branches
- Liste des branches avec couleur distincte
- Badge "default" sur la branche principale
- Filtre cliquable par branche

### Timeline des commits
Pour chaque commit :
- SHA court (7 chars) en vert Nuxt
- Message (première ligne)
- Badges des branches le contenant
- Avatar GitHub de l'auteur
- Nom de l'auteur
- Date formatée (dd/MM/yy HH:mm)
- Indentation visuelle selon la branche (timeline)

---

## Architecture API

### Route serveur `server/api/github/gitflow.get.ts`
- Query params : `?owner=<org>&repo=<repo>`
- Utilise le token GitHub depuis `runtimeConfig.githubToken`
- Récupère : branches + commits par branche (max 50 par branche)
- Déduplique les commits (un commit peut être sur plusieurs branches)
- Retourne : `GitflowData`

### Route serveur `server/api/github/repo.get.ts` (à créer)
```typescript
// Retourne les infos basiques du repo
interface RepoInfo {
  name: string
  description: string
  defaultBranch: string
  stars: number
  isPrivate: boolean
  lastPushAt: string
  language: string
}
```

### Calcul deploy URL
Dans `useGitHub.ts`, après avoir récupéré les infos du repo, on peut proposer l'URL GitHub Pages calculée.

---

## Visualisation améliorée (Phase 2)

La version actuelle est une liste linéaire. La version améliorée devrait montrer les branches en parallèle comme GitKraken / git log --graph.

### Concept
```
main     ●──●──●────────●──●
              \         /
feature/x      ●──●──●
```

### Implémentation suggérée
Utiliser un `<svg>` ou `<canvas>` dans `GitflowViewer.vue` :
1. Calculer les "lanes" (une par branche active)
2. Tracer les lignes de connexion entre parents et enfants
3. Placer les commits comme des noeuds colorés par branche

Cette visualisation est complexe — la prévoir comme **amélioration Phase 2**, pas pour Session 1.

---

## Gestion des erreurs GitHub API

| Code | Cause | Message à afficher |
|---|---|---|
| 404 | Repo introuvable ou privé sans token | "Repo introuvable. Vérifier l'URL ou le token GitHub." |
| 403 | Rate limit atteint | "Rate limit GitHub atteint. Attendre 1h ou configurer un token." |
| 401 | Token invalide | "Token GitHub invalide. Mettre à jour GITHUB_TOKEN dans .env" |

---

## Configuration requise

```env
GITHUB_TOKEN=ghp_...    # Token avec scopes: repo, read:org
GITHUB_ORG=divtec-cejef # Organisation GitHub Classroom
```

Sans token : limite à 60 req/heure (insuffisant si plusieurs élèves).
Avec token : 5000 req/heure.

---

## Parsing URL repo

La fonction `parseRepoUrl()` dans `useGitHub.ts` gère ces formats :
```
https://github.com/divtec-cejef/m294-projet-vuetify-YuriAyato144
https://github.com/divtec-cejef/m294-projet-vuetify-YuriAyato144.git
https://github.com/divtec-cejef/m294-projet-vuetify-YuriAyato144/
```
→ `{ owner: 'divtec-cejef', repo: 'm294-projet-vuetify-YuriAyato144' }`
