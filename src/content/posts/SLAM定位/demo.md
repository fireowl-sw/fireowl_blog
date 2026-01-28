---
title: "SLAM 定位技术解析"
category: SLAM定位
date: 2025-01-29
tags: [SLAM, 激光雷达, 定位]
excerpt: 同步定位与建图技术在无人车中的应用
image: "https://picsum.photos/seed/slam/600/400.jpg"
project: "slam"
---

# SLAM 定位技术解析

## 算法框架

### 激光 SLAM
- Cartographer
- GMapping
- LOAM

### 视觉 SLAM
- ORB-SLAM
- VINS-Mono
- DSO

## 实际应用

> "定位精度直接决定了车辆能否安全行驶"

| 算法 | 精度 | 计算量 |
|------|------|--------|
| Cartographer | 高 | 高 |
| GMapping | 中 | 中 |
| LOAM | 高 | 低 |
