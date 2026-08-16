---
slug: distributed-tracing
title: Κατανεμημένη ανίχνευση
lede: >-
  Ως στοιχείο ASP.NET Core, το YARP μπορεί εύκολα να ενσωματωθεί σε διαφορετικά συστήματα
  ιχνηλάτησης με τον
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/distributed-tracing
lastUpdated: 2026-08-11
---

Ως στοιχείο του ASP.NET Core, το YARP μπορεί να ενσωματωθεί εύκολα σε διαφορετικά συστήματα ιχνηλάτησης, όπως ακριβώς και οποιαδήποτε άλλη εφαρμογή ASP.NET Core.

Το .NET διαθέτει ενσωματωμένη, διαμορφώσιμη υποστήριξη για κατανεμημένη ανίχνευση, την οποία αξιοποιεί το YARP για να ενεργοποιεί τέτοια σενάρια εξ ορισμού (out-of-the-box).

## Χρήση του Open Telemetry

Το YARP υποστηρίζει κατανεμημένη ανίχνευση χρησιμοποιώντας το Open Telemetry (OTEL). Όταν εισέρχεται ένα αίτημα και υπάρχει listener για Activities, τότε το ASP.NET Core θα διαδώσει το trace-id του Trace Context, ή θα δημιουργήσει ένα αν χρειάζεται, και θα δημιουργήσει νέα spans/activities για την εργασία που εκτελείται. Επιπλέον, το YARP μπορεί να δημιουργήσει activities για:

Την προώθηση αιτημάτων. Τους ενεργούς ελέγχους υγείας για clusters.

Αυτά θα δημιουργηθούν μόνο αν υπάρχει listener για το ActivitySource με όνομα Yarp.ReverseProxy .

Παράδειγμα: Application Insights

Για παράδειγμα, για την παρακολούθηση των traces με το Application Insights, η εφαρμογή του διακομιστή μεσολάβησης χρειάζεται να χρησιμοποιεί τα SDK του Open Telemetry και του Azure Monitor.

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

## Χρήση προσαρμοσμένων κεφαλίδων ιχνηλάτησης

Όταν χρησιμοποιείτε έναν μηχανισμό διάδοσης (propagation) που δεν είναι ενσωματωμένος στο .NET (π.χ. B3 propagation ), θα πρέπει να υλοποιήσετε ένα προσαρμοσμένο [ DistributedContextPropagator ] για αυτό το σχήμα.

Το YARP θα αφαιρέσει κάθε κεφαλίδα που περιλαμβάνεται στο [ DistributedContextPropagator.Fields ], ώστε ο propagator να μπορεί να τις προσθέσει ξανά στο αίτημα κατά την κλήση Inject.

## Διακομιστής μεσολάβησης pass-through

Αν δεν επιθυμείτε ο διακομιστής μεσολάβησης να συμμετέχει ενεργά στο trace, και θέλετε να διατηρήσετε όλες τις κεφαλίδες ιχνηλάτησης όπως έχουν, μπορείτε να το κάνετε ορίζοντας το SocketsHttpHandler.ActivityHeadersPropagator σε null .

```csharp
services.AddReverseProxy()
      .ConfigureHttpClient((context, handler) => handler.ActivityHeadersPropagator =
null);
```

## DistributedContextPropagator DistributedContextPropagator.Fields

:::note
Ο συγγραφέας δημιούργησε αυτό το άρθρο με τη βοήθεια AI. Μάθετε περισσότερα
:::
