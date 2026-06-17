import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppLayout } from './components/AppLayout'
import { PracticeProvider } from './context/PracticeContext'
import { QualityProvider } from './context/QualityContext'
import { useQuestionBank } from './hooks/useQuestionBank'
import { CategorySelectionPage } from './pages/CategorySelectionPage'
import { GalleryPage } from './pages/GalleryPage'
import { IntroPage } from './pages/IntroPage'
import { MistakesPage } from './pages/MistakesPage'
import { PracticePage } from './pages/PracticePage'
import { ResultsPage } from './pages/ResultsPage'

function App() {
  const { questionBank, loading, error, reload } = useQuestionBank()

  if (loading || !questionBank) {
    return (
      <div className="loading-screen">
        <div className="status-panel">
          <span className="eyebrow">Preparing slice deck</span>
          <h1>正在载入题库</h1>
          <p>正在读取切片题库、错题记录与练习配置，请稍候。</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="loading-screen">
        <div className="status-panel">
          <span className="eyebrow">Data unavailable</span>
          <h1>题库加载失败</h1>
          <p>{error}</p>
          <button className="primary-button" onClick={reload} type="button">
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <PracticeProvider questionBank={questionBank}>
      <QualityProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/categories" element={<CategorySelectionPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/mistakes" element={<MistakesPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </AppLayout>
      </QualityProvider>
    </PracticeProvider>
  )
}

export default App
