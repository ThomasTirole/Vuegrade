// composables/useExport.ts
// Export des données d'une classe : sauvegarde JSON complète et CSV des notes d'oral

import type { Class, Question, Student } from '~/types'
import { averageScore, computeOralResult, formatNumber, gradingFromClass } from '~/utils/grading'

export const useExport = () => {
  const db = useDB()

  /** Charge toutes les données d'une classe */
  async function loadClassData(cls: Class) {
    const [students, questions, assignments, sessions, evaluators] = await Promise.all([
      db.students.getAll(cls.id),
      db.questions.getAllForClass(cls.id),
      db.studentQuestions.getForClass(cls.id),
      db.oral.getSessionsForClass(cls.id),
      db.classes.getEvaluators(cls.id),
    ])
    return { students, questions, assignments, sessions, evaluators }
  }

  /** Sauvegarde JSON complète (classe, élèves, questions, attributions, sessions et notes) */
  async function exportJson(cls: Class) {
    const data = await loadClassData(cls)
    const backup = {
      app: 'VueGrade',
      exportedAt: new Date().toISOString(),
      class: cls,
      // Pas d'email ni de token dans la sauvegarde
      evaluators: data.evaluators.map(e => ({ id: e.id, name: e.name, initials: e.initials, role: e.role })),
      students: data.students,
      questions: data.questions,
      studentQuestions: data.assignments,
      oralSessions: data.sessions,
    }
    download(`${fileBase(cls)}-sauvegarde.json`, JSON.stringify(backup, null, 2), 'application/json')
  }

  /**
   * CSV des notes : une ligne par élève, une colonne par question (moyenne des évaluateurs),
   * puis la note finale selon le barème de la classe. Séparateur « ; » pour Excel.
   */
  async function exportGradesCsv(cls: Class) {
    const { students, questions, assignments, sessions, evaluators } = await loadClassData(cls)
    const grading = gradingFromClass(cls)
    const byId = new Map(questions.map(q => [q.id, q]))
    const sorted = [...students].sort((a, b) => (a.passageOrder ?? 999) - (b.passageOrder ?? 999))

    // Questions de chaque élève, dans l'ordre affiché à l'oral (T par position, P par création)
    const studentQuestions = (s: Student) => {
      const theoretical = assignments
        .filter(a => a.studentId === s.id)
        .sort((a, b) => a.position - b.position)
        .map(a => byId.get(a.questionId))
        .filter((q): q is Question => !!q)
      const practical = questions.filter(q => q.type === 'practical' && q.studentId === s.id)
      return { theoretical, practical }
    }

    const maxT = Math.max(0, ...sorted.map(s => studentQuestions(s).theoretical.length))
    const maxP = Math.max(0, ...sorted.map(s => studentQuestions(s).practical.length))
    const unit = grading.scale === 'points' ? `pts/${grading.maxPoints}` : 'note'

    const header = [
      'Ordre', 'Heure', 'Élève', 'GitHub', 'Repo', 'Site',
      ...Array.from({ length: maxT }, (_, i) => `T-${i + 1} (${unit}, x${formatNumber(grading.theoreticalWeight)})`),
      ...Array.from({ length: maxP }, (_, i) => `P-${i + 1} (${unit}, x${formatNumber(grading.practicalWeight)})`),
      ...(grading.scale === 'points' ? ['Points', 'Points max'] : []),
      'Note exacte', 'Note finale', 'Questions notées', 'Statut', 'Remarques',
    ]

    const rows = sorted.map(s => {
      const session = sessions.find(se => se.studentId === s.id)
      const grades = session?.grades ?? []
      const avg = (questionId: string) =>
        averageScore(evaluators.map(e => grades.find(g => g.questionId === questionId && g.expertId === e.id)?.score ?? null))
      const { theoretical, practical } = studentQuestions(s)
      const cell = (q?: Question) => {
        if (!q) return ''
        const a = avg(q.id)
        return a === null ? '' : formatNumber(a)
      }
      const result = computeOralResult([...theoretical, ...practical], avg, grading)

      return [
        s.passageOrder ?? '', s.passageTime ?? '', s.name, s.githubUsername, s.repoUrl, s.deployUrl ?? '',
        ...Array.from({ length: maxT }, (_, i) => cell(theoretical[i])),
        ...Array.from({ length: maxP }, (_, i) => cell(practical[i])),
        ...(grading.scale === 'points'
          ? [result?.points !== undefined ? formatNumber(result.points) : '', result?.maxPoints !== undefined ? formatNumber(result.maxPoints) : '']
          : []),
        result ? formatNumber(result.exactGrade) : '',
        result ? result.grade.toFixed(1) : '',
        result ? `${result.gradedCount}/${result.totalCount}` : `0/${theoretical.length + practical.length}`,
        session?.status ?? 'non démarré',
        session?.notes ?? '',
      ]
    })

    const csv = [header, ...rows].map(r => r.map(csvCell).join(';')).join('\r\n')
    // BOM UTF-8 : Excel affiche correctement les accents
    download(`${fileBase(cls)}-notes.csv`, '﻿' + csv, 'text/csv;charset=utf-8')
  }

  return { exportJson, exportGradesCsv }
}

function csvCell(value: unknown): string {
  const s = String(value ?? '')
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function fileBase(cls: Class): string {
  const date = new Date().toISOString().slice(0, 10)
  return `vuegrade-${cls.name.replace(/[^\w-]+/g, '_')}-${date}`
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
