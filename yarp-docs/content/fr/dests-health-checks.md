---
slug: dests-health-checks
title: Contrôles d'intégrité des destinations
lede: >-
  Dans la plupart des systèmes réels, il est normal que leurs nœuds connaissent occasionnellement
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks
lastUpdated: 2026-08-11
---

Dans la plupart des systèmes réels, il est normal que leurs nœuds connaissent occasionnellement des problèmes transitoires, voire tombent complètement en panne, pour diverses raisons telles qu'une surcharge, une fuite de ressources ou une défaillance matérielle. Dans l'idéal, il serait souhaitable de prévenir totalement ces incidents de manière proactive, mais le coût de conception et de construction d'un tel système est généralement prohibitif. Il existe cependant une autre approche, réactive, moins coûteuse, visant à minimiser l'impact négatif des défaillances sur les requêtes des clients. Le proxy peut analyser l'état de santé de chaque nœud et cesser d'envoyer du trafic client vers ceux qui ne sont pas sains jusqu'à ce qu'ils se rétablissent. YARP met en œuvre cette approche sous la forme de contrôles d'intégrité actifs et passifs des destinations. Ils sont indépendants l'un de l'autre et stockés dans les propriétés correspondantes de chaque destination. Les états d'intégrité sont initialisés à la valeur Unknown, qui peut ensuite être changée en Healthy ou Unhealthy par les politiques correspondantes, comme expliqué ci-dessous.

## Contrôles d'intégrité actifs

YARP peut surveiller de manière proactive l'intégrité des destinations en envoyant périodiquement des requêtes de sondage vers des points de terminaison d'intégrité désignés et en analysant les réponses. Cette analyse est effectuée par une politique de contrôle d'intégrité actif spécifiée pour un cluster, et aboutit au calcul des nouveaux états d'intégrité des destinations. Au final, la politique marque chaque destination comme saine ou non saine en fonction du code de réponse HTTP (2xx est considéré comme sain) et reconstruit la collection des destinations saines du cluster.

Plusieurs paramètres de configuration à l'échelle du cluster contrôlent les contrôles d'intégrité actifs ; ils peuvent être définis soit dans le fichier de configuration, soit en code. Un point de terminaison d'intégrité dédié peut également être spécifié par destination.

## Exemple de fichier

```json
"Clusters": {
   "cluster1": {
      "HealthCheck": {
         "Active": {
             "Enabled": "true",
             "Interval": "00:00:10",
             "Timeout": "00:00:10",
             "Policy": "ConsecutiveFailures",
             "Path": "/api/health",
                      "Query": "?foo=bar"
                   }
      },
      "Metadata": {
                   "ConsecutiveFailuresHealthPolicy.Threshold": "3"
      },
      "Destinations": {
                   "cluster1/destination1": {
                      "Address": "https://localhost:10000/"
                   },
                   "cluster1/destination2": {
                      "Address": "http://localhost:10010/",
                      "Health": "http://localhost:10020/"
                   }
      }
   }
}
```

## Exemple de code

```csharp
   var clusters = new[]
   {
          new ClusterConfig()
          {
                 ClusterId = "cluster1",
                 HealthCheck = new HealthCheckConfig
                 {
                       Active = new ActiveHealthCheckConfig
                       {
                              Enabled = true,
                              Interval = TimeSpan.FromSeconds(10),
                              Timeout = TimeSpan.FromSeconds(10),
                              Policy = HealthCheckConstants.ActivePolicy.ConsecutiveFailures,
                              Path = "/api/health",
                              Query = "?foo=bar",
                       }
                 },
                 Metadata = new Dictionary<string, string> { {
   ConsecutiveFailuresHealthPolicyOptions.ThresholdMetadataName, "5" } },
                 Destinations =
                 {
                       { "destination1", new DestinationConfig() { Address =
   "https://localhost:10000" } },
                       { "destination2", new DestinationConfig() { Address =
   "https://localhost:10010", Health = "https://localhost:10010" } }
                 }
          }
   };
```

