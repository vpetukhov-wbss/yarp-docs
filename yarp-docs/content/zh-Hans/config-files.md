---
slug: config-files
title: 配置文件
lede: >-
  从 appsettings.json 或任何其他 IConfiguration 源加载路由和群集,并让代理在无需重启的情况下自动应用
  这些变更。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files
lastUpdated: 2025-02-10
---

## 加载配置

YARP 可以从任何 `IConfiguration` 源加载其路由和群集——下面的示例中使用的是 `appsettings.json`,但任何提供程序的工作方式都相同。每当配置源发生变化时,代理都会重新读取配置并自动应用变更,无需重启。

:::example Program.cs
从配置的 "ReverseProxy" 节注册代理。

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```
:::

:::note
配置在加载之后、验证和应用之前可以被修改——请参阅[配置筛选器](doc:config-filters)。
:::

## 配置结构

传递给 `LoadFromConfig` 的命名节——即上文中的 `"ReverseProxy"`——包含两个子节:`Routes` 和 `Clusters`。

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "{**catch-all}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"]
        }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "cluster1/destination1": { "Address": "https://example.com/" }
        }
      }
    }
  }
}
```

## 路由

`Routes` 是一个无序的路由条目集合,每个条目至少需要包含:

- **`RouteId`** — 该路由的唯一名称。
- **`ClusterId`** — `Clusters` 中某个条目的名称,匹配该路由的请求会被发送到该条目。
- **`Match`** — 一个 `Hosts` 数组、一个 `Path` 模式(一个 ASP.NET Core 路由模板),或两者兼有。

当多个路由都可能匹配同一个请求时,匹配最精确的路由胜出——有关优先级的详细工作方式,请参阅[基于标头的路由](doc:header-routing),或者直接设置显式的 `Order`(值越小优先级越高)来控制。标头、授权、CORS 以及其他按请求应用的策略,也都可以在路由条目上设置。

## 群集

`Clusters` 是一个由具名群集组成的无序集合。每个群集包含一组具名的 `Destinations`——被认为能够处理指向该群集的任何路由请求的后端地址。一旦路由匹配成功,该群集的负载均衡策略就会选择实际处理该请求的目标——请参阅[负载均衡](doc:load-balancing)。

## 多个配置源

`LoadFromConfig` 可以被多次调用,分别指向不同的节,甚至不同的提供程序——可以将其与[自定义配置提供程序](doc:config-providers)结合使用,从完全不同的位置加载配置:

```csharp
services.AddReverseProxy()
    .LoadFromConfig(Configuration.GetSection("ReverseProxy1"))
    .LoadFromConfig(Configuration.GetSection("ReverseProxy2"));
```

在一个源中定义的路由可以引用在另一个源中定义的群集。不支持的是跨两个源合并同一路由或群集的*部分*配置——每个路由或群集都必须完整地来自单一来源。

## 所有配置属性

以下示例展示了一个路由和一个完整指定的群集,并列出了所有顶级属性:

:::example 完整参考结构
大多数字段都是可选的;路由上只有 `RouteId`/`ClusterId`/`Match`、群集上只有 `Destinations` 是必需的。`HealthCheck`、`SessionAffinity` 以及 `HttpClient`/`HttpRequest` 各自都有专门的页面——请参阅[目标运行状况检查](doc:dests-health-checks)、[会话相关性](doc:session-affinity)和 [HTTP 客户端配置](doc:http-client-config)。

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Order": 100,
        "MaxRequestBodySize": 1000000,
        "AuthorizationPolicy": "Anonymous",
        "CorsPolicy": "Default",
        "Match": {
          "Path": "/something/{**remainder}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"],
          "Methods": ["GET", "PUT"],
          "Headers": [
            { "Name": "MyCustomHeader", "Values": ["value1", "value2"], "Mode": "ExactHeader" }
          ],
          "QueryParameters": [
            { "Name": "MyQueryParameter", "Values": ["value1", "value2"], "Mode": "Exact" }
          ]
        },
        "Metadata": { "MyName": "MyValue" },
        "Transforms": [{ "RequestHeader": "MyHeader", "Set": "MyValue" }]
      }
    },
    "Clusters": {
      "cluster1": {
        "LoadBalancingPolicy": "PowerOfTwoChoices",
        "Destinations": {
          "cluster1/destination1": { "Address": "https://contoso.com" },
          "cluster1/destination2": { "Address": "https://10.20.30.40", "Health": "https://10.20.30.40:12345/test" }
        },
        "SessionAffinity": { "Enabled": true, "Policy": "Cookie" },
        "HealthCheck": {
          "Active": { "Enabled": true, "Interval": "00:00:10", "Path": "/api/health" },
          "Passive": { "Enabled": true, "Policy": "TransportFailureRateHealthPolicy" }
        },
        "HttpClient": { "SslProtocols": "Tls13", "MaxConnectionsPerServer": 1024 },
        "Metadata": { "MyKey": "MyValue" }
      }
    }
  }
}
```
:::
