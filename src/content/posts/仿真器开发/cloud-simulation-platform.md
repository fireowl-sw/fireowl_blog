---
title: "从零搭建云端大规模并行仿真测试平台"
category: 仿真器开发
date: 2023-08-20
tags: [Kubernetes, Docker, 云仿真]
excerpt: 基于 Kubernetes 和 Docker，实现每日百万公里的虚拟测试里程。架构设计与踩坑记录。
project: "cloud-sim"
---

# 从零搭建云端大规模并行仿真测试平台

## 需求背景

自动驾驶算法需要在海量场景中验证安全性。假设要达到：

```
目标：每日 100 万公里测试里程
单车仿真速度：10x 实时速度
单场景平均长度：5 公里

计算需求：
每日场景数 = 1,000,000 / 5 = 200,000 场
每个场景耗时 = 5km / (10 × 100km/h) = 0.5 小时 = 30 分钟
所需并发 = 200,000 × 0.5 / 24 = 4,167 个并发仿真
```

## 系统架构

### 整体架构图

```
                    ┌─────────────┐
                    │   调度中心   │
                    │  (Airflow)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │  场景管理器  │ │  任务队列  │ │ 结果存储   │
    └──────┬──────┘ └─────┬─────┘ └─────┬─────┘
           │              │              │
           └──────────────┼──────────────┘
                          │
                   ┌──────▼──────┐
                   │ Kubernetes  │
                   │   集群      │
                   └──────┬──────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │ Node 1  │     │ Node 2  │ ... │ Node N  │
    │ 100 Pod │     │ 100 Pod │     │ 100 Pod │
    └─────────┘     └─────────┘     └─────────┘
```

### 核心组件

| 组件 | 技术选型 | 用途 |
|------|----------|------|
| 编排调度 | Kubernetes | Pod 管理与扩缩容 |
| 容器化 | Docker | 仿真环境打包 |
| 工作流 | Airflow | 任务编排与调度 |
| 消息队列 | Redis | 任务分发 |
| 存储 | MinIO (S3) | 场景与结果存储 |
| 监控 | Prometheus + Grafana | 系统监控 |

## 实现细节

### 1. 容器化仿真环境

#### Dockerfile

```dockerfile
# 基础镜像
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# 安装 CARLA 依赖
RUN apt-get update && apt-get install -y \
    wget \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libgl1-mesa-dev \
    libglu1-mesa-dev \
    libx11-dev \
    libxinerama-dev \
    libxcursor-dev \
    libxi-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# 复制仿真代码
COPY simulator/ /app/simulator/
COPY algorithms/ /app/algorithms/

# 设置工作目录
WORKDIR /app

# 启动脚本
COPY entrypoint.sh /
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

#### entrypoint.sh

```bash
#!/bin/bash

# 从环境变量获取任务配置
SCENARIO_ID=${SCENARIO_ID:-"default"}
SCENARIO_PATH=${SCENARIO_PATH:-"/data/scenarios"}
OUTPUT_PATH=${OUTPUT_PATH:-"/data/results"}

# 从 MinIO 下载场景
echo "Downloading scenario ${SCENARIO_ID}..."
mc cp minio/scenarios/${SCENARIO_ID} /tmp/scenario.json

# 运行仿真
echo "Starting simulation..."
python /app/simulator/run.py \
    --scenario /tmp/scenario.json \
    --output ${OUTPUT_PATH}/${SCENARIO_ID} \
    --headless \
    --no-render

# 上传结果
echo "Uploading results..."
mc cp ${OUTPUT_PATH}/${SCENARIO_ID} minio/results/

# 发送完成信号
redis-cli PUBLISH sim:${SCENARIO_ID} "done"

echo "Simulation completed!"
```

### 2. Kubernetes 部署

####仿真 Pod 模板

```yaml
# simulation-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: sim-pod
  labels:
    app: carla-sim
spec:
  restartPolicy: Never
  containers:
  - name: simulator
    image: your-registry/carla-sim:latest
    resources:
      limits:
        nvidia.com/gpu: 1
        memory: "8Gi"
        cpu: "4"
      requests:
        nvidia.com/gpu: 1
        memory: "4Gi"
        cpu: "2"
    env:
    - name: SCENARIO_ID
      valueFrom:
        fieldRef:
          fieldPath: metadata.uid
    - name: REDIS_HOST
      value: "redis-service"
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    emptyDir: {}
```

#### 自动扩缩容配置

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sim-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sim-deployment
  minReplicas: 100
  maxReplicas: 5000
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

### 3. 任务调度系统

#### Airflow DAG

```python
# dag_simulation.py
from airflow import DAG
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import (
    KubernetesPodOperator
)
from datetime import datetime, timedelta

