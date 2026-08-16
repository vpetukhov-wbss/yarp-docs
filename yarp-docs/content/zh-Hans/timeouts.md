---
slug: timeouts
title: 请求超时
lede: >-
  .NET 8 引入了请求超时中间件，可用于配置请求超时
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/timeouts
lastUpdated: 2026-08-11
---

## 简介

.NET 8 引入了请求超时中间件，用于全局以及按终结点配置请求超时。在 .NET 8 或更高版本上运行时，YARP 2.1 中同样提供此功能。

## 默认设置

默认情况下，请求不设置任何超时，用于清理空闲请求的活动超时（Activity Timeout）除外。在 RequestTimeoutOptions 中指定的默认策略同样会应用于被代理的请求。

## 配置

可以通过 RouteConfig 为每个路由指定超时和超时策略，这些设置也可以从配置文件的 Routes 部分绑定。与其他路由属性一样，此设置可以在不重启代理的情况下进行修改并重新加载。策略名称不区分大小写。

超时以 TimeSpan 格式（HH:MM:SS）指定。在同一个路由上同时指定 Timeout 和 TimeoutPolicy 是无效的，会导致该配置被拒绝。

:::note
当调试器附加到进程时，请求超时不会生效。
:::

示例：

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "TimeoutPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
         }
         "route2" : {
             "ClusterId": "cluster1",
             "Timeout": "00:01:00",
             "Match": {
                         "Hosts": [ "localhost2" ]
                      }
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                         "cluster1/destination1": {
                            "Address": "https://localhost:10001/"
                         }
                      }
                   }
      }
   }
}
Timeout policies and the default policy can be configured in the service collection and the
middleware can be added as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddReverseProxy()
          .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
   builder.Services.AddRequestTimeouts(options =>
   {
          options.AddPolicy("customPolicy", TimeSpan.FromSeconds(20));
   });
   var app = builder.Build();
   app.UseRequestTimeouts();
   app.MapReverseProxy();
   app.Run();
```

## 禁用超时

在路由的 TimeoutPolicy 参数中指定值 disable，表示请求超时中间件不会对该路由应用超时。

## WebSockets

WebSocket 握手完成后，请求超时将被禁用。

:::note
本文由作者在 AI 协助下创作完成。了解详细信息
:::
