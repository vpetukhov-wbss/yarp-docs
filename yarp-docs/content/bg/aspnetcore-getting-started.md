---
slug: aspnetcore-getting-started
title: Първи стъпки с ASP.NET Core
lede: >-
  Това ръководство показва как да създадете и стартирате уеб приложение с ASP.NET Core,
  използвайки .NET CLI.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/getting-started/
lastUpdated: 2026-08-11
---

Урок: Първи стъпки с ASP.NET Core

Това ръководство показва как да създадете и стартирате уеб приложение с ASP.NET Core, използвайки .NET CLI.

За ръководства за Blazor вижте ASP.NET Core Blazor tutorials.

Ще научите как да: Създадете проект за уеб приложение. Стартирате приложението. Редактирате Razor страница.

Накрая ще разполагате с работещо уеб приложение, стартирано на локалната ви машина.

## Предварителни изисквания

## .NET 8 SDK

## Създаване на проект за уеб приложение

Отворете команден ред и въведете следната команда:

.NET CLI dotnet new webapp --output aspnetcoreapp --no-https

Предходната команда създава нов проект за уеб приложение в директория с име aspnetcoreapp .

Проектът не използва HTTPS.

## Стартиране на приложението

Изпълнете следните команди:

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

## Редактиране на Razor страница

Променете началната страница:

В командния ред натиснете Ctrl+C (Cmd+C в macOS), за да излезете от програмата.

Отворете Pages/Index.cshtml в текстов редактор.

Заменете реда, който започва с „Learn about“, със следната маркирана разметка и код:

## CSHTML

@page @model IndexModel @{

ViewData["Title"] = "Home page"; }

<div class="text-center"> <h1 class="display-4">Welcome</h1> <p>Hello, world! The time on the server is @DateTime.Now</p>

## </div>

Запазете промените. В командния ред изпълнете отново командата dotnet run. В браузъра презаредете страницата и проверете дали промените се показват.

## Следващи стъпки

В това ръководство научихте как да:

Създадете проект за уеб приложение. Стартирате проекта. Направите промяна.

За да научите повече за ASP.NET Core, вижте следното:

## Общ преглед на ASP.NET Core
