import { useNavigate } from 'react-router-dom'
import { usePractice } from '../hooks/usePractice'

export function CategorySelectionPage() {
  const {
    questionBank,
    selectedCategoryIds,
    setSelectedCategoryIds,
    beginPractice,
  } = usePractice()
  const navigate = useNavigate()
  const selectedSet = new Set(selectedCategoryIds)

  const selectedCount = selectedCategoryIds.length
  const selectedImageCount = questionBank.categories
    .filter((c) => selectedSet.has(c.id))
    .reduce((sum, c) => sum + c.imageCount, 0)

  function toggleCategory(id: string) {
    if (selectedSet.has(id)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((x) => x !== id))
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id])
    }
  }

  function startPractice() {
    const next = beginPractice(selectedCategoryIds)
    if (next) navigate('/practice')
  }

  return (
    <div className="page-stack page-with-dock">
      <section className="panel compact-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Category picker</span>
            <h1>选择分类</h1>
          </div>
          <div className="toolbar-actions">
            <button
              className="ghost-button"
              onClick={() =>
                setSelectedCategoryIds(
                  questionBank.categories.map((c) => c.id),
                )
              }
              type="button"
            >
              全选
            </button>
            <button
              className="ghost-button"
              onClick={() => setSelectedCategoryIds([])}
              type="button"
            >
              清空
            </button>
          </div>
        </div>

        <p className="scope-note">
          选择一个或多个植物器官分类，系统会从所选分类中随机抽取切片图进行识别练习。
        </p>

        <div className="selection-summary">
          <div className="summary-pill">
            分类 <strong>{questionBank.categories.length}</strong>
          </div>
          <div className="summary-pill">
            已选 <strong>{selectedCount}</strong>
          </div>
          <div className="summary-pill">
            本轮题量 <strong>{selectedImageCount}</strong>
          </div>
        </div>

        <div className="cta-row desktop-only">
          <button
            className="primary-button"
            disabled={!selectedCount}
            onClick={startPractice}
            type="button"
          >
            开始练习
          </button>
        </div>
      </section>

      <section className="chapter-grid">
        {questionBank.categories.map((cat) => {
          const isSelected = selectedSet.has(cat.id)
          return (
            <button
              className={
                isSelected ? 'chapter-card is-selected' : 'chapter-card'
              }
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              type="button"
            >
              <div className="chapter-card-top">
                <span className="chapter-chip">{cat.id}</span>
                <span className="chapter-count">{cat.imageCount} 张</span>
              </div>
              <h2>{cat.title}</h2>
              <div className="chapter-card-footer">
                <span>
                  {isSelected ? '已加入本轮练习' : '点击加入练习'}
                </span>
              </div>
            </button>
          )
        })}
      </section>

      <div className="mobile-dock">
        <div className="mobile-dock-copy">
          <span>已选 {selectedCount} 类</span>
          <strong>{selectedImageCount} 张切片待练</strong>
        </div>
        <button
          className="primary-button"
          disabled={!selectedCount}
          onClick={startPractice}
          type="button"
        >
          开始练习
        </button>
      </div>
    </div>
  )
}
