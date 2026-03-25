// composables/useRealtimeGrades.ts
// Écoute les changements de notes en temps réel via Supabase Realtime

import type { OralGrade } from '~/types'
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

export const useRealtimeGrades = (
  sessionId: Ref<string | null>,
  grades: Ref<OralGrade[]>
) => {
  const supabase = useSupabaseClient()
  let channel: RealtimeChannel | null = null

  const subscribe = () => {
    if (!sessionId.value) return

    // Nom unique pour le channel
    const channelName = `oral_grades:session_id=eq.${sessionId.value}`

    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'oral_grades',
          filter: `session_id=eq.${sessionId.value}`,
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const grade = mapRealtimeGrade(newRecord as RealtimeGradePayload)
            const existingIdx = grades.value.findIndex(g => g.id === grade.id)

            if (existingIdx !== -1) {
              // Mise à jour
              grades.value[existingIdx] = grade
            } else {
              // Nouvelle note
              grades.value.push(grade)
            }
          } else if (eventType === 'DELETE') {
            const deletedId = (oldRecord as RealtimeGradePayload).id
            grades.value = grades.value.filter(g => g.id !== deletedId)
          }
        }
      )
      .subscribe()
  }

  const unsubscribe = () => {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  // S'abonner quand sessionId change
  watch(sessionId, (newId, oldId) => {
    if (oldId) unsubscribe()
    if (newId) subscribe()
  }, { immediate: true })

  // Cleanup au démontage
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    subscribe,
    unsubscribe,
  }
}
