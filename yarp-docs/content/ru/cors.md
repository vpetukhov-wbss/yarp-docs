---
slug: cors
title: Междоменные запросы (CORS)
lede: >-
  Обратный прокси-сервер может обрабатывать междоменные запросы до того, как они будут
  проксированы на сервер назначения
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/cors
lastUpdated: 2026-08-11
---

## Введение

Обратный прокси-сервер может обрабатывать междоменные запросы до того, как они будут проксированы на серверы назначения. Это позволяет снизить нагрузку на серверы назначения и обеспечить единообразное применение политик во всех приложениях.

## Значения по умолчанию

Запросы не будут автоматически сопоставляться с предварительными (preflight) CORS-запросами, если это не включено в конфигурации маршрута или приложения.

## Настройка

Политики CORS можно задавать для каждого маршрута через RouteConfig.CorsPolicy, привязывая их из раздела Routes файла конфигурации. Как и другие свойства маршрута, это значение можно изменять и перезагружать без перезапуска прокси-сервера. Имена политик не чувствительны к регистру.

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

Если в параметре CorsPolicy маршрута указано значение default, этот маршрут будет использовать политику, заданную в CorsOptions.DefaultPolicy.

## Отключение CORS

Если в параметре CorsPolicy маршрута указано значение disable, промежуточное ПО CORS будет отклонять CORS-запросы.

:::note
Эта статья создана автором с использованием ИИ. Подробнее
:::
