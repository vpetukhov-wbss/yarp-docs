---
slug: yarp-overview
title: Overview of YARP
lede: >-
  YARP (Yet Another Reverse Proxy) is a highly customizable reverse proxy library for .NET —
  built to be robust, flexible, scalable, secure, and easy to run in front of the services you
  already have.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/yarp-overview
lastUpdated: 2025-02-21
---

## Introduction {#introduction}

YARP helps developers create powerful and efficient reverse proxy solutions tailored to their specific needs. It sits between client devices and backend servers, forwarding client requests to the appropriate destination and returning the response — the same role played by nginx or Envoy, but as a library you host inside your own ASP.NET Core process.

## What a reverse proxy does {#what-it-does}

A reverse proxy provides several benefits on top of a plain backend:

- **Routing** — directs requests to different backend servers based on predefined rules, such as URL patterns or request headers. `/images`, `/api`, and `/db` can each be routed to a different server.
- **Load balancing** — distributes incoming traffic across multiple backend servers to prevent overloading any one of them.
- **Scalability** — backend servers can be added or removed without impacting the client, since traffic is distributed by the proxy.
- **TLS termination** — offloads encryption and decryption from backend servers, reducing their workload.
- **Security** — internal service endpoints stay hidden from external exposure, reducing the attack surface.

## How a reverse proxy handles HTTP {#how-it-works}

Inbound connections are terminated at the proxy; new, pooled connections are used for outbound requests to destinations. Based on the configured routing rules, YARP determines which cluster should handle the request, forwards it — transforming the path and headers as necessary — and relays the backend's response back to the client.

:::example Quick example
Register the proxy and load routes and clusters straight from configuration.

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

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": { "Path": "{**catch-all}" }
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
:::

:::note
Configuration is reloaded automatically when the source changes — no restart required. See [Configuration filters](doc:config-filters) to modify config during the load sequence.
:::

## Why choose YARP over other proxies {#why-yarp}

YARP is built on ASP.NET Core, so it integrates directly with the .NET ecosystem and gives you a rich set of extensibility points — routing, load balancing, and transforms can all be customized in familiar C# rather than a proxy-specific config language. It's actively maintained by Microsoft, and both YARP and its documentation are open source.
