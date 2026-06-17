import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'

export type QualityMode = 'high' | 'low'

const STORAGE_KEY = 'botany-quality'

function readQuality(): QualityMode {
  if (typeof window === 'undefined') return 'high'
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw === 'low' ? 'low' : 'high'
  } catch {
    return 'high'
  }
}

export interface QualityContextValue {
  qualityMode: QualityMode
  toggleQuality: () => void
}

export const QualityContext = createContext<QualityContextValue | null>(null)

export function QualityProvider({ children }: PropsWithChildren) {
  const [qualityMode, setQualityMode] = useState<QualityMode>(readQuality)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, qualityMode)
    } catch {
      // localStorage unavailable — ignore
    }
  }, [qualityMode])

  const toggleQuality = useCallback(() => {
    setQualityMode((prev) => (prev === 'high' ? 'low' : 'high'))
  }, [])

  return (
    <QualityContext.Provider value={{ qualityMode, toggleQuality }}>
      {children}
    </QualityContext.Provider>
  )
}

export function useQuality(): QualityContextValue {
  const ctx = useContext(QualityContext)
  if (!ctx) {
    throw new Error('useQuality must be used within <QualityProvider>')
  }
  return ctx
}
