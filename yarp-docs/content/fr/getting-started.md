---
slug: getting-started
title: Prise en main de YARP
lede: >-
  Ajoutez YARP à un nouveau projet ASP.NET Core et transférez chaque requête vers un seul backend
  en quelques lignes de code.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/getting-started
lastUpdated: 2025-02-10
---

## Prérequis

Le SDK .NET, ainsi qu'un serveur backend vers lequel transférer les requêtes - n'importe quel serveur HTTP convient pour les tests, y compris une autre application ASP.NET Core exécutée localement.

## Créer le projet

Créez un projet ASP.NET Core vide et ajoutez le package `Yarp.ReverseProxy` :

:::example Créer le projet et ajouter le package
Depuis un dossier vide.

```dotnetcli
dotnet new web -o MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```
:::

## Configurer le proxy

Enregistrez le proxy inverse et chargez sa configuration depuis `appsettings.json` :

:::example Program.cs
Enregistre le proxy et mappe ses routes.

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
Consultez [Fichiers de configuration](doc:config-files) pour connaître la forme complète d'`appsettings.json` - une route et un cluster avec au moins une destination.
:::

## Exécuter l'application

Démarrez l'application avec `dotnet run` et envoyez une requête à l'URL du proxy - elle est transférée vers votre destination configurée, et la réponse est relayée telle quelle.
