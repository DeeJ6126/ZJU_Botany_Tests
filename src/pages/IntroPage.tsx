import { Link } from 'react-router-dom'
import { usePractice } from '../hooks/usePractice'

export function IntroPage() {
  const { questionBank, session, mistakeRecords } = usePractice()

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Plant histology quiz</span>
            <h1>植物学切片识别练习</h1>
            <p className="lead">
              通过观察植物器官的显微镜切片图来训练识别能力。当前题库包含{' '}
              {questionBank.categories.length} 个分类、{questionBank.totalQuestions}{' '}
              张切片图，支持分类随机练习与错题重练。
            </p>

            <div className="cta-row">
              <Link className="primary-button" to="/categories">
                开始选类
              </Link>
              {session ? (
                <Link className="ghost-button" to="/practice">
                  继续当前练习
                </Link>
              ) : null}
              <Link className="ghost-button" to="/mistakes">
                查看错题本
              </Link>
            </div>
          </div>

          <aside className="panel inset-panel">
            <span className="eyebrow">题库概览</span>
            <div className="metric-grid">
              <article className="metric-card">
                <strong>{questionBank.categories.length}</strong>
                <span>器官分类</span>
              </article>
              <article className="metric-card">
                <strong>{questionBank.totalQuestions}</strong>
                <span>切片图</span>
              </article>
              <article className="metric-card">
                <strong>{mistakeRecords.length}</strong>
                <span>道错题已记录</span>
              </article>
              <article className="metric-card">
                <strong>显微镜</strong>
                <span>10× / 40× 物镜</span>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel feature-card">
          <span className="eyebrow">01</span>
          <h2>分类清晰</h2>
          <p>按叶、根、茎、花、植物组织分类，可单类或多类随机练习。</p>
        </article>
        <article className="panel feature-card">
          <span className="eyebrow">02</span>
          <h2>先看后揭</h2>
          <p>先观察切片图再自行决定揭晓答案，模拟真实考试识别场景。</p>
        </article>
        <article className="panel feature-card">
          <span className="eyebrow">03</span>
          <h2>错题沉淀</h2>
          <p>揭晓答案后手动决定是否加入错题本，可按错题池重练。</p>
        </article>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">How it works</span>
            <h2>使用流程</h2>
          </div>
          <Link className="ghost-button" to="/categories">前往分类页</Link>
        </div>

        <div className="timeline-grid">
          <article className="timeline-step">
            <strong>选分类</strong>
            <p>勾选一个或多个器官分类，开始随机练习。</p>
          </article>
          <article className="timeline-step">
            <strong>看切片</strong>
            <p>观察显微镜切片图，回忆对应的植物结构名称。</p>
          </article>
          <article className="timeline-step">
            <strong>揭答案</strong>
            <p>点击揭晓按钮确认答案，判断自己是否掌握。</p>
          </article>
          <article className="timeline-step">
            <strong>记错题</strong>
            <p>未掌握的题目手动加入错题本，后续集中复习。</p>
          </article>
        </div>
      </section>
    </div>
  )
}
