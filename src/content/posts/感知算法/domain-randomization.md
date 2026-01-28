---
title: "基于 Domain Randomization 的 Sim-to-Real 迁移策略"
category: 感知算法
date: 2023-09-28
tags: [Sim-to-Real, 强化学习, 感知]
excerpt: 如何让在虚拟环境中训练的感知模型直接用于真车？探讨纹理、光照和物理参数的随机化策略。
project: "sim2real"
---

# 基于 Domain Randomization 的 Sim-to-Real 迁移策略

## 核心问题

在虚拟环境中训练的感知模型，直接部署到真实世界时往往性能大幅下降。这就是经典的 **Sim-to-Real Gap** 问题。

> "理想情况下，我们希望仿真环境足够多样化，使得真实世界只是仿真环境分布中的一个样本。"

## Domain Randomization 原理

### 基本思想

与其追求 photorealistic（照片级真实），不如让仿真环境在 **视觉、物理、传感器** 等维度上随机变化，迫使模型学习到 domain-invariant 的特征。

```
传统方法：
仿真 → 拟合真实 → 单一环境 → 模型 → 真实世界（泛化差）

Domain Randomization：
仿真 → 大量随机变化 → 模型 → 真实世界（泛化好）
```

### 为什么有效？

| 采样策略 | 仿真复杂度 | 模型鲁棒性 | 适用场景 |
|----------|------------|------------|----------|
| 单一仿真 | 低 | 低 | 概念验证 |
| Domain Adaptation | 高 | 中 | 固定场景 |
| **Domain Randomization** | 中 | **高** | **变化场景** |

## 随机化维度

### 1. 视觉随机化

#### 纹理随机化

```python
def randomize_textures(scene):
    """随机化场景纹理"""
    texture_library = load_textures()

    for object in scene.objects:
        # 随机选择纹理
        texture = random.choice(texture_library)

        # 随机调整颜色
        color_variation = np.random.uniform(0.7, 1.3, 3)
        texture.set_color(*color_variation)

        # 随机纹理缩放
        scale = np.random.uniform(0.5, 2.0)
        texture.set_scale(scale)

        object.set_texture(texture)
```

#### 光照随机化

```python
def randomize_lighting(scene):
    """随机化光照条件"""
    # 环境光
    scene.ambient_intensity = np.random.uniform(0.1, 1.0)

    # 直射光
    sun_intensity = np.random.uniform(0.5, 2.0)
    sun_angle = np.random.uniform(0, 180)

    # 光源颜色温度
    temperature = np.random.uniform(3000, 7000)  # K
    sun_color = kelvin_to_rgb(temperature)

    scene.set_sun_light(intensity=sun_intensity,
                       angle=sun_angle,
                       color=sun_color)

    # 随机阴影
    shadow_intensity = np.random.uniform(0.3, 0.9)
    scene.set_shadow_intensity(shadow_intensity)
```

#### 天气效果

```python
weather_conditions = [
    'clear', 'cloudy', 'rain', 'fog', 'snow', 'dust'
]

def randomize_weather(scene):
    weather = random.choice(weather_conditions)

    if weather == 'rain':
        scene.enable_rain(intensity=np.random.uniform(0.3, 0.8))
    elif weather == 'fog':
        scene.enable_fog(density=np.random.uniform(0.1, 0.5))
    elif weather == 'dust':
        scene.enable_dust(particles=np.random.randint(100, 500))
```

### 2. 物理随机化

```python
def randomize_physics(object):
    """随机化物理参数"""
    # 质量和惯性
    mass_variation = np.random.uniform(0.8, 1.2)
    object.set_mass(object.base_mass * mass_variation)

    # 摩擦系数
    friction = np.random.uniform(0.5, 1.0)
    object.set_friction(friction)

    # 弹性系数
    restitution = np.random.uniform(0.1, 0.5)
    object.set_restitution(restitution)

    # 空气阻力
    drag = np.random.uniform(0.01, 0.05)
    object.set_drag_coefficient(drag)
```

### 3. 传感器随机化

#### Camera 随机化

```python
def randomize_camera(camera):
    """随机化相机参数"""
    # 内参扰动
    fx_variation = np.random.normal(0, 5)
    fy_variation = np.random.normal(0, 5)

    camera.set_focal_length(
        camera.base_fx + fx_variation,
        camera.base_fy + fy_variation
    )

    # 镜头畸变
    k1 = np.random.uniform(-0.1, 0.1)
    k2 = np.random.uniform(-0.05, 0.05)
    camera.set_distortion(k1=k1, k2=k2)

    # 噪声模型
    iso = np.random.choice([200, 400, 800, 1600])
    camera.set_iso(iso)

    # 色差
    aberration = np.random.uniform(0, 0.02)
    camera.set_chromatic_aberration(aberration)
```

#### LiDAR 随机化

```python
def randomize_lidar(lidar):
    """随机化 LiDAR 参数"""
    # 距离噪声
    noise_std = np.random.uniform(0.01, 0.05)
    lidar.set_distance_noise(std=noise_std)

    # 强度噪声
    intensity_noise = np.random.uniform(0, 0.1)
    lidar.set_intensity_noise(level=intensity_noise)

    # 角度误差
    angular_error = np.random.uniform(-0.5, 0.5)  # 度
    lidar.set_angular_error(angular_error)

    # 点云密度
    point_density = np.random.uniform(0.8, 1.0)
    lidar.set_point_density(point_density)
```

