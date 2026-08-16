---
slug: config-files
title: Файлове с конфигурация
lede: >-
  Зареждайте маршрути и клъстери от appsettings.json или от произволен друг източник на
  IConfiguration, като проксито автоматично отчита промените без нужда от рестартиране.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files
lastUpdated: 2025-02-10
---

## Зареждане на конфигурацията

YARP може да зарежда маршрутите и клъстерите си от произволен източник на `IConfiguration` - в примерите по-долу това е `appsettings.json`, но всеки доставчик работи по еднакъв начин. Проксито автоматично препрочита конфигурацията и прилага промените при всяка промяна на източника, без да е необходимо рестартиране.

:::example Program.cs
Регистрира проксито от секцията "ReverseProxy" на конфигурацията.

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
Конфигурацията може да бъде променяна в момента на зареждането ѝ, преди да бъде валидирана и приложена - вижте [Филтри за конфигурация](doc:config-filters).
:::

## Структура на конфигурацията

Именуваната секция, подадена на `LoadFromConfig` - `"ReverseProxy"` по-горе - съдържа две подсекции: `Routes` и `Clusters`.

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

## Маршрути

`Routes` е неподредена колекция от записи за маршрути, всеки от които изисква поне:

- **`RouteId`** — уникално име за маршрута.
- **`ClusterId`** — името на запис в `Clusters`, към който се изпращат заявките, отговарящи на този маршрут.
- **`Match`** — масив `Hosts`, шаблон `Path` (шаблон за маршрут на ASP.NET Core), или и двете.

Когато повече от един маршрут може да съвпадне със заявка, печели най-специфичният маршрут - вижте [Маршрутизиране въз основа на заглавки](doc:header-routing) за подробности как работи приоритетът, или задайте изрично `Order` (по-ниските стойности печелят), за да го контролирате директно. На запис за маршрут могат да се задават и заглавки, авторизация, CORS и други политики за отделните заявки.

## Клъстери

`Clusters` е неподредена колекция от именувани клъстери. Всеки клъстер съдържа набор от именувани `Destinations` - адреси на бекенд сървъри, считани за способни да обработват заявки за всеки маршрут, който сочи към този клъстер. След като маршрутът е съвпаднал, политиката за балансиране на натоварването на клъстера избира коя дестинация реално получава заявката - вижте [Балансиране на натоварването](doc:load-balancing).

## Множество източници на конфигурация

`LoadFromConfig` може да бъде извикан повече от веднъж, сочейки към различни секции или дори различни доставчици - комбинирайте го с [персонализиран доставчик на конфигурация](doc:config-providers), зареждащ от съвсем друго място:

```csharp
services.AddReverseProxy()
    .LoadFromConfig(Configuration.GetSection("ReverseProxy1"))
    .LoadFromConfig(Configuration.GetSection("ReverseProxy2"));
```

Маршрут, дефиниран в един източник, може да препраща към клъстер, дефиниран в друг. Това, което не се поддържа, е сливането на *частична* конфигурация за един и същ маршрут или клъстер от два източника - всеки от тях трябва да идва изцяло от един-единствен източник.

## Всички конфигурационни свойства

Един маршрут и напълно зададен клъстер, показващи всички свойства от най-високо ниво заедно:

:::example Пълна референтна форма
Повечето полета са незадължителни; изискват се само `RouteId`/`ClusterId`/`Match` за маршрут и `Destinations` за клъстер. `HealthCheck`, `SessionAffinity`, и `HttpClient`/`HttpRequest` имат всяко по своя отделна страница - вижте [Проверки на състоянието на дестинациите](doc:dests-health-checks), [Афинитет на сесията](doc:session-affinity) и [Конфигурация на HTTP клиента](doc:http-client-config).

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
