---
slug: config-providers
title: Fournisseurs de configuration
lede: >-
  Chargez les routes et les clusters de manière programmatique plutôt que depuis un fichier, en
  implémentant vous-même IProxyConfigProvider - utile pour une base de données, une API distante,
  ou toute autre source.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-providers
lastUpdated: 2025-02-10
---

## L'interface du fournisseur

[Fichiers de configuration](doc:config-files) couvrent le cas courant du chargement depuis `IConfiguration`. Pour charger depuis n'importe quelle autre source, implémentez vous-même `IProxyConfigProvider` et `IProxyConfig`.

`IProxyConfigProvider` possède une seule méthode, `GetConfig()`, qui retourne un `IProxyConfig` - un instantané contenant les routes et clusters actuels, ainsi qu'un `IChangeToken` que le fournisseur signale chaque fois que cet instantané est obsolète, ce qui amène le proxy à appeler `GetConfig()` à nouveau.

## Charger directement les routes et les clusters

Pour le cas le plus simple - des routes et des clusters entièrement connus dans le code - `InMemoryConfigProvider` est un `IProxyConfigProvider` prêt à l'emploi :

```csharp
services.AddReverseProxy().LoadFromMemory(routes, clusters);
```

Pour modifier cette configuration ultérieurement, résolvez `InMemoryConfigProvider` depuis le conteneur de services et appelez `Update` :

```csharp
httpContext.RequestServices.GetRequiredService<InMemoryConfigProvider>()
    .Update(routes, clusters);
```

## Cycle de vie du fournisseur

### Démarrage

`IProxyConfigProvider` est enregistré en tant que singleton. Au démarrage, le proxy le résout et appelle `GetConfig()` une seule fois ; le fournisseur peut :

- lever une exception s'il ne peut pas produire de configuration valide - ce qui empêche le démarrage de l'application ;
- se bloquer de manière synchrone jusqu'à ce que la configuration soit chargée, ce qui retarde le démarrage jusqu'à ce que des données de route valides soient disponibles ; ou
- retourner immédiatement un `IProxyConfig` vide et effectuer le chargement en arrière-plan, en signalant son `IChangeToken` une fois les données réelles disponibles.

Quelle que soit la configuration retournée, elle est validée, et un résultat invalide déclenche une exception qui empêche le démarrage - un fournisseur peut à la place effectuer une prévalidation avec `IConfigValidator` et exclure lui-même les entrées invalides.

Les objets de route et de cluster transmis au proxy doivent être considérés en lecture seule une fois retournés par `GetConfig()`.

### Rechargement

Si l'`IChangeToken` prend en charge les rappels de changement actifs, le proxy en enregistre un après le chargement initial ; sinon, `HasChanged` est interrogé toutes les 5 minutes. Pour publier une nouvelle configuration, un fournisseur doit la charger en arrière-plan - en construisant de nouvelles instances de route/cluster, puisqu'elles sont immuables, bien que celles qui n'ont pas changé puissent être réutilisées - la valider éventuellement, puis, seulement à ce moment, signaler l'`IChangeToken` *précédent*. Le proxy appelle alors à nouveau `GetConfig()` et compare le résultat à la configuration actuelle, en ne mettant à jour que ce qui a changé ; la permutation est atomique et n'affecte que les nouvelles requêtes, pas celles déjà en cours.

:::important
Les `IChangeToken` sont à usage unique. Si `GetConfig()` lève une exception pendant un rechargement, le proxy perd sa capacité à écouter d'autres changements provenant de ce fournisseur. Toute autre erreur de rechargement est en revanche journalisée puis ignorée, et le proxy continue d'utiliser la dernière configuration valide connue.
:::

Si plusieurs rechargements sont signalés en succession rapide, le proxy peut en ignorer certains et charger ce qui est disponible au moment où il rattrape son retard - chaque `IProxyConfig` est un instantané complet, et non une différence, si bien que rien n'est perdu en ignorant un état intermédiaire.

## Plusieurs fournisseurs

Plusieurs `IProxyConfigProvider` peuvent être enregistrés en tant que singletons ; ils sont tous résolus et leurs configurations combinées, de la même manière que plusieurs sections de [fichier de configuration](doc:config-files) peuvent l'être. Une route provenant d'un fournisseur peut référencer un cluster provenant d'un autre, mais une seule route ou un seul cluster ne peut pas être assemblé à partir de données partielles réparties sur deux fournisseurs.
