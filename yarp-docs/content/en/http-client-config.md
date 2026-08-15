---
slug: http-client-config
title: HTTP client configuration
lede: >-
  Each cluster gets its own HTTP client for talking to its destinations - configure its
  connection, TLS, and per-request behavior independently of any other cluster.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http-client-config
lastUpdated: 2025-02-10
---

## One client per cluster {#one-client-per-cluster}

Every cluster has its own `HttpMessageInvoker`, used for every request forwarded to its destinations. On startup, every cluster gets a new one; if a cluster's configuration later changes, `IForwarderHttpClientFactory` decides whether the existing client can keep being used or a new one is needed - the default implementation creates a new one whenever `HttpClientConfig` itself has changed.

## HttpClient settings {#httpclient-settings}

Configured under `HttpClient` on a cluster, using `HttpClientConfig`:

```json
"HttpClient": {
  "SslProtocols": ["Tls12", "Tls13"],
  "MaxConnectionsPerServer": "10",
  "DangerousAcceptAnyServerCertificate": "false",
  "RequestHeaderEncoding": "utf-8",
  "ResponseHeaderEncoding": "utf-8",
  "EnableMultipleHttp2Connections": "true",
  "WebProxy": {
    "Address": "http://myproxy:8080",
    "BypassOnLocal": "true",
    "UseDefaultCredentials": "false"
  }
}
```

- **`SslProtocols`** — which TLS/SSL protocol versions this client accepts. No value is set by default.
- **`MaxConnectionsPerServer`** — maximum concurrent HTTP/1.1 connections to the same destination. Defaults to `int32.MaxValue`.
- **`DangerousAcceptAnyServerCertificate`** — `true` disables all validation of the destination's TLS certificate. Defaults to `false`; the name is a deliberate warning, not a suggestion.
- **`RequestHeaderEncoding`** / **`ResponseHeaderEncoding`** — encoding (e.g. `"utf-8"`, `"iso-8859-1"`) used for non-ASCII header values on outgoing requests / incoming responses, via `SocketsHttpHandler`'s header encoding selectors.
- **`EnableMultipleHttp2Connections`** — allow opening additional HTTP/2 connections to the same destination once the existing ones hit their concurrent-stream limit. Defaults to `true`.
- **`WebProxy`** — route outbound requests to destinations through an upstream HTTP proxy: `Address` of the proxy, `BypassOnLocal` to skip it for local addresses, `UseDefaultCredentials` to authenticate to it with the app's own credentials.

:::important
If you set a header encoding other than ASCII here, the server hosting YARP also needs to be told to accept it. For Kestrel, that means setting `KestrelServerOptions.RequestHeaderEncodingSelector`/`ResponseHeaderEncodingSelector` to match - otherwise Kestrel rejects the very headers this setting was meant to allow.

```csharp
builder.WebHost.ConfigureKestrel(kestrel =>
{
    kestrel.RequestHeaderEncodingSelector = _ => Encoding.Latin1;
    kestrel.ResponseHeaderEncodingSelector = _ => Encoding.Latin1;
});
```
:::

## HttpRequest settings {#httprequest-settings}

Configured under `HttpRequest` on a cluster, using `ForwarderRequestConfig` - these govern the outgoing request itself, not the underlying connection:

```json
"HttpRequest": {
  "ActivityTimeout": "00:01:40",
  "Version": "2",
  "VersionPolicy": "RequestVersionOrLower",
  "AllowResponseBuffering": "false"
}
```

- **`ActivityTimeout`** — how long a request can sit idle between operations before it's canceled. Defaults to 100 seconds; resets whenever response headers arrive or request/response/streaming data (gRPC, WebSockets) is read or written. TCP keep-alives and HTTP/2 pings don't reset it; WebSocket pings do.
- **`Version`** — the outgoing HTTP version: `1.0`, `1.1`, `2`, or `3`. Defaults to `2`.
- **`VersionPolicy`** — how the final version gets picked: `RequestVersionOrLower` (default), `RequestVersionOrHigher`, or `RequestVersionExact`.
- **`AllowResponseBuffering`** — allow write-buffering when sending the response back to the client, if the host supports it. Breaks server-sent events if enabled.

:::example Two clusters with different HTTP settings
```json
{
  "Clusters": {
    "cluster1": {
      "LoadBalancingPolicy": "Random",
      "HttpClient": { "SslProtocols": ["Tls12"], "MaxConnectionsPerServer": "10" },
      "HttpRequest": { "ActivityTimeout": "00:00:30" },
      "Destinations": {
        "cluster1/destination1": { "Address": "https://localhost:10000/" }
      }
    },
    "cluster2": {
      "HttpClient": { "SslProtocols": ["Tls12"] },
      "HttpRequest": { "Version": "1.1", "VersionPolicy": "RequestVersionExact" },
      "Destinations": {
        "cluster2/destination1": { "Address": "https://localhost:10001/" }
      }
    }
  }
}
```
:::

## Configuring in code {#code-configuration}

The same settings apply when building clusters directly rather than from `IConfiguration` - assign an `HttpClientConfig` to `ClusterConfig.HttpClient` before passing the cluster to `LoadFromMemory`:

```csharp
var clusters = new[]
{
    new ClusterConfig
    {
        ClusterId = "cluster1",
        Destinations = { { "destination1", new DestinationConfig { Address = "https://localhost:10000" } } },
        HttpClient = new HttpClientConfig
        {
            MaxConnectionsPerServer = 10,
            SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13,
        },
    },
};

services.AddReverseProxy().LoadFromMemory(routes, clusters);
```

For anything the schema doesn't cover, `ConfigureHttpClient` exposes the underlying `SocketsHttpHandler` directly - it runs every time a cluster is added or changed, after the cluster's own settings have already been applied:

```csharp
services.AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.ClientCertificates.Add(clientCert);
    });
```

## Replacing the client factory entirely {#custom-factory}

For full control, replace `IForwarderHttpClientFactory` with a custom implementation - deriving from the default `ForwarderHttpClientFactory` covers most cases. A custom factory should still set the same `SocketsHttpHandler` properties the default one does, to avoid breaking proxy behavior or adding unnecessary overhead: `UseProxy = false`, `AllowAutoRedirect = false`, `AutomaticDecompression = DecompressionMethods.None`, `UseCookies = false`.

:::important
Always return an `HttpMessageInvoker`, not an `HttpClient` - `HttpClient` buffers responses by default, which breaks streaming and adds latency and memory overhead that plain proxying doesn't need.
:::
