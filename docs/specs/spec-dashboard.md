# spec-dashboard.md — Page Dashboard (index)

**Fichier** : `pages/index.vue`
**Statut** : ✅ Scaffoldé — à connecter à Supabase

---

## Objectif

Page d'accueil : vision d'ensemble de tous les projets élèves sous forme de grille de cards.

---

## Fonctionnalités attendues

### Grille de cards
- Affichage de tous les élèves depuis Supabase (`useStudentsStore`)
- Tri par `passage_order` par défaut
- Layout `grid auto-fill minmax(340px, 1fr)`
- Clic sur une card → navigation vers `/students/[id]`

### Card élève (`StudentCard.vue`)
- Avatar initiales (2 premières lettres du nom)
- Nom complet
- Heure de passage (si définie)
- Badge "● live" si `deploy_url` renseignée
- Description projet (2 lignes max, ellipsis)
- API utilisée avec icône
- Liens repo GitHub + site déployé (s'ouvrent dans nouvel onglet, sans propager le clic vers la fiche)
- Hover : border vert Nuxt + translateY(-2px) + glow

### Stats rapides
- Nombre total d'élèves
- Nombre de repos renseignés
- Nombre de sites déployés (en vert Nuxt)

### Header actions
- Bouton "Ajouter un élève" → `/students/new`

### États
- **Loading** : spinner + texte "Chargement des projets…"
- **Vide** : empty state avec CTA "Ajouter le premier élève"
- **Erreur** : `UAlert` rouge avec message d'erreur Supabase

---

## Ce qui manque actuellement

- [ ] Gestion de l'état d'erreur (seulement loading/vide actuellement)
- [ ] Possibilité de trier/filtrer les élèves (par ordre de passage, alphabétique, statut oral)
- [ ] Indicateur de statut de la session orale (pending / in_progress / completed) sur la card

---

## Interactions à tester

1. Ouvrir le dashboard → les cards s'affichent
2. Cliquer sur une card → navigation vers la fiche élève
3. Cliquer sur le lien repo → s'ouvre dans un nouvel onglet SANS naviguer vers la fiche
4. Cliquer sur "Ajouter un élève" → navigation vers `/students/new`
