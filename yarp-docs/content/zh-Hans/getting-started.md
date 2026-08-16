---
slug: getting-started
title: YARP 入门
lede: >-
  只需几行代码,即可将 YARP 添加到新的 ASP.NET Core 项目中,并将所有请求转发到单个后端。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/getting-started
lastUpdated: 2025-02-10
---

## 先决条件

.NET SDK,以及一个用于接收转发请求的后端服务器——用于测试时,任何 HTTP 服务器都可以,包括本地运行的另一个 ASP.NET Core 应用。

## 创建项目

创建一个空的 ASP.NET Core 项目,并添加 `Yarp.ReverseProxy` 包:

:::example 创建并添加包
从一个空文件夹开始。

```dotnetcli
dotnet new web -o MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```
:::

## 配置代理

注册反向代理,并从 `appsettings.json` 加载其配置:

:::example Program.cs
注册代理并映射其路由。

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```
:::

:::note
有关完整的 `appsettings.json` 结构——包含一个路由和一个至少含有一个目标的群集,请参阅[配置文件](doc:config-files)。
:::

## 运行

使用 `dotnet run` 启动应用,然后向代理的 URL 发送请求——它会将请求转发到你配置的目标,并原样将响应中继回来。
