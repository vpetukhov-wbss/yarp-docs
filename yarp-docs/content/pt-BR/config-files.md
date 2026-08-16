---
slug: config-files
title: Arquivos de configuração
lede: >-
  Carregue rotas e clusters a partir do appsettings.json ou de qualquer outra fonte
  IConfiguration, e faça com que o proxy detecte as alterações automaticamente, sem precisar
  reiniciar.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files
lastUpdated: 2025-02-10
---

## Carregando a configuração

O YARP pode carregar suas rotas e clusters a partir de qualquer fonte `IConfiguration` - `appsettings.json` nos exemplos abaixo, mas qualquer provedor funciona da mesma forma. O proxy relê a configuração e aplica as alterações automaticamente sempre que a fonte muda, sem necessidade de reiniciar.

:::example Program.cs
Registra o proxy a partir da seção "ReverseProxy" da configuração.

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
A configuração pode ser modificada conforme é carregada, antes de ser validada e aplicada - veja [Filtros de configuração](doc:config-filters).
:::

## Estrutura da configuração

A seção nomeada passada para `LoadFromConfig` - `"ReverseProxy"` acima - contém duas subseções: `Routes` e `Clusters`.

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

## Rotas

`Routes` é uma coleção não ordenada de entradas de rota, cada uma exigindo pelo menos:

- **`RouteId`** — um nome exclusivo para a rota.
- **`ClusterId`** — o nome de uma entrada em `Clusters` para a qual são enviadas as requisições que correspondem a essa rota.
- **`Match`** — um array `Hosts`, um padrão `Path` (um template de rota do ASP.NET Core), ou ambos.

Quando mais de uma rota pode corresponder a uma requisição, a rota mais específica prevalece - veja [Roteamento baseado em cabeçalhos](doc:header-routing) para saber em detalhes como a precedência funciona, ou defina um `Order` explícito (valores menores prevalecem) para controlá-la diretamente. Cabeçalhos, autorização, CORS e outras políticas por requisição também podem ser definidos em uma entrada de rota.

## Clusters

`Clusters` é uma coleção não ordenada de clusters nomeados. Cada cluster contém um conjunto de `Destinations` nomeados - endereços de backend considerados capazes de atender requisições de qualquer rota que aponte para esse cluster. Assim que uma rota tiver correspondido, a política de balanceamento de carga do cluster escolhe qual destino de fato recebe a requisição - veja [Balanceamento de carga](doc:load-balancing).

## Múltiplas fontes de configuração

`LoadFromConfig` pode ser chamado mais de uma vez, apontando para seções diferentes ou até para provedores diferentes - combine-o com [um provedor de configuração personalizado](doc:config-providers) que carrega de um local totalmente diferente:

```csharp
services.AddReverseProxy()
    .LoadFromConfig(Configuration.GetSection("ReverseProxy1"))
    .LoadFromConfig(Configuration.GetSection("ReverseProxy2"));
```

Uma rota definida em uma fonte pode referenciar um cluster definido em outra. O que não é suportado é mesclar configuração *parcial* para a mesma rota ou cluster entre duas fontes - cada uma precisa vir integralmente de uma única fonte.

## Todas as propriedades de configuração

Uma única rota e um cluster totalmente especificado, mostrando todas as propriedades de nível superior juntas:

:::example Forma de referência completa
A maioria dos campos é opcional; apenas `RouteId`/`ClusterId`/`Match` em uma rota e `Destinations` em um cluster são obrigatórios. `HealthCheck`, `SessionAffinity` e `HttpClient`/`HttpRequest` têm cada um sua própria página dedicada - veja [Verificações de integridade de destino](doc:dests-health-checks), [Afinidade de sessão](doc:session-affinity) e [Configuração do cliente HTTP](doc:http-client-config).

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
