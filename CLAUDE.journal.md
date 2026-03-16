# CLAUDE.journal.md — Journal de travail VuGrade

> **Instructions pour Claude Code** :
> - Ajouter une entrée à chaque session de travail
> - Format : `## Session N — YYYY-MM-DD`
> - Inclure : ce qui a été fait, décisions prises, problèmes rencontrés, ce qui reste
> - Ne JAMAIS supprimer les entrées précédentes
> - Placer la nouvelle entrée EN HAUT du fichier (ordre antéchronologique)

---

## Session 1 — À compléter par Claude Code

> Cette entrée sera remplie lors de la première session Claude Code.
> Template à utiliser :

```
## Session N — YYYY-MM-DD

### 🎯 Objectif de la session
[Ce qui était demandé]

### ✅ Réalisé
- [Fichier créé/modifié] : [description]
- ...

### 🔧 Décisions techniques
- [Décision] : [Justification]

### 🐛 Problèmes rencontrés
- [Problème] : [Solution appliquée ou TODO]

### 📋 Prochaine session
- [ ] [Tâche prioritaire suivante]
```

---

## Session 0 — 2026-03-16 (Scaffold initial via claude.ai)

### 🎯 Objectif de la session
Scaffolding complet de l'architecture VuGrade avant migration vers Claude Code.

### ✅ Réalisé
- `package.json` : dépendances Nuxt 3, Nuxt UI, Pinia, Supabase configurées
- `nuxt.config.ts` : modules, runtimeConfig, colorMode dark, Google Fonts (Sora + DM Mono)
- `app.vue` : design system complet avec variables CSS, dark IDE aesthetic, accent vert Nuxt #00DC82
- `layouts/default.vue` : sidebar 220px avec navigation, logo VuGrade, version tag
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
