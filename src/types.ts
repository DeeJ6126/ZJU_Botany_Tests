export interface SliceCategory {
  id: string
  title: string
  imageCount: number
}

export interface SliceQuestion {
  id: string
  categoryId: string
  imagePath: string
  answer: string
  plantType: string
  magnification: string
  sourceName: string
}

export interface QuestionBank {
  generatedAt: string
  totalQuestions: number
  categories: SliceCategory[]
  questions: SliceQuestion[]
}

export type PracticeMode = 'categories' | 'mistakes'

export interface PracticeSession {
  mode: PracticeMode
  title: string
  selectedCategoryIds: string[]
  questionOrder: string[]
  currentIndex: number
  revealedIds: string[]
  addedToMistakesIds: string[]
  startedAt: string
}

export interface MistakeRecord {
  questionId: string
  categoryId: string
  addedCount: number
  lastAddedAt: string
}

// ── Family (科属代表植物) types ──────────────────────

export interface FamilyEntry {
  family: string
  species: string[]
  /** Optional annotation shown in feedback, NOT part of grading. */
  note?: string
}

export interface FamilyQuestion {
  id: string
  term: string
  description: string
  entries: FamilyEntry[]
}

export interface FamilyQuestionBank {
  generatedAt: string
  totalQuestions: number
  questions: FamilyQuestion[]
}

export interface CellResult {
  correct: boolean
  expectedFamily: string
  expectedSpecies: string[]
}

export type FamilyAnswerCell = string

export type FamilySubmitResult =
  | { kind: 'correct' }
  | { kind: 'incorrect'; rowResults: CellResult[] }
