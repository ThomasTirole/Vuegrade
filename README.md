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
└── docs/archive/github-pages-template/  → Ancien template GitHub Pages (obsolète)
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
- Le token GitHub de chaque enseignant se saisit dans l'app (`/profile`), chiffré en BDD

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

## Projets élèves — Repos personnels + Vercel

> GitHub Classroom a été arrêté. Depuis 2026, chaque élève travaille sur un **repo personnel**
> (`https://github.com/<username>/<repo>`) et déploie son projet sur **Vercel**.
> L'ancien template GitHub Pages est archivé dans `docs/archive/github-pages-template/`.

### Saisie d'un élève

1. Coller l'URL du repo → le username GitHub est déduit automatiquement
2. Cliquer sur **Vérifier l'accès** (public / privé accessible / introuvable)
3. Saisir l'URL de production Vercel (`https://<projet>.vercel.app`) — elle n'est pas prédictible

### Accès au versioning (gitflow)

| Repo | Prérequis |
|---|---|
| **Public** (recommandé) | Aucun. Le token enseignant augmente seulement la limite à 5000 req/h |
| **Privé** | L'élève ajoute l'enseignant comme collaborateur + token **classic** avec scope `repo` dans `/profile` (un token fine-grained ne couvre pas les repos personnels d'autres comptes) |

### Prérequis côté élève (Vercel)

- Importer le repo GitHub dans Vercel (déploiement automatique à chaque push sur `main`)
- **Environment Variables** → ajouter `VITE_API_KEY` si leur API en nécessite une
- Vue Router en mode history : ajouter un `vercel.json` à la racine pour éviter les 404 au rechargement :

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

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