### 4. 运动随机化

```python
def randomize_motion(agent):
    """随机化运动学参数"""
    # 速度限制随机化
    max_speed = np.random.uniform(8, 12)  # m/s
    max_accel = np.random.uniform(2, 4)   # m/s²
    max_decel = np.random.uniform(3, 6)   # m/s²

    agent.set_motion_limits(
        max_speed=max_speed,
        max_accel=max_accel,
        max_decel=max_decel
    )

    # 转向特性
    steering_ratio = np.random.uniform(14, 18)
    agent.set_steering_ratio(steering_ratio)
```

## 随机化策略

### 1. Uniform Randomization（均匀随机）

```python
# 每次采样都从均匀分布中取值
texture = random.choice(all_textures)
lighting = random.uniform(0.1, 1.0)
```

**优点**：简单易实现
**缺点**：可能产生不合理的组合

### 2. Curriculum Randomization（课程随机）

```python
def curriculum_randomization(epoch):
    """随训练进度调整随机化强度"""
    # 早期：较窄的随机范围
    if epoch < 100:
        lighting_range = (0.5, 0.7)
    # 中期：扩大范围
    elif epoch < 500:
        lighting_range = (0.3, 0.9)
    # 后期：全范围
    else:
        lighting_range = (0.1, 1.0)

    return random.uniform(*lighting_range)
```

**优点**：训练更稳定
**缺点**：需要设计课程

### 3. Adversarial Randomization（对抗随机）

```python
# 使用 RL 学习最优的随机化策略
class AdversarialEnv:
    def __init__(self):
        self.agent = PerceptionModel()
        self.adversary = RandomizationPolicy()

    def train(self):
        for episode in range(num_episodes):
            # Agent 选择策略
            observation = self.env.reset()

            # Adversary 选择随机化参数
            random_params = self.adversary.sample(observation)
            self.env.randomize(random_params)

            # 训练 agent（希望成功）
            agent_loss = self.agent.update(observation)

            # 训练 adversary（希望失败）
            adv_loss = self.adversary.update(-agent_loss)
```

**优点**：自动找到最难场景
**缺点**：训练复杂度高

## 实践建议

### 1. 渐进式随机化

```
Stage 1: 固定场景 + 少量随机
    ↓ 验证收敛
Stage 2: 增加随机维度 + 扩大范围
    ↓ 验证性能
Stage 3: 全维度随机 + 极端情况
```

### 2. 关键参数优先

```
高优先级（影响大）：
  - 光照强度和方向
  - 纹理颜色
  - 传感器噪声

中优先级：
  - 天气效果
  - 物理摩擦

低优先级（影响小）：
  - 背景物体细节
```

### 3. 评估体系

```python
def evaluate_sim2_real(sim_model, real_dataset):
    """评估 Sim-to-Real 性能"""
    metrics = {
        'accuracy': [],
        'robustness': [],
        'adaptation_speed': []
    }

    for scene in real_dataset:
        pred = sim_model.predict(scene)

        # 准确性
        metrics['accuracy'].append(iou(pred, scene.gt))

        # 鲁棒性（对干扰的敏感度）
        metrics['robustness'].append(
            test_with_corruption(sim_model, scene)
        )

    return aggregate_metrics(metrics)
```

## 常见陷阱

### ❌ 过度随机化

```python
# 不要这样做
lighting = random.uniform(0, 100)  # 范围太大
```

问题：模型无法学习到有效的特征
解决：限制在合理范围内

### ❌ 忽略物理约束

```python
# 纹理和光照不匹配
if random.random() > 0.5:
    scene.set_texture('snow')  # 雪地纹理
    scene.set_lighting('desert_sun')  # 沙漠光照
```

问题：产生不现实的场景
解决：使用条件随机化

### ❌ 忘记随机化测试集

```python
# 训练时随机化，测试时固定
for episode in train:
    env.randomize()  # ✓

for episode in test:
    env.reset()  # ✗ 应该也随机化
```

## 实战案例

### 目标检测 Sim-to-Real

```python
# 训练配置
config = {
    'visual_random': {
        'texture': True,
        'lighting': True,
        'weather': True,
        'camera_noise': True
    },
    'ranges': {
        'lighting': (0.2, 1.0),
        'texture_scale': (0.5, 2.0),
        'noise_std': (0.01, 0.05)
    },
    'schedule': 'curriculum',  # 课程学习
    'epochs': 10000
}

# 训练
model = ObjectDetector()
trainer = RandomizationTrainer(config)

# 在随机化环境中训练
trainer.train(model)

# 直接部署到真车
real_car.deploy(model)
# 结果：mAP 仅下降 5%（vs 传统方法下降 30%+）
```

## 总结

Domain Randomization 的核心要点：

1. **多维度随机**：视觉、物理、传感器全覆盖
2. **合理范围**：在真实约束内随机
3. **渐进策略**：从简单到复杂
4. **充分评估**：仿真和真实世界都要测

> "好的随机化策略能让真实世界只是仿真分布中的一个特例，而不是另一个分布。"

## 参考

- "Domain Randomization for Transfer Learning" (Tobin et al., 2017)
- "Sim-to-Real Transfer of Robotic Control with Dynamics Randomization" (Peng et al., 2018)
- CARLA Domain Randomization Guide
