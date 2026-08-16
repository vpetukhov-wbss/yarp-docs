---
slug: config-filters
title: Фильтры конфигурации
lede: >-
  Изменяйте маршруты и кластеры сразу после их загрузки и до проверки — подставляйте значения из
  окружения, применяйте значения по умолчанию или обеспечивайте соблюдение политик во всех записях.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-filters
lastUpdated: 2025-02-10
---

## Для чего нужны фильтры

Конфигурация, загруженная из файлов или [пользовательского провайдера](doc:config-providers), представляет собой необработанные данные — фильтр получает возможность изменить их до того, как они будут проверены и применены. Типичные варианты использования:

- Заполнение полей на основе среды развёртывания (например, адрес узла назначения, известный только во время выполнения).
- Применение значений по умолчанию, общих для всей организации, или обеспечение соблюдения политик для каждого маршрута или кластера.
- Подстановка значений вместо плейсхолдеров.
- Нормализация или исправление незначительных ошибок конфигурации до того, как они приведут к критическим сбоям.

## Регистрация фильтра

Фильтры регистрируются в контейнере внедрения зависимостей с помощью `AddConfigFilter`. Можно добавить любое количество фильтров; они выполняются в порядке регистрации.

```csharp
services.AddReverseProxy()
    .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
    .AddConfigFilter<CustomConfigFilter>();
```

## Написание фильтра

Фильтр реализует интерфейс `IProxyConfigFilter`, с одним методом для каждого типа конфигурации — `ConfigureRouteAsync` и `ConfigureClusterAsync`. Поскольку фильтры разрешаются через DI, они могут принимать зависимости через конструктор, как и любой другой зарегистрированный сервис. Каждый метод выполняется один раз для каждого маршрута или кластера при каждой загрузке или перезагрузке конфигурации и возвращает либо исходный экземпляр без изменений, либо изменённую копию — выражение `with` для записей (records) C# 9 является удобным способом создать такую копию, не затрагивая остальную часть объекта.

:::example Подстановка адресов узлов назначения из переменных окружения
Ищет плейсхолдеры вида `{{key}}` в адресах узлов назначения кластера и заменяет каждый из них значением переменной окружения с именем `key`, выбрасывая исключение, если она не задана. Также повышает значение `Order` для любого маршрута минимум до `1`, чтобы маршруты, зарегистрированные в коде (для которых по умолчанию `0`), всегда имели приоритет над маршрутами, загруженными из конфигурации.

```csharp
using System.Text.RegularExpressions;
using Yarp.ReverseProxy.Configuration;

public class CustomConfigFilter : IProxyConfigFilter
{
    private readonly Regex _exp = new("\\{\\{(\\w+)\\}\\}");

    public ValueTask<ClusterConfig> ConfigureClusterAsync(ClusterConfig cluster, CancellationToken cancel)
    {
        var newDestinations = new Dictionary<string, DestinationConfig>(StringComparer.OrdinalIgnoreCase);
        foreach (var d in cluster.Destinations)
        {
            var match = _exp.Match(d.Value.Address);
            if (!match.Success)
            {
                newDestinations.Add(d.Key, d.Value);
                continue;
            }
            var name = match.Groups[1].Value;
            var value = Environment.GetEnvironmentVariable(name)
                ?? throw new ArgumentException($"Substitution for '{name}' in cluster '{d.Key}' was not found.");
            newDestinations.Add(d.Key, d.Value with { Address = value });
        }
        return new ValueTask<ClusterConfig>(cluster with { Destinations = newDestinations });
    }

    public ValueTask<RouteConfig> ConfigureRouteAsync(RouteConfig route, ClusterConfig cluster, CancellationToken cancel)
    {
        if (route.Order is < 1)
        {
            return new ValueTask<RouteConfig>(route with { Order = 1 });
        }
        return new ValueTask<RouteConfig>(route);
    }
}
```
:::
