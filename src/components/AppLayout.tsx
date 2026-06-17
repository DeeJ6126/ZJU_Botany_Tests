import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { usePractice } from '../hooks/usePractice'
import { useQuality } from '../context/QualityContext'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { questionBank, session, mistakeRecords } = usePractice()
  const { qualityMode, toggleQuality } = useQuality()
  const total = session?.questionOrder.length ?? questionBank.totalQuestions
  const answered = session?.revealedIds.length ?? 0

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" aria-hidden="true"></div>
      <div className="ambient ambient-right" aria-hidden="true"></div>

      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">B</div>
          <div className="brand-copy">
            <span className="eyebrow">Botany slice quiz</span>
            <strong>植物学切片识别</strong>
          </div>
        </div>

        <nav className="topnav" aria-label="Primary">
          <NavLink className={getNavClass} end to="/">前言</NavLink>
          <NavLink className={getNavClass} to="/categories">分类</NavLink>
          <NavLink className={getNavClass} to="/practice">练习</NavLink>
          <NavLink className={getNavClass} to="/gallery">图库</NavLink>
          <NavLink className={getNavClass} to="/mistakes">错题本</NavLink>
          <NavLink className={getNavClass} to="/results">结果</NavLink>
        </nav>

        <div className="status-group">
          <button
            className="quality-toggle"
            onClick={toggleQuality}
            type="button"
            title={qualityMode === 'high' ? '切换到流畅模式' : '切换到高质模式'}
          >
            {qualityMode === 'high' ? '◉ 高质' : '○ 流畅'}
          </button>
          <div className="status-pill">
            <span>进度</span>
            <strong>{answered}/{total}</strong>
          </div>
          <div className="status-pill">
            <span>错题本</span>
            <strong>{mistakeRecords.length}</strong>
          </div>
        </div>
      </header>

      <main className="page-shell">{children}</main>
    </div>
  )
}

function getNavClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-link is-active' : 'nav-link'
}
