import { Link, useNavigate } from 'react-router-dom'
import { usePractice } from '../hooks/usePractice'
import { getImageSrc } from '../lib/practice'

export function MistakesPage() {
  const {
    mistakeRecords,
    beginMistakePractice,
    clearMistakes,
    removeMistake,
    getQuestionById,
  } = usePractice()
  const navigate = useNavigate()

  const mistakes = mistakeRecords
    .map((rec) => ({ rec, question: getQuestionById(rec.questionId) }))
    .filter((item): item is {
      rec: (typeof mistakeRecords)[number]
      question: NonNullable<ReturnType<typeof getQuestionById>>
    } => Boolean(item.question))

  function handleMistakePractice() {
    const next = beginMistakePractice()
    if (next) navigate('/practice')
  }

  if (!mistakes.length) {
    return (
      <div className="page-stack">
        <section className="panel empty-state">
          <span className="eyebrow">Mistake notebook</span>
          <h1>错题本还是空的</h1>
          <p>练习时揭晓答案后可手动将未掌握的题目加入这里。</p>
          <div className="cta-row">
            <Link className="primary-button" to="/categories">
              去选类练习
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="panel compact-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Mistake notebook</span>
            <h1>错题本</h1>
          </div>
          <div className="toolbar-actions">
            <button
              className="primary-button"
              onClick={handleMistakePractice}
              type="button"
            >
              开始重练错题
            </button>
            <button
              className="ghost-button"
              onClick={clearMistakes}
              type="button"
            >
              清空错题本
            </button>
          </div>
        </div>

        <div className="selection-summary">
          <div className="summary-pill">
            错题数量 <strong>{mistakes.length}</strong>
          </div>
        </div>

        <p className="scope-note">
          错题本记录了你需要复习的切片图。点击"开始重练错题"可按错题池重新练习；在练习中可随时决定移出。
        </p>
      </section>

      <section className="mistake-grid">
        {mistakes.map(({ rec, question }) => (
          <article className="panel mistake-card" key={rec.questionId}>
            <div className="mistake-card-top">
              <span className="chapter-chip">{question!.categoryId}</span>
              <span className="chapter-count">
                标记了 {rec.addedCount} 次
              </span>
            </div>

            <div className="slice-thumb">
              <img
                src={getImageSrc(question!.imagePath)}
                alt={question!.sourceName}
                loading="lazy"
              />
            </div>

            <h2 className="mistake-question">{question!.answer}</h2>

            <div className="practice-actions">
              <button
                className="secondary-button"
                onClick={() => removeMistake(rec.questionId)}
                type="button"
              >
                从错题本移除
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
