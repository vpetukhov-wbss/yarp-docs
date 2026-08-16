---
slug: grpc
title: Proxy gRPC
lede: >-
  gRPC est un framework d'appel de procédure distante (RPC) indépendant du langage et hautement
  performant. Il est
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/grpc
lastUpdated: 2026-08-11
---

## Introduction

gRPC est un framework d'appel de procédure distante (RPC) indépendant du langage et hautement performant. Il repose sur HTTP/2 et peut être proxifié par YARP. Bien que YARP n'ait pas besoin de comprendre les messages gRPC, vous devez vous assurer que le bon protocole HTTP est activé. gRPC nécessite HTTP/2 et les appels gRPC échoueront si YARP n'est pas configuré correctement pour envoyer et recevoir des requêtes HTTP/2.

## Configurer les protocoles entrants de YARP

gRPC nécessite HTTP/2 dans la plupart des scénarios. HTTP/1.1 et HTTP/2 sont activés par défaut sur les serveurs ASP.NET Core (la façade de YARP), mais ils nécessitent le protocole https (TLS) pour HTTP/2 ; YARP doit donc être à l'écoute sur une URL https://.

HTTP/2 sur http (sans TLS) n'est pris en charge que par Kestrel et nécessite des paramètres spécifiques. Pour plus d'informations, consultez Services gRPC avec ASP.NET Core.

Cet exemple montre comment configurer Kestrel pour utiliser HTTP/2 sur http (sans TLS) :

```json
   {
       "Kestrel": {
          "Endpoints": {
             "http": {
                 "Url": "http://localhost:5000",
                 "Protocols": "Http2"
             }
          }
       }
   }
```

## Configurer les protocoles sortants de YARP

YARP négocie automatiquement HTTP/1.1 ou HTTP/2 pour les requêtes de proxy sortantes, mais uniquement pour https (TLS). HTTP/2 sur http (sans TLS) nécessite des paramètres supplémentaires. Notez que les protocoles sortants sont indépendants des protocoles entrants. Par exemple, https peut être utilisé pour la connexion entrante

et http pour la connexion sortante ; on parle alors de terminaison TLS. Pour les détails de configuration,

consultez la configuration du client HTTP de YARP.

L'exemple suivant montre comment configurer la requête de proxy sortante pour utiliser HTTP/2 :

```json
"cluster1": {
   "HttpRequest": {
      "Version": "2",
      "VersionPolicy": "RequestVersionExact"
   },
   "Destinations": {
      "cluster1/destination1": {
          "Address": "http://localhost:6000/"
      }
   }
},
```

## gRPC-Web

gRPC-Web est un format de sérialisation alternatif pour gRPC, compatible avec HTTP/1.1.

application/grpc : gRPC sur HTTP/2 est la façon dont gRPC est habituellement utilisé. application/grpc-web : gRPC-Web modifie le protocole gRPC pour le rendre compatible avec HTTP/1.1. gRPC-Web peut être utilisé dans davantage de contextes. Il peut être utilisé par des applications de navigateur et dans des réseaux qui ne prennent pas entièrement en charge HTTP/2. Deux fonctionnalités avancées de gRPC ne sont pas prises en charge : le streaming côté client et le streaming bidirectionnel.

gRPC-Web peut être proxifié par la configuration par défaut de YARP, sans aucune considération particulière.

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
