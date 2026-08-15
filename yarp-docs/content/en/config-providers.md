---
slug: config-providers
title: Configuration providers
lede: >-
  Load routes and clusters programmatically instead of from a file, by implementing
  IProxyConfigProvider yourself - useful for a database, a remote API, or any other source.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-providers
lastUpdated: 2025-02-10
---

## The provider interface {#the-provider-interface}

[Configuration files](doc:config-files) cover the common case of loading from `IConfiguration`. To load from anywhere else, implement `IProxyConfigProvider` and `IProxyConfig` yourself.

`IProxyConfigProvider` has a single method, `GetConfig()`, returning an `IProxyConfig` - a snapshot with the current routes and clusters, plus an `IChangeToken` the provider signals whenever that snapshot is out of date, which causes the proxy to call `GetConfig()` again.

## Loading routes and clusters directly {#in-memory}

For the simplest case - routes and clusters known entirely in code - `InMemoryConfigProvider` is a ready-made `IProxyConfigProvider`:

```csharp
services.AddReverseProxy().LoadFromMemory(routes, clusters);
```

To change that configuration later, resolve `InMemoryConfigProvider` from the service container and call `Update`:

```csharp
httpContext.RequestServices.GetRequiredService<InMemoryConfigProvider>()
    .Update(routes, clusters);
```

## Provider lifecycle {#lifecycle}

### Startup {#startup}

`IProxyConfigProvider` is registered as a singleton. At startup, the proxy resolves it and calls `GetConfig()` once; the provider can:

- throw, if it can't produce valid configuration - this prevents the application from starting;
- block synchronously until the configuration is loaded, which delays startup until valid route data is available; or
- return an empty `IProxyConfig` immediately and load in the background, signaling its `IChangeToken` once real data is ready.

Whatever configuration is returned is validated, and an invalid result throws an exception that prevents startup - a provider can pre-validate with `IConfigValidator` first and exclude invalid entries itself instead.

Route and cluster objects handed to the proxy should be treated as read-only once returned from `GetConfig()`.

### Reloading {#reloading}

If the `IChangeToken` supports active change callbacks, the proxy registers one after the initial load; otherwise `HasChanged` is polled every 5 minutes. To publish a new configuration, a provider should load it in the background - building new route/cluster instances, since they're immutable, though unchanged ones can be reused - optionally validate it, and only then signal the *previous* `IChangeToken`. The proxy calls `GetConfig()` again in response and diffs the result against the current configuration, updating only what changed; the swap is atomic and only affects new requests, not ones already in flight.

:::important
`IChangeToken`s are single-use. If `GetConfig()` throws during a reload, the proxy loses its ability to listen for further changes from that provider. Any other reload errors are logged and suppressed instead, and the proxy keeps using the last known good configuration.
:::

If several reloads are signaled in quick succession, the proxy may skip some and load whatever is available by the time it catches up - each `IProxyConfig` is a full snapshot, not a diff, so nothing is lost by skipping an intermediate one.

## Multiple providers {#multiple-providers}

More than one `IProxyConfigProvider` can be registered as a singleton; all of them are resolved and their configuration combined, the same way multiple [configuration file](doc:config-files) sections can be. A route from one provider can reference a cluster from another, but a single route or cluster can't be assembled from partial data spread across two providers.
