---
slug: destination-resolvers
title: 目标解析器
lede: >-
  YARP 使用目标解析器来扩展已配置的目标地址集合。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/destination-resolvers
lastUpdated: 2026-08-11
---

## YARP 可扩展性：目标解析器

## 简介

YARP 使用目标解析器来扩展已配置的目标地址集合。目标解析器可以用作与服务发现系统集成的一个接入点。

## 结构

## IDestinationResolver 只有一个方法

ResolveDestinationsAsync(IReadOnlyDictionary<string, DestinationConfig> destinations, CancellationToken cancellationToken) 应返回一个 ResolvedDestinationCollection 实例。ResolvedDestinationCollection 包含一组 DestinationConfig 实例，以及一个 IChangeToken，用于在这些信息过期需要重新加载时通知代理，这会导致 ResolveDestinationsAsync 被再次调用。

## DestinationConfig

DestinationConfig 具有一个 Host 属性，可用于指定代理在与该目标通信时应使用的默认 Host 标头值。这样一来，IDestinationResolver 就可以将目标解析为一组 IP 地址，例如，而不会导致基于 SNI 或主机的路由失败。

## 生命周期

## 启动

IDestinationResolver 应作为单例注册到依赖关系注入容器中。启动时，代理会解析该实例，并使用从已解析的 IProxyConfigProviders 中获取的已配置目标来调用 ResolveDestinationsAsync(...)。在这次首次调用中，提供程序可以选择：

- 如果由于任何原因无法生成有效的代理配置，则抛出异常，从而阻止应用程序启动。
- 异步解析这些目标，这会导致应用程序在解析出的目标可用之前一直无法启动。

或者，提供程序也可以先返回一个空的 ResolvedDestinationCollection 实例，同时在后台解析目标。提供程序需要在配置可用时触发 IChangeToken。

## 原子性

提供给代理的目标对象和集合应为只读，一旦通过 GetConfig() 交给代理后，就不应再被修改。

## 重新加载

如果 IChangeToken 支持 ActiveChangeCallbacks，那么代理在处理完初始的目标集合后，会向该令牌注册一个回调。如果提供程序不支持回调，则 HasChanged 会与 IProxyConfig 的更改令牌一起，每 5 分钟被轮询一次。

当提供程序想要向代理提供一组新目标时，应执行以下操作：

- 在后台解析这些目标。由于 ResolvedDestinationCollection 是不可变的，因此任何新数据都必须创建新实例；对于未发生变化的目标，既可以重复使用其对象，也可以创建新实例。
- 使前一次 ResolveDestinationsAsync 调用返回的 IChangeToken 失效。

应用新目标之后，代理会向新的 IChangeToken 注册一个回调。请注意，如果在短时间内连续触发了多次重新加载，代理可能会跳过其中一部分，并在准备就绪后立即解析目标。

## DNS 目标解析器

YARP 内置了一个 IDestinationResolver 实现，它会通过 DNS 将每个主机名解析为一个或多个 IP 地址，并为每个解析出的 IP 创建一个目标，从而扩展已配置的目标集合。可以使用

IReverseProxyBuilder.AddDnsDestinationResolver(Action<DnsDestinationResolverOptions>)

方法将 DNS 目标解析器添加到反向代理中。该方法接受一个可选的委托，用于配置解析器的选项 DnsDestinationResolverOptions。

## 示例

```csharp
// Add the DNS destination resolver, restricting results to IPv4 addresses
reverseProxyBuilder.AddDnsDestinationResolver(o => o.AddressFamily =
AddressFamily.InterNetwork);
```

## 配置

DNS 目标解析器的选项 DnsDestinationResolverOptions 具有以下属性：

## RefreshPeriod

两次请求刷新已解析名称之间的时间间隔。默认值为 5 分钟。

## AddressFamily

可以选择性地指定一个 System.Net.Sockets.AddressFamily 值——AddressFamily.InterNetwork 或 AddressFamily.InterNetworkV6——以将解析结果分别限制为 IPv4 或 IPv6 地址。默认值 null 表示解析器不会限制结果的地址族，而是接受所有返回的地址。

:::note
本文作者在 AI 协助下创作了这篇文章。了解更多信息
:::
