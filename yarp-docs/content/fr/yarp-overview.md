---
slug: yarp-overview
title: Présentation de YARP
lede: >-
  YARP (Yet Another Reverse Proxy) est une bibliothèque de proxy inverse hautement personnalisable
  pour .NET, conçue pour être robuste, flexible, évolutive, sécurisée et facile à exécuter devant
  les services que vous utilisez déjà.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/yarp-overview
lastUpdated: 2025-02-21
---

## Introduction

YARP aide les développeurs à créer des solutions de proxy inverse puissantes et efficaces, adaptées à leurs besoins spécifiques. Il se situe entre les appareils clients et les serveurs backend, transférant les requêtes du client vers la destination appropriée et renvoyant la réponse - le même rôle que jouent nginx ou Envoy, mais sous la forme d'une bibliothèque hébergée au sein de votre propre processus ASP.NET Core.

## Ce que fait un proxy inverse

Un proxy inverse apporte plusieurs avantages par rapport à un backend simple :

- **Routage** — dirige les requêtes vers différents serveurs backend en fonction de règles prédéfinies, telles que des modèles d'URL ou des en-têtes de requête. `/images`, `/api` et `/db` peuvent chacun être routés vers un serveur différent.
- **Équilibrage de charge** — répartit le trafic entrant sur plusieurs serveurs backend afin d'éviter de surcharger l'un d'entre eux.
- **Évolutivité** — des serveurs backend peuvent être ajoutés ou retirés sans impact pour le client, car le trafic est réparti par le proxy.
- **Terminaison TLS** — décharge les serveurs backend du chiffrement et du déchiffrement, réduisant leur charge de travail.
- **Sécurité** — les points de terminaison des services internes restent invisibles depuis l'extérieur, ce qui réduit la surface d'attaque.

## Comment un proxy inverse traite HTTP

Les connexions entrantes sont interrompues au niveau du proxy ; de nouvelles connexions, gérées par un pool, sont utilisées pour les requêtes sortantes vers les destinations. En fonction des règles de routage configurées, YARP détermine quel cluster doit traiter la requête, la transfère - en transformant le chemin et les en-têtes si nécessaire - puis relaie au client la réponse du backend.

:::example Exemple rapide
Enregistre le proxy et charge les routes et clusters directement depuis la configuration.

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": { "Path": "{**catch-all}" }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "cluster1/destination1": { "Address": "https://example.com/" }
        }
      }
    }
  }
}
```
:::

:::note
La configuration est rechargée automatiquement lorsque la source change - aucun redémarrage n'est nécessaire. Consultez [Filtres de configuration](doc:config-filters) pour modifier la configuration pendant la séquence de chargement.
:::

## Pourquoi choisir YARP plutôt que d'autres proxys

YARP est construit sur ASP.NET Core, ce qui lui permet de s'intégrer directement à l'écosystème .NET et vous offre un riche ensemble de points d'extensibilité - le routage, l'équilibrage de charge et les transformations peuvent tous être personnalisés dans un C# familier plutôt que dans un langage de configuration spécifique à un proxy. YARP est activement maintenu par Microsoft, et YARP ainsi que sa documentation sont open source.
