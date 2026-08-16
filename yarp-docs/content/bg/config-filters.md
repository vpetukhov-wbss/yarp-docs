---
slug: config-filters
title: Филтри за конфигурация
lede: >-
  Променяйте маршрути и клъстери веднага след зареждането им и преди валидирането им - попълвайте
  стойности от средата, прилагайте стойности по подразбиране или налагайте политики за всички
  записи.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-filters
lastUpdated: 2025-02-10
---

## За какво служат филтрите

Конфигурацията, заредена от файлове или от [персонализиран доставчик](doc:config-providers), представлява суров вход - филтърът получава възможност да я промени, преди да бъде валидирана и приложена. Типични приложения:

- Попълване на полета от средата за разгръщане (адрес на дестинация, известен само по време на изпълнение).
- Прилагане на стойности по подразбиране за цялата организация или налагане на политики за всеки маршрут или клъстер.
- Заместване на плейсхолдър стойности.
- Нормализиране или коригиране на дребни грешки в конфигурацията, преди те да прераснат в сериозни откази.

## Регистриране на филтър

Филтрите се регистрират в инжектирането на зависимости чрез `AddConfigFilter`. Могат да се добавят произволен брой; те се изпълняват в реда, в който са регистрирани.

```csharp
services.AddReverseProxy()
    .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
    .AddConfigFilter<CustomConfigFilter>();
```

## Писане на филтър

Филтърът имплементира `IProxyConfigFilter`, с по един метод за всеки тип конфигурация - `ConfigureRouteAsync` и `ConfigureClusterAsync`. Тъй като филтрите се извличат от DI контейнера, те могат да приемат зависимости в конструктора си, както всяка друга регистрирана услуга. Всеки метод се изпълнява веднъж за всеки маршрут или клъстер, всеки път когато конфигурацията се зарежда или презарежда, и връща или оригиналната инстанция непроменена, или модифицирано копие - изразът `with` на записите (records) в C# 9 е удобен начин за създаване на такова копие, без да се засяга останалата част от обекта.

:::example Заместване на адреси на дестинации от променливи на средата
Търси плейсхолдъри от вида `{{key}}` в адресите на дестинациите на даден клъстер и заменя всеки от тях със стойността на променлива на средата с име `key`, хвърляйки изключение, ако тя не е зададена. Освен това повдига `Order` на всеки маршрут до поне `1`, така че регистрираните в кода маршрути (които по подразбиране са `0`) винаги имат приоритет пред заредените от конфигурацията.

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
