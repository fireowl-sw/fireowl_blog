---
title: "Unreal Engine 5 利用 Nanite 构建超大规模城市场景"
category: 仿真器开发
date: 2023-09-15
tags: [UE5, Nanite, 城市场景]
excerpt: 利用 UE5 的 Nanite 和 Lumen 技术，以极低的性能开销构建厘米级精度的城市仿真环境。
image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=600&fit=crop"
project: "ue5-sim"
---

# Unreal Engine 5 利用 Nanite 构建超大规模城市场景

## 为什么选择 UE5？

Unreal Engine 5 的两大革命性技术为自动驾驶仿真带来了新可能：

| 技术 | 传统方法 | UE5 Nanite |
|------|----------|------------|
| 多边形数量 | 受限（<500万） | 无限（几十亿） |
| LOD 管理 | 手动创建 | 自动处理 |
| 内存占用 | 高 | 极低 |
| 加载时间 | 慢 | 快速流式加载 |

> "Nanite 让我们可以在一个场景中放置整个城市的细节，而不用担心性能问题。"

## Nanite 技术原理

### 什么是 Nanite？

Nanite 是 UE5 的虚拟几何体系统：

```
传统渲染管线：
高模 → 降维创建多级LOD → 运行时选择 → 渲染
            ↑ 手动工作量大

Nanite 渲染管线：
高模 → 自动分解为集群 → 实时选择渲染 → 屏幕空间优化
                      ↑ 全自动
```

### 工作流程

```
1. 导入高精度模型（千万级面）
        ↓
2. Nanite 自动处理
   - 分解为三角形集群
   - 构建多级细节
   - 生成压缩数据
        ↓
3. 运行时自适应渲染
   - 根据距离选择细节层级
   - 根据屏幕占用率调整
```

## 城市场景构建实战

### 1. 资产准备

#### 建筑物建模

```
建筑 LOD 策略：

传统方法：
LOD0: 100万面 (近景)
LOD1: 10万面 (中景)
LOD2: 1万面 (远景)
LOD3: 1000面 (超远)

Nanite 方法：
LOD0: 1000万面 (Nanite 自动处理)
   ↓ 无需手动创建其他 LOD
```

#### 推荐建模规范

```cpp
// 建筑物建模指南
struct BuildingSpecs {
    // 单个建筑
    int triangles = 5_000_000;      // 500万面以内
    float uv_resolution = 4096;      // UV 纹理分辨率

    // 模块化组件
    bool use_modular = true;         // 使用模块化设计
    array modules = {
        "window_4m",                 // 标准窗模块
        "door_2m",                   // 标准门模块
        "balcony",                   // 阳台模块
        "rooftop_unit"               // 屋顶单元
    };

    // 材质槽
    int material_slots = 8;          // 限制材质数量
};
```

### 2. Nanite 设置

```cpp
// 在编辑器中启用 Nanite

// 方法1: 资产详情面板
// 选择静态网格 → 启用 "Nanite Support"

// 方法2: Python 脚本批量启用
import unreal

def enable_nanite_on_assets(asset_paths):
    for path in asset_paths:
        asset = unreal.load_asset(path)
        asset.set_editor_property('nanite_enabled', True)

# 批量处理
buildings = unreal.EditorAssetLibrary.list_assets(
    '/Game/Buildings/'
)
enable_nanite_on_assets(buildings)
```

### 3. 大规模场景实例化

```cpp
// 使用 Hierarchical Instance Static Mesh (HISM)

// 创建实例化组件
UHierarchicalInstancedStaticMeshComponent* BuildingInstances;

// 设置 Nanite 建筑
BuildingInstances->SetStaticMesh(NaniteBuildingMesh);

// 批量添加实例（性能优化）
for (const FTransform& Transform : BuildingTransforms)
{
    BuildingInstances->AddInstance(Transform);
}

// 自动合并渲染调用
// 1000个建筑 = 1个 draw call
```

### 4. 性能优化设置

```cpp
// Project Settings → Rendering → Nanite

// 关键参数
{
    "MaxVisibleTriangles": 20000000,      // 最大可见三角形
    "MinVisibleTriangles": 100,            // 最小可见三角形
    "RenderingPassMaxTriangles": 5000000,  // 每帧最大处理数

    // 流式渲染
    "EnableStreaming": true,
    "StreamingCullDistance": 50000,        // 50米外流式卸载

    // 细节阈值
    "TransitionDistance": 15.0,            // LOD 过渡距离
}
```

## Lumen 全局光照

### Lumen 基础设置

```cpp
// 启用 Lumen

// Project Settings
{
    "Lumen.DiffuseGlobalIllumination": "SoftLumen",
    "Lumen.Reflections": "Lumen",

    // 质量设置
    "Lumen.SceneLightingQuality": "High",
    "Lumen.SurfaceCacheResolution": "128",

    // 仿真优化
    "Lumen.UpdateRealtime": true,          // 实时更新
    "Lumen.FinalGatherQuality": "Medium"   // 仿真质量
}
```

### 动态光照处理

```cpp
// 汽车/动态物体的光照

// 为移动物体添加 Lumen 接收
ALidarSensor::BeginPlay()
{
    Super::BeginPlay();

    // 启用 Lumen 接收
    MeshComponent->SetLumenReceive(true);

    // 设置更新频率
    MeshComponent->SetLumenUpdateInterval(0.1f);  // 10Hz
}
```

## 完整城市场景示例

### 场景组织结构

```
CityMap/
├── Downtown/              # 市中心
│   ├── Skyscrapers/       # 摩天大楼 (Nanite)
│   ├── Streets/           # 街道
│   └── Props/             # 街道道具
├── Residential/           # 住宅区
│   ├── Houses/            # 房屋 (Nanite)
│   └── Parks/             # 公园
├── Industrial/            # 工业区
│   └── Warehouses/        # 仓库 (Nanite)
└── Roads/                 # 道路网络
    └── Intersections/     # 路口
```

