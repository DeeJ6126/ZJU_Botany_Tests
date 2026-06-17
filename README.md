# ZJU Botany Tests

浙江大学植物学切片识别练习平台。纯前端静态应用，基于 React + Vite + TypeScript。

## 快速启动

```bash
npm install
npm run dev          # 开发 → http://localhost:5173
npm run build        # 构建 → dist/
npm run generate:question-bank  # 刷新题库 JSON
```

## 项目结构

```
├── data/                           # 192 张切片图（5 个分类）
├── public/
│   ├── question-bank.json          # 自动生成的题库
│   └── data/ → junction            # 本地开发用，.gitignore 忽略
├── scripts/
│   └── generate_question_bank.py   # 题库生成脚本
├── src/
│   ├── types.ts                    # 所有 TypeScript 类型
│   ├── context/PracticeContext.tsx  # 全局状态管理
│   ├── hooks/
│   │   ├── useQuestionBank.ts      # 加载题库 JSON
│   │   └── usePractice.ts          # 访问 context
│   ├── lib/practice.ts             # 工具函数（建会话、洗牌、图片路径）
│   ├── pages/
│   │   ├── IntroPage.tsx           # 前言页
│   │   ├── CategorySelectionPage.tsx # 分类选择页
│   │   ├── PracticePage.tsx        # 练习页（看图→揭晓→错题）
│   │   ├── MistakesPage.tsx        # 错题本页
│   │   └── ResultsPage.tsx         # 结果页
│   └── components/AppLayout.tsx    # 导航布局
├── .github/workflows/deploy.yml    # GitHub Actions 部署
├── CLAUDE.md                       # AI 辅助开发约定
└── docs/repository-overview.md     # 交接文档
```

## 核心逻辑

### 练习流程
1. 用户选择分类（叶/根/茎/花/植物组织，可多选）
2. 所选图片随机排序，进入练习
3. 显示切片图 → 用户观察 → 点击"揭晓答案"
4. 揭晓后显示格式化答案：`单子叶——叶——小麦——10X`
5. 用户手动决定"加入错题本"或"跳过"
6. 全部完成后查看结果页

### 答题格式
答案格式为：`（单/双子叶）——（器官）——（名称）——放大倍数`
- 植物组织类中能识别的也按此格式，无法识别的保留原始名称
- 可在 `scripts/generate_question_bank.py` 中修改 `INTEGRAL_TERMS` 字典来调整拆词规则

### 状态管理
- `PracticeContext` 管理会话、错题本、分类选择
- 所有状态持久化到 `localStorage`
- 无生词本功能

### 数据生成
```bash
python scripts/generate_question_bank.py
```
扫描 `data/` 目录，从文件名提取答案分类。修改 `PLANT_CLASSIFICATION` 字典可调整单/双子叶标签。

### 图片服务
- 开发期：`public/data` → junction → `data/`
- 生产期：Vite 插件 `copy-data` 在构建时将 `data/` 复制到 `dist/data/`
- 图片路径通过 `getImageSrc()` 函数解析，自动添加 `BASE_URL` 前缀

## 部署

推送到 `main` 分支自动触发 GitHub Actions 构建并部署到 Pages：
`https://DeeJ6126.github.io/ZJU_Botany_Tests/`

## 技术栈

- React 19 + React Router 7
- Vite 8 + TypeScript 6
- GitHub Actions + GitHub Pages
- 纯 CSS（无 UI 框架）

## 待办 / 可改进

- [ ] 回答历史回顾（逐题回顾本次练习的揭晓结果）
- [ ] 统计图表（各分类掌握度）
- [ ] 离线 PWA 支持
- [ ] 分享/导出错题本
