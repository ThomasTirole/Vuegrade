# spec-settings.md — Paramètres

**Fichier** : `pages/settings.vue`
**Statut** : ✅ Scaffoldé (affichage seul) — formulaires à ajouter

---

## Sections

### 1. Experts
- Affichage des experts existants (depuis Supabase)
- Formulaire d'ajout/édition d'expert (nom, initiales, rôle)
- Suppression avec confirmation

### 2. Configuration GitHub
- Affichage de `GITHUB_ORG` (depuis runtimeConfig)
- Lien vers la doc MCP

### 3. Import élèves (Phase 2)
- Upload CSV (format Notion exporté)
- Parsing et prévisualisation
- Import en masse dans Supabase

### 4. Export notes (Phase 2)
- Export CSV des notes finales de tous les élèves
- Format : `Nom, Note finale, Note Q1, Note Q2, ...`

---

## Format CSV import (compatible avec l'export Notion)

```csv
Nom,Repo,Description du projet,API,Clé API,Clé enseignant
Bélet Aedan,https://github.com/...,Affichage des divinités...,GreekMyth API,No,xxx
```

---

## Informations de version

Afficher en bas de la page settings :
- Version de VueGrade (depuis package.json)
- Nuxt version
- Lien vers CLAUDE.md et CLAUDE.journal.md (pour l'enseignant)
