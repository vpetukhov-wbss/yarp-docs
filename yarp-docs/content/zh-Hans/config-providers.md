---
slug: config-providers
title: 配置提供程序
lede: >-
  通过自行实现 IProxyConfigProvider,以编程方式加载路由和群集,而不是从文件中加载——适用于数据库、
  远程 API 或任何其他来源。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-providers
lastUpdated: 2025-02-10
---

## 提供程序接口

[配置文件](doc:config-files)涵盖了从 `IConfiguration` 加载配置这一常见场景。要从其他任何位置加载配置,需要自行实现 `IProxyConfigProvider` 和 `IProxyConfig`。

`IProxyConfigProvider` 只有一个方法 `GetConfig()`,返回一个 `IProxyConfig`——它是当前路由和群集的一份快照,并附带一个 `IChangeToken`;每当该快照过期时,提供程序就会通过它发出信号,促使代理再次调用 `GetConfig()`。

## 直接加载路由和群集

对于最简单的情形——路由和群集完全在代码中已知——`InMemoryConfigProvider` 是一个现成的 `IProxyConfigProvider`:

```csharp
services.AddReverseProxy().LoadFromMemory(routes, clusters);
```

要在之后更改该配置,可以从服务容器中解析出 `InMemoryConfigProvider`,然后调用 `Update`:

```csharp
httpContext.RequestServices.GetRequiredService<InMemoryConfigProvider>()
    .Update(routes, clusters);
```

## 提供程序生命周期

### 启动

`IProxyConfigProvider` 以单例形式注册。启动时,代理会解析该提供程序并调用一次 `GetConfig()`;此时提供程序可以:

- 如果无法生成有效配置,则抛出异常——这会阻止应用程序启动;
- 同步阻塞,直到配置加载完成,从而将启动过程延迟到有效的路由数据可用为止;或者
- 立即返回一个空的 `IProxyConfig` 并在后台加载,待真实数据准备就绪后再通过其 `IChangeToken` 发出信号。

无论返回什么配置,都会对其进行验证,无效的结果会抛出异常并阻止启动——提供程序也可以先使用 `IConfigValidator` 进行预先验证,并自行排除无效的条目。

一旦从 `GetConfig()` 返回,交给代理的路由和群集对象就应被视为只读。

### 重新加载

如果 `IChangeToken` 支持主动更改回调,代理会在首次加载后注册一个回调;否则会每 5 分钟轮询一次 `HasChanged`。要发布新配置,提供程序应在后台加载它——由于路由/群集对象是不可变的,需要构建新的实例,但未发生变化的实例可以复用——可选地对其进行验证,然后才对*先前的* `IChangeToken` 发出信号。代理会随之再次调用 `GetConfig()`,并将结果与当前配置进行比对,只更新发生变化的部分;这种切换是原子性的,只影响新请求,不会影响已经在处理中的请求。

:::important
`IChangeToken` 是一次性的。如果 `GetConfig()` 在重新加载期间抛出异常,代理将失去监听该提供程序后续更改的能力。其他重新加载错误则会被记录并抑制,代理会继续使用最后一次已知的有效配置。
:::

如果短时间内连续发出多次重新加载信号,代理可能会跳过其中一些,并在赶上进度时加载当时可用的内容——由于每个 `IProxyConfig` 都是完整的快照而非差异,因此跳过某个中间状态不会丢失任何信息。

## 多个提供程序

可以将多个 `IProxyConfigProvider` 注册为单例;它们都会被解析,并将各自的配置合并在一起,这与多个[配置文件](doc:config-files)节的合并方式相同。来自一个提供程序的路由可以引用来自另一个提供程序的群集,但单个路由或群集不能由分散在两个提供程序中的部分数据组装而成。
