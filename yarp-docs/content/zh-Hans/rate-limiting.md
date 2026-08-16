---
slug: rate-limiting
title: 速率限制
lede: >-
  反向代理可以在请求被代理到目标服务器之前对其进行速率限制
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/rate-limiting
lastUpdated: 2026-08-11
---

## 简介

反向代理可以在请求被代理到目标服务器之前对其进行速率限制。这样做可以降低目标服务器的负载、增加一层防护，并确保各应用程序之间实施一致的策略。

此功能仅在使用 .NET 7 或更高版本时可用

## 默认设置

除非在路由或应用程序配置中启用，否则不会对请求执行任何速率限制。不过，速率限制中间件（ app.UseRateLimiter() ）可以对所有路由应用一个默认限流器，这无需在配置中做任何显式启用。示例：

```csharp
   services.AddRateLimiter(options => options.GlobalLimiter = globalLimiter);
```

## 配置

可以通过 RouteConfig.RateLimiterPolicy 为每个路由指定速率限制器策略，该属性也可以从配置文件的 Routes 部分绑定。与其他路由属性一样，此设置可以在不重启代理的情况下进行修改并重新加载。策略名称不区分大小写。

示例：

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "RateLimiterPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
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
RateLimiter policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core rate limiting middleware.
RateLimiter policies can be configured in services as follows:
```

```csharp
   services.AddRateLimiter(options =>
   {
          options.AddFixedWindowLimiter("customPolicy", opt =>
          {
                 opt.PermitLimit = 4;
                 opt.Window = TimeSpan.FromSeconds(12);
                 opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                 opt.QueueLimit = 2;
          });
   });
Then add the RateLimiter middleware.
    C#
   app.UseRateLimiter();
   app.MapReverseProxy();
See the Rate Limiting docs for setting up your preferred kind of rate limiting.
```

## 禁用速率限制

在路由的 RateLimiterPolicy 参数中指定值 disable，表示速率限制中间件不会对该路由应用任何策略，即使是默认策略也不例外。

:::note
本文由作者在 AI 协助下创作完成。了解详细信息
:::
