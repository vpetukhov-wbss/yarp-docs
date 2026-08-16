---
slug: config-filters
title: 配置筛选器
lede: >-
  在路由和群集加载完成之后、验证之前对其进行修改——从环境中填充值、应用默认值,或在所有条目中强制执行策略。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-filters
lastUpdated: 2025-02-10
---

## 筛选器的用途

从文件或[自定义提供程序](doc:config-providers)加载的配置属于原始输入——筛选器可以在其被验证和应用之前对其进行修改。典型用途包括:

- 从部署环境中填充字段(例如仅在运行时才能确定的目标地址)。
- 应用组织范围内的默认值,或在所有路由或群集中强制执行策略。
- 替换占位符值。
- 在细微的配置错误演变成严重故障之前,对其进行规范化或修正。

## 注册筛选器

筛选器通过 `AddConfigFilter` 注册到依赖注入中。可以添加任意数量的筛选器;它们会按照注册的顺序依次运行。

```csharp
services.AddReverseProxy()
    .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
    .AddConfigFilter<CustomConfigFilter>();
```

## 编写筛选器

筛选器实现 `IProxyConfigFilter` 接口,每种配置类型对应一个方法——`ConfigureRouteAsync` 和 `ConfigureClusterAsync`。由于筛选器是从 DI 中解析出来的,它们可以像其他任何已注册的服务一样接受构造函数依赖项。每次加载或重新加载配置时,这两个方法都会针对每个路由或群集各运行一次,并返回未经改动的原始实例,或一个修改后的副本——C# 9 记录类型的 `with` 表达式是生成该副本、同时不触及对象其余部分的一种便捷方式。

:::example 从环境变量中替换目标地址
在群集的目标地址中查找 `{{key}}` 占位符,并将其替换为名为 `key` 的环境变量的值;如果该环境变量未设置,则抛出异常。此外还会将任何路由的 `Order` 提升至至少为 `1`,这样以代码方式注册的路由(默认值为 `0`)就始终优先于从配置中加载的路由。

```csharp
using System.Text.RegularExpressions;
using Yarp.ReverseProxy.Configuration;

public class CustomConfigFilter : IProxyConfigFilter
{
    private readonly Regex _exp = new("\\{\\{(\\w+)\\}\\}");

    public ValueTask<ClusterConfig> ConfigureClusterAsync(ClusterConfig cluster, CancellationToken cancel)
    {
        var newDestinations = new Dictionary<string, DestinationConfig>(StringComparer.OrdinalIgnoreCase);
        foreach (var d in cluster.Destinations)
        {
            var match = _exp.Match(d.Value.Address);
            if (!match.Success)
            {
                newDestinations.Add(d.Key, d.Value);
                continue;
            }
            var name = match.Groups[1].Value;
            var value = Environment.GetEnvironmentVariable(name)
                ?? throw new ArgumentException($"Substitution for '{name}' in cluster '{d.Key}' was not found.");
            newDestinations.Add(d.Key, d.Value with { Address = value });
        }
        return new ValueTask<ClusterConfig>(cluster with { Destinations = newDestinations });
    }

    public ValueTask<RouteConfig> ConfigureRouteAsync(RouteConfig route, ClusterConfig cluster, CancellationToken cancel)
    {
        if (route.Order is < 1)
        {
            return new ValueTask<RouteConfig>(route with { Order = 1 });
        }
        return new ValueTask<RouteConfig>(route);
    }
}
```
:::
