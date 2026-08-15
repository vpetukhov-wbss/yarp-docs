---
slug: config-files
title: Configuration files
lede: >-
  Load routes and clusters from appsettings.json or any other IConfiguration source, and have
  the proxy pick up changes automatically without a restart.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files
lastUpdated: 2025-02-10
---

## Loading configuration {#loading-configuration}

YARP can load its routes and clusters from any `IConfiguration` source - `appsettings.json` in the examples below, but any provider works the same way. The proxy re-reads the configuration and applies changes automatically whenever the source changes, with no restart required.

:::example Program.cs
Registers the proxy from the "ReverseProxy" section of configuration.

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```
:::

:::note
Configuration can be modified as it's loaded, before it's validated and applied - see [Configuration filters](doc:config-filters).
:::

## Configuration structure {#configuration-structure}

The named section passed to `LoadFromConfig` - `"ReverseProxy"` above - contains two subsections: `Routes` and `Clusters`.

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "{**catch-all}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"]
        }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "cluster1/destination1": { "Address": "https://example.com/" }
        }
      }
    }
  }
}
```

## Routes {#routes}

`Routes` is an unordered collection of route entries, each requiring at least:

- **`RouteId`** — a unique name for the route.
- **`ClusterId`** — the name of an entry in `Clusters` that requests matching this route are sent to.
- **`Match`** — a `Hosts` array, a `Path` pattern (an ASP.NET Core route template), or both.

When more than one route could match a request, the most specific route wins - see [Header-based routing](doc:header-routing) for how precedence works in detail, or set an explicit `Order` (lower values win) to control it directly. Headers, authorization, CORS, and other per-request policies can all be set on a route entry too.

## Clusters {#clusters}

`Clusters` is an unordered collection of named clusters. Each cluster contains a set of named `Destinations` - backend addresses considered capable of handling requests for any route that points at that cluster. Once a route has matched, the cluster's load balancing policy picks which destination actually gets the request - see [Load balancing](doc:load-balancing).

## Multiple configuration sources {#multiple-configuration-sources}

`LoadFromConfig` can be called more than once, pointing at different sections or even different providers - combine it with [a custom configuration provider](doc:config-providers) loading from somewhere else entirely:

```csharp
services.AddReverseProxy()
    .LoadFromConfig(Configuration.GetSection("ReverseProxy1"))
    .LoadFromConfig(Configuration.GetSection("ReverseProxy2"));
```

A route defined in one source can reference a cluster defined in another. What isn't supported is merging *partial* configuration for the same route or cluster across two sources - each one has to come from a single source in full.

## All configuration properties {#all-properties}

A single route and a fully specified cluster, showing every top-level property together:

:::example Full reference shape
Most fields are optional; only `RouteId`/`ClusterId`/`Match` on a route and `Destinations` on a cluster are required. `HealthCheck`, `SessionAffinity`, and `HttpClient`/`HttpRequest` each have their own dedicated page - see [Destination health checks](doc:dests-health-checks), [Session affinity](doc:session-affinity), and [HTTP client configuration](doc:http-client-config).

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Order": 100,
        "MaxRequestBodySize": 1000000,
        "AuthorizationPolicy": "Anonymous",
        "CorsPolicy": "Default",
        "Match": {
          "Path": "/something/{**remainder}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"],
          "Methods": ["GET", "PUT"],
          "Headers": [
            { "Name": "MyCustomHeader", "Values": ["value1", "value2"], "Mode": "ExactHeader" }
          ],
          "QueryParameters": [
            { "Name": "MyQueryParameter", "Values": ["value1", "value2"], "Mode": "Exact" }
          ]
        },
        "Metadata": { "MyName": "MyValue" },
        "Transforms": [{ "RequestHeader": "MyHeader", "Set": "MyValue" }]
      }
    },
    "Clusters": {
      "cluster1": {
        "LoadBalancingPolicy": "PowerOfTwoChoices",
        "Destinations": {
          "cluster1/destination1": { "Address": "https://contoso.com" },
          "cluster1/destination2": { "Address": "https://10.20.30.40", "Health": "https://10.20.30.40:12345/test" }
        },
        "SessionAffinity": { "Enabled": true, "Policy": "Cookie" },
        "HealthCheck": {
          "Active": { "Enabled": true, "Interval": "00:00:10", "Path": "/api/health" },
          "Passive": { "Enabled": true, "Policy": "TransportFailureRateHealthPolicy" }
        },
        "HttpClient": { "SslProtocols": "Tls13", "MaxConnectionsPerServer": 1024 },
        "Metadata": { "MyKey": "MyValue" }
      }
    }
  }
}
```
:::
