---
slug: cors
title: Requêtes cross-origin (CORS)
lede: >-
  Le proxy inverse peut traiter les requêtes cross-origin avant qu'elles ne soient transférées
  vers la destination
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/cors
lastUpdated: 2026-08-11
---

## Introduction

Le proxy inverse peut traiter les requêtes cross-origin avant qu'elles ne soient transférées vers les serveurs de destination. Cela permet de réduire la charge sur les serveurs de destination et de garantir une application cohérente des stratégies dans l'ensemble de vos applications.

## Comportement par défaut

Les requêtes ne seront pas automatiquement mises en correspondance pour les requêtes de pré-vérification (preflight) CORS, sauf si cela est activé dans la configuration de la route ou de l'application.

## Configuration

Les stratégies CORS peuvent être spécifiées par route via RouteConfig.CorsPolicy et peuvent être liées à partir des sections Routes du fichier de configuration. Comme pour les autres propriétés de route, cette configuration peut être modifiée et rechargée sans redémarrer le proxy. Les noms de stratégie ne respectent pas la casse.

Exemple :

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "CorsPolicy": "customPolicy",
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
CORS policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides the
above configuration to specify a policy per route and the rest is handled by existing ASP.NET
Core CORS Middleware.
CORS policies can be configured in the application as follows:
   services.AddCors(options =>
   {
          options.AddPolicy("customPolicy", builder =>
          {
                 builder.AllowAnyOrigin();
          });
   });
Then add the CORS middleware.
   app.UseCors();
   app.MapReverseProxy();
```

## DefaultPolicy

Spécifier la valeur default dans le paramètre CorsPolicy d'une route signifie que cette route utilisera la stratégie définie dans CorsOptions.DefaultPolicy.

## Désactiver CORS

Spécifier la valeur disable dans le paramètre CorsPolicy d'une route signifie que le middleware CORS refusera les requêtes CORS.

:::note
Cet article a été rédigé avec l'aide de l'IA. En savoir plus
:::
