---
slug: config-filters
title: Configuration filters
lede: >-
  Modify routes and clusters right after they're loaded and before they're validated - fill in
  values from the environment, apply defaults, or enforce policies across every entry.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-filters
lastUpdated: 2025-02-10
---

## What filters are for {#what-filters-are-for}

Configuration loaded from files or [a custom provider](doc:config-providers) is raw input - a filter gets a chance to change it before it's validated and applied. Typical uses:

- Filling in fields from the deployment environment (a destination address that's only known at runtime).
- Applying organization-wide defaults or enforcing policies across every route or cluster.
- Substituting placeholder values.
- Normalizing or correcting minor configuration mistakes before they become hard failures.

## Registering a filter {#registering-a-filter}

Filters are registered in dependency injection with `AddConfigFilter`. Any number can be added; they run in the order they were registered.

```csharp
services.AddReverseProxy()
    .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
    .AddConfigFilter<CustomConfigFilter>();
```

## Writing a filter {#writing-a-filter}

A filter implements `IProxyConfigFilter`, with one method per config type - `ConfigureRouteAsync` and `ConfigureClusterAsync`. Because filters are resolved from DI, they can take constructor dependencies like any other registered service. Each method runs once per route or cluster, every time configuration is loaded or reloaded, and returns either the original instance unchanged or a modified copy - C# 9 records' `with` expression is a convenient way to produce that copy without touching the rest of the object.

:::example Substitute destination addresses from environment variables
Looks for `{{key}}` placeholders in a cluster's destination addresses and replaces each one with the value of an environment variable named `key`, throwing if it isn't set. Also raises any route's `Order` to at least `1`, so code-registered routes (which default to `0`) always take priority over ones loaded from config.

```csharp
using System.Text.RegularExpressions;
using Yarp.ReverseProxy.Configuration;

public class CustomConfigFilter : IProxyConfigFilter
{
    private readonly Regex _exp = new("\\{\\{(\\w+)\\}\\}");

    public ValueTask<ClusterConfig> ConfigureClusterAsync(ClusterConfig cluster, CancellationToken cancel)
    {
        var newDestinations = new Dictionary<string, DestinationConfig>(StringComparer.OrdinalIgnoreCase);
        foreach (var d in cluster.Destinations)
        {
            var match = _exp.Match(d.Value.Address);
            if (!match.Success)
            {
                newDestinations.Add(d.Key, d.Value);
                continue;
            }
            var name = match.Groups[1].Value;
            var value = Environment.GetEnvironmentVariable(name)
                ?? throw new ArgumentException($"Substitution for '{name}' in cluster '{d.Key}' was not found.");
            newDestinations.Add(d.Key, d.Value with { Address = value });
        }
        return new ValueTask<ClusterConfig>(cluster with { Destinations = newDestinations });
    }

    public ValueTask<RouteConfig> ConfigureRouteAsync(RouteConfig route, ClusterConfig cluster, CancellationToken cancel)
    {
        if (route.Order is < 1)
        {
            return new ValueTask<RouteConfig>(route with { Order = 1 });
        }
        return new ValueTask<RouteConfig>(route);
    }
}
```
:::
