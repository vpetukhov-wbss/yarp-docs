---
slug: load-balancing
title: Load balancing
lede: >-
  When a cluster has more than one healthy destination, YARP picks which one handles each
  request using a configurable load balancing policy.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/load-balancing
lastUpdated: 2025-01-15
---

## Policies {#policies}

YARP ships with several built-in load balancing policies:

- **Round robin** — cycles through the destination list in order, giving each an equal share of traffic.
- **Least requests** — sends each request to whichever destination currently has the fewest in-flight requests.
- **Random** — picks a destination at random.
- **Power of two choices** — samples two random destinations and picks whichever has fewer in-flight requests, a good default at scale since it avoids the herd effect random selection alone can cause.
- **First** — always the first available destination; mainly useful for testing and A/B scenarios.

:::example Set a cluster's policy
The `LoadBalancingPolicy` field on a cluster.

```json
{
  "Clusters": {
    "cluster1": {
      "LoadBalancingPolicy": "PowerOfTwoChoices",
      "Destinations": {
        "cluster1/destination1": { "Address": "https://localhost:10000/" },
        "cluster1/destination2": { "Address": "https://localhost:10010/" }
      }
    }
  }
}
```
:::

## Configuration {#configuration}

The default policy is **Power of two choices** when none is specified. Only destinations known to be healthy are considered - see [Destination health checks](doc:dests-health-checks) for how a destination is marked unhealthy and excluded from rotation.

:::note
Load balancing distributes requests across destinations; it does not pin a given client to the same destination across requests. If that's what you need, see [Session affinity](doc:session-affinity) instead.
:::

## Custom policies {#custom-policies}

Implement `ILoadBalancingPolicy` and register it in DI to plug in custom selection logic - the same extensibility point YARP's own built-in policies are built on.
