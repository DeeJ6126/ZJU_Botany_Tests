import { Navigate, useNavigate } from 'react-router-dom'
import { usePractice } from '../hooks/usePractice'
import { getProgressSummary } from '../lib/practice'

export function PracticePage() {
  const {
    session,
    questionBank,
    mistakeRecords,
    revealAnswer,
    addToMistakes,
    removeMistake,
    restartPractice,
    goToIndex,
    hasMistake,
    getQuestionById,
  } = usePractice()
  const navigate = useNavigate()

  if (!session || !session.questionOrder.length) {
    return <Navigate replace to="/categories" />
  }

  const activeSession = session
  const questionId = activeSession.questionOrder[activeSession.currentIndex]
  const currentQuestion = getQuestionById(questionId)

  if (!currentQuestion) {
    return <Navigate replace to="/categories" />
  }

  const question = currentQuestion

  const isRevealed = activeSession.revealedIds.includes(question.id)
  const isInMistakes = hasMistake(question.id)
  const progress = getProgressSummary(activeSession)
  const category = questionBank.categories.find(
    (c) => c.id === question.categoryId,
  )

  function handleReveal() {
    revealAnswer(question.id)
  }

  function handleAddToMistakes() {
    addToMistakes(question.id)
  }

  function handleRemoveFromMistakes() {
    removeMistake(question.id)
  }

  function handleNext() {
    const idx = activeSession.currentIndex
    if (idx >= activeSession.questionOrder.length - 1) {
      navigate('/results')
      return
    }
    goToIndex(idx + 1)
  }

  function handlePrev() {
    goToIndex(activeSession.currentIndex - 1)
  }

  function handleRestart() {
    const next = restartPractice()
    if (next) navigate('/practice')
  }

  return (
    <div className="page-stack page-with-dock">
      <section className="panel compact-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {activeSession.mode === 'mistakes' ? 'Mistake drill' : 'Practice'}
            </span>
            <h1>{activeSession.title}</h1>
          </div>
          <div className="selection-summary">
            <div className="summary-pill">
              进度 <strong>{activeSession.currentIndex + 1}</strong> / {progress.total}
            </div>
            <div className="summary-pill">
              已揭晓 <strong>{progress.revealed}</strong>
            </div>
            <div className="summary-pill">
              错题本 <strong>{mistakeRecords.length}</strong>
            </div>
          </div>
        </div>
        <div className="progress-track" aria-hidden="true">
          <span
            className="progress-fill"
            style={{
              width: `${((activeSession.currentIndex + 1) / progress.total) * 100}%`,
            }}
          ></span>
        </div>
      </section>

      <section className="panel question-panel">
        <div className="question-meta">
          {isRevealed ? (
            <>
              <span className="chapter-chip">{question.categoryId}</span>
              <span className="summary-pill">{category?.title}</span>
              {isInMistakes ? (
                <span className="summary-pill is-active">已在错题本</span>
              ) : null}
            </>
          ) : (
            <span className="summary-pill">点击下方按钮揭晓答案</span>
          )}
        </div>

        {/* Image display */}
        <div className="slice-image-container">
          <img
            className="slice-image"
            src={question.imagePath}
            alt="植物学显微镜切片图"
            loading="lazy"
          />
        </div>

        {/* Answer section */}
        <div className={isRevealed ? 'answer-banner is-visible' : 'answer-banner'}>
          {isRevealed ? (
            <>
              <strong>答案</strong>
              <p className="answer-text">{question.answer}</p>
              <p className="answer-source">
                来源文件名：<code>{question.sourceName}</code>
              </p>
            </>
          ) : (
            <>
              <strong>等待揭晓</strong>
              <p>观察切片图后，点击下方按钮揭晓答案。</p>
            </>
          )}
        </div>

        {!isRevealed ? (
          <div className="practice-actions">
            <button
              className="primary-button reveal-button"
              onClick={handleReveal}
              type="button"
            >
              揭晓答案
            </button>
          </div>
        ) : (
          <div className="mistake-decision-panel">
            <p>
              {isInMistakes
                ? '这道题已在错题本中。'
                : '这道题还没有加入错题本。如果觉得需要复习，可以加入错题本。'}
            </p>
            <div className="practice-actions">
              {isInMistakes ? (
                <button
                  className="secondary-button"
                  onClick={handleRemoveFromMistakes}
                  type="button"
                >
                  从错题本移除
                </button>
              ) : (
                <button
                  className="secondary-button"
                  onClick={handleAddToMistakes}
                  type="button"
                >
                  加入错题本
                </button>
              )}
            </div>
          </div>
        )}

        <div className="practice-actions desktop-action-row">
          <button
            className="secondary-button"
            disabled={activeSession.currentIndex === 0}
            onClick={handlePrev}
            type="button"
          >
            上一题
          </button>

          <button className="primary-button" onClick={handleNext} type="button">
            {activeSession.currentIndex === activeSession.questionOrder.length - 1
              ? '查看结果'
              : '下一题'}
          </button>

          <button className="ghost-button" onClick={handleRestart} type="button">
            重新乱序开始
          </button>

          <button
            className="ghost-button"
            onClick={() => navigate('/mistakes')}
            type="button"
          >
            错题本
          </button>

          <button
            className="ghost-button"
            onClick={() => navigate('/categories')}
            type="button"
          >
            返回选类
          </button>
        </div>
      </section>

      <div className="mobile-dock mobile-dock-actions">
        <button
          className="secondary-button"
          disabled={activeSession.currentIndex === 0}
          onClick={handlePrev}
          type="button"
        >
          上一题
        </button>
        <button className="primary-button" onClick={handleNext} type="button">
          {activeSession.currentIndex === activeSession.questionOrder.length - 1
            ? '结果'
            : '下一题'}
        </button>
      </div>
    </div>
  )
}
