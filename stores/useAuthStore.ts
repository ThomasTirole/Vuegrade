// ============================================================
// STORE AUTH — Gestion utilisateur et classe sélectionnée
// ============================================================

import { defineStore } from 'pinia'
import type { User, Class } from '~/types'

interface AuthState {
  user: User | null
  selectedClassId: string | null
  classes: Class[]
  isLoading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    selectedClassId: null,
    classes: [],
    isLoading: true,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isTeacher: (state) => state.user?.role === 'teacher',
    isExpert: (state) => state.user?.role === 'expert',

    selectedClass: (state) => {
      if (!state.selectedClassId) return null
      return state.classes.find(c => c.id === state.selectedClassId) ?? null
    },

    /** Classes accessibles à l'utilisateur */
    accessibleClasses: (state) => state.classes,
  },

  actions: {
    /** Connexion utilisateur (simple email/password) */
    async login(email: string, password: string): Promise<boolean> {
      const db = useDB()

      try {
        // Chercher l'utilisateur par email
        const user = await db.users.getByEmail(email)

        if (!user) {
          console.error('Utilisateur non trouvé')
          return false
        }

        // TODO: Vérifier le mot de passe hashé
        // Pour l'instant, on accepte n'importe quel mot de passe (outil interne)
        // En production, utiliser bcrypt ou Supabase Auth

        this.user = user

        // Charger les classes accessibles
        await this.loadClasses()

        // Sélectionner la première classe par défaut
        if (this.classes.length > 0 && !this.selectedClassId) {
          this.selectedClassId = this.classes[0].id
        }

        // Persister en localStorage
        this.persistSession()

        return true
      } catch (error) {
        console.error('Erreur de connexion:', error)
        return false
      }
    },

    /** Charger les classes accessibles à l'utilisateur */
    async loadClasses() {
      if (!this.user) return

      const db = useDB()

      if (this.user.role === 'teacher') {
        // Un prof voit ses propres classes
        this.classes = await db.classes.getByTeacher(this.user.id)
      } else {
        // Un expert voit uniquement les classes où il est assigné
        this.classes = await db.classes.getForExpert(this.user.id)
      }
    },

    /** Changer la classe sélectionnée */
    selectClass(classId: string) {
      if (this.classes.some(c => c.id === classId)) {
        this.selectedClassId = classId
        this.persistSession()
      }
    },

    /** Déconnexion */
    logout() {
      this.user = null
      this.selectedClassId = null
      this.classes = []
      localStorage.removeItem('vugrade_session')
      navigateTo('/login')
    },

    /** Restaurer la session depuis localStorage */
    async restoreSession() {
      this.isLoading = true

      try {
        const stored = localStorage.getItem('vugrade_session')
        if (!stored) {
          this.isLoading = false
          return false
        }

        const session = JSON.parse(stored)
        const db = useDB()

        // Vérifier que l'utilisateur existe toujours
        const user = await db.users.getById(session.userId)
        if (!user) {
          localStorage.removeItem('vugrade_session')
          this.isLoading = false
          return false
        }

        this.user = user
        await this.loadClasses()

        // Restaurer la classe sélectionnée si elle existe encore
        if (session.classId && this.classes.some(c => c.id === session.classId)) {
          this.selectedClassId = session.classId
        } else if (this.classes.length > 0) {
          this.selectedClassId = this.classes[0].id
        }

        this.isLoading = false
        return true
      } catch (error) {
        console.error('Erreur restauration session:', error)
        localStorage.removeItem('vugrade_session')
        this.isLoading = false
        return false
      }
    },

    /** Persister la session en localStorage */
    persistSession() {
      if (!this.user) return

      localStorage.setItem('vugrade_session', JSON.stringify({
        userId: this.user.id,
        classId: this.selectedClassId,
      }))
    },
  },
})
