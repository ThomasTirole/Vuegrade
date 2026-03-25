// composables/useSupabase.ts
// Wrapper autour du client Supabase avec helpers typés

import type { Student, Question, OralSession, OralGrade, Expert } from '~/types'

export const useDB = () => {
  const supabase = useSupabaseClient()

  // ----------------------------------------------------------
  // STUDENTS
  // ----------------------------------------------------------
  const students = {
    async getAll(): Promise<Student[]> {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('passage_order', { ascending: true, nullsFirst: false })
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
    /** Récupère toutes les questions + les questions spécifiques à un élève */
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

    async getPool(): Promise<Question[]> {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .is('student_id', null)
        .order('type')
        .order('ref')
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

    /** Récupère les questions pratiques spécifiques à un élève */
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

    /** Récupère uniquement les questions théoriques du pool (sans student_id) */
    async getTheoreticalPool(): Promise<Question[]> {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .is('student_id', null)
        .eq('type', 'theoretical')
        .order('ref', { ascending: true })
      if (error) throw error
      return data.map(mapQuestion)
    },

    /** Calcule le prochain numéro T-X disponible pour une question théorique */
    async getNextTheoreticalRef(): Promise<number> {
      const { data, error } = await supabase
        .from('questions')
        .select('ref')
        .is('student_id', null)
        .eq('type', 'theoretical')
        .not('ref', 'is', null)
        .not('ref', 'eq', '')
      if (error) throw error

      // Extraire les numéros existants (T-1, T-2, etc.)
      const numbers = data
        .map(q => {
          const match = q.ref?.match(/^T-(\d+)$/)
          return match ? parseInt(match[1], 10) : 0
        })
        .filter(n => n > 0)

      // Retourner le max + 1, ou 1 si aucune question
      return numbers.length > 0 ? Math.max(...numbers) + 1 : 1
    },

    /** Récupère les questions attribuées à un élève pour l'oral :
     *  - Théoriques via student_questions (avec leur ref T-X original)
     *  - Pratiques directement liées (student_id = élève)
     */
    async getAssignedForStudent(studentId: string): Promise<Question[]> {
      // 1. Récupérer les IDs des questions théoriques attribuées
      const { data: assignedData, error: assignedError } = await supabase
        .from('student_questions')
        .select('question_id')
        .eq('student_id', studentId)

      if (assignedError) throw assignedError

      const assignedIds = assignedData.map(a => a.question_id)

      // 2. Récupérer les questions pratiques de l'élève
      const { data: practicalData, error: practicalError } = await supabase
        .from('questions')
        .select('*')
        .eq('student_id', studentId)
        .eq('type', 'practical')

      if (practicalError) throw practicalError

      // 3. Récupérer les questions théoriques attribuées
      let theoreticalQuestions: Question[] = []
      if (assignedIds.length > 0) {
        const { data: theoreticalData, error: theoreticalError } = await supabase
          .from('questions')
          .select('*')
          .in('id', assignedIds)

        if (theoreticalError) throw theoreticalError
        theoreticalQuestions = theoreticalData.map(mapQuestion)
      }

      // 4. Combiner et retourner
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

    async createSession(studentId: string, questionIds: string[]): Promise<OralSession> {
      const { data, error } = await supabase
        .from('oral_sessions')
        .insert({ student_id: studentId, question_ids: questionIds, status: 'pending' })
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
  // STUDENT QUESTIONS (liaison élève <-> questions théoriques du pool)
  // ----------------------------------------------------------
  const studentQuestions = {
    /** Récupère les questions théoriques attribuées à un élève (avec position) */
    async getForStudent(studentId: string): Promise<{ questionId: string; position: number }[]> {
      const { data, error } = await supabase
        .from('student_questions')
        .select('question_id, position')
        .eq('student_id', studentId)
        .order('position', { ascending: true })
      if (error) throw error
      return data.map(d => ({ questionId: d.question_id, position: d.position }))
    },

    /** Attribue une question du pool à un élève */
    async assign(studentId: string, questionId: string, position: number): Promise<void> {
      const { error } = await supabase
        .from('student_questions')
        .insert({ student_id: studentId, question_id: questionId, position })
      if (error) throw error
    },

    /** Retire une question attribuée à un élève */
    async unassign(studentId: string, questionId: string): Promise<void> {
      const { error } = await supabase
        .from('student_questions')
        .delete()
        .eq('student_id', studentId)
        .eq('question_id', questionId)
      if (error) throw error
    },

    /** Met à jour la position d'une question attribuée */
    async updatePosition(studentId: string, questionId: string, position: number): Promise<void> {
      const { error } = await supabase
        .from('student_questions')
        .update({ position })
        .eq('student_id', studentId)
        .eq('question_id', questionId)
      if (error) throw error
    },

    /** Réordonne toutes les questions d'un élève */
    async reorder(studentId: string, questionIds: string[]): Promise<void> {
      // Supprime puis réinsère dans le bon ordre
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
  // EXPERTS
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
  // SETTINGS
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

  return { students, questions, studentQuestions, oral, experts, settings }
}

// ----------------------------------------------------------
// Mappers snake_case → camelCase
// ----------------------------------------------------------
function mapStudent(d: Record<string, unknown>): Student {
  return {
    id: d.id as string,
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
