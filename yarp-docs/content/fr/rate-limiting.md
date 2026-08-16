---
slug: rate-limiting
title: Limitation de débit
lede: >-
  Le reverse proxy peut être utilisé pour limiter le débit des requêtes avant qu'elles ne soient
  transférées vers la destination
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/rate-limiting
lastUpdated: 2026-08-11
---

## Introduction

Le reverse proxy peut être utilisé pour limiter le débit des requêtes avant qu'elles ne soient transférées vers les serveurs de destination. Cela permet de réduire la charge sur les serveurs de destination, d'ajouter une couche de protection et de garantir l'application de politiques cohérentes dans l'ensemble de vos applications.

Cette fonctionnalité est disponible uniquement avec .NET 7 ou une version ultérieure

## Valeurs par défaut

Aucune limitation de débit n'est appliquée aux requêtes tant qu'elle n'est pas activée dans la configuration de la route ou de l'application. Toutefois, le middleware de limitation de débit ( app.UseRateLimiter() ) peut appliquer un limiteur par défaut à toutes les routes, et cela ne nécessite aucune activation explicite dans la configuration. Exemple :

```csharp
   services.AddRateLimiter(options => options.GlobalLimiter = globalLimiter);
```

## Configuration

Les politiques de limiteur de débit peuvent être spécifiées par route via RouteConfig.RateLimiterPolicy et peuvent être liées depuis les sections Routes du fichier de configuration. Comme pour les autres propriétés de route, cela peut être modifié et rechargé sans redémarrer le proxy. Les noms de politique ne sont pas sensibles à la casse.

Exemple :

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "RateLimiterPolicy": "customPolicy",
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
RateLimiter policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core rate limiting middleware.
RateLimiter policies can be configured in services as follows:
```

```csharp
   services.AddRateLimiter(options =>
   {
          options.AddFixedWindowLimiter("customPolicy", opt =>
          {
                 opt.PermitLimit = 4;
                 opt.Window = TimeSpan.FromSeconds(12);
                 opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                 opt.QueueLimit = 2;
          });
   });
Then add the RateLimiter middleware.
    C#
   app.UseRateLimiter();
   app.MapReverseProxy();
See the Rate Limiting docs for setting up your preferred kind of rate limiting.
```

## Désactiver la limitation de débit

Spécifier la valeur disable dans le paramètre RateLimiterPolicy d'une route signifie que le middleware de limitation de débit n'appliquera aucune politique à cette route, pas même la politique par défaut.

:::note
Cet article a été rédigé par l'auteur avec l'aide de l'IA. En savoir plus
:::
