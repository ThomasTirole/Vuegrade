// stores/useQuestionsStore.ts
// Gère les questions de la classe sélectionnée
import { defineStore } from 'pinia'
import type { Question } from '~/types'

export const useQuestionsStore = defineStore('questions', () => {
  const db = useDB()
  const authStore = useAuthStore()

  /** Pool commun (théoriques) */
  const pool = ref<Question[]>([])
  /** Questions par élève (pratiques + communes chargées pour un élève) */
  const byStudent = ref<Record<string, Question[]>>({})
  const loading = ref(false)

  // Recharge automatique quand la classe change
  watch(() => authStore.selectedClassId, (newClassId) => {
    if (newClassId) {
      fetchPool()
    } else {
      pool.value = []
      byStudent.value = {}
    }
  })

  async function fetchPool() {
    const classId = authStore.selectedClassId
    if (!classId) {
      pool.value = []
      return
    }

    loading.value = true
    try {
      // Utilise la nouvelle méthode qui ne récupère que les théoriques du pool
      pool.value = await db.questions.getTheoreticalPool(classId)
    } finally {
      loading.value = false
    }
  }

  async function fetchForStudent(studentId: string) {
    loading.value = true
    try {
      byStudent.value[studentId] = await db.questions.getForStudent(studentId)
    } finally {
      loading.value = false
    }
  }

  async function addQuestion(payload: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) {
    // Auto-générer ref T-X pour les questions théoriques du pool
    if (payload.type === 'theoretical' && !payload.studentId) {
      const nextNum = await db.questions.getNextTheoreticalRef()
      payload.ref = `T-${nextNum}`
    }

    // Associer automatiquement à la classe sélectionnée
    const questionData = {
      ...payload,
      classId: authStore.selectedClassId || undefined,
    }

    const q = await db.questions.create(questionData)
    if (!q.studentId) {
      pool.value.push(q)
    } else if (byStudent.value[q.studentId]) {
      byStudent.value[q.studentId].push(q)
    }
    return q
  }

  async function updateQuestion(id: string, payload: Partial<Question>) {
    const updated = await db.questions.update(id, payload)
    // Mise à jour dans pool ou byStudent
    const poolIdx = pool.value.findIndex(q => q.id === id)
    if (poolIdx !== -1) pool.value[poolIdx] = updated
    for (const list of Object.values(byStudent.value)) {
      const idx = list.findIndex(q => q.id === id)
      if (idx !== -1) { list[idx] = updated; break }
    }
    return updated
  }

  async function deleteQuestion(id: string) {
    await db.questions.delete(id)
    pool.value = pool.value.filter(q => q.id !== id)
    for (const key in byStudent.value) {
      byStudent.value[key] = byStudent.value[key].filter(q => q.id !== id)
    }
  }

  return {
    pool,
    byStudent,
    loading,
    fetchPool,
    fetchForStudent,
    addQuestion,
    updateQuestion,
    deleteQuestion,
  }
})
