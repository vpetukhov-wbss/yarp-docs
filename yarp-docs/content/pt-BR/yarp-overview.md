---
slug: yarp-overview
title: Visão geral do YARP
lede: >-
  O YARP (Yet Another Reverse Proxy) é uma biblioteca de proxy reverso altamente personalizável
  para .NET — criada para ser robusta, flexível, escalável, segura e fácil de executar à frente
  dos serviços que você já tem.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/yarp-overview
lastUpdated: 2025-02-21
---

## Introdução

O YARP ajuda os desenvolvedores a criar soluções de proxy reverso poderosas e eficientes, adaptadas às suas necessidades específicas. Ele fica entre os dispositivos cliente e os servidores de backend, encaminhando as requisições do cliente para o destino apropriado e retornando a resposta — o mesmo papel desempenhado pelo nginx ou pelo Envoy, mas como uma biblioteca que você hospeda dentro do seu próprio processo ASP.NET Core.

## O que um proxy reverso faz

Um proxy reverso oferece vários benefícios além de um backend simples:

- **Roteamento** — direciona as requisições para diferentes servidores de backend com base em regras predefinidas, como padrões de URL ou cabeçalhos de requisição. `/images`, `/api` e `/db` podem, cada um, ser roteados para um servidor diferente.
- **Balanceamento de carga** — distribui o tráfego de entrada entre vários servidores de backend para evitar sobrecarregar qualquer um deles.
- **Escalabilidade** — servidores de backend podem ser adicionados ou removidos sem impactar o cliente, já que o tráfego é distribuído pelo proxy.
- **Terminação de TLS** — descarrega a criptografia e a descriptografia dos servidores de backend, reduzindo sua carga de trabalho.
- **Segurança** — os endpoints de serviços internos permanecem ocultos da exposição externa, reduzindo a superfície de ataque.

## Como um proxy reverso lida com HTTP

As conexões de entrada são finalizadas no proxy; novas conexões, mantidas em pool, são usadas para as requisições de saída para os destinos. Com base nas regras de roteamento configuradas, o YARP determina qual cluster deve tratar a requisição, a encaminha — transformando o caminho e os cabeçalhos conforme necessário — e retransmite a resposta do backend de volta ao cliente.

:::example Exemplo rápido
Registre o proxy e carregue rotas e clusters diretamente da configuração.

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

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": { "Path": "{**catch-all}" }
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
:::

:::note
A configuração é recarregada automaticamente quando a fonte muda — sem necessidade de reiniciar. Veja [Filtros de configuração](doc:config-filters) para modificar a configuração durante a sequência de carregamento.
:::

## Por que escolher o YARP em vez de outros proxies

O YARP é construído sobre o ASP.NET Core, então se integra diretamente ao ecossistema do .NET e oferece um rico conjunto de pontos de extensibilidade — roteamento, balanceamento de carga e transformações podem ser todos personalizados no C# que você já conhece, em vez de uma linguagem de configuração específica de proxy. Ele é mantido ativamente pela Microsoft, e tanto o YARP quanto sua documentação são de código aberto.
