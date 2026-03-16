// stores/useStudentsStore.ts
import { defineStore } from 'pinia'
import type { Student } from '~/types'

export const useStudentsStore = defineStore('students', () => {
  const db = useDB()

  const students = ref<Student[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      students.value = await db.students.getAll()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function addStudent(payload: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) {
    const created = await db.students.create(payload)
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
