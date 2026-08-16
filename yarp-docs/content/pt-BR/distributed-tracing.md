---
slug: distributed-tracing
title: Rastreamento distribuído
lede: >-
  Como um componente do ASP.NET Core, o YARP pode se integrar facilmente a diferentes sistemas de
  rastreamento
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/distributed-tracing
lastUpdated: 2026-08-11
---

Como um componente do ASP.NET Core, o YARP pode se integrar facilmente a diferentes sistemas de rastreamento, assim como qualquer outro aplicativo ASP.NET Core.

O .NET tem suporte interno e configurável para rastreamento distribuído, que o YARP aproveita para habilitar esses cenários prontos para uso.

## Usando o Open Telemetry

O YARP oferece suporte a rastreamento distribuído usando o Open Telemetry (OTEL). Quando uma solicitação chega e há um listener para Activities, o ASP.NET Core propaga o trace-id do Trace Context, ou cria um se necessário, e cria novos spans/activities para o trabalho realizado. Além disso, o YARP pode criar activities para:

Encaminhamento de solicitações Verificações de integridade ativas para clusters

Elas só serão criadas se houver um listener para o ActivitySource chamado Yarp.ReverseProxy.

Exemplo: Application Insights

Por exemplo, para monitorar os rastreamentos com o Application Insights, o aplicativo de proxy precisa usar os SDKs do Open Telemetry e do Azure Monitor.

application.csproj:

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

## Usando cabeçalhos de rastreamento personalizados

Ao usar um mecanismo de propagação que não é integrado ao .NET (por exemplo, a propagação B3), você deve implementar um [DistributedContextPropagator] personalizado para esse esquema.

O YARP removerá qualquer cabeçalho em [DistributedContextPropagator.Fields] para que o propagador possa adicioná-los novamente à solicitação durante a chamada Inject.

## Proxy de passagem direta

Se você não quiser que o proxy participe ativamente do rastreamento e quiser manter todos os cabeçalhos de rastreamento como estão, é possível fazer isso definindo SocketsHttpHandler.ActivityHeadersPropagator como null.

```csharp
services.AddReverseProxy()
      .ConfigureHttpClient((context, handler) => handler.ActivityHeadersPropagator =
null);
```

## DistributedContextPropagator DistributedContextPropagator.Fields

:::note
O autor criou este artigo com a ajuda de IA. Saiba mais
:::
