---
slug: output-caching
title: Ausgabezwischenspeicherung
lede: >-
  Der Reverse Proxy kann verwendet werden, um weitergeleitete Antworten zwischenzuspeichern und
  Anforderungen zu bedienen, bevor sie
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/output-caching
lastUpdated: 2026-08-11
---

## Einführung

Der Reverse Proxy kann verwendet werden, um weitergeleitete Antworten zwischenzuspeichern und Anforderungen zu bedienen, bevor sie an die Zielserver weitergeleitet werden. Dadurch kann die Auslastung der Zielserver reduziert, eine zusätzliche Schutzschicht hinzugefügt und die konsistente Umsetzung von Richtlinien in Ihren Anwendungen sichergestellt werden.

Diese Funktion ist nur verfügbar, wenn .NET 7 oder höher verwendet wird

## Standardverhalten

Es wird keine Ausgabezwischenspeicherung durchgeführt, sofern dies nicht in der Routen- oder Anwendungskonfiguration aktiviert ist.

## Konfiguration

Ausgabezwischenspeicher-Richtlinien können pro Route über RouteConfig.OutputCachePolicy angegeben und aus den Routes-Abschnitten der Konfigurationsdatei gebunden werden. Wie bei anderen Route-Eigenschaften kann dies geändert und neu geladen werden, ohne den Proxy neu zu starten. Bei Richtliniennamen wird die Groß-/Kleinschreibung nicht beachtet.

Beispiel:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "OutputCachePolicy": "customPolicy",
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
Output cache policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core output caching middleware.
Output cache policies can be configured in Program.cs as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddOutputCache(options =>
   {
          options.AddPolicy("customPolicy", builder =>
   builder.Expire(TimeSpan.FromSeconds(20)));
   });
Then add the output caching middleware:
    C#
   var app = builder.Build();
   app.UseOutputCache();
   app.MapReverseProxy();
See the Output Caching docs for setting up your preferred kind of output caching.
 Note: The author created this article with assistance from AI. Learn more
```
