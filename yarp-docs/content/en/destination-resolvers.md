---
slug: destination-resolvers
title: Destination resolvers
lede: >-
  YARP uses a destination resolver to expand the set of configured destination addresses. The
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/destination-resolvers
lastUpdated: 2026-08-11
---

## YARP Extensibility Destination Resolvers {#yarp-extensibility-destination-resolvers}

## Introduction {#introduction}

YARP uses a destination resolver to expand the set of configured destination addresses. The destination resolver can be used as an integration point with service discovery systems.

## Structure {#structure}

## IDestinationResolver has a single method {#idestinationresolver-has-a-single-method}

ResolveDestinationsAsync(IReadOnlyDictionary<string, DestinationConfig> destinations,

CancellationToken cancellationToken) which should return a ResolvedDestinationCollection instance. The ResolvedDestinationCollection has a collection of DestinationConfig instances, as well as an IChangeToken to notify the proxy when this information is out of date and should be reloaded, which will cause ResolveDestinationsAsync to be called again.

## DestinationConfig {#destinationconfig}

DestinationConfig has a Host property which can be used to specify the default Host header value which the proxy should use when communicating with that destination. This allows the IDestinationResolver to resolve destinations to a collection of IP addresses, for example, without causing SNI or host-based routing to fail.

## Lifecycle {#lifecycle}

## Startup {#startup}

The IDestinationResolver should be registered in the DI container as a singleton. At startup, the proxy will resolve this instance and call ResolveDestinationsAsync(...) with the configured destinations retrieved from the resolved IProxyConfigProviders . On this first call the provider may choose to:

Throw an exception if the provider cannot produce a valid proxy configuration for any reason. This will prevent the application from starting. Asynchronously resolve the destinations. This will stop the application from starting until resolved destinations are available.

Or, it may choose to return an empty ResolvedDestinationCollection instance while it

resolves destinations in the background. The provider will need to trigger the

IChangeToken when the configuration is available.

## Atomicity {#atomicity}

The destinations objects and collections supplied to the proxy should be read-only and not modified once they have been handed to the proxy via GetConfig() .

## Reload {#reload}

If the IChangeToken supports ActiveChangeCallbacks , once the proxy has processed the initial set of destinations it will register a callback with this token. If the provider does not support callbacks then HasChanged will be polled alongside IProxyConfig change tokens, every 5 minutes.

When the provider wants to provide a new set of destinations to the proxy it should:

Resolve those destinations in the background. ResolvedDestinationCollection is immutable, so new instances have to be created for any new data. Objects for unchanged destinations can be re-used, or new instances can be created.

Invalidate the IChangeToken returned from the previous ResolveDestinationsAsync invocation.

Once the new destinations have been applied, the proxy will register a callback with the new IChangeToken . Note if there are multiple reloads signaled in close succession, the proxy may skip some and resolve destinations as soon as it's ready.

## DNS Destination Resolver {#dns-destination-resolver}

YARP includes an IDestinationResolver implementation which expands the set of configured destinations by resolving each host name to one or more IP addresses using DNS, creating a destination for each resolved IP. The DNS destination resolver can be added to your reverse proxy using the

IReverseProxyBuilder.AddDnsDestinationResolver(Action<DnsDestinationResolverOptions>)

method. The method accepts an optional delegate to configure the resolver's options, DnsDestinationResolverOptions.

## Example {#example}

```csharp
// Add the DNS destination resolver, restricting results to IPv4 addresses
reverseProxyBuilder.AddDnsDestinationResolver(o => o.AddressFamily =
AddressFamily.InterNetwork);
```

## Configuration {#configuration}

The DNS destination resolver's options, DnsDestinationResolverOptions, has the following properties:

## RefreshPeriod {#refreshperiod}

The period between requesting a refresh of a resolved name. This defaults to 5 minutes.

## AddressFamily {#addressfamily}

Optionally, specify an System.Net.Sockets.AddressFamily value of AddressFamily.InterNetwork or AddressFamily.InterNetworkV6 to restrict resolved resolution to IPv4 or IPv6 addresses, respectively. The default value, null , instructs the resolver to not restrict the address family of the results and to use accept all returned addresses.

:::note
The author created this article with assistance from AI. Learn more
:::
