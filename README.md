# Fireowl Tech Blog

专注于自动驾驶与机器人仿真的技术博客。

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **路由**: React Router v7
- **样式**: Tailwind CSS
- **部署**: Vercel

## 功能特性

### 📝 文章管理
- 基于 Markdown 的文章系统
- 支持分类和标签
- 自动生成目录（TOC）
- 代码高亮支持

### 🎨 界面设计
- 响应式设计，支持移动端
- 深色主题
- 平滑动画过渡效果
- 可收起的侧边栏目录导航

### 🚀 性能优化
- 代码分割和懒加载
- 图片优化加载
- 静态资源 CDN 加速

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看网站。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
fireowl_blog/
├── src/
│   ├── components/      # React 组件
│   │   ├── md/         # Markdown 渲染器
│   │   └── sections/   # 页面区块
│   ├── content/        # 内容文件
│   │   ├── posts/      # 文章 Markdown 文件
│   │   └── projects/   # 项目介绍
│   ├── data/           # 数据和配置
│   ├── pages/          # 页面组件
│   └── utils/          # 工具函数
├── public/             # 静态资源
└── dist/              # 构建输出（自动生成）
```

## 添加新文章

1. 在 `src/content/posts/` 目录下创建分类文件夹
2. 在分类文件夹中添加 Markdown 文件
3. 在文件顶部添加 frontmatter：

```markdown
---
title: 文章标题
category: 分类名称
date: 2024-01-01
excerpt: 文章摘要
image: https://example.com/cover.jpg
tags: 标签1, 标签2
---

# 文章内容

这里是文章正文...
```

## 配置

### 环境变量

创建 `.env.local` 文件（可选）：

```env
VITE_APP_TITLE=你的网站标题
```

## 部署

### Vercel 部署

项目已配置 Vercel 自动部署，推送到 `main` 分支即可自动触发部署。

### 手动部署

```bash
npm run build
# 将 dist 目录内容部署到你的服务器
```

## License

MIT

## 作者

Fireowl - 仿真工程师

专注于自动驾驶仿真、强化学习与传感器模拟技术。
