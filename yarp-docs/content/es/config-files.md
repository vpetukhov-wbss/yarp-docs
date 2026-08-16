---
slug: config-files
title: Archivos de configuración
lede: >-
  Cargue rutas y clústeres desde appsettings.json o cualquier otro origen de IConfiguration, y
  haga que el proxy detecte los cambios automáticamente sin necesidad de reiniciar.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files
lastUpdated: 2025-02-10
---

## Carga de la configuración

YARP puede cargar sus rutas y clústeres desde cualquier origen de `IConfiguration` - en los ejemplos siguientes se usa `appsettings.json`, pero cualquier proveedor funciona de la misma manera. El proxy vuelve a leer la configuración y aplica los cambios automáticamente cada vez que el origen cambia, sin necesidad de reiniciar.

:::example Program.cs
Registra el proxy a partir de la sección "ReverseProxy" de la configuración.

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
La configuración se puede modificar a medida que se carga, antes de que se valide y se aplique - consulte [Filtros de configuración](doc:config-filters).
:::

## Estructura de la configuración

La sección con nombre que se pasa a `LoadFromConfig` - `"ReverseProxy"` en el ejemplo anterior - contiene dos subsecciones: `Routes` y `Clusters`.

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

## Rutas

`Routes` es una colección sin ordenar de entradas de ruta, cada una de las cuales requiere al menos:

- **`RouteId`** — un nombre único para la ruta.
- **`ClusterId`** — el nombre de una entrada en `Clusters` a la que se envían las solicitudes que coinciden con esta ruta.
- **`Match`** — una matriz `Hosts`, un patrón `Path` (una plantilla de ruta de ASP.NET Core), o ambos.

Cuando más de una ruta podría coincidir con una solicitud, gana la ruta más específica - consulte [Enrutamiento basado en encabezados](doc:header-routing) para conocer en detalle cómo funciona la precedencia, o establezca un `Order` explícito (los valores más bajos ganan) para controlarlo directamente. Los encabezados, la autorización, CORS y otras directivas por solicitud también se pueden establecer en una entrada de ruta.

## Clústeres

`Clusters` es una colección sin ordenar de clústeres con nombre. Cada clúster contiene un conjunto de `Destinations` con nombre - direcciones de back-end consideradas capaces de gestionar solicitudes para cualquier ruta que apunte a ese clúster. Una vez que una ruta ha coincidido, la directiva de equilibrio de carga del clúster elige qué destino recibe realmente la solicitud - consulte [Equilibrio de carga](doc:load-balancing).

## Varios orígenes de configuración

`LoadFromConfig` se puede llamar más de una vez, apuntando a distintas secciones o incluso a distintos proveedores - combínelo con [un proveedor de configuración personalizado](doc:config-providers) que cargue desde un origen completamente distinto:

```csharp
services.AddReverseProxy()
    .LoadFromConfig(Configuration.GetSection("ReverseProxy1"))
    .LoadFromConfig(Configuration.GetSection("ReverseProxy2"));
```

Una ruta definida en un origen puede hacer referencia a un clúster definido en otro. Lo que no se admite es combinar configuración *parcial* para la misma ruta o el mismo clúster entre dos orígenes - cada uno debe provenir por completo de un único origen.

## Todas las propiedades de configuración

Una sola ruta y un clúster totalmente especificado, mostrando juntas todas las propiedades de nivel superior:

:::example Forma de referencia completa
La mayoría de los campos son opcionales; solo se requieren `RouteId`/`ClusterId`/`Match` en una ruta y `Destinations` en un clúster. `HealthCheck`, `SessionAffinity` y `HttpClient`/`HttpRequest` tienen cada uno su propia página dedicada - consulte [Comprobaciones de estado de destinos](doc:dests-health-checks), [Afinidad de sesión](doc:session-affinity) y [Configuración del cliente HTTP](doc:http-client-config).

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
