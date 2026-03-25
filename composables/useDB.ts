// composables/useDB.ts
// Wrapper autour du client Supabase avec helpers typés (Multi-Tenancy)

import type { Student, Question, OralSession, OralGrade, Expert, User, Class } from '~/types'

export const useDB = () => {
  const supabase = useSupabaseClient()

  // ----------------------------------------------------------
  // USERS
  // ----------------------------------------------------------
  const users = {
    async getAll(): Promise<User[]> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('role')
        .order('name')
      if (error) throw error
      return data.map(mapUser)
    },

    async getById(id: string): Promise<User> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return mapUser(data)
    },

    async getByEmail(email: string): Promise<User | null> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      if (error) throw error
      return data ? mapUser(data) : null
    },

    async create(payload: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
      const { data, error } = await supabase
        .from('users')
        .insert(toSnake(payload))
        .select()
        .single()
      if (error) throw error
      return mapUser(data)
    },

    async update(id: string, payload: Partial<User>): Promise<User> {
      const { data, error } = await supabase
        .from('users')
        .update(toSnake(payload))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return mapUser(data)
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw error
    }
  }

  // ----------------------------------------------------------
  // CLASSES
  // ----------------------------------------------------------
  const classes = {
    async getAll(): Promise<Class[]> {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('year', { ascending: false })
        .order('name')
      if (error) throw error
      return data.map(mapClass)
    },

    async getById(id: string): Promise<Class> {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return mapClass(data)
    },

    async getByTeacher(teacherId: string): Promise<Class[]> {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('year', { ascending: false })
      if (error) throw error
      return data.map(mapClass)
    },

    async getForExpert(userId: string): Promise<Class[]> {
      const { data, error } = await supabase
        .from('class_experts')
        .select('class_id, classes(*)')
        .eq('user_id', userId)
      if (error) throw error
      return data.map(d => mapClass((d as any).classes))
    },

    async create(payload: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>): Promise<Class> {
      const { data, error } = await supabase
        .from('classes')
        .insert(toSnake(payload))
        .select()
        .single()
      if (error) throw error
      return mapClass(data)
    },

    async update(id: string, payload: Partial<Class>): Promise<Class> {
      const { data, error } = await supabase
        .from('classes')
        .update(toSnake(payload))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return mapClass(data)
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('classes').delete().eq('id', id)
      if (error) throw error
    },

    // Gestion des experts d'une classe
    async getExperts(classId: string): Promise<User[]> {
      const { data, error } = await supabase
        .from('class_experts')
        .select('user_id, users(*)')
        .eq('class_id', classId)
      if (error) throw error
      return data.map(d => mapUser((d as any).users))
    },

    async addExpert(classId: string, userId: string): Promise<void> {
      const { error } = await supabase
        .from('class_experts')
        .insert({ class_id: classId, user_id: userId })
      if (error) throw error
    },

    async removeExpert(classId: string, userId: string): Promise<void> {
      const { error } = await supabase
        .from('class_experts')
        .delete()
        .eq('class_id', classId)
        .eq('user_id', userId)
      if (error) throw error
    }
  }

  // ----------------------------------------------------------
  // STUDENTS
  // ----------------------------------------------------------
  const students = {
    async getAll(classId?: string): Promise<Student[]> {
      let query = supabase
        .from('students')
        .select('*')
        .order('passage_order', { ascending: true, nullsFirst: false })

      if (classId) {
        query = query.eq('class_id', classId)
      }

      const { data, error } = await query
      if (error) throw error
      return data.map(mapStudent)
    },

    async getById(id: string): Promise<Student> {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return mapStudent(data)
    },

    async create(payload: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
      const { data, error } = await supabase
        .from('students')
        .insert(toSnake(payload))
        .select()
        .single()
      if (error) throw error
      return mapStudent(data)
    },

    async update(id: string, payload: Partial<Student>): Promise<Student> {
      const { data, error } = await supabase
        .from('students')
        .update(toSnake(payload))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return mapStudent(data)
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
    }
  }

  // ----------------------------------------------------------
  // QUESTIONS
  // ----------------------------------------------------------
  const questions = {
    async getForStudent(studentId: string): Promise<Question[]> {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .or(`student_id.is.null,student_id.eq.${studentId}`)
        .order('type')
        .order('ref')
      if (error) throw error
      return data.map(mapQuestion)
    },

    async getPool(classId?: string): Promise<Question[]> {
      let query = supabase
        .from('questions')
        .select('*')
        .is('student_id', null)
        .order('type')
        .order('ref')

      if (classId) {
        query = query.eq('class_id', classId)
      }

      const { data, error } = await query
      if (error) throw error
      return data.map(mapQuestion)
    },

    async create(payload: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
      const { data, error } = await supabase
        .from('questions')
        .insert(toSnake(payload))
        .select()
        .single()
      if (error) throw error
      return mapQuestion(data)
    },

    async update(id: string, payload: Partial<Question>): Promise<Question> {
      const { data, error } = await supabase
        .from('questions')
        .update(toSnake(payload))
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return mapQuestion(data)
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('questions').delete().eq('id', id)
      if (error) throw error
    },

    async getPracticalForStudent(studentId: string): Promise<Question[]> {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('student_id', studentId)
        .eq('type', 'practical')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data.map(mapQuestion)
    },

    async getTheoreticalPool(classId?: string): Promise<Question[]> {
      let query = supabase
        .from('questions')
        .select('*')
        .is('student_id', null)
        .eq('type', 'theoretical')
        .order('ref', { ascending: true })

      if (classId) {
        query = query.eq('class_id', classId)
      }

      const { data, error } = await query
      if (error) throw error
      return data.map(mapQuestion)
    },

    async getNextTheoreticalRef(classId?: string): Promise<number> {
      let query = supabase
        .from('questions')
        .select('ref')
        .is('student_id', null)
        .eq('type', 'theoretical')
        .not('ref', 'is', null)
        .not('ref', 'eq', '')

      if (classId) {
        query = query.eq('class_id', classId)
      }

      const { data, error } = await query
      if (error) throw error

      const numbers = data
        .map(q => {
          const match = q.ref?.match(/^T-(\d+)$/)
          return match ? parseInt(match[1], 10) : 0
        })
        .filter(n => n > 0)

      return numbers.length > 0 ? Math.max(...numbers) + 1 : 1
    },

    async getAssignedForStudent(studentId: string): Promise<Question[]> {
      const { data: assignedData, error: assignedError } = await supabase
        .from('student_questions')
        .select('question_id')
        .eq('student_id', studentId)

      if (assignedError) throw assignedError

      const assignedIds = assignedData.map(a => a.question_id)

      const { data: practicalData, error: practicalError } = await supabase
        .from('questions')
        .select('*')
        .eq('student_id', studentId)
        .eq('type', 'practical')

      if (practicalError) throw practicalError

      let theoreticalQuestions: Question[] = []
      if (assignedIds.length > 0) {
        const { data: theoreticalData, error: theoreticalError } = await supabase
          .from('questions')
          .select('*')
          .in('id', assignedIds)

        if (theoreticalError) throw theoreticalError
        theoreticalQuestions = theoreticalData.map(mapQuestion)
      }

      const practicalQuestions = practicalData.map(mapQuestion)
      return [...theoreticalQuestions, ...practicalQuestions]
    }
  }

  // ----------------------------------------------------------
  // ORAL SESSIONS & GRADES
  // ----------------------------------------------------------
  const oral = {
    async getSessionByStudent(studentId: string): Promise<OralSession | null> {
      const { data, error } = await supabase
        .from('oral_sessions')
        .select(`*, oral_grades(*)`)
        .eq('student_id', studentId)
        .maybeSingle()
      if (error) throw error
      return data ? mapSession(data) : null
    },

    async createSession(studentId: string, questionIds: string[], classId?: string): Promise<OralSession> {
      const insert: Record<string, unknown> = {
        student_id: studentId,
        question_ids: questionIds,
        status: 'pending'
      }
      if (classId) insert.class_id = classId

      const { data, error } = await supabase
        .from('oral_sessions')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return mapSession(data)
    },

    async updateSessionStatus(sessionId: string, status: OralSession['status']): Promise<void> {
      const updates: Record<string, unknown> = { status }
      if (status === 'in_progress') updates.started_at = new Date().toISOString()
      if (status === 'completed') updates.completed_at = new Date().toISOString()
      const { error } = await supabase.from('oral_sessions').update(updates).eq('id', sessionId)
      if (error) throw error
    },

    async upsertGrade(payload: {
      sessionId: string
      studentId: string
      questionId: string
      expertId: string
      score: number
      comment?: string
    }): Promise<OralGrade> {
      const { data, error } = await supabase
        .from('oral_grades')
        .upsert({
          session_id: payload.sessionId,
          student_id: payload.studentId,
          question_id: payload.questionId,
          expert_id: payload.expertId,
          score: payload.score,
          comment: payload.comment ?? null,
        }, { onConflict: 'session_id,question_id,expert_id' })
        .select()
        .single()
      if (error) throw error
      return mapGrade(data)
    },

    async updateSessionTotal(sessionId: string, totalScore: number): Promise<void> {
      const { error } = await supabase
        .from('oral_sessions')
        .update({ total_score: totalScore })
        .eq('id', sessionId)
      if (error) throw error
    }
  }

  // ----------------------------------------------------------
  // STUDENT QUESTIONS
  // ----------------------------------------------------------
  const studentQuestions = {
    async getForStudent(studentId: string): Promise<{ questionId: string; position: number }[]> {
      const { data, error } = await supabase
        .from('student_questions')
        .select('question_id, position')
        .eq('student_id', studentId)
        .order('position', { ascending: true })
      if (error) throw error
      return data.map(d => ({ questionId: d.question_id, position: d.position }))
    },

    async assign(studentId: string, questionId: string, position: number): Promise<void> {
      const { error } = await supabase
        .from('student_questions')
        .insert({ student_id: studentId, question_id: questionId, position })
      if (error) throw error
    },

    async unassign(studentId: string, questionId: string): Promise<void> {
      const { error } = await supabase
        .from('student_questions')
        .delete()
        .eq('student_id', studentId)
        .eq('question_id', questionId)
      if (error) throw error
    },

    async updatePosition(studentId: string, questionId: string, position: number): Promise<void> {
      const { error } = await supabase
        .from('student_questions')
        .update({ position })
        .eq('student_id', studentId)
        .eq('question_id', questionId)
      if (error) throw error
    },

    async reorder(studentId: string, questionIds: string[]): Promise<void> {
      const { error: deleteError } = await supabase
        .from('student_questions')
        .delete()
        .eq('student_id', studentId)
      if (deleteError) throw deleteError

      if (questionIds.length > 0) {
        const inserts = questionIds.map((qId, idx) => ({
          student_id: studentId,
          question_id: qId,
          position: idx + 1
        }))
        const { error: insertError } = await supabase
          .from('student_questions')
          .insert(inserts)
        if (insertError) throw insertError
      }
    }
  }

  // ----------------------------------------------------------
  // EXPERTS (legacy - pour compatibilité)
  // ----------------------------------------------------------
  const experts = {
    async getAll(): Promise<Expert[]> {
      const { data, error } = await supabase.from('experts').select('*').order('role')
      if (error) throw error
      return data.map(mapExpert)
    },

    async getById(id: string): Promise<Expert> {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return mapExpert(data)
    },

    async create(payload: Omit<Expert, 'id'>): Promise<Expert> {
      const { data, error } = await supabase
        .from('experts')
        .insert({
          name: payload.name,
          initials: payload.initials,
          role: payload.role
        })
        .select()
        .single()
      if (error) throw error
      return mapExpert(data)
    },

    async update(id: string, payload: Partial<Omit<Expert, 'id'>>): Promise<Expert> {
      const { data, error } = await supabase
        .from('experts')
        .update({
          ...(payload.name && { name: payload.name }),
          ...(payload.initials && { initials: payload.initials }),
          ...(payload.role && { role: payload.role })
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return mapExpert(data)
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from('experts').delete().eq('id', id)
      if (error) throw error
    }
  }

  // ----------------------------------------------------------
  // SETTINGS (legacy - settings maintenant dans classes)
  // ----------------------------------------------------------
  const settings = {
    async getAll(): Promise<Record<string, string>> {
      const { data, error } = await supabase.from('settings').select('key, value')
      if (error) throw error
      return Object.fromEntries(data.map(s => [s.key, s.value]))
    },

    async get(key: string): Promise<string | null> {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .maybeSingle()
      if (error) throw error
      return data?.value ?? null
    },

    async set(key: string, value: string): Promise<void> {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value }, { onConflict: 'key' })
      if (error) throw error
    }
  }

  return { users, classes, students, questions, studentQuestions, oral, experts, settings }
}

