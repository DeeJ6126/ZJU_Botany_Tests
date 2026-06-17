import { useCallback, useEffect, useState } from 'react'
import type { SliceQuestion } from '../types'
import { getImageSrc } from '../lib/practice'

interface LightboxProps {
  images: SliceQuestion[]
  initialIndex: number
  onClose: () => void
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Lock body scroll on mount
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i >= images.length - 1 ? 0 : i + 1))
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          goPrev()
          break
        case 'ArrowRight':
          e.preventDefault()
          goNext()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goPrev, goNext, onClose])

  // Guard empty list
  if (!images.length) {
    onClose()
    return null
  }

  const current = images[currentIndex]
  if (!current) return null

  const hasMultiple = images.length > 1

  return (
    <div
      className="lightbox-overlay"
      onClick={onClose}
      role="dialog"
      aria-label="图片灯箱"
    >
      {/* Close button */}
      <button
        className="lightbox-close"
        onClick={onClose}
        type="button"
        aria-label="关闭灯箱"
      >
        ✕
      </button>

      {/* Image stage */}
      <div
        className="lightbox-stage"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={getImageSrc(current.imagePath)}
          alt={current.sourceName}
        />

        {/* Caption */}
        <div className="lightbox-caption">
          <span>{current.answer}</span>
          {current.magnification && (
            <span>放大倍数：{current.magnification}</span>
          )}
        </div>

        {/* Navigation arrows */}
        {hasMultiple && (
          <>
            <button
              className="lightbox-nav lightbox-prev"
              onClick={goPrev}
              type="button"
              aria-label="上一张"
            >
              ←
            </button>
            <button
              className="lightbox-nav lightbox-next"
              onClick={goNext}
              type="button"
              aria-label="下一张"
            >
              →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
