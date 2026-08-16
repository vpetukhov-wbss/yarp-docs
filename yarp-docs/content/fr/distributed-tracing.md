---
slug: distributed-tracing
title: Traçage distribué
lede: >-
  En tant que composant ASP.NET Core, YARP peut facilement s'intégrer à différents systèmes de
  traçage, au même titre que
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/distributed-tracing
lastUpdated: 2026-08-11
---

En tant que composant ASP.NET Core, YARP peut facilement s'intégrer à différents systèmes de traçage, au même titre que n'importe quelle autre application ASP.NET Core.

.NET dispose d'une prise en charge configurable intégrée du traçage distribué, dont YARP tire parti pour prendre en charge ce type de scénarios de manière prête à l'emploi.

## Utilisation d'Open Telemetry

YARP prend en charge le traçage distribué à l'aide d'Open Telemetry (OTEL). Lorsqu'une requête arrive et qu'il existe un écouteur pour les Activities, ASP.NET Core propage le trace-id du Trace Context, ou en crée un si nécessaire, et crée de nouveaux spans/activités pour le travail effectué. YARP peut en outre créer des activités pour :

Transfert des requêtes Contrôles d'intégrité actifs pour les clusters

Elles ne sont créées que s'il existe un écouteur pour l'ActivitySource nommée Yarp.ReverseProxy .

Exemple : Application Insights

Par exemple, pour superviser les traces avec Application Insights, l'application proxy doit utiliser les kits SDK Open Telemetry et Azure Monitor.

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

## Utilisation d'en-têtes de traçage personnalisés

Lorsque vous utilisez un mécanisme de propagation qui n'est pas intégré à .NET (par exemple, la propagation B3 ), vous devez implémenter un [ DistributedContextPropagator ] personnalisé pour ce schéma.

YARP supprime tout en-tête présent dans [ DistributedContextPropagator.Fields ] afin que le propagateur puisse les rajouter à la requête lors de l'appel Inject .

## Proxy pass-through

Si vous ne souhaitez pas que le proxy participe activement au traçage et souhaitez conserver tous les en-têtes de traçage tels quels, vous pouvez le faire en définissant SocketsHttpHandler.ActivityHeadersPropagator sur null .

```csharp
services.AddReverseProxy()
      .ConfigureHttpClient((context, handler) => handler.ActivityHeadersPropagator =
null);
```

## DistributedContextPropagator DistributedContextPropagator.Fields

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
