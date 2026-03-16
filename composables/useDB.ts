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
  // EXPERTS
  // ----------------------------------------------------------
  const experts = {
    async getAll(): Promise<Expert[]> {
      const { data, error } = await supabase.from('experts').select('*').order('role')
      if (error) throw error
      return data.map(e => ({
        id: e.id,
        name: e.name,
        initials: e.initials,
        role: e.role as Expert['role'],
      }))
    }
  }

  return { students, questions, oral, experts }
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
    studentId: d.student_id as string,
    questionId: d.question_id as string,
    scores: [], // enrichi côté composant avec les données expert
    finalScore: null,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
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
