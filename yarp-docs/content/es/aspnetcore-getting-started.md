---
slug: aspnetcore-getting-started
title: Introducción a ASP.NET Core
lede: >-
  En este tutorial se muestra cómo crear y ejecutar una aplicación web de ASP.NET Core mediante la
  CLI de .NET.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/getting-started/
lastUpdated: 2026-08-11
---

Tutorial: Introducción a ASP.NET Core

En este tutorial se muestra cómo crear y ejecutar una aplicación web de ASP.NET Core mediante la CLI de .NET.

Para tutoriales de Blazor, consulte los tutoriales de ASP.NET Core Blazor.

Aprenderá a: crear un proyecto de aplicación web. Ejecutar la aplicación. Editar una página Razor.

Al final, tendrá una aplicación web en funcionamiento ejecutándose en su equipo local.

## Requisitos previos

## SDK de .NET 8

## Creación de un proyecto de aplicación web

Abra un shell de comandos y escriba el siguiente comando:

CLI de .NET: `dotnet new webapp --output aspnetcoreapp --no-https`

El comando anterior crea un nuevo proyecto de aplicación web en un directorio denominado `aspnetcoreapp`.

El proyecto no usa HTTPS.

## Ejecución de la aplicación

Ejecute los siguientes comandos:

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

## Edición de una página Razor

Cambie la página principal:

En el shell de comandos, presione Ctrl+C (Cmd+C en macOS) para salir del programa.

Abra `Pages/Index.cshtml` en un editor de texto.

Reemplace la línea que comienza con "Learn about" por el siguiente marcado y código resaltado:

## CSHTML

`@page @model IndexModel @{`

`ViewData["Title"] = "Home page"; }`

<div class="text-center"> <h1 class="display-4">Welcome</h1> <p>Hello, world! The time on the server is @DateTime.Now</p>

## </div>

Guarde los cambios. En el shell de comandos, ejecute de nuevo el comando `dotnet run`. En el explorador, actualice la página y compruebe que los cambios se muestran.

## Próximos pasos

En este tutorial, aprendió a:

Crear un proyecto de aplicación web. Ejecutar el proyecto. Realizar un cambio.

Para obtener más información sobre ASP.NET Core, consulte lo siguiente:

## Información general sobre ASP.NET Core
