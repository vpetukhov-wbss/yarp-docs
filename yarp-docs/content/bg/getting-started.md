---
slug: getting-started
title: Първи стъпки с YARP
lede: >-
  Добавете YARP към нов проект на ASP.NET Core и препращайте всяка заявка към единствен бекенд
  само с няколко реда код.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/getting-started
lastUpdated: 2025-02-10
---

## Предварителни изисквания

.NET SDK и бекенд сървър, към който да препращате заявки - за тестване е достатъчен всеки HTTP сървър, включително друго приложение на ASP.NET Core, работещо локално.

## Създаване на проекта

Създайте празен проект на ASP.NET Core и добавете пакета `Yarp.ReverseProxy`:

:::example Създаване и добавяне на пакета
От празна папка.

```dotnetcli
dotnet new web -o MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```
:::

## Конфигуриране на проксито

Регистрирайте обратното прокси и заредете конфигурацията му от `appsettings.json`:

:::example Program.cs
Регистрира проксито и добавя маршрутите му към приложението.

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
Вижте [Файлове с конфигурация](doc:config-files) за пълната форма на `appsettings.json` - маршрут и клъстер с поне една дестинация.
:::

## Стартиране

Стартирайте приложението с `dotnet run` и изпратете заявка до URL адреса на проксито - то я препраща към конфигурираната от вас дестинация и връща отговора обратно, непроменен.
