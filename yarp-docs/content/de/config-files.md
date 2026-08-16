---
slug: config-files
title: Konfigurationsdateien
lede: >-
  Laden Sie Routen und Cluster aus appsettings.json oder einer beliebigen anderen
  IConfiguration-Quelle, und lassen Sie den Proxy Änderungen automatisch übernehmen, ohne dass ein
  Neustart nötig ist.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files
lastUpdated: 2025-02-10
---

## Konfiguration laden

YARP kann seine Routen und Cluster aus jeder beliebigen `IConfiguration`-Quelle laden – in den folgenden Beispielen `appsettings.json`, aber jeder andere Provider funktioniert genauso. Der Proxy liest die Konfiguration bei jeder Änderung der Quelle automatisch neu ein und übernimmt die Änderungen, ohne dass ein Neustart erforderlich ist.

:::example Program.cs
Registriert den Proxy anhand des Abschnitts „ReverseProxy" der Konfiguration.

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```
:::

:::note
Die Konfiguration kann beim Laden verändert werden, bevor sie validiert und angewendet wird – siehe [Konfigurationsfilter](doc:config-filters).
:::

## Konfigurationsstruktur

Der an `LoadFromConfig` übergebene benannte Abschnitt – oben `"ReverseProxy"` – enthält zwei Unterabschnitte: `Routes` und `Clusters`.

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "{**catch-all}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"]
        }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "cluster1/destination1": { "Address": "https://example.com/" }
        }
      }
    }
  }
}
```

## Routen

`Routes` ist eine ungeordnete Sammlung von Routeneinträgen, von denen jeder mindestens Folgendes benötigt:

- **`RouteId`** — ein eindeutiger Name für die Route.
- **`ClusterId`** — der Name eines Eintrags in `Clusters`, an den Anfragen gesendet werden, die dieser Route entsprechen.
- **`Match`** — ein `Hosts`-Array, ein `Path`-Muster (eine ASP.NET Core-Routenvorlage) oder beides.

Wenn mehr als eine Route auf eine Anfrage passen könnte, gewinnt die spezifischste Route – siehe [Headerbasiertes Routing](doc:header-routing) für die genaue Funktionsweise der Priorisierung, oder legen Sie explizit eine `Order` fest (niedrigere Werte gewinnen), um sie direkt zu steuern. Auch Header, Autorisierung, CORS und andere Richtlinien pro Anfrage lassen sich auf einem Routeneintrag festlegen.

## Cluster

`Clusters` ist eine ungeordnete Sammlung benannter Cluster. Jeder Cluster enthält eine Menge benannter `Destinations` – Backend-Adressen, die als fähig gelten, Anfragen für jede Route zu verarbeiten, die auf diesen Cluster verweist. Sobald eine Route zugeordnet wurde, entscheidet die Lastverteilungsrichtlinie des Clusters, welches Ziel die Anfrage tatsächlich erhält – siehe [Lastverteilung](doc:load-balancing).

## Mehrere Konfigurationsquellen

`LoadFromConfig` kann mehrfach aufgerufen werden und dabei auf unterschiedliche Abschnitte oder sogar unterschiedliche Provider verweisen – kombinieren Sie es mit [einem benutzerdefinierten Konfigurationsprovider](doc:config-providers), der von einer völlig anderen Quelle lädt:

```csharp
services.AddReverseProxy()
    .LoadFromConfig(Configuration.GetSection("ReverseProxy1"))
    .LoadFromConfig(Configuration.GetSection("ReverseProxy2"));
```

Eine in einer Quelle definierte Route kann auf einen in einer anderen Quelle definierten Cluster verweisen. Nicht unterstützt wird das Zusammenführen von *partieller* Konfiguration für dieselbe Route oder denselben Cluster aus zwei Quellen – jede muss vollständig aus einer einzigen Quelle stammen.

## Alle Konfigurationseigenschaften

Eine einzelne Route und ein vollständig spezifizierter Cluster, die alle Eigenschaften der obersten Ebene gemeinsam zeigen:

:::example Vollständige Referenzstruktur
Die meisten Felder sind optional; nur `RouteId`/`ClusterId`/`Match` bei einer Route und `Destinations` bei einem Cluster sind erforderlich. `HealthCheck`, `SessionAffinity` sowie `HttpClient`/`HttpRequest` haben jeweils eine eigene Seite – siehe [Zustandsprüfungen für Ziele](doc:dests-health-checks), [Sitzungsaffinität](doc:session-affinity) und [HTTP-Client-Konfiguration](doc:http-client-config).

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Order": 100,
        "MaxRequestBodySize": 1000000,
        "AuthorizationPolicy": "Anonymous",
        "CorsPolicy": "Default",
        "Match": {
          "Path": "/something/{**remainder}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"],
          "Methods": ["GET", "PUT"],
          "Headers": [
            { "Name": "MyCustomHeader", "Values": ["value1", "value2"], "Mode": "ExactHeader" }
          ],
          "QueryParameters": [
            { "Name": "MyQueryParameter", "Values": ["value1", "value2"], "Mode": "Exact" }
          ]
        },
        "Metadata": { "MyName": "MyValue" },
        "Transforms": [{ "RequestHeader": "MyHeader", "Set": "MyValue" }]
      }
    },
    "Clusters": {
      "cluster1": {
        "LoadBalancingPolicy": "PowerOfTwoChoices",
        "Destinations": {
          "cluster1/destination1": { "Address": "https://contoso.com" },
          "cluster1/destination2": { "Address": "https://10.20.30.40", "Health": "https://10.20.30.40:12345/test" }
        },
        "SessionAffinity": { "Enabled": true, "Policy": "Cookie" },
        "HealthCheck": {
          "Active": { "Enabled": true, "Interval": "00:00:10", "Path": "/api/health" },
          "Passive": { "Enabled": true, "Policy": "TransportFailureRateHealthPolicy" }
        },
        "HttpClient": { "SslProtocols": "Tls13", "MaxConnectionsPerServer": 1024 },
        "Metadata": { "MyKey": "MyValue" }
      }
    }
  }
}
```
:::
