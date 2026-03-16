# CLAUDE.status.md — État du projet VueGrade

> Fichier **vivant** — mis à jour par Claude Code à chaque session.
> Reflète l'état exact du projet à l'instant T.

---

## 📅 Dernière mise à jour

**Session** : Session 1
**Date** : 2026-03-16
**Par** : Claude Code (Opus 4.5)

---

## ✅ Ce qui est fait

### Infrastructure
- [x] `package.json` — dépendances Nuxt 3, Nuxt UI, Pinia, Supabase
- [x] `nuxt.config.ts` — configuration complète avec modules
- [x] `app.vue` — design system global (CSS variables, polices Google Fonts)
- [x] `layouts/default.vue` — sidebar navigation avec 4 entrées
- [x] `.env.example` — template variables d'environnement
- [x] `.env` — configuré avec clés Supabase et GitHub
- [x] `types/index.ts` — types TypeScript domaine (Student, Question, OralSession, etc.)

### Base de données
- [x] `supabase/schema.sql` — schéma complet (tables, triggers, RLS, vue, seed experts)

### Composables & Stores
- [x] `composables/useDB.ts` — helpers Supabase typés (CRUD students, questions, oral, experts)
- [x] `composables/useGitHub.ts` — accès API GitHub (via server route)
- [x] `stores/useStudentsStore.ts` — store Pinia élèves
- [x] `stores/useQuestionsStore.ts` — store Pinia questions

### Pages
- [x] `pages/index.vue` — dashboard grille projets
- [x] `pages/students/[id].vue` — fiche élève (3 onglets : projet / oral / gitflow)
- [x] `pages/students/new.vue` — formulaire création élève ✨ Session 1
- [x] `pages/students/[id]/edit.vue` — formulaire édition élève ✨ Session 1
- [x] `pages/questions.vue` — pool de questions T/P
- [x] `pages/oral.vue` — planning passage + notation live
- [x] `pages/settings.vue` — config experts & GitHub

### Composants
- [x] `components/student/StudentCard.vue`
- [x] `components/oral/OralPanel.vue` — scores connectés à Supabase ✨ Session 1
- [x] `components/oral/OralQuestionRow.vue` — affichage scores réels ✨ Session 1
- [x] `components/gitflow/GitflowViewer.vue`
- [x] `components/ui/QuestionCard.vue`
- [x] `components/ui/QuestionModal.vue`

### Serveur
- [x] `server/api/github/gitflow.get.ts` — route GitHub branches/commits
- [x] `server/api/github/repo.get.ts` — route info repo ✨ Session 1

### Template élève
- [x] `.github/workflows/deploy-student-template.yml` — GitHub Action déploiement élèves
- [x] `vite.config.student-template.ts` — config Vite avec base URL dynamique

---

## ❌ Ce qui reste à faire (par priorité)

### Priorité HAUTE 🔴
- [ ] **Exécuter `supabase/schema.sql`** — créer les tables dans Supabase
- [ ] **Supabase Realtime** — synchronisation des notes entre experts en live
- [ ] **Test end-to-end** — créer un élève, vérifier fiche, tester gitflow, notation

### Priorité MOYENNE 🟡
- [ ] **`pages/students/index.vue`** — liste élèves avec tri/filtre/recherche
- [ ] **Import CSV** — importer les élèves depuis le CSV Notion existant
- [ ] **Export notes** — export CSV/PDF des notes finales
- [ ] **Gitflow branches visualisation améliorée** — lignes parallèles par branche (type GitKraken)

### Priorité BASSE 🟢
- [ ] **Responsive mobile** — actuellement optimisé desktop uniquement
- [ ] **Raccourcis clavier** — navigation rapide pendant l'oral
- [ ] **Mode présentation** — plein écran pour l'oral
- [ ] **Notifications Supabase Realtime** — toast quand un expert note

---

## 🔧 Configuration

```
.env configuré :
  SUPABASE_URL=https://fuuubzdcauekxpwzglze.supabase.co
  SUPABASE_KEY=...
  SUPABASE_SERVICE_KEY=...
  GITHUB_TOKEN=ghp_...
  GITHUB_ORG=divtec-cejef

Supabase :
  → Exécuter supabase/schema.sql dans SQL Editor (TODO)
  → Adapter le seed des experts (noms et initiales réels)
```

---

## 🐛 Bugs corrigés Session 1

| # | Description | Statut |
|---|---|---|
| 1 | Les scores dans `OralQuestionRow` sont des `—` statiques | ✅ Corrigé |
| 2 | Route `/api/github/repo` manquante | ✅ Corrigé |
| 3 | Mise à jour des scores locaux après `upsertGrade` | ✅ Corrigé |

## 🐛 Bugs restants

| # | Description | Fichier | Priorité |
|---|---|---|---|
| 4 | `pages/students/[id].vue` : import `StudentCard` manquant pour le gitflow | `pages/students/[id].vue` | LOW |

---

## 📊 Métriques actuelles

| Indicateur | Valeur |
|---|---|
| Fichiers créés | 29 |
| Pages fonctionnelles | 5 (dashboard, fiche, new, edit, questions) |
| Composants créés | 6 |
| Couverture TypeScript | ~85% |
| Tests | Aucun |
