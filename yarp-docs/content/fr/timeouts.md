---
slug: timeouts
title: Délais d'expiration des requêtes
lede: >-
  .NET 8 a introduit le middleware Request Timeouts, qui permet de configurer les délais
  d'expiration des requêtes
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/timeouts
lastUpdated: 2026-08-11
---

## Introduction

.NET 8 a introduit le middleware Request Timeouts, qui permet de configurer les délais d'expiration des requêtes à l'échelle globale ou par point de terminaison. Cette fonctionnalité est également disponible dans YARP 2.1 lors de l'exécution sur .NET 8 ou une version ultérieure.

## Valeurs par défaut

Les requêtes n'ont aucun délai d'expiration par défaut, à l'exception du délai d'expiration d'activité (Activity Timeout) utilisé pour nettoyer les requêtes inactives. Une politique par défaut spécifiée dans RequestTimeoutOptions s'appliquera également aux requêtes transférées.

## Configuration

Les délais d'expiration et les politiques de délai d'expiration peuvent être spécifiés par route via RouteConfig et peuvent être liés depuis les sections Routes du fichier de configuration. Comme pour les autres propriétés de route, cela peut être modifié et rechargé sans redémarrer le proxy. Les noms de politique ne sont pas sensibles à la casse.

Les délais d'expiration sont spécifiés au format TimeSpan (HH:MM:SS). Spécifier à la fois un Timeout et une TimeoutPolicy sur la même route n'est pas valide et entraînera le rejet de la configuration.

:::note
Les délais d'expiration des requêtes ne s'appliquent pas lorsqu'un débogueur est attaché au processus.
:::

Exemple :

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "TimeoutPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
         }
         "route2" : {
             "ClusterId": "cluster1",
             "Timeout": "00:01:00",
             "Match": {
                         "Hosts": [ "localhost2" ]
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
Timeout policies and the default policy can be configured in the service collection and the
middleware can be added as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddReverseProxy()
          .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
   builder.Services.AddRequestTimeouts(options =>
   {
          options.AddPolicy("customPolicy", TimeSpan.FromSeconds(20));
   });
   var app = builder.Build();
   app.UseRequestTimeouts();
   app.MapReverseProxy();
   app.Run();
```

## Désactiver les délais d'expiration

Spécifier la valeur disable dans le paramètre TimeoutPolicy d'une route signifie que le middleware de délai d'expiration des requêtes n'appliquera aucun délai à cette route.

## WebSockets

Les délais d'expiration des requêtes sont désactivés après la prise de contact (handshake) WebSocket initiale.

:::note
Cet article a été rédigé par l'auteur avec l'aide de l'IA. En savoir plus
:::