// ----------------------------------------------------------
// Mappers snake_case → camelCase
// ----------------------------------------------------------
function mapUser(d: Record<string, unknown>): User {
  return {
    id: d.id as string,
    name: d.name as string,
    email: d.email as string,
    role: d.role as User['role'],
    githubTokenEncrypted: d.github_token_encrypted as string | undefined,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }
}

function mapClass(d: Record<string, unknown>): Class {
  return {
    id: d.id as string,
    teacherId: d.teacher_id as string,
    name: d.name as string,
    year: d.year as number,
    githubOrg: d.github_org as string | undefined,
    projectTemplate: d.project_template as string | undefined,
    pauseInterval: d.pause_interval as number,
    pauseDuration: d.pause_duration as number,
    pausePositions: d.pause_positions as { position: number; duration: number }[],
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }
}

function mapStudent(d: Record<string, unknown>): Student {
  return {
    id: d.id as string,
    classId: d.class_id as string | undefined,
    name: d.name as string,
    githubUsername: d.github_username as string,
    repoUrl: d.repo_url as string,
    deployUrl: d.deploy_url as string | undefined,
    projectDescription: d.project_description as string,
    apiName: d.api_name as string,
    apiUrl: d.api_url as string | undefined,
    teacherApiKey: d.teacher_api_key as string | undefined,
    passageOrder: d.passage_order as number | undefined,
    passageTime: d.passage_time as string | undefined,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }
}

