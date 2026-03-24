# CLAUDE.journal.md — Journal de travail VueGrade

> **Instructions pour Claude Code** :
> - Ajouter une entrée à chaque session de travail
> - Format : `## Session N — YYYY-MM-DD`
> - Inclure : ce qui a été fait, décisions prises, problèmes rencontrés, ce qui reste
> - Ne JAMAIS supprimer les entrées précédentes
> - Placer la nouvelle entrée EN HAUT du fichier (ordre antéchronologique)

---

## Session 5 — 2026-03-24

### 🎯 Objectif de la session
Suite de la session 4 : corrections de bugs et implémentation du système de pauses de délibération.

### ✅ Réalisé
- **Correction badges T-1 vides** : auto-génération des refs T-X à la création des questions théoriques dans le store
- **Correction oral affichant toutes les questions** : nouvelle méthode `db.questions.getAssignedForStudent()` pour ne récupérer que les questions attribuées
- **Nettoyage BDD** : suppression d'une question pratique orpheline, correction ref vide sur "Composants Vue"
- **Suppression d'élève** : ajout du bouton suppression avec confirmation via `useConfirm`
- **UX modals et toasts** : remplacement des `confirm()` natifs par des modales Nuxt UI + notifications toast
- **Terminaison d'oral** : bouton "Terminer l'oral" + statut `completed` + possibilité de rouvrir
- **Système de pauses configurable** :
  - Pauses automatiques tous les X élèves (configurable)
  - Pauses manuelles à des positions spécifiques
  - Settings stockés en Supabase (`pause_interval`, `pause_positions`)
  - Interface de configuration dans la page Settings
  - Affichage dynamique des marqueurs de pause dans `/oral`

### 🔧 Décisions techniques
- **Refs dynamiques pour pratiques** : P-1, P-2 calculés à l'affichage (index + 1), pas stockés en BDD
- **Refs stockées pour théoriques** : T-1, T-2 générés à la création et stockés en BDD
- **Pauses hybrides** : combinaison auto (tous les X) + manuelles pour flexibilité maximale

### 📋 Prochaine session
- [ ] **PRIORITÉ** : Ajouter la durée de pause configurable (5/10/15 minutes) dans Settings
- [ ] **PRIORITÉ** : Ajouter bouton "+" dans la liste de passage oral pour insérer des pauses directement (entre élèves ou en bas de liste)
- [ ] Tester le système de pauses avec plusieurs élèves
- [ ] Implémenter Supabase Realtime pour la co-notation
- [ ] Améliorer le gitflow viewer

---

## Session 4 — 2026-03-24

### 🎯 Objectif de la session
Refonte du système de questions : séparer pool théorique et questions pratiques par élève.

### ✅ Réalisé
- **Migration Supabase** : nouvelle table `student_questions` pour lier les questions du pool aux élèves avec une position (ordre T-1, T-2, T-3)
- **Modification schema** : `ref` devenu nullable dans `questions` (généré dynamiquement)
- **`composables/useDB.ts`** :
  - Nouvelle section `studentQuestions` (assign, unassign, reorder, getForStudent)
  - Nouvelles méthodes `questions.getTheoreticalPool()` et `questions.getPracticalForStudent()`
- **`pages/questions.vue`** : simplifié pour afficher uniquement les questions théoriques du pool (plus de tabs T/P)
- **`components/ui/QuestionModal.vue`** : refactoré avec prop `mode` ('theoretical' | 'practical'), `ref` retiré du formulaire
- **`components/student/QuestionSelector.vue`** : nouveau composant modal pour sélectionner des questions du pool
- **`components/student/StudentQuestions.vue`** : nouveau composant onglet avec 2 sections (théoriques attribuées + pratiques CRUD)
- **`pages/students/[id]/index.vue`** : ajout de l'onglet "Questions" entre Projet et Oral
- **`types/index.ts`** : `ref` devenu optionnel, ajout interface `StudentQuestion`

### 🔧 Décisions techniques
- **Ref dynamique** : les refs T-1, P-1 sont générées à l'affichage selon la position, pas stockées en BDD
- **Théoriques = pool** : questions avec `type='theoretical'` ET `student_id IS NULL`
- **Pratiques = par élève** : questions avec `type='practical'` ET `student_id=<élève>`
- **Réordonnancement** : possibilité de monter/descendre les questions théoriques attribuées
- **Positions compactées** : après suppression d'une attribution, les positions sont recalculées

### 📋 Prochaine session
- [ ] Tester le workflow complet : création question pool → attribution élève → affichage oral
- [ ] Vérifier que `/oral` affiche correctement les questions avec leurs refs
- [ ] Implémenter Supabase Realtime pour la co-notation

---

## Session 3 — 2026-03-24

### 🎯 Objectif de la session
Corriger les bugs prioritaires identifiés lors des tests de la Session 2.

