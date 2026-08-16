---
slug: transforms
title: Présentation
lede: >-
  Lors du proxying d'une requête, il est courant de modifier certaines parties de la requête ou de
  la réponse pour s'adapter
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms
lastUpdated: 2026-08-11
---

## Transformations de requête et de réponse YARP

## Introduction

Lors du proxying d'une requête, il est courant de modifier certaines parties de la requête ou de la réponse pour s'adapter aux exigences du serveur de destination, ou pour transmettre des données supplémentaires telles que l'adresse IP d'origine du client. Ce mécanisme est mis en œuvre via les transformations (Transforms). Les types de transformations sont définis globalement pour l'application, puis chaque route fournit les paramètres permettant d'activer et de configurer ces transformations. Les objets de requête d'origine ne sont pas modifiés par ces transformations, seules les requêtes du proxy le sont.

Les transformations du corps de la requête et de la réponse ne sont pas fournies par YARP, mais vous pouvez écrire un middleware pour le faire.

## Valeurs par défaut

Les transformations suivantes sont activées par défaut pour toutes les routes. Elles peuvent être configurées ou désactivées comme indiqué plus loin dans ce document.

Host - Supprime l'en-tête Host de la requête entrante. La requête du proxy utilisera par défaut le nom d'hôte spécifié dans l'adresse du serveur de destination. Voir RequestHeaderOriginalHost ci-dessous. X-Forwarded-For - Définit l'adresse IP du client dans l'en-tête X-Forwarded-For. Voir X-Forwarded ci-dessous. X-Forwarded-Proto - Définit le schéma d'origine de la requête (http/https) dans l'en-tête X-Forwarded-Proto. Voir X-Forwarded ci-dessous. X-Forwarded-Host - Définit le Host d'origine de la requête dans l'en-tête X-Forwarded-Host. Voir X-Forwarded ci-dessous. X-Forwarded-Prefix - Définit le PathBase d'origine de la requête, le cas échéant, dans l'en-tête X-Forwarded-Prefix. Voir X-Forwarded ci-dessous.

Par exemple, la requête entrante suivante adressée à http://IncomingHost:5000/path :

GET /path HTTP/1.1 Host: IncomingHost:5000 Accept: */* header1: foo

serait transformée puis relayée au serveur de destination https://DestinationHost:6000/ de la

manière suivante avec ces valeurs par défaut :

GET /path HTTP/1.1 Host: DestinationHost:6000 Accept: */* header1: foo X-Forwarded-For: 5.5.5.5 X-Forwarded-Proto: http X-Forwarded-Host: IncomingHost:5000

## Catégories de transformations

Les transformations se répartissent en quelques catégories : Request, Response et Response Trailers. Les trailers de requête ne sont pas pris en charge, car ils ne le sont pas par le HttpClient sous-jacent.

Si l'ensemble des transformations intégrées ne suffit pas, des transformations personnalisées peuvent être ajoutées via les points d'extensibilité.

## Ajouter des transformations

Des transformations peuvent être ajoutées aux routes soit par la configuration, soit par programmation.

## Depuis la configuration

Les transformations peuvent être configurées sur RouteConfig.Transforms et liées depuis les sections Routes du fichier de configuration. Elles peuvent être modifiées et rechargées sans redémarrer le proxy. Une transformation est configurée à l'aide d'une ou plusieurs paires clé-valeur de type chaîne.

Voici un exemple des transformations les plus courantes :

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Hosts": [ "localhost" ]
             },
             "Transforms": [
                { "PathPrefix": "/apis" },
                          {
                             "RequestHeader": "header1",
                             "Append": "bar"
                          },
                          {
                             "ResponseHeader": "header2",
                             "Append": "bar",
                             "When": "Always"
                          },
                          { "ClientCert": "X-Client-Cert" },
                          { "RequestHeadersCopy": "true" },
                          { "RequestHeaderOriginalHost": "true" },
                          {
                             "X-Forwarded": "Append",
                             "HeaderPrefix": "X-Forwarded-"
                          }
                      ]
                   },
                   "route2" : {
                      "ClusterId": "cluster1",
                      "Match": {
                          "Path": "/api/{plugin}/stuff/{**remainder}"
                      },
                      "Transforms": [
                          { "PathPattern": "/foo/{plugin}/bar/{**remainder}" },
                          {
                             "QueryValueParameter": "q",
                             "Append": "plugin"
                          }
                      ]
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                          "cluster1/destination1": {
                             "Address": "https://localhost:10001/Path/Base"
                          }
                      }
                   }
      }
   }
}
All configuration entries are treated as case-insensitive, though the destination server may
treat the resulting values as case sensitive or insensitive such as the path.
The details for these transforms are covered later in this document.
Developers that want to integrate their custom transforms with the Transforms section of
configuration can do so using ITransformFactory described below.
```

## Depuis le code

Des transformations peuvent être ajoutées aux routes par programmation en appelant la méthode AddTransforms.

AddTransforms peut être appelé après AddReverseProxy pour fournir un rappel (callback) permettant de configurer les transformations. Ce rappel est invoqué chaque fois qu'une route est construite ou reconstruite, ce qui permet au développeur d'inspecter les informations de RouteConfig et d'y ajouter des transformations de manière conditionnelle.

Le rappel AddTransforms fournit un TransformBuilderContext permettant d'ajouter ou de configurer des transformations. La plupart des transformations exposent des méthodes d'extension de TransformBuilderContext facilitant leur ajout. Ces extensions sont documentées plus loin, avec la description de chaque transformation.

Le TransformBuilderContext inclut également un IServiceProvider permettant d'accéder à tout service nécessaire.

```csharp
services.AddReverseProxy()
      .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
      .AddTransforms(builderContext =>
      {
             // Added to all routes.
             builderContext.AddPathPrefix("/prefix");
             // Conditionally add a transform for routes that require auth.
             if (!string.IsNullOrEmpty(builderContext.Route.AuthorizationPolicy))
             {
                    builderContext.AddRequestTransform(async transformContext =>
                    {
                          transformContext.ProxyRequest.Headers.Add("CustomHeader",
"CustomValue");
                    });
             }
      });
For more advanced control see ITransformProvider described below.
 Note: The author created this article with assistance from AI. Learn more
```
