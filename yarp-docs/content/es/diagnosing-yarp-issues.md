---
slug: diagnosing-yarp-issues
title: Diagnóstico de proxies basados en YARP
lede: >-
  Al usar un proxy inverso, hay un salto adicional entre el cliente y el proxy y, después, entre
  el proxy y el
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/diagnosing-yarp-issues
lastUpdated: 2026-08-11
---

Al usar un proxy inverso, hay un salto adicional entre el cliente y el proxy y, después, entre el proxy y el destino, en el que las cosas pueden salir mal. Este tema ofrece algunas sugerencias y consejos para depurar y diagnosticar problemas cuando se producen. Se da por hecho que el proxy ya está en ejecución, por lo que no se abordan los problemas de inicio, como los errores de configuración.

## Registro

El primer paso para poder saber qué está ocurriendo con YARP es activar el registro. Se trata de un indicador de configuración, por lo que se puede cambiar en caliente. YARP está implementado como un componente de middleware para ASP.NET Core, así que debe habilitar el registro tanto para YARP como para ASP.NET a fin de obtener una visión completa de lo que está sucediendo.

De forma predeterminada, ASP.NET registra la actividad en la consola, y el archivo de configuración puede usarse para controlar el nivel de registro.

```json
       //Sets the Logging level for ASP.NET
       "Logging": {
          "LogLevel": {
             "Default": "Information",
             // Uncomment to hide diagnostic messages from runtime and proxy
             // "Microsoft": "Warning",
             // "Yarp" : "Warning",
             "Microsoft.Hosting.Lifetime": "Information"
          }
       },
You want logging information from the Microsoft.AspNetCore.\* and Yarp.ReverseProxy.\*
providers. The preceding example emits Information -level events from both providers to the
console. Changing the level to Debug shows additional entries. ASP.NET implements change
detection for configuration files, so you can edit the appsettings.json file (or
appsettings.development.json for the Development environment) while the project is running
and observe changes to the log output.
 Note
Settings in the appsettings.development.json file override settings in appsettings.json
when running in the Development environment, so make sure that if you are editing
appsettings.json that the values aren't overridden.
```

## Interpretación de las entradas de registro

El resultado del registro está directamente ligado a la forma en que ASP.NET Core procesa las solicitudes. Es importante tener en cuenta que, al ser middleware, YARP depende en gran medida de la funcionalidad de ASP.NET para procesar las solicitudes; por ejemplo, lo siguiente corresponde al procesamiento de una solicitud con el modo "Debug" habilitado:

*Nivel · Mensaje de registro · Descripción*

- **dbug** `Microsoft.AspNetCore.Server.Kestrel.Connections[39]` — `Connection id "0HMCD0JK7K51U" accepted.` (las conexiones son independientes de las solicitudes, por lo que se trata de una conexión nueva)
- **dbug** `Microsoft.AspNetCore.Server.Kestrel.Connections[1]` — `Connection id "0HMCD0JK7K51U" started.`
- **info** `Microsoft.AspNetCore.Hosting.Diagnostics[1]` — `Request starting HTTP/1.1 GET http://localhost:5000/ - -` (esta es la solicitud entrante a ASP.NET)
- **dbug** `Microsoft.AspNetCore.HostFiltering.HostFilteringMiddleware[0]` — `Wildcard detected, all requests with hosts will be allowed.` (mi configuración no vincula los puntos de conexión a nombres de host concretos)
- **dbug** `Microsoft.AspNetCore.Routing.Matching.DfaMatcher[1001]` — `1 candidate(s) found for the request path '/'` (esto muestra cuántas coincidencias posibles hay para la ruta)
- **dbug** `Microsoft.AspNetCore.Routing.Matching.DfaMatcher[1005]` — `Endpoint 'minimumroute' with route pattern '{**catch-all}' is valid for the request path '/'` (la ruta mínima definida en la configuración de YARP ha coincidido)
- **dbug** `Microsoft.AspNetCore.Routing.EndpointRoutingMiddleware[1]` — `Request matched endpoint 'minimumroute'`
- **info** `Microsoft.AspNetCore.Routing.EndpointMiddleware[0]` — `Executing endpoint 'minimumroute'`
- **info** `Yarp.ReverseProxy.Forwarder.HttpForwarder[9]` — `Proxying to http://www.example.com/` (YARP está reenviando la solicitud a example.com)
- **info** `Microsoft.AspNetCore.Routing.EndpointMiddleware[1]` — `Executed endpoint 'minimumroute'`

*Nivel · Mensaje de registro · Descripción*

