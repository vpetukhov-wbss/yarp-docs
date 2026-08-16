---
slug: load-balancing
title: 负载均衡
lede: >-
  当一个群集拥有多个运行状况良好的目标时,YARP 会使用可配置的负载均衡策略,选择由哪一个目标处理
  每个请求。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/load-balancing
lastUpdated: 2025-01-15
---

## 策略

YARP 内置了多种负载均衡策略:

- **轮询(Round robin)** — 按顺序依次遍历目标列表,使每个目标获得均等的流量份额。
- **最少请求数(Least requests)** — 将每个请求发送到当前正在处理的请求数最少的目标。
- **随机(Random)** — 随机选择一个目标。
- **二选一(Power of two choices)** — 随机抽取两个目标,并选择其中正在处理的请求数较少的一个;这是大规模场景下的一个良好默认选择,因为它避免了纯随机选择可能导致的惊群效应。
- **首个(First)** — 始终选择第一个可用的目标;主要用于测试和 A/B 场景。

:::example 设置群集的策略
群集上的 `LoadBalancingPolicy` 字段。

```json
{
  "Clusters": {
    "cluster1": {
      "LoadBalancingPolicy": "PowerOfTwoChoices",
      "Destinations": {
        "cluster1/destination1": { "Address": "https://localhost:10000/" },
        "cluster1/destination2": { "Address": "https://localhost:10010/" }
      }
    }
  }
}
```
:::

## 配置

如果未指定策略,则默认使用**二选一(Power of two choices)**策略。系统只会考虑已知运行状况良好的目标——有关如何将某个目标标记为运行状况不良并将其从轮换中排除,请参阅[目标运行状况检查](doc:dests-health-checks)。

:::note
负载均衡会将请求分散到各个目标上;它不会将某个特定客户端在多次请求之间固定到同一个目标。如果你需要这种效果,请改为参阅[会话相关性](doc:session-affinity)。
:::

## 自定义策略

实现 `ILoadBalancingPolicy` 并将其注册到 DI 中,即可接入自定义的选择逻辑——这正是 YARP 自身内置策略所依赖的同一个扩展点。
