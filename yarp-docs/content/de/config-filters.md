---
slug: config-filters
title: Konfigurationsfilter
lede: >-
  Ändern Sie Routen und Cluster direkt nach dem Laden und vor der Validierung – füllen Sie Werte
  aus der Umgebung ein, wenden Sie Standardwerte an, oder erzwingen Sie Richtlinien über alle
  Einträge hinweg.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-filters
lastUpdated: 2025-02-10
---

## Wozu Filter dienen

Aus Dateien oder [einem benutzerdefinierten Provider](doc:config-providers) geladene Konfiguration ist Rohdaten – ein Filter erhält die Gelegenheit, sie zu ändern, bevor sie validiert und angewendet wird. Typische Anwendungsfälle:

- Felder aus der Bereitstellungsumgebung befüllen (etwa eine Zieladresse, die erst zur Laufzeit bekannt ist).
- Unternehmensweite Standardwerte anwenden oder Richtlinien über alle Routen oder Cluster hinweg erzwingen.
- Platzhalterwerte ersetzen.
- Kleinere Konfigurationsfehler normalisieren oder korrigieren, bevor sie zu harten Fehlern werden.

## Einen Filter registrieren

Filter werden mit `AddConfigFilter` in der Dependency Injection registriert. Es können beliebig viele hinzugefügt werden; sie laufen in der Reihenfolge, in der sie registriert wurden.

```csharp
services.AddReverseProxy()
    .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
    .AddConfigFilter<CustomConfigFilter>();
```

## Einen Filter schreiben

Ein Filter implementiert `IProxyConfigFilter` mit je einer Methode pro Konfigurationstyp – `ConfigureRouteAsync` und `ConfigureClusterAsync`. Da Filter aus der DI aufgelöst werden, können sie wie jeder andere registrierte Dienst Konstruktorabhängigkeiten entgegennehmen. Jede Methode läuft einmal pro Route oder Cluster, jedes Mal, wenn die Konfiguration geladen oder neu geladen wird, und gibt entweder die unveränderte Originalinstanz oder eine geänderte Kopie zurück – der `with`-Ausdruck von C# 9-Records ist eine bequeme Möglichkeit, diese Kopie zu erzeugen, ohne den Rest des Objekts anzufassen.

:::example Zieladressen aus Umgebungsvariablen ersetzen
Sucht in den Zieladressen eines Clusters nach `{{key}}`-Platzhaltern und ersetzt jeden davon durch den Wert einer Umgebungsvariablen namens `key`; ist sie nicht gesetzt, wird ein Fehler ausgelöst. Hebt außerdem die `Order` jeder Route auf mindestens `1` an, sodass im Code registrierte Routen (die standardmäßig `0` sind) stets Vorrang vor aus der Konfiguration geladenen haben.

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
