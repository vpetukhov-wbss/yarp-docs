---
slug: rate-limiting
title: Ratenbegrenzung
lede: >-
  Der Reverse Proxy kann zur Ratenbegrenzung von Anforderungen eingesetzt werden, bevor diese an
  die Zielserver
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/rate-limiting
lastUpdated: 2026-08-11
---

## Einführung

Der Reverse Proxy kann verwendet werden, um Anforderungen einer Ratenbegrenzung zu unterziehen, bevor sie an die Zielserver weitergeleitet werden. Dies kann die Last auf den Zielservern reduzieren, eine zusätzliche Schutzebene hinzufügen und sicherstellen, dass in Ihren Anwendungen einheitliche Richtlinien angewendet werden.

Diese Funktion ist nur verfügbar, wenn .NET 7 oder höher verwendet wird

## Standardwerte

Für Anforderungen wird keine Ratenbegrenzung durchgeführt, sofern sie nicht in der Routen- oder Anwendungskonfiguration aktiviert ist. Die Rate-Limiting-Middleware ( app.UseRateLimiter() ) kann jedoch einen Standardbegrenzer anwenden, der für alle Routen gilt, und dies erfordert keine explizite Aktivierung in der Konfiguration. Beispiel:

```csharp
   services.AddRateLimiter(options => options.GlobalLimiter = globalLimiter);
```

## Konfiguration

Rate-Limiter-Richtlinien können pro Route über RouteConfig.RateLimiterPolicy angegeben und aus dem Routes-Abschnitt der Konfigurationsdatei gebunden werden. Wie bei anderen Routeneigenschaften kann dies geändert und ohne Neustart des Proxys neu geladen werden. Bei Richtliniennamen wird die Groß-/Kleinschreibung nicht beachtet.

Beispiel:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "RateLimiterPolicy": "customPolicy",
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
RateLimiter policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core rate limiting middleware.
RateLimiter policies can be configured in services as follows:
```

```csharp
   services.AddRateLimiter(options =>
   {
          options.AddFixedWindowLimiter("customPolicy", opt =>
          {
                 opt.PermitLimit = 4;
                 opt.Window = TimeSpan.FromSeconds(12);
                 opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                 opt.QueueLimit = 2;
          });
   });
Then add the RateLimiter middleware.
    C#
   app.UseRateLimiter();
   app.MapReverseProxy();
See the Rate Limiting docs for setting up your preferred kind of rate limiting.
```

## Ratenbegrenzung deaktivieren

Wenn im RateLimiterPolicy-Parameter einer Route der Wert disable angegeben wird, wendet die Rate-Limiter-Middleware keine Richtlinien auf diese Route an, nicht einmal die Standardrichtlinie.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
