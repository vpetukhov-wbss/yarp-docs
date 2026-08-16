---
slug: timeouts
title: Tiempos de espera de las solicitudes
lede: >-
  .NET 8 introdujo el middleware de tiempos de espera de solicitudes (Request Timeouts
  Middleware) para permitir configurar tiempos de espera de solicitudes
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/timeouts
lastUpdated: 2026-08-11
---

## Introducción

.NET 8 introdujo el middleware de tiempos de espera de solicitudes (Request Timeouts Middleware) para permitir configurar tiempos de espera de solicitudes tanto de forma global como por punto de conexión. Esta funcionalidad también está disponible en YARP 2.1 al ejecutarse en .NET 8 o una versión posterior.

## Valores predeterminados

Las solicitudes no tienen ningún tiempo de espera de forma predeterminada, aparte del tiempo de espera de actividad (Activity Timeout) usado para eliminar solicitudes inactivas. Una directiva predeterminada especificada en RequestTimeoutOptions también se aplicará a las solicitudes enviadas por proxy.

## Configuración

Los tiempos de espera y las directivas de tiempo de espera se pueden especificar por ruta mediante RouteConfig y se pueden enlazar desde las secciones Routes del archivo de configuración. Al igual que con otras propiedades de ruta, esto se puede modificar y volver a cargar sin reiniciar el proxy. Los nombres de directiva no distinguen mayúsculas de minúsculas.

Los tiempos de espera se especifican en formato TimeSpan (HH:MM:SS). Especificar tanto un Timeout como una TimeoutPolicy en la misma ruta no es válido y hará que se rechace la configuración.

:::note
los tiempos de espera de las solicitudes no se aplican cuando hay un depurador adjunto al proceso.
:::

Ejemplo:

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

## Deshabilitar los tiempos de espera

Especificar el valor disable en el parámetro TimeoutPolicy de una ruta significa que el middleware de tiempo de espera de solicitudes no aplicará ningún tiempo de espera a esa ruta.

## WebSockets

Los tiempos de espera de las solicitudes se deshabilitan después del protocolo de enlace (handshake) inicial de WebSocket.

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