default_args = {
    'owner': 'simulation-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'daily_simulation',
    default_args=default_args,
    description='Daily large-scale simulation',
    schedule_interval='0 2 * * *',  # 每天凌晨 2 点
    catchup=False,
    max_active_runs=1,
)

# 准备场景任务
prepare_scenarios = KubernetesPodOperator(
    task_id='prepare_scenarios',
    name='prepare-scenarios',
    image='your-registry/scenario-generator:latest',
    cmds=['python', 'generate_scenarios.py'],
    arguments=['--count', '200000'],
    dag=dag,
)

# 批量仿真任务
def create_simulation_task(batch_id, scenario_ids):
    """创建一批仿真任务"""
    return KubernetesPodOperator(
        task_id=f'sim_batch_{batch_id}',
        name=f'sim-batch-{batch_id}',
        image='your-registry/carla-sim:latest',
        cmds=['python', 'run_batch.py'],
        arguments=['--scenarios'] + scenario_ids,
        get_logs=True,
        dag=dag,
    )

# 创建 1000 个批次，每批 200 个场景
batch_size = 200
num_batches = 1000

for i in range(num_batches):
    start_idx = i * batch_size
    end_idx = start_idx + batch_size
    scenario_ids = list(range(start_idx, end_idx))

    sim_task = create_simulation_task(i, scenario_ids)
    prepare_scenarios >> sim_task

# 汇总结果
aggregate_results = KubernetesPodOperator(
    task_id='aggregate_results',
    name='aggregate-results',
    image='your-registry/result-processor:latest',
    cmds=['python', 'aggregate.py'],
    dag=dag,
)

# 所有仿真完成后汇总
for i in range(num_batches):
    dag.get_task(f'sim_batch_{i}') >> aggregate_results
```

### 4. 监控系统

#### Prometheus 配置

```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s

scrape_configs:
  # Kubernetes Pods
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true

  # 仿真任务监控
  - job_name: 'simulation-metrics'
    static_configs:
      - targets: ['simulation-exporter:9090']
```

#### Grafana 仪表板

```json
{
  "dashboard": {
    "title": "仿真集群监控",
    "panels": [
      {
        "title": "运行中的 Pod 数量",
        "targets": [
          {
            "expr": "count(kube_pod_status_phase{phase='Running'})"
          }
        ]
      },
      {
        "title": "任务完成速率",
        "targets": [
          {
            "expr": "rate(simulation_completed_total[5m])"
          }
        ]
      },
      {
        "title": "GPU 利用率",
        "targets": [
          {
            "expr": "avg(DCGM_FI_DEV_GPU_UTIL)"
          }
        ]
      },
      {
        "title": "平均仿真时间",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, simulation_duration_seconds)"
          }
        ]
      }
    ]
  }
}
```

## 踩坑记录

### 问题 1：存储 I/O 瓶颈

**现象**：大量 Pod 并发时，存储成为瓶颈，任务排队等待。

**解决方案**：

```yaml
# 使用临时存储而非持久存储
spec:
  volumes:
  - name: data
    emptyDir:
      medium: Memory  # 使用内存存储
      sizeLimit: 2Gi

# 或使用本地 SSD
  - name: data
    hostPath:
      path: /mnt/ssd/pod-data
      type: DirectoryOrCreate
```

### 问题 2：GPU 资源争抢

**现象**：某些节点 GPU 负载过高，其他节点空闲。

**解决方案**：

```yaml
# 使用 Pod 反亲和性
spec:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
            - key: app
              operator: In
              values:
              - carla-sim
          topologyKey: kubernetes.io/hostname
```

### 问题 3：内存泄漏

**现象**：长时间运行后，Pod 内存占用持续增长。

**解决方案**：

```python
# 定期重启策略
# Kubernetes 中设置
resources:
  limits:
    memory: "8Gi"

# 代码中定期清理
import gc

def run_simulation(scenario):
    try:
        result = simulate(scenario)
        return result
    finally:
        # 清理内存
        gc.collect()
        torch.cuda.empty_cache()
```

### 问题 4：网络延迟

**现象**：场景下载和结果上传耗时过长。

**解决方案**：

```bash
# 使用本地缓存
# 在每个节点部署缓存代理
kubectl apply -f cache-deployment.yaml

# 使用多线程传输
import asyncio
import aiohttp

async def download_scenarios(scenario_ids):
    async with aiohttp.ClientSession() as session:
        tasks = [
            download_scenario(session, sid)
            for sid in scenario_ids
        ]
        return await asyncio.gather(*tasks)
