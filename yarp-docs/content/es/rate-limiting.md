---
slug: rate-limiting
title: Limitación de velocidad
lede: >-
  El proxy inverso se puede usar para limitar la velocidad de las solicitudes antes de que se
  envíen por proxy al servidor de destino
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/rate-limiting
lastUpdated: 2026-08-11
---

## Introducción

El proxy inverso se puede usar para limitar la velocidad de las solicitudes antes de que se envíen por proxy a los servidores de destino. Esto puede reducir la carga en los servidores de destino, añadir una capa de protección y garantizar que se apliquen directivas coherentes en todas sus aplicaciones.

Esta característica solo está disponible al usar .NET 7 o una versión posterior.

## Valores predeterminados

No se aplica ninguna limitación de velocidad a las solicitudes a menos que se habilite en la configuración de la ruta o de la aplicación. Sin embargo, el middleware de limitación de velocidad ( app.UseRateLimiter() ) puede aplicar un limitador predeterminado a todas las rutas, y esto no requiere ninguna activación explícita desde la configuración. Ejemplo:

```csharp
   services.AddRateLimiter(options => options.GlobalLimiter = globalLimiter);
```

## Configuración

Las directivas de RateLimiter se pueden especificar por ruta mediante RouteConfig.RateLimiterPolicy y se pueden enlazar desde las secciones Routes del archivo de configuración. Al igual que con otras propiedades de ruta, esto se puede modificar y volver a cargar sin reiniciar el proxy. Los nombres de directiva no distinguen mayúsculas de minúsculas.

Ejemplo:

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

## Deshabilitar la limitación de velocidad

Especificar el valor disable en el parámetro RateLimiterPolicy de una ruta significa que el middleware de limitación de velocidad no aplicará ninguna directiva a esa ruta, ni siquiera la directiva predeterminada.

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
