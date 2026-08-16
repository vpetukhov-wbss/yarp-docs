---
slug: cors
title: 跨域请求（CORS）
lede: >-
  反向代理可以在将跨域请求代理到目标服务器之前对其进行处理
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/cors
lastUpdated: 2026-08-11
---

## 简介

反向代理可以在跨域请求被代理到目标服务器之前先对其进行处理。这样可以减轻目标服务器的负载，并确保各个应用程序之间实施一致的策略。

## 默认设置

除非在路由或应用程序配置中启用了该功能，否则请求不会被自动匹配为 CORS 预检请求。

## 配置

可以通过 RouteConfig.CorsPolicy 为每个路由指定 CORS 策略，并且可以从配置文件的 Routes 部分绑定该设置。与其他路由属性一样，该设置也可以在不重启代理的情况下进行修改和重新加载。策略名称不区分大小写。

示例：

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "CorsPolicy": "customPolicy",
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
CORS policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides the
above configuration to specify a policy per route and the rest is handled by existing ASP.NET
Core CORS Middleware.
CORS policies can be configured in the application as follows:
   services.AddCors(options =>
   {
          options.AddPolicy("customPolicy", builder =>
          {
                 builder.AllowAnyOrigin();
          });
   });
Then add the CORS middleware.
   app.UseCors();
   app.MapReverseProxy();
```

## DefaultPolicy

在路由的 CorsPolicy 参数中指定值 default，意味着该路由将使用 CorsOptions.DefaultPolicy 中定义的策略。

## 禁用 CORS

在路由的 CorsPolicy 参数中指定值 disable，意味着 CORS 中间件将拒绝该路由的 CORS 请求。

:::note
本文作者在 AI 协助下创作了这篇文章。了解更多信息
:::