```

## 性能优化

### 1. 预热策略

```python
# 预创建 Pod 池
class PodPool:
    def __init__(self, size=100):
        self.pool = []
        self.size = size
        self._init_pool()

    def _init_pool(self):
        """启动时预创建 Pod"""
        for _ in range(self.size):
            pod = self._create_idle_pod()
            self.pool.append(pod)

    def get_pod(self):
        """获取空闲 Pod"""
        return self.pool.pop() if self.pool else self._create_pod()

    def return_pod(self, pod):
        """归还 Pod 到池中"""
        if len(self.pool) < self.size:
            self._reset_pod(pod)
            self.pool.append(pod)
        else:
            self._delete_pod(pod)
```

### 2. 智能调度

```python
# 根据场景类型智能分配节点
def schedule_pods(scenarios):
    """根据场景特点分配到合适节点"""
    assignments = []

    for scenario in scenarios:
        # 计算资源需求
        if scenario.weather in ['Rain', 'Fog']:
            # 复杂天气需要更多 GPU
            node = select_node_with_max_gpu()
        else:
            # 简单场景可以负载均衡
            node = select_least_loaded_node()

        assignments.append((scenario, node))

    return assignments
```

### 3. 批处理优化

```python
# 按场景特征批处理
def batch_scenarios(scenarios):
    """将相似场景打包处理"""
    # 按天气分组
    by_weather = group_by(scenarios, key='weather')

    # 按地图分组
    by_map = {w: group_by(s, key='map') for w, s in by_weather.items()}

    return by_map
```

## 成本优化

### 资源利用率分析

```
优化前：
- 平均 CPU 利用率：35%
- 平均 GPU 利用率：45%
- 平均内存利用率：50%

优化后：
- 平均 CPU 利用率：72%
- 平均 GPU 利用率：85%
- 平均内存利用率：78%

成本节省：约 40%
```

### Spot 实例策略

```python
# 使用 Spot 实例降低成本
def deploy_with_spot():
    """混合使用 on-demand 和 spot 实例"""
    # 70% on-demand（保证基线容量）
    on_demand_nodes = int(total_nodes * 0.7)

    # 30% spot（弹性扩容）
    spot_nodes = int(total_nodes * 0.3)

    return {
        'on_demand': create_node_group(on_demand_nodes, spot=False),
        'spot': create_node_group(spot_nodes, spot=True)
    }
```

## 运维经验

### 1. 容量规划

```
公式：
所需节点数 = (任务并发数 × 单任务资源) / 单节点资源 × 冗余系数

示例：
任务并发数 = 5000
单任务 GPU = 1
单节点 GPU = 8
冗余系数 = 1.2

节点数 = (5000 × 1) / 8 × 1.2 = 750 个节点
```

### 2. 故障恢复

```python
# 自动重试机制
class ResilientSimulation:
    def __init__(self, max_retries=3):
        self.max_retries = max_retries

    def run_with_retry(self, scenario):
        for attempt in range(self.max_retries):
            try:
                result = self._run_simulation(scenario)
                return result
            except SimulationError as e:
                if attempt == self.max_retries - 1:
                    # 最后一次失败，记录并跳过
                    log_error(scenario, e)
                    return None
                else:
                    # 重试
                    log_warning(f"Retry {attempt + 1}")
                    time.sleep(2 ** attempt)  # 指数退避
```

### 3. 数据管理

```python
# 分层存储策略
class StorageManager:
    def __init__(self):
        self.hot_storage = MinIO('hot')     # 最近 7 天
        self.warm_storage = S3('warm')      # 最近 30 天
        self.cold_storage = Glacier('cold') # 归档

    def store_result(self, result, timestamp):
        age = days_since(timestamp)

        if age < 7:
            self.hot_storage.put(result)
        elif age < 30:
            self.warm_storage.put(result)
        else:
            self.cold_storage.archive(result)
```

## 总结

### 系统规模

| 指标 | 数值 |
|------|------|
| 节点数量 | 750+ |
| GPU 总数 | 6000+ |
| 日均场景数 | 200,000 |
| 日均测试里程 | 100 万公里 |
| 峰值并发 | 5,000 |

### 关键指标

| 指标 | 目标 | 实际 |
|------|------|------|
| 任务成功率 | >99% | 99.2% |
| 平均完成时间 | <30分钟 | 28分钟 |
| 资源利用率 | >70% | 75% |
| 成本 / 公里 | <$0.1 | $0.07 |

### 最佳实践

1. **容器化一切**：统一环境，易于扩展
2. **自动化运维**：减少人工干预
3. **监控先行**：及时发现问题
4. **成本优化**：Spot 实例 + 资源调度
5. **容错设计**：自动重试 + 故障隔离

> "云端大规模仿真能力是自动驾驶算法快速迭代的关键基础设施。"

## 参考资源

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Airflow Guide](https://airflow.apache.org/docs/)
- [CARLA Simulation](https://carla.org/)
