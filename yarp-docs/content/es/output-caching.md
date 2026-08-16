---
slug: output-caching
title: Almacenamiento en caché de salida
lede: >-
  El proxy inverso se puede usar para almacenar en caché las respuestas reenviadas y atender las
  solicitudes antes de que
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/output-caching
lastUpdated: 2026-08-11
---

## Introducción

El proxy inverso se puede usar para almacenar en caché las respuestas reenviadas y atender las solicitudes antes de que se reenvíen a los servidores de destino. Esto puede reducir la carga en los servidores de destino, añadir una capa de protección adicional y garantizar que se apliquen directivas coherentes en todas sus aplicaciones.

Esta función solo está disponible si se usa .NET 7 o una versión posterior

## Comportamiento predeterminado

No se realiza ningún almacenamiento en caché de salida a menos que esto se habilite en la configuración de la ruta o de la aplicación.

## Configuración

Las directivas de almacenamiento en caché de salida se pueden especificar por ruta mediante RouteConfig.OutputCachePolicy y se pueden enlazar desde las secciones Routes del archivo de configuración. Al igual que con otras propiedades de ruta, esto se puede modificar y volver a cargar sin reiniciar el proxy. Los nombres de directiva no distinguen mayúsculas de minúsculas.

Ejemplo:

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