## Configuration

Tous les paramètres de contrôle d'intégrité actif, à une exception près, sont spécifiés au niveau du cluster, dans la section Cluster/HealthCheck/Active. La seule exception est l'élément facultatif Destination/Health, qui spécifie un point de terminaison de contrôle d'intégrité actif distinct. L'URI de sondage d'intégrité effective est construite comme Destination/Address (ou Destination/Health lorsqu'il est défini) + Cluster/HealthCheck/Active/Path .

Les paramètres de contrôle d'intégrité actif peuvent également être définis en code via les types correspondants de l'espace de noms Yarp.ReverseProxy.Configuration, qui reflètent le contrat de configuration.

Section Cluster/HealthCheck/Active et ActiveHealthCheckConfig :

Enabled : Flag indicating whether active health check is enabled for a cluster. Default

false

Interval : Period of sending health probing requests. Default 00:00:15 Timeout : Probing request timeout. Default 00:00:10 Policy : Name of a policy evaluating destinations' active health states. Mandatory parameter Path : Health check path on all cluster's destinations. Default null . Query : Health check query on all cluster's destinations. Default null .

Section Destination et DestinationConfig.

Health : A dedicated health probing endpoint such as http://destination:12345/ . Defaults null and falls back to Destination/Address .

## Politiques intégrées

Il existe actuellement une seule politique de contrôle d'intégrité actif intégrée : ConsecutiveFailuresHealthPolicy . Elle compte les échecs consécutifs des sondages d'intégrité et marque une destination comme non saine une fois le seuil défini atteint. Dès la première réponse réussie, la destination est marquée comme saine et le compteur est réinitialisé. Les paramètres de la politique sont définis dans les métadonnées du cluster comme suit :

ConsecutiveFailuresHealthPolicy.Threshold - number of consecutively failed active health probing requests required to mark a destination as unhealthy. Default 2 .

## Conception

Le principal service de ce processus est IActiveHealthCheckMonitor, qui crée périodiquement des requêtes de sondage via IProbingRequestFactory, les envoie à tous les DestinationConfig de chaque

ClusterConfig ayant les contrôles d'intégrité actifs activés, puis transmet toutes les réponses à un

IActiveHealthCheckPolicy spécifié pour un cluster. IActiveHealthCheckMonitor ne prend pas lui-même la

décision de savoir si une destination est saine ou non, mais délègue cette responsabilité à un

IActiveHealthCheckPolicy spécifié pour le cluster. Une politique est appelée pour évaluer les nouveaux états

d'intégrité une fois le sondage de toutes les destinations du cluster terminé. Elle reçoit un ClusterState

représentant l'état dynamique du cluster, ainsi qu'un ensemble de DestinationProbingResult stockant les

résultats de sondage des destinations du cluster. Après avoir évalué un nouvel état d'intégrité pour chaque destination, la

politique appelle IDestinationHealthUpdater pour effectivement mettre à jour les valeurs de DestinationHealthState.Active.

