import type {
  MistakeRecord,
  PracticeSession,
  QuestionBank,
  SliceQuestion,
} from '../types'

export function normalizeCategorySelection(
  categoryIds: string[],
  questionBank: QuestionBank,
): string[] {
  const allowed = new Set(questionBank.categories.map((c) => c.id))
  return Array.from(new Set(categoryIds)).filter((id) => allowed.has(id))
}

export function getPracticePool(
  questionBank: QuestionBank,
  categoryIds: string[],
): SliceQuestion[] {
  const selected = new Set(categoryIds)
  return questionBank.questions.filter((q) => selected.has(q.categoryId))
}

export function createPracticeSession(
  categoryIds: string[],
  questionBank: QuestionBank,
): PracticeSession | null {
  const selected = normalizeCategorySelection(categoryIds, questionBank)
  if (!selected.length) return null

  const pool = getPracticePool(questionBank, selected)
  if (!pool.length) return null

  return {
    mode: 'categories',
    title: buildSessionTitle(selected, questionBank),
    selectedCategoryIds: selected,
    questionOrder: shuffleArray(pool.map((q) => q.id)),
    currentIndex: 0,
    revealedIds: [],
    addedToMistakesIds: [],
    startedAt: new Date().toISOString(),
  }
}

export function createMistakePracticeSession(
  mistakes: MistakeRecord[],
  questionBank: QuestionBank,
): PracticeSession | null {
  const questionIds = Array.from(new Set(mistakes.map((m) => m.questionId)))
  if (!questionIds.length) return null

  const validIds = questionIds.filter((id) =>
    questionBank.questions.some((q) => q.id === id),
  )
  if (!validIds.length) return null

  const categoryIds = normalizeCategorySelection(
    Array.from(
      new Set(
        validIds
          .map((id) => questionBank.questions.find((q) => q.id === id))
          .filter((q): q is SliceQuestion => Boolean(q))
          .map((q) => q.categoryId),
      ),
    ),
    questionBank,
  )

  return {
    mode: 'mistakes',
    title: '错题本练习',
    selectedCategoryIds: categoryIds,
    questionOrder: shuffleArray(validIds),
    currentIndex: 0,
    revealedIds: [],
    addedToMistakesIds: [],
    startedAt: new Date().toISOString(),
  }
}

export function buildQuestionLookup(
  questionBank: QuestionBank,
): Record<string, SliceQuestion> {
  const lookup: Record<string, SliceQuestion> = {}
  for (const q of questionBank.questions) {
    lookup[q.id] = q
  }
  return lookup
}

export function getProgressSummary(session: PracticeSession | null) {
  const total = session?.questionOrder.length ?? 0
  const revealed = session?.revealedIds.length ?? 0
  const remaining = Math.max(total - revealed, 0)
  return { total, revealed, remaining }
}

/** Resolve a relative image path against the app's base URL. */
export function getImageSrc(imagePath: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${imagePath}`
}

function buildSessionTitle(
  categoryIds: string[],
  questionBank: QuestionBank,
): string {
  if (categoryIds.length === 1) {
    const cat = questionBank.categories.find((c) => c.id === categoryIds[0])
    return cat ? `${cat.title} 单类练习` : '单类练习'
  }
  return `${categoryIds.length} 类混练`
}

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}
