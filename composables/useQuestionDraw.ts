// composables/useQuestionDraw.ts
// Tirage aléatoire des questions théoriques du pool pour un élève ou toute une classe

import type { Question, QuestionDifficulty } from '~/types'

const LEVELS: QuestionDifficulty[] = ['easy', 'medium', 'hard']

/**
 * Choisit `count` questions parmi les candidates :
 * 1. privilégie les questions les moins attribuées (tout le pool est utilisé avant les doublons)
 * 2. parmi elles, équilibre les difficultés (niveau le moins représenté chez l'élève)
 * 3. départage au hasard
 * `usage` est mis à jour au fil des tirages (pour enchaîner plusieurs élèves).
 */
export function pickQuestions(
  candidates: Question[],
  current: Question[],
  usage: Map<string, number>,
  count: number
): Question[] {
  const available = [...candidates]
  const chosen: Question[] = []
  const random = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

  for (let i = 0; i < count && available.length > 0; i++) {
    // Questions les moins utilisées
    const minUsage = Math.min(...available.map(q => usage.get(q.id) ?? 0))
    let pool = available.filter(q => (usage.get(q.id) ?? 0) === minUsage)

    // Niveau le moins représenté chez l'élève (parmi ceux présents dans ce sous-ensemble)
    const selected = [...current, ...chosen]
    const levelsLeft = LEVELS.filter(l => pool.some(q => q.difficulty === l))
    if (levelsLeft.length > 0) {
      const countOf = (l: QuestionDifficulty) => selected.filter(q => q.difficulty === l).length
      const minCount = Math.min(...levelsLeft.map(countOf))
      const target = random(levelsLeft.filter(l => countOf(l) === minCount))
      // Les questions sans difficulté restent éligibles quand leur niveau est « inconnu »
      pool = pool.filter(q => q.difficulty === target || !q.difficulty)
    }

    const pick = random(pool)

    chosen.push(pick)
    available.splice(available.indexOf(pick), 1)
    usage.set(pick.id, (usage.get(pick.id) ?? 0) + 1)
  }

  return chosen
}

export const useQuestionDraw = () => {
  const db = useDB()

  /** Charge le pool de la classe et le nombre d'attributions de chaque question */
  async function loadContext(classId: string) {
    const [pool, assignments] = await Promise.all([
      db.questions.getTheoreticalPool(classId),
      db.studentQuestions.getForClass(classId),
    ])
    const usage = new Map<string, number>()
    for (const a of assignments) usage.set(a.questionId, (usage.get(a.questionId) ?? 0) + 1)
    return { pool, assignments, usage }
  }

  /** Complète les questions théoriques d'un élève jusqu'à `target`. Retourne les questions ajoutées. */
  async function drawForStudent(studentId: string, classId: string, target: number): Promise<Question[]> {
    const { pool, assignments, usage } = await loadContext(classId)
    return assignDraw(studentId, pool, assignments, usage, target)
  }

  /** Complète tous les élèves de la classe. Retourne le nombre d'élèves complétés et de questions ajoutées. */
  async function drawForClass(classId: string, studentIds: string[], target: number) {
    const { pool, assignments, usage } = await loadContext(classId)
    let students = 0
    let questions = 0
    // Ordre aléatoire pour ne pas favoriser toujours les mêmes élèves
    const order = [...studentIds].sort(() => Math.random() - 0.5)
    for (const studentId of order) {
      const added = await assignDraw(studentId, pool, assignments, usage, target)
      if (added.length > 0) {
        students++
        questions += added.length
      }
    }
    return { students, questions }
  }

  async function assignDraw(
    studentId: string,
    pool: Question[],
    assignments: { studentId: string; questionId: string; position: number }[],
    usage: Map<string, number>,
    target: number
  ): Promise<Question[]> {
    const own = assignments.filter(a => a.studentId === studentId)
    const missing = target - own.length
    if (missing <= 0) return []

    const ownIds = new Set(own.map(a => a.questionId))
    const current = pool.filter(q => ownIds.has(q.id))
    const candidates = pool.filter(q => !ownIds.has(q.id))
    const picked = pickQuestions(candidates, current, usage, missing)

    let position = own.reduce((max, a) => Math.max(max, a.position), 0)
    for (const q of picked) {
      position++
      await db.studentQuestions.assign(studentId, q.id, position)
      assignments.push({ studentId, questionId: q.id, position })
    }
    return picked
  }

  return { drawForStudent, drawForClass }
}
