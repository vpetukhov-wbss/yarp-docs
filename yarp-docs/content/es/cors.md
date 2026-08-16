---
slug: cors
title: Solicitudes entre orígenes (CORS)
lede: >-
  El proxy inverso puede gestionar las solicitudes entre orígenes antes de que se reenvíen al
  destino
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/cors
lastUpdated: 2026-08-11
---

## Introducción

El proxy inverso puede gestionar las solicitudes entre orígenes antes de que se reenvíen a los servidores de destino. Esto puede reducir la carga en los servidores de destino y garantizar que se apliquen directivas coherentes en todas sus aplicaciones.

## Comportamiento predeterminado

Las solicitudes no se compararán automáticamente con las solicitudes de verificación previa (preflight) de CORS, a menos que esto se habilite en la configuración de la ruta o de la aplicación.

## Configuración

Las directivas de CORS se pueden especificar por ruta mediante RouteConfig.CorsPolicy y se pueden enlazar desde las secciones Routes del archivo de configuración. Al igual que con otras propiedades de ruta, esto se puede modificar y volver a cargar sin reiniciar el proxy. Los nombres de directiva no distinguen mayúsculas de minúsculas.

Ejemplo:

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

Especificar el valor default en el parámetro CorsPolicy de una ruta significa que esa ruta usará la directiva definida en CorsOptions.DefaultPolicy.

## Deshabilitar CORS

Especificar el valor disable en el parámetro CorsPolicy de una ruta significa que el middleware de CORS rechazará las solicitudes de CORS.

:::note
El autor creó este artículo con la ayuda de la IA. Más información
:::
