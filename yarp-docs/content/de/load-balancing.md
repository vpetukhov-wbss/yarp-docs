---
slug: load-balancing
title: Lastverteilung
lede: >-
  Wenn ein Cluster mehr als ein fehlerfreies Ziel hat, wählt YARP mit einer konfigurierbaren
  Lastverteilungsrichtlinie aus, welches Ziel jede Anfrage bearbeitet.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/load-balancing
lastUpdated: 2025-01-15
---

## Richtlinien

YARP wird mit mehreren integrierten Lastverteilungsrichtlinien ausgeliefert:

- **Round Robin** — durchläuft die Zielliste der Reihe nach und gibt jedem Ziel einen gleichen Anteil am Datenverkehr.
- **Wenigste Anfragen** — sendet jede Anfrage an das Ziel, das aktuell die wenigsten laufenden Anfragen hat.
- **Zufällig** — wählt ein Ziel zufällig aus.
- **Power of Two Choices** — wählt zwei zufällige Ziele aus und nimmt das mit weniger laufenden Anfragen; ein guter Standard bei hoher Last, da er den Herdeneffekt einer rein zufälligen Auswahl vermeidet.
- **Erstes** — immer das erste verfügbare Ziel; hauptsächlich nützlich für Tests und A/B-Szenarien.

:::example Richtlinie eines Clusters festlegen
Das Feld `LoadBalancingPolicy` eines Clusters.

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

## Konfiguration

Die Standardrichtlinie ist **Power of Two Choices**, wenn keine angegeben ist. Es werden nur Ziele berücksichtigt, die als fehlerfrei bekannt sind - siehe [Zustandsprüfungen für Ziele](doc:dests-health-checks) dafür, wie ein Ziel als fehlerhaft markiert und aus der Rotation ausgeschlossen wird.

:::note
Die Lastverteilung verteilt Anfragen auf Ziele; sie bindet einen bestimmten Client nicht über mehrere Anfragen hinweg an dasselbe Ziel. Falls Sie das benötigen, siehe stattdessen [Sitzungsaffinität](doc:session-affinity).
:::

## Benutzerdefinierte Richtlinien

Implementieren Sie `ILoadBalancingPolicy` und registrieren Sie sie in der DI, um eigene Auswahllogik einzubinden - derselbe Erweiterungspunkt, auf dem YARPs eigene integrierte Richtlinien aufbauen.
