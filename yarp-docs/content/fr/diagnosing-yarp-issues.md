---
slug: diagnosing-yarp-issues
title: Diagnostiquer les proxys basés sur YARP
lede: >-
  Lorsque vous utilisez un proxy inverse, il y a un saut supplémentaire du client vers le proxy,
  puis
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/diagnosing-yarp-issues
lastUpdated: 2026-08-11
---

Lorsque vous utilisez un proxy inverse, il y a un saut supplémentaire du client vers le proxy, puis du proxy vers la destination, ce qui multiplie les points de défaillance possibles. Cette rubrique a pour but de fournir quelques indications et conseils pour déboguer et diagnostiquer les problèmes lorsqu'ils surviennent. Elle part du principe que le proxy est déjà en cours d'exécution et n'aborde donc pas les problèmes de démarrage tels que les erreurs de configuration.

## Journalisation

La première étape pour comprendre ce qui se passe avec YARP consiste à activer la journalisation. Il s'agit d'un indicateur de configuration qui peut donc être modifié à la volée. YARP est implémenté comme un composant middleware pour ASP.NET Core ; vous devez donc activer la journalisation à la fois pour YARP et pour ASP.NET afin d'obtenir une vue complète de ce qui se passe.

Par défaut, ASP.NET journalise dans la console, et le fichier de configuration permet de contrôler le niveau de journalisation.

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

## Comprendre les entrées de journal

La sortie de journalisation est directement liée à la façon dont ASP.NET Core traite les requêtes. Il est important de comprendre qu'en tant que middleware, YARP s'appuie largement sur les fonctionnalités d'ASP.NET pour traiter les requêtes ; voici par exemple le déroulement du traitement d'une requête avec le mode « Debug » activé :

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

Ce qui précède fournit des informations générales sur la requête et la façon dont elle a été traitée.

## Utilisation de la journalisation des requêtes ASP.NET

ASP.NET inclut un composant middleware permettant de fournir plus de détails sur la requête et la réponse. Le composant UseHttpLogging peut être ajouté au pipeline de requêtes ; il ajoute des entrées supplémentaires au journal détaillant les en-têtes de requête entrants et sortants.

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

## Utilisation des événements de télémétrie

Nous vous recommandons de lire l'article Télémétrie réseau dans .NET pour une introduction à la consommation de la télémétrie réseau dans .NET.

L'exemple Metrics montre comment écouter les événements provenant des différents fournisseurs qui collectent la télémétrie dans le cadre de YARP. Les plus importants du point de vue du diagnostic sont :

ForwarderTelemetryConsumer HttpClientTelemetryConsumer

Pour utiliser l'une ou l'autre, créez une classe implémentant une interface de Yarp.Telemetry.Consumption, telle que IForwarderTelemetryConsumer :

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

## Utilisation d'un middleware personnalisé

Une autre façon d'inspecter l'état des requêtes consiste à insérer un middleware supplémentaire dans le pipeline de requêtes. Vous pouvez l'insérer entre les différentes étapes pour observer l'état de la requête.

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

## Utilisation du débogueur

Un débogueur, tel que Visual Studio, peut être attaché au processus du proxy. Cependant, à moins de disposer d'un middleware existant, il n'y a pas d'emplacement approprié dans le code de l'application pour interrompre l'exécution et inspecter l'état de la requête. C'est pourquoi il est préférable d'utiliser le débogueur en complément de l'une des techniques précédentes, afin de disposer d'emplacements distincts où insérer des points d'arrêt.

## Traçage réseau

Il peut être tentant d'utiliser des outils de traçage réseau comme Fiddler ou Wireshark pour essayer de surveiller ce qui se passe de part et d'autre du proxy. Cependant, soyez prudent avec l'utilisation de ces deux outils :

Fiddler s'enregistre lui-même comme proxy et s'appuie sur le fait que les applications utilisent le proxy par défaut pour pouvoir surveiller le trafic. Cela fonctionne pour le trafic entrant d'un navigateur vers YARP, mais ne capture pas les requêtes sortantes, car YARP est configuré pour ne pas utiliser les paramètres de proxy pour le trafic sortant. Sous Windows, Wireshark utilise Npcap pour capturer les données de paquets du trafic réseau ; il capture donc à la fois le trafic entrant et sortant et peut être utilisé pour surveiller le trafic HTTP. Le trafic HTTPS est chiffré et n'est pas automatiquement déchiffrable par les outils de surveillance réseau. Chaque outil dispose de contournements qui peuvent permettre de surveiller le trafic, mais ils nécessitent une utilisation risquée de certificats et des modifications des relations d'approbation. Étant donné que YARP effectue des requêtes sortantes, les techniques utilisées pour tromper les navigateurs ne s'appliquent pas au processus YARP.

Le choix du protocole pour le trafic sortant est déterminé en fonction de l'URL de destination dans la configuration du cluster. Si la surveillance du trafic est utilisée à des fins de diagnostic, remplacer les URL sortantes par http:// , si possible, peut être l'approche la plus simple pour permettre aux outils de surveillance de fonctionner, à condition que les problèmes diagnostiqués ne soient pas liés au protocole de transport.

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
