---
slug: ab-testing
title: Tests A/B et mises à niveau progressives
lede: >-
  Les tests A/B et les mises à niveau progressives nécessitent des procédures permettant
  d'affecter dynamiquement le trafic entrant
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/ab-testing
lastUpdated: 2026-08-11
---

## Tests A/B et mises à niveau progressives de YARP

## Introduction

Les tests A/B et les mises à niveau progressives nécessitent des procédures permettant d'affecter dynamiquement le trafic entrant afin d'évaluer les modifications apportées à l'application de destination. YARP ne propose pas de modèle intégré pour cela, mais expose une infrastructure utile pour créer un tel système. Consultez le problème (issue) #126 pour plus de détails sur ce scénario.

## Exemple

app.MapReverseProxy(proxyPipeline => {

// Custom cluster selection proxyPipeline.Use((context, next) => {

var lookup = context.RequestServices.GetRequiredService<IProxyStateLookup> ();

if (lookup.TryGetCluster(ChooseCluster(context), out var cluster)) {

context.ReassignProxyRequest(cluster); }

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); });

string ChooseCluster(HttpContext context) {

// Decide which cluster to use. This could be random, weighted, based on head- ers, etc.

return Random.Shared.Next(2) == 1 ? "cluster1" : "cluster2"; }

## Utilisation

Ce scénario utilise deux API, IProxyStateLookup et ReassignProxyRequest, appelées depuis un middleware de proxy personnalisé, comme illustré dans l'exemple ci-dessus.

IProxyStateLookup est un service disponible dans le conteneur d'injection de dépendances, qui permet de

rechercher ou d'énumérer les routes et clusters actuels. Notez que ces données peuvent changer si la

configuration change. Un algorithme d'orchestration A/B peut examiner la requête, décider vers quel

cluster l'envoyer, puis récupérer ce cluster via IProxyStateLookup.TryGetCluster .

Une fois le cluster sélectionné, ReassignProxyRequest peut être appelé pour affecter la requête à ce cluster. Cela met à jour l'IReverseProxyFeature avec les nouvelles informations de cluster et de destination nécessaires au reste du pipeline de middleware du proxy pour traiter la requête.

## Affinité de session

:::note
que la fonctionnalité d'affinité de session est répartie entre le middleware, qui lit ses paramètres à partir du cluster actuel, et les transformations, qui font partie de la route d'origine. Les clusters utilisés pour les tests A/B doivent utiliser la même configuration d'affinité de session afin d'éviter les conflits.
:::

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
