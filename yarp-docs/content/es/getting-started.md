---
slug: getting-started
title: Introducción a YARP
lede: >-
  Agregue YARP a un nuevo proyecto de ASP.NET Core y reenvíe todas las solicitudes a un único
  back-end en pocas líneas de código.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/getting-started
lastUpdated: 2025-02-10
---

## Requisitos previos

El SDK de .NET, y un servidor back-end al que reenviar las solicitudes - cualquier servidor HTTP sirve para pruebas, incluida otra aplicación de ASP.NET Core que se ejecute localmente.

## Creación del proyecto

Cree un proyecto vacío de ASP.NET Core y agregue el paquete `Yarp.ReverseProxy`:

:::example Crear el proyecto y agregar el paquete
Desde una carpeta vacía.

```dotnetcli
dotnet new web -o MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```
:::

## Configuración del proxy

Registre el proxy inverso y cargue su configuración desde `appsettings.json`:

:::example Program.cs
Registra el proxy y asigna sus rutas.

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
Consulte [Archivos de configuración](doc:config-files) para ver la forma completa de `appsettings.json` - una ruta y un clúster con al menos un destino.
:::

## Ejecución

Inicie la aplicación con `dotnet run` y envíe una solicitud a la URL del proxy - la reenvía al destino configurado y devuelve la respuesta sin cambios.
