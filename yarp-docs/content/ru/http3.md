---
slug: http3
title: HTTP/3
lede: >-
  YARP 1.1 поддерживает HTTP/3 для входящих и исходящих соединений благодаря поддержке HTTP/3
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http3
lastUpdated: 2026-08-11
---

## Введение

YARP 1.1 поддерживает HTTP/3 для входящих и исходящих соединений благодаря поддержке HTTP/3 в .NET 7. Чтобы включить протокол HTTP/3 в YARP, необходимо:

Настроить входящие соединения в Kestrel. Настроить исходящие соединения в HttpClient.

## Настройка HTTP/3 в Kestrel

В параметрах прослушивателя необходимо указать протоколы:

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

Версию HttpRequest по умолчанию следует заменить на "3"; подробнее о настройке HttpRequest см. в соответствующем разделе.

:::note
Автор подготовил эту статью с помощью ИИ. Подробнее
:::
