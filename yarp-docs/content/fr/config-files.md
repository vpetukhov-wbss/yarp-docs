---
slug: config-files
title: Fichiers de configuration
lede: >-
  Chargez les routes et les clusters depuis appsettings.json ou toute autre source IConfiguration,
  et laissez le proxy détecter automatiquement les changements sans redémarrage.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files
lastUpdated: 2025-02-10
---

## Chargement de la configuration

YARP peut charger ses routes et ses clusters depuis n'importe quelle source `IConfiguration` - `appsettings.json` dans les exemples ci-dessous, mais n'importe quel fournisseur fonctionne de la même manière. Le proxy relit la configuration et applique les changements automatiquement à chaque modification de la source, sans redémarrage nécessaire.

:::example Program.cs
Enregistre le proxy à partir de la section « ReverseProxy » de la configuration.

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
La configuration peut être modifiée pendant son chargement, avant d'être validée et appliquée - consultez [Filtres de configuration](doc:config-filters).
:::

## Structure de la configuration

La section nommée passée à `LoadFromConfig` - `"ReverseProxy"` ci-dessus - contient deux sous-sections : `Routes` et `Clusters`.

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

## Routes

`Routes` est une collection non ordonnée d'entrées de route, chacune nécessitant au minimum :

- **`RouteId`** — un nom unique pour la route.
- **`ClusterId`** — le nom d'une entrée dans `Clusters` vers laquelle sont envoyées les requêtes correspondant à cette route.
- **`Match`** — un tableau `Hosts`, un modèle `Path` (un modèle de route ASP.NET Core), ou les deux.

Lorsque plusieurs routes peuvent correspondre à une même requête, c'est la route la plus spécifique qui l'emporte - consultez [Routage basé sur les en-têtes](doc:header-routing) pour le détail du mécanisme de priorité, ou définissez un `Order` explicite (les valeurs les plus basses l'emportent) pour le contrôler directement. Les en-têtes, l'autorisation, CORS et d'autres stratégies par requête peuvent également être définis sur une entrée de route.

## Clusters

`Clusters` est une collection non ordonnée de clusters nommés. Chaque cluster contient un ensemble de `Destinations` nommées - des adresses backend considérées capables de traiter les requêtes pour toute route qui pointe vers ce cluster. Une fois qu'une route a trouvé une correspondance, la stratégie d'équilibrage de charge du cluster détermine quelle destination reçoit effectivement la requête - consultez [Équilibrage de charge](doc:load-balancing).

## Plusieurs sources de configuration

`LoadFromConfig` peut être appelé plusieurs fois, en pointant vers différentes sections ou même différents fournisseurs - combinez-le avec [un fournisseur de configuration personnalisé](doc:config-providers) qui charge depuis une tout autre source :

```csharp
services.AddReverseProxy()
    .LoadFromConfig(Configuration.GetSection("ReverseProxy1"))
    .LoadFromConfig(Configuration.GetSection("ReverseProxy2"));
```

Une route définie dans une source peut référencer un cluster défini dans une autre. Ce qui n'est pas pris en charge, c'est la fusion d'une configuration *partielle* pour une même route ou un même cluster à partir de deux sources - chacune doit provenir intégralement d'une seule source.

## Toutes les propriétés de configuration

Une seule route et un cluster entièrement spécifié, présentant ensemble toutes les propriétés de premier niveau :

:::example Forme de référence complète
La plupart des champs sont facultatifs ; seuls `RouteId`/`ClusterId`/`Match` pour une route et `Destinations` pour un cluster sont obligatoires. `HealthCheck`, `SessionAffinity` et `HttpClient`/`HttpRequest` ont chacun leur propre page dédiée - consultez [Vérifications d'intégrité des destinations](doc:dests-health-checks), [Affinité de session](doc:session-affinity) et [Configuration du client HTTP](doc:http-client-config).

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
