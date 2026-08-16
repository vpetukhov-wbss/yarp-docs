---
slug: header-guidelines
title: Recommandations sur les en-têtes HTTP
lede: >-
  Les en-têtes constituent une part très importante du traitement des requêtes HTTP, et chacun a
  sa propre
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-guidelines
lastUpdated: 2026-08-11
---

Les en-têtes constituent une part très importante du traitement des requêtes HTTP, et chacun possède sa propre sémantique et ses propres particularités. La plupart des en-têtes sont transférés par défaut, bien que certains, utilisés pour contrôler la manière dont la requête est acheminée, soient automatiquement ajustés ou supprimés par le proxy. Les connexions entre le client et le proxy, d'une part, et entre le proxy et la destination, d'autre part, sont indépendantes. Par conséquent, les en-têtes qui affectent la connexion et le transport doivent être filtrés. De nombreux en-têtes contiennent des informations telles que des noms de domaine, des chemins ou d'autres détails susceptibles d'être affectés lorsqu'un proxy inverse est intégré à l'architecture de l'application. Voici un ensemble de recommandations sur la manière dont certains en-têtes spécifiques peuvent être affectés et sur la conduite à tenir.

## Filtrage des en-têtes par YARP

YARP supprime automatiquement les en-têtes de requête et de réponse susceptibles de compromettre sa capacité à transférer correctement une requête, ou qui pourraient être utilisés de manière malveillante pour contourner certaines fonctionnalités du proxy. Une liste complète est disponible ici , et certains points marquants sont décrits ci-dessous.

## Connection , KeepAlive , Close

Ces en-têtes contrôlent la gestion de la connexion TCP et sont supprimés afin d'éviter d'affecter la connexion de l'autre côté du proxy.

## Transfer-Encoding

Cet en-tête décrit le format du corps de la requête ou de la réponse tel qu'il est transmis sur le réseau, par exemple « chunked », et il est supprimé car ce format peut varier entre la connexion interne et la connexion externe. Les piles HTTP entrante et sortante ajoutent les en-têtes de transport nécessaires.

## TE

Seule la valeur d'en-tête TE: trailers est autorisée à traverser le proxy, car elle est requise par certaines implémentations gRPC.

## Upgrade

Cet en-tête est utilisé pour des protocoles tels que WebSockets. Il est supprimé par défaut et n'est réintégré que pour les protocoles spécifiquement pris en charge (WebSockets, SPDY).

## Proxy-*

Il s'agit d'en-têtes utilisés avec les proxys, dont le transfert n'est pas jugé approprié.

## Alt-Svc

Cet en-tête de réponse est utilisé avec les mises à niveau HTTP/3 et ne s'applique qu'à la connexion immédiate.

## En-têtes de traçage distribué

Ces en-têtes incluent TraceParent , Request-Id , TraceState , Baggage , et Correlation- Context .

Ils sont automatiquement supprimés en fonction de DistributedContextPropagator.Fields, ce qui permet au HttpClient de transfert de les remplacer par des valeurs actualisées.

Vous pouvez désactiver la modification de ces en-têtes en définissant SocketsHttpHandler.ActivityHeadersPropagator sur null :

```csharp
   services.AddReverseProxy()
          .ConfigureHttpClient((_, handler) => handler.ActivityHeadersPropagator =
   null);
```

## Strict-Transport-Security

Cet en-tête indique aux clients de toujours utiliser HTTPS, mais un conflit peut survenir entre les valeurs fournies par le proxy et par la destination. Pour éviter toute confusion, la valeur de la destination n'est pas copiée dans la réponse si une valeur a déjà été ajoutée à la réponse par l'application proxy.

## Autres recommandations sur les en-têtes

## Host

L'en-tête Host indique à quel site du serveur la requête est destinée. Cet en-tête est supprimé par défaut, car le nom d'hôte utilisé publiquement par le proxy est susceptible de différer de celui utilisé par le service situé derrière le proxy. Ce comportement peut être configuré à l'aide de la transformation RequestHeaderOriginalHost.

## X-Forwarded-* , Forwarded

Étant donné qu'une connexion distincte est utilisée pour communiquer avec la destination, ces en-têtes de requête peuvent servir à transmettre des informations sur la connexion d'origine, telles que l'IP, le schéma, le port et le certificat client. X-Forwarded-For , X-Forwarded-Proto , X-Forwarded-Host , et X-Forwarded-Prefix sont activés par défaut. Ces informations pouvant faire l'objet d'attaques par usurpation, tous les en-têtes existants de la requête sont supprimés et remplacés par défaut. L'application de destination doit faire preuve de prudence quant au degré de confiance qu'elle accorde à ces valeurs. Consultez les transformations pour savoir comment les configurer dans le proxy. Pour des indications sur la configuration de l'application de destination afin qu'elle lise ces en-têtes, consultez Configurer ASP.NET Core pour fonctionner avec des serveurs proxy et des équilibreurs de charge.

## X-http-method-override , x-http-method , x-method-override

Certains clients et serveurs limitent les méthodes HTTP qu'ils autorisent (par exemple, GET). Ces en-têtes de requête sont parfois utilisés pour contourner ces restrictions. Ces en-têtes sont transférés par défaut. Si vous souhaitez empêcher ces contournements dans le proxy, utilisez la transformation RequestHeaderRemove.

## Set-Cookie

Cet en-tête de réponse peut contenir des champs qui restreignent certains aspects de l'URL, tels que le schéma, le domaine ou le chemin, où le cookie doit être utilisé. L'utilisation d'un proxy inverse peut modifier le schéma, le domaine ou le chemin effectif d'un site du point de vue public. Bien qu'il soit possible de réécrire les cookies de réponse à l'aide de transformations personnalisées , nous recommandons plutôt d'utiliser les en-têtes Forwarded décrits précédemment pour propager les valeurs correctes à l'application de destination afin qu'elle puisse générer les en-têtes set-cookie appropriés.

## Location

Cet en-tête de réponse est utilisé avec les redirections et peut contenir un schéma, un domaine et un chemin qui diffèrent des valeurs publiques en raison de l'utilisation du proxy. Bien qu'il soit possible de réécrire l'en-tête Location à l'aide de transformations personnalisées, il est recommandé d'utiliser plutôt les en-têtes Forwarded décrits ci-dessus pour propager les valeurs correctes à l'application de destination afin qu'elle puisse générer les en-têtes Location appropriés.

## Server

Cet en-tête de réponse indique quelle technologie de serveur a été utilisée pour générer la réponse (par exemple, IIS, Kestrel). Cet en-tête est transféré depuis la destination par défaut. Les applications qui souhaitent le supprimer peuvent utiliser la transformation ResponseHeaderRemove, auquel cas l'en-tête serveur par défaut du

proxy sera utilisé. La suppression de l'en-tête serveur par défaut du proxy est spécifique à chaque

serveur, comme c'est le cas pour Kestrel.

## X-Powered-By

Cet en-tête de réponse indique quel framework web a été utilisé pour générer la réponse (par exemple, ASP.NET). ASP.NET Core ne génère pas cet en-tête, mais IIS le peut. Cet en-tête est transféré depuis la destination par défaut. Les applications qui souhaitent le supprimer peuvent utiliser la transformation ResponseHeaderRemove.

:::note
Cet article a été rédigé avec l'aide de l'IA. En savoir plus
:::
