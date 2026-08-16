---
slug: middleware
title: Промежуточное ПО
lede: >-
  ASP.NET Core использует конвейер промежуточного ПО, чтобы разбить обработку запроса на отдельные
  этапы.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/middleware
lastUpdated: 2026-08-11
---

## Введение

ASP.NET Core использует конвейер промежуточного ПО, чтобы разбить обработку запроса на отдельные этапы. Разработчик приложения может добавлять промежуточное ПО и задавать его порядок по мере необходимости. Промежуточное ПО ASP.NET Core также используется для реализации и настройки функциональности реверс-прокси.

## Значения по умолчанию

В примере из руководства по началу работы показан следующий метод Configure. Он настраивает конвейер промежуточного ПО со средствами разработки, маршрутизацией и настроенными конечными точками прокси ( MapReverseProxy ).

```csharp
         var builder = WebApplication.CreateBuilder(args);
         builder.Services.AddReverseProxy()
                .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
         var app = builder.Build();
         app.MapReverseProxy();
         app.Run();
The parameterless MapReverseProxy() in ReverseProxyIEndpointRouteBuilderExtensions
overload includes all standard proxy middleware for session affinity, load balancing, passive
health checks, and the final proxying of the request. Each of these check the configuration of
the matched route, cluster, and destination and perform their task accordingly.
```

## Добавление промежуточного ПО

Промежуточное ПО, добавленное в конвейер приложения, будет видеть запрос на разных этапах обработки — в зависимости от того, где оно добавлено. Промежуточное ПО, добавленное перед UseRouting, увидит все запросы и сможет изменять их до того, как произойдёт маршрутизация. Промежуточное ПО, добавленное между UseRouting и UseEndpoints, может вызывать HttpContext.GetEndpoint(), чтобы проверить, с какой конечной точкой маршрутизация сопоставила запрос (если такая есть), и использовать любые метаданные, связанные с этой конечной точкой. Именно так обрабатываются аутентификация, авторизация и CORS.

ReverseProxyIEndpointRouteBuilderExtensions предоставляет перегрузку MapReverseProxy, которая позволяет построить конвейер промежуточного ПО, выполняющийся только для запросов, сопоставленных с настроенными

маршрутами прокси.

app.MapReverseProxy(proxyPipeline => {

proxyPipeline.Use((context, next) => {

## // Custom inline middleware

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); proxyPipeline.UsePassiveHealthChecks(); });

По умолчанию эта перегрузка MapReverseProxy включает только минимальную настройку, логику проксирования и применение ограничений в начале и конце своего конвейера. Промежуточное ПО для привязки сеансов, балансировки нагрузки и пассивных проверок работоспособности по умолчанию не включается, чтобы вы могли исключать его, заменять или управлять его порядком вместе с любым дополнительным промежуточным ПО.

## Настраиваемое промежуточное ПО прокси

Промежуточное ПО внутри конвейера MapReverseProxy имеет доступ ко всем данным и состоянию прокси, связанным с запросом (маршрут, кластер, узлы назначения и т. д.), через IReverseProxyFeature. Он доступен из HttpContext.Features или через метод расширения HttpContext.GetReverseProxyFeature() .

Данные в IReverseProxyFeature фиксируются в виде снимка конфигурации прокси в начале конвейера прокси и не будут затронуты изменениями конфигурации прокси, происходящими во время обработки запроса.

```csharp
   proxyPipeline.Use((context, next) =>
   {
          var proxyFeature = context.GetReverseProxyFeature();
          var cluster = proxyFeature.Cluster;
          var destinations = proxyFeature.AvailableDestinations;
          return next();
   });
```

## Что стоит делать с промежуточным ПО

Промежуточное ПО может формировать журналы, определять, будет ли запрос проксирован, влиять на то, куда он будет проксирован, а также добавлять дополнительные возможности, такие как обработка ошибок, повторные попытки и т. д.

## Журналы и метрики

Промежуточное ПО может проверять поля запроса и ответа, чтобы формировать журналы и агрегировать метрики. См. примечание о телах сообщений в разделе «Чего не стоит делать с промежуточным ПО» ниже.

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          LogRequest(context);
          await next();
          LogResponse(context);
   });
