---
slug: header-guidelines
title: HTTP 标头准则
lede: >-
  标头是处理 HTTP 请求的重要组成部分,每个标头都有各自的语义和注意事项
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-guidelines
lastUpdated: 2026-08-11
---

标头是处理 HTTP 请求过程中非常重要的一部分,每个标头都有各自的语义和注意事项。默认情况下,大多数标头会被代理转发,不过一些用于控制请求传递方式的标头会由代理自动调整或移除。客户端与代理之间的连接,以及代理与目标之间的连接是相互独立的。因此,必须对影响连接和传输的标头进行过滤。许多标头包含域名、路径或其他详细信息,当应用程序架构中包含反向代理时,这些信息可能会受到影响。以下是关于特定标头可能受到哪些影响以及应如何处理的一系列准则。

## YARP 标头筛选

YARP 会自动移除可能影响其正确转发请求能力的请求标头和响应标头,或可能被恶意用于绕过代理功能的标头。完整列表可以在此处找到,下面介绍了其中一些重点内容。

## Connection、KeepAlive、Close

这些标头用于控制 TCP 连接的管理方式,为防止影响代理另一侧的连接,这些标头会被移除。

## Transfer-Encoding

此标头描述了请求或响应正文在传输过程中的格式(例如 'chunked'),由于内部连接和外部连接的格式可能不同,因此会移除该标头。传入和传出的 HTTP 协议栈会根据需要添加相应的传输标头。

## TE

由于某些 gRPC 实现需要用到该值,因此只有 TE: trailers 这一标头值可以通过代理。

## Upgrade

此标头用于 WebSockets 等协议。默认情况下会被移除,仅在专门支持的协议(WebSockets、SPDY)中才会重新添加。

## Proxy-*

这些是与代理一起使用的标头,不适合转发。

## Alt-Svc

此响应标头用于 HTTP/3 升级,仅适用于当前直连的连接。

## 分布式跟踪标头

这些标头包括 TraceParent、Request-Id、TraceState、Baggage 和 Correlation-Context。

系统会根据 DistributedContextPropagator.Fields 自动移除这些标头,从而使转发用的 HttpClient 能够用更新后的值替换它们。

您可以通过将 SocketsHttpHandler.ActivityHeadersPropagator 设置为 null 来选择不修改这些标头:

```csharp
   services.AddReverseProxy()
          .ConfigureHttpClient((_, handler) => handler.ActivityHeadersPropagator =
   null);
```

## Strict-Transport-Security

此标头指示客户端始终使用 HTTPS,但代理和目标提供的值之间可能存在冲突。为避免混淆,如果代理应用程序已经向响应中添加了该值,则不会再将目标的值复制到响应中。

## 其他标头准则

## Host

Host 标头指示请求所面向的服务器上的具体站点。由于代理对外公开使用的主机名很可能与代理背后服务所使用的主机名不同,因此默认情况下会移除此标头。可以使用 RequestHeaderOriginalHost 转换来配置此行为。

## X-Forwarded-*、Forwarded

由于与目标通信使用的是单独的连接,这些请求标头可用于转发有关原始连接的信息,例如 IP、方案、端口和客户端证书。默认情况下会启用 X-Forwarded-For、X-Forwarded-Proto、X-Forwarded-Host 和 X-Forwarded-Prefix。由于这些信息可能被伪造,因此默认情况下会移除请求中已有的同名标头并替换为新值。目标应用程序应谨慎决定对这些值的信任程度。有关在代理中配置这些标头的方法,请参阅转换。有关配置目标应用程序读取这些标头的指导,请参阅配置 ASP.NET Core 以使用代理服务器和负载均衡器。

## X-http-method-override、x-http-method、x-method-override

某些客户端和服务器会限制其允许的 HTTP 方法(例如 GET)。这些请求标头有时被用来绕过此类限制。默认情况下,这些标头会被代理转发。如果希望在代理中阻止此类绕过行为,可以使用 RequestHeaderRemove 转换。

## Set-Cookie

此响应标头可能包含用于限制 Cookie 使用范围的字段,例如方案、域或路径。使用反向代理可能会改变站点在公众视角下的有效方案、域或路径。虽然可以通过自定义转换来重写响应 Cookie,但我们建议改用前面介绍的 Forwarded 标头,将正确的值传递给目标应用程序,以便它能够生成正确的 set-cookie 标头。

## Location

此响应标头用于重定向,由于使用了代理,其中的方案、域和路径可能与公开值不同。虽然可以通过自定义转换来重写 Location 标头,但建议改用上文介绍的 Forwarded 标头,将正确的值传递给目标应用程序,以便它能够生成正确的 Location 标头。

## Server

此响应标头指示生成响应所使用的服务器技术(例如 IIS、Kestrel)。默认情况下,此标头会从目标转发。希望移除此标头的应用程序可以使用 ResponseHeaderRemove 转换,此时将改用代理的

默认服务器标头。禁止显示代理默认服务器标头的方式因服务器

而异,例如 Kestrel。

## X-Powered-By

此响应标头指示生成响应所使用的 Web 框架(例如 ASP.NET)。ASP.NET Core 不会生成此标头,但 IIS 可能会生成。默认情况下,此标头会从目标转发。希望移除此标头的应用程序可以使用 ResponseHeaderRemove 转换。

:::note
本文作者在 AI 的协助下创作本文。了解详情
:::
