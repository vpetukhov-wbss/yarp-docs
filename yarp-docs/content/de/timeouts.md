---
slug: timeouts
title: Anforderungstimeouts
lede: >-
  .NET 8 hat die Request Timeouts Middleware eingeführt, mit der sich Anforderungstimeouts
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/timeouts
lastUpdated: 2026-08-11
---

## Einführung

.NET 8 hat die Request Timeouts Middleware eingeführt, mit der sich Anforderungstimeouts sowohl global als auch pro Endpunkt konfigurieren lassen. Diese Funktionalität ist auch in YARP 2.1 verfügbar, wenn es unter .NET 8 oder neuer ausgeführt wird.

## Standardwerte

Anforderungen haben standardmäßig keine Timeouts, abgesehen vom Activity Timeout, das zum Bereinigen inaktiver Anforderungen verwendet wird. Eine in RequestTimeoutOptions angegebene Standardrichtlinie gilt ebenfalls für weitergeleitete Anforderungen.

## Konfiguration

Timeouts und Timeout-Richtlinien können pro Route über RouteConfig angegeben und aus dem Routes-Abschnitt der Konfigurationsdatei gebunden werden. Wie bei anderen Routeneigenschaften kann dies geändert und ohne Neustart des Proxys neu geladen werden. Bei Richtliniennamen wird die Groß-/Kleinschreibung nicht beachtet.

Timeouts werden im TimeSpan-Format (HH:MM:SS) angegeben. Die gleichzeitige Angabe von Timeout und TimeoutPolicy für dieselbe Route ist ungültig und führt dazu, dass die Konfiguration abgelehnt wird.

:::note
Anforderungstimeouts gelten nicht, wenn ein Debugger an den Prozess angehängt ist.
:::

Beispiel:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "TimeoutPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
         }
         "route2" : {
             "ClusterId": "cluster1",
             "Timeout": "00:01:00",
             "Match": {
                         "Hosts": [ "localhost2" ]
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
Timeout policies and the default policy can be configured in the service collection and the
middleware can be added as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddReverseProxy()
          .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
   builder.Services.AddRequestTimeouts(options =>
   {
          options.AddPolicy("customPolicy", TimeSpan.FromSeconds(20));
   });
   var app = builder.Build();
   app.UseRequestTimeouts();
   app.MapReverseProxy();
   app.Run();
```

## Timeouts deaktivieren

Wenn im TimeoutPolicy-Parameter einer Route der Wert disable angegeben wird, wendet die Request-Timeout-Middleware auf diese Route keine Timeouts an.

## WebSockets

Anforderungstimeouts werden nach dem anfänglichen WebSocket-Handshake deaktiviert.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
