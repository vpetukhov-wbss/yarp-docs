---
slug: httpsys-delegation
title: Délégation HTTP.sys
lede: >-
  La délégation HTTP.sys est une fonctionnalité de niveau noyau ajoutée dans les versions récentes
  de Windows, qui
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/httpsys-delegation
lastUpdated: 2026-08-11
---

## Introduction

La délégation HTTP.sys est une fonctionnalité de niveau noyau ajoutée dans les versions récentes de Windows, qui permet de transférer une requête de la file d'attente HTTP.sys du processus récepteur vers la file d'attente HTTP.sys d'un processus cible, avec très peu de surcharge ou de latence ajoutée. Pour que cette délégation fonctionne, le processus récepteur est uniquement autorisé à lire les en-têtes de la requête. Si la lecture du corps a déjà commencé ou qu'une réponse a déjà démarré, la tentative de délégation de la requête échoue. La réponse ne sera pas visible par le proxy après la délégation, ce qui limite les fonctionnalités des composants d'affinité de session et de contrôles d'intégrité passifs, ainsi que certains algorithmes de répartition de charge. En interne, YARP s'appuie sur l'IHttpSysRequestDelegationFeature d'ASP.NET Core

## Configuration requise

La délégation HTTP.sys nécessite :

Le serveur HTTP.sys d'ASP.NET Core Windows Server 2019 ou Windows 10 (build 1809) ou version ultérieure.

## Comportement par défaut

La délégation HTTP.sys n'est pas utilisée, sauf si elle est ajoutée au pipeline du proxy et activée dans la configuration de la destination.

## Configuration

La délégation HTTP.sys peut être activée par destination en ajoutant les métadonnées HttpSysDelegationQueue à la destination. La valeur de ces métadonnées doit être le nom de la file d'attente HTTP.sys cible. L'Address de la destination est utilisée pour spécifier le préfixe d'URL de la file d'attente HTTP.sys.

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Path": "{**catch-all}"
                      }
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                         "cluster1/destination1": {
                            "Address": "http://*:80/",
                            "Metadata": {
                               "HttpSysDelegationQueue": "TargetHttpSysQueueName"
                            }
                         }
                      }
                   }
      }
   }
}
In host configuration, configure the host to use the HTTP.sys server:
    C#
   webBuilder.UseHttpSys();
In application configuration, use the MapReverseProxy overload that allows you to customize
the pipeline and add HTTP.sys delegation by calling UseHttpSysDelegation :
```

```csharp
   app.MapReverseProxy(proxyPipeline =>
   {
          // Add the three middleware YARP adds by default plus the HTTP.sys
          // delegation middleware
          proxyPipeline.UseSessionAffinity(); // No affect on delegation destinations
          proxyPipeline.UseLoadBalancing();
          proxyPipeline.UsePassiveHealthChecks();
          proxyPipeline.UseHttpSysDelegation();
   });
```

## Durée de vie de la file d'attente de délégation

Lorsque YARP est configuré pour utiliser la délégation pour une destination, un handle est créé vers la file d'attente HTTP.sys spécifiée. Ce handle est maintenu actif tant que les destinations qui le référencent existent. Le nettoyage de ces handles est effectué lors du GC (garbage collection) ; il est donc possible que le nettoyage du handle soit retardé s'il se retrouve en génération 2 (Gen2). Cela peut poser des problèmes pour certains récepteurs lors du redémarrage du processus, car s'ils tentent de créer la file d'attente au démarrage, l'opération échoue puisqu'elle existe encore, YARP

détenant un handle dessus. Les récepteurs doivent être suffisamment intelligents pour s'y attacher à la place et reconfigurer correctement

la file d'attente. Le serveur HTTP.sys d'ASP.NET Core présente ce problème. Pour plus d'informations, consultez Http.sys

server should support setting up URL groups when attaching to an existing queue

(dotnet/aspnetcore #40359) .

YARP propose un moyen de réinitialiser son handle vers la file d'attente. Cela permet aux consommateurs d'écrire une logique personnalisée pour déterminer quand le handle vers la file d'attente doit être nettoyé.

Exemple :

```csharp
var delegator = app.Services.GetRequiredService<IHttpSysDelegator>();
delegator.ResetQueue("TargetHttpSysQueueName", "http://*:80");
 Note: The author created this article with assistance from AI. Learn more
```
