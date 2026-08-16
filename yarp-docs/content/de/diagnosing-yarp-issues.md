---
slug: diagnosing-yarp-issues
title: Diagnose von YARP-basierten Proxys
lede: >-
  Bei der Verwendung eines Reverse Proxys gibt es einen zusätzlichen Hop vom Client zum Proxy und
  dann
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/diagnosing-yarp-issues
lastUpdated: 2026-08-11
---

Bei der Verwendung eines Reverse Proxys gibt es einen zusätzlichen Hop vom Client zum Proxy und dann vom Proxy zum Ziel, an dem etwas schiefgehen kann. Dieses Thema soll einige Hinweise und Tipps zum Debuggen und Diagnostizieren von Problemen geben, wenn sie auftreten. Es wird davon ausgegangen, dass der Proxy bereits ausgeführt wird, sodass Probleme beim Start, wie z. B. Konfigurationsfehler, nicht behandelt werden.

## Protokollierung

Der erste Schritt, um erkennen zu können, was in YARP vor sich geht, besteht darin, die Protokollierung zu aktivieren. Dies ist ein Konfigurationsflag und kann daher zur Laufzeit geändert werden. YARP ist als Middlewarekomponente für ASP.NET Core implementiert. Daher müssen Sie die Protokollierung sowohl für YARP als auch für ASP.NET aktivieren, um ein vollständiges Bild des Geschehens zu erhalten.

Standardmäßig protokolliert ASP.NET in die Konsole, und die Konfigurationsdatei kann verwendet werden, um die Protokollierungsebene zu steuern.

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

## Protokolleinträge verstehen

Die Protokollierungsausgabe ist direkt an die Art und Weise gebunden, wie ASP.NET Core Anforderungen verarbeitet. Es ist wichtig zu verstehen, dass YARP als Middleware für die Verarbeitung der Anforderungen stark auf die Funktionalität von ASP.NET angewiesen ist. Das folgende Beispiel zeigt die Verarbeitung einer Anforderung bei aktiviertem „Debug"-Modus:

Level Log Message Description

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[39] Connections are Connection id "0HMCD0JK7K51U" accepted. independent of requests, so this is a new connection

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[1] Connection id "0HMCD0JK7K51U" started.

info Microsoft.AspNetCore.Hosting.Diagnostics[1] This is the incoming Request starting HTTP/1.1 GET http://localhost:5000/ - - request to ASP.NET

dbug Microsoft.AspNetCore.HostFiltering.HostFilteringMiddleware[0] My configuration does Wildcard detected, all requests with hosts will be allowed. not tie endpoints to specific hostnames

dbug Microsoft.AspNetCore.Routing.Matching.DfaMatcher[1001] This shows what 1 candidate(s) found for the request path '/' possible matches there are for the route

dbug Microsoft.AspNetCore.Routing.Matching.DfaMatcher[1005] The minimum route Endpoint 'minimumroute' with route pattern '{**catch-all}' is valid for from YARPs the request path '/' configuration has matched

dbug Microsoft.AspNetCore.Routing.EndpointRoutingMiddleware[1] Request matched endpoint 'minimumroute'

info Microsoft.AspNetCore.Routing.EndpointMiddleware[0] Executing endpoint 'minimumroute'

info Yarp.ReverseProxy.Forwarder.HttpForwarder[9] YARP is proxying the Proxying to http://www.example.com/ request to example.com

info Microsoft.AspNetCore.Routing.EndpointMiddleware[1] Executed endpoint 'minimumroute'

Level Log Message Description

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[9] The response has Connection id "0HMCD0JK7K51U" completed keep alive response. finished, but connection can be kept alive.

info Microsoft.AspNetCore.Hosting.Diagnostics[2] The response completed Request finished HTTP/1.1 GET http://localhost:5000/ - - - 200 1256 with status code 200, text/html;+charset=utf-8 12.7797ms responding with 1256 bytes as text/html in ~13ms.

dbug Microsoft.AspNetCore.Server.Kestrel.Transport.Sockets[6] Diagnostic information Connection id "0HMCD0JK7K51U" received FIN. about the connection to determine who closed it and how cleanly

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[10] Connection id "0HMCD0JK7K51U" disconnecting.

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[2] Connection id "0HMCD0JK7K51U" stopped.

