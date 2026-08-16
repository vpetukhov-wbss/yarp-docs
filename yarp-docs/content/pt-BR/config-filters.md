---
slug: config-filters
title: Filtros de configuração
lede: >-
  Modifique rotas e clusters logo depois que são carregados e antes de serem validados - preencha
  valores a partir do ambiente, aplique padrões ou imponha políticas em todas as entradas.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-filters
lastUpdated: 2025-02-10
---

## Para que servem os filtros

A configuração carregada a partir de arquivos ou de [um provedor personalizado](doc:config-providers) é entrada bruta - um filtro tem a chance de alterá-la antes de ser validada e aplicada. Usos típicos:

- Preencher campos a partir do ambiente de implantação (um endereço de destino que só é conhecido em tempo de execução).
- Aplicar padrões válidos para toda a organização ou impor políticas em todas as rotas ou clusters.
- Substituir valores de espaço reservado (placeholder).
- Normalizar ou corrigir pequenos erros de configuração antes que se tornem falhas graves.

## Registrando um filtro

Os filtros são registrados na injeção de dependência com `AddConfigFilter`. Qualquer quantidade pode ser adicionada; eles são executados na ordem em que foram registrados.

```csharp
services.AddReverseProxy()
    .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
    .AddConfigFilter<CustomConfigFilter>();
```

## Escrevendo um filtro

Um filtro implementa `IProxyConfigFilter`, com um método para cada tipo de configuração - `ConfigureRouteAsync` e `ConfigureClusterAsync`. Como os filtros são resolvidos a partir da DI, eles podem receber dependências no construtor como qualquer outro serviço registrado. Cada método é executado uma vez por rota ou cluster, toda vez que a configuração é carregada ou recarregada, e retorna a instância original inalterada ou uma cópia modificada - a expressão `with` dos records do C# 9 é uma forma conveniente de produzir essa cópia sem alterar o restante do objeto.

:::example Substituir endereços de destino a partir de variáveis de ambiente
Procura por espaços reservados `{{key}}` nos endereços de destino de um cluster e substitui cada um pelo valor de uma variável de ambiente chamada `key`, lançando uma exceção se ela não estiver definida. Também eleva o `Order` de qualquer rota para pelo menos `1`, de modo que rotas registradas via código (cujo padrão é `0`) sempre tenham prioridade sobre as carregadas da configuração.

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
