---
slug: distributed-tracing
title: Распределённая трассировка
lede: >-
  Будучи компонентом ASP.NET Core, YARP так же легко интегрируется с различными системами
  трассировки, как
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/distributed-tracing
lastUpdated: 2026-08-11
---

Будучи компонентом ASP.NET Core, YARP так же легко интегрируется с различными системами трассировки, как и любое другое приложение ASP.NET Core.

В .NET есть встроенная настраиваемая поддержка распределённой трассировки, и YARP использует её, чтобы обеспечить такие сценарии «из коробки».

## Использование Open Telemetry

YARP поддерживает распределённую трассировку с использованием Open Telemetry (OTEL). Когда поступает запрос и есть слушатель для Activities, ASP.NET Core распространяет trace-id из Trace Context (или создаёт новый, если необходимо) и создаёт новые span'ы/активности для выполняемой работы. Кроме того, YARP может создавать активности для:

Пересылки запросов Активных проверок работоспособности кластеров

Они будут создаваться только при наличии слушателя для ActivitySource с именем Yarp.ReverseProxy .

Пример: Application Insights

Например, чтобы отслеживать трассировки с помощью Application Insights, приложению прокси нужно использовать SDK Open Telemetry и Azure Monitor.

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

## Использование пользовательских заголовков трассировки

При использовании механизма распространения контекста, не встроенного в .NET (например, B3 propagation ), для такой схемы следует реализовать собственный [ DistributedContextPropagator ].

YARP удаляет любые заголовки, перечисленные в [ DistributedContextPropagator.Fields ], чтобы пропагатор мог заново добавить их в запрос во время вызова Inject.

## Сквозной прокси

Если вы не хотите, чтобы прокси активно участвовал в трассировке, и хотите сохранить все заголовки трассировки без изменений, для этого можно установить SocketsHttpHandler.ActivityHeadersPropagator в null .

```csharp
services.AddReverseProxy()
      .ConfigureHttpClient((context, handler) => handler.ActivityHeadersPropagator =
null);
```

## DistributedContextPropagator DistributedContextPropagator.Fields

:::note
Эта статья создана автором при помощи ИИ. Подробнее.
:::
