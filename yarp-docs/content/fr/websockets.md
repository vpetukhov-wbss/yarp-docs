---
slug: websockets
title: WebSockets et SPDY
lede: >-
  YARP permet de proxifier par défaut les connexions WebSocket et SPDY. Cette prise en charge
  fonctionne avec
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/websockets
lastUpdated: 2026-08-11
---

## Proxy des WebSockets et de SPDY par YARP

## Introduction

YARP permet de proxifier par défaut les connexions WebSocket et SPDY. Cette prise en charge fonctionne aussi bien avec l'approche de transfert direct qu'avec le pipeline complet.

WebSockets est un protocole de streaming bidirectionnel construit sur HTTP/1.1, puis adapté à HTTP/2.

SPDY est le précurseur de HTTP/2 et est couramment utilisé dans les environnements Kubernetes.

## Mises à niveau HTTP/1.1

WebSockets et SPDY reposent sur HTTP/1.1 grâce à une fonctionnalité appelée mise à niveau de connexion (connection upgrade). YARP proxifie la requête initiale et, si le serveur de destination répond par 101 Switching Protocols, met à niveau la connexion vers un flux bidirectionnel opaque utilisant le nouveau protocole. YARP ne prend pas en charge de cette façon la mise à niveau vers d'autres protocoles comme HTTP/2.

## HTTP/2

YARP prend en charge les WebSockets sur HTTP/2 depuis .NET 7 et YARP 2.0. Kestrel est le seul serveur AspNetCore disponible qui accepte les requêtes WebSocket entrantes en HTTP/2, et cette prise en charge est activée automatiquement. Les navigateurs peuvent détecter cette prise en charge annoncée par le serveur et basculer automatiquement vers HTTP/2.

Les versions du protocole entrant et sortant n'ont pas besoin de correspondre. La requête WebSocket entrante peut être en HTTP/1.1 ou 2. Il n'existe aucune configuration spécifique aux WebSockets pour les requêtes sortantes : YARP utilise les propriétés Version et VersionPolicy de ForwarderRequestConfig pour déterminer la version sortante à utiliser. Elles valent par défaut HTTP/2 et RequestVersionOrLower.

Les WebSockets nécessitent des en-têtes HTTP différents pour HTTP/2 ; YARP ajoute et supprime donc ces en-têtes selon les besoins lors de l'adaptation entre les différentes versions.

Après la négociation initiale, les WebSockets fonctionnent de la même manière sur les deux versions de HTTP.

## Délai d'expiration

Les délais d'expiration des requêtes HTTP (.NET 8 et versions ultérieures) peuvent s'appliquer à toutes les requêtes par défaut ou selon une stratégie.

Ces délais d'expiration sont désactivés après une négociation WebSocket. Ils continuent toutefois de s'appliquer aux

requêtes gRPC. Pour en savoir plus sur la configuration, consultez Délais d'expiration des requêtes.

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
