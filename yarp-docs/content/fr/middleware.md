---
slug: middleware
title: Middleware
lede: >-
  ASP.NET Core utilise un pipeline de middleware pour diviser le traitement des requêtes en étapes
  distinctes. Le
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/middleware
lastUpdated: 2026-08-11
---

## Introduction

ASP.NET Core utilise un pipeline de middleware pour diviser le traitement des requêtes en étapes distinctes. Le développeur de l'application peut ajouter et ordonner les middlewares selon ses besoins. Le middleware ASP.NET Core est également utilisé pour implémenter et personnaliser les fonctionnalités du reverse proxy.

## Valeurs par défaut

L'exemple de prise en main présente la méthode Configure suivante. Elle met en place un pipeline de middleware avec les outils de développement, le routage et les points de terminaison configurés par le proxy (MapReverseProxy).

```csharp
         var builder = WebApplication.CreateBuilder(args);
         builder.Services.AddReverseProxy()
                .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
         var app = builder.Build();
         app.MapReverseProxy();
         app.Run();
The parameterless MapReverseProxy() in ReverseProxyIEndpointRouteBuilderExtensions
overload includes all standard proxy middleware for session affinity, load balancing, passive
health checks, and the final proxying of the request. Each of these check the configuration of
the matched route, cluster, and destination and perform their task accordingly.
```

## Ajout de middleware

Le middleware ajouté au pipeline de votre application voit la requête dans différents états de traitement selon l'endroit où il est ajouté. Le middleware ajouté avant UseRouting voit toutes les requêtes et peut les manipuler avant que le routage n'ait lieu. Le middleware ajouté entre UseRouting et UseEndpoints peut appeler HttpContext.GetEndpoint() pour vérifier à quel point de terminaison le routage a associé la requête (le cas échéant), et utiliser les métadonnées associées à ce point de terminaison. C'est ainsi que sont gérés l'authentification, l'autorisation et le CORS.

ReverseProxyIEndpointRouteBuilderExtensions fournit une surcharge de MapReverseProxy qui permet de construire un pipeline de middleware qui ne s'exécutera que pour les requêtes associées à des

routes configurées par le proxy.

app.MapReverseProxy(proxyPipeline => {

proxyPipeline.Use((context, next) => {

## // Custom inline middleware

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); proxyPipeline.UsePassiveHealthChecks(); });

Par défaut, cette surcharge de MapReverseProxy inclut uniquement la configuration minimale, la logique de proxy et l'application des limites au début et à la fin de son pipeline. Le middleware d'affinité de session, de répartition de charge et de contrôles d'intégrité passifs n'est pas inclus par défaut, afin que vous puissiez l'exclure, le remplacer ou contrôler son ordre avec tout middleware supplémentaire.

## Middleware de proxy personnalisé

Le middleware situé à l'intérieur du pipeline MapReverseProxy a accès à toutes les données et à l'état du proxy associés à une requête (la route, le cluster, les destinations, etc.) via IReverseProxyFeature. Celui-ci est accessible depuis HttpContext.Features ou via la méthode d'extension HttpContext.GetReverseProxyFeature().

Les données de IReverseProxyFeature sont capturées à partir de la configuration du proxy au début du pipeline de proxy et ne sont pas affectées par les modifications de configuration du proxy qui surviennent pendant le traitement de la requête.

```csharp
   proxyPipeline.Use((context, next) =>
   {
          var proxyFeature = context.GetReverseProxyFeature();
          var cluster = proxyFeature.Cluster;
          var destinations = proxyFeature.AvailableDestinations;
          return next();
   });
```

## Ce qu'il faut faire avec le middleware

Le middleware peut générer des journaux, décider si une requête est proxifiée ou non, influencer sa destination, et ajouter des fonctionnalités supplémentaires comme la gestion des erreurs, les nouvelles tentatives, etc.

## Journaux et métriques

Le middleware peut inspecter les champs de la requête et de la réponse pour générer des journaux et agréger des métriques. Consultez la remarque sur les corps de message dans la section « Ce qu'il ne faut pas faire avec le middleware » ci-dessous.

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          LogRequest(context);
          await next();
          LogResponse(context);
   });