function mapQuestion(d: Record<string, unknown>): Question {
  return {
    id: d.id as string,
    classId: d.class_id as string | undefined,
    type: d.type as Question['type'],
    ref: d.ref as string,
    title: d.title as string,
    question: d.question as string,
    expectedAnswer: d.expected_answer as string,
    hint: d.hint as string | undefined,
    codeSnippet: d.code_snippet as string | undefined,
    codeLanguage: d.code_language as string | undefined,
    studentId: d.student_id as string | null | undefined,
    tags: d.tags as string[] | undefined,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }
}

function mapSession(d: Record<string, unknown>): OralSession {
  const grades = Array.isArray(d.oral_grades)
    ? (d.oral_grades as Record<string, unknown>[]).map(mapGrade)
    : []
  return {
    id: d.id as string,
    classId: d.class_id as string | undefined,
    studentId: d.student_id as string,
    questionIds: d.question_ids as string[],
    grades,
    totalScore: d.total_score as number | null,
    status: d.status as OralSession['status'],
    notes: d.notes as string | undefined,
    startedAt: d.started_at as string | undefined,
    completedAt: d.completed_at as string | undefined,
  }
}

function mapGrade(d: Record<string, unknown>): OralGrade {
  return {
    id: d.id as string,
    sessionId: d.session_id as string,
    studentId: d.student_id as string,
    questionId: d.question_id as string,
    expertId: d.expert_id as string,
    score: d.score as number | null,
    comment: d.comment as string | undefined,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }
}

function mapExpert(d: Record<string, unknown>): Expert {
  return {
    id: d.id as string,
    name: d.name as string,
    initials: d.initials as string,
    role: d.role as Expert['role'],
  }
}

/** Convertit un objet camelCase en snake_case pour Supabase */
function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    result[snakeKey] = value
  }
  return result
}
