---
slug: transforms
title: Información general
lede: >-
  Al reenviar una solicitud a través del proxy, es habitual modificar partes de la solicitud o de
  la respuesta para adaptarse a
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms
lastUpdated: 2026-08-11
---

## Transformaciones de solicitud y respuesta de YARP

## Introducción

Al enviar una solicitud al proxy, es habitual modificar partes de la solicitud o de la respuesta para adaptarse a los requisitos del servidor de destino o para transmitir datos adicionales, como la dirección IP original del cliente. Este proceso se implementa mediante transformaciones. Los tipos de transformación se definen globalmente para la aplicación, y luego cada ruta suministra los parámetros para habilitar y configurar esas transformaciones. Los objetos de solicitud originales no se modifican con estas transformaciones; solo se modifican las solicitudes de proxy.

YARP no proporciona transformaciones para el cuerpo de la solicitud ni de la respuesta, pero puede escribir middleware para hacerlo.

## Valores predeterminados

Las siguientes transformaciones están habilitadas de forma predeterminada para todas las rutas. Se pueden configurar o deshabilitar tal como se muestra más adelante en este documento.

Host - Suprime el encabezado Host de la solicitud entrante. La solicitud de proxy usará de forma predeterminada el nombre de host especificado en la dirección del servidor de destino. Véase RequestHeaderOriginalHost más abajo. X-Forwarded-For - Establece la dirección IP del cliente en el encabezado X-Forwarded-For. Véase X-Forwarded más abajo. X-Forwarded-Proto - Establece el esquema original de la solicitud (http/https) en el encabezado X-Forwarded-Proto. Véase X-Forwarded más abajo. X-Forwarded-Host - Establece el Host original de la solicitud en el encabezado X-Forwarded-Host. Véase X-Forwarded más abajo. X-Forwarded-Prefix - Establece el PathBase original de la solicitud, si existe, en el encabezado X-Forwarded-Prefix. Véase X-Forwarded más abajo.

Por ejemplo, la siguiente solicitud entrante a http://IncomingHost:5000/path :

GET /path HTTP/1.1 Host: IncomingHost:5000 Accept: */* header1: foo

se transformaría y se enviaría al servidor de destino https://DestinationHost:6000/ de la

siguiente manera usando estos valores predeterminados:

GET /path HTTP/1.1 Host: DestinationHost:6000 Accept: */* header1: foo X-Forwarded-For: 5.5.5.5 X-Forwarded-Proto: http X-Forwarded-Host: IncomingHost:5000

## Categorías de transformación

Las transformaciones se dividen en unas pocas categorías: solicitud, respuesta y trailers de respuesta. Los trailers de solicitud no se admiten porque el HttpClient subyacente no los admite.

Si el conjunto integrado de transformaciones resulta insuficiente, se pueden agregar transformaciones personalizadas mediante extensibilidad.

## Agregar transformaciones

Las transformaciones se pueden agregar a las rutas mediante la configuración o mediante programación.

## Desde la configuración

Las transformaciones se pueden configurar en RouteConfig.Transforms y se pueden enlazar desde las secciones Routes del archivo de configuración. Se pueden modificar y volver a cargar sin reiniciar el proxy. Una transformación se configura mediante uno o varios pares clave-valor de tipo cadena.

A continuación se muestra un ejemplo de las transformaciones más comunes:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Hosts": [ "localhost" ]
             },
             "Transforms": [
                { "PathPrefix": "/apis" },
                          {
                             "RequestHeader": "header1",
                             "Append": "bar"
                          },
                          {
                             "ResponseHeader": "header2",
                             "Append": "bar",
                             "When": "Always"
                          },
                          { "ClientCert": "X-Client-Cert" },
                          { "RequestHeadersCopy": "true" },
                          { "RequestHeaderOriginalHost": "true" },
                          {
                             "X-Forwarded": "Append",
                             "HeaderPrefix": "X-Forwarded-"
                          }
                      ]
                   },
                   "route2" : {
                      "ClusterId": "cluster1",
                      "Match": {
                          "Path": "/api/{plugin}/stuff/{**remainder}"
                      },
                      "Transforms": [
                          { "PathPattern": "/foo/{plugin}/bar/{**remainder}" },
                          {
                             "QueryValueParameter": "q",
                             "Append": "plugin"
                          }
                      ]
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                          "cluster1/destination1": {
                             "Address": "https://localhost:10001/Path/Base"
                          }
                      }
                   }
      }
   }
}
All configuration entries are treated as case-insensitive, though the destination server may
treat the resulting values as case sensitive or insensitive such as the path.
The details for these transforms are covered later in this document.
Developers that want to integrate their custom transforms with the Transforms section of
configuration can do so using ITransformFactory described below.
```

## Desde el código

Las transformaciones se pueden agregar a las rutas mediante programación llamando al método AddTransforms.

AddTransforms se puede invocar después de AddReverseProxy para proporcionar una devolución de llamada de configuración de transformaciones. Esta devolución de llamada se invoca cada vez que se compila o recompila una ruta y permite al desarrollador inspeccionar la información de RouteConfig y agregar transformaciones para ella de forma condicional.

La devolución de llamada de AddTransforms proporciona un TransformBuilderContext en el que se pueden agregar o configurar transformaciones. La mayoría de las transformaciones proporcionan métodos de extensión de TransformBuilderContext para facilitar su incorporación. Estas extensiones se documentan más adelante junto con las descripciones de cada transformación.

TransformBuilderContext también incluye un IServiceProvider para acceder a los servicios que se necesiten.

```csharp
services.AddReverseProxy()
      .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
      .AddTransforms(builderContext =>
      {
             // Added to all routes.
             builderContext.AddPathPrefix("/prefix");
             // Conditionally add a transform for routes that require auth.
             if (!string.IsNullOrEmpty(builderContext.Route.AuthorizationPolicy))
             {
                    builderContext.AddRequestTransform(async transformContext =>
                    {
                          transformContext.ProxyRequest.Headers.Add("CustomHeader",
"CustomValue");
                    });
             }
      });
For more advanced control see ITransformProvider described below.
 Note: The author created this article with assistance from AI. Learn more
```
