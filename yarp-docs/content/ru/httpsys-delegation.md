---
slug: httpsys-delegation
title: Делегирование HTTP.sys
lede: >-
  Делегирование HTTP.sys — это функция уровня ядра, добавленная в более новые версии Windows,
  которая
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/httpsys-delegation
lastUpdated: 2026-08-11
---

## Введение

Делегирование HTTP.sys — это функция уровня ядра, добавленная в более новые версии Windows, которая позволяет передавать запрос из очереди HTTP.sys принимающего процесса в очередь HTTP.sys целевого процесса с минимальными накладными расходами и незначительной дополнительной задержкой. Чтобы такое делегирование сработало, принимающему процессу разрешено читать только заголовки запроса. Если чтение тела запроса уже началось или уже начал формироваться ответ, попытка делегировать запрос завершится ошибкой. После делегирования ответ становится недоступен прокси-серверу, что ограничивает функциональность компонентов привязки сессии и пассивных проверок работоспособности, а также некоторых алгоритмов балансировки нагрузки. Внутри YARP использует IHttpSysRequestDelegationFeature из ASP.NET Core

## Требования

Для делегирования HTTP.sys необходимо следующее:

Сервер HTTP.sys, входящий в состав ASP.NET Core. Windows Server 2019 или Windows 10 (сборка 1809) либо более новая версия.

## Значения по умолчанию

Делегирование HTTP.sys используется только в том случае, если оно добавлено в конвейер прокси-сервера и включено в конфигурации узла назначения.

## Настройка

Делегирование HTTP.sys можно включить для отдельного узла назначения, добавив в него метаданные HttpSysDelegationQueue. Значением этих метаданных должно быть имя целевой очереди HTTP.sys. Поле Address узла назначения используется для указания префикса URL-адреса очереди HTTP.sys.

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Path": "{**catch-all}"
                      }
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                         "cluster1/destination1": {
                            "Address": "http://*:80/",
                            "Metadata": {
                               "HttpSysDelegationQueue": "TargetHttpSysQueueName"
                            }
                         }
                      }
                   }
      }
   }
}
In host configuration, configure the host to use the HTTP.sys server:
    C#
   webBuilder.UseHttpSys();
In application configuration, use the MapReverseProxy overload that allows you to customize
the pipeline and add HTTP.sys delegation by calling UseHttpSysDelegation :
```

```csharp
   app.MapReverseProxy(proxyPipeline =>
   {
          // Add the three middleware YARP adds by default plus the HTTP.sys
          // delegation middleware
          proxyPipeline.UseSessionAffinity(); // No affect on delegation destinations
          proxyPipeline.UseLoadBalancing();
          proxyPipeline.UsePassiveHealthChecks();
          proxyPipeline.UseHttpSysDelegation();
   });
```

## Время жизни очереди делегирования

Когда YARP настроен на использование делегирования для узла назначения, создается дескриптор указанной очереди HTTP.sys. Этот дескриптор остается активным, пока существуют узлы назначения, ссылающиеся на него. Очистка таких дескрипторов выполняется во время сборки мусора (GC), поэтому очистка дескриптора может откладываться, если он попадает во второе поколение (Gen2). Это может вызывать проблемы у некоторых получателей при перезапуске процесса, поскольку, если они пытаются создать очередь при запуске, попытка завершается ошибкой, так как очередь все еще существует, ведь дескриптор на нее по-прежнему удерживает YARP. Получатели должны быть достаточно «умными», чтобы вместо этого подключаться к уже существующей очереди и корректно заново ее настраивать. Такая проблема есть у сервера HTTP.sys из ASP.NET Core. Дополнительные сведения см. в материале «Серверу HTTP.sys следует поддерживать настройку групп URL при подключении к уже существующей очереди» (dotnet/aspnetcore #40359).

YARP предоставляет способ сбросить свой дескриптор очереди. Это позволяет потребителям писать собственную логику для определения момента, когда дескриптор очереди следует очищать.

Пример:

```csharp
var delegator = app.Services.GetRequiredService<IHttpSysDelegator>();
delegator.ResetQueue("TargetHttpSysQueueName", "http://*:80");
 Note: The author created this article with assistance from AI. Learn more
```
