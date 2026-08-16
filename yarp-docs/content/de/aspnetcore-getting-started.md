---
slug: aspnetcore-getting-started
title: Einstieg in ASP.NET Core
lede: >-
  In diesem Tutorial erfahren Sie, wie Sie mit der .NET-CLI eine ASP.NET Core-Webanwendung
  erstellen und ausführen.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/getting-started/
lastUpdated: 2026-08-11
---

Tutorial: Einstieg in ASP.NET Core

In diesem Tutorial erfahren Sie, wie Sie mit der .NET-CLI eine ASP.NET Core-Webanwendung erstellen und ausführen.

Tutorials zu Blazor finden Sie unter ASP.NET Core Blazor-Tutorials.

Sie lernen Folgendes: Erstellen eines Webanwendungsprojekts. Ausführen der App. Bearbeiten einer Razor-Seite.

Am Ende verfügen Sie über eine funktionierende Webanwendung, die auf Ihrem lokalen Computer ausgeführt wird.

## Voraussetzungen

## .NET 8 SDK

## Erstellen eines Webanwendungsprojekts

Öffnen Sie eine Befehlsshell, und geben Sie den folgenden Befehl ein:

.NET CLI dotnet new webapp --output aspnetcoreapp --no-https

Der vorstehende Befehl erstellt ein neues Webanwendungsprojekt in einem Verzeichnis mit dem Namen aspnetcoreapp .

Das Projekt verwendet kein HTTPS.

## Ausführen der App

Führen Sie die folgenden Befehle aus:

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

## Bearbeiten einer Razor-Seite

Ändern Sie die Startseite:

Drücken Sie in der Befehlsshell STRG+C (unter macOS CMD+C), um das Programm zu beenden.

Öffnen Sie Pages/Index.cshtml in einem Texteditor.

Ersetzen Sie die Zeile, die mit „Learn about" beginnt, durch das folgende hervorgehobene Markup und den folgenden Code:

## CSHTML

@page @model IndexModel @{

ViewData["Title"] = "Home page"; }

<div class="text-center"> <h1 class="display-4">Welcome</h1> <p>Hello, world! The time on the server is @DateTime.Now</p>

## </div>

Speichern Sie Ihre Änderungen. Führen Sie in der Befehlsshell den Befehl dotnet run erneut aus. Aktualisieren Sie die Seite im Browser, und überprüfen Sie, ob die Änderungen angezeigt werden.

## Nächste Schritte

In diesem Tutorial haben Sie Folgendes gelernt:

Erstellen eines Webanwendungsprojekts. Ausführen des Projekts. Vornehmen einer Änderung.

Weitere Informationen zu ASP.NET Core finden Sie unter:

## Übersicht über ASP.NET Core