dbug Microsoft.AspNetCore.Server.Kestrel.Transport.Sockets[7] Connection id "0HMCD0JK7K51U" sending FIN because: "The Socket transport's send loop completed gracefully."

Das oben Gezeigte gibt allgemeine Informationen über die Anforderung und deren Verarbeitung.

## Verwendung der ASP.NET-Anforderungsprotokollierung

ASP.NET enthält eine Middlewarekomponente, die verwendet werden kann, um weitere Details zu Anforderung und Antwort bereitzustellen. Die Komponente UseHttpLogging kann der Anforderungspipeline hinzugefügt werden, wodurch dem Protokoll zusätzliche Einträge mit Details zu den eingehenden und ausgehenden Anforderungsheadern hinzugefügt werden.

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

## Verwendung von Telemetrieereignissen

Wir empfehlen die Lektüre von Networking telemetry in .NET als Einführung, wie Netzwerktelemetrie in .NET konsumiert werden kann.

Das Metrics-Beispiel zeigt, wie Ereignisse der verschiedenen Anbieter abgehört werden können, die im Rahmen von YARP Telemetriedaten erfassen. Aus Diagnosesicht sind die wichtigsten:

ForwarderTelemetryConsumer HttpClientTelemetryConsumer

Um eine dieser Optionen zu verwenden, erstellen Sie eine Klasse, die eine Yarp.Telemetry.Consumption-Schnittstelle implementiert, z. B. IForwarderTelemetryConsumer:

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

## Verwendung von benutzerdefinierter Middleware

Eine weitere Möglichkeit, den Zustand von Anforderungen zu überprüfen, besteht darin, zusätzliche Middleware in die Anforderungspipeline einzufügen. Sie können diese zwischen den anderen Phasen einfügen, um den Zustand der Anforderung einzusehen.

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

## Verwendung des Debuggers

Ein Debugger, wie z. B. Visual Studio, kann an den Proxyprozess angehängt werden. Sofern jedoch keine vorhandene Middleware existiert, gibt es im Anwendungscode keine geeignete Stelle, um anzuhalten und den Zustand der Anforderung zu überprüfen. Daher wird der Debugger am besten in Verbindung mit einer der zuvor beschriebenen Techniken verwendet, damit Sie klar definierte Stellen zum Einfügen von Haltepunkten haben.

## Netzwerk-Tracing

Es kann verlockend sein, Netzwerk-Tracing-Tools wie Fiddler oder Wireshark zu verwenden, um zu überwachen, was auf beiden Seiten des Proxys geschieht. Gehen Sie jedoch bei der Verwendung beider Tools mit Vorsicht vor:

Fiddler registriert sich selbst als Proxy und ist darauf angewiesen, dass Apps den Standardproxy verwenden, um Datenverkehr überwachen zu können. Dies funktioniert für eingehenden Datenverkehr von einem Browser zu YARP, erfasst jedoch nicht die ausgehenden Anforderungen, da YARP so konfiguriert ist, dass die Proxyeinstellungen für ausgehenden Datenverkehr nicht verwendet werden. Unter Windows verwendet Wireshark Npcap, um Paketdaten für den Netzwerkverkehr zu erfassen. Es erfasst somit sowohl eingehenden als auch ausgehenden Datenverkehr und kann zur Überwachung von HTTP-Datenverkehr verwendet werden. HTTPS-Datenverkehr ist verschlüsselt und kann von Netzwerküberwachungstools nicht automatisch entschlüsselt werden. Für jedes Tool gibt es Umgehungslösungen, die die Überwachung des Datenverkehrs ermöglichen können, diese erfordern jedoch einen riskanten Einsatz von Zertifikaten und Änderungen an Vertrauensbeziehungen. Da YARP ausgehende Anforderungen stellt, sind Techniken zum Täuschen von Browsern auf den YARP-Prozess nicht anwendbar.

Die Wahl des Protokolls für ausgehenden Datenverkehr erfolgt basierend auf der Ziel-URL in der Clusterkonfiguration. Wenn zu Diagnosezwecken eine Datenverkehrsüberwachung verwendet wird, kann die Änderung der ausgehenden URLs auf http:// , sofern möglich, der einfachste Ansatz sein, damit die Überwachungstools funktionieren – vorausgesetzt, die zu diagnostizierenden Probleme stehen nicht im Zusammenhang mit dem Transportprotokoll.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
