---
slug: diagnosing-yarp-issues
title: Diagnosing YARP-based proxies
lede: >-
  When using a reverse proxy, there is an additional hop from the client to the proxy, and then
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/diagnosing-yarp-issues
lastUpdated: 2026-08-11
---

When using a reverse proxy, there is an additional hop from the client to the proxy, and then from the proxy to destination for things to go wrong. This topic should provide some hints and tips for how to debug and diagnose issues when they occur. It assumes that the proxy is already running, and so does not include problems at startup such as configuration errors.

## Logging {#logging}

The first step to being able to tell what is going on with YARP is to turn on logging. This is a configuration flag so can be changed on the fly. YARP is implemented as a middleware component for ASP.NET Core, so you need to enable logging for both YARP and ASP.NET to get the complete picture of what is going on.

By default ASP.NET will log to the console, and the configuration file can be used to control the level of logging.

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

## Understanding log entries {#understanding-log-entries}

The logging output is directly tied to the way that ASP.NET Core processes requests. It's important to realize that as middleware, YARP is relying on much of the ASP.NET functionality to process the requests, for example the following is for the processing of a request with "Debug" mode enabled:

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

The above gives general information about the request and how it was processed.

## Using ASP.NET request logging {#using-asp-net-request-logging}

ASP.NET includes a middleware component that can be used to provide more details about the request and response. The UseHttpLogging component can be added to the request pipeline, which adds additional entries to the log detailing the incoming and outgoing request headers.

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

## Using telemetry events {#using-telemetry-events}

We recommend reading Networking telemetry in .NET as a primer on how to consume networking telemetry in .NET.

The Metrics sample shows how to listen to events from the different providers that collect telemetry as part of YARP. The most important from a diagnostics perspective are:

ForwarderTelemetryConsumer HttpClientTelemetryConsumer

To use either of these, create a class implementing a Yarp.Telemetry.Consumption interface, such as IForwarderTelemetryConsumer:

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

## Using custom middleware {#using-custom-middleware}

Another way to inspect the state for requests is to insert additional middleware into the request pipeline. You can insert between the other stages to see the state of the request.

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

## Using the debugger {#using-the-debugger}

A debugger, such as Visual Studio, can be attached to the proxy process. However, unless you have existing middleware, there isn't a good place in the app code to break and inspect the state of the request. Therefore, the debugger is best used in conjunction with one of the preceding techniques so that you have distinct places to insert breakpoints.

## Network tracing {#network-tracing}

It can be attractive to use network tracing tools like Fiddler or Wireshark to try to monitor what's happening either side of the proxy. However, be cautious using both tools:

Fiddler registers itself as a proxy and relies on apps using the default proxy to be able to monitor traffic. This works for inbound traffic from a browser to YARP but won't capture the outbound requests, as YARP is configured to not use the proxy settings for outbound traffic. On Windows, Wireshark uses Npcap to capture packet data for network traffic, so it captures both inbound and outbound traffic and can be used to monitor HTTP traffic. HTTPS traffic is encrypted and isn't automatically decryptable by network monitoring tools. Each tool has workarounds that may enable traffic to be monitored, but they require risky use of certificates and changes to trust relationships. Because YARP is making outbound requests, techniques for tricking browsers don't apply to the YARP process.

The protocol choice for outbound traffic is made based on the destination URL in the cluster configuration. If traffic monitoring is used for diagnostics, changing the outbound URLs to http:// , if possible, may be the simplest approach to enable the monitoring tools to work, provided the issues being diagnosed aren't transport protocol related.

:::note
The author created this article with assistance from AI. Learn more
:::