- **dbug** `Microsoft.AspNetCore.Server.Kestrel.Connections[9]` — `Connection id "0HMCD0JK7K51U" completed keep alive response.` (la respuesta ha terminado, pero la conexión puede mantenerse activa)
- **info** `Microsoft.AspNetCore.Hosting.Diagnostics[2]` — `Request finished HTTP/1.1 GET http://localhost:5000/ - - - 200 1256 text/html; charset=utf-8 12.7797ms` (la respuesta se completó con el código de estado 200, devolviendo 1256 bytes como text/html en unos 13 ms)
- **dbug** `Microsoft.AspNetCore.Server.Kestrel.Transport.Sockets[6]` — `Connection id "0HMCD0JK7K51U" received FIN.` (información de diagnóstico sobre la conexión, para determinar quién la cerró y de qué forma)
- **dbug** `Microsoft.AspNetCore.Server.Kestrel.Connections[10]` — `Connection id "0HMCD0JK7K51U" disconnecting.`
- **dbug** `Microsoft.AspNetCore.Server.Kestrel.Connections[2]` — `Connection id "0HMCD0JK7K51U" stopped.`
- **dbug** `Microsoft.AspNetCore.Server.Kestrel.Transport.Sockets[7]` — `Connection id "0HMCD0JK7K51U" sending FIN because: "The Socket transport's send loop completed gracefully."`

Lo anterior ofrece información general sobre la solicitud y su procesamiento.

## Uso del registro de solicitudes de ASP.NET

ASP.NET incluye un componente de middleware que se puede usar para obtener más detalles sobre la solicitud y la respuesta. El componente `UseHttpLogging` se puede agregar a la canalización de solicitudes, lo que añade entradas adicionales al registro con el detalle de los encabezados de la solicitud entrante y saliente.

```csharp
   app.UseHttpLogging();
   // Enable endpoint routing, required for the reverse proxy
   app.UseRouting();
   // Register the reverse proxy routes
   app.MapReverseProxy();
For example:
```

```console
info: Microsoft.AspNetCore.HttpLogging.HttpLoggingMiddleware[1]
         Request:
         Protocol: HTTP/1.1
         Method: GET
         Scheme: http
         PathBase:
         Path: /
         Accept: */*
         Host: localhost:5000
         User-Agent: curl/7.55.1
info: Microsoft.AspNetCore.HttpLogging.HttpLoggingMiddleware[2]
         Response:
         StatusCode: 200
         Content-Type: text/html; charset=utf-8
         Date: Tue, 12 Oct 2021 23:29:20 GMT
         Server: ECS,(sec/97A5)
         Age: 113258
         Cache-Control: [Redacted]
         ETag: [Redacted]
         Expires: Tue, 19 Oct 2021 23:29:20 GMT
         Last-Modified: Thu, 17 Oct 2019 07:18:26 GMT
         Vary: [Redacted]
         Content-Length: 1256
         X-Cache: [Redacted]
```

## Uso de eventos de telemetría

Se recomienda leer Networking telemetry in .NET como introducción al consumo de telemetría de red en .NET.

El ejemplo Metrics muestra cómo escuchar los eventos de los distintos proveedores que recopilan telemetría como parte de YARP. Los más importantes desde el punto de vista del diagnóstico son:

`ForwarderTelemetryConsumer` y `HttpClientTelemetryConsumer`.

Para usar cualquiera de ellos, cree una clase que implemente una interfaz de `Yarp.Telemetry.Consumption`, como `IForwarderTelemetryConsumer`:

```csharp
public class ForwarderTelemetry : IForwarderTelemetryConsumer
{
      /// Called before forwarding a request.
      public void OnForwarderStart(DateTime timestamp, string destinationPrefix)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnForwarderStart :: Destination prefix: {destinationPrefix}");
                 }
/// Called after forwarding a request.
public void OnForwarderStop(DateTime timestamp, int statusCode)
{
      Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
             $"OnForwarderStop :: Status: {statusCode}");
}
      /// Called before <see cref="OnForwarderStop(DateTime, int)"/> if forwarding
the request failed.
      public void OnForwarderFailed(DateTime timestamp, ForwarderError error)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnForwarderFailed :: Error: {error.ToString()}");
      }
/// Called when reaching a given stage of forwarding a request.
public void OnForwarderStage(DateTime timestamp, ForwarderStage stage)
{
      Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
             $"OnForwarderStage :: Stage: {stage.ToString()}");
}
      /// Called periodically while a content transfer is active.
      public void OnContentTransferring(DateTime timestamp, bool isRequest, long
contentLength,
             long iops, TimeSpan readTime, TimeSpan writeTime)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnContentTransferring :: Is request: {isRequest}, Content length:
{contentLength}, " +
                   $"IOps: {iops}, Read time: {readTime:s\\.fff}, Write time:
{writeTime:s\\.fff}");
      }
      /// Called after transferring the request or response content.
      public void OnContentTransferred(DateTime timestamp, bool isRequest, long con-
tentLength,
             long iops, TimeSpan readTime, TimeSpan writeTime, TimeSpan firstReadTime)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnContentTransferred :: Is request: {isRequest}, Content length:
{contentLength}, " +
                   $"IOps: {iops}, Read time: {readTime:s\\.fff}, Write time:
{writeTime:s\\.fff}");
      }
      /// Called before forwarding a request from `ForwarderMiddleware`, therefore
is not called for direct forwarding scenarios.
      public void OnForwarderInvoke(DateTime timestamp, string clusterId, string
routeId,
             string destinationId)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnForwarderInvoke:: Cluster id: {clusterId}, Route Id: {routeId},
Destination: {destinationId}");
   }
}
Register the class as part of services, for example:
```

