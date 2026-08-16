---
slug: http-client-config
title: HTTP 客户端配置
lede: >-
  每个群集都拥有自己专属的 HTTP 客户端,用于与其目标通信——可以独立于任何其他群集,分别配置其连接、
  TLS 和按请求行为。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http-client-config
lastUpdated: 2025-02-10
---

## 每个群集一个客户端

每个群集都有自己的 `HttpMessageInvoker`,用于转发到其目标的每一个请求。启动时,每个群集都会获得一个新的实例;如果某个群集的配置之后发生变化,`IForwarderHttpClientFactory` 会决定是继续使用现有的客户端,还是需要创建一个新的——默认实现会在 `HttpClientConfig` 本身发生变化时创建一个新的客户端。

## HttpClient 设置

在群集的 `HttpClient` 下使用 `HttpClientConfig` 进行配置:

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

- **`SslProtocols`** — 该客户端接受的 TLS/SSL 协议版本。默认不设置任何值。
- **`MaxConnectionsPerServer`** — 到同一目标的最大并发 HTTP/1.1 连接数。默认值为 `int32.MaxValue`。
- **`DangerousAcceptAnyServerCertificate`** — 设为 `true` 会禁用对目标 TLS 证书的所有验证。默认值为 `false`;这个名称本身就是一个刻意的警告,而不是建议。
- **`RequestHeaderEncoding`** / **`ResponseHeaderEncoding`** — 通过 `SocketsHttpHandler` 的标头编码选择器,为发出请求/接收响应中的非 ASCII 标头值指定编码(例如 `"utf-8"`、`"iso-8859-1"`)。
- **`EnableMultipleHttp2Connections`** — 允许在到同一目标的现有 HTTP/2 连接达到其并发流上限之后,再开启额外的连接。默认值为 `true`。
- **`WebProxy`** — 将发往目标的出站请求通过上游 HTTP 代理进行路由:`Address` 为该代理的地址,`BypassOnLocal` 用于对本地地址跳过该代理,`UseDefaultCredentials` 用于使用应用自身的凭据向其进行身份验证。

:::important
如果你在此处设置了 ASCII 以外的标头编码,还需要告知托管 YARP 的服务器接受该编码。对于 Kestrel 而言,这意味着需要相应地设置 `KestrelServerOptions.RequestHeaderEncodingSelector`/`ResponseHeaderEncodingSelector`——否则 Kestrel 会拒绝这个设置本应允许通过的那些标头。

```csharp
builder.WebHost.ConfigureKestrel(kestrel =>
{
    kestrel.RequestHeaderEncodingSelector = _ => Encoding.Latin1;
    kestrel.ResponseHeaderEncodingSelector = _ => Encoding.Latin1;
});
```
:::

## HttpRequest 设置

在群集的 `HttpRequest` 下使用 `ForwarderRequestConfig` 进行配置——这些设置控制的是出站请求本身,而不是底层连接:

```json
"HttpRequest": {
  "ActivityTimeout": "00:01:40",
  "Version": "2",
  "VersionPolicy": "RequestVersionOrLower",
  "AllowResponseBuffering": "false"
}
```

- **`ActivityTimeout`** — 请求在被取消之前,各操作之间可以空闲多长时间。默认值为 100 秒;每当响应标头到达,或读写请求/响应/流式数据(gRPC、WebSocket)时都会重置。TCP 保持连接和 HTTP/2 ping 不会重置它;WebSocket ping 会重置它。
- **`Version`** — 出站 HTTP 版本:`1.0`、`1.1`、`2` 或 `3`。默认值为 `2`。
- **`VersionPolicy`** — 最终版本的选取方式:`RequestVersionOrLower`(默认)、`RequestVersionOrHigher` 或 `RequestVersionExact`。
- **`AllowResponseBuffering`** — 如果宿主支持,则允许在将响应发送回客户端时进行写入缓冲。启用后会破坏服务器发送事件的正常工作。

:::example 两个具有不同 HTTP 设置的群集
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

## 在代码中配置

当直接在代码中构建群集,而不是从 `IConfiguration` 构建时,同样的设置也适用——在将群集传递给 `LoadFromMemory` 之前,将一个 `HttpClientConfig` 赋值给 `ClusterConfig.HttpClient`:

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

对于架构未涵盖的内容,`ConfigureHttpClient` 直接公开底层的 `SocketsHttpHandler`——它会在群集自身的设置应用完毕后,于每次添加或更改群集时运行:

```csharp
services.AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.ClientCertificates.Add(clientCert);
    });
```

## 完全替换客户端工厂

如需完全掌控,可以用自定义实现替换 `IForwarderHttpClientFactory`——从默认的 `ForwarderHttpClientFactory` 派生即可覆盖大多数场景。为避免破坏代理行为或增加不必要的开销,自定义工厂仍应设置与默认实现相同的 `SocketsHttpHandler` 属性:`UseProxy = false`、`AllowAutoRedirect = false`、`AutomaticDecompression = DecompressionMethods.None`、`UseCookies = false`。

:::important
始终返回 `HttpMessageInvoker`,而不是 `HttpClient`——`HttpClient` 默认会缓冲响应,这会破坏流式传输,并带来纯代理转发本不需要的延迟和内存开销。
:::
