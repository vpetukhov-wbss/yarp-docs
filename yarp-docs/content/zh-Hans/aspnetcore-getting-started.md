---
slug: aspnetcore-getting-started
title: ASP.NET Core 入门
lede: >-
  本教程演示如何使用 .NET CLI 创建并运行 ASP.NET Core Web 应用。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/getting-started/
lastUpdated: 2026-08-11
---

教程：ASP.NET Core 入门

本教程演示如何使用 .NET CLI 创建并运行 ASP.NET Core Web 应用。

有关 Blazor 教程，请参阅 ASP.NET Core Blazor 教程。

您将学习如何：创建 Web 应用项目、运行该应用、编辑 Razor 页面。

完成本教程后，您将拥有一个可以在本地计算机上运行的 Web 应用。

## 先决条件

## .NET 8 SDK

## 创建 Web 应用项目

打开命令行窗口，输入以下命令：

.NET CLI dotnet new webapp --output aspnetcoreapp --no-https

上述命令会在名为 aspnetcoreapp 的目录中创建一个新的 Web 应用项目。

该项目不使用 HTTPS。

## 运行应用

运行以下命令：

```dotnetcli
   cd aspnetcoreapp
   dotnet run
The run command produces output like the following example:
```

```output
   Building...
   info: Microsoft.Hosting.Lifetime[14]
             Now listening on: http://localhost:5109
   info: Microsoft.Hosting.Lifetime[0]
             Application started. Press Ctrl+C to shut down.
   info: Microsoft.Hosting.Lifetime[0]
             Hosting environment: Development
   info: Microsoft.Hosting.Lifetime[0]
             Content root path: C:\aspnetcoreapp
Open a browser and go to the URL shown in the output. In this example, the URL is
http://localhost:5109 .
The browser shows the home page.
```

## 编辑 Razor 页面

更改主页：

在命令行窗口中按 Ctrl+C（在 macOS 上为 Cmd+C）退出程序。

使用文本编辑器打开 Pages/Index.cshtml。

将以 "Learn about" 开头的那一行替换为以下突出显示的标记和代码：

## CSHTML

@page @model IndexModel @{

ViewData["Title"] = "Home page"; }

<div class="text-center"> <h1 class="display-4">Welcome</h1> <p>Hello, world! The time on the server is @DateTime.Now</p>

## </div>

保存所做的更改。在命令行窗口中再次运行 dotnet run 命令。在浏览器中刷新页面，确认更改已生效。

## 后续步骤

在本教程中，您学习了如何：

创建 Web 应用项目、运行该项目、进行更改。

要了解有关 ASP.NET Core 的更多信息，请参阅下列内容：

## ASP.NET Core 概述
