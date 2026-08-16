---
slug: rate-limiting
title: Rate limiting
lede: >-
  The reverse proxy can be used to rate-limit requests before they are proxied to the destination
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/rate-limiting
lastUpdated: 2026-08-11
---

## Introduction {#introduction}

The reverse proxy can be used to rate-limit requests before they are proxied to the destination servers. This can reduce load on the destination servers, add a layer of protection, and ensure consistent policies are implemented across your applications.

This feature is only available when using .NET 7 or later

## Defaults {#defaults}

No rate limiting is performed on requests unless enabled in the route or application configuration. However, the Rate Limiting middleware ( app.UseRateLimiter() ) can apply a default limiter applied to all routes, and this doesn't require any opt-in from the config. Example:

```csharp
   services.AddRateLimiter(options => options.GlobalLimiter = globalLimiter);
```

## Configuration {#configuration}

Rate Limiter policies can be specified per route via RouteConfig.RateLimiterPolicy and can be bound from the Routes sections of the config file. As with other route properties, this can be modified and reloaded without restarting the proxy. Policy names are case insensitive.

Example:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "RateLimiterPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                         "cluster1/destination1": {
                            "Address": "https://localhost:10001/"
                         }
                      }
                   }
      }
   }
}
RateLimiter policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core rate limiting middleware.
RateLimiter policies can be configured in services as follows:
```

```csharp
   services.AddRateLimiter(options =>
   {
          options.AddFixedWindowLimiter("customPolicy", opt =>
          {
                 opt.PermitLimit = 4;
                 opt.Window = TimeSpan.FromSeconds(12);
                 opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                 opt.QueueLimit = 2;
          });
   });
Then add the RateLimiter middleware.
    C#
   app.UseRateLimiter();
   app.MapReverseProxy();
See the Rate Limiting docs for setting up your preferred kind of rate limiting.
```

## Disable Rate Limiting {#disable-rate-limiting}

Specifying the value disable in a route's RateLimiterPolicy parameter means the rate limiter middleware will not apply any policies to this route, even the default policy.

:::note
The author created this article with assistance from AI. Learn more
:::
