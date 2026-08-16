---
slug: timeouts
title: Тайм-ауты запросов
lede: >-
  .NET 8 представил промежуточное ПО Request Timeouts Middleware, позволяющее настраивать
  тайм-ауты запросов
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/timeouts
lastUpdated: 2026-08-11
---

## Введение

.NET 8 представил промежуточное ПО Request Timeouts Middleware, позволяющее настраивать тайм-ауты запросов как глобально, так и для отдельных конечных точек. Эта функциональность также доступна в YARP 2.1 при работе на .NET 8 или более поздней версии.

## Значения по умолчанию

По умолчанию у запросов нет никаких тайм-аутов, кроме Activity Timeout, который используется для очистки простаивающих запросов. Политика по умолчанию, заданная в RequestTimeoutOptions, применяется и к проксируемым запросам.

## Конфигурация

Тайм-ауты и политики тайм-аутов можно задать для каждого маршрута через RouteConfig; они привязываются из разделов Routes файла конфигурации. Как и другие свойства маршрута, это значение можно изменить и перезагрузить без перезапуска прокси. Имена политик не чувствительны к регистру.

Тайм-ауты задаются в формате TimeSpan (ЧЧ:ММ:СС). Одновременное указание Timeout и TimeoutPolicy для одного и того же маршрута недопустимо и приведёт к отклонению конфигурации.

:::note
тайм-ауты запросов не применяются, если к процессу подключён отладчик.
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

## Отключение тайм-аутов

Если для параметра TimeoutPolicy маршрута указано значение disable, промежуточное ПО тайм-аутов запросов не будет применять тайм-ауты к этому маршруту.

## WebSockets

После завершения начального рукопожатия WebSocket тайм-ауты запросов отключаются.

:::note
Эта статья создана автором при помощи ИИ. Подробнее.
:::
