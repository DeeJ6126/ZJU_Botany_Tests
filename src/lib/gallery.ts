import type { SliceCategory, SliceQuestion } from '../types'

// ── Types ──────────────────────────────────────────────

export type GrowthStage = '初生' | '次生'

export interface GalleryImage {
  question: SliceQuestion
}

export interface GrowthStageGroup {
  stage: GrowthStage
  label: string
  images: GalleryImage[]
}

export interface PlantTypeGroup {
  plantType: '单子叶' | '双子叶'
  label: string
  totalImages: number
  /** Only present for 根/茎; absent for 叶/花. */
  growthStages?: GrowthStageGroup[]
  /** Flat list for 叶/花 (no growth-stage split). */
  images: GalleryImage[]
}

export interface OrganGroup {
  organId: string
  organTitle: string
  totalImages: number
  plantTypes: PlantTypeGroup[]
}

export interface GalleryHierarchy {
  organs: OrganGroup[]
  totalImages: number
}

// ── Constants ──────────────────────────────────────────

export const GALLERY_ORGANS = ['叶', '根', '茎', '花', '植物组织'] as const

export const PLANT_TYPE_LABELS: Record<string, string> = {
  '单子叶': '单子叶植物',
  '双子叶': '双子叶植物',
}

export const STAGE_LABELS: Record<GrowthStage, string> = {
  '初生': '初生·新生',
  '次生': '次生·老',
}

// ── Helpers ────────────────────────────────────────────

function classifyRootStage(sourceName: string): GrowthStage {
  return sourceName.includes('老根') ? '次生' : '初生'
}

function classifyStemStage(sourceName: string): GrowthStage {
  return sourceName.includes('次生茎') ? '次生' : '初生'
}

// ── Main ───────────────────────────────────────────────

export function buildGalleryHierarchy(
  questions: SliceQuestion[],
  categories: SliceCategory[],
): GalleryHierarchy {
  const organSet = new Set<string>(GALLERY_ORGANS)

  // Only keep gallery-relevant organs
  const byOrgan = new Map<string, SliceQuestion[]>()
  for (const q of questions) {
    if (!organSet.has(q.categoryId)) continue
    const bucket = byOrgan.get(q.categoryId)
    if (bucket) {
      bucket.push(q)
    } else {
      byOrgan.set(q.categoryId, [q])
    }
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const organOrder = GALLERY_ORGANS.filter((id) => byOrgan.has(id))

  const organs: OrganGroup[] = organOrder.map((organId) => {
    const organQuestions = byOrgan.get(organId)!
    const cat = categoryMap.get(organId)
    const title = cat?.title ?? organId

    // Group by plantType
    const monoQuestions = organQuestions.filter((q) => q.plantType === '单子叶')
    const dicotQuestions = organQuestions.filter((q) => q.plantType === '双子叶')
    const otherQuestions = organQuestions.filter(
      (q) => q.plantType !== '单子叶' && q.plantType !== '双子叶',
    )

    const plantTypes: PlantTypeGroup[] = []

    function buildPlantTypeGroup(
      pt: '单子叶' | '双子叶',
      qs: SliceQuestion[],
    ): PlantTypeGroup | null {
      if (!qs.length) return null

      // Only dicots show secondary-growth distinction; monocots lack true secondary growth
      const needsGrowthStage = (organId === '根' || organId === '茎') && pt === '双子叶'

      if (needsGrowthStage) {
        const stageClassifier =
          organId === '根' ? classifyRootStage : classifyStemStage

        const stageMap = new Map<GrowthStage, SliceQuestion[]>()
        for (const q of qs) {
          const stage = stageClassifier(q.sourceName)
          const bucket = stageMap.get(stage)
          if (bucket) {
            bucket.push(q)
          } else {
            stageMap.set(stage, [q])
          }
        }

        // Keep consistent order: 初生 first, 次生 second
        const stageOrder: GrowthStage[] = ['初生', '次生']
        const growthStages: GrowthStageGroup[] = stageOrder
          .filter((s) => stageMap.has(s))
          .map((stage) => ({
            stage,
            label: STAGE_LABELS[stage],
            images: stageMap.get(stage)!.map((q) => ({ question: q })),
          }))

        return {
          plantType: pt,
          label: PLANT_TYPE_LABELS[pt],
          totalImages: qs.length,
          growthStages,
          images: qs.map((q) => ({ question: q })),
        }
      }

      // 叶 / 花 — no growth-stage split
      return {
        plantType: pt,
        label: PLANT_TYPE_LABELS[pt],
        totalImages: qs.length,
        images: qs.map((q) => ({ question: q })),
      }
    }

    const monoGroup = buildPlantTypeGroup('单子叶', monoQuestions)
    const dicotGroup = buildPlantTypeGroup('双子叶', dicotQuestions)

    if (monoGroup) plantTypes.push(monoGroup)
    if (dicotGroup) plantTypes.push(dicotGroup)

    // Handle unknowns as "其他" if any
    if (otherQuestions.length) {
      plantTypes.push({
        plantType: '双子叶', // safe fallback display
        label: '其他',
        totalImages: otherQuestions.length,
        images: otherQuestions.map((q) => ({ question: q })),
      })
    }

    return {
      organId,
      organTitle: title,
      totalImages: organQuestions.length,
      plantTypes,
    }
  })

  return {
    organs,
    totalImages: organs.reduce((sum, o) => sum + o.totalImages, 0),
  }
}