```

## Envoyer une réponse immédiate

Si un middleware inspecte une requête et détermine qu'elle ne doit pas être proxifiée, il peut générer sa propre réponse et rendre la main au serveur sans appeler next().

```csharp
   proxyPipeline.Use((context, next) =>
   {
          if (!CheckAllowedRequest(context, out var reason))
          {
                 context.Response.StatusCode = StatusCodes.Status400BadRequest;
                 return context.Response.WriteAsync(reason);
          }
          return next();
   });
```

## Filtrer les destinations

Les middlewares tels que l'affinité de session et la répartition de charge examinent IReverseProxyFeature et la configuration du cluster pour décider vers quelle destination une requête doit être envoyée. AllDestinations répertorie toutes les destinations du cluster sélectionné.

AvailableDestinations répertorie les destinations actuellement considérées comme éligibles pour traiter la

requête. Elle est initialisée à partir de AllDestinations, en excluant les destinations en mauvaise santé si les contrôles d'intégrité sont

activés. AvailableDestinations doit être réduite à une seule destination avant la fin du

pipeline, sans quoi une destination sera sélectionnée aléatoirement parmi celles restantes.

ProxiedDestination est définie par la logique du proxy à la fin du pipeline pour indiquer quelle destination a finalement été utilisée. S'il ne reste plus aucune destination disponible, une réponse d'erreur 503 est envoyée.

```csharp
proxyPipeline.Use(async (context, next) =>
{
      var proxyFeature = context.GetReverseProxyFeature();
      proxyFeature.AvailableDestinations =
Filter(proxyFeature.AvailableDestinations);
      await next();
      Report(proxyFeature.ProxiedDestination);
});
DestinationState implements IReadOnlyList<DestinationState> so a single destination can be
assigned to AvailableDestinations without creating a new list.
```

## Gestion des erreurs

Le middleware peut englober l'appel à await next() dans un bloc try/catch afin de gérer les exceptions provenant des composants situés en aval.

La logique du proxy à la fin du pipeline (IHttpForwarder) ne lève pas d'exceptions pour les erreurs de proxy courantes. Celles-ci sont capturées et signalées dans IForwarderErrorFeature, disponible depuis HttpContext.Features ou via la méthode d'extension HttpContext.GetForwarderErrorFeature().

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          await next();
          var errorFeature = context.GetForwarderErrorFeature();
          if (errorFeature is not null)
          {
                 Report(errorFeature.Error, errorFeature.Exception);
                 }
          });
If the response has not started ( HttpResponse.HasStarted ) it can be cleared
( HttpResponse.Clear() ) and an alternate response sent, or the proxy feature fields may be
reset and the request retried.
```

## Ce qu'il ne faut pas faire avec le middleware

Le middleware doit faire preuve de prudence lorsqu'il modifie des champs de la requête, tels que les en-têtes, afin d'affecter la requête proxifiée sortante. De telles modifications peuvent interférer avec des fonctionnalités comme les nouvelles tentatives, et sont peut-être mieux prises en charge par des transformations.

Le middleware DOIT vérifier HttpResponse.HasStarted avant de modifier les champs de la réponse après avoir appelé next(). Si l'envoi de la réponse au client a déjà commencé, le middleware ne peut plus la modifier (à l'exception peut-être des trailers). Les transformations peuvent être utilisées pour inspecter et supprimer les réponses indésirables. Sinon, consultez la remarque suivante.

Le middleware doit éviter d'interagir avec les corps de la requête ou de la réponse. Les corps de message ne sont pas mis en mémoire tampon par défaut, si bien qu'interagir avec eux peut les empêcher d'atteindre leur destination. Bien qu'il soit possible d'activer la mise en mémoire tampon, cela est déconseillé, car cela peut ajouter une surcharge importante en mémoire et en latence. Il est recommandé d'utiliser une approche de streaming avec wrapper si le corps doit être examiné ou modifié. Consultez le middleware ResponseCompression pour un exemple.

Le middleware NE DOIT PAS effectuer de travail multithread sur une requête individuelle : HttpContext et ses membres associés ne sont pas thread-safe.

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
