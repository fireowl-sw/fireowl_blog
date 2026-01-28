---
title: "强化学习在决策中的应用"
category: 强化学习
date: 2025-01-29
tags: [RL, DQN, 策略梯度]
excerpt: 端到端学习驾驶策略
image: "https://picsum.photos/seed/rl/600/400.jpg"
project: "reinforcement"
---

# 强化学习在决策中的应用

## 基础概念

强化学习的核心要素：
- **状态 (State)**: 环境观察
- **动作 (Action)**: 智能体行为
- **奖励 (Reward)**: 反馈信号
- **策略 (Policy)**: 状态到动作的映射

## 算法类型

### 基于价值
- DQN (Deep Q-Network)
- Double DQN
- Dueling DQN

### 基于策略
- REINFORCE
- Actor-Critic
- PPO (Proximal Policy Optimization)

## 训练流程

1. 初始化环境
2. 采集经验数据
3. 更新网络参数
4. 评估策略性能
5. 重复训练

> 强化学习让机器自己学会驾驶
