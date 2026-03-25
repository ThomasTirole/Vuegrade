# CLAUDE.status.md — État du projet VueGrade

> Fichier **vivant** — mis à jour par Claude Code à chaque session.
> Reflète l'état exact du projet à l'instant T.

---

## 📅 Dernière mise à jour

**Session** : Session 7
**Date** : 2026-03-25
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
- [x] **Migrations Supabase appliquées** — 8 migrations via MCP ✨ Session 2

### Composables & Stores
- [x] `composables/useDB.ts` — helpers Supabase typés (CRUD students, questions, oral, experts complet, studentQuestions)
- [x] `composables/useGitHub.ts` — accès API GitHub (via server route)
- [x] `stores/useStudentsStore.ts` — store Pinia élèves
- [x] `stores/useQuestionsStore.ts` — store Pinia questions

### Documentation
- [x] `docs/decisions/004-multi-tenancy.md` — architecture future multi-profs/classes ✨ Session 6

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
- [x] `components/student/StudentQuestions.vue` — onglet questions fiche élève ✨ Session 4
- [x] `components/student/QuestionSelector.vue` — sélection questions du pool ✨ Session 4
- [x] `components/oral/OralPanel.vue` — scores connectés à Supabase ✨ Session 1
- [x] `components/oral/OralQuestionRow.vue` — affichage scores réels ✨ Session 1
- [x] `components/gitflow/GitflowViewer.vue`
- [x] `components/ui/QuestionCard.vue`
- [x] `components/ui/QuestionModal.vue` — mode theoretical/practical ✨ Session 4

### Serveur
- [x] `server/api/github/gitflow.get.ts` — route GitHub branches/commits
- [x] `server/api/github/repo.get.ts` — route info repo ✨ Session 1

### Template élève
- [x] `.github/workflows/deploy-student-template.yml` — GitHub Action déploiement élèves
- [x] `vite.config.student-template.ts` — config Vite avec base URL dynamique

---

## ❌ Ce qui reste à faire (par priorité)

### Priorité HAUTE 🔴
- [x] **Exécuter `supabase/schema.sql`** — ✅ fait via MCP Session 2
- [x] **CRUD Experts dans Settings** — ✅ fait Session 6
- [x] **Supabase Realtime** — ✅ fait Session 6 (composable `useRealtimeGrades.ts`)
- [ ] **Test end-to-end** — créer un élève, vérifier fiche, tester gitflow, notation
- [x] **Inscription utilisateurs avec validation** : ✅ Session 7
  - [x] Page d'inscription (`/register`) — formulaire nom, email, mot de passe, rôle
  - [x] Champ `status` sur table `users` : `pending` | `active` | `rejected`
  - [x] Les comptes `pending` ne peuvent pas se connecter
  - [x] Validation manuelle via Supabase Dashboard (passer `status` à `active`)
  - [ ] (Futur) Page admin dans l'app pour valider les comptes en attente
- [x] **Création de classe** : ✅ Session 7
  - [x] UI pour créer une nouvelle classe (nom, année, org GitHub, template)
  - [x] Accessible uniquement aux teachers
  - [x] La nouvelle classe apparaît dans le sélecteur de la sidebar
- [ ] **Badge "Live" amélioré** :
  - [ ] Vérification réelle HTTP (HEAD request via API serveur) pour confirmer que le site répond
  - [ ] Animation pulse/glow vert clignotant autour du point pour effet "live" visuel
  - [ ] Cache des résultats pour éviter de spammer les requêtes

### Priorité MOYENNE 🟡
- [ ] **Import CSV** — importer les élèves depuis le CSV Notion existant
- [ ] **Export notes** — export CSV/PDF des notes finales
- [ ] **Gitflow branches visualisation améliorée** — lignes parallèles par branche (type GitKraken)

### Priorité BASSE 🟢
- [ ] **Responsive mobile** — actuellement optimisé desktop uniquement
- [ ] **Raccourcis clavier** — navigation rapide pendant l'oral
- [ ] **Mode présentation** — plein écran pour l'oral
- [ ] **Toast notifications Realtime** — "FHE a noté Q1 : 5" quand un expert note

### Multi-Tenancy 🟣

**Phase 2 : Tables** ✅
- [x] Table `users` — unifie profs + experts avec auth + `github_token_encrypted`
- [x] Table `classes` — avec settings intégrés (org, template, pauses)
- [x] Table `class_experts` — liaison many-to-many

**Phase 3 : Migration données** ✅
- [x] Créer classe par défaut avec données actuelles
- [x] Ajouter `class_id` sur students, questions, oral_sessions
- [x] Migrer settings → colonnes de classes
- [x] Migrer experts → users

**Phase 4 : Auth & UI** (en cours)
- [x] Auth login (email/password) — `pages/login.vue`
- [x] Middleware auth — `middleware/auth.global.ts`
- [x] Sélecteur classe dans sidebar
- [x] Filtrage données par classe (stores)
- [x] Permissions UI par rôle (teacher vs expert)
- [ ] Page profil prof (saisie token GitHub)
- [ ] Chiffrement token GitHub (pgcrypto ou Vault)

> **Décision Config GitHub** : Tout en BDD, rien en `.env` — org dans `classes`, token chiffré dans `users` (voir ADR-004)

---

## 🔧 Configuration

```
.env configuré :
  SUPABASE_URL=https://fuuubzdcauekxpwzglze.supabase.co
  SUPABASE_KEY=...
  SUPABASE_SERVICE_KEY=...
  GITHUB_TOKEN=ghp_...
  GITHUB_ORG=divtec-cejef

Supabase (Session 2 + Session 4) :
  ✅ Tables créées : experts, students, questions, oral_sessions, oral_grades, student_questions
  ✅ Triggers updated_at configurés
  ✅ RLS activé avec politiques permissives (outil interne)
  ✅ Vue student_score_summary créée
  ✅ 3 experts seedés : TTI (teacher), FHE, KGE (experts)
  ✅ Table student_questions pour liaison élève ↔ questions théoriques (Session 4)
```

---

## 🐛 Bugs corrigés Session 1

| # | Description | Statut |
|---|---|---|
| 1 | Les scores dans `OralQuestionRow` sont des `—` statiques | ✅ Corrigé |
| 2 | Route `/api/github/repo` manquante | ✅ Corrigé |
| 3 | Mise à jour des scores locaux après `upsertGrade` | ✅ Corrigé |

## 🐛 Bugs corrigés Session 3

| # | Description | Statut |
|---|---|---|
| 5 | Page edit student ne fonctionne pas | ✅ Corrigé (données api_name) |
| 6 | Questions théoriques non visibles dans le pool | ✅ Corrigé (préfixe Ui) |
| 7 | Page liste élèves manquante | ✅ Créée |

## 🐛 Bugs restants

| # | Description | Fichier | Priorité |
|---|---|---|---|
| 4 | `pages/students/[id].vue` : import `StudentCard` manquant pour le gitflow | `pages/students/[id].vue` | LOW |

---

## Métriques actuelles

| Indicateur | Valeur |
|---|---|
| Fichiers créés | 35 |
| Pages fonctionnelles | 7 (dashboard, fiche, new, edit, questions, settings, login) |
| Composants créés | 6 |
| Stores Pinia | 3 (students, questions, auth) |
| Couverture TypeScript | ~90% |
| Tests | Aucun |
