---
slug: ab-testing
title: A/B-Tests & schrittweise Upgrades
lede: >-
  A/B-Tests und schrittweise Upgrades erfordern Verfahren zur dynamischen Zuweisung eingehenden
  Datenverkehrs
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/ab-testing
lastUpdated: 2026-08-11
---

## YARP-A/B-Tests und schrittweise Upgrades

## Einführung

A/B-Tests und schrittweise Upgrades erfordern Verfahren zur dynamischen Zuweisung eingehenden Datenverkehrs, um Änderungen in der Zielanwendung zu bewerten. YARP verfügt über kein integriertes Modell dafür, stellt jedoch einige Infrastruktur bereit, die zum Aufbau eines solchen Systems nützlich ist. Weitere Details zu diesem Szenario finden Sie in Issue #126.

## Beispiel

app.MapReverseProxy(proxyPipeline => {

// Custom cluster selection proxyPipeline.Use((context, next) => {

var lookup = context.RequestServices.GetRequiredService<IProxyStateLookup> ();

if (lookup.TryGetCluster(ChooseCluster(context), out var cluster)) {

context.ReassignProxyRequest(cluster); }

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); });

string ChooseCluster(HttpContext context) {

// Decide which cluster to use. This could be random, weighted, based on head- ers, etc.

return Random.Shared.Next(2) == 1 ? "cluster1" : "cluster2"; }

## Verwendung

Dieses Szenario verwendet zwei APIs, IProxyStateLookup und ReassignProxyRequest, die von einer benutzerdefinierten Proxy-Middleware aufgerufen werden, wie im vorstehenden Beispiel gezeigt.

IProxyStateLookup ist ein Dienst, der im Dependency Injection-Container verfügbar ist und

zum Nachschlagen oder Auflisten der aktuellen Routen und Cluster verwendet werden kann. Beachten Sie, dass sich diese Daten ändern können, wenn sich die

Konfiguration ändert. Ein A/B-Orchestrierungsalgorithmus kann die Anforderung untersuchen, entscheiden, an welchen

Cluster sie gesendet werden soll, und diesen Cluster anschließend über IProxyStateLookup.TryGetCluster abrufen.

Sobald der Cluster ausgewählt wurde, kann ReassignProxyRequest aufgerufen werden, um die Anforderung diesem Cluster zuzuweisen. Dadurch wird das IReverseProxyFeature mit den neuen Cluster- und Zielinformationen aktualisiert, die der Rest der Proxy-Middlewarepipeline zur Verarbeitung der Anforderung benötigt.

## Sitzungsaffinität

:::note
dass die Sitzungsaffinitätsfunktion zwischen Middleware, die ihre Einstellungen aus dem aktuellen Cluster liest, und Transforms, die Teil der ursprünglichen Route sind, aufgeteilt ist. Für A/B-Tests verwendete Cluster sollten dieselbe Sitzungsaffinitätskonfiguration verwenden, um Konflikte zu vermeiden.
:::

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
