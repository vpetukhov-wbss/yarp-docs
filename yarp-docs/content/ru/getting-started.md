---
slug: getting-started
title: Начало работы с YARP
lede: >-
  Добавьте YARP в новый проект ASP.NET Core и перенаправляйте каждый запрос на единственный бэкенд
  всего в нескольких строках кода.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/getting-started
lastUpdated: 2025-02-10
---

## Предварительные требования

.NET SDK и сервер бэкенда, на который будут перенаправляться запросы — для тестирования подойдёт любой HTTP-сервер, включая ещё одно локально запущенное приложение ASP.NET Core.

## Создание проекта

Создайте пустой проект ASP.NET Core и добавьте пакет `Yarp.ReverseProxy`:

:::example Создание проекта и добавление пакета
Из пустой папки.

```dotnetcli
dotnet new web -o MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```
:::

## Настройка прокси-сервера

Зарегистрируйте прокси-сервер и загрузите его конфигурацию из `appsettings.json`:

:::example Program.cs
Регистрирует прокси-сервер и сопоставляет его маршруты.

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
Полную структуру `appsettings.json` — маршрут и кластер как минимум с одним узлом назначения — см. в разделе [Файлы конфигурации](doc:config-files).
:::

## Запуск

Запустите приложение командой `dotnet run` и отправьте запрос на URL-адрес прокси-сервера — он перенаправит его на настроенный узел назначения и передаст ответ обратно без изменений.
