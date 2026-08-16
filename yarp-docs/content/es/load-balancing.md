---
slug: load-balancing
title: Equilibrio de carga
lede: >-
  Cuando un clúster tiene más de un destino en buen estado, YARP elige, mediante una directiva de
  equilibrio de carga configurable, cuál de ellos gestiona cada solicitud.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/load-balancing
lastUpdated: 2025-01-15
---

## Directivas

YARP incluye varias directivas de equilibrio de carga integradas:

- **Round robin** — recorre la lista de destinos en orden, dando a cada uno una parte igual del tráfico.
- **Menos solicitudes** — envía cada solicitud al destino que actualmente tiene menos solicitudes en curso.
- **Aleatorio** — elige un destino al azar.
- **Power of two choices** — toma como muestra dos destinos aleatorios y elige el que tenga menos solicitudes en curso; una buena opción predeterminada a gran escala, ya que evita el efecto rebaño que puede causar la selección puramente aleatoria.
- **Primero** — siempre el primer destino disponible; útil principalmente para pruebas y escenarios de tipo A/B.

:::example Establecer la directiva de un clúster
El campo `LoadBalancingPolicy` de un clúster.

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

## Configuración

La directiva predeterminada es **Power of two choices** cuando no se especifica ninguna. Solo se tienen en cuenta los destinos que se sabe que están en buen estado - consulte [Comprobaciones de estado de destinos](doc:dests-health-checks) para saber cómo se marca un destino como en mal estado y se excluye de la rotación.

:::note
El equilibrio de carga distribuye las solicitudes entre los destinos; no fija a un cliente determinado al mismo destino a lo largo de varias solicitudes. Si eso es lo que necesita, consulte en su lugar [Afinidad de sesión](doc:session-affinity).
:::

## Directivas personalizadas

Implemente `ILoadBalancingPolicy` y regístrela en la inyección de dependencias para incorporar lógica de selección personalizada - el mismo punto de extensibilidad sobre el que se construyen las propias directivas integradas de YARP.
