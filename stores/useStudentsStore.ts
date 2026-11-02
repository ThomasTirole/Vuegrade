// stores/useStudentsStore.ts
// Gère les élèves de la classe sélectionnée
import { defineStore } from 'pinia'
import type { Student } from '~/types'

export const useStudentsStore = defineStore('students', () => {
  const db = useDB()
  const authStore = useAuthStore()

  const students = ref<Student[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Recharge automatique quand la classe change
  watch(() => authStore.selectedClassId, (newClassId) => {
    if (newClassId) {
      fetchAll()
    } else {
      students.value = []
    }
  })

  async function fetchAll() {
    const classId = authStore.selectedClassId
    if (!classId) {
      students.value = []
      return
    }

    loading.value = true
    error.value = null
    try {
      students.value = await db.students.getAll(classId)
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function addStudent(payload: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) {
    // Associer automatiquement à la classe sélectionnée
    const studentData = {
      ...payload,
      classId: authStore.selectedClassId || undefined,
    }
    const created = await db.students.create(studentData)
    students.value.push(created)
    return created
  }

  async function updateStudent(id: string, payload: Partial<Student>) {
    const updated = await db.students.update(id, payload)
    const idx = students.value.findIndex(s => s.id === id)
    if (idx !== -1) students.value[idx] = updated
    return updated
  }

  /**
   * Réordonne le passage oral : passageOrder = position (1..n).
   * Les heures restent attachées aux créneaux (l'élève placé en 1er prend l'heure du 1er créneau).
   * Mise à jour optimiste, rechargement en cas d'erreur.
   */
  async function reorderStudents(orderedIds: string[]) {
    const ordered = orderedIds
      .map(id => students.value.find(s => s.id === id))
      .filter((s): s is Student => !!s)
    // Heures des créneaux dans l'ordre actuel
    const slotTimes = [...ordered]
      .sort((a, b) => (a.passageOrder ?? 999) - (b.passageOrder ?? 999))
      .map(s => s.passageTime)

    const changes = ordered
      .map((s, i) => ({ student: s, order: i + 1, time: slotTimes[i] }))
      .filter(c => c.student.passageOrder !== c.order || c.student.passageTime !== c.time)

    for (const c of changes) {
      c.student.passageOrder = c.order
      c.student.passageTime = c.time
    }

    try {
      await Promise.all(changes.map(c =>
        db.students.update(c.student.id, { passageOrder: c.order, passageTime: c.time ?? null } as Partial<Student>)
      ))
    } catch (e) {
      await fetchAll()
      throw e
    }
  }

  async function deleteStudent(id: string) {
    await db.students.delete(id)
    students.value = students.value.filter(s => s.id !== id)
  }

  // Sélecteur — élève par id
  function getById(id: string) {
    return computed(() => students.value.find(s => s.id === id))
  }

  return {
    students,
    loading,
    error,
    fetchAll,
    addStudent,
    updateStudent,
    reorderStudents,
    deleteStudent,
    getById,
  }
})
