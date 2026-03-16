# spec-questions.md — Pool de questions

**Fichier** : `pages/questions.vue`
**Composants** : `QuestionCard.vue`, `QuestionModal.vue`
**Store** : `useQuestionsStore.ts`
**Statut** : ✅ Scaffoldé — à connecter à Supabase

---

## Modèle

### Types de questions
- **T (Théorique)** : questions sur les concepts Vue.js, communes à tous les élèves
- **P (Pratique)** : questions sur le projet spécifique de l'élève

### Pool commun vs questions par élève
- `student_id = null` → pool commun (affiché dans `/questions`)
- `student_id = <uuid>` → question liée à un élève spécifique (affiché dans la fiche élève)

---

## Structure d'une question

```typescript
interface Question {
  id: string
  type: 'theoretical' | 'practical'
  ref: string           // ex: T-1, T-2, P-4, P-5
  title: string         // Titre court (affiché dans la liste)
  question: string      // Texte complet de la question
  expectedAnswer: string // Réponse attendue (visible experts uniquement)
  hint?: string         // Indice si l'élève bloque
  codeSnippet?: string  // Extrait de code de référence
  codeLanguage?: string // vue / javascript / typescript / html
  studentId?: string | null
  tags?: string[]
}
```

---

## Exemple de questions issues du cours M294

### T-1 (Théorique)
```
Ref: T-1
Titre: SFC — Single File Component
Question: Dans Vue.JS nous avons utilisé des SFC, qu'est-ce que cela signifie 
          et quelle est la particularité des SFC / comment c'est structuré ?
Réponse: SFC = Single File Component. Fichier .vue qui regroupe au même endroit 
         la structure (<template>), la logique (<script>) et le style (<style>).
```

### T-2 (Théorique)
```
Ref: T-2
Titre: Pinia — Pourquoi un store global ?
Question: Pourquoi stocker des données dans Pinia plutôt que dans chaque composant ?
Réponse: Centralisation des données, accès global, plus facile à maintenir, 
         évite la duplication, réactivité partagée entre composants.
```

### P-4 (Pratique — exemple projet Bélet Aedan)
```
Ref: P-4
Titre: Réutilisation composant v-card
Question: Dans votre page index.vue ainsi que dans Gods.vue, vous avez écrit le même 
          code pour la création des cartes. Que pouvez-vous proposer comme solution ?
Réponse: Créer un composant Card.vue et l'importer dans chacune de ces pages. 
         Meilleure maintenabilité et réutilisabilité.
Indice: Si je dois modifier quelque chose dans ces cartes, quel va être le problème ?
```

**→ Ces questions doivent être seedées via MCP Supabase lors de la Session 1.**

---

## Page `/questions`

### Tabs
- **T — Théoriques** : pool commun, toutes questions avec `student_id = null` et `type = 'theoretical'`
- **P — Pratiques** : pool commun, toutes questions avec `student_id = null` et `type = 'practical'`

### Actions
- Créer nouvelle question → `QuestionModal`
- Éditer une question → `QuestionModal` en mode édition
- Supprimer → confirmation + `deleteQuestion`

### Dans la fiche élève (onglet Oral)
Les questions pratiques spécifiques à l'élève sont ajoutées directement depuis `OralPanel` ou depuis un bouton "Ajouter une question pratique" dans la fiche élève.

---

## `QuestionModal.vue` — Formulaire

Champs :
1. **Type** : T / P (boutons toggle)
2. **Référence** : input texte (ex: T-1)
3. **Titre court** : input texte
4. **Question complète** : textarea
5. **Réponse attendue** : textarea (fond légèrement coloré)
6. **Indice** : textarea (optionnel)
7. **Code snippet** : textarea mono + sélecteur langue (si type = P)
8. **Tags** : input texte, séparés par virgules

---

## Seed initial recommandé

À exécuter via MCP Supabase en Session 1 :

```sql
INSERT INTO questions (type, ref, title, question, expected_answer, hint) VALUES
('theoretical', 'T-1', 'SFC — Single File Component',
 'Dans Vue.JS nous avons utilisé des SFC, qu''est-ce que cela signifie et quelle est la particularité des SFC / comment c''est structuré ?',
 'SFC = Single File Component. Fichier .vue qui regroupe au même endroit la structure (<template>), la logique (<script>) et le style (<style>) d''un composant.',
 NULL),
('theoretical', 'T-2', 'Pinia — Store global',
 'Pourquoi stocker des données dans Pinia plutôt que dans chaque composant ?',
 'Centralisation des données, accès global au même endroit, plus facile à maintenir en cas de modification, évite la duplication.',
 NULL),
('theoretical', 'T-3', 'Props & Emits',
 'Expliquez la différence entre les props et les emits dans Vue.js. Dans quel sens circulent les données ?',
 'Props : parent → enfant (données en lecture seule). Emits : enfant → parent (événements). Flux unidirectionnel.',
 'Si un composant enfant veut modifier une donnée du parent, comment procède-t-il ?'),
('theoretical', 'T-4', 'Computed vs Methods',
 'Quelle est la différence entre une propriété computed et une méthode dans Vue.js ?',
 'Computed : mis en cache, recalculé uniquement si les dépendances changent. Method : exécutée à chaque appel. Computed préféré pour les transformations de données.',
 NULL),
('theoretical', 'T-5', 'Vue Router — Navigation',
 'Comment fonctionne la navigation dans Vue Router ? Quelle est la différence entre <NuxtLink> et router.push() ?',
 'NuxtLink : lien déclaratif dans le template (équivalent <a> intelligent). router.push() : navigation programmatique dans le script. Les deux utilisent le même système de routing.',
 NULL);
```
