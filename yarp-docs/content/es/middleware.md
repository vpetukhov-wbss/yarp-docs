---
slug: middleware
title: Middleware
lede: >-
  ASP.NET Core usa una canalización de middleware para dividir el procesamiento de solicitudes en
  pasos independientes. El
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/middleware
lastUpdated: 2026-08-11
---

## Introducción

ASP.NET Core usa una canalización de middleware para dividir el procesamiento de solicitudes en pasos independientes. El desarrollador de la aplicación puede agregar el middleware y ordenarlo según sea necesario. El middleware de ASP.NET Core también se usa para implementar y personalizar la funcionalidad del proxy inverso.

## Comportamiento predeterminado

El ejemplo de introducción muestra el siguiente método Configure. Este configura una canalización de middleware con herramientas de desarrollo, enrutamiento y puntos de conexión configurados por el proxy (MapReverseProxy).

```csharp
         var builder = WebApplication.CreateBuilder(args);
         builder.Services.AddReverseProxy()
                .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
         var app = builder.Build();
         app.MapReverseProxy();
         app.Run();
The parameterless MapReverseProxy() in ReverseProxyIEndpointRouteBuilderExtensions
overload includes all standard proxy middleware for session affinity, load balancing, passive
health checks, and the final proxying of the request. Each of these check the configuration of
the matched route, cluster, and destination and perform their task accordingly.
```

## Agregar middleware

El middleware agregado a la canalización de la aplicación verá la solicitud en distintos estados de procesamiento, según el punto en el que se agregue. El middleware agregado antes de UseRouting verá todas las solicitudes y podrá manipularlas antes de que se realice cualquier enrutamiento. El middleware agregado entre UseRouting y UseEndpoints puede llamar a HttpContext.GetEndpoint() para comprobar a qué endpoint asignó el enrutamiento la solicitud (si lo hizo), y usar cualquier metadato asociado a ese endpoint. Así es como se controlan la autenticación, la autorización y CORS.

ReverseProxyIEndpointRouteBuilderExtensions ofrece una sobrecarga de MapReverseProxy que le permite compilar una canalización de middleware que se ejecutará solo para las solicitudes asignadas a rutas

configuradas por el proxy.

app.MapReverseProxy(proxyPipeline => {

proxyPipeline.Use((context, next) => {

## // Custom inline middleware

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); proxyPipeline.UsePassiveHealthChecks(); });

De forma predeterminada, esta sobrecarga de MapReverseProxy solo incluye la configuración mínima, la lógica de reenvío y la aplicación de límites al principio y al final de su canalización. El middleware de afinidad de sesión, equilibrio de carga y comprobaciones de estado pasivas no se incluye de forma predeterminada, de modo que pueda excluirlo, reemplazarlo o controlar su orden con cualquier middleware adicional.

## Middleware de proxy personalizado

El middleware que se encuentra dentro de la canalización de MapReverseProxy tiene acceso a todos los datos y el estado del proxy asociados a una solicitud (la ruta, el clúster, los destinos, etc.) a través de IReverseProxyFeature. Está disponible desde HttpContext.Features o mediante el método de extensión HttpContext.GetReverseProxyFeature().

Los datos de IReverseProxyFeature se toman como una instantánea de la configuración del proxy al comienzo de la canalización del proxy y no se ven afectados por los cambios de configuración del proxy que se produzcan mientras se procesa la solicitud.

```csharp
   proxyPipeline.Use((context, next) =>
   {
          var proxyFeature = context.GetReverseProxyFeature();
          var cluster = proxyFeature.Cluster;
          var destinations = proxyFeature.AvailableDestinations;
          return next();
   });
```

## Qué hacer con el middleware

El middleware puede generar registros, controlar si una solicitud se reenvía o no, influir en el destino al que se reenvía, y agregar funciones adicionales como el manejo de errores, los reintentos, etc.

## Registros y métricas

El middleware puede inspeccionar los campos de la solicitud y de la respuesta para generar registros y agregar métricas. Consulte la nota sobre los cuerpos (bodies) más abajo, en "Qué no hacer con el middleware".

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          LogRequest(context);
          await next();
          LogResponse(context);
   });
