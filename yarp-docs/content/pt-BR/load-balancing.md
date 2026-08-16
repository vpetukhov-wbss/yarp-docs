---
slug: load-balancing
title: Balanceamento de carga
lede: >-
  Quando um cluster tem mais de um destino íntegro, o YARP escolhe qual deles atende cada
  requisição usando uma política de balanceamento de carga configurável.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/load-balancing
lastUpdated: 2025-01-15
---

## Políticas

O YARP vem com várias políticas de balanceamento de carga integradas:

- **Round robin** — percorre a lista de destinos em ordem, dando a cada um uma parcela igual do tráfego.
- **Menos requisições** — envia cada requisição ao destino que atualmente tem o menor número de requisições em andamento.
- **Aleatório** — escolhe um destino aleatoriamente.
- **Power of two choices** — seleciona dois destinos aleatórios e escolhe o que tiver menos requisições em andamento, um bom padrão em escala, pois evita o efeito de manada que a seleção puramente aleatória pode causar.
- **Primeiro** — sempre o primeiro destino disponível; útil principalmente para testes e cenários de A/B.

:::example Definir a política de um cluster
O campo `LoadBalancingPolicy` em um cluster.

```json
{
  "Clusters": {
    "cluster1": {
      "LoadBalancingPolicy": "PowerOfTwoChoices",
      "Destinations": {
        "cluster1/destination1": { "Address": "https://localhost:10000/" },
        "cluster1/destination2": { "Address": "https://localhost:10010/" }
      }
    }
  }
}
```
:::

## Configuração

A política padrão é **Power of two choices** quando nenhuma é especificada. Somente destinos conhecidos como íntegros são considerados - veja [Verificações de integridade de destino](doc:dests-health-checks) para saber como um destino é marcado como não íntegro e excluído da rotação.

:::note
O balanceamento de carga distribui requisições entre destinos; ele não fixa um determinado cliente ao mesmo destino entre requisições. Se é isso que você precisa, veja [Afinidade de sessão](doc:session-affinity).
:::

## Políticas personalizadas

Implemente `ILoadBalancingPolicy` e registre-o na DI para inserir sua própria lógica de seleção - o mesmo ponto de extensibilidade sobre o qual as próprias políticas integradas do YARP são construídas.
