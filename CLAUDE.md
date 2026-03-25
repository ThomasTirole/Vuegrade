# CLAUDE.md — VueGrade

> Fichier d'instructions principal pour Claude Code.
> À lire **en premier** avant toute action sur ce projet.

---

## 🎯 Contexte du projet

**VueGrade** est un outil interne pour enseignant destiné à gérer :
- Les projets Vue.js des élèves (module M294, apprentis informaticiens 2e année)
- La notation des examens oraux (3 experts, notes 1–6)
- La visualisation du gitflow des repos GitHub des élèves
- Le pool de questions théoriques et pratiques

**Utilisateur principal** : un seul enseignant + 2 experts invités lors des examens oraux.
Pas d'authentification complexe requise — outil interne.

---

## 📁 Structure des fichiers de pilotage

```
CLAUDE.md                    ← CE FICHIER — instructions principales
CLAUDE.journal.md            ← Journal de travail (à tenir à jour à chaque session)
CLAUDE.status.md             ← État actuel du projet (fichier vivant)
docs/
  specs/
    spec-dashboard.md        ← Spec page Dashboard
    spec-student-detail.md   ← Spec fiche élève
    spec-oral-grading.md     ← Spec notation orale
    spec-gitflow.md          ← Spec visualisation gitflow
    spec-questions.md        ← Spec pool de questions
    spec-settings.md         ← Spec paramètres
  decisions/
    001-stack.md             ← Décision stack technique
    002-supabase-schema.md   ← Décision schéma BDD
    003-github-api.md        ← Décision intégration GitHub
  mcp/
    supabase-mcp.md          ← Guide configuration MCP Supabase
```

---

## 🛠 Stack technique — NE PAS DÉVIER

| Couche | Choix | Raison |
|---|---|---|
| Framework | **Nuxt 3** | Connaissance de l'enseignant, SSR, file-based routing |
| UI | **Nuxt UI v2** (Tailwind) | Composants pro, dark mode natif |
| State | **Pinia** | Standard Vue 3 |
| BDD | **Supabase** | Gratuit, PostgreSQL, Realtime |
| Styles | **CSS custom** via variables + Tailwind | Design system cohérent |
| Polices | **Sora** (titres) + **DM Mono** (code/données) | Direction artistique IDE |
| Accent | `#00DC82` (vert Nuxt) | Cohérence visuelle |

**Ne jamais :**
- Remplacer Nuxt UI par une autre lib (Vuetify, PrimeVue, etc.)
- Utiliser `localStorage` pour les données métier (utiliser Supabase)
- Ajouter une authentification lourde (outil interne uniquement)
- Changer la palette de couleurs sans mettre à jour `app.vue`

---

## 🎨 Design System

Les variables CSS globales sont définies dans `app.vue` :

```css
--c-bg, --c-bg-soft, --c-bg-card, --c-bg-hover   /* fonds */
--c-border, --c-border-soft                        /* bordures */
--c-text, --c-text-soft, --c-text-muted            /* textes */
--c-nuxt (#00DC82), --c-vue (#41b883)              /* accents */
--c-warn, --c-error, --c-info                      /* feedback */
--score-1 à --score-6                              /* couleurs de notes */
--font-display (Sora), --font-mono (DM Mono)       /* polices */
```

**Règle absolue** : toujours utiliser ces variables, jamais de valeurs hardcodées.

---

## 🔌 MCP Supabase

Ce projet utilise le MCP Supabase pour interagir directement avec la base de données.

**Guide complet** : voir `docs/mcp/supabase-mcp.md`

Quand on te demande de créer/modifier des tables, utilise les outils MCP Supabase :
- `mcp_supabase_apply_migration` pour les migrations SQL
- `mcp_supabase_execute_sql` pour les requêtes directes
- `mcp_supabase_list_tables` pour inspecter le schéma

---

## 📐 Conventions de code

