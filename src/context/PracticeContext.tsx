import {
  createContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  buildQuestionLookup,
  createMistakePracticeSession,
  createPracticeSession,
  normalizeCategorySelection,
} from '../lib/practice'
import type {
  MistakeRecord,
  PracticeSession,
  QuestionBank,
  SliceQuestion,
} from '../types'

const SESSION_KEY = 'botany-slice-session'
const SELECTION_KEY = 'botany-slice-selection'
const MISTAKES_KEY = 'botany-slice-mistakes'

export interface PracticeContextValue {
  questionBank: QuestionBank
  session: PracticeSession | null
  selectedCategoryIds: string[]
  mistakeRecords: MistakeRecord[]
  setSelectedCategoryIds: (ids: string[]) => void
  beginPractice: (categoryIds: string[]) => PracticeSession | null
  beginMistakePractice: () => PracticeSession | null
  restartPractice: () => PracticeSession | null
  revealAnswer: (questionId: string) => void
  addToMistakes: (questionId: string) => void
  removeMistake: (questionId: string) => void
  clearMistakes: () => void
  goToIndex: (index: number) => void
  clearSession: () => void
  hasMistake: (questionId: string) => boolean
  getQuestionById: (questionId: string) => SliceQuestion | undefined
}

export const PracticeContext = createContext<PracticeContextValue | null>(null)

export function PracticeProvider({
  children,
  questionBank,
}: PropsWithChildren<{ questionBank: QuestionBank }>) {
  const questionLookup = buildQuestionLookup(questionBank)

  const [selectedCategoryIds, setSelectedCategoryIdsState] = useState<string[]>(
    () =>
      normalizeCategorySelection(
        readStored<string[]>(SELECTION_KEY) ?? [],
        questionBank,
      ),
  )
  const [mistakeRecords, setMistakeRecords] = useState<MistakeRecord[]>(
    () => sanitizeMistakes(readStored<MistakeRecord[]>(MISTAKES_KEY) ?? []),
  )
  const [session, setSession] = useState<PracticeSession | null>(() =>
    sanitizeSession(readStored<PracticeSession>(SESSION_KEY)),
  )

  useEffect(() => {
    writeStored(SELECTION_KEY, selectedCategoryIds)
  }, [selectedCategoryIds])

  useEffect(() => {
    writeStored(MISTAKES_KEY, mistakeRecords)
  }, [mistakeRecords])

  useEffect(() => {
    writeStored(SESSION_KEY, session)
  }, [session])

  function setSelectedCategoryIds(ids: string[]) {
    setSelectedCategoryIdsState(
      normalizeCategorySelection(ids, questionBank),
    )
  }

  function beginPractice(categoryIds: string[]): PracticeSession | null {
    const normalized = normalizeCategorySelection(categoryIds, questionBank)
    const next = createPracticeSession(normalized, questionBank)
    setSelectedCategoryIdsState(normalized)
    setSession(next)
    return next
  }

  function beginMistakePractice(): PracticeSession | null {
    const next = createMistakePracticeSession(mistakeRecords, questionBank)
    setSession(next)
    return next
  }

  function restartPractice(): PracticeSession | null {
    if (session?.mode === 'mistakes') {
      return beginMistakePractice()
    }
    const source = session?.selectedCategoryIds ?? selectedCategoryIds
    return beginPractice(source)
  }

  function revealAnswer(questionId: string) {
    setSession((prev) => {
      if (!prev || prev.revealedIds.includes(questionId)) return prev
      return {
        ...prev,
        revealedIds: [...prev.revealedIds, questionId],
      }
    })
  }

  function addToMistakes(questionId: string) {
    const question = questionLookup[questionId]
    if (!question) return

    const now = new Date().toISOString()

    setMistakeRecords((prev) => upsertMistake(prev, question, now))

    setSession((prev) => {
      if (!prev || prev.addedToMistakesIds.includes(questionId)) return prev
      return {
        ...prev,
        addedToMistakesIds: [...prev.addedToMistakesIds, questionId],
      }
    })
  }

  function removeMistake(questionId: string) {
    setMistakeRecords((prev) =>
      prev.filter((r) => r.questionId !== questionId),
    )
  }

  function clearMistakes() {
    setMistakeRecords([])
  }

  function goToIndex(index: number) {
    setSession((prev) => {
      if (!prev) return prev
      const max = Math.max(prev.questionOrder.length - 1, 0)
      return { ...prev, currentIndex: Math.min(Math.max(index, 0), max) }
    })
  }

  function clearSession() {
    setSession(null)
  }

  function hasMistake(questionId: string) {
    return mistakeRecords.some((r) => r.questionId === questionId)
  }

  return (
    <PracticeContext.Provider
      value={{
        questionBank,
        session,
        selectedCategoryIds,
        mistakeRecords,
        setSelectedCategoryIds,
        beginPractice,
        beginMistakePractice,
        restartPractice,
        revealAnswer,
        addToMistakes,
        removeMistake,
        clearMistakes,
        goToIndex,
        clearSession,
        hasMistake,
        getQuestionById: (id: string) => questionLookup[id],
      }}
    >
      {children}
    </PracticeContext.Provider>
  )
}

function sanitizeSession(
  session: PracticeSession | null,
): PracticeSession | null {
  if (!session) return null

  const valid = session.questionOrder.filter(Boolean)
  if (!valid.length) return null

  return {
    ...session,
    questionOrder: valid,
    currentIndex: Math.min(session.currentIndex, valid.length - 1),
    revealedIds: session.revealedIds.filter((id) => valid.includes(id)),
    addedToMistakesIds: session.addedToMistakesIds.filter((id) =>
      valid.includes(id),
    ),
  }
}

function sanitizeMistakes(
  records: MistakeRecord[],
): MistakeRecord[] {
  return records
    .map((r) => ({
      ...r,
      addedCount: Math.max(r.addedCount, 1),
    }))
    .sort((a, b) => b.lastAddedAt.localeCompare(a.lastAddedAt))
}

function upsertMistake(
  records: MistakeRecord[],
  question: SliceQuestion,
  addedAt: string,
): MistakeRecord[] {
  const existing = records.find((r) => r.questionId === question.id)
  if (!existing) {
    return [
      {
        questionId: question.id,
        categoryId: question.categoryId,
        addedCount: 1,
        lastAddedAt: addedAt,
      },
      ...records,
    ]
  }
  return [
    {
      ...existing,
      addedCount: existing.addedCount + 1,
      lastAddedAt: addedAt,
    },
    ...records.filter((r) => r.questionId !== question.id),
  ]
}

function readStored<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeStored(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    if (value === null) {
      window.localStorage.removeItem(key)
      return
    }
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    window.localStorage.removeItem(key)
  }
}
