import { useQuality } from '../context/QualityContext'

/**
Resolve an image path taking the current quality mode into account.
- "high" → uses original data/ path
- "low"  → swaps data/ → data_low/ for compressed versions

Lightbox / full-size views can bypass this by calling getImageSrc directly
(imported from src/lib/practice.ts).
*/
export function useImageSrc(imagePath: string): string {
  const { qualityMode } = useQuality()
  const base = import.meta.env.BASE_URL

  if (qualityMode === 'low') {
    // data/xxx/yyy.jpg → data_low/xxx/yyy.jpg
    const lowPath = imagePath.replace(/^data\//, 'data_low/')
    return `${base}${lowPath}`
  }

  return `${base}${imagePath}`
}
