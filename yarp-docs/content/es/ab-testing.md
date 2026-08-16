---
slug: ab-testing
title: Pruebas A/B y actualizaciones progresivas
lede: >-
  Las pruebas A/B y las actualizaciones progresivas requieren procedimientos para asignar
  dinámicamente el tráfico entrante
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/ab-testing
lastUpdated: 2026-08-11
---

## Pruebas A/B y actualizaciones progresivas en YARP

## Introducción

Las pruebas A/B y las actualizaciones progresivas requieren procedimientos para asignar dinámicamente el tráfico entrante y así evaluar cambios en la aplicación de destino. YARP no incluye un modelo integrado para esto, pero sí expone infraestructura útil para construir un sistema de este tipo. Consulte el issue #126 para más información sobre este escenario.

## Ejemplo

`app.MapReverseProxy(proxyPipeline => {`

`// Custom cluster selection proxyPipeline.Use((context, next) => {`

`var lookup = context.RequestServices.GetRequiredService<IProxyStateLookup> ();`

`if (lookup.TryGetCluster(ChooseCluster(context), out var cluster)) {`

`context.ReassignProxyRequest(cluster); }`

`return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); });`

`string ChooseCluster(HttpContext context) {`

`// Decide which cluster to use. This could be random, weighted, based on head- ers, etc.`

`return Random.Shared.Next(2) == 1 ? "cluster1" : "cluster2"; }`

## Uso

Este escenario usa dos API, `IProxyStateLookup` y `ReassignProxyRequest`, invocadas desde un middleware de proxy personalizado, como se muestra en el ejemplo anterior.

`IProxyStateLookup` es un servicio disponible en el contenedor de inyección de dependencias que permite buscar o enumerar las rutas y los clústeres actuales (tenga en cuenta que estos datos pueden cambiar si la configuración cambia). Un algoritmo de orquestación A/B puede examinar la solicitud, decidir a qué clúster enviarla y, después, obtener ese clúster mediante `IProxyStateLookup.TryGetCluster`.

Una vez seleccionado el clúster, se puede llamar a `ReassignProxyRequest` para asignarle la solicitud. Esto actualiza el `IReverseProxyFeature` con la información del nuevo clúster y destino que el resto de la canalización de middleware del proxy necesita para gestionar la solicitud.

## Afinidad de sesión

:::note
La funcionalidad de afinidad de sesión se reparte entre el middleware, que lee su configuración a partir del clúster actual, y las transformaciones, que forman parte de la ruta original. Los clústeres usados para pruebas A/B deben usar la misma configuración de afinidad de sesión para evitar conflictos.
:::

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