```

## Enviar una respuesta inmediata

Si un middleware inspecciona una solicitud y determina que no debe reenviarse, puede generar su propia respuesta y devolver el control al servidor sin llamar a next().

```csharp
   proxyPipeline.Use((context, next) =>
   {
          if (!CheckAllowedRequest(context, out var reason))
          {
                 context.Response.StatusCode = StatusCodes.Status400BadRequest;
                 return context.Response.WriteAsync(reason);
          }
          return next();
   });
```

## Filtrar destinos

El middleware, como el de afinidad de sesión y equilibrio de carga, examina IReverseProxyFeature y la configuración del clúster para decidir a qué destino se debe enviar una solicitud. AllDestinations enumera todos los destinos del clúster seleccionado.

AvailableDestinations enumera los destinos que actualmente se consideran aptos para gestionar la solicitud. Se inicializa con AllDestinations, excluyendo los destinos en mal estado si las comprobaciones de estado están habilitadas. AvailableDestinations debería reducirse a un único destino antes de que finalice la canalización; en caso contrario, se seleccionará uno al azar entre los que queden.

ProxiedDestination lo establece la lógica del proxy al final de la canalización para indicar qué destino se usó finalmente. Si no queda ningún destino disponible, se envía una respuesta de error 503.

```csharp
proxyPipeline.Use(async (context, next) =>
{
      var proxyFeature = context.GetReverseProxyFeature();
      proxyFeature.AvailableDestinations =
Filter(proxyFeature.AvailableDestinations);
      await next();
      Report(proxyFeature.ProxiedDestination);
});
DestinationState implements IReadOnlyList<DestinationState> so a single destination can be
assigned to AvailableDestinations without creating a new list.
```

## Manejo de errores

El middleware puede encapsular la llamada a await next() en un bloque try/catch para controlar las excepciones de los componentes posteriores.

La lógica del proxy al final de la canalización (IHttpForwarder) no genera excepciones para los errores comunes de reenvío de solicitudes. Estos se capturan y se notifican en IForwarderErrorFeature, disponible desde HttpContext.Features o mediante el método de extensión HttpContext.GetForwarderErrorFeature().

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          await next();
          var errorFeature = context.GetForwarderErrorFeature();
          if (errorFeature is not null)
          {
                 Report(errorFeature.Error, errorFeature.Exception);
                 }
          });
If the response has not started ( HttpResponse.HasStarted ) it can be cleared
( HttpResponse.Clear() ) and an alternate response sent, or the proxy feature fields may be
reset and the request retried.
```

## Qué no hacer con el middleware

El middleware debe ser prudente al modificar campos de la solicitud, como los encabezados, con el fin de afectar a la solicitud de proxy saliente. Estas modificaciones pueden interferir con funciones como los reintentos, y quizá sea mejor controlarlas mediante transformaciones.

El middleware DEBE comprobar HttpResponse.HasStarted antes de modificar los campos de la respuesta después de llamar a next(). Si la respuesta ya ha comenzado a enviarse al cliente, el middleware ya no podrá modificarla (excepto, quizá, los Trailers). Las transformaciones se pueden usar para inspeccionar y suprimir respuestas no deseadas. En caso contrario, consulte la nota siguiente.

El middleware debe evitar interactuar con los cuerpos de la solicitud o de la respuesta. Los cuerpos no se almacenan en búfer de forma predeterminada, por lo que interactuar con ellos puede impedir que lleguen a su destino. Aunque es posible habilitar el almacenamiento en búfer, no se recomienda, ya que puede agregar una sobrecarga considerable de memoria y latencia. Se recomienda usar un enfoque de streaming encapsulado si es necesario examinar o modificar el cuerpo. Consulte el middleware ResponseCompression como ejemplo.

El middleware NO DEBE realizar trabajo con varios subprocesos sobre una solicitud individual: HttpContext y sus miembros asociados no son seguros para subprocesos (thread-safe).

:::note
El autor creó este artículo con la ayuda de la IA. Más información
:::
