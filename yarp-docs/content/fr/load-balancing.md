---
slug: load-balancing
title: Équilibrage de charge
lede: >-
  Lorsqu'un cluster comporte plusieurs destinations saines, YARP choisit celle qui traite chaque
  requête à l'aide d'une stratégie d'équilibrage de charge configurable.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/load-balancing
lastUpdated: 2025-01-15
---

## Stratégies

YARP est livré avec plusieurs stratégies d'équilibrage de charge intégrées :

- **Round Robin** — parcourt la liste des destinations dans l'ordre, en donnant à chacune une part égale du trafic.
- **Requêtes minimales** — envoie chaque requête à la destination qui a actuellement le moins de requêtes en cours.
- **Aléatoire** — choisit une destination au hasard.
- **Power of two choices** — échantillonne deux destinations aléatoires et retient celle qui a le moins de requêtes en cours ; un bon choix par défaut à grande échelle, car elle évite l'effet de troupeau qu'une sélection purement aléatoire peut provoquer.
- **Premier** — toujours la première destination disponible ; utile principalement pour les tests et les scénarios A/B.

:::example Définir la stratégie d'un cluster
Le champ `LoadBalancingPolicy` d'un cluster.

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

## Configuration

La stratégie par défaut est **Power of two choices** si aucune n'est spécifiée. Seules les destinations connues comme saines sont prises en compte - consultez [Vérifications d'intégrité des destinations](doc:dests-health-checks) pour savoir comment une destination est marquée comme non saine et exclue de la rotation.

:::note
L'équilibrage de charge répartit les requêtes entre les destinations ; il ne fixe pas un client donné à la même destination d'une requête à l'autre. Si c'est ce dont vous avez besoin, consultez plutôt [Affinité de session](doc:session-affinity).
:::

## Stratégies personnalisées

Implémentez `ILoadBalancingPolicy` et enregistrez-la dans l'injection de dépendances pour brancher votre propre logique de sélection - le même point d'extensibilité sur lequel reposent les stratégies intégrées de YARP.
