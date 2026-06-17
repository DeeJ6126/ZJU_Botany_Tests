# CLAUDE.md — ZJU Botany Tests

## 项目概述

植物学切片识别练习平台。React + Vite + TypeScript，纯前端静态应用。

## 关键命令

```bash
npm run dev                        # 启动开发服务器
npm run build                      # 生产构建（自动复制 data/ 到 dist/data/）
npm run generate:question-bank     # 从 data/ 扫描生成题库 JSON
python scripts/generate_question_bank.py  # 同上
```

## 文件约定

- 类型定义：`src/types.ts`
- 状态管理：`src/context/PracticeContext.tsx`
- 工具函数：`src/lib/practice.ts`
- 页面组件：`src/pages/`（5 个页面，无生词本）
- 图片数据：`data/` 目录（不放入 `public/`）
- 题库 JSON：`public/question-bank.json`
- 生成脚本：`scripts/generate_question_bank.py`

## 关键架构决策

1. **无生词本** — 与微生物学项目不同，本应用不需要生词本功能
2. **揭晓式练习** — 不是选择题，而是看图→揭晓答案→决定是否加入错题本
3. **答案格式** — `单子叶——叶——小麦——10X`，四段式
4. **图片路径** — 相对路径 + `import.meta.env.BASE_URL` 运行时拼接
5. **数据复制** — 构建时通过 Vite 插件 `copy-data` 将 `data/` → `dist/data/`

## 分类体系

| 分类 ID | 说明 | 答案中器官字段 |
|---------|------|---------------|
| 叶 | 叶片类 | 叶 |
| 根 | 根类 | 根 |
| 茎 | 茎类 | 茎 |
| 花 | 花/生殖类 | 花 |
| 植物组织 | 各类组织切片 | 组织（或自动探测） |

## 单/双子叶分类

修改位置：`scripts/generate_question_bank.py` → `PLANT_CLASSIFICATION` 字典

## 常见修改场景

### 修改答案格式
编辑 `scripts/generate_question_bank.py` 中的 `build_formatted_answer()` 函数

### 添加新图片
1. 放入 `data/` 对应分类目录
2. 运行 `npm run generate:question-bank`
3. 提交并推送

### 调整拆词规则
编辑 `scripts/generate_question_bank.py` 中的 `INTEGRAL_TERMS` 集合
