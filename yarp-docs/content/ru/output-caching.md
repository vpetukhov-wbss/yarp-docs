---
slug: output-caching
title: Кэширование вывода
lede: >-
  Обратный прокси-сервер можно использовать для кэширования проксируемых ответов и обслуживания
  запросов до того, как они
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/output-caching
lastUpdated: 2026-08-11
---

## Введение

Обратный прокси-сервер можно использовать для кэширования проксируемых ответов и обслуживания запросов до того, как они будут проксированы на серверы назначения. Это позволяет снизить нагрузку на серверы назначения, добавить дополнительный уровень защиты и обеспечить единообразное применение политик во всех приложениях.

Эта функция доступна только при использовании .NET 7 или более поздней версии

## Значения по умолчанию

Кэширование вывода не выполняется, если оно не включено в конфигурации маршрута или приложения.

## Настройка

Политики кэширования вывода можно задавать для каждого маршрута через RouteConfig.OutputCachePolicy, привязывая их из раздела Routes файла конфигурации. Как и другие свойства маршрута, это значение можно изменять и перезагружать без перезапуска прокси-сервера. Имена политик не чувствительны к регистру.

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
