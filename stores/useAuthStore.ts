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
    /** Connexion utilisateur (email/password) */
    async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
      const db = useDB()

      try {
        // Vérifier les identifiants
        const user = await db.users.verifyCredentials(email, password)

        if (!user) {
          return { success: false, error: 'Email ou mot de passe incorrect' }
        }

        // Vérifier le statut du compte
        if (user.status === 'pending') {
          return { success: false, error: 'Votre compte est en attente de validation' }
        }

        if (user.status === 'rejected') {
          return { success: false, error: 'Votre compte a été refusé' }
        }

        this.user = user

        // Charger les classes accessibles
        await this.loadClasses()

        // Sélectionner la première classe par défaut
        if (this.classes.length > 0 && !this.selectedClassId) {
          this.selectedClassId = this.classes[0].id
        }

        // Persister en localStorage
        this.persistSession()

        return { success: true }
      } catch (error) {
        console.error('Erreur de connexion:', error)
        return { success: false, error: 'Erreur de connexion' }
      }
    },

    /** Inscription d'un nouvel utilisateur */
    async register(payload: {
      name: string
      email: string
      password: string
      role: 'teacher' | 'expert'
    }): Promise<{ success: boolean; error?: string }> {
      const db = useDB()

      try {
        // Vérifier si l'email existe déjà
        const existing = await db.users.getByEmail(payload.email)
        if (existing) {
          return { success: false, error: 'Cet email est déjà utilisé' }
        }

        // Créer le compte (status = pending)
        await db.users.register(payload)

        return { success: true }
      } catch (error) {
        console.error('Erreur d\'inscription:', error)
        return { success: false, error: 'Erreur lors de l\'inscription' }
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
      if (import.meta.client) {
        localStorage.removeItem('vugrade_session')
      }
      navigateTo('/login')
    },

    /** Restaurer la session depuis localStorage */
    async restoreSession() {
      // SSR guard - localStorage n'existe pas côté serveur
      if (import.meta.server) {
        this.isLoading = false
        return false
      }

      this.isLoading = true

      try {
        const stored = localStorage.getItem('vugrade_session')
        if (!stored) {
          this.isLoading = false
          return false
        }

        const session = JSON.parse(stored)
        const db = useDB()

        // Vérifier que l'utilisateur existe toujours et est actif
        const user = await db.users.getById(session.userId)
        if (!user || user.status !== 'active') {
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
      if (!this.user || import.meta.server) return

      localStorage.setItem('vugrade_session', JSON.stringify({
        userId: this.user.id,
        classId: this.selectedClassId,
      }))
    },
  },
})
