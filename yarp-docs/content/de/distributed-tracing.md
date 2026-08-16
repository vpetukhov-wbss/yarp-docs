---
slug: distributed-tracing
title: Verteiltes Tracing
lede: >-
  Als ASP.NET Core-Komponente kann sich YARP genauso wie jede andere ASP.NET Core-Anwendung
  problemlos in unterschiedliche
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/distributed-tracing
lastUpdated: 2026-08-11
---

Als ASP.NET Core-Komponente kann sich YARP genauso wie jede andere ASP.NET Core-Anwendung problemlos in unterschiedliche Tracingsysteme integrieren lassen.

.NET verfügt über integrierte, konfigurierbare Unterstützung für verteiltes Tracing, die YARP nutzt, um solche Szenarien sofort einsatzbereit zu ermöglichen.

## Verwendung von Open Telemetry

YARP unterstützt verteiltes Tracing mithilfe von Open Telemetry (OTEL). Wenn eine Anforderung eingeht und ein Listener für Activities vorhanden ist, propagiert ASP.NET Core die Trace-Context-Trace-ID – oder erstellt bei Bedarf eine neue – und erzeugt neue Spans/Activities für die durchgeführte Arbeit. Darüber hinaus kann YARP Activities erstellen für:

Forwarding Requests Active health checks for clusters

Diese werden nur erstellt, wenn ein Listener für die ActivitySource mit dem Namen Yarp.ReverseProxy vorhanden ist.

Beispiel: Application Insights

Um die Traces beispielsweise mit Application Insights zu überwachen, muss die Proxyanwendung die Open Telemetry- und Azure Monitor-SDKs verwenden.

application.csproj :

```xml
   <ItemGroup>
       <PackageReference Include="Azure.Monitor.OpenTelemetry.AspNetCore"
   Version="1.0.0-beta.3" />
   </ItemGroup>
Program.cs :
```

```csharp
using Azure.Monitor.OpenTelemetry.AspNetCore;
using OpenTelemetry.Trace;
using System.Diagnostics;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddReverseProxy().LoadFromConfig(builder.Configuration.GetSection
("ReverseProxy"));
builder.Services.AddOpenTelemetry()
      // Use helper to configure Azure Monitor defaults
      .UseAzureMonitor(o =>
      {
             o.ConnectionString =
builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"];
      })
      .WithTracing(t =>
      {
             // Listen to the YARP tracing activities
             t.AddSource("Yarp.ReverseProxy");
      });
var app = builder.Build();
app.MapReverseProxy();
app.Run();
Example: OpenTelemetry hosting
```

```xml
       <ItemGroup>
          <PackageReference Include="OpenTelemetry.Exporter.Console" Version="1.7.0" />
          <PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol"
   Version="1.7.0" />
          <PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.7.0"
   />
          <PackageReference Include="OpenTelemetry.Instrumentation.AspNetCore"
   Version="1.7.0" />
          <PackageReference Include="OpenTelemetry.Instrumentation.Http"
   Version="1.7.0" />
          <PackageReference Include="OpenTelemetry.Instrumentation.Runtime"
   Version="1.7.0" />
       </ItemGroup>
```

```csharp
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddReverseProxy().LoadFromConfig(builder.Configuration.GetSection
("ReverseProxy"));
// configure OTel and OTLP
const string serviceName = "yarpProxy";
builder.Logging.AddOpenTelemetry(options =>
{
      options
             .SetResourceBuilder(
                   ResourceBuilder.CreateDefault()
                          .AddService(serviceName))
             .AddOtlpExporter();
});
builder.Services.AddOpenTelemetry()
      .ConfigureResource(resource => resource.AddService(serviceName))
      .WithTracing(tracing => tracing
             .AddAspNetCoreInstrumentation()
             .AddHttpClientInstrumentation()
             .AddSource("Yarp.ReverseProxy")
             .AddOtlpExporter()
      );
// build and start app
var app = builder.Build();
app.MapReverseProxy();
app.Run();
Note that the AddHttpClientInstrumentation() call is required along with the
AddSource("Yarp.ReverseProxy") call to make the request spans emit.
See ASP.NET Documentation on Observability with OpenTelemetry.
Provided that the traces are being logged to the same store for the proxy and destination
servers, then the tracing analysis tools can correlate the requests and provide gant charts etc
covering the end-to-end processing of the requests as they transition across the servers.
The same pattern can be used with the built-in OTEL exporters for Jaeger and Zipkin, or with
many of the APM vendors who are adopting OTEL.
```

## Verwendung benutzerdefinierter Tracing-Header

Wenn Sie einen Propagationsmechanismus verwenden, der nicht in .NET integriert ist (z. B. B3-Propagation ), sollten Sie für dieses Schema einen benutzerdefinierten [ DistributedContextPropagator ] implementieren.

YARP entfernt alle Header in [ DistributedContextPropagator.Fields ], sodass der Propagator sie während des Inject-Aufrufs erneut zur Anforderung hinzufügen kann.

## Durchleitender Proxy

Wenn der Proxy nicht aktiv am Trace teilnehmen soll und Sie alle Tracing-Header unverändert beibehalten möchten, können Sie dies erreichen, indem Sie SocketsHttpHandler.ActivityHeadersPropagator auf null setzen.

```csharp
services.AddReverseProxy()
      .ConfigureHttpClient((context, handler) => handler.ActivityHeadersPropagator =
null);
```

## DistributedContextPropagator DistributedContextPropagator.Fields

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
