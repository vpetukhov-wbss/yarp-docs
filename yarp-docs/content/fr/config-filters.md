---
slug: config-filters
title: Filtres de configuration
lede: >-
  Modifiez les routes et les clusters juste après leur chargement et avant leur validation -
  renseignez des valeurs depuis l'environnement, appliquez des valeurs par défaut, ou imposez des
  stratégies sur l'ensemble des entrées.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-filters
lastUpdated: 2025-02-10
---

## À quoi servent les filtres

La configuration chargée depuis des fichiers ou [un fournisseur personnalisé](doc:config-providers) constitue une entrée brute - un filtre a la possibilité de la modifier avant qu'elle ne soit validée et appliquée. Utilisations courantes :

- Renseigner des champs à partir de l'environnement de déploiement (une adresse de destination connue uniquement à l'exécution).
- Appliquer des valeurs par défaut à l'échelle de l'organisation ou imposer des stratégies sur toutes les routes ou tous les clusters.
- Substituer des valeurs d'espace réservé.
- Normaliser ou corriger de petites erreurs de configuration avant qu'elles ne deviennent des échecs critiques.

## Enregistrer un filtre

Les filtres sont enregistrés dans l'injection de dépendances avec `AddConfigFilter`. N'importe quel nombre peut être ajouté ; ils s'exécutent dans l'ordre où ils ont été enregistrés.

```csharp
services.AddReverseProxy()
    .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
    .AddConfigFilter<CustomConfigFilter>();
```

## Écrire un filtre

Un filtre implémente `IProxyConfigFilter`, avec une méthode par type de configuration - `ConfigureRouteAsync` et `ConfigureClusterAsync`. Comme les filtres sont résolus depuis l'injection de dépendances, ils peuvent recevoir des dépendances de constructeur comme n'importe quel autre service enregistré. Chaque méthode s'exécute une fois par route ou par cluster, à chaque chargement ou rechargement de la configuration, et retourne soit l'instance d'origine inchangée, soit une copie modifiée - l'expression `with` des records C# 9 est un moyen pratique de produire cette copie sans toucher au reste de l'objet.

:::example Substituer les adresses de destination à partir de variables d'environnement
Recherche les espaces réservés `{{key}}` dans les adresses de destination d'un cluster et remplace chacun d'eux par la valeur d'une variable d'environnement nommée `key`, en levant une exception si elle n'est pas définie. Porte également le `Order` de chaque route à au moins `1`, afin que les routes enregistrées dans le code (dont la valeur par défaut est `0`) aient toujours priorité sur celles chargées depuis la configuration.

```csharp
using System.Text.RegularExpressions;
using Yarp.ReverseProxy.Configuration;

public class CustomConfigFilter : IProxyConfigFilter
{
    private readonly Regex _exp = new("\\{\\{(\\w+)\\}\\}");

    public ValueTask<ClusterConfig> ConfigureClusterAsync(ClusterConfig cluster, CancellationToken cancel)
    {
        var newDestinations = new Dictionary<string, DestinationConfig>(StringComparer.OrdinalIgnoreCase);
        foreach (var d in cluster.Destinations)
        {
            var match = _exp.Match(d.Value.Address);
            if (!match.Success)
            {
                newDestinations.Add(d.Key, d.Value);
                continue;
            }
            var name = match.Groups[1].Value;
            var value = Environment.GetEnvironmentVariable(name)
                ?? throw new ArgumentException($"Substitution for '{name}' in cluster '{d.Key}' was not found.");
            newDestinations.Add(d.Key, d.Value with { Address = value });
        }
        return new ValueTask<ClusterConfig>(cluster with { Destinations = newDestinations });
    }

    public ValueTask<RouteConfig> ConfigureRouteAsync(RouteConfig route, ClusterConfig cluster, CancellationToken cancel)
    {
        if (route.Order is < 1)
        {
            return new ValueTask<RouteConfig>(route with { Order = 1 });
        }
        return new ValueTask<RouteConfig>(route);
    }
}
```
:::
