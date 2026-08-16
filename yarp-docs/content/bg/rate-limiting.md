---
slug: rate-limiting
title: Ограничаване на скоростта на заявките
lede: >-
  Обратният прокси сървър може да се използва за ограничаване на скоростта на заявките, преди те
  да бъдат препратени към
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/rate-limiting
lastUpdated: 2026-08-11
---

## Въведение

Обратният прокси сървър може да се използва за ограничаване на скоростта на заявките, преди те да бъдат препратени към сървърите на дестинациите. Това може да намали натоварването върху сървърите на дестинациите, да добави допълнителен слой защита и да гарантира прилагането на последователни политики във всичките ви приложения.

Тази функционалност е налична само при използване на .NET 7 или по-нова версия

## Стойности по подразбиране

Не се извършва ограничаване на скоростта на заявките, освен ако това не е включено в конфигурацията на маршрута или приложението. Middleware компонентът за ограничаване на скоростта ( app.UseRateLimiter() ) обаче може да приложи ограничител по подразбиране към всички маршрути, без това да изисква изрично включване от конфигурацията. Пример:

```csharp
   services.AddRateLimiter(options => options.GlobalLimiter = globalLimiter);
```

## Конфигурация

Политиките за ограничител на скоростта могат да се задават за отделен маршрут чрез RouteConfig.RateLimiterPolicy и могат да се обвързват от секцията Routes на конфигурационния файл. Както при другите свойства на маршрута, това може да се променя и презарежда без рестартиране на прокси сървъра. Имената на политиките не са чувствителни към регистъра.

Пример:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "RateLimiterPolicy": "customPolicy",
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
RateLimiter policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core rate limiting middleware.
RateLimiter policies can be configured in services as follows:
```

```csharp
   services.AddRateLimiter(options =>
   {
          options.AddFixedWindowLimiter("customPolicy", opt =>
          {
                 opt.PermitLimit = 4;
                 opt.Window = TimeSpan.FromSeconds(12);
                 opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                 opt.QueueLimit = 2;
          });
   });
Then add the RateLimiter middleware.
    C#
   app.UseRateLimiter();
   app.MapReverseProxy();
See the Rate Limiting docs for setting up your preferred kind of rate limiting.
```

## Изключване на ограничаването на скоростта

Задаването на стойност disable в параметъра RateLimiterPolicy на даден маршрут означава, че middleware компонентът за ограничител на скоростта няма да прилага никакви политики към този маршрут, дори политиката по подразбиране.

:::note
Тази статия е създадена от автора с помощта на изкуствен интелект. Научете повече
:::
