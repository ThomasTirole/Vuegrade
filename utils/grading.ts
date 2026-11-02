// utils/grading.ts
// Calcul des notes d'oral selon le barème de la classe (note 1–6 ou points) et la pondération T/P

import type { Class, Question, QuestionType } from '~/types'

export type GradingScale = 'grade' | 'points'

export interface GradingConfig {
  scale: GradingScale
  /** Points max par question (barème points) */
  maxPoints: number
  theoreticalWeight: number
  practicalWeight: number
}

export const DEFAULT_GRADING: GradingConfig = {
  scale: 'grade',
  maxPoints: 3,
  theoreticalWeight: 1,
  practicalWeight: 1.5,
}

export interface OralResult {
  /** Note finale arrondie au 0.5 */
  grade: number
  /** Note finale non arrondie (transparence) */
  exactGrade: number
  /** Barème points : total pondéré obtenu / possible (questions notées) */
  points?: number
  maxPoints?: number
  gradedCount: number
  totalCount: number
}

export function gradingFromClass(cls?: Class | null): GradingConfig {
  if (!cls) return DEFAULT_GRADING
  return {
    scale: cls.gradingScale ?? DEFAULT_GRADING.scale,
    maxPoints: cls.maxPoints ?? DEFAULT_GRADING.maxPoints,
    theoreticalWeight: cls.theoreticalWeight ?? DEFAULT_GRADING.theoreticalWeight,
    practicalWeight: cls.practicalWeight ?? DEFAULT_GRADING.practicalWeight,
  }
}

/** Valeurs proposées sur les boutons de notation */
export function scoreValues(cfg: GradingConfig): number[] {
  return cfg.scale === 'grade'
    ? [1, 2, 3, 4, 5, 6]
    : Array.from({ length: cfg.maxPoints + 1 }, (_, i) => i)
}

/** Convertit une valeur du barème en note 1–6 (formule fédérale pour les points) */
export function toGrade(value: number, cfg: GradingConfig): number {
  return cfg.scale === 'grade' ? value : (value / cfg.maxPoints) * 5 + 1
}

/** Niveau de couleur 1–6 (variables --score-1 à --score-6) */
export function scoreLevel(value: number, cfg: GradingConfig): number {
  return Math.min(6, Math.max(1, Math.round(toGrade(value, cfg))))
}

export function weightOf(type: QuestionType, cfg: GradingConfig): number {
  return type === 'practical' ? cfg.practicalWeight : cfg.theoreticalWeight
}

/** Moyenne des évaluateurs pour une question (non arrondie), null si aucune note */
export function averageScore(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

/**
 * Note finale de l'oral (provisoire tant que toutes les questions ne sont pas notées).
 * - grade  : moyenne pondérée des moyennes par question
 * - points : (Σ poids × points) / (Σ poids × max) × 5 + 1
 * Seules les questions notées comptent ; arrondi final au 0.5.
 */
export function computeOralResult(
  questions: Question[],
  getAverage: (questionId: string) => number | null,
  cfg: GradingConfig
): OralResult | null {
  let weighted = 0
  let weights = 0
  let gradedCount = 0

  for (const q of questions) {
    const avg = getAverage(q.id)
    if (avg === null) continue
    const w = weightOf(q.type, cfg)
    weighted += w * avg
    weights += w
    gradedCount++
  }
  if (gradedCount === 0) return null

  const base = { gradedCount, totalCount: questions.length }
  if (cfg.scale === 'grade') {
    const exactGrade = weighted / weights
    return { ...base, exactGrade, grade: roundHalf(exactGrade) }
  }

  const maxPoints = weights * cfg.maxPoints
  const exactGrade = (weighted / maxPoints) * 5 + 1
  return { ...base, exactGrade, grade: roundHalf(exactGrade), points: weighted, maxPoints }
}

export function roundHalf(value: number): number {
  return Math.round(value * 2) / 2
}

/** Affichage compact : 2 → "2", 2.5 → "2.5", 2.333 → "2.33" */
export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100)
}
