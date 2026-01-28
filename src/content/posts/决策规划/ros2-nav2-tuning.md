---
title: "ROS 2 Navigation 2 在狭窄通道中的调优实战"
category: 决策规划
date: 2023-10-10
tags: [ROS2, Navigation, 调优]
excerpt: 面对仓储机器人常见的狭窄通道场景，默认的 Nav2 参数往往会导致抖动或卡死。分享代价地图与控制器参数的优化思路。
project: "ros2-nav"
---

# ROS 2 Navigation 2 在狭窄通道中的调优实战

## 问题描述

在仓储物流场景中，机器人经常需要通过宽度仅比机器人本体略宽的通道（例如 1.2m 通道，机器人宽度 1m）。使用 Nav2 默认参数时，会出现以下问题：

- **路径抖动**：在通道中左右摆动
- **速度骤降**：频繁急刹车或停止
- **局部最优卡死**：在通道入口徘徊不前

## 问题分析

### 默认参数的问题

Nav2 默认参数是为通用场景设计的，在狭窄通道中存在以下不适配：

```yaml
# 默认代价地图膨胀参数
inflation_radius: 0.55          # 膨胀半径
cost_scaling_factor: 10.0       # 代价缩放因子

# 默认 DWA 控制器参数
max_vel_x: 0.26                 # 最大速度
min_vel_x: -0.26                # 最小速度
acc_lim_x: 2.5                  # 加速度限制
vx_samples: 20                   # 速度采样数
```

在狭窄通道中，这些参数会导致：
1. 膨胀半径过大，可通行空间被过度压缩
2. 速度采样不够精细，难以找到最优路径

## 优化方案

### 1. 代价地图调优

#### 调整膨胀参数

```yaml
# 狭窄通道专用配置
inflation_layer:
  inflation_radius: 0.3          # 减小膨胀半径
  cost_scaling_factor: 5.0       # 降低代价增长速度

# 静态图层配置
static_layer:
  enabled: true
  map_subscribe_transient_local: true
  track_unknown_space: false     # 不跟踪未知空间
```

#### 使用分层代价地图

```yaml
# 根据区域动态调整
local_costmap:
  global_frame: odom
  robot_base_frame: base_link
  width: 3.0                     # 缩小局部地图范围
  height: 3.0
  resolution: 0.05               # 提高分辨率

  # 狭窄通道检测
  narrow_channel_detection:
    enabled: true
    corridor_threshold: 1.3      # 通道宽度阈值
    inflation_override: 0.25     # 检测到时使用更小膨胀
```

### 2. DWB 控制器调优

```yaml
# 使用 DWB 代替 DWA（更灵活）
DWBLocalPlanner:
  # 速度采样优化
  max_vel_x: 0.3
  min_vel_x: -0.15
  max_vel_y: 0.0
  min_vel_y: 0.0
  max_trans_vel: 0.3
  min_trans_vel: 0.05

  # 增加采样密度
  vx_samples: 30                  # 增加到 30
  vtheta_samples: 40              # 增加角速度采样

  # 轨迹评分权重
  path_distance_bias: 32.0        # 路径距离权重
  goal_distance_bias: 20.0        # 目标距离权重
  occdist_scale: 0.1              # 障碍物距离权重

  # 前瞻距离调整
  prune_distance: 0.8             # 狭窄通道中缩短前瞻
```

### 3. 路径规划器优化

```yaml
# 使用 Smac Planner* (Hybrid A*)
planner_server:
  ros__parameters:
    use_astar: false              # 使用 Hybrid A*
    allow_unknown: true           # 允许未知空间
    max_planning_time: 5.0

    # 狭窄通道参数
    smooth_path: true
    smoother:
      max_iterations: 1000
      w_smooth: 0.3                # 平滑权重
      w_data: 0.2                  # 数据拟合权重
      tolerance: 1e-6
```

## 实战效果

### 优化前后对比

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 通过成功率 | 62% | 94% | +32% |
| 平均通过时间 | 18s | 12s | -33% |
| 路径偏移量 | 15cm | 4cm | -73% |
| 停止次数 | 5-8 次 | 0-1 次 | -80% |

### 性能监控

```python
# 监控脚本
class NavigationMonitor:
    def __init__(self):
        self.path_deviations = []
        self.velocity_changes = []

    def check_narrow_corridor(self, costmap):
        """检测是否处于狭窄通道"""
        min_width = self._calculate_corridor_width(costmap)
        return min_width < 1.3  # 阈值

    def adjust_params_dynamically(self, is_narrow):
        """动态调整参数"""
        if is_narrow:
            self.set_inflation_radius(0.25)
            self.set_velocity_limit(0.2)
        else:
            self.restore_defaults()
```

## 调试技巧

### 1. 可视化代价地图

```bash
# 启动 RViz 并配置代价地图显示
ros2 launch nav2_bringup nav2_navigation_launch.py

# 添加以下显示：
# - Local Costmap / Global Costmap
# - Inflation Layer
# - Footprint
```

### 2. 路径分析工具

```bash
# 导出路径进行分析
ros2 topic echo /plan --csv > plan.csv

# Python 分析脚本
import pandas as pd
plan = pd.read_csv('plan.csv')
plan['curvature'] = calculate_curvature(plan)
plan['clearance'] = calculate_clearance(plan)
```

### 3. 参数调试流程

```
1. 基础调试
   ├── 确认地图精度
   ├── 验证机器人 footprint
   └── 检查传感器融合

2. 代价值调优
   ├── 调整 inflation_radius
   ├── 调整 cost_scaling_factor
   └── 验证膨胀层效果

3. 控制器调优
   ├── 调整速度采样范围
   ├── 优化轨迹评分权重
   └── 测试极限场景

4. 集成测试
   ├── 多场景验证
   ├── 压力测试
   └── 长时间稳定性测试
```

## 常见问题

### Q: 膨胀半径太小会撞到障碍物吗？

A: 不会。膨胀半径是用于路径规划的虚拟安全区域，实际碰撞检测由机器人 footprint 负责。可以适当减小膨胀半径以获得更紧凑的路径，同时保持 footprint 不变。

### Q: 为什么通道宽度判断阈值设为 1.3m？

A: 这取决于具体场景。经验值是 `机器人宽度 + 2 × 安全距离 + 传感器误差`。对于 1m 宽的机器人，1.3m 是一个较保守的阈值。

### Q: DWB 和 DWA 控制器如何选择？

A: DWB (Dynamic Window Batch) 是 DWA 的增强版，提供了更多的自定义选项。对于需要精细控制的场景（如狭窄通道），推荐使用 DWB。

## 总结

狭窄通道导航调优的关键点：

1. **减小膨胀半径**：释放可通行空间
2. **增加采样密度**：提高控制精度
3. **动态参数调整**：根据场景自适应
4. **充分测试验证**：覆盖各种通道宽度

通过这些优化，仓储机器人在狭窄通道中的通行能力得到了显著提升。

## 参考资源

- [ROS 2 Navigation 2 Documentation](https://navigation.ros.org/)
- [DWB Plugins Guide](https://github.com/ros-planning/navigation2/tree/main/nav2_dwb_controller)
