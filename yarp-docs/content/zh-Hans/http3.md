---
slug: http3
title: HTTP/3
lede: >-
  YARP 1.1 借助 .NET 7 中的 HTTP/3 支持,为入站和出站连接提供 HTTP/3
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http3
lastUpdated: 2026-08-11
---

## 简介

YARP 1.1 借助 .NET 7 中的 HTTP/3 支持,为入站和出站连接提供 HTTP/3 支持。要在 YARP 中启用 HTTP/3 协议,你需要:

在 Kestrel 中配置入站连接 在 HttpClient 中配置出站连接

## 在 Kestrel 上设置 HTTP/3

需要在监听器选项中指定协议:

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.WebHost.ConfigureKestrel(kestrel =>
   {
          kestrel.ListenAnyIP(443, portOptions =>
          {
                 portOptions.Protocols = HttpProtocols.Http1AndHttp2AndHttp3;
                 portOptions.UseHttps();
          });
   });
```

## HttpClient

应将 HttpRequest 的默认版本替换为 "3";有关 HttpRequest 配置的更多详细信息,请参阅相关文档。

:::note
本文作者在 AI 的协助下创作本文。了解详情
:::
