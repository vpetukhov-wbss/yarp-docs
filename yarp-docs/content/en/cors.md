---
slug: cors
title: Cross-origin requests (CORS)
lede: >-
  The reverse proxy can handle cross-origin requests before they are proxied to the destination
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/cors
lastUpdated: 2026-08-11
---

## Introduction {#introduction}

The reverse proxy can handle cross-origin requests before they are proxied to the destination servers. This can reduce load on the destination servers and ensure consistent policies are implemented across your applications.

## Defaults {#defaults}

The requests won't be automatically matched for cors preflight requests unless enabled in the route or application configuration.

## Configuration {#configuration}

CORS policies can be specified per route via RouteConfig.CorsPolicy and can be bound from the Routes sections of the config file. As with other route properties, this can be modified and reloaded without restarting the proxy. Policy names are case insensitive.

Example:

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "CorsPolicy": "customPolicy",
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
CORS policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides the
above configuration to specify a policy per route and the rest is handled by existing ASP.NET
Core CORS Middleware.
CORS policies can be configured in the application as follows:
   services.AddCors(options =>
   {
          options.AddPolicy("customPolicy", builder =>
          {
                 builder.AllowAnyOrigin();
          });
   });
Then add the CORS middleware.
   app.UseCors();
   app.MapReverseProxy();
```

## DefaultPolicy {#defaultpolicy}

Specifying the value default in a route's CorsPolicy parameter means that route will use the policy defined in CorsOptions.DefaultPolicy.

## Disable CORS {#disable-cors}

Specifying the value disable in a route's CorsPolicy parameter means the CORS middleware will refuse the CORS requests.

:::note
The author created this article with assistance from AI. Learn more
:::
