---
slug: destination-resolvers
title: Résolveurs de destination
lede: >-
  YARP utilise un résolveur de destination pour développer l'ensemble des adresses de destination
  configurées. Le
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/destination-resolvers
lastUpdated: 2026-08-11
---

## Extensibilité YARP : résolveurs de destination

## Introduction

YARP utilise un résolveur de destination pour développer l'ensemble des adresses de destination configurées. Le résolveur de destination peut être utilisé comme point d'intégration avec des systèmes de découverte de services.

## Structure

## IDestinationResolver possède une seule méthode

ResolveDestinationsAsync(IReadOnlyDictionary<string, DestinationConfig> destinations,

CancellationToken cancellationToken) qui doit retourner une instance de ResolvedDestinationCollection. ResolvedDestinationCollection contient une collection d'instances DestinationConfig, ainsi qu'un IChangeToken permettant de notifier au proxy que ces informations sont obsolètes et doivent être rechargées, ce qui provoquera un nouvel appel à ResolveDestinationsAsync.

## DestinationConfig

DestinationConfig possède une propriété Host qui permet de spécifier la valeur d'en-tête Host par défaut que le proxy doit utiliser lorsqu'il communique avec cette destination. Cela permet par exemple à IDestinationResolver de résoudre des destinations vers une collection d'adresses IP sans provoquer d'échec du SNI ou du routage basé sur l'hôte.

## Cycle de vie

## Démarrage

IDestinationResolver doit être inscrit dans le conteneur d'injection de dépendances en tant que singleton. Au démarrage, le proxy résout cette instance et appelle ResolveDestinationsAsync(...) avec les destinations configurées récupérées à partir des IProxyConfigProviders résolus. Lors de ce premier appel, le fournisseur peut choisir de :

Lever une exception si le fournisseur ne peut produire une configuration de proxy valide, quelle qu'en soit la raison. Cela empêchera l'application de démarrer. Résoudre les destinations de manière asynchrone. Cela empêchera l'application de démarrer tant que les destinations résolues ne sont pas disponibles.

Ou bien, il peut choisir de retourner une instance vide de ResolvedDestinationCollection pendant qu'il

résout les destinations en arrière-plan. Le fournisseur devra alors déclencher le

IChangeToken lorsque la configuration est disponible.

## Atomicité

Les objets et collections de destinations fournis au proxy doivent être en lecture seule et ne pas être modifiés une fois qu'ils ont été remis au proxy via GetConfig().

## Rechargement

Si IChangeToken prend en charge ActiveChangeCallbacks, une fois que le proxy a traité l'ensemble initial des destinations, il enregistre un rappel auprès de ce jeton. Si le fournisseur ne prend pas en charge les rappels, HasChanged est alors interrogé en parallèle des jetons de changement de IProxyConfig, toutes les 5 minutes.

Lorsque le fournisseur souhaite fournir un nouvel ensemble de destinations au proxy, il doit :

Résoudre ces destinations en arrière-plan. ResolvedDestinationCollection étant immuable, de nouvelles instances doivent être créées pour toute nouvelle donnée. Les objets des destinations inchangées peuvent être réutilisés, ou de nouvelles instances peuvent être créées.

Invalider le IChangeToken retourné par l'appel précédent à ResolveDestinationsAsync.

Une fois les nouvelles destinations appliquées, le proxy enregistre un rappel auprès du nouveau IChangeToken. Notez que si plusieurs rechargements sont signalés en succession rapprochée, le proxy peut en ignorer certains et résoudre les destinations dès qu'il est prêt.

## Résolveur de destination DNS

YARP inclut une implémentation de IDestinationResolver qui développe l'ensemble des destinations configurées en résolvant chaque nom d'hôte vers une ou plusieurs adresses IP via DNS, en créant une destination pour chaque IP résolue. Le résolveur de destination DNS peut être ajouté à votre reverse proxy à l'aide de la

IReverseProxyBuilder.AddDnsDestinationResolver(Action<DnsDestinationResolverOptions>)

méthode. Cette méthode accepte un délégué facultatif permettant de configurer les options du résolveur, DnsDestinationResolverOptions.

## Exemple

```csharp
// Add the DNS destination resolver, restricting results to IPv4 addresses
reverseProxyBuilder.AddDnsDestinationResolver(o => o.AddressFamily =
AddressFamily.InterNetwork);
```

## Configuration

Les options du résolveur de destination DNS, DnsDestinationResolverOptions, possèdent les propriétés suivantes :

## RefreshPeriod

L'intervalle entre deux demandes d'actualisation d'un nom résolu. La valeur par défaut est 5 minutes.

## AddressFamily

Vous pouvez éventuellement spécifier une valeur System.Net.Sockets.AddressFamily, AddressFamily.InterNetwork ou AddressFamily.InterNetworkV6, pour restreindre la résolution aux adresses IPv4 ou IPv6, respectivement. La valeur par défaut, null, indique au résolveur de ne pas restreindre la famille d'adresses des résultats et d'accepter toutes les adresses retournées.

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
