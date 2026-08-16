---
slug: output-caching
title: Mise en cache des sorties
lede: >-
  Le proxy inverse peut être utilisé pour mettre en cache les réponses transférées et servir les
  requêtes avant qu'elles ne soient
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/output-caching
lastUpdated: 2026-08-11
---

## Introduction

Le proxy inverse peut être utilisé pour mettre en cache les réponses transférées et servir les requêtes avant qu'elles ne soient transférées vers les serveurs de destination. Cela permet de réduire la charge sur les serveurs de destination, d'ajouter une couche de protection et de garantir une application cohérente des stratégies dans l'ensemble de vos applications.

Cette fonctionnalité n'est disponible qu'à partir de .NET 7

## Comportement par défaut

Aucune mise en cache des sorties n'est effectuée, sauf si elle est activée dans la configuration de la route ou de l'application.

## Configuration

Les stratégies de mise en cache des sorties peuvent être spécifiées par route via RouteConfig.OutputCachePolicy et peuvent être liées à partir des sections Routes du fichier de configuration. Comme pour les autres propriétés de route, cette configuration peut être modifiée et rechargée sans redémarrer le proxy. Les noms de stratégie ne respectent pas la casse.

Exemple :

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "OutputCachePolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
         }
      },
      "Clusters": {
         "cluster1": {
             "Destinations": {
                "cluster1/destination1": {
                   "Address": "https://localhost:10001/"
                }
             }
         }
      }
             }
          }
Output cache policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core output caching middleware.
Output cache policies can be configured in Program.cs as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddOutputCache(options =>
   {
          options.AddPolicy("customPolicy", builder =>
   builder.Expire(TimeSpan.FromSeconds(20)));
   });
Then add the output caching middleware:
    C#
   var app = builder.Build();
   app.UseOutputCache();
   app.MapReverseProxy();
See the Output Caching docs for setting up your preferred kind of output caching.
 Note: The author created this article with assistance from AI. Learn more
```