### ✅ Réalisé
- **Bug #6 corrigé** : composants `QuestionCard` et `QuestionModal` renommés avec préfixe `Ui` dans `pages/questions.vue` (convention Nuxt 3 pour les composants dans sous-dossiers)
- **Bug #7 corrigé** : création de `pages/students/index.vue` — liste des élèves avec recherche et tri (par nom ou ordre de passage)
- **Bug #5 corrigé** :
  - Données de test complétées (`api_name` était null)
  - Déplacement `[id].vue` → `[id]/index.vue` (conflit de routes Nuxt)
  - Utilisation de `useLazyAsyncData` au lieu de `onMounted` pour le chargement

### 🔧 Décisions techniques
- **Préfixe Ui** : les composants dans `components/ui/` doivent être appelés `UiNomDuComposant` (auto-import Nuxt 3)
- **Page liste élèves** : tri par défaut sur `passageOrder`, recherche sur nom/username/description
- **Structure routes Nuxt** : pour avoir `/students/[id]` et `/students/[id]/edit`, il faut `[id]/index.vue` + `[id]/edit.vue` (pas `[id].vue` + `[id]/edit.vue`)

### Ajouts supplémentaires
- **Table `settings`** : nouvelle table Supabase pour stocker les paramètres de l'app (project_template, github_org)
- **Page settings améliorée** : formulaire éditable pour configurer le template de projet et l'organisation GitHub
- **Génération automatique des URLs** : dans le formulaire création élève, les URLs repo/deploy sont générées automatiquement à partir du username GitHub
- **Placeholders génériques** : remplacement des noms réels par des exemples génériques (Doe John, johndoe, etc.)

### 📋 Prochaine session
- [ ] Tester gitflow avec un vrai repo GitHub
- [ ] Implémenter Supabase Realtime pour la co-notation
- [ ] Ajouter d'autres élèves de test

---

## Session 2 — 2026-03-23

### 🎯 Objectif de la session
Configurer la base de données Supabase via MCP et appliquer les migrations.

### ✅ Réalisé
- **MCP Supabase** : résolution du problème de connexion (projet en pause + migration vers transport HTTP)
- **Migrations appliquées** via MCP (8 migrations) :
  1. `create_experts_table` — table experts + extension uuid-ossp
  2. `create_students_table` — table élèves
  3. `create_questions_table` — table questions + index
  4. `create_oral_sessions_table` — sessions d'oral
  5. `create_oral_grades_table` — notes par question/expert + contrainte unique
  6. `create_triggers_updated_at` — triggers automatiques
  7. `enable_rls_policies` — RLS permissif pour outil interne
  8. `seed_experts` — 3 experts (TTI teacher, FHE/KGE experts)
- **Vue créée** : `student_score_summary` pour récapitulatif des notes

### 🔧 Décisions techniques
- **MCP HTTP** : migration de npx vers `https://mcp.supabase.com/mcp` (authentification OAuth)
- **Migrations séparées** : une migration par entité pour meilleure traçabilité

### 🐛 Problèmes rencontrés
- **Projet Supabase en pause** : les projets gratuits sont mis en pause après 7 jours d'inactivité
- **MCP npx obsolète** : le transport HTTP est maintenant recommandé par Supabase

### 🧪 Tests effectués
- ✅ Dashboard : card élève affichée
- ✅ Attribution des notes par question : fonctionne
- ✅ Passage oral : affichage correct
- ❌ Gitflow : non testé (pas de vrai repo connecté)
- ❌ Page /students : n'existe pas (liste élèves)
- ❌ Questions théoriques : non visibles dans le pool /questions
- ❌ Vue edit student : ne fonctionne pas

### 📋 Prochaine session
- [ ] Corriger page /students/[id]/edit.vue
- [ ] Créer page /students/index.vue (liste élèves)
- [ ] Corriger affichage questions dans /questions
- [ ] Tester gitflow avec un vrai repo
- [ ] Implémenter Supabase Realtime

---

## Session 1 — 2026-03-16

### 🎯 Objectif de la session
Rendre le projet fonctionnel : installation, connexion Supabase, premières pages opérationnelles.

### ✅ Réalisé
- `.env` : configuré avec les vraies clés Supabase et GitHub, ajout de `SUPABASE_KEY` pour le module @nuxtjs/supabase
- `pages/students/new.vue` : formulaire création élève complet avec calcul auto de l'URL de déploiement
- `pages/students/[id]/edit.vue` : formulaire édition élève, pré-rempli avec données existantes
- `composables/useDB.ts` : correction de `mapGrade()` pour mapper correctement tous les champs (sessionId, expertId, score)
- `components/oral/OralPanel.vue` : mise à jour des scores locaux après `upsertGrade()`, correction de `getScore()` pour filtrer par expertId
- `components/oral/OralQuestionRow.vue` : affichage des scores réels par expert, note finale calculée, bouton sélectionné mis en évidence
- `server/api/github/repo.get.ts` : nouvelle route pour récupérer les infos basiques d'un repo GitHub

### 🔧 Décisions techniques
- **SUPABASE_KEY vs SUPABASE_ANON_KEY** : le module @nuxtjs/supabase attend `SUPABASE_KEY`, ajouté dans .env
- **Scores colorés** : utilisation des variables CSS `--score-1` à `--score-6` pour les scores dans OralQuestionRow
- **Note finale calculée** : moyenne arrondie à 0.5 près pour chaque question

