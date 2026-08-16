---
slug: authn-authz
title: Authentification et autorisation
lede: >-
  Le proxy inverse peut être utilisé pour authentifier et autoriser les requêtes avant qu'elles ne
  soient transférées
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/authn-authz
lastUpdated: 2026-08-11
---

## Authentification et autorisation YARP

## Introduction

Le proxy inverse peut être utilisé pour authentifier et autoriser les requêtes avant qu'elles ne soient transférées vers les serveurs de destination. Cela permet de réduire la charge sur les serveurs de destination, d'ajouter une couche de protection et de garantir une application cohérente des stratégies dans l'ensemble de vos applications.

## Comportement par défaut

Aucune authentification ni autorisation n'est effectuée sur les requêtes, sauf si elle est activée dans la configuration de la route ou de l'application.

## Configuration

Les stratégies d'autorisation peuvent être spécifiées par route via RouteConfig.AuthorizationPolicy et peuvent être liées à partir des sections Routes du fichier de configuration. Comme pour les autres propriétés de route, cette configuration peut être modifiée et rechargée sans redémarrer le proxy. Les noms de stratégie ne respectent pas la casse.

Exemple :

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "AuthorizationPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
          }
      },
      "Clusters": {
          "cluster1": {
             "Destinations": {
                "cluster1/destination1": {
                    "Address": "https://localhost:10001/"
                }
             }
          }
      }
             }
          }
Authorization policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core authentication and authorization components.
Authorization policies can be configured in the application as follows:
   services.AddAuthorization(options =>
   {
          options.AddPolicy("customPolicy", policy =>
                 policy.RequireAuthenticatedUser());
   });
In Program.cs add the Authorization and Authentication middleware.
   app.UseAuthentication();
   app.UseAuthorization();
   app.MapReverseProxy();
See the Authentication docs for setting up your preferred kind of authentication.
Special values:
In addition to custom policy names, there are two special values that can be specified in a
route's authorization parameter: default and anonymous . ASP.NET Core also has a
FallbackPolicy setting that applies to routes that do not specify a policy.
```

## DefaultPolicy

Spécifier la valeur default dans le paramètre d'autorisation d'une route signifie que cette route utilisera la stratégie définie dans AuthorizationOptions.DefaultPolicy. Cette stratégie est préconfigurée pour exiger des utilisateurs authentifiés.

## Anonymous

Spécifier la valeur anonymous dans le paramètre d'autorisation d'une route signifie que cette route n'exigera

aucune autorisation, quelle que soit la configuration de l'application, comme par exemple la

FallbackPolicy.

## FallbackPolicy

AuthorizationOptions.FallbackPolicy est la stratégie qui sera utilisée pour toute requête ou route qui n'a pas été configurée avec une stratégie. FallbackPolicy n'a pas de valeur par défaut : toute requête sera autorisée.

## Propagation des informations d'identification

Même après qu'une requête a été autorisée par le proxy, le serveur de destination peut encore avoir besoin de savoir qui est l'utilisateur (authentification) et ce qu'il est autorisé à faire (autorisation). La façon de propager ces informations dépend du type d'authentification utilisé.

## Cookie, bearer, clés API

Ces types d'authentification transmettent déjà leurs valeurs dans les en-têtes de requête, et celles-ci seront propagées par défaut vers le serveur de destination. Ce serveur devra tout de même vérifier et interpréter ces valeurs, ce qui entraîne un certain travail redondant.

## OAuth2, OpenIdConnect, WsFederation

Ces protocoles sont couramment utilisés avec des fournisseurs d'identité distants. Le processus d'authentification peut être configuré dans l'application proxy et se traduit par un cookie d'authentification. Ce cookie sera transmis au serveur de destination comme un en-tête de requête normal.

## Windows, Negotiate, NTLM, Kerberos

Ces types d'authentification sont souvent liés à une connexion spécifique. Ils ne sont pas pris en charge comme moyen d'authentifier un utilisateur auprès d'un serveur de destination situé derrière le proxy YARP (voir #166 . Ils peuvent être utilisés pour authentifier une requête entrante auprès du proxy, mais ces informations d'identité devront être communiquées au serveur de destination sous une autre forme. Ils peuvent également être utilisés pour authentifier le proxy auprès des serveurs de destination, mais uniquement en tant qu'utilisateur propre du proxy ; l'emprunt d'identité du client n'est pas pris en charge.

## Certificats client

Les certificats client sont une fonctionnalité TLS et sont négociés dans le cadre d'une connexion. Consultez cette documentation

pour plus d'informations. Le certificat peut être transmis au serveur de destination sous la forme d'un

en-tête HTTP à l'aide de la transformation ClientCert.

## Substitution des types d'authentification

Les types d'authentification tels que Windows, qui ne se propagent pas naturellement vers le serveur de destination, doivent être convertis par le proxy sous une autre forme. Par exemple, un jeton porteur JWT peut être créé avec les informations de l'utilisateur et défini sur la requête du proxy.

Ces conversions peuvent être effectuées à l'aide de transformations de requête personnalisées. Des exemples détaillés pourront être développés pour des scénarios spécifiques si l'intérêt de la communauté est suffisant. Nous avons besoin de davantage de retours de la communauté sur la façon dont vous souhaitez convertir et propager les informations d'identité.

:::note
Cet article a été rédigé avec l'aide de l'IA. En savoir plus
:::
