---
slug: https-tls
title: HTTPS et TLS
lede: >-
  HTTPS (HTTP sur des connexions chiffrées TLS) est le moyen standard d'effectuer des requêtes
  HTTP sur
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/https-tls
lastUpdated: 2026-08-11
---

HTTPS (HTTP sur des connexions chiffrées TLS) est le moyen standard d'effectuer des requêtes HTTP sur Internet pour des raisons de sécurité, d'intégrité et de confidentialité. Plusieurs aspects liés à HTTPS/TLS doivent être pris en compte lors de l'utilisation d'un proxy inverse comme YARP.

## Terminaison TLS

YARP est un proxy HTTP de niveau 7, ce qui signifie que les connexions HTTPS/TLS entrantes sont entièrement déchiffrées par le proxy afin qu'il puisse traiter et transférer les requêtes HTTP. C'est ce qu'on appelle communément la terminaison TLS. Les connexions sortantes vers la ou les destinations peuvent être chiffrées ou non, selon la configuration fournie.

Tunneling TLS (CONNECT)

Le tunneling TLS utilisant la méthode CONNECT est une fonctionnalité permettant de transférer des requêtes sans les déchiffrer. Cette fonctionnalité n'est pas prise en charge par YARP et il n'est pas prévu de l'ajouter.

## Configuration des connexions entrantes

YARP peut s'exécuter sur l'ensemble des serveurs ASP.NET Core, et la configuration de HTTPS/TLS pour les connexions entrantes est spécifique à chaque serveur. Consultez la documentation de Kestrel, IIS et Http.Sys pour les détails de configuration.

## Filtres TLS avancés avec Kestrel

Kestrel prend en charge l'interception des connexions entrantes avant la négociation TLS (handshake). YARP inclut une API TlsFrameHelper capable d'analyser la négociation TLS brute et de vous permettre de collecter une télémétrie personnalisée ou de rejeter les connexions de manière anticipée. Ces API ne peuvent ni modifier la négociation TLS ni déchiffrer le flux de données. Voir cet exemple .

## Configuration des connexions sortantes

Pour activer le chiffrement TLS lors de la communication avec une destination, spécifiez l'adresse de destination avec le schéma https, par exemple \"https://destinationHost\" . Consultez la documentation de configuration pour des exemples.

Le nom d'hôte spécifié dans l'adresse de destination sera utilisé pour la négociation TLS par

défaut, y compris pour le SNI et la validation du certificat serveur. Si le transfert de l'en-tête d'hôte d'origine est

activé, cette valeur sera utilisée à la place pour la négociation TLS. Si une valeur d'hôte personnalisée doit

être utilisée, employez la transformation RequestHeader pour définir l'en-tête d'hôte.

Les connexions sortantes vers les destinations sont gérées par HttpClient/SocketsHttpHandler. Une instance et des paramètres différents peuvent être configurés par cluster. Certains paramètres sont disponibles dans le modèle de configuration, tandis que d'autres ne peuvent être configurés que dans le code. Consultez la documentation HttpClient pour plus de détails.

Les certificats des serveurs de destination doivent être approuvés par le proxy, ou une validation personnalisée doit être appliquée via la configuration de HttpClient.

:::note
Cet article a été rédigé avec l'aide de l'IA. En savoir plus
:::
