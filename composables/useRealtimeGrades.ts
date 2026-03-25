// composables/useRealtimeGrades.ts
// Écoute les changements de notes et sessions en temps réel via Supabase Realtime

import type { OralGrade, OralSession } from '~/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeGradePayload {
  id: string
  session_id: string
  student_id: string
  question_id: string
  expert_id: string
  score: number | null
  comment: string | null
  created_at: string
  updated_at: string
}

interface RealtimeSessionPayload {
  id: string
  student_id: string
  question_ids: string[]
  status: string
  notes: string | null
  total_score: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

function mapRealtimeGrade(data: RealtimeGradePayload): OralGrade {
  return {
    id: data.id,
    sessionId: data.session_id,
    studentId: data.student_id,
    questionId: data.question_id,
    expertId: data.expert_id,
    score: data.score,
    comment: data.comment ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function mapRealtimeSession(data: RealtimeSessionPayload): OralSession {
  return {
    id: data.id,
    studentId: data.student_id,
    questionIds: data.question_ids,
    grades: [],
    totalScore: data.total_score,
    status: data.status as OralSession['status'],
    notes: data.notes ?? undefined,
    startedAt: data.started_at ?? undefined,
    completedAt: data.completed_at ?? undefined,
  }
}

export const useRealtimeGrades = (
  studentId: Ref<string> | ComputedRef<string>,
  session: Ref<OralSession | null>,
  grades: Ref<OralGrade[]>
) => {
  const supabase = useSupabaseClient()
  let gradesChannel: RealtimeChannel | null = null
  let sessionChannel: RealtimeChannel | null = null

  const subscribeGrades = (sessionIdValue: string) => {
    // Cleanup ancien channel
    if (gradesChannel) {
      supabase.removeChannel(gradesChannel)
      gradesChannel = null
    }

    const channelName = `grades_${sessionIdValue}`
    console.log(`[Realtime] Subscribing to grades for session: ${sessionIdValue}`)

    gradesChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'oral_grades',
          filter: `session_id=eq.${sessionIdValue}`,
        },
        (payload) => {
          console.log('[Realtime] Grade event:', payload.eventType, payload)
          const { eventType, new: newRecord, old: oldRecord } = payload

          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const grade = mapRealtimeGrade(newRecord as RealtimeGradePayload)
            const existingIdx = grades.value.findIndex(g => g.id === grade.id)

            if (existingIdx !== -1) {
              grades.value[existingIdx] = grade
            } else {
              grades.value.push(grade)
            }
          } else if (eventType === 'DELETE') {
            const deletedId = (oldRecord as RealtimeGradePayload).id
            grades.value = grades.value.filter(g => g.id !== deletedId)
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Grades channel status: ${status}`)
      })
  }

  const subscribeSession = (studentIdValue: string) => {
    // Cleanup ancien channel
    if (sessionChannel) {
      supabase.removeChannel(sessionChannel)
      sessionChannel = null
    }

    const channelName = `session_${studentIdValue}`
    console.log(`[Realtime] Subscribing to session for student: ${studentIdValue}`)

    sessionChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'oral_sessions',
          filter: `student_id=eq.${studentIdValue}`,
        },
        (payload) => {
          console.log('[Realtime] Session event:', payload.eventType, payload)
          const { eventType, new: newRecord } = payload

          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const newSession = mapRealtimeSession(newRecord as RealtimeSessionPayload)
            // Préserver les grades existants
            newSession.grades = grades.value
            session.value = newSession

            // Si c'est une nouvelle session, s'abonner aux grades
            if (eventType === 'INSERT' && newSession.id) {
              subscribeGrades(newSession.id)
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Session channel status: ${status}`)
      })
  }

  const unsubscribe = () => {
    if (gradesChannel) {
      supabase.removeChannel(gradesChannel)
      gradesChannel = null
    }
    if (sessionChannel) {
      supabase.removeChannel(sessionChannel)
      sessionChannel = null
    }
  }

  // S'abonner quand studentId est disponible
  watch(
    () => toValue(studentId),
    (newStudentId) => {
      if (newStudentId) {
        subscribeSession(newStudentId)
      }
    },
    { immediate: true }
  )

  // S'abonner aux grades quand la session est disponible
  watch(
    () => session.value?.id,
    (newSessionId) => {
      if (newSessionId) {
        subscribeGrades(newSessionId)
      }
    },
    { immediate: true }
  )

  // Cleanup au démontage
  onUnmounted(() => {
    console.log('[Realtime] Cleanup channels')
    unsubscribe()
  })

  return {
    subscribeGrades,
    subscribeSession,
    unsubscribe,
  }
}