### 🐛 Problèmes rencontrés
- **MCP Supabase non connecté** : le MCP n'est pas disponible, les migrations devront être exécutées manuellement via le dashboard Supabase
- **Port 3000 occupé** : le serveur de dev a démarré sur le port 3001

### 📋 Prochaine session
- [ ] Exécuter `supabase/schema.sql` dans le SQL Editor Supabase
- [ ] Test end-to-end avec données réelles (élève Bélet Aedan)
- [ ] Implémenter Supabase Realtime pour la co-notation
- [ ] Créer la page liste élèves avec tri/filtre/recherche

---

## Session 0 — 2026-03-16 (Scaffold initial via claude.ai)

### 🎯 Objectif de la session
Scaffolding complet de l'architecture VueGrade avant migration vers Claude Code.

### ✅ Réalisé
- `package.json` : dépendances Nuxt 3, Nuxt UI, Pinia, Supabase configurées
- `nuxt.config.ts` : modules, runtimeConfig, colorMode dark, Google Fonts (Sora + DM Mono)
- `app.vue` : design system complet avec variables CSS, dark IDE aesthetic, accent vert Nuxt #00DC82
- `layouts/default.vue` : sidebar 220px avec navigation, logo VueGrade, version tag
- `types/index.ts` : interfaces TypeScript complètes (Student, Question, OralSession, OralGrade, Expert, GitflowData, etc.) + helpers calculateFinalScore, SCORE_LABELS
- `supabase/schema.sql` : 5 tables (experts, students, questions, oral_sessions, oral_grades), triggers updated_at, RLS permissive, vue student_score_summary, seed experts
- `composables/useDB.ts` : CRUD complet typé pour toutes les entités, mappers snake_case↔camelCase
- `composables/useGitHub.ts` : wrapper parseRepoUrl + appel server route
- `stores/useStudentsStore.ts` : Pinia store avec fetchAll, add, update, delete, getById
- `stores/useQuestionsStore.ts` : Pinia store avec pool commun + questions par élève
- `pages/index.vue` : dashboard avec stats, grille auto-fill
- `pages/students/[id].vue` : fiche avec 3 onglets (projet/oral/gitflow), lazy load gitflow
- `pages/questions.vue` : pool T/P avec tabs, recherche, modale création
- `pages/oral.vue` : planning passage + OralPanel embarqué
- `pages/settings.vue` : affichage experts, config GitHub, stack info
- `components/student/StudentCard.vue` : card avec hover glow, badge live, liens repo/deploy
- `components/oral/OralPanel.vue` : sélecteur expert, score global, sections T/P
- `components/oral/OralQuestionRow.vue` : question pliable, réponse attendue, code snippet, boutons 1-6
- `components/gitflow/GitflowViewer.vue` : stats, filtre branches colorées, recherche, timeline commits
- `components/ui/QuestionCard.vue` : question pliable avec édition/suppression
- `components/ui/QuestionModal.vue` : formulaire complet (type, ref, question, réponse, indice, code, tags)
- `server/api/github/gitflow.get.ts` : route serveur GitHub (branches + commits, dédupliqué, trié)
- `.github/workflows/deploy-student-template.yml` : GitHub Action pour template élève
- `vite.config.student-template.ts` : config Vite avec VITE_BASE_URL pour GitHub Pages
- `README.md` : documentation complète installation, architecture, flux

### 🔧 Décisions techniques
- **Nuxt 3 + Nuxt UI** retenu vs Vue 3 standalone : routing, SSR, et composants pro inclus
- **Supabase** comme BDD : gratuit, PostgreSQL, Realtime natif pour co-notation
- **Token GitHub côté serveur uniquement** : server/api route pour protéger le token
- **CSS variables globales** dans app.vue plutôt que Tailwind pur : meilleure cohérence du design system
- **Polices Sora + DM Mono** : direction artistique "IDE éditorial", évite les génériques (Inter, Roboto)
- **Scores 1-6** avec dégradé couleur (rouge→vert) aligné sur la pondération M294
- **RLS Supabase permissive** pour l'instant (outil interne, pas d'auth)

### 🐛 Problèmes rencontrés
- **OralQuestionRow scores statiques** : le système de notation est scaffoldé mais les scores ne sont pas encore lus depuis Supabase (TODO : Session 1)
- **server/api/github/repo.get.ts manquant** : useGitHub.ts l'appelle mais la route n'est pas créée (TODO)
- **Mise à jour locale des scores** dans OralPanel après upsert non implémentée (TODO)

### 📋 Prochaine session (Session 1 — Claude Code)
- [ ] Initialiser le projet Nuxt (`npm install`, vérifier que ça compile)
- [ ] Configurer `.env` avec les vraies clés Supabase
- [ ] Exécuter `supabase/schema.sql`
- [ ] Tester les CRUD via MCP Supabase
- [ ] Créer `pages/students/new.vue` et `pages/students/[id]/edit.vue`
- [ ] Corriger le bug #1 (scores statiques dans OralQuestionRow)
- [ ] Créer `server/api/github/repo.get.ts`
