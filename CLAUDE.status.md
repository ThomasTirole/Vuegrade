# CLAUDE.status.md — État du projet VuGrade

> Fichier **vivant** — mis à jour par Claude Code à chaque session.
> Reflète l'état exact du projet à l'instant T.

---

## 📅 Dernière mise à jour

**Session** : Session 0 (scaffold initial)
**Date** : 2026-03-16
**Par** : Claude (via claude.ai, avant migration Claude Code)

---

## ✅ Ce qui est fait (scaffold initial)

### Infrastructure
- [x] `package.json` — dépendances Nuxt 3, Nuxt UI, Pinia, Supabase
- [x] `nuxt.config.ts` — configuration complète avec modules
- [x] `app.vue` — design system global (CSS variables, polices Google Fonts)
- [x] `layouts/default.vue` — sidebar navigation avec 4 entrées
- [x] `.env.example` — template variables d'environnement
- [x] `types/index.ts` — types TypeScript domaine (Student, Question, OralSession, etc.)

### Base de données
- [x] `supabase/schema.sql` — schéma complet (tables, triggers, RLS, vue, seed experts)

### Composables & Stores
- [x] `composables/useDB.ts` — helpers Supabase typés (CRUD students, questions, oral, experts)
- [x] `composables/useGitHub.ts` — accès API GitHub (via server route)
- [x] `stores/useStudentsStore.ts` — store Pinia élèves
- [x] `stores/useQuestionsStore.ts` — store Pinia questions

### Pages (scaffold)
- [x] `pages/index.vue` — dashboard grille projets
- [x] `pages/students/[id].vue` — fiche élève (3 onglets : projet / oral / gitflow)
- [x] `pages/questions.vue` — pool de questions T/P
- [x] `pages/oral.vue` — planning passage + notation live
- [x] `pages/settings.vue` — config experts & GitHub

### Composants (scaffold)
- [x] `components/student/StudentCard.vue`
- [x] `components/oral/OralPanel.vue`
- [x] `components/oral/OralQuestionRow.vue`
- [x] `components/gitflow/GitflowViewer.vue`
- [x] `components/ui/QuestionCard.vue`
- [x] `components/ui/QuestionModal.vue`

### Serveur
- [x] `server/api/github/gitflow.get.ts` — route GitHub (token protégé)

### Template élève
- [x] `.github/workflows/deploy-student-template.yml` — GitHub Action déploiement élèves
- [x] `vite.config.student-template.ts` — config Vite avec base URL dynamique

---

## ❌ Ce qui reste à faire (par priorité)

### Priorité HAUTE 🔴
- [ ] **`pages/students/new.vue`** — formulaire création élève
- [ ] **`pages/students/[id]/edit.vue`** — formulaire édition élève
- [ ] **Connexion réelle Supabase** — tester les CRUD après config `.env`
- [ ] **Supabase Realtime** — synchronisation des notes entre experts en live
- [ ] **Scores affichés dans `OralQuestionRow`** — actuellement les scores sont des `—` statiques

### Priorité MOYENNE 🟡
- [ ] **`pages/students/index.vue`** — liste élèves avec tri/filtre/recherche
- [ ] **Import CSV** — importer les élèves depuis le CSV Notion existant
- [ ] **Export notes** — export CSV/PDF des notes finales
- [ ] **`server/api/github/repo.get.ts`** — route info repo (utilisée dans `useGitHub.ts`)
- [ ] **Gitflow branches visualisation améliorée** — lignes parallèles par branche (type GitKraken)

### Priorité BASSE 🟢
- [ ] **Responsive mobile** — actuellement optimisé desktop uniquement
- [ ] **Raccourcis clavier** — navigation rapide pendant l'oral
- [ ] **Mode présentation** — plein écran pour l'oral
- [ ] **Notifications Supabase Realtime** — toast quand un expert note

---

## 🔧 Configuration requise avant démarrage

```
.env à créer (copier depuis .env.example) :
  SUPABASE_URL=           ← depuis supabase.com/dashboard
  SUPABASE_ANON_KEY=      ← depuis supabase.com/dashboard
  SUPABASE_SERVICE_KEY=   ← clé service role
  GITHUB_TOKEN=           ← Personal Access Token
  GITHUB_ORG=             ← ex: divtec-cejef

Supabase :
  → Exécuter supabase/schema.sql dans SQL Editor
  → Adapter le seed des experts (noms et initiales réels)

MCP Supabase :
  → Voir docs/mcp/supabase-mcp.md
```

---

## 🐛 Bugs connus / points de vigilance

| # | Description | Fichier | Priorité |
|---|---|---|---|
| 1 | Les scores dans `OralQuestionRow` sont des `—` statiques, pas connectés à Supabase | `components/oral/OralQuestionRow.vue` | HIGH |
| 2 | `useGitHub.ts` appelle `/api/github/repo` mais la route n'existe pas encore | `server/api/github/repo.get.ts` | MEDIUM |
| 3 | `OralPanel.vue` : mise à jour des scores locaux après `upsertGrade` non implémentée | `components/oral/OralPanel.vue` L.~110 | HIGH |
| 4 | `pages/students/[id].vue` : import `StudentCard` manquant pour le gitflow | `pages/students/[id].vue` | LOW |

---

## 📊 Métriques actuelles

| Indicateur | Valeur |
|---|---|
| Fichiers créés | 26 |
| Pages fonctionnelles | 0 (scaffold seulement, non testé) |
| Composants créés | 6 |
| Couverture TypeScript | ~80% (types définis, pas tous appliqués) |
| Tests | Aucun |
