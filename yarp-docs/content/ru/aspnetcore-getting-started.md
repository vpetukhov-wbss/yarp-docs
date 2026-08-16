---
slug: aspnetcore-getting-started
title: Начало работы с ASP.NET Core
lede: >-
  В этом руководстве показано, как создать и запустить веб-приложение ASP.NET Core с помощью .NET CLI.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/getting-started/
lastUpdated: 2026-08-11
---

Руководство: начало работы с ASP.NET Core

В этом руководстве показано, как создать и запустить веб-приложение ASP.NET Core с помощью .NET CLI.

Учебные материалы по Blazor см. в разделе Учебные материалы по ASP.NET Core Blazor.

Вы узнаете, как: создать проект веб-приложения. Запустить приложение. Отредактировать страницу Razor.

В итоге у вас будет работающее веб-приложение, запущенное на вашем локальном компьютере.

## Предварительные требования

## .NET 8 SDK

## Создание проекта веб-приложения

Откройте командную оболочку и введите следующую команду:

.NET CLI dotnet new webapp --output aspnetcoreapp --no-https

Предыдущая команда создает новый проект веб-приложения в каталоге с именем aspnetcoreapp .

Проект не использует HTTPS.

## Запуск приложения

Выполните следующие команды:

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

## Редактирование страницы Razor

Измените главную страницу:

В командной оболочке нажмите Ctrl+C (Cmd+C в macOS), чтобы завершить работу программы.

Откройте файл Pages/Index.cshtml в текстовом редакторе.

Замените строку, начинающуюся с «Learn about», следующей выделенной разметкой и кодом:

## CSHTML

@page @model IndexModel @{

ViewData["Title"] = "Home page"; }

<div class="text-center"> <h1 class="display-4">Welcome</h1> <p>Hello, world! The time on the server is @DateTime.Now</p>

## </div>

Сохраните изменения. В командной оболочке снова выполните команду dotnet run. В браузере обновите страницу и убедитесь, что изменения отображаются.

## Дальнейшие действия

В этом руководстве вы узнали, как выполнить следующие действия:

Создать проект веб-приложения. Запустить проект. Внести изменение.

Чтобы узнать больше о ASP.NET Core, см. следующие материалы:

## Обзор ASP.NET Core
