---
slug: cors
title: Ursprungsübergreifende Anforderungen (CORS)
lede: >-
  Der Reverse Proxy kann ursprungsübergreifende Anforderungen verarbeiten, bevor sie an das Ziel
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/cors
lastUpdated: 2026-08-11
---

## Einführung

Der Reverse Proxy kann ursprungsübergreifende Anforderungen verarbeiten, bevor sie an die Zielserver weitergeleitet werden. Dadurch kann die Auslastung der Zielserver reduziert und die konsistente Umsetzung von Richtlinien in Ihren Anwendungen sichergestellt werden.

## Standardverhalten

Anforderungen werden nicht automatisch für CORS-Preflight-Anforderungen abgeglichen, sofern dies nicht in der Routen- oder Anwendungskonfiguration aktiviert ist.

## Konfiguration

CORS-Richtlinien können pro Route über RouteConfig.CorsPolicy angegeben und aus den Routes-Abschnitten der Konfigurationsdatei gebunden werden. Wie bei anderen Route-Eigenschaften kann dies geändert und neu geladen werden, ohne den Proxy neu zu starten. Bei Richtliniennamen wird die Groß-/Kleinschreibung nicht beachtet.

Beispiel:

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "CorsPolicy": "customPolicy",
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
CORS policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides the
above configuration to specify a policy per route and the rest is handled by existing ASP.NET
Core CORS Middleware.
CORS policies can be configured in the application as follows:
   services.AddCors(options =>
   {
          options.AddPolicy("customPolicy", builder =>
          {
                 builder.AllowAnyOrigin();
          });
   });
Then add the CORS middleware.
   app.UseCors();
   app.MapReverseProxy();
```

## DefaultPolicy

Wird im CorsPolicy-Parameter einer Route der Wert default angegeben, verwendet diese Route die in CorsOptions.DefaultPolicy definierte Richtlinie.

## CORS deaktivieren

Wird im CorsPolicy-Parameter einer Route der Wert disable angegeben, lehnt die CORS-Middleware die CORS-Anforderungen ab.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
