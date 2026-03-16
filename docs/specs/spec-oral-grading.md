# spec-oral-grading.md — Système de notation orale

**Fichiers** :
- `components/oral/OralPanel.vue` (✅ scaffoldé, scores non connectés)
- `components/oral/OralQuestionRow.vue` (✅ scaffoldé, scores non connectés)
- `pages/oral.vue` (✅ scaffoldé)

---

## Contexte métier

- **3 experts** notent simultanément (enseignant + 2 experts invités)
- Chaque expert attribue une note **1 à 6** par question
- La **note finale par question** = moyenne des 3 experts (arrondie à 0.5)
- La **note globale** = moyenne des notes finales de toutes les questions

### Pondération 1-6
```
6 → Maîtrise le sujet
5 → Très bien, il manque peu
4 → Suffisant
3 → Un peu vague
2 → Pas au clair
1 → Aucune réponse
```

---

## Flux complet

```
1. Enseignant ouvre /oral
2. Sélectionne l'élève dans le planning
3. Chaque expert choisit son profil (mémorisé en localStorage)
4. Les 3 experts voient les mêmes questions simultanément
5. Chaque expert note indépendamment → sauvegarde Supabase immédiate
6. Les scores des autres experts apparaissent en temps réel (Supabase Realtime)
7. La note finale se calcule automatiquement
8. Session marquée "completed" en fin d'oral
```

---

## Composant `OralPanel.vue`

### Props
```typescript
props: { studentId: string }
```

### State
- `session` : `OralSession | null` — session active
- `questions` : `Question[]` — questions pour cet élève (pool + spécifiques)
- `experts` : `Expert[]` — liste des experts
- `currentExpertId` : `string | null` — expert courant (localStorage)

### Fonctions à implémenter correctement
```typescript
// Créer ou récupérer la session
async function initSession()

// Sauvegarder un score via MCP/Supabase
async function saveScore(questionId: string, score: number)

// Récupérer le score d'un expert pour une question
function getScore(questionId: string, expertId: string): number | null

// Calculer la note finale d'une question
function getQuestionFinal(questionId: string): number | null

// Score global
const globalScore = computed(...)
```

### Realtime (Session 2)
```typescript
// S'abonner aux changements de oral_grades
supabase.channel(`session-${session.id}`)
  .on('postgres_changes', { 
    event: 'INSERT', schema: 'public', table: 'oral_grades',
    filter: `session_id=eq.${session.id}`
  }, updateLocalScore)
  .subscribe()
```

---

## Composant `OralQuestionRow.vue`

### Props
```typescript
props: {
  question: Question
  experts: Expert[]
  session: OralSession
  currentExpertId: string | null
  allGrades: OralGrade[]  // tous les grades de la session
  saving: boolean
}
```

### Affichage des scores
Pour chaque expert, afficher son score actuel :
```typescript
// Trouver le score d'un expert pour cette question
const expertScore = allGrades.find(
  g => g.questionId === question.id && g.expertId === expert.id
)?.score ?? null
```

Le badge score doit utiliser les classes CSS globales `.score-1` à `.score-6`.

### Note finale
```typescript
const finalScore = computed(() => {
  const scores = experts
    .map(e => allGrades.find(g => g.questionId === question.id && g.expertId === e.id)?.score)
    .filter((s): s is number => s !== null)
  return calculateFinalScore(scores)
})
```

---

## Page `oral.vue`

### Layout
- Sidebar gauche : liste des élèves dans l'ordre de passage
- Zone principale droite : `OralPanel` de l'élève sélectionné

### Marqueurs de pause
Entre certains élèves, afficher un marqueur "⏸ Pause 15' — délibération".
La position des pauses est configurable (idéalement tous les 3-4 élèves, ou configurable dans settings).

### Sélection expert
Le profil expert sélectionné dans `OralPanel` est mémorisé en `localStorage` clé `vugrade_expert`.
Si plusieurs onglets ouverts par les 3 experts (même URL), chacun a son propre localStorage.

---

## Points de vigilance

1. **Concurrent writes** : 3 experts notent en même temps → contrainte UNIQUE sur `(session_id, question_id, expert_id)` dans Supabase (déjà en place dans le schéma)
2. **Score 0 vs null** : différencier "pas encore noté" (null) de "note de 0" (inexistant dans notre échelle)
3. **Recalcul note finale** : se fait côté client (computed), pas en BDD, sauf la `total_score` de la session qui est sauvegardée en fin d'oral