```

## Отправка немедленного ответа

Если промежуточное ПО проверяет запрос и определяет, что его не следует проксировать, оно может сформировать собственный ответ и вернуть управление серверу, не вызывая next() .

```csharp
   proxyPipeline.Use((context, next) =>
   {
          if (!CheckAllowedRequest(context, out var reason))
          {
                 context.Response.StatusCode = StatusCodes.Status400BadRequest;
                 return context.Response.WriteAsync(reason);
          }
          return next();
   });
```

## Фильтрация узлов назначения

Такое промежуточное ПО, как привязка сеансов и балансировка нагрузки, анализирует IReverseProxyFeature и конфигурацию кластера, чтобы решить, на какой узел назначения следует отправить запрос. AllDestinations перечисляет все узлы назначения в выбранном кластере.

AvailableDestinations перечисляет узлы назначения, которые в данный момент считаются пригодными для обработки

запроса. Изначально он равен AllDestinations , за исключением неработоспособных узлов, если проверки работоспособности

включены. К концу конвейера AvailableDestinations должен быть сведён к одному узлу назначения,

иначе он будет выбран случайным образом из оставшихся.

ProxiedDestination устанавливается логикой прокси в конце конвейера, чтобы указать, какой узел назначения был использован в итоге. Если доступных узлов назначения не осталось, отправляется ответ с ошибкой 503.

```csharp
proxyPipeline.Use(async (context, next) =>
{
      var proxyFeature = context.GetReverseProxyFeature();
      proxyFeature.AvailableDestinations =
Filter(proxyFeature.AvailableDestinations);
      await next();
      Report(proxyFeature.ProxiedDestination);
});
DestinationState implements IReadOnlyList<DestinationState> so a single destination can be
assigned to AvailableDestinations without creating a new list.
```

## Обработка ошибок

Промежуточное ПО может обернуть вызов await next() в блок try/catch, чтобы обрабатывать исключения от компонентов, выполняющихся позже.

Логика прокси в конце конвейера (IHttpForwarder) не выбрасывает исключения при типичных ошибках проксирования запроса. Такие ошибки перехватываются и передаются через IForwarderErrorFeature, доступный из HttpContext.Features или через метод расширения HttpContext.GetForwarderErrorFeature() .

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          await next();
          var errorFeature = context.GetForwarderErrorFeature();
          if (errorFeature is not null)
          {
                 Report(errorFeature.Error, errorFeature.Exception);
                 }
          });
If the response has not started ( HttpResponse.HasStarted ) it can be cleared
( HttpResponse.Clear() ) and an alternate response sent, or the proxy feature fields may be
reset and the request retried.
```

## Чего не стоит делать с промежуточным ПО

Промежуточному ПО следует с осторожностью изменять поля запроса, такие как заголовки, чтобы повлиять на исходящий проксируемый запрос. Такие изменения могут мешать работе таких функций, как повторные попытки, и их лучше выполнять с помощью преобразований.

Промежуточное ПО ОБЯЗАНО проверять HttpResponse.HasStarted перед изменением полей ответа после вызова next() . Если отправка ответа клиенту уже началась, промежуточное ПО больше не может его изменять (за возможным исключением трейлеров). Для проверки и подавления нежелательных ответов можно использовать преобразования. В остальных случаях см. следующее примечание.

Промежуточному ПО следует избегать взаимодействия с телами запроса или ответа. По умолчанию тела не буферизуются, поэтому взаимодействие с ними может помешать их доставке до места назначения. Включить буферизацию возможно, но это не рекомендуется, так как это может существенно увеличить накладные расходы по памяти и задержке. Если тело необходимо проверить или изменить, рекомендуется использовать обёрнутый потоковый подход. Пример см. в промежуточном ПО ResponseCompression.

Промежуточное ПО НЕ ДОЛЖНО выполнять какую-либо многопоточную работу над отдельным запросом: HttpContext и связанные с ним члены не являются потокобезопасными.

:::note
Автор подготовил эту статью с помощью ИИ. Подробнее
:::
