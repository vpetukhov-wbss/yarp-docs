---
slug: getting-started
title: Erste Schritte mit YARP
lede: >-
  Fügen Sie YARP zu einem neuen ASP.NET Core-Projekt hinzu und leiten Sie mit wenigen Codezeilen
  jede Anfrage an ein einziges Backend weiter.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/getting-started
lastUpdated: 2025-02-10
---

## Voraussetzungen

Das .NET SDK sowie ein Backend-Server, an den Anfragen weitergeleitet werden – für Testzwecke genügt jeder HTTP-Server, auch eine andere lokal laufende ASP.NET Core-App.

## Projekt erstellen

Erstellen Sie ein leeres ASP.NET Core-Projekt und fügen Sie das Paket `Yarp.ReverseProxy` hinzu:

:::example Paket erstellen und hinzufügen
Ausgehend von einem leeren Ordner.

```dotnetcli
dotnet new web -o MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```
:::

## Proxy konfigurieren

Registrieren Sie den Reverse Proxy und laden Sie seine Konfiguration aus `appsettings.json`:

:::example Program.cs
Registriert den Proxy und ordnet seine Routen zu.

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
Die vollständige Struktur von `appsettings.json` – eine Route und ein Cluster mit mindestens einem Ziel – finden Sie unter [Konfigurationsdateien](doc:config-files).
:::

## Ausführen

Starten Sie die App mit `dotnet run` und senden Sie eine Anfrage an die URL des Proxys – er leitet sie an das konfigurierte Ziel weiter und gibt die Antwort unverändert zurück.
