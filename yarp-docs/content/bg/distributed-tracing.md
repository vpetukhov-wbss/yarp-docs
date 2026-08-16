---
slug: distributed-tracing
title: Разпределено проследяване
lede: >-
  Като компонент на ASP.NET Core, YARP може лесно да се интегрира с различни системи за
  проследяване, които
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/distributed-tracing
lastUpdated: 2026-08-11
---

Като компонент на ASP.NET Core, YARP може лесно да се интегрира с различни системи за проследяване, по същия начин както всяко друго приложение на ASP.NET Core.

.NET разполага с вградена, конфигурируема поддръжка за разпределено проследяване, която YARP използва, за да позволи такива сценарии още „от кутията“.

## Използване на Open Telemetry

YARP поддържа разпределено проследяване чрез Open Telemetry (OTEL). Когато постъпи заявка и има слушател (listener) за Activities, ASP.NET Core разпространява trace-id от контекста на трасирането (Trace Context) или създава такъв, ако е необходимо, и създава нови spans/activities за извършената работа. Освен това YARP може да създава activities за:

Препращане на заявки Активни проверки за състоянието на клъстерите

Те ще бъдат създадени само ако има слушател за ActivitySource с име Yarp.ReverseProxy .

Пример: Application Insights

Например, за да наблюдавате трасировките с Application Insights, приложението на проксито трябва да използва SDK-тата на Open Telemetry и Azure Monitor.

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

## Използване на персонализирани заглавни части за проследяване

Когато използвате механизъм за разпространение, който не е вграден в .NET (напр. B3 propagation ), трябва да реализирате персонализиран [ DistributedContextPropagator ] за тази схема.

YARP премахва всяка заглавна част от [ DistributedContextPropagator.Fields ], така че разпространителят (propagator) да може да ги добави отново към заявката по време на извикването Inject.

## Прозрачен прокси

Ако не желаете проксито активно да участва в трасирането и искате да запазите всички заглавни части за проследяване непроменени, можете да зададете SocketsHttpHandler.ActivityHeadersPropagator на null .

```csharp
services.AddReverseProxy()
      .ConfigureHttpClient((context, handler) => handler.ActivityHeadersPropagator =
null);
```

## DistributedContextPropagator DistributedContextPropagator.Fields

:::note
Тази статия е създадена от автора с помощта на изкуствен интелект (AI). Научете повече
:::
