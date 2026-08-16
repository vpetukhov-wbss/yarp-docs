---
slug: ab-testing
title: A/B тестване и постепенни надграждания
lede: >-
  A/B тестването и постепенните надграждания изискват процедури за динамично разпределяне на
  входящия трафик
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/ab-testing
lastUpdated: 2026-08-11
---

## A/B тестване и постепенни надграждания в YARP

## Въведение

A/B тестването и постепенните надграждания изискват процедури за динамично разпределяне на входящия трафик, за да се оценят промените в приложението на дестинацията. YARP няма вграден модел за това, но предоставя инфраструктура, полезна за изграждането на подобна система. Вижте issue #126 за допълнителни подробности относно този сценарий.

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

## Използване

Този сценарий използва две API, IProxyStateLookup и ReassignProxyRequest, извиквани от персонализиран междинен софтуер за проксито, както е показано в примера по-горе.

IProxyStateLookup е услуга, налична в контейнера за Dependency Injection, която може да

се използва за търсене или изброяване на текущите маршрути и клъстери. Обърнете внимание, че тези данни могат да се променят, ако

конфигурацията се промени. Алгоритъм за A/B оркестрация може да разгледа заявката, да реши кой

клъстер да я обработи, и след това да извлече този клъстер чрез IProxyStateLookup.TryGetCluster .

След като клъстерът бъде избран, може да се извика ReassignProxyRequest, за да се присвои заявката на този клъстер. Това актуализира IReverseProxyFeature с новата информация за клъстера и дестинацията, необходима на останалата част от конвейера на междинния софтуер на проксито, за да обработи заявката.

## Афинитет на сесията

:::note
Функционалността за афинитет на сесията е разделена между междинния софтуер, който чете настройките си от текущия клъстер, и трансформациите, които са част от оригиналния маршрут. Клъстерите, използвани за A/B тестване, трябва да използват еднаква конфигурация за афинитет на сесията, за да се избегнат конфликти.
:::

:::note
Тази статия е създадена от автора с помощта на изкуствен интелект (AI). Научете повече
:::
