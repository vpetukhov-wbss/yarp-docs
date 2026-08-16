---
slug: output-caching
title: 输出缓存
lede: >-
  反向代理可用于缓存被代理的响应,并在请求被转发之前提供服务
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/output-caching
lastUpdated: 2026-08-11
---

## 简介

反向代理可用于缓存被代理的响应,并在请求转发到目标服务器之前直接提供响应。这样可以减轻目标服务器的负载,增加一层保护,并确保在各个应用程序中实施一致的策略。

此功能仅在使用 .NET 7 或更高版本时可用

## 默认设置

除非在路由或应用程序配置中启用,否则不会执行任何输出缓存。

## 配置

可以通过 RouteConfig.OutputCachePolicy 为每个路由指定输出缓存策略,并可从配置文件的 Routes 部分进行绑定。与其他路由属性一样,可以在不重启代理的情况下修改并重新加载该设置。策略名称不区分大小写。

示例:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "OutputCachePolicy": "customPolicy",
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
Output cache policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core output caching middleware.
Output cache policies can be configured in Program.cs as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddOutputCache(options =>
   {
          options.AddPolicy("customPolicy", builder =>
   builder.Expire(TimeSpan.FromSeconds(20)));
   });
Then add the output caching middleware:
    C#
   var app = builder.Build();
   app.UseOutputCache();
   app.MapReverseProxy();
See the Output Caching docs for setting up your preferred kind of output caching.
 Note: The author created this article with assistance from AI. Learn more
```
