---
slug: aspnetcore-getting-started
title: Prise en main d'ASP.NET Core
lede: >-
  Ce tutoriel montre comment créer et exécuter une application web ASP.NET Core à l'aide de
  l'interface CLI .NET.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/getting-started/
lastUpdated: 2026-08-11
---

Tutoriel : Prise en main d'ASP.NET Core

Ce tutoriel montre comment créer et exécuter une application web ASP.NET Core à l'aide de l'interface CLI .NET.

Pour les tutoriels Blazor, consultez les tutoriels ASP.NET Core Blazor.

Vous allez apprendre à : Créer un projet d'application web. Exécuter l'application. Modifier une page Razor.

À la fin, vous disposerez d'une application web fonctionnelle s'exécutant sur votre ordinateur local.

## Prérequis

## .NET 8 SDK

## Créer un projet d'application web

Ouvrez un interpréteur de commandes et entrez la commande suivante :

.NET CLI dotnet new webapp --output aspnetcoreapp --no-https

La commande précédente crée un nouveau projet d'application web dans un répertoire nommé aspnetcoreapp .

Le projet n'utilise pas HTTPS.

## Exécuter l'application

Exécutez les commandes suivantes :

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

## Modifier une page Razor

Modifiez la page d'accueil :

Dans l'interpréteur de commandes, appuyez sur Ctrl+C (Cmd+C sur macOS) pour quitter le programme.

Ouvrez Pages/Index.cshtml dans un éditeur de texte.

Remplacez la ligne commençant par « Learn about » par le balisage et le code surlignés suivants :

## CSHTML

@page @model IndexModel @{

ViewData["Title"] = "Home page"; }

<div class="text-center"> <h1 class="display-4">Welcome</h1> <p>Hello, world! The time on the server is @DateTime.Now</p>

## </div>

Enregistrez vos modifications. Dans l'interpréteur de commandes, exécutez de nouveau la commande dotnet run . Dans le navigateur, actualisez la page et vérifiez que les modifications sont affichées.

## Étapes suivantes

Dans ce tutoriel, vous avez appris à :

Créer un projet d'application web. Exécuter le projet. Apporter une modification.

Pour en savoir plus sur ASP.NET Core, consultez la ressource suivante :

## Vue d'ensemble d'ASP.NET Core
