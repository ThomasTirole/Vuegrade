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
    deleteStudent,
    getById,
  }
})
