---
slug: rate-limiting
title: Ограничение скорости запросов
lede: >-
  Обратный прокси можно использовать для ограничения скорости запросов, прежде чем они будут
  проксированы на узел
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/rate-limiting
lastUpdated: 2026-08-11
---

## Введение

Обратный прокси можно использовать для ограничения скорости запросов, прежде чем они будут проксированы на серверы назначения. Это позволяет снизить нагрузку на серверы назначения, добавить дополнительный уровень защиты и обеспечить единообразное применение политик во всех ваших приложениях.

Эта функция доступна только при использовании .NET 7 или более поздней версии

## Значения по умолчанию

Ограничение скорости запросов не выполняется, если оно не включено в конфигурации маршрута или приложения. Однако промежуточное ПО ограничения скорости ( app.UseRateLimiter() ) может применять ограничитель по умолчанию ко всем маршрутам, и для этого не требуется никакого явного включения в конфигурации. Пример:

```csharp
   services.AddRateLimiter(options => options.GlobalLimiter = globalLimiter);
```

## Конфигурация

Политики ограничителя скорости запросов можно задать для каждого маршрута через RouteConfig.RateLimiterPolicy; они привязываются из разделов Routes файла конфигурации. Как и другие свойства маршрута, это значение можно изменить и перезагрузить без перезапуска прокси. Имена политик не чувствительны к регистру.

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

## Отключение ограничения скорости запросов

Если для параметра RateLimiterPolicy маршрута указано значение disable, промежуточное ПО ограничителя скорости не будет применять к этому маршруту никакие политики, включая политику по умолчанию.

:::note
Эта статья создана автором при помощи ИИ. Подробнее.
:::
