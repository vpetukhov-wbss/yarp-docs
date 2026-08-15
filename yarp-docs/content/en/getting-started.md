---
slug: getting-started
title: Getting started with YARP
lede: >-
  Add YARP to a new ASP.NET Core project and forward every request to a single backend in a few
  lines of code.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/getting-started
lastUpdated: 2025-02-10
---

## Prerequisites {#prerequisites}

The .NET SDK, and a backend server to forward requests to - any HTTP server will do for testing, including another ASP.NET Core app running locally.

## Create the project {#create-the-project}

Create an empty ASP.NET Core project and add the `Yarp.ReverseProxy` package:

:::example Create and add the package
From an empty folder.

```dotnetcli
dotnet new web -o MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```
:::

## Configure the proxy {#configure-the-proxy}

Register the reverse proxy and load its configuration from `appsettings.json`:

:::example Program.cs
Registers the proxy and maps its routes.

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
See [Configuration files](doc:config-files) for the full `appsettings.json` shape - a route and a cluster with at least one destination.
:::

## Run it {#run-it}

Start the app with `dotnet run` and send a request to the proxy's URL - it forwards to your configured destination and relays the response back, unchanged.
