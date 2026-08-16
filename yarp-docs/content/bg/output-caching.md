---
slug: output-caching
title: Кеширане на изхода
lede: >-
  Обратният прокси сървър може да се използва за кеширане на проксираните отговори и обслужване на
  заявки, преди те
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/output-caching
lastUpdated: 2026-08-11
---

## Въведение

Обратният прокси сървър може да се използва за кеширане на проксираните отговори и обслужване на заявки, преди те да бъдат препратени към дестинациите. Това може да намали натоварването на дестинациите, да добави допълнителен слой защита и да гарантира последователно прилагане на политиките във всички ваши приложения.

Тази функция е налична само при използване на .NET 7 или по-нова версия

## Стойности по подразбиране

Не се извършва кеширане на изхода, освен ако това не е разрешено в конфигурацията на маршрута или на приложението.

## Конфигурация

Политиките за кеширане на изхода могат да бъдат зададени за всеки маршрут поотделно чрез RouteConfig.OutputCachePolicy и могат да бъдат обвързани от секциите Routes на конфигурационния файл. Както при другите свойства на маршрута, това може да бъде променяно и презареждано без рестартиране на прокси сървъра. Имената на политиките не са чувствителни към главни и малки букви.

Пример:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "OutputCachePolicy": "customPolicy",
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
Output cache policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core output caching middleware.
Output cache policies can be configured in Program.cs as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddOutputCache(options =>
   {
          options.AddPolicy("customPolicy", builder =>
   builder.Expire(TimeSpan.FromSeconds(20)));
   });
Then add the output caching middleware:
    C#
   var app = builder.Build();
   app.UseOutputCache();
   app.MapReverseProxy();
See the Output Caching docs for setting up your preferred kind of output caching.
 Note: The author created this article with assistance from AI. Learn more
```
