---
title: "欢迎使用 Fireowl 技术博客"
category: 仿真器开发
date: 2025-01-28
tags: [介绍, 博客, React]
excerpt: 这是一篇演示文章，展示 Markdown 渲染效果和博客功能。
project: "general"
---

# 欢迎使用 Fireowl 技术博客

这是一个基于 **React + TypeScript + Vite** 构建的技术博客，专门用于分享自动驾驶与机器人仿真相关的技术内容。

## 关于博客

本博客支持以下功能：

- ✅ 从 Obsidian 直接导入 Markdown 文章
- ✅ 按项目文件夹组织内容
- ✅ Markdown 实时渲染
- ✅ 代码高亮显示
- ✅ 响应式设计

## 代码示例

### TypeScript 代码

```typescript
interface Article {
  id: string
  title: string
  slug: string
  category: 'sim' | 'perception' | 'planning'
  date: string
  excerpt: string
}

function getArticleUrl(slug: string): string {
  return `/article/${slug}`
}
```

### Python 代码

```python
import numpy as np

def simulate_lidar(num_points: int = 1000) -> np.ndarray:
    """模拟激光雷达点云数据"""
    # 生成随机点云
    points = np.random.rand(num_points, 3)
    return points

# 运行模拟
point_cloud = simulate_lidar()
print(f"Generated {len(point_cloud)} points")
```

## 功能特性

### 1. 仿真器开发
- CARLA
- SUMO
- Unreal Engine 5

### 2. 感知算法
- 目标检测
- 语义分割
- 传感器融合

### 3. 决策规划
- 路径规划
- 行为预测
- 运动控制

## 如何添加新文章

1. 在 Obsidian 中创建文章，添加 YAML frontmatter
2. 将文件复制到 `src/content/posts/{项目名}/`
3. 在 `src/data/articles.ts` 中注册文章

## 引用示例

> 仿真技术的不断发展为自动驾驶算法的快速迭代提供了强有力的支撑。

## 表格示例

| 技术 | 用途 | 难度 |
|------|------|------|
| CARLA | 城市仿真 | 中等 |
| SUMO | 交通流 | 简单 |
| UE5 | 高保真渲染 | 困难 |

---

感谢阅读！如有问题欢迎联系。
