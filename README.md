# VueGrade — Outil de notation M294

> Outil enseignant pour la gestion des projets Vue.js, la notation des examens oraux et la visualisation du gitflow des élèves.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Nuxt 3 |
| UI | Nuxt UI (Tailwind) |
| State | Pinia |
| Base de données | Supabase (PostgreSQL) |
| API GitHub | GitHub REST API v3 (server-side) |
| Déploiement | Vercel / Netlify |

---

## Architecture

```
vugrade/
├── pages/
│   ├── index.vue               → Dashboard (grille des projets)
│   ├── students/[id].vue       → Fiche élève (projet / oral / gitflow)
│   ├── questions.vue           → Pool de questions T/P
│   ├── oral.vue                → Vue planning + notation en live
│   └── settings.vue            → Config experts & GitHub
│
├── components/
│   ├── student/
│   │   └── StudentCard.vue     → Card projet sur le dashboard
│   ├── oral/
│   │   ├── OralPanel.vue       → Interface de notation par élève
│   │   └── OralQuestionRow.vue → Ligne question + scores experts
│   ├── gitflow/
│   │   └── GitflowViewer.vue   → Visualisation commits & branches
│   └── ui/
│       ├── QuestionCard.vue    → Card question (pool)
│       ├── QuestionModal.vue   → Formulaire création/édition
│       └── ...
│
├── composables/
│   ├── useDB.ts                → Helpers Supabase typés
│   └── useGitHub.ts            → Accès API GitHub (via server route)
│
├── stores/
│   ├── useStudentsStore.ts     → CRUD élèves
│   └── useQuestionsStore.ts    → CRUD questions
│
├── server/api/
│   └── github/gitflow.get.ts  → Route serveur GitHub (token protégé)
│
├── types/
│   └── index.ts                → Types TypeScript domaine
│
├── supabase/
│   └── schema.sql              → Schéma base de données
│
└── .github/workflows/
    └── deploy-student-template.yml  → GitHub Action pour les élèves
```

---

## Installation

### 1. Cloner et installer

```bash
git clone https://github.com/<org>/vugrade
cd vugrade
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Remplir dans `.env` :
- `SUPABASE_URL` et `SUPABASE_ANON_KEY` → depuis [supabase.com/dashboard](https://supabase.com/dashboard)
- `SUPABASE_SERVICE_KEY` → clé service role (uniquement serveur)
- `GITHUB_TOKEN` → Personal Access Token (scopes : `repo`, `read:org`)
- `GITHUB_ORG` → nom de l'organisation GitHub Classroom (ex: `divtec-cejef`)

### 3. Initialiser la base de données

Dans le **SQL Editor** de Supabase Dashboard, exécuter :

```bash
# Copier-coller le contenu de :
supabase/schema.sql
```

Puis adapter le seed des experts (noms & initiales réels) :

```sql
INSERT INTO experts (name, initials, role) VALUES
  ('Votre Nom',   'TTI', 'teacher'),
  ('Expert 1',    'FHE', 'expert'),
  ('Expert 2',    'KGE', 'expert');
```

### 4. Lancer en développement

```bash
npm run dev
```

---

## GitHub Classroom — Template élève

### Recommandation : GitHub Classroom Assignment

1. Créer un **Assignment** dans GitHub Classroom avec le template Vuetify
2. Le template inclut déjà `.github/workflows/deploy.yml` (GitHub Action de déploiement)
3. Chaque élève obtient un repo dans l'organisation, dont l'URL est prédictible :
   `https://github.com/<org>/<assignment-prefix>-<github-username>`
4. L'URL GitHub Pages se calcule automatiquement :
   `https://<github-username>.github.io/<repo-name>/`

### GitHub Action dans le template

Le fichier `.github/workflows/deploy-student-template.yml` contient la GitHub Action à inclure dans votre template. Elle :
- Se déclenche sur chaque push sur `main`
- Build le projet Vite avec `npm run build`
- Déploie sur GitHub Pages automatiquement
- Injecte les secrets (clé API) depuis les Settings GitHub

### Prérequis côté élève

Dans les **Settings** de leur repo :
- **Pages** → Source → **GitHub Actions** (pas "Deploy from a branch")
- **Secrets** → Ajouter `VITE_API_KEY` si leur API en nécessite une

---

## Flux de notation orale

```
/oral → Sélectionner l'élève dans le planning
      → Choisir son profil expert (mémorisé localement)
      → Dérouler les questions T/P
      → Attribuer une note 1-6 par question
      → La note finale est calculée automatiquement (moyenne experts)
```

Les notes sont sauvegardées en temps réel dans Supabase — tous les experts voient les scores se mettre à jour.

---

## Déploiement de VueGrade

### Sur Vercel (recommandé, gratuit)

```bash
npm install -g vercel
vercel
```

Configurer les variables d'environnement dans le dashboard Vercel.

### Sur Netlify

```bash
npm run build
# Déployer le dossier .output/public
```

---

## Modèle de données

```
experts ─────────────────────────────────┐
students ──── oral_sessions ──── oral_grades
         └─── questions (student_id = null → pool commun)
```

Voir `supabase/schema.sql` pour le détail complet.
