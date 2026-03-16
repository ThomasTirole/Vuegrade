# spec-student-detail.md — Fiche élève

**Fichiers** :
- `pages/students/[id].vue` — fiche (✅ scaffoldé)
- `pages/students/new.vue` — création (❌ à créer)
- `pages/students/[id]/edit.vue` — édition (❌ à créer)

---

## Page fiche élève `/students/[id]`

### Header
- Lien retour "← Dashboard"
- Avatar initiales
- Nom + username GitHub
- Badge heure de passage (amber)
- Bouton "Voir le site" (si deploy_url)
- Bouton "GitHub" (lien repo)
- Bouton icône crayon → `/students/[id]/edit`

### 3 onglets

#### Onglet "Projet"
Grille d'info cards :
- Description du projet
- API utilisée (nom + lien doc)
- Clé API enseignant (si renseignée, en `DM Mono`)

#### Onglet "Oral"
→ Embarque le composant `OralPanel.vue`
(voir spec-oral-grading.md)

#### Onglet "Gitflow"
→ Embarque `GitflowViewer.vue`
- Chargement lazy (seulement quand l'onglet est ouvert)
- Appel `useGitHub().getGitflow(student.repoUrl)`
- États : loading / erreur / données

---

## Page création `/students/new`

**À CRÉER en Session 1**

### Formulaire
```
Nom complet *
Username GitHub *
URL du repo GitHub *  (calculer deploy_url automatiquement depuis le username + nom du repo)
URL du site déployé   (pré-remplie automatiquement, éditable)
Description du projet *
Nom de l'API *
URL documentation API
Clé API enseignant
Ordre de passage      (numérique)
Heure de passage      (ex: 08:20)
```

### Comportement
- Validation côté client (champs requis)
- Calcul automatique de l'URL GitHub Pages :
  `https://<github_username>.github.io/<repo_name>/`
  Le repo_name est extrait de l'URL du repo.
- Submit → `useStudentsStore.addStudent()` → redirect vers `/students/[id]`
- Annuler → retour dashboard

---

## Page édition `/students/[id]/edit`

**À CRÉER en Session 1**

Même formulaire que la création, pré-rempli avec les données existantes.
Submit → `useStudentsStore.updateStudent()` → redirect vers `/students/[id]`

---

## Helper à implémenter dans `types/index.ts`

```typescript
// Déjà présent mais à utiliser dans le formulaire :
export function inferDeployUrl(githubUsername: string, repoName: string): string {
  return `https://${githubUsername}.github.io/${repoName}`
}

// Extraire le nom du repo depuis l'URL :
export function extractRepoName(repoUrl: string): string {
  return repoUrl.split('/').pop()?.replace('.git', '') ?? ''
}
```
