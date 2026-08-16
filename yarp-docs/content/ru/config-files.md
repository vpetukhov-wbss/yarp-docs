---
slug: config-files
title: Конфигурационные файлы
lede: >-
  Загружайте маршруты и кластеры из appsettings.json или любого другого источника IConfiguration, и
  прокси-сервер будет автоматически подхватывать изменения без перезапуска.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files
lastUpdated: 2025-02-10
---

## Загрузка конфигурации

YARP может загружать свои маршруты и кластеры из любого источника `IConfiguration` — в примерах ниже используется `appsettings.json`, но любой провайдер работает точно так же. Прокси-сервер автоматически перечитывает конфигурацию и применяет изменения при каждом изменении источника, без необходимости перезапуска.

:::example Program.cs
Регистрирует прокси-сервер из раздела конфигурации "ReverseProxy".

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```
:::

:::note
Конфигурацию можно изменять по мере её загрузки, до того как она будет проверена и применена — см. раздел [Фильтры конфигурации](doc:config-filters).
:::

## Структура конфигурации

Именованный раздел, передаваемый в `LoadFromConfig` — в примере выше это `"ReverseProxy"` — содержит два подраздела: `Routes` и `Clusters`.

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "{**catch-all}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"]
        }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "cluster1/destination1": { "Address": "https://example.com/" }
        }
      }
    }
  }
}
```

## Маршруты

`Routes` — это неупорядоченная коллекция записей маршрутов, каждая из которых должна содержать как минимум:

- **`RouteId`** — уникальное имя маршрута.
- **`ClusterId`** — имя записи в `Clusters`, в которую отправляются запросы, соответствующие этому маршруту.
- **`Match`** — массив `Hosts`, шаблон `Path` (шаблон маршрута ASP.NET Core) или оба варианта сразу.

Если запросу может соответствовать сразу несколько маршрутов, побеждает наиболее специфичный маршрут — подробнее о том, как работает приоритет, см. в разделе [Маршрутизация на основе заголовков](doc:header-routing), либо задайте явное значение `Order` (меньшие значения имеют приоритет), чтобы управлять этим напрямую. Заголовки, авторизация, CORS и другие политики уровня запроса также можно задавать в записи маршрута.

## Кластеры

`Clusters` — это неупорядоченная коллекция именованных кластеров. Каждый кластер содержит набор именованных `Destinations` — адресов бэкенда, способных обрабатывать запросы для любого маршрута, указывающего на этот кластер. После того как маршрут найден, политика балансировки нагрузки кластера определяет, какой именно узел назначения фактически получит запрос — см. раздел [Балансировка нагрузки](doc:load-balancing).

## Несколько источников конфигурации

`LoadFromConfig` можно вызывать несколько раз, указывая разные разделы или даже разные провайдеры — сочетайте его с [пользовательским провайдером конфигурации](doc:config-providers), загружающим данные из совершенно другого источника:

```csharp
services.AddReverseProxy()
    .LoadFromConfig(Configuration.GetSection("ReverseProxy1"))
    .LoadFromConfig(Configuration.GetSection("ReverseProxy2"));
```

Маршрут, определённый в одном источнике, может ссылаться на кластер, определённый в другом. Что не поддерживается — это объединение *частичной* конфигурации одного и того же маршрута или кластера из двух источников: каждый из них должен полностью поступать из одного источника.

## Все свойства конфигурации

Один маршрут и полностью заданный кластер, демонстрирующие все свойства верхнего уровня одновременно:

:::example Полная эталонная структура
Большинство полей необязательны; обязательными являются только `RouteId`/`ClusterId`/`Match` для маршрута и `Destinations` для кластера. У `HealthCheck`, `SessionAffinity` и `HttpClient`/`HttpRequest` есть собственные отдельные страницы — см. [Проверки работоспособности узлов назначения](doc:dests-health-checks), [Привязка сессии](doc:session-affinity) и [Настройка HTTP-клиента](doc:http-client-config).

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Order": 100,
        "MaxRequestBodySize": 1000000,
        "AuthorizationPolicy": "Anonymous",
        "CorsPolicy": "Default",
        "Match": {
          "Path": "/something/{**remainder}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"],
          "Methods": ["GET", "PUT"],
          "Headers": [
            { "Name": "MyCustomHeader", "Values": ["value1", "value2"], "Mode": "ExactHeader" }
          ],
          "QueryParameters": [
            { "Name": "MyQueryParameter", "Values": ["value1", "value2"], "Mode": "Exact" }
          ]
        },
        "Metadata": { "MyName": "MyValue" },
        "Transforms": [{ "RequestHeader": "MyHeader", "Set": "MyValue" }]
      }
    },
    "Clusters": {
      "cluster1": {
        "LoadBalancingPolicy": "PowerOfTwoChoices",
        "Destinations": {
          "cluster1/destination1": { "Address": "https://contoso.com" },
          "cluster1/destination2": { "Address": "https://10.20.30.40", "Health": "https://10.20.30.40:12345/test" }
        },
        "SessionAffinity": { "Enabled": true, "Policy": "Cookie" },
        "HealthCheck": {
          "Active": { "Enabled": true, "Interval": "00:00:10", "Path": "/api/health" },
          "Passive": { "Enabled": true, "Policy": "TransportFailureRateHealthPolicy" }
        },
        "HttpClient": { "SslProtocols": "Tls13", "MaxConnectionsPerServer": 1024 },
        "Metadata": { "MyKey": "MyValue" }
      }
    }
  }
}
```
:::
