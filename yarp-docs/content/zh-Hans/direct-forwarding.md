---
slug: direct-forwarding
title: 直接转发
lede: >-
  有些应用程序只需要能够获取特定请求并将其转发到特定
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/direct-forwarding
lastUpdated: 2026-08-11
---

有些应用程序只需要能够获取特定请求并将其转发到特定目标。这些应用程序并不需要代理的其他功能（例如配置发现、路由、负载均衡等），或者已经通过其他方式解决了这些需求。

## IHttpForwarder

IHttpForwarder 是介于传入的 AspNetCore 请求与传出的 System.Net.Http 请求之间的核心代理适配器。它负责处理从 HttpContext 创建 HttpRequestMessage、发送该请求以及转发响应这一系列底层机制。

IHttpForwarder 支持：

- 动态选择目标：由您为每个请求指定目标
- 自定义 HTTP 客户端：由您提供 HttpMessageInvoker
- 自定义请求和响应（正文除外）
- gRPC 和 WebSocket 等流式协议
- 错误处理

它不包含：

- 路由
- 负载均衡
- 会话相关性
- 重试

## 示例

请参阅预构建示例 ReverseProxy.Direct.Sample，或按照以下步骤操作。

## 创建新项目

请按照"入门指南"创建一个项目，并添加 Yarp.ReverseProxy NuGet 依赖项。

## 更新 Program.cs

在此示例中，IHttpForwarder 被注册到依赖关系注入容器中，注入到终结点方法中，并用于将来自特定路由的请求转发到 https://localhost:10000/prefix/ 。

可选的转换展示了如何复制除 Host 之外的所有请求标头；目标通常需要使用来自该 URL 自身的 Host，这是很常见的情况。

```csharp
using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Yarp.ReverseProxy.Forwarder;
using Yarp.ReverseProxy.Transforms;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpForwarder();
var app = builder.Build();
// Configure our own HttpMessageInvoker for outbound calls for proxy operations
var httpClient = new HttpMessageInvoker(new SocketsHttpHandler
{
      UseProxy = false,
      AllowAutoRedirect = false,
      AutomaticDecompression = DecompressionMethods.None,
      UseCookies = false,
      EnableMultipleHttp2Connections = true,
      ActivityHeadersPropagator = new
ReverseProxyPropagator(DistributedContextPropagator.Current),
      ConnectTimeout = TimeSpan.FromSeconds(15),
});
// Setup our own request transform class
var transformer = new CustomTransformer(); // or HttpTransformer.Default;
var requestConfig = new ForwarderRequestConfig { ActivityTimeout =
TimeSpan.FromSeconds(100) };
app.UseRouting();
// When using IHttpForwarder for direct forwarding you are responsible for rout-
ing, destination discovery, load balancing, affinity, etc..
// For an alternate example that includes those features see BasicYarpSample.
app.Map("/test/{**catch-all}", async (HttpContext httpContext, IHttpForwarder for-
warder) =>
{
      var error = await forwarder.SendAsync(httpContext, "https://localhost:10000/",
                   httpClient, requestConfig, transformer);
```

## // 检查操作是否成功

if (error != ForwarderError.None)

{

var errorFeature = httpContext.GetForwarderErrorFeature();

var exception = errorFeature.Exception;

}

});

app.Run();

/// <summary> /// Custom request transformation /// </summary> internal class CustomTransformer : HttpTransformer {

/// <summary> /// A callback that is invoked prior to sending the proxied request. All HttpRequestMessage /// fields are initialized except RequestUri, which will be initialized after the /// callback if no value is provided. The string parameter represents the des- tination /// URI prefix that should be used when constructing the RequestUri. The head- ers /// are copied by the base implementation, excluding some protocol headers like HTTP/2 /// pseudo headers (":authority"). /// </summary> /// <param name="httpContext">The incoming request.</param> /// <param name="proxyRequest">The outgoing proxy request.</param> /// <param name="destinationPrefix">The uri prefix for the selected destina- tion server which can be used to create /// the RequestUri.</param> public override async ValueTask TransformRequestAsync(HttpContext httpContext, HttpRequestMessage proxyRequest, string destinationPrefix, CancellationToken can- cellationToken) {

// Copy all request headers await base.TransformRequestAsync(httpContext, proxyRequest, destination- Prefix, cancellationToken);

// Customize the query string: var queryContext = new QueryTransformContext(httpContext.Request); queryContext.Collection.Remove("param1"); queryContext.Collection["area"] = "xx2";

// Assign the custom uri. Be careful about extra slashes when concatenat- ing here. RequestUtilities.MakeDestinationAddress is a safe default.

proxyRequest.RequestUri = RequestUtilities.MakeDestinationAddress("https://example.com", httpContext.Request.Path, queryContext.QueryString);

// Suppress the original request header, use the one from the destination

Uri.

} proxyRequest.Headers.Host = null; }

此外还提供了一些扩展方法，可用于简化 IHttpForwarder 到终结点的映射。

```csharp
   app.MapForwarder("/{**catch-all}", "https://localhost:10000/", requestConfig,
   transformer, httpClient);
```

## HTTP 客户端

HTTP 客户端是可以自定义的，但对于常见的代理场景，建议使用上面示例中的方式。请始终使用 HttpMessageInvoker，而不要使用 HttpClient，因为 HttpClient 默认会缓冲响应。缓冲会破坏流式处理场景，并增加内存使用量和延迟。出于性能考虑，建议对发往同一目标的请求重复使用同一个客户端，这样可以重复使用池化的连接。如果配置相同，客户端也可以被重复用于发往不同目标的请求。

## 转换

可以通过向 SendAsync 方法提供一个派生自 HttpTransformer 的参数来修改请求和响应。

## 错误处理

IHttpForwarder 会捕获来自 HTTP 客户端的异常和超时，将其记录下来，并将其转换为 5xx 状态代码或直接中止响应。SendAsync 会返回一个错误代码，错误详情可以像上文所示的那样，从 IForwarderErrorFeature 中获取。

:::note
本文作者在 AI 协助下创作了这篇文章。了解更多信息
:::
