# 交接文档 — ZJU Botany Tests

## 项目来源

基于 `E:\Microbiology\ZJU_Microbiology_tests` 的架构（React + Vite + TypeScript），
针对植物学切片识别场景重新设计。原项目是微生物学选择题练习，本项目改为切片图识别的揭晓式答题。

## 与微生物学项目的关键区别

| 特性 | 微生物学项目 | 本项目 |
|------|------------|--------|
| 题目类型 | 四选一选择题 | 看图识标本（无选项） |
| 答题方式 | 点击选项→立即判断对错 | 看图→点击揭晓→手动决定是否错题 |
| 答案格式 | A/B/C/D + 解析 | `单子叶——叶——小麦——10X` |
| 生词本 | ✅ 有 | ❌ 无 |
| 题库来源 | PDF 解析 + AI 生成 | 文件名自动提取 |
| 图片 | 外部 PDF 链接 | 本地 `data/` 目录内 |

## 状态管理

参考 `src/context/PracticeContext.tsx`。

### PracticeContext 提供的状态和方法

```
状态:
- questionBank          — 题库数据
- session               — 当前练习会话（mode/questionOrder/revealedIds）
- selectedCategoryIds   — 已选分类
- mistakeRecords       — 错题记录

方法:
- beginPractice(categoryIds)     — 开始新练习
- beginMistakePractice()         — 开始错题重练
- revealAnswer(questionId)       — 揭晓答案
- addToMistakes(questionId)      — 加入错题本
- removeMistake(questionId)      — 移出错题本
- goToIndex(index)               — 跳转到指定题号
```

### localStorage keys

| Key | 内容 |
|-----|------|
| `botany-slice-session` | 当前会话 JSON |
| `botany-slice-selection` | 已选分类 ID 数组 |
| `botany-slice-mistakes` | 错题记录数组 |

## 数据生成流程

1. 图片命名规范：`植物名[修饰]放大倍数-序号.jpg`
   - 如：`小麦叶10X-1.jpg`、`棉初生根40X-2.jpg`、`洋葱根尖40X中末期.jpg`
2. `generate_question_bank.py` 扫描 `data/` 目录：
   - 从文件名提取标本名（剥离放大倍数后缀）
   - 根据 `PLANT_CLASSIFICATION` 判断单/双子叶
   - 从文件名提取放大倍数（10X/40X/4X）
   - 根据分类和 `INTEGRAL_TERMS` 决定答案分段方式
3. 输出 `public/question-bank.json`

### 拆词规则

`INTEGRAL_TERMS` 集合定义了哪些术语的器官部分是名称不可分割的一部分。
例如 "初生根" 中的 "根" 不会被剥离，`棉初生根` 保持为完整名称。

## 图片路径方案

- **问题**：GitHub Pages 部署在子路径 `/ZJU_Botany_Tests/` 下
- **方案**：
  1. `question-bank.json` 中存储相对路径 `data/叶/xxx.jpg`
  2. 前端 `getImageSrc()` 函数拼接 `import.meta.env.BASE_URL`
  3. Vite 插件 `copy-data` 在 `closeBundle` 时将 `data/` 复制到 `dist/data/`
  4. 本地开发通过 `public/data` junction（已加入 `.gitignore`）

## GitHub Pages 部署

- 工作流：`.github/workflows/deploy.yml`
- 触发方式：push 到 `main`
- 构建环境变量：`GITHUB_PAGES=true`（Vite 据此设置 `base` 路径）
- 部署 URL：`https://DeeJ6126.github.io/ZJU_Botany_Tests/`

## 当前状态（截至 2026-06-17）

- ✅ 5 个分类、192 张切片图的完整题库
- ✅ 前端 5 个页面（前言/分类/练习/错题本/结果）
- ✅ 答案格式化（单/双子叶——器官——名称——放大倍数）
- ✅ GitHub Pages 自动部署
- ✅ 移动端适配

## 后续可能的工作

1. **错题本去重**：目前同题可多次加入错题本（累加 count），可考虑去重逻辑
2. **练习历史**：记录每次练习的完整结果（已揭晓/未揭晓/错题标记）
3. **分类统计**：按植物类型/器官展示掌握度
4. **搜索/筛选**：在错题本中按分类筛选
5. **数据补充**：可考虑用 AI 为每张切片图生成文字描述或识别要点
6. **图片文件名优化**：部分文件名包含空格（如 `水稻嫩根40X-2 .jpg`）或复杂格式
