# ADR-004 : Architecture Multi-Tenancy (Multi-Profs / Multi-Classes)

> **Statut** : Planifié
> **Date** : 2026-03-25
> **Auteur** : Claude Code (Opus 4.5)

---

## Contexte

VueGrade est actuellement conçu pour un seul enseignant avec une seule classe. Pour permettre :
- Plusieurs profs utilisant l'outil
- Chaque prof gérant plusieurs classes (ex: différentes écoles, différentes années)
- Des experts invités sur des classes spécifiques
- Des settings différents par classe (organisation GitHub, template, etc.)

Il faut repenser le modèle de données.

---

## Décision

### Principe fondamental

**Tout est au niveau de la classe**, pas au niveau du prof. Un prof n'est qu'un propriétaire de classes.

Raison : un prof peut enseigner dans plusieurs écoles avec des organisations GitHub différentes, des templates différents, etc.

### Modèle de données

```
┌─────────────────────────────────────────────────────────────────┐
│                           users                                  │
│  id, name, email, password_hash, role: 'teacher' | 'expert'     │
└─────────────────────────────────────────────────────────────────┘
          │                                    │
          │ [teacher]                          │ [expert]
          ▼                                    ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│        classes          │◄────────►│     class_experts       │
│  id                     │          │  class_id               │
│  teacher_id (user)      │          │  user_id (expert)       │
│  name                   │          │  created_at             │
│  year                   │          └─────────────────────────┘
│  github_org             │
│  project_template       │
│  pause_interval         │
│  pause_duration         │
│  pause_positions (json) │
│  created_at             │
└─────────────────────────┘
          │
          │ class_id
          ▼
┌─────────────────────────┐
│  students, questions,   │
│  oral_sessions, etc.    │
└─────────────────────────┘
```

### Tables SQL (migration future)

```sql
-- Table unifiée des utilisateurs (profs + experts)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('teacher', 'expert')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Classes (avec settings intégrés)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  github_org TEXT,
  project_template TEXT,
  pause_interval INTEGER DEFAULT 4,
  pause_duration INTEGER DEFAULT 15,
  pause_positions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Liaison experts <-> classes (many-to-many)
CREATE TABLE class_experts (
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (class_id, user_id)
);

-- Migration des tables existantes
ALTER TABLE students ADD COLUMN class_id UUID REFERENCES classes(id);
ALTER TABLE questions ADD COLUMN class_id UUID REFERENCES classes(id);
ALTER TABLE oral_sessions ADD COLUMN class_id UUID REFERENCES classes(id);
-- Note: la table experts actuelle sera migrée vers users
```

### Règles d'accès

| Rôle | Permissions |
|------|-------------|
| **Teacher** | CRUD sur ses classes + tout ce qu'elles contiennent |
| **Expert** | Lecture + notation sur les classes où il est assigné |

### Détail des permissions

| Action | Teacher | Expert |
|--------|---------|--------|
| Créer une classe | ✅ | ❌ |
| Modifier settings classe | ✅ | ❌ |
| Supprimer une classe | ✅ | ❌ |
| Ajouter/supprimer élèves | ✅ | ❌ |
| Gérer questions | ✅ | ❌ |
| Assigner experts | ✅ | ❌ |
| Voir élèves/questions | ✅ | ✅ (ses classes) |
| Noter à l'oral | ✅ | ✅ |
| Voir les notes | ✅ | ✅ (ses classes) |

---

## Interface utilisateur

### Sélecteur de classe (sidebar)

```
┌─────────────────────┐
│ VueGrade            │
├─────────────────────┤
│ [▼ M294-2026-A    ] │  ← Dropdown sélection classe
├─────────────────────┤
│ 📊 Dashboard        │
│ 👥 Élèves           │
│ ❓ Questions        │
│ 🎤 Oral             │
│ ⚙️ Paramètres       │
└─────────────────────┘
```

### Page de connexion

Login simple email/mot de passe. Après connexion :
- **Teacher** : voit ses classes dans le dropdown
- **Expert** : voit uniquement les classes où il est assigné

### Page Settings (par classe)

Quand on est sur une classe, les settings s'appliquent à cette classe :
- Organisation GitHub
- Template de projet
- Configuration pauses
- Gestion des experts (ajout/suppression pour cette classe)

---

## Migration

### Phase 1 : CRUD Experts (maintenant)
- Ajouter create/update/delete pour la table `experts` actuelle
- Interface dans Settings

### Phase 2 : Tables multi-tenancy
- Créer `users`, `classes`, `class_experts`
- Migrer `experts` → `users` (role='expert')
- Ajouter l'enseignant comme user (role='teacher')

### Phase 3 : Migration données
- Créer une classe par défaut avec les données actuelles
- Ajouter `class_id` sur students, questions, etc.
- Migrer settings → colonnes de classes

### Phase 4 : Auth & UI
- Implémenter login/logout
- Sélecteur de classe dans sidebar
- Filtrage des données par classe

---

## Alternatives considérées

### A. Settings par prof (rejeté)
Un prof aurait ses settings par défaut, hérités par les classes.

**Rejeté** car : un prof peut avoir des organisations différentes selon les classes (ex: deux écoles).

### B. Tables séparées teachers/experts (rejeté)
Garder deux tables distinctes pour profs et experts.

**Rejeté** car : l'auth devient plus complexe (deux systèmes de login), et un expert pourrait devenir prof.

---

## Conséquences

### Positives
- Isolation complète des données par classe
- Un prof peut gérer plusieurs contextes différents
- Les experts ont une vue limitée à leurs classes
- Préparation pour une utilisation multi-établissements

### Négatives
- Migration des données existantes requise
- Complexité accrue du modèle
- Chaque requête devra filtrer par `class_id`

---

## Références

- ADR-001 : Stack technique
- ADR-002 : Schéma Supabase initial
