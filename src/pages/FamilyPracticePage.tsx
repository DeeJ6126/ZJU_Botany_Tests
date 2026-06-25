import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useFamilyPractice } from '../context/FamilyPracticeContext'

export function FamilyPracticePage() {
  const {
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
  } = useFamilyPractice()

  // ── Loading / Error / Empty states ──────────────────

  if (loading) {
    return (
      <div className="page-stack">
        <section className="panel empty-state">
          <span className="eyebrow">Family quiz</span>
          <h1>正在载入科属题库</h1>
          <p>请稍候。</p>
        </section>
      </div>
    )
  }

  if (error || !questionBank) {
    return (
      <div className="page-stack">
        <section className="panel empty-state">
          <span className="eyebrow">Family quiz</span>
          <h1>题库加载失败</h1>
          <p>{error || '未知错误'}</p>
          <button className="primary-button" onClick={reload} type="button">
            重试
          </button>
        </section>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="page-stack">
        <section className="panel empty-state">
          <span className="eyebrow">Family quiz</span>
          <h1>科属练习</h1>
          <p>
            根据术语名称和描述，填写其代表科和代表物种。
            共 {questionBank.totalQuestions} 题。
          </p>
          <p className="scope-note">
            Enter 提交答案 · Space 下一题 · ↑↓←→ 切换输入框
          </p>
          <button
            className="primary-button"
            onClick={startSession}
            type="button"
          >
            开始练习
          </button>
        </section>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="page-stack">
        <section className="panel empty-state">
          <span className="eyebrow">Family quiz</span>
          <h1>题目不存在</h1>
          <button className="primary-button" onClick={startSession} type="button">
            重新开始
          </button>
        </section>
      </div>
    )
  }

  // ── Active practice ──────────────────────────────────

  const rows = currentQuestion.entries.length
  const total = session.questionOrder.length
  const current = session.currentIndex + 1

  const correctCount = correctRows.size
  const allCorrect = submitted && correctCount === rows

  return (
    <div className="page-stack">
      <section className="panel compact-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Family quiz</span>
            <h1>
              科属练习{' '}
              <span className="summary-pill">
                {current} / {total}
              </span>
            </h1>
          </div>
          <button
            className="ghost-button"
            onClick={startSession}
            type="button"
          >
            重新乱序
          </button>
        </div>
      </section>

      {/* Question */}
      <section className="panel">
        <div className="family-question-header">
          <span className="chapter-chip">{currentQuestion.term}</span>
        </div>
        <p className="family-description">{currentQuestion.description}</p>

        {submitted && allCorrect && (
          <p className="family-feedback is-correct">✓ 全部正确</p>
        )}
        {submitted && !allCorrect && (
          <p className="family-feedback is-incorrect">
            ✗ {correctCount}/{rows} 行正确
          </p>
        )}
      </section>

      {/* Answer matrix */}
      <section className="panel">
        <AnswerMatrix
          rows={rows}
          answers={answers}
          submitted={submitted}
          correctRows={correctRows}
          expectedEntries={currentQuestion.entries}
          onSetCell={setCell}
          onSubmit={submitAnswer}
          onNext={nextQuestion}
        />
      </section>

      {/* Keyboard hint */}
      <p className="scope-note" style={{ textAlign: 'center' }}>
        Enter 提交 · Space 下一题 · ↑↓←→ 移动焦点
      </p>
    </div>
  )
}

// ── Answer Matrix ──────────────────────────────────────

function AnswerMatrix({
  rows,
  answers,
  submitted,
  correctRows,
  expectedEntries,
  onSetCell,
  onSubmit,
  onNext,
}: {
  rows: number
  answers: string[][]
  submitted: boolean
  correctRows: Set<number>
  expectedEntries: { family: string; species: string[] }[]
  onSetCell: (row: number, col: number, value: string) => void
  onSubmit: () => void
  onNext: () => void
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: Math.max(rows, 1) }, () => [null, null]),
  )

  // Focus first cell when rows change
  useEffect(() => {
    inputRefs.current[0]?.[0]?.focus()
  }, [rows])

  function handleKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    row: number,
    col: number,
  ) {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        if (row > 0) inputRefs.current[row - 1]?.[col]?.focus()
        break
      case 'ArrowDown':
        e.preventDefault()
        if (row < rows - 1) inputRefs.current[row + 1]?.[col]?.focus()
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (col > 0) inputRefs.current[row]?.[col - 1]?.focus()
        break
      case 'ArrowRight':
        e.preventDefault()
        if (col < 1) inputRefs.current[row]?.[col + 1]?.focus()
        break
      case 'Enter':
        e.preventDefault()
        if (!submitted) onSubmit()
        break
      case ' ':
        if (submitted) {
          e.preventDefault()
          onNext()
        }
        break
    }
  }

  function getInputClass(row: number) {
    if (!submitted) return 'family-input'
    return correctRows.has(row)
      ? 'family-input is-correct'
      : 'family-input is-incorrect'
  }

  return (
    <div className="family-matrix">
      <div className="family-matrix-header">
        <span>代表科</span>
        <span>代表物种</span>
      </div>

      {Array.from({ length: rows }, (_, r) => (
        <div className="family-matrix-row" key={r}>
          <input
            ref={(el) => {
              inputRefs.current[r]![0] = el
            }}
            className={getInputClass(r)}
            type="text"
            placeholder="科名"
            value={answers[r]?.[0] ?? ''}
            onChange={(e) => onSetCell(r, 0, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, r, 0)}
            disabled={submitted}
            autoComplete="off"
          />
          <input
            ref={(el) => {
              inputRefs.current[r]![1] = el
            }}
            className={getInputClass(r)}
            type="text"
            placeholder="物种名"
            value={answers[r]?.[1] ?? ''}
            onChange={(e) => onSetCell(r, 1, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, r, 1)}
            disabled={submitted}
            autoComplete="off"
          />
          {submitted && (
            <span className="family-row-feedback">
              {correctRows.has(r) ? '✓' : `应为 ${expectedEntries[r]?.family || '?'} / ${expectedEntries[r]?.species.join('、') || '?'}`}
            </span>
          )}
        </div>
      ))}

      <div className="family-matrix-actions">
        {!submitted ? (
          <button
            className="primary-button"
            onClick={onSubmit}
            type="button"
          >
            提交答案
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={onNext}
            type="button"
            autoFocus
          >
            下一题
          </button>
        )}
      </div>
    </div>
  )
}
