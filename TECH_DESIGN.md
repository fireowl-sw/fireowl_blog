# 技术设计

## 技术栈
- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router（多页面路由）
- React Markdown（Markdown 渲染）
- Remark/Rehype 插件（代码高亮、GFM 支持）

## 项目结构
```
fireowl_blog/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # 导航栏
│   │   │   ├── Footer.tsx          # 页脚
│   │   │   └── Layout.tsx          # 布局容器
│   │   ├── sections/
│   │   │   ├── Hero.tsx            # 首页 Hero 区域
│   │   │   ├── ArticleList.tsx     # 文章列表
│   │   │   ├── ProjectShowcase.tsx # 项目展示
│   │   │   └── About.tsx           # 关于我
│   │   └── md/
│   │       └── MarkdownRenderer.tsx # Markdown 渲染器
│   ├── pages/
│   │   ├── Home.tsx                # 首页
│   │   └── Article.tsx             # 文章详情页
│   ├── data/
│   │   ├── articles.ts             # 文章元数据
│   │   └── projects.ts             # 项目数据
│   ├── content/
│   │   └── posts/                  # 从 Obsidian 导出的 .md 文件
│   │       ├── general/            # 通用文章
│   │       ├── project-a/          # 按项目分类
│   │       └── project-b/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── images/                     # 文章图片资源
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 数据管理
- 文章元数据存储在 `src/data/articles.ts`
- 项目数据存储在 `src/data/projects.ts`
- 支持 YAML frontmatter 解析

## Obsidian 文章发布流程

### 文章格式
在 Obsidian 文章开头添加 YAML frontmatter：

```yaml
---
title: "文章标题"
category: sim|perception|planning
date: YYYY-MM-DD
tags: [标签1, 标签2]
excerpt: 文章摘要
project: "项目名称"
---
```

### 发布步骤
1. 在 Obsidian 中写文章
2. 将 `.md` 文件复制到 `src/content/posts/{项目名}/`
3. 在 `src/data/articles.ts` 中添加文章元数据
4. 图片放到 `public/images/{项目名}/`

### 示例
```typescript
// src/data/articles.ts
export const articles: Article[] = [
  {
    id: "unique-id",
    title: "文章标题",
    slug: "article-slug",
    category: "sim",
    date: "2025-01-28",
    excerpt: "文章摘要...",
    tags: ["标签1", "标签2"],
    project: "project-name"
  }
]
```

