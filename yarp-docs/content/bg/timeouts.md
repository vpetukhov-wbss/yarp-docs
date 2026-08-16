---
slug: timeouts
title: Таймаути на заявки
lede: >-
  .NET 8 въведе Request Timeouts Middleware, за да позволи конфигурирането на таймаути на заявките
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/timeouts
lastUpdated: 2026-08-11
---

## Въведение

.NET 8 въведе Request Timeouts Middleware, за да позволи конфигурирането на таймаути на заявките както глобално, така и за отделна крайна точка. Тази функционалност е налична и в YARP 2.1 при работа върху .NET 8 или по-нова версия.

## Стойности по подразбиране

По подразбиране заявките нямат никакви таймаути, с изключение на Activity Timeout, който се използва за прочистване на неактивни заявки. Политика по подразбиране, зададена в RequestTimeoutOptions, ще се прилага и към препратените заявки.

## Конфигурация

Таймаутите и политиките за таймаут могат да се задават за отделен маршрут чрез RouteConfig и могат да се обвързват от секцията Routes на конфигурационния файл. Както при другите свойства на маршрута, това може да се променя и презарежда без рестартиране на прокси сървъра. Имената на политиките не са чувствителни към регистъра.

Таймаутите се задават във формат TimeSpan (HH:MM:SS). Задаването едновременно на Timeout и TimeoutPolicy за един и същ маршрут е невалидно и ще доведе до отхвърляне на конфигурацията.

:::note
таймаутите на заявките не се прилагат, когато към процеса е прикачен дебъгер.
:::

Пример:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "TimeoutPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
         }
         "route2" : {
             "ClusterId": "cluster1",
             "Timeout": "00:01:00",
             "Match": {
                         "Hosts": [ "localhost2" ]
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
Timeout policies and the default policy can be configured in the service collection and the
middleware can be added as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddReverseProxy()
          .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
   builder.Services.AddRequestTimeouts(options =>
   {
          options.AddPolicy("customPolicy", TimeSpan.FromSeconds(20));
   });
   var app = builder.Build();
   app.UseRequestTimeouts();
   app.MapReverseProxy();
   app.Run();
```

## Изключване на таймаутите

Задаването на стойност disable в параметъра TimeoutPolicy на даден маршрут означава, че middleware компонентът за таймаут на заявки няма да прилага таймаути към този маршрут.

## WebSockets

Таймаутите на заявките се изключват след първоначалното установяване на WebSocket връзката (handshake).

:::note
Тази статия е създадена от автора с помощта на изкуствен интелект. Научете повече
:::
