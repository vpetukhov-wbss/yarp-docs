---
slug: ab-testing
title: A/B 测试与滚动升级
lede: >-
  A/B 测试和滚动升级都需要有相应的机制来动态分配传入流量
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/ab-testing
lastUpdated: 2026-08-11
---

## YARP A/B 测试和滚动升级

## 简介

A/B 测试和滚动升级都需要有相应的机制来动态分配传入流量，以便评估目标应用程序中的变更效果。YARP 并没有为此提供内置模型，但它确实公开了一些可用于构建此类系统的基础设施。有关此场景的更多详情，请参阅 issue #126。

## 示例

app.MapReverseProxy(proxyPipeline => {

// Custom cluster selection proxyPipeline.Use((context, next) => {

var lookup = context.RequestServices.GetRequiredService<IProxyStateLookup> ();

if (lookup.TryGetCluster(ChooseCluster(context), out var cluster)) {

context.ReassignProxyRequest(cluster); }

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); });

string ChooseCluster(HttpContext context) {

// Decide which cluster to use. This could be random, weighted, based on head- ers, etc.

return Random.Shared.Next(2) == 1 ? "cluster1" : "cluster2"; }

## 用法

此场景使用了两个 API：IProxyStateLookup 和 ReassignProxyRequest，它们在上面示例所示的自定义代理中间件中被调用。

IProxyStateLookup 是依赖关系注入容器中提供的一个服务，可用于查找或枚举当前的路由和群集。请注意，如果配置发生变更，这些数据也可能随之变化。A/B 编排算法可以检查请求，决定应将其发送到哪个群集，然后通过 IProxyStateLookup.TryGetCluster 获取该群集。

选定群集后，可以调用 ReassignProxyRequest 将请求分配给该群集。这会使用新的群集和目标信息更新 IReverseProxyFeature，供代理中间件管道的后续部分处理该请求时使用。

## 会话相关性

:::note
会话相关性功能被拆分在两处：中间件会从当前群集读取其设置，而转换则是原始路由的一部分。用于 A/B 测试的各个群集应使用相同的会话相关性配置，以避免发生冲突。
:::

:::note
本文作者在 AI 协助下创作了这篇文章。了解更多信息
:::
