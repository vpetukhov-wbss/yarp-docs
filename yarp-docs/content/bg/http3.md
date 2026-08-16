---
slug: http3
title: HTTP/3
lede: >-
  YARP 1.1 поддържа HTTP/3 за входящи и изходящи връзки, като използва поддръжката на HTTP/3
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http3
lastUpdated: 2026-08-11
---

## Въведение

YARP 1.1 поддържа HTTP/3 за входящи и изходящи връзки, като използва поддръжката на HTTP/3 в .NET 7. За да активирате протокола HTTP/3 в YARP, трябва да:

Конфигурирате входящите връзки в Kestrel Конфигурирате изходящите връзки в HttpClient

## Настройване на HTTP/3 в Kestrel

В опциите на listener-а са необходими протоколи:

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

Стойността по подразбиране на версията на HttpRequest трябва да се замени с "3"; вижте повече подробности за конфигурацията на HttpRequest.

:::note
Тази статия е създадена от автора с помощта на AI. Научете повече
:::
