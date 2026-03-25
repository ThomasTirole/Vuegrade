// ============================================================
// TYPES DOMAINE — VueGrade M294 (Multi-Tenancy)
// ============================================================

// ------------------------------------------------------------
// Users (profs + experts unifiés)
// ------------------------------------------------------------

export type UserRole = 'teacher' | 'expert'
export type UserStatus = 'pending' | 'active' | 'rejected'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  /** Statut du compte : pending (en attente), active (validé), rejected (refusé) */
  status: UserStatus
  /** Token GitHub chiffré (uniquement pour teachers) */
  githubTokenEncrypted?: string
  createdAt: string
  updatedAt: string
}

// ------------------------------------------------------------
// Classes
// ------------------------------------------------------------

export interface Class {
  id: string
  teacherId: string
  name: string
  year: number
  githubOrg?: string
  projectTemplate?: string
  pauseInterval: number
  pauseDuration: number
  pausePositions: { position: number; duration: number }[]
  createdAt: string
  updatedAt: string
}

// ------------------------------------------------------------
// ClassExpert (liaison many-to-many)
// ------------------------------------------------------------

export interface ClassExpert {
  classId: string
  userId: string
  createdAt: string
}

// ------------------------------------------------------------
// Expert (legacy - pour compatibilité pendant migration)
// ------------------------------------------------------------

export interface Expert {
  id: string
  name: string
  /** Initiales ex: KGE, FHE, TTI */
  initials: string
  role: 'teacher' | 'expert'
}

// ------------------------------------------------------------
// Élève & Projet
// ------------------------------------------------------------

export interface Student {
  id: string
  classId?: string
  name: string
  githubUsername: string
  /** URL du repo GitHub (calculée ou saisie manuellement) */
  repoUrl: string
  /** URL du site déployé (GitHub Pages ou autre) */
  deployUrl?: string
  projectDescription: string
  apiName: string
  apiUrl?: string
  /** Clé API de test fournie par l'enseignant */
  teacherApiKey?: string
  /** Clé API personnelle de l'élève (pour référence, ne pas afficher) */
  studentApiKey?: string
  /** Ordre de passage à l'oral */
  passageOrder?: number
  /** Heure de passage à l'oral (ex: "08:20") */
  passageTime?: string
  createdAt: string
  updatedAt: string
}

// ------------------------------------------------------------
// Questions
// ------------------------------------------------------------

export type QuestionType = 'theoretical' | 'practical'

export interface Question {
  id: string
  classId?: string
  type: QuestionType
  /** Référence courte ex: T-1, P-4 — générée dynamiquement à l'attribution */
  ref?: string
  title: string
  question: string
  /** Réponse attendue (visible uniquement par les experts) */
  expectedAnswer: string
  /** Indice à donner si l'élève bloque */
  hint?: string
  /** Extrait de code de référence (questions pratiques) */
  codeSnippet?: string
  /** Langage pour la coloration syntaxique */
  codeLanguage?: string
  /** Questions associées à un élève spécifique (null = pool commun) */
  studentId?: string | null
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// ------------------------------------------------------------
// Attribution des questions aux élèves
// ------------------------------------------------------------

export interface StudentQuestion {
  id: string
  studentId: string
  questionId: string
  /** Position dans la liste (1, 2, 3...) pour générer T-1, T-2, T-3 */
  position: number
  createdAt: string
}

// ------------------------------------------------------------
// Notation orale
// ------------------------------------------------------------

export interface ExpertScore {
  expertId: string
  expertName: string
  /** Note sur 6 */
  score: number | null
  comment?: string
}

export interface OralGrade {
  id: string
  sessionId: string
  studentId: string
  questionId: string
  expertId: string
  score: number | null
  comment?: string
  createdAt: string
  updatedAt: string
}

/** Calcule la note finale pour une question depuis tous les grades */
export function questionFinalScore(grades: OralGrade[], questionId: string): number | null {
  const scores = grades
    .filter(g => g.questionId === questionId)
    .map(g => g.score)
  return calculateFinalScore(scores)
}

// ------------------------------------------------------------
// Session d'oral
// ------------------------------------------------------------

export interface OralSession {
  id: string
  classId?: string
  studentId: string
  /** Questions sélectionnées pour cet élève */
  questionIds: string[]
  /** Notes par question */
  grades: OralGrade[]
  /** Note finale globale calculée */
  totalScore: number | null
  status: 'pending' | 'in_progress' | 'completed'
  notes?: string
  startedAt?: string
  completedAt?: string
}

// ------------------------------------------------------------
// GitHub — Gitflow
// ------------------------------------------------------------

export interface GitCommit {
  sha: string
  shortSha: string
  message: string
  author: string
  authorAvatar?: string
  date: string
  branch: string
  parents: string[]
}

export interface GitBranch {
  name: string
  lastCommitSha: string
  lastCommitDate: string
  isDefault: boolean
}

export interface GitflowData {
  branches: GitBranch[]
  commits: GitCommit[]
  /** Map sha -> branches contenant ce commit */
  commitBranchMap: Record<string, string[]>
  totalCommits: number
  lastActivity: string
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/** Calcule l'URL GitHub Pages depuis le repo */
export function inferDeployUrl(githubUsername: string, repoName: string): string {
  return `https://${githubUsername}.github.io/${repoName}`
}

/** Extrait le nom du repo depuis une URL GitHub */
export function extractRepoName(repoUrl: string): string {
  return repoUrl.split('/').pop()?.replace('.git', '') ?? ''
}

/** Calcule la note finale (moyenne arrondie à 0.5) */
export function calculateFinalScore(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null)
  if (valid.length === 0) return null
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length
  return Math.round(avg * 2) / 2
}

/** Pondération des notes M294 */
export const SCORE_LABELS: Record<number, string> = {
  6: 'Maîtrise le sujet',
  5: 'Très bien, il manque peu',
  4: 'Suffisant',
  3: 'Un peu vague',
  2: "Pas au clair",
  1: 'Aucune réponse',
}
