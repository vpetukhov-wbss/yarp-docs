---
slug: ab-testing
title: A/B-тестирование и поэтапные обновления
lede: >-
  Для A/B-тестирования и поэтапных обновлений нужны механизмы динамического распределения
  входящего трафика
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/ab-testing
lastUpdated: 2026-08-11
---

## A/B-тестирование и поэтапные обновления в YARP

## Введение

Для A/B-тестирования и поэтапных обновлений нужны механизмы динамического распределения входящего трафика, позволяющие оценивать изменения в приложении на стороне узла назначения. У YARP нет встроенной модели для этого, но он предоставляет часть инфраструктуры, полезной для построения такой системы. Дополнительные сведения об этом сценарии см. в issue #126.

## Пример

app.MapReverseProxy(proxyPipeline => {

// Custom cluster selection proxyPipeline.Use((context, next) => {

var lookup = context.RequestServices.GetRequiredService<IProxyStateLookup> ();

if (lookup.TryGetCluster(ChooseCluster(context), out var cluster)) {

context.ReassignProxyRequest(cluster); }

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); });

string ChooseCluster(HttpContext context) {

// Decide which cluster to use. This could be random, weighted, based on head- ers, etc.

return Random.Shared.Next(2) == 1 ? "cluster1" : "cluster2"; }

## Использование

В этом сценарии используются два API — IProxyStateLookup и ReassignProxyRequest, — вызываемые из пользовательского промежуточного ПО прокси, как показано в примере выше.

IProxyStateLookup — это служба, доступная в контейнере внедрения зависимостей, которую можно

использовать для поиска или перечисления текущих маршрутов и кластеров. Обратите внимание: эти данные могут изменяться при изменении

конфигурации. Алгоритм оркестрации A/B-тестирования может анализировать запрос, решать, в какой

кластер его отправить, а затем получать этот кластер через IProxyStateLookup.TryGetCluster .

После выбора кластера можно вызвать ReassignProxyRequest, чтобы назначить запросу этот кластер. Это обновляет IReverseProxyFeature новыми данными о кластере и узле назначения, необходимыми остальной части конвейера промежуточного ПО прокси для обработки запроса.

## Привязка сеансов

:::note
Функциональность привязки сеансов разделена между промежуточным ПО, которое считывает её настройки из текущего кластера, и преобразованиями, которые являются частью исходного маршрута. Чтобы избежать конфликтов, кластеры, используемые для A/B-тестирования, должны использовать одинаковую конфигурацию привязки сеансов.
:::

:::note
Эта статья создана автором при помощи ИИ. Подробнее.
:::