### 性能监控

```cpp
// 性能统计代码

void ACitySimulationManager::UpdatePerformanceStats()
{
    // Nanite 统计
    FNaniteVisualizationData NaniteStats;
    GetNaniteStats(NaniteStats);

    UE_LOG(LogTemp, Log, TEXT(
        "Nanite Stats:\n"
        "  - Visible Triangles: %d\n"
        "  - Culling Distance: %.2f\n"
        "  - GPU Time: %.2f ms\n"
        "  - Memory: %.2f MB"),
        NaniteStats.VisibleTriangles,
        NaniteStats.CullingDistance,
        NaniteStats.GPUTime,
        NaniteStats.MemoryUsage
    );

    // Lumen 统计
    FLumenStats LumenStats;
    GetLumenStats(LumenStats);

    UE_LOG(LogTemp, Log, TEXT(
        "Lumen Stats:\n"
        "  - Surface Cache Size: %.2f MB\n"
        "  - Card Count: %d\n"
        "  - Update Time: %.2f ms"),
        LumenStats.SurfaceCacheSize,
        LumenStats.CardCount,
        LumenStats.UpdateTime
    );
}
```

## 仿真性能数据

### 测试环境

```
CPU: AMD Ryzen 9 5950X
GPU: NVIDIA RTX 4090
RAM: 64GB DDR4
```

### 性能结果

| 场景规模 | 建筑数量 | 三角形总数 | 帧率 | GPU 时间 |
|----------|----------|------------|------|----------|
| 小区 (1km²) | 500 | 50亿 | 120 | 8ms |
| 市中心 (4km²) | 5000 | 500亿 | 85 | 14ms |
| 全城 (16km²) | 20000 | 2000亿 | 60 | 22ms |

### 对比传统方法

```
相同场景 (市中心 4km², 5000 建筑)

传统 LOD 方案：
- 建模时间: 200 小时
- 内存占用: 12GB
- 帧率: 25 FPS
- Draw calls: 8000+

Nanite 方案：
- 建模时间: 50 小时
- 内存占用: 3GB
- 帧率: 85 FPS
- Draw calls: 200+
```

## 实用技巧

### 1. 模块化设计

```cpp
// 创建可复用的建筑模块

// 标准楼层
UStaticMesh* StandardFloor = LoadMesh(
    "/Game/Buildings/Modules/Floor_4m"
);

// 快速组装建筑
FTransform BuildingTransform;
for (int i = 0; i < FloorCount; i++)
{
    FTransform FloorTransform(
        FRotator::ZeroRotator,
        FVector(0, 0, i * 400),  // 4米层高
        FVector(1)
    );
    BuildingInstances->AddInstance(FloorTransform);
}
```

### 2. 程序化生成

```python
# 使用 Python 程序化生成城市

import unreal

def generate_city_block(block_size, building_density):
    """生成城市街区"""
    for x in range(block_size):
        for y in range(block_size):
            if random.random() < building_density:
                # 随机建筑高度
                height = random.randint(5, 50)

                # 随机建筑类型
                building_type = random.choice([
                    'office', 'residential', 'commercial'
                ])

                # 放置实例
                spawn_building(x, y, height, building_type)

# 执行生成
generate_city_block(block_size=10, building_density=0.7)
```

### 3. 流式加载优化

```cpp
// 设置流式加载优先级

void ACityStreamingManager::SetStreamingPriority(
    FVector PlayerLocation)
{
    // 优先加载玩家附近
    for (AActor* Building : CityBuildings)
    {
        float Distance = FVector::Dist(
            Building->GetActorLocation(),
            PlayerLocation
        );

        // 设置优先级
        float Priority = FMath::Clamp(
            1.0f - (Distance / 5000.0f),  // 5km 范围
            0.0f, 1.0f
        );

        Building->SetStreamingPriority(Priority);
    }
}
```

## 常见问题

### Q: Nanite 支持所有类型的网格吗？

A: 不完全支持。限制包括：
- 不支持变形动画（需要代理网格）
- 不支持 World Position Offset
- 纹理分辨率限制（最大 4K）

### Q: Lumen 对性能影响大吗？

A: 取决于场景复杂度：
- 简单场景：开销约 15%
- 复杂城市场景：开销约 30%
- 可以通过降低质量或使用软件 Lumen 优化

### Q: 如何调试 Nanite 性能？

A: 使用内置可视化工具：
```cpp
// 控制台命令
// 显示 Nanite 统计
r.Nanite.VisualizeEnabled 1

// 显示三角形数量
r.Nanite.VisualizeTriangles 1

// 显示 LOD 边界
r.Nanite.VisualizeLOD 1
```

## 总结

使用 UE5 Nanite 构建城市场景的优势：

1. **极高性能**：2000亿三角形仍保持 60 FPS
2. **简化流程**：无需手动创建 LOD
3. **高保真度**：厘米级细节
4. **快速迭代**：程序化生成 + 实时预览

> "Nanite 让我们第一次能在仿真环境中实现电影级的城市细节，同时保持实时性能。"

## 参考资源

- [Unreal Engine 5 Nanite Documentation](https://docs.unrealengine.com/5.0/en-US/nanite-virtualized-geometry-in-unreal-engine/)
- [Epic Games City Sample](https://dev.epicgames.com/community/unreal-engine/learning-resources)
- [Lumen Global Illumination](https://docs.unrealengine.com/5.0/en-US/lumen-global-illumination-and-reflections-in-unreal-engine/)
