---
slug: diagnosing-yarp-issues
title: Диагностика на прокси сървъри, базирани на YARP
lede: >-
  Когато се използва обратен прокси, се появява допълнителна стъпка от клиента до проксито, а след
  това
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/diagnosing-yarp-issues
lastUpdated: 2026-08-11
---

Когато се използва обратен прокси, се появява допълнителна стъпка от клиента до проксито, а след това от проксито до дестинацията, на които нещата могат да се объркат. Тази тема предоставя насоки и съвети за отстраняване на неизправности и диагностициране на проблеми, когато възникнат. Приема се, че проксито вече работи, така че не се разглеждат проблеми при стартиране, като например грешки в конфигурацията.

## Регистриране

Първата стъпка, за да разберете какво се случва с YARP, е да включите регистрирането. Това е конфигурационен флаг, така че може да се променя в движение. YARP е реализиран като компонент от тип междинен софтуер за ASP.NET Core, така че трябва да активирате регистрирането както за YARP, така и за ASP.NET, за да получите пълна картина на случващото се.

По подразбиране ASP.NET записва в конзолата, а конфигурационният файл може да се използва за управление на нивото на регистриране.

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

## Разбиране на записите в дневника

Изходът от регистрирането е пряко свързан с начина, по който ASP.NET Core обработва заявките. Важно е да се разбере, че като междинен софтуер, YARP разчита в голяма степен на функционалността на ASP.NET за обработка на заявките — следващият пример показва обработката на заявка с активиран режим „Debug“:

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

Горното дава обща информация за заявката и начина, по който е била обработена.

## Използване на регистрирането на заявки в ASP.NET

ASP.NET включва компонент от тип междинен софтуер, който може да се използва за предоставяне на повече подробности за заявката и отговора. Компонентът UseHttpLogging може да се добави към конвейера за обработка на заявки, като добавя допълнителни записи в дневника с подробности за входящите и изходящите заглавни части на заявката.

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

## Използване на телеметрични събития

Препоръчваме да прочетете Networking telemetry in .NET като въведение в начина на консумиране на мрежова телеметрия в .NET.

Примерът Metrics sample показва как да се слуша за събития от различните доставчици, които събират телеметрия като част от YARP. Най-важните от гледна точка на диагностиката са:

ForwarderTelemetryConsumer HttpClientTelemetryConsumer

За да използвате някой от тях, създайте клас, който имплементира интерфейс от Yarp.Telemetry.Consumption, например IForwarderTelemetryConsumer:

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

## Използване на персонализиран междинен софтуер

Друг начин за инспектиране на състоянието на заявките е да вмъкнете допълнителен междинен софтуер в конвейера за обработка на заявки. Можете да го вмъкнете между другите етапи, за да видите състоянието на заявката.

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

## Използване на дебъгера

Дебъгер, като например Visual Studio, може да бъде прикачен към процеса на проксито. Въпреки това, ако нямате съществуващ междинен софтуер, няма подходящо място в кода на приложението, където да спрете изпълнението и да инспектирате състоянието на заявката. Затова дебъгерът се използва най-добре заедно с някоя от предходните техники, така че да имате конкретни места за поставяне на точки на прекъсване.

## Проследяване на мрежата

Може да е примамливо да се използват инструменти за мрежово проследяване като Fiddler или Wireshark, за да се наблюдава какво се случва от двете страни на проксито. Все пак бъдете внимателни при използването на тези инструменти:

Fiddler се регистрира като прокси и разчита на това, че приложенията използват проксито по подразбиране, за да може да наблюдава трафика. Това работи за входящия трафик от браузър към YARP, но няма да улови изходящите заявки, тъй като YARP е конфигуриран да не използва настройките за прокси за изходящ трафик. В Windows Wireshark използва Npcap за улавяне на пакетни данни за мрежовия трафик, така че улавя както входящия, така и изходящия трафик и може да се използва за наблюдение на HTTP трафик. HTTPS трафикът е криптиран и не може автоматично да бъде дешифриран от инструменти за мрежово наблюдение. Всеки инструмент разполага със заобиколни решения, които могат да позволят наблюдение на трафика, но те изискват рисково използване на сертификати и промени в отношенията на доверие. Тъй като YARP извършва изходящите заявки, техниките за подвеждане на браузъри не се прилагат към процеса на YARP.

Изборът на протокол за изходящия трафик се прави въз основа на URL адреса на дестинацията в конфигурацията на клъстера. Ако наблюдението на трафика се използва за диагностика, промяната на изходящите URL адреси на http:// , ако е възможно, може да бъде най-простият начин инструментите за наблюдение да проработят, при условие че диагностицираните проблеми не са свързани с транспортния протокол.

:::note
Тази статия е създадена от автора с помощта на изкуствен интелект (AI). Научете повече
:::