```csharp
   services.AddTelemetryConsumer<ForwarderTelemetry>();
   // Add the reverse proxy to capability to the server
   var proxyBuilder = services.AddReverseProxy();
   // Initialize the reverse proxy from the "ReverseProxy" section of configuration
   proxyBuilder.LoadFromConfig(Configuration.GetSection("ReverseProxy"));
Details are logged on each part of the request, for example:
```

```console
   Forwarder Telemetry [06:40:48.186] => OnForwarderInvoke::
          Cluster id: minimumcluster, Route Id: minimumroute, Destination: example.com
   Forwarder Telemetry [06:41:00.269] => OnForwarderStart ::
          Destination prefix: http://www.example.com/
   Forwarder Telemetry [06:41:00.298] => OnForwarderStage :: Stage: SendAsyncStart
   Forwarder Telemetry [06:41:00.507] => OnForwarderStage :: Stage: SendAsyncStop
   Forwarder Telemetry [06:41:00.530] => OnForwarderStage :: Stage:
          ResponseContentTransferStart
   Forwarder Telemetry [06:41:03.655] => OnForwarderStop :: Status: 200
The events for telemetry are fired as they occur, so you can obtain the HttpContext and the
YARP feature from it:
```

```csharp
   services.AddTelemetryConsumer<ForwarderTelemetry>();
   services.AddHttpContextAccessor();
   ...
   public void OnForwarderInvoke(DateTime timestamp, string clusterId, string
   routeId,
          string destinationId)
   {
          var context = new HttpContextAccessor().HttpContext;
          var YarpFeature = context.GetReverseProxyFeature();
          var dests = from d in YarpFeature.AvailableDestinations
                 select d.Model.Config.Address;
   Console.WriteLine($"Destinations: {string.Join(", ", dests)}");
}
```

## Uso de middleware personalizado

Otra forma de inspeccionar el estado de las solicitudes es insertar middleware adicional en la canalización de solicitudes; puede insertarlo entre las demás etapas para ver el estado de la solicitud.

```csharp
   // We can customize the proxy pipeline and add/remove/replace steps
   app.MapReverseProxy(proxyPipeline =>
   {
          // Use a custom proxy middleware, defined below
          proxyPipeline.Use(MyCustomProxyStep);
          // Don't forget to include these two middleware when you make a custom proxy
   pipeline (if you need them).
          proxyPipeline.UseSessionAffinity();
          proxyPipeline.UseLoadBalancing();
   });
   ...
   public Task MyCustomProxyStep(HttpContext context, Func<Task> next)
   {
          // Can read data from the request via the context
          foreach (var header in context.Request.Headers)
          {
                 Console.WriteLine($"{header.Key}: {header.Value}");
          }
          // The context also stores a ReverseProxyFeature which holds proxy specific
   data such as the cluster, route and destinations
          var proxyFeature = context.GetReverseProxyFeature();
   Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(proxyFeature.Route.Con
   fig));
          // Important - required to move to the next step in the proxy pipeline
          return next();
   }
You can also use ASP.NET middleware within Configure that will enable you to inspect the
request before the proxy pipeline.
 Note
The proxy streams the response from the destination server back to the client, so the
response headers and body aren't readily accessible via middleware.
```

## Uso del depurador

Puede acoplar un depurador, como Visual Studio, al proceso del proxy. Sin embargo, a menos que ya tenga middleware propio, no hay un buen lugar en el código de la aplicación donde detenerse a inspeccionar el estado de la solicitud. Por eso, el depurador se aprovecha mejor junto con alguna de las técnicas anteriores, que le proporcionan puntos concretos donde insertar puntos de interrupción.

## Seguimiento de red

Puede resultar tentador usar herramientas de seguimiento de red, como Fiddler o Wireshark, para intentar supervisar lo que ocurre a ambos lados del proxy. Sin embargo, tenga cuidado al usar ambas herramientas:

Fiddler se registra a sí mismo como proxy y depende de que las aplicaciones usen el proxy predeterminado para poder supervisar el tráfico. Esto funciona para el tráfico entrante de un explorador hacia YARP, pero no captura las solicitudes salientes, ya que YARP está configurado para no usar la configuración de proxy en el tráfico saliente. En Windows, Wireshark usa Npcap para capturar datos de paquetes de la red, por lo que captura tanto el tráfico entrante como el saliente y puede usarse para supervisar tráfico HTTP. El tráfico HTTPS está cifrado y las herramientas de supervisión de red no pueden descifrarlo automáticamente. Cada herramienta tiene soluciones alternativas que pueden permitir supervisar el tráfico, pero requieren un uso arriesgado de certificados y cambios en las relaciones de confianza. Dado que YARP realiza solicitudes salientes, las técnicas para engañar a los exploradores no se aplican al proceso de YARP.

La elección del protocolo para el tráfico saliente se basa en la URL de destino configurada en el clúster. Si se usa la supervisión de tráfico con fines de diagnóstico, cambiar las URL salientes a `http://`, si es posible, puede ser el enfoque más simple para que las herramientas de supervisión funcionen, siempre que los problemas que se estén diagnosticando no estén relacionados con el protocolo de transporte.

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
