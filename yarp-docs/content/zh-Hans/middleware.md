---
slug: middleware
title: 中间件
lede: >-
  ASP.NET Core 使用中间件管道将请求处理划分为多个独立的步骤。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/middleware
lastUpdated: 2026-08-11
---

## 简介

ASP.NET Core 使用中间件管道将请求处理划分为多个独立的步骤。应用开发者可以根据需要添加中间件并安排其执行顺序。ASP.NET Core 中间件同样用于实现和自定义反向代理功能。

## 默认设置

快速入门示例展示了以下 Configure 方法。它设置了一个包含开发工具、路由以及代理配置终结点(MapReverseProxy)的中间件管道。

```csharp
         var builder = WebApplication.CreateBuilder(args);
         builder.Services.AddReverseProxy()
                .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
         var app = builder.Build();
         app.MapReverseProxy();
         app.Run();
The parameterless MapReverseProxy() in ReverseProxyIEndpointRouteBuilderExtensions
overload includes all standard proxy middleware for session affinity, load balancing, passive
health checks, and the final proxying of the request. Each of these check the configuration of
the matched route, cluster, and destination and perform their task accordingly.
```

## 添加中间件

添加到应用程序管道中的中间件,会依据其添加位置的不同,看到处于不同处理阶段的请求。添加在 UseRouting 之前的中间件会看到所有请求,并可以在任何路由发生之前对其进行处理。添加在 UseRouting 和 UseEndpoints 之间的中间件可以调用 HttpContext.GetEndpoint() 来检查路由将请求匹配到了哪个终结点(如果有的话),并使用与该终结点关联的任何元数据。身份验证、授权和 CORS 正是通过这种方式实现的。

ReverseProxyIEndpointRouteBuilderExtensions 提供了 MapReverseProxy 的一个重载,让你可以构建一个仅针对匹配到代理配置路由的请求运行的中间件管道。

app.MapReverseProxy(proxyPipeline => {

proxyPipeline.Use((context, next) => {

## // 自定义内联中间件

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); proxyPipeline.UsePassiveHealthChecks(); });

默认情况下,这个 MapReverseProxy 重载仅在其管道的开头和结尾包含最基本的设置、代理逻辑以及限制的强制执行。默认不包含用于会话相关性、负载均衡和被动运行状况检查的中间件,这样你就可以排除、替换这些中间件,或用任何附加中间件控制它们的执行顺序。

## 自定义代理中间件

MapReverseProxy 管道内的中间件可以通过 IReverseProxyFeature 访问与请求相关联的所有代理数据和状态(路由、群集、目标等)。可以从 HttpContext.Features 获取该功能,也可以使用扩展方法 HttpContext.GetReverseProxyFeature() 获取。

IReverseProxyFeature 中的数据是在代理管道开始时从代理配置中生成的快照,不会受到请求处理期间发生的代理配置更改的影响。

```csharp
   proxyPipeline.Use((context, next) =>
   {
          var proxyFeature = context.GetReverseProxyFeature();
          var cluster = proxyFeature.Cluster;
          var destinations = proxyFeature.AvailableDestinations;
          return next();
   });
```

## 中间件的推荐用法

中间件可以生成日志、控制请求是否被代理、影响请求被代理到何处,还可以添加错误处理、重试等附加功能。

## 日志和指标

中间件可以检查请求和响应的各个字段,以生成日志并汇总指标。有关正文(body)方面的注意事项,请参阅下文"中间件不应有的用法"中的说明。

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          LogRequest(context);
          await next();
          LogResponse(context);
   });
```

## 立即发送响应

如果某个中间件在检查请求后认定不应对其进行代理,它可以自行生成响应,并在不调用 next() 的情况下将控制权交还给服务器。

```csharp
   proxyPipeline.Use((context, next) =>
   {
          if (!CheckAllowedRequest(context, out var reason))
          {
                 context.Response.StatusCode = StatusCodes.Status400BadRequest;
                 return context.Response.WriteAsync(reason);
          }
          return next();
   });
```

## 筛选目标

会话相关性和负载均衡等中间件会检查 IReverseProxyFeature 和群集配置,以决定应将请求发送到哪个目标。AllDestinations 列出了所选群集中的所有目标。

AvailableDestinations 列出了当前被认为有资格处理该请求的目标。它的初始值为 AllDestinations,如果启用了运行状况检查,则会排除运行状况不良的目标。到管道执行结束时,AvailableDestinations 应当被缩减为单个目标,否则将从剩余目标中随机选择一个。

ProxiedDestination 由管道末尾的代理逻辑设置,用于指示最终使用的是哪个目标。如果没有剩余的可用目标,则会发送 503 错误响应。

```csharp
proxyPipeline.Use(async (context, next) =>
{
      var proxyFeature = context.GetReverseProxyFeature();
      proxyFeature.AvailableDestinations =
Filter(proxyFeature.AvailableDestinations);
      await next();
      Report(proxyFeature.ProxiedDestination);
});
DestinationState implements IReadOnlyList<DestinationState> so a single destination can be
assigned to AvailableDestinations without creating a new list.
```

## 错误处理

中间件可以将对 await next() 的调用包装在 try/catch 块中,以处理来自后续组件的异常。

管道末尾的代理逻辑(IHttpForwarder)不会针对常见的请求代理错误抛出异常。这些错误会被捕获,并通过 HttpContext.Features 中的 IForwarderErrorFeature,或通过 HttpContext.GetForwarderErrorFeature() 扩展方法进行报告。

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          await next();
          var errorFeature = context.GetForwarderErrorFeature();
          if (errorFeature is not null)
          {
                 Report(errorFeature.Error, errorFeature.Exception);
                 }
          });
If the response has not started ( HttpResponse.HasStarted ) it can be cleared
( HttpResponse.Clear() ) and an alternate response sent, or the proxy feature fields may be
reset and the request retried.
```

## 中间件不应有的用法

中间件应谨慎修改标头等请求字段以影响发出的代理请求。这类修改可能会干扰重试等功能,更适合交由转换来处理。

在调用 next() 之后,中间件在修改响应字段之前必须先检查 HttpResponse.HasStarted。如果响应已经开始发送给客户端,中间件就无法再修改它(尾部标头可能是个例外)。可以使用转换来检查并抑制不需要的响应。否则请参阅下一条说明。

中间件应避免与请求或响应正文进行交互。默认情况下正文不会被缓冲,因此与其交互可能导致它们无法到达目标。虽然可以启用缓冲,但并不建议这样做,因为这会带来显著的内存和延迟开销。如果必须检查或修改正文,建议使用包装的流式处理方式。可参考 ResponseCompression 中间件作为示例。

中间件绝不能针对单个请求执行任何多线程工作,HttpContext 及其关联成员不是线程安全的。

:::note
本文作者在 AI 的协助下创作本文。了解详情
:::
