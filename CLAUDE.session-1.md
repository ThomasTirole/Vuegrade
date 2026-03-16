# CLAUDE.session-1.md — Instructions Session 1

> Ce fichier est le **brief de démarrage** pour la première session Claude Code.
> Une fois la session terminée, archiver ce fichier dans `docs/sessions/session-1-done.md`.

---

## 🎯 Objectif de la Session 1

**Rendre le projet fonctionnel** : installation, connexion Supabase, premières pages opérationnelles.

---

## 📋 Checklist Session 1

### Étape 1 — Bootstrap du projet

```bash
# 1. Installer les dépendances
npm install

# 2. Vérifier que le projet compile
npm run dev

# 3. Corriger les éventuelles erreurs de compilation
```

Si des erreurs TypeScript ou d'imports manquants apparaissent, les corriger avant de continuer.

### Étape 2 — Configuration Supabase (via MCP)

```
1. Ouvrir le MCP Supabase (configuré dans docs/mcp/supabase-mcp.md)
2. Exécuter supabase/schema.sql via mcp_supabase_apply_migration
3. Vérifier les tables avec mcp_supabase_list_tables
4. Insérer les vrais experts (demander les noms/initiales à l'enseignant)
5. Insérer le seed de questions depuis docs/specs/spec-questions.md
```

### Étape 3 — Créer `pages/students/new.vue`

Spec complète dans `docs/specs/spec-student-detail.md`.

Formulaire avec :
- Tous les champs de l'interface `Student` (types/index.ts)
- Calcul automatique `deploy_url` depuis `github_username` + `repo_url`
- Validation (champs requis)
- Submit → `useStudentsStore.addStudent()` → redirect `/students/[id]`

### Étape 4 — Créer `pages/students/[id]/edit.vue`

Même formulaire que `new.vue`, pré-rempli.
Submit → `useStudentsStore.updateStudent()` → redirect `/students/[id]`

### Étape 5 — Corriger le bug #1 (scores OralQuestionRow)

Dans `components/oral/OralPanel.vue` et `components/oral/OralQuestionRow.vue` :
- Connecter les scores réels depuis Supabase (via `useDB().oral`)
- Afficher les scores des 3 experts (pas des `—` statiques)
- Mettre à jour les scores locaux après `upsertGrade`

Voir spec détaillée dans `docs/specs/spec-oral-grading.md`.

### Étape 6 — Créer `server/api/github/repo.get.ts`

```typescript
// Route : GET /api/github/repo?owner=<owner>&repo=<repo>
// Retourne les infos basiques du repo (name, description, defaultBranch, lastPushAt)
```

### Étape 7 — Test end-to-end

1. Créer un élève de test avec les vraies données (ex: Bélet Aedan depuis le CSV)
2. Vérifier que la fiche s'affiche correctement
3. Tester le gitflow sur son repo : `https://github.com/divtec-cejef/m294-projet-vuetify-YuriAyato144`
4. Créer une session d'oral, noter une question, vérifier en BDD

---

## 📌 Données de test disponibles

Le fichier `Étudiants.csv` contient les données réelles des élèves.
Pour le test, utiliser **Bélet Aedan** :
```
Nom: Bélet Aedan
API: GreekMyth API
Clé API: No
Description: Affichage des divinités et personnages de la mythologie grecque
Repo: https://github.com/divtec-cejef/m294-projet-vuetify-YuriAyato144
GitHub username: YuriAyato144
Deploy URL: https://YuriAyato144.github.io/m294-projet-vuetify-YuriAyato144/
```

---

## ⚠️ Ne pas faire en Session 1

- Ne pas implémenter Supabase Realtime (Session 2)
- Ne pas refactorer le design system
- Ne pas toucher à `supabase/schema.sql` sans créer une migration

---

## 📝 En fin de session

1. Mettre à jour `CLAUDE.journal.md` avec une entrée Session 1
2. Mettre à jour `CLAUDE.status.md` (cocher les tâches réalisées, ajouter nouveaux bugs)
3. Renommer ce fichier en `docs/sessions/session-1-done.md`
