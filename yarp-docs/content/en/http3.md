---
slug: http3
title: HTTP/3
lede: >-
  YARP 1.1 supports HTTP/3 for inbound and outbound connections using the HTTP/3 support
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http3
lastUpdated: 2026-08-11
---

## Introduction {#introduction}

YARP 1.1 supports HTTP/3 for inbound and outbound connections using the HTTP/3 support in .NET 7. To enable the HTTP/3 protocol in YARP you need to:

Configure inbound connections in Kestrel Configure outbound connections in HttpClient

## Set up HTTP/3 on Kestrel {#set-up-http-3-on-kestrel}

Protocols are required in the listener options:

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

## HttpClient {#httpclient}

The default version of HttpRequest should be replaced by "3", find more details about HttpRequest configuration.

:::note
The author created this article with assistance from AI. Learn more
:::
