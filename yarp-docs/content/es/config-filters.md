---
slug: config-filters
title: Filtros de configuración
lede: >-
  Modifique rutas y clústeres justo después de cargarlos y antes de que se validen - complete
  valores desde el entorno, aplique valores predeterminados o exija directivas en todas las entradas.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-filters
lastUpdated: 2025-02-10
---

## Para qué sirven los filtros

La configuración cargada desde archivos o [un proveedor personalizado](doc:config-providers) es una entrada sin procesar - un filtro tiene la oportunidad de modificarla antes de que se valide y se aplique. Usos típicos:

- Completar campos a partir del entorno de implementación (una dirección de destino que solo se conoce en tiempo de ejecución).
- Aplicar valores predeterminados a nivel de organización o exigir directivas en todas las rutas o clústeres.
- Sustituir valores de marcador de posición.
- Normalizar o corregir errores menores de configuración antes de que se conviertan en fallos graves.

## Registro de un filtro

Los filtros se registran en la inyección de dependencias con `AddConfigFilter`. Se puede agregar cualquier cantidad de ellos; se ejecutan en el orden en que se registraron.

```csharp
services.AddReverseProxy()
    .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
    .AddConfigFilter<CustomConfigFilter>();
```

## Escritura de un filtro

Un filtro implementa `IProxyConfigFilter`, con un método por cada tipo de configuración - `ConfigureRouteAsync` y `ConfigureClusterAsync`. Como los filtros se resuelven desde la inyección de dependencias, pueden tomar dependencias de constructor como cualquier otro servicio registrado. Cada método se ejecuta una vez por ruta o clúster, cada vez que la configuración se carga o se vuelve a cargar, y devuelve la instancia original sin cambios o una copia modificada - la expresión `with` de los registros de C# 9 es una forma cómoda de producir esa copia sin tocar el resto del objeto.

:::example Sustituir direcciones de destino a partir de variables de entorno
Busca marcadores de posición `{{key}}` en las direcciones de destino de un clúster y sustituye cada uno por el valor de una variable de entorno llamada `key`, generando una excepción si no está establecida. También eleva el `Order` de cualquier ruta a al menos `1`, de modo que las rutas registradas en código (que de forma predeterminada tienen el valor `0`) siempre tengan prioridad sobre las cargadas desde la configuración.

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
