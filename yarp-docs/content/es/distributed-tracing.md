---
slug: distributed-tracing
title: Seguimiento distribuido
lede: >-
  Como componente de ASP.NET Core, YARP puede integrarse fácilmente en distintos sistemas de
  seguimiento que
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/distributed-tracing
lastUpdated: 2026-08-11
---

Como componente de ASP.NET Core, YARP puede integrarse fácilmente en distintos sistemas de seguimiento, igual que cualquier otra aplicación de ASP.NET Core.

.NET ofrece compatibilidad configurable integrada para el seguimiento distribuido, de la que YARP se aprovecha para habilitar este tipo de escenarios sin necesidad de configuración adicional.

## Uso de Open Telemetry

YARP admite el seguimiento distribuido mediante Open Telemetry (OTEL). Cuando llega una solicitud y existe un agente de escucha para las Activities, ASP.NET Core propaga el trace-id del contexto de seguimiento (o crea uno si es necesario) y genera nuevos spans/activities para el trabajo realizado. Además, YARP puede crear activities para:

- El reenvío de solicitudes.
- Las comprobaciones de estado activas de los clústeres.

Estas solo se crean si existe un agente de escucha para el `ActivitySource` denominado `Yarp.ReverseProxy`.

Ejemplo: Application Insights

Por ejemplo, para supervisar los seguimientos con Application Insights, la aplicación de proxy debe usar los SDK de Open Telemetry y Azure Monitor.

`application.csproj`:

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

## Uso de encabezados de seguimiento personalizados

Cuando se usa un mecanismo de propagación que no está integrado en .NET (por ejemplo, la propagación B3), debe implementar un `DistributedContextPropagator` personalizado para ese esquema.

YARP quitará cualquier encabezado presente en `DistributedContextPropagator.Fields`, de modo que el propagador pueda volver a agregarlos a la solicitud durante la llamada a `Inject`.

## Proxy de paso directo

Si no desea que el proxy participe activamente en el seguimiento y prefiere conservar todos los encabezados de seguimiento tal cual, puede hacerlo estableciendo `SocketsHttpHandler.ActivityHeadersPropagator` en `null`.

```csharp
services.AddReverseProxy()
      .ConfigureHttpClient((context, handler) => handler.ActivityHeadersPropagator =
null);
```

## DistributedContextPropagator DistributedContextPropagator.Fields

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
