---
slug: diagnosing-yarp-issues
title: Диагностика прокси на основе YARP
lede: >-
  При использовании реверс-прокси появляется дополнительный переход — от клиента к прокси, а затем
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/diagnosing-yarp-issues
lastUpdated: 2026-08-11
---

При использовании реверс-прокси возникает дополнительный переход, на котором что-то может пойти не так: от клиента к прокси, а затем от прокси к узлу назначения. В этом разделе приведены советы и рекомендации по отладке и диагностике возникающих проблем. Предполагается, что прокси уже запущен, поэтому здесь не рассматриваются проблемы запуска, такие как ошибки конфигурации.

## Логирование

Первый шаг к пониманию того, что происходит с YARP, — включить логирование. Это делается флагом конфигурации, поэтому его можно менять «на лету». YARP реализован как компонент промежуточного ПО для ASP.NET Core, поэтому, чтобы получить полную картину происходящего, нужно включить логирование как для YARP, так и для ASP.NET.

По умолчанию ASP.NET выводит журнал в консоль, а уровень логирования можно настроить через файл конфигурации.

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

## Понимание записей журнала

Содержимое журнала напрямую связано с тем, как ASP.NET Core обрабатывает запросы. Важно понимать, что YARP как промежуточное ПО во многом опирается на функциональность ASP.NET при обработке запросов. Например, ниже показана обработка запроса при включённом режиме «Debug»:

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

Приведённые выше записи дают общее представление о запросе и о том, как он был обработан.

## Использование журналирования запросов ASP.NET

В ASP.NET есть компонент промежуточного ПО, который позволяет получить более подробную информацию о запросе и ответе. Компонент UseHttpLogging можно добавить в конвейер обработки запроса — он добавляет в журнал дополнительные записи с подробностями о входящих и исходящих заголовках запроса.

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

## Использование событий телеметрии

Рекомендуем сначала ознакомиться со статьёй Networking telemetry in .NET — она даёт общее представление о том, как использовать сетевую телеметрию в .NET.

В примере Metrics показано, как прослушивать события от различных провайдеров, собирающих телеметрию в составе YARP. С точки зрения диагностики важнее всего следующие:

ForwarderTelemetryConsumer HttpClientTelemetryConsumer

Чтобы использовать любой из них, создайте класс, реализующий интерфейс из пространства имён Yarp.Telemetry.Consumption, например IForwarderTelemetryConsumer:

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

## Использование пользовательского промежуточного ПО

Ещё один способ изучить состояние запроса — добавить в конвейер обработки дополнительное промежуточное ПО. Его можно вставить между другими этапами, чтобы увидеть состояние запроса на этом шаге.

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

## Использование отладчика

К процессу прокси можно подключить отладчик, например Visual Studio. Однако, если у вас нет собственного промежуточного ПО, в коде приложения попросту нет подходящего места, чтобы остановиться и изучить состояние запроса. Поэтому отладчик лучше всего использовать вместе с одним из описанных выше приёмов — тогда у вас будут конкретные места для установки точек останова.

## Сетевая трассировка

Может возникнуть соблазн воспользоваться инструментами сетевой трассировки, такими как Fiddler или Wireshark, чтобы отследить, что происходит по обе стороны прокси. Однако с обоими инструментами следует соблюдать осторожность:

Fiddler регистрирует себя как прокси и полагается на то, что приложения используют прокси по умолчанию для мониторинга трафика. Это работает для входящего трафика от браузера к YARP, но не позволяет перехватывать исходящие запросы, поскольку YARP настроен не использовать параметры прокси для исходящего трафика. В Windows Wireshark использует Npcap для перехвата пакетов сетевого трафика, поэтому он захватывает как входящий, так и исходящий трафик и может применяться для мониторинга HTTP-трафика. Трафик HTTPS зашифрован и не расшифровывается автоматически инструментами мониторинга сети. У каждого инструмента есть обходные пути, позволяющие отслеживать трафик, но они требуют рискованного использования сертификатов и изменения отношений доверия. Поскольку YARP сам выполняет исходящие запросы, приёмы обмана браузеров к процессу YARP неприменимы.

Выбор протокола для исходящего трафика определяется URL-адресом узла назначения в конфигурации кластера. Если для диагностики используется мониторинг трафика, самым простым способом заставить инструменты мониторинга работать может быть замена исходящих URL-адресов на http:// (если это возможно) — при условии, что диагностируемая проблема не связана с транспортным протоколом.

:::note
Эта статья создана автором при помощи ИИ. Подробнее.
:::