-{For each cluster's destination}- IActiveHealthCheckMonitor <--(Create probing request)--> IProbingRequestFactory

| V HttpMessageInvoker <--(Send probe and receive response)--> Destination | (Save probing result) | V DestinationProbingResult --------------{END}--------------- | (Evaluate new destination active health states using probing results) | V IActiveHealthCheckPolicy --(New active health states)--> IDestinationHealthUpdater --(Update each destination's)--> DestinationState.Health.Active

Des implémentations intégrées par défaut existent pour tous les composants mentionnés ci-dessus ; elles peuvent également être remplacées par des implémentations personnalisées si nécessaire.

## Extensibilité

Le sous-système de contrôle d'intégrité actif comporte 2 principaux points d'extensibilité.

## IActiveHealthCheckPolicy

IActiveHealthCheckPolicy analyse la façon dont les destinations répondent aux sondages d'intégrité actifs envoyés par IActiveHealthCheckMonitor , évalue les nouveaux états d'intégrité actifs pour toutes les destinations sondées, puis appelle IDestinationHealthUpdater.SetActive pour définir les nouveaux états d'intégrité actifs et reconstruire la collection des destinations saines à partir des valeurs mises à jour.

Voici un exemple simple d'un IActiveHealthCheckPolicy personnalisé qui marque une destination comme Healthy si un code de réponse de succès a été renvoyé pour un sondage, et comme Unhealthy dans le cas contraire.

```csharp
public class FirstUnsuccessfulResponseHealthPolicy : IActiveHealthCheckPolicy
{
      private readonly IDestinationHealthUpdater _healthUpdater;
      public FirstUnsuccessfulResponseHealthPolicy(IDestinationHealthUpdater
healthUpdater)
      {
             _healthUpdater = healthUpdater;
      }
      public string Name => "FirstUnsuccessfulResponse";
      public void ProbingCompleted(ClusterState cluster,
IReadOnlyList<DestinationProbingResult> probingResults)
      {
             if (probingResults.Count == 0)
             {
                   return;
             }
             var newHealthStates = new
NewActiveDestinationHealth[probingResults.Count];
             for (var i = 0; i < probingResults.Count; i++)
             {
                   var response = probingResults[i].Response;
                   var newHealth = response is not null && response.IsSuccessStatusCode ?
DestinationHealth.Healthy : DestinationHealth.Unhealthy;
                   newHealthStates[i] = new
NewActiveDestinationHealth(probingResults[i].Destination, newHealth);
             }
             _healthUpdater.SetActive(cluster, newHealthStates);
      }
}
```

## IProbingRequestFactory

IProbingRequestFactory crée les requêtes de sondage d'intégrité actif à envoyer aux points de terminaison d'intégrité des destinations. Elle peut tenir compte de ActiveHealthCheckOptions.Path , de DestinationConfig.Health et d'autres paramètres de configuration pour construire les requêtes de sondage.

L'implémentation par défaut d'IProbingRequestFactory utilise la même configuration HttpRequest que les requêtes du proxy ; pour la personnaliser, implémentez votre propre IProbingRequestFactory et enregistrez-le dans l'injection de dépendances comme ci-dessous.

```csharp
services.AddSingleton<IProbingRequestFactory, CustomProbingRequestFactory>();
The below is a simple example of a customer IProbingRequestFactory concatenating
DestinationConfig.Address and a fixed health probe path to create the probing request URI.
```

```csharp
   public class CustomProbingRequestFactory : IProbingRequestFactory
   {
          public HttpRequestMessage CreateRequest(ClusterConfig clusterConfig,
   DestinationConfig destinationConfig)
          {
                 var probeUri = new Uri(destinationConfig.Address + "/api/probe-health");
                 return new HttpRequestMessage(HttpMethod.Get, probeUri) { Version =
   ProtocolHelper.Http11Version };
          }
   }
```

## Contrôles d'intégrité passifs

YARP peut observer passivement les succès et les échecs du transfert des requêtes clientes afin d'évaluer de manière réactive les états d'intégrité des destinations. Les réponses aux requêtes transférées sont interceptées par un middleware de contrôle d'intégrité passif dédié, qui les transmet à une politique configurée sur le cluster. Cette politique analyse les réponses pour déterminer si les destinations qui les ont produites sont saines ou non. Elle calcule et attribue ensuite de nouveaux états d'intégrité passifs aux destinations concernées, puis reconstruit la collection des destinations saines du cluster.

:::note
la réponse est normalement envoyée au client avant l'exécution de la politique d'intégrité passive ; une politique ne peut donc pas intercepter le corps de la réponse, ni modifier les en-têtes de réponse, à moins que l'application proxy ne mette en place une mise en mémoire tampon complète de la réponse.
:::

Il existe une différence importante par rapport à la logique de contrôle d'intégrité actif. Une fois qu'un état passif non sain est attribué à une destination, celle-ci cesse de recevoir tout nouveau trafic, ce qui bloque toute réévaluation future de son intégrité. La politique planifie également une réactivation de la destination après la période configurée. La réactivation consiste à réinitialiser l'état d'intégrité passif d'Unhealthy vers la valeur initiale Unknown, ce qui rend de nouveau la destination éligible au trafic.

Plusieurs paramètres de configuration à l'échelle du cluster contrôlent les contrôles d'intégrité passifs ; ils peuvent être définis soit dans le fichier de configuration, soit en code.

## Exemple de fichier

```json
"Clusters": {
   "cluster1": {
      "HealthCheck": {
         "Passive": {
             "Enabled": "true",
             "Policy": "TransportFailureRate",
             "ReactivationPeriod": "00:02:00"
         }
      },
      "Metadata": {
         "TransportFailureRateHealthPolicy.RateLimit": "0.5"
      },
      "Destinations": {
         "cluster1/destination1": {
             "Address": "https://localhost:10000/"
         },
         "cluster1/destination2": {
             "Address": "http://localhost:10010/"
         }
      }
   }
}
```

## Exemple de code

```csharp
var clusters = new[]
{
      new ClusterConfig()
      {
             ClusterId = "cluster1",
             HealthCheck = new HealthCheckConfig
             {
                   Passive = new PassiveHealthCheckConfig
                   {
                          Enabled = true,
                          Policy = HealthCheckConstants.PassivePolicy.TransportFailureRate,
                          ReactivationPeriod = TimeSpan.FromMinutes(2)
                   }
             },
             Metadata = new Dictionary<string, string> { {
TransportFailureRateHealthPolicyOptions.FailureRateLimitMetadataName, "0.5" } },
             Destinations =
             {
                   { "destination1", new DestinationConfig() { Address =
"https://localhost:10000" } },
                   { "destination2", new DestinationConfig() { Address =
"https://localhost:10010" } }
             }
                 }
          };
```

## Configuration

Les paramètres de contrôle d'intégrité passif sont spécifiés au niveau du cluster, dans la section Cluster/HealthCheck/Passive. Ils peuvent également être définis en code via les types correspondants de l'espace de noms Yarp.ReverseProxy.Configuration, qui reflètent le contrat de configuration.

Les contrôles d'intégrité passifs nécessitent l'ajout du PassiveHealthCheckMiddleware dans le pipeline pour fonctionner. La méthode par défaut MapReverseProxy(this IEndpointRouteBuilder endpoints) le fait automatiquement, mais en cas de construction manuelle du pipeline, la méthode UsePassiveHealthChecks doit être appelée pour ajouter ce middleware, comme illustré dans l'exemple ci-dessous.

```csharp
   endpoints.MapReverseProxy(proxyPipeline =>
   {
          proxyPipeline.UseAffinitizedDestinationLookup();
          proxyPipeline.UseProxyLoadBalancing();
          proxyPipeline.UseRequestAffinitizer();
          proxyPipeline.UsePassiveHealthChecks();
   });
Cluster/HealthCheck/Passive section and PassiveHealthCheckConfig:
       Enabled - flag indicating whether passive health check is enabled for a cluster. Default
        false
       Policy - name of a policy evaluating destinations' passive health states. Mandatory
      parameter
       ReactivationPeriod - period after which an unhealthy destination's passive health state is
      reset to Unknown and it starts receiving traffic again. Default value is null which means
      the period will be set by a IPassiveHealthCheckPolicy
```

## Politiques intégrées

Il existe actuellement une seule politique de contrôle d'intégrité passif intégrée : TransportFailureRateHealthPolicy. Elle calcule le taux d'échec des requêtes transférées pour chaque destination et la marque comme non saine si la limite spécifiée est dépassée. Le taux est calculé comme le pourcentage de requêtes en échec par rapport au nombre total de requêtes transférées vers une destination sur une période donnée. Les compteurs d'échecs et de total sont suivis dans une fenêtre glissante, ce qui signifie que seules les mesures récentes entrant

dans la fenêtre sont prises en compte. Il existe deux jeux de paramètres de politique définis globalement

et au niveau de chaque cluster.

Les paramètres globaux sont définis via le mécanisme d'options, à l'aide du type TransportFailureRateHealthPolicyOptions, qui expose les propriétés suivantes :

DetectionWindowSize - period of time while detected failures are kept and taken into account in the rate calculation. Default is 00:01:00 . MinimalTotalCountThreshold - minimal total number of requests which must be proxied to a destination within the detection window before this policy starts evaluating the destination's health and enforcing the failure rate limit. Default is 10 . DefaultFailureRateLimit - default failure rate limit for a destination to be marked as unhealthy that is applied if it's not set on a cluster's metadata. The value is in range (0,1) . Default is 0.3 (30%).

Les options globales de la politique peuvent être définies en code comme suit :

```csharp
services.Configure<TransportFailureRateHealthPolicyOptions>(o =>
{
      o.DetectionWindowSize = TimeSpan.FromSeconds(30);
      o.MinimalTotalCountThreshold = 5;
      o.DefaultFailureRateLimit = 0.5;
});
Cluster-specific parameters are set in the cluster's metadata as follows:
TransportFailureRateHealthPolicy.RateLimit - failure rate limit for a destination to be marked
as unhealthy. The value is in range (0,1) . Default value is provided by the global
DefaultFailureRateLimit parameter.
```

## Conception

Le composant principal est PassiveHealthCheckMiddleware, qui se situe dans le pipeline de requêtes et analyse les réponses renvoyées par les destinations. Pour chaque réponse provenant d'une destination appartenant à un cluster dont les contrôles d'intégrité passifs sont activés, PassiveHealthCheckMiddleware invoque un IPassiveHealthCheckPolicy spécifié pour le cluster. La politique analyse la réponse donnée, évalue le nouvel état d'intégrité passif de la destination et appelle IDestinationHealthUpdater pour effectivement mettre à jour la valeur DestinationHealthState.Passive. La mise à jour se fait de manière asynchrone en arrière-plan et ne bloque pas le pipeline de requêtes. Lorsqu'une destination est marquée comme non saine, elle cesse de recevoir de nouvelles requêtes jusqu'à sa réactivation après une période configurée. La réactivation signifie que l'état DestinationHealthState.Passive de la destination est réinitialisé depuis

Unhealthy vers Unknown, et la liste des destinations saines du cluster est reconstruite pour l'inclure de nouveau. Une

réactivation est planifiée par IDestinationHealthUpdater juste après avoir défini l'état de la destination

DestinationHealthState.Passive sur Unhealthy .

(Response to a proxied request) |

PassiveHealthCheckMiddleware | V

IPassiveHealthCheckPolicy |

(Evaluate new passive health state) |

IDestinationHealthUpdater --(Asynchronously update passive state)--> DestinationState.Health.Passive

| V (Schedule a reactivation) --(Set to Unknown)--> DestinationState.Health.Passive

## Extensibilité

Le sous-système de contrôle d'intégrité passif comporte un principal point d'extensibilité, IPassiveHealthCheckPolicy .

## IPassiveHealthCheckPolicy

IPassiveHealthCheckPolicy analyse la façon dont une destination a répondu à une requête client transférée, évalue son nouvel état d'intégrité passif, puis appelle IDestinationHealthUpdater.SetPassiveAsync pour créer une tâche asynchrone qui met effectivement à jour l'état d'intégrité passif et reconstruit la collection des destinations saines.

Voici un exemple simple d'un IPassiveHealthCheckPolicy personnalisé qui marque une destination comme Unhealthy dès la première réponse en échec à une requête transférée.

C# 10/13

public class FirstUnsuccessfulResponseHealthPolicy : IPassiveHealthCheckPolicy {

private static readonly TimeSpan _defaultReactivationPeriod = TimeSpan.FromSeconds(60);

private readonly IDestinationHealthUpdater _healthUpdater;

public FirstUnsuccessfulResponseHealthPolicy(IDestinationHealthUpdater

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks?view=aspnetcore-9.0

healthUpdater)

{

_healthUpdater = healthUpdater;

}

public string Name => "FirstUnsuccessfulResponse";

public void RequestProxied(HttpContext context, ClusterState cluster, DestinationState destination)

{ var error = context.Features.Get<IForwarderErrorFeature>(); if (error is not null) { var reactivationPeriod =

cluster.Model.Config.HealthCheck?.Passive?.ReactivationPeriod ?? _defaultReactivationPeriod;

_healthUpdater.SetPassive(cluster, destination, DestinationHealth.Unhealthy, reactivationPeriod);

} } }

## Collection des destinations disponibles

L'état d'intégrité des destinations est utilisé pour déterminer lesquelles sont éligibles à la réception des requêtes transférées. Chaque cluster maintient sa propre liste de destinations disponibles dans la propriété AvailableDestinations du type ClusterDestinationState. Cette liste est reconstruite chaque fois que l'état d'intégrité d'une destination change. L'IClusterDestinationsUpdater contrôle ce processus et appelle un IAvailableDestinationsPolicy configuré sur le cluster pour choisir effectivement les destinations disponibles parmi l'ensemble des destinations du cluster. Les politiques intégrées suivantes sont fournies, et des politiques personnalisées peuvent être implémentées si nécessaire.

HealthyAndUnknown - examine chaque DestinationState et l'ajoute à la liste des destinations disponibles si toutes les conditions suivantes sont VRAIES. Si aucune destination n'est disponible, les requêtes recevront une erreur 503.

Les contrôles d'intégrité actifs sont désactivés sur le cluster OU DestinationHealthState.Active !=

DestinationHealth.Unhealthy

Les contrôles d'intégrité passifs sont désactivés sur le cluster OU DestinationHealthState.Passive

!= DestinationHealth.Unhealthy

HealthyOrPanic - appelle d'abord la politique HealthyAndUnknown pour obtenir les destinations disponibles. Si aucune n'est renvoyée par cet appel, elle marque toutes les destinations du cluster comme disponibles. Il s'agit de la politique par défaut.

:::note
Une politique de destinations disponibles configurée sur un cluster est toujours appelée, que des contrôles d'intégrité soient activés ou non sur ce cluster. L'état d'intégrité d'un contrôle
:::

désactivé est défini sur Unknown .

## Configuration

## Exemple de fichier

```json
   "Clusters": {
       "cluster1": {
          "HealthCheck": {
             "AvailableDestinationsPolicy": "HealthyOrPanic",
             "Passive": {
                 "Enabled": "true"
             }
          },
          "Destinations": {
             "cluster1/destination1": {
                 "Address": "https://localhost:10000/"
             },
             "cluster1/destination2": {
                 "Address": "http://localhost:10010/"
             }
          }
       }
   }
    Code example                                                                                                 12/13
```

```csharp
          var clusters = new[]
          {
                 new ClusterConfig()
                 {
                       ClusterId = "cluster1",
                       HealthCheck = new HealthCheckConfig
                       {
                              AvailableDestinationsPolicy =
          HealthCheckConstants.AvailableDestinations.HealthyOrPanic,
                              Passive = new PassiveHealthCheckConfig
                              {
                                     Enabled = true
                              }
                       },
                       Destinations =
                       {
                              { "destination1", new DestinationConfig() { Address =
          "https://localhost:10000" } },
https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks?view=aspnetcore-9.0
                      { "destination2", new DestinationConfig() { Address =
"https://localhost:10010" } }
                   }
    }
};
 Note: The author created this article with assistance from AI. Learn more
```
