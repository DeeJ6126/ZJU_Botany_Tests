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
