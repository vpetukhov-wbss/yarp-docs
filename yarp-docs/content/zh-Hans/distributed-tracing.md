---
slug: distributed-tracing
title: 分布式跟踪
lede: >-
  作为一个 ASP.NET Core 组件，YARP 可以轻松集成到各种不同的跟踪系统中，如同
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/distributed-tracing
lastUpdated: 2026-08-11
---

作为一个 ASP.NET Core 组件，YARP 可以像其他任何 ASP.NET Core 应用程序一样，轻松集成到各种不同的跟踪系统中。

.NET 内置了可配置的分布式跟踪支持，YARP 借助这一支持，无需额外配置即可开箱即用地实现此类场景。

## 使用 Open Telemetry

YARP 支持使用 Open Telemetry（OTEL）进行分布式跟踪。当请求进入时，如果存在针对 Activity 的侦听器，那么 ASP.NET Core 会传播 Trace Context 的 trace-id（如有必要则创建一个新的），并为所执行的工作创建新的 span/activity。此外，YARP 还可以为以下内容创建 activity：

- 转发请求
- 群集的主动运行状况检查

只有在存在名为 Yarp.ReverseProxy 的 ActivitySource 的侦听器时，才会创建这些 activity。

示例：Application Insights

例如，要使用 Application Insights 监视跟踪信息，代理应用程序需要使用 Open Telemetry 和 Azure Monitor SDK。

application.csproj：

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

## 使用自定义跟踪标头

如果使用的传播机制并非 .NET 内置支持的（例如 B3 propagation），则应为该方案实现一个自定义的 DistributedContextPropagator。

YARP 会移除 DistributedContextPropagator.Fields 中列出的所有标头，以便传播器可以在 Inject 调用期间将它们重新添加到请求中。

## 透传代理

如果不希望代理主动参与跟踪，并且希望保持所有跟踪标头原样不变，则可以将 SocketsHttpHandler.ActivityHeadersPropagator 设置为 null 来实现。

```csharp
services.AddReverseProxy()
      .ConfigureHttpClient((context, handler) => handler.ActivityHeadersPropagator =
null);
```

## DistributedContextPropagator DistributedContextPropagator.Fields

:::note
本文作者在 AI 协助下创作了这篇文章。了解更多信息
:::
