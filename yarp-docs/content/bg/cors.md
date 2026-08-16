---
slug: cors
title: Заявки от различен произход (CORS)
lede: >-
  Обратният прокси сървър може да обработва заявки от различен произход, преди те да бъдат
  препратени към дестинацията
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/cors
lastUpdated: 2026-08-11
---

## Въведение

Обратният прокси сървър може да обработва заявки от различен произход, преди те да бъдат препратени към дестинациите. Това може да намали натоварването на дестинациите и да гарантира последователно прилагане на политиките във всички ваши приложения.

## Стойности по подразбиране

Заявките няма да бъдат автоматично съпоставяни като CORS предварителни (preflight) заявки, освен ако това не е разрешено в конфигурацията на маршрута или на приложението.

## Конфигурация

Политиките за CORS могат да бъдат зададени за всеки маршрут поотделно чрез RouteConfig.CorsPolicy и могат да бъдат обвързани от секциите Routes на конфигурационния файл. Както при другите свойства на маршрута, това може да бъде променяно и презареждано без рестартиране на прокси сървъра. Имената на политиките не са чувствителни към главни и малки букви.

Пример:

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "CorsPolicy": "customPolicy",
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
CORS policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides the
above configuration to specify a policy per route and the rest is handled by existing ASP.NET
Core CORS Middleware.
CORS policies can be configured in the application as follows:
   services.AddCors(options =>
   {
          options.AddPolicy("customPolicy", builder =>
          {
                 builder.AllowAnyOrigin();
          });
   });
Then add the CORS middleware.
   app.UseCors();
   app.MapReverseProxy();
```

## DefaultPolicy

Задаването на стойност default в параметъра CorsPolicy на даден маршрут означава, че този маршрут ще използва политиката, дефинирана в CorsOptions.DefaultPolicy.

## Деактивиране на CORS

Задаването на стойност disable в параметъра CorsPolicy на даден маршрут означава, че CORS междинният софтуер ще отказва CORS заявките.

:::note
Тази статия е създадена от автора с помощта на AI. Научете повече
:::
