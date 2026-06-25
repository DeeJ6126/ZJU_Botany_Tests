import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import type { FamilyQuestion, FamilyQuestionBank } from '../types'

const STORAGE_KEY = 'botany-family-session'
const BANK_PATH = `${import.meta.env.BASE_URL}family-questions.json`

export interface FamilySession {
  questionOrder: string[]
  currentIndex: number
}

export interface FamilyPracticeContextValue {
  questionBank: FamilyQuestionBank | null
  loading: boolean
  error: string | null
  session: FamilySession | null
  currentQuestion: FamilyQuestion | null
  /** 2D: answers[row][col]; col 0 = family, col 1 = species */
  answers: string[][]
  /** Whether the current question has been submitted */
  submitted: boolean
  /** Correct row indices after grading */
  correctRows: Set<number>
  setCell: (row: number, col: number, value: string) => void
  submitAnswer: () => void
  nextQuestion: () => void
  startSession: () => void
  reload: () => void
}

export const FamilyPracticeContext =
  createContext<FamilyPracticeContextValue | null>(null)

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Match user rows to expected entries (order-independent).
 *  Each expected entry can be used at most once.
 *  Returns the set of row indices that are correct. */
function gradeAnswers(
  answers: string[][],
  entries: FamilyQuestion['entries'],
): Set<number> {
  const used = new Set<number>() // used expected entry indices
  const correct = new Set<number>()

  for (let r = 0; r < answers.length; r++) {
    const [family, species] = answers[r]
    const familyClean = family.trim()
    const speciesClean = species.trim()

    for (let e = 0; e < entries.length; e++) {
      if (used.has(e)) continue
      const entry = entries[e]
      const familyMatch = familyClean === entry.family
      const speciesMatch =
        entry.species.length === 0 ||
        entry.species.some((s) => speciesClean === s)
      if (familyMatch && speciesMatch) {
        used.add(e)
        correct.add(r)
        break
      }
    }
  }
  return correct
}

function readSession(): FamilySession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FamilySession) : null
  } catch {
    return null
  }
}

function writeSession(session: FamilySession | null) {
  if (typeof window === 'undefined') return
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export function FamilyPracticeProvider({ children }: PropsWithChildren) {
  const [questionBank, setQuestionBank] = useState<FamilyQuestionBank | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<FamilySession | null>(readSession)
  const [answers, setAnswers] = useState<string[][]>([])
  const [submitted, setSubmitted] = useState(false)
  const [correctRows, setCorrectRows] = useState<Set<number>>(new Set())

  const fetchBank = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(BANK_PATH)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: FamilyQuestionBank = await res.json()
      setQuestionBank(json)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBank()
  }, [fetchBank])

  useEffect(() => {
    writeSession(session)
  }, [session])

  const currentQuestion: FamilyQuestion | null =
    session && questionBank
      ? questionBank.questions.find(
          (q) => q.id === session.questionOrder[session.currentIndex],
        ) ?? null
      : null

  // Resize answers when question changes
  useEffect(() => {
    if (currentQuestion && !submitted) {
      const n = currentQuestion.entries.length
      setAnswers(Array.from({ length: n }, () => ['', '']))
      setCorrectRows(new Set())
    }
  }, [currentQuestion?.id, submitted])

  const setCell = useCallback((row: number, col: number, value: string) => {
    setAnswers((prev) => {
      const next = prev.map((r) => [...r])
      if (row < next.length) {
        next[row][col] = value
      }
      return next
    })
  }, [])

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || submitted) return
    const correct = gradeAnswers(answers, currentQuestion.entries)
    setCorrectRows(correct)
    setSubmitted(true)
  }, [answers, currentQuestion, submitted])

  const nextQuestion = useCallback(() => {
    if (!session) return
    const nextIdx = session.currentIndex + 1
    if (nextIdx >= session.questionOrder.length) {
      // End of session — restart
      setSession({
        questionOrder: shuffle(session.questionOrder),
        currentIndex: 0,
      })
    } else {
      setSession({ ...session, currentIndex: nextIdx })
    }
    setSubmitted(false)
    setCorrectRows(new Set())
  }, [session])

  const startSession = useCallback(() => {
    if (!questionBank?.questions.length) return
    setSession({
      questionOrder: shuffle(questionBank.questions.map((q) => q.id)),
      currentIndex: 0,
    })
    setSubmitted(false)
    setCorrectRows(new Set())
  }, [questionBank])

  const reload = useCallback(() => {
    setSession(null)
    fetchBank()
  }, [fetchBank])

  return (
    <FamilyPracticeContext.Provider
      value={{
        questionBank,
        loading,
        error,
        session,
        currentQuestion,
        answers,
        submitted,
        correctRows,
        setCell,
        submitAnswer,
        nextQuestion,
        startSession,
        reload,
      }}
    >
      {children}
    </FamilyPracticeContext.Provider>
  )
}

export function useFamilyPractice(): FamilyPracticeContextValue {
  const ctx = useContext(FamilyPracticeContext)
  if (!ctx) {
    throw new Error(
      'useFamilyPractice must be used within <FamilyPracticeProvider>',
    )
  }
  return ctx
}
