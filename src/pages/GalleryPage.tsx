import { useState } from 'react'
import { usePractice } from '../hooks/usePractice'
import { getImageSrc } from '../lib/practice'
import {
  buildGalleryHierarchy,
  STAGE_LABELS,
  type GalleryImage,
  type GrowthStageGroup,
  type PlantTypeGroup,
} from '../lib/gallery'
import { Lightbox } from '../components/Lightbox'
import type { SliceQuestion } from '../types'

/** Pull the specimen name from a formatted answer like "双子叶——叶——丁香叶柄——10X". */
function extractPlantName(question: SliceQuestion): string {
  const parts = question.answer.split('——')
  return parts[2] || question.sourceName
}

export function GalleryPage() {
  const { questionBank } = usePractice()
  const hierarchy = buildGalleryHierarchy(
    questionBank.questions,
    questionBank.categories,
  )

  const [selectedOrganId, setSelectedOrganId] = useState<string | null>(null)
  const [lightboxGroup, setLightboxGroup] = useState<SliceQuestion[] | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  function openLightbox(images: SliceQuestion[], index: number) {
    setLightboxGroup(images)
    setLightboxIndex(index)
  }

  function closeLightbox() {
    setLightboxGroup(null)
  }

  // ── Empty state ────────────────────────────────────

  if (!hierarchy.totalImages) {
    return (
      <div className="page-stack">
        <section className="panel empty-state">
          <span className="eyebrow">Slice gallery</span>
          <h1>图库暂无内容</h1>
          <p>题库中暂无切片图片数据。</p>
        </section>
      </div>
    )
  }

  // ── Screen 2: Organ detail ─────────────────────────

  const selectedOrgan = selectedOrganId
    ? hierarchy.organs.find((o) => o.organId === selectedOrganId)
    : null

  if (selectedOrgan) {
    return (
      <div className="page-stack">
        {/* Back navigation */}
        <section className="panel compact-panel">
          <div className="section-heading">
            <div>
              <span className="chapter-chip">{selectedOrgan.organId}</span>
              <h1>{selectedOrgan.organTitle}</h1>
            </div>
            <span className="summary-pill">
              {selectedOrgan.totalImages} 张切片
            </span>
          </div>
          <div className="cta-row">
            <button
              className="ghost-button"
              onClick={() => setSelectedOrganId(null)}
              type="button"
            >
              ← 返回图库
            </button>
          </div>
        </section>

        {/* Plant-type groups */}
        {selectedOrgan.plantTypes.map((pt) => (
          <PlantTypeSection
            key={pt.plantType}
            group={pt}
            onOpenLightbox={openLightbox}
          />
        ))}

        {/* Lightbox */}
        {lightboxGroup && (
          <Lightbox
            images={lightboxGroup}
            initialIndex={lightboxIndex}
            onClose={closeLightbox}
          />
        )}
      </div>
    )
  }

  // ── Screen 1: Organ selection cards ────────────────

  return (
    <div className="page-stack">
      <section className="panel compact-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Slice gallery</span>
            <h1>图库</h1>
          </div>
        </div>
        <div className="selection-summary">
          <div className="summary-pill">
            器官分类 <strong>{hierarchy.organs.length}</strong>
          </div>
          <div className="summary-pill">
            切片总数 <strong>{hierarchy.totalImages}</strong>
          </div>
        </div>
        <p className="scope-note">
          选择一个器官分类，浏览该类别下的全部切片图。
          点击图片可放大查看详细信息。
        </p>
      </section>

      <section className="chapter-grid">
        {hierarchy.organs.map((organ) => (
          <button
            className="chapter-card"
            key={organ.organId}
            onClick={() => setSelectedOrganId(organ.organId)}
            type="button"
          >
            <div className="chapter-card-top">
              <span className="chapter-chip">{organ.organId}</span>
              <span className="chapter-count">
                {organ.totalImages} 张
              </span>
            </div>
            <h2>{organ.organTitle}</h2>
            <div className="chapter-card-footer">
              <span>点击浏览全部切片</span>
            </div>
          </button>
        ))}
      </section>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────

function PlantTypeSection({
  group,
  onOpenLightbox,
}: {
  group: PlantTypeGroup
  onOpenLightbox: (images: SliceQuestion[], index: number) => void
}) {
  const hasGrowthStages = group.growthStages && group.growthStages.length > 0

  return (
    <div className="gallery-plant-section">
      <div className="gallery-section-label">
        <span className="summary-pill">
          {group.label}{' '}
          <strong>{group.totalImages}</strong>
        </span>
      </div>

      {hasGrowthStages ? (
        group.growthStages!.map((stage) => (
          <GrowthStageSection
            key={stage.stage}
            stage={stage}
            onOpenLightbox={onOpenLightbox}
          />
        ))
      ) : (
        <ThumbnailGrid
          images={group.images}
          onOpenLightbox={onOpenLightbox}
        />
      )}
    </div>
  )
}

function GrowthStageSection({
  stage,
  onOpenLightbox,
}: {
  stage: GrowthStageGroup
  onOpenLightbox: (images: SliceQuestion[], index: number) => void
}) {
  if (!stage.images.length) return null

  return (
    <div className="gallery-plant-section">
      <div className="gallery-stage-label">
        <span className="chapter-pill">{STAGE_LABELS[stage.stage]}</span>
      </div>
      <ThumbnailGrid
        images={stage.images}
        onOpenLightbox={onOpenLightbox}
      />
    </div>
  )
}

function ThumbnailGrid({
  images,
  onOpenLightbox,
}: {
  images: GalleryImage[]
  onOpenLightbox: (images: SliceQuestion[], index: number) => void
}) {
  const questionList = images.map((img) => img.question)

  return (
    <div className="gallery-grid">
      {images.map((img, idx) => {
        const q = img.question
        return (
          <button
            key={q.id}
            className="gallery-card"
            onClick={() => onOpenLightbox(questionList, idx)}
            type="button"
          >
            <div className="slice-thumb">
              <img
                src={getImageSrc(q.imagePath)}
                alt={q.sourceName}
                loading="lazy"
              />
            </div>
            <div className="gallery-card-info">
              <span className="gallery-plant-name">
                {extractPlantName(q)}
              </span>
              {q.magnification && (
                <span className="gallery-magnification">
                  {q.magnification}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
