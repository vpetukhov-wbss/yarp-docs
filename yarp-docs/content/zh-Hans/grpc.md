---
slug: grpc
title: 代理 gRPC
lede: >-
  gRPC 是一种与语言无关的高性能远程过程调用 (RPC) 框架。它
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/grpc
lastUpdated: 2026-08-11
---

## 简介

gRPC 是一种与语言无关的高性能远程过程调用 (RPC) 框架。它构建在 HTTP/2 之上,可以通过 YARP 进行代理。虽然 YARP 不需要了解 gRPC 消息的内容,但你需要确保启用了正确的 HTTP 协议。gRPC 需要使用 HTTP/2,如果未正确配置 YARP 以发送和接收 HTTP/2 请求,gRPC 调用将会失败。

## 配置 YARP 的传入协议

在大多数场景下,gRPC 都需要使用 HTTP/2。ASP.NET Core 服务器(YARP 的前端)默认同时启用 HTTP/1.1 和 HTTP/2,但 HTTP/2 需要使用 https(TLS),因此 YARP 必须监听 https:// URL。

基于 http(非 TLS)的 HTTP/2 仅在 Kestrel 上受支持,且需要进行特定设置。有关更多信息,请参阅在 ASP.NET Core 中使用 gRPC 服务。

下面展示了如何配置 Kestrel,使其在 http(非 TLS)上使用 HTTP/2:

```json
   {
       "Kestrel": {
          "Endpoints": {
             "http": {
                 "Url": "http://localhost:5000",
                 "Protocols": "Http2"
             }
          }
       }
   }
```

## 配置 YARP 的传出协议

YARP 会自动为传出代理请求协商使用 HTTP/1.1 或 HTTP/2,但这仅适用于 https(TLS)。基于 http(非 TLS)的 HTTP/2 需要额外的设置。请注意,传出协议与传入协议是相互独立的。例如,传入

连接可以使用 https,而传出连接使用 http,这种方式称为 TLS 终止。有关配置

的详细信息,请参阅 YARP HTTP 客户端配置。

下面展示了如何配置传出代理请求以使用 HTTP/2:

```json
"cluster1": {
   "HttpRequest": {
      "Version": "2",
      "VersionPolicy": "RequestVersionExact"
   },
   "Destinations": {
      "cluster1/destination1": {
          "Address": "http://localhost:6000/"
      }
   }
},
```

## gRPC-Web

gRPC-Web 是 gRPC 的一种替代性线路格式,兼容 HTTP/1.1。

application/grpc——基于 HTTP/2 的 gRPC,是 gRPC 的典型使用方式。application/grpc-web——gRPC-Web 对 gRPC 协议进行了改造,使其兼容 HTTP/1.1。gRPC-Web 可以在更多场景中使用,浏览器应用以及未完全支持 HTTP/2 的网络都可以使用 gRPC-Web。但它不支持两项高级 gRPC 特性:客户端流式传输和双向流式传输。

在 YARP 的默认配置下,gRPC-Web 无需任何特殊处理即可被代理。

:::note
本文作者在 AI 的协助下创作本文。了解详情
:::