### Nommage
- **Composants** : PascalCase (`StudentCard.vue`, `OralPanel.vue`)
- **Composables** : camelCase avec préfixe `use` (`useDB.ts`, `useGitHub.ts`)
- **Stores** : camelCase avec préfixe `use` + suffixe `Store` (`useStudentsStore.ts`)
- **Pages** : kebab-case ou `[param].vue` pour les routes dynamiques
- **CSS classes** : BEM-like kebab-case (`.student-card`, `.card-header`)

### Structure d'un composant Vue
```vue
<script setup lang="ts">
// 1. Imports (types en premier)
// 2. Props & Emits
// 3. Stores & composables
// 4. State local (ref, reactive)
// 5. Computed
// 6. Lifecycle hooks
// 7. Fonctions
</script>

<template>
  <!-- Toujours un seul élément racine -->
</template>

<style scoped>
/* Variables CSS — jamais de valeurs hardcodées */
</style>
```

### TypeScript
- Toujours typer les props et emits
- Utiliser les types définis dans `types/index.ts`
- Préférer `interface` à `type` pour les objets domaine

### Commentaires
- Chaque fichier commence par un commentaire résumant son rôle
- Les fonctions complexes ont un commentaire JSDoc
- Les sections CSS ont des commentaires de séparation

---

## 🔄 Processus de travail avec Claude Code

### À chaque session, Claude Code DOIT :

1. **Lire** `CLAUDE.status.md` pour connaître l'état actuel
2. **Lire** la spec du module concerné dans `docs/specs/`
3. **Implémenter** les changements demandés
4. **Mettre à jour** `CLAUDE.journal.md` avec une entrée datée
5. **Mettre à jour** `CLAUDE.status.md` si l'état du projet change
6. **Versionner** les changements avec un commit Git descriptif

### Versioning Git

À la fin de chaque session ou après chaque fonctionnalité complète :
- **Commit** avec un message clair suivant le format : `type(scope): description`
- Types : `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`
- Exemples :
  - `feat(oral): add realtime grade sync between experts`
  - `fix(settings): limit expert initials to 3 characters`
  - `docs: update CLAUDE.md with versioning instructions`
- **Ne pas push** automatiquement — laisser l'utilisateur décider

### Ordre de priorité des fichiers à consulter
1. `CLAUDE.md` (ce fichier)
2. `CLAUDE.status.md` (état actuel)
3. `CLAUDE.journal.md` (historique des décisions)
4. `docs/specs/<module>.md` (spec détaillée)
5. Le code existant du module concerné

---

## 🗂 Pages et leur état

| Page | Fichier | Statut |
|---|---|---|
| Dashboard | `pages/index.vue` | ✅ Scaffoldé |
| Fiche élève | `pages/students/[id].vue` | ✅ Scaffoldé |
| Nouvel élève | `pages/students/new.vue` | ❌ À créer |
| Édition élève | `pages/students/[id]/edit.vue` | ❌ À créer |
| Questions | `pages/questions.vue` | ✅ Scaffoldé |
| Oral | `pages/oral.vue` | ✅ Scaffoldé |
| Paramètres | `pages/settings.vue` | ✅ Scaffoldé |

---

## ⚠️ Points d'attention critiques

1. **Token GitHub** — ne jamais l'exposer côté client. Il passe uniquement par `server/api/github/gitflow.get.ts`
2. **Supabase service key** — uniquement côté serveur (`runtimeConfig.supabaseServiceKey`)
3. **Realtime Supabase** — à implémenter pour la notation orale (plusieurs experts simultanés)
4. **GitHub API rate limit** — 60 req/h sans auth, 5000 avec token. Toujours vérifier les erreurs 403
5. **Base path Vite** — le template étudiant utilise `VITE_BASE_URL` pour GitHub Pages

---

## 📦 Installation du projet

```bash
npm install
cp .env.example .env
# Remplir .env avec les clés Supabase et GitHub
npm run dev
```

Voir `README.md` pour le guide complet.
