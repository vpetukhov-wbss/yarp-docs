---
slug: http3
title: HTTP/3
lede: >-
  YARP 1.1 unterstützt HTTP/3 für eingehende und ausgehende Verbindungen mithilfe der
  HTTP/3-Unterstützung
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http3
lastUpdated: 2026-08-11
---

## Einführung

YARP 1.1 unterstützt HTTP/3 für eingehende und ausgehende Verbindungen mithilfe der HTTP/3-Unterstützung in .NET 7. Um das HTTP/3-Protokoll in YARP zu aktivieren, müssen Sie:

Eingehende Verbindungen in Kestrel konfigurieren Ausgehende Verbindungen in HttpClient konfigurieren

## HTTP/3 auf Kestrel einrichten

In den Listener-Optionen müssen die Protokolle angegeben werden:

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

Die Standardversion von HttpRequest sollte durch „3“ ersetzt werden; weitere Details zur HttpRequest-Konfiguration finden Sie hier.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
