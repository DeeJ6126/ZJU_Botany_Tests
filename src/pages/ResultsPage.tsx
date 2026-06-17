import { Link, Navigate, useNavigate } from 'react-router-dom'
import { usePractice } from '../hooks/usePractice'
import { getProgressSummary } from '../lib/practice'

export function ResultsPage() {
  const {
    session,
    questionBank,
    mistakeRecords,
    restartPractice,
    clearSession,
  } = usePractice()
  const navigate = useNavigate()

  if (!session || !session.questionOrder.length) {
    return <Navigate replace to="/categories" />
  }

  const progress = getProgressSummary(session)
  const categories = questionBank.categories.filter((c) =>
    session.selectedCategoryIds.includes(c.id),
  )

  function handleRestart() {
    const next = restartPractice()
    if (next) navigate('/practice')
  }

  function handleReturn() {
    clearSession()
    navigate('/categories')
  }

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Session summary</span>
            <h1>
              {session.mode === 'mistakes'
                ? '错题本练习结果'
                : '本轮练习结果'}
            </h1>
            <p className="lead">
              {session.title}
              {' '}
              {session.mode === 'mistakes'
                ? '已完成。错题是否移除由你在答题时手动决定。'
                : '已完成。揭晓后手动加入错题本的切片图已记录，可继续重练。'}
            </p>

            <div className="cta-row">
              <button
                className="primary-button"
                onClick={handleRestart}
                type="button"
              >
                再来一次
              </button>
              <button
                className="secondary-button"
                onClick={handleReturn}
                type="button"
              >
                返回选类
              </button>
              <Link className="ghost-button" to="/mistakes">
                打开错题本
              </Link>
            </div>
          </div>

          <aside className="panel inset-panel">
            <span className="eyebrow">Summary</span>
            <div className="result-spotlight">
              <strong>{progress.revealed}</strong>
              <span>已揭晓 / {progress.total} 总题数</span>
            </div>
          </aside>
        </div>
      </section>

      <section className="result-grid">
        <article className="panel result-card">
          <span className="eyebrow">Total</span>
          <strong>{progress.total}</strong>
          <p>总切片数</p>
        </article>
        <article className="panel result-card">
          <span className="eyebrow">Revealed</span>
          <strong>{progress.revealed}</strong>
          <p>已揭晓答案</p>
        </article>
        <article className="panel result-card">
          <span className="eyebrow">Remaining</span>
          <strong>{progress.remaining}</strong>
          <p>未揭晓</p>
        </article>
        <article className="panel result-card">
          <span className="eyebrow">Mistakes</span>
          <strong>{mistakeRecords.length}</strong>
          <p>错题本总题数</p>
        </article>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Selected categories</span>
            <h2>本轮分类</h2>
          </div>
        </div>

        <div className="chapter-pill-row">
          {categories.map((cat) => (
            <span className="chapter-pill" key={cat.id}>
              {cat.id}: {cat.title}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
