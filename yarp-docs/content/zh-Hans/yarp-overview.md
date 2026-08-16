---
slug: yarp-overview
title: YARP 概述
lede: >-
  YARP(Yet Another Reverse Proxy)是一个专为 .NET 打造的高度可定制反向代理库——旨在实现稳健、灵活、
  可扩展、安全,并且易于部署在你现有的服务前面。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/yarp-overview
lastUpdated: 2025-02-21
---

## 简介

YARP 可以帮助开发者构建强大高效、且针对自身需求量身定制的反向代理解决方案。它位于客户端设备和后端服务器之间,将客户端请求转发到相应的目标并返回响应——这与 nginx 或 Envoy 所扮演的角色相同,只是 YARP 是一个托管在你自己的 ASP.NET Core 进程内的库。

## 反向代理的作用

反向代理在普通后端基础之上提供了多项优势:

- **路由** — 根据预定义的规则(例如 URL 模式或请求标头)将请求定向到不同的后端服务器。`/images`、`/api` 和 `/db` 可以分别路由到不同的服务器。
- **负载均衡** — 将传入流量分配到多个后端服务器,防止其中任何一个过载。
- **可扩展性** — 由于流量由代理进行分配,后端服务器可以在不影响客户端的情况下添加或移除。
- **TLS 终止** — 将加密和解密工作从后端服务器上卸载,减轻其负担。
- **安全性** — 内部服务终结点不会暴露给外部,从而减少攻击面。

## 反向代理如何处理 HTTP

入站连接在代理处终止;出站请求会使用新建的、经过池化的连接发送到各个目标。YARP 会根据配置的路由规则确定应由哪个群集处理该请求,并在必要时转换路径和标头后转发该请求,再将后端的响应中继回客户端。

:::example 快速示例
注册代理,并直接从配置中加载路由和群集。

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
当配置源发生变化时,配置会自动重新加载——无需重启。有关在加载过程中修改配置的方法,请参阅[配置筛选器](doc:config-filters)。
:::

## 为什么选择 YARP 而非其他代理

YARP 构建于 ASP.NET Core 之上,因此可以直接与 .NET 生态系统集成,并为你提供丰富的可扩展点——路由、负载均衡和转换均可使用你熟悉的 C# 进行自定义,而不必依赖某种专用的代理配置语言。YARP 由 Microsoft 积极维护,并且 YARP 本身及其文档都是开源的。
