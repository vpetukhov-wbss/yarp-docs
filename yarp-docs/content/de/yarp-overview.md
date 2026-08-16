---
slug: yarp-overview
title: Überblick über YARP
lede: >-
  YARP (Yet Another Reverse Proxy) ist eine hochgradig anpassbare Reverse-Proxy-Bibliothek für
  .NET — entwickelt, um robust, flexibel, skalierbar und sicher zu sein und sich leicht vor die
  bereits vorhandenen Dienste stellen zu lassen.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/yarp-overview
lastUpdated: 2025-02-21
---

## Einführung

YARP unterstützt Entwickler dabei, leistungsfähige und effiziente Reverse-Proxy-Lösungen zu erstellen, die auf ihre spezifischen Anforderungen zugeschnitten sind. Es sitzt zwischen Client-Geräten und Backend-Servern, leitet Client-Anfragen an das passende Ziel weiter und gibt die Antwort zurück — dieselbe Rolle, die auch nginx oder Envoy übernehmen, jedoch als Bibliothek, die Sie innerhalb Ihres eigenen ASP.NET Core-Prozesses hosten.

## Was ein Reverse Proxy leistet

Ein Reverse Proxy bietet gegenüber einem reinen Backend mehrere Vorteile:

- **Routing** — leitet Anfragen anhand vordefinierter Regeln, etwa URL-Muster oder Anfrage-Header, an unterschiedliche Backend-Server weiter. `/images`, `/api` und `/db` können jeweils an einen anderen Server geroutet werden.
- **Lastverteilung** — verteilt eingehenden Datenverkehr auf mehrere Backend-Server, um eine Überlastung einzelner Server zu verhindern.
- **Skalierbarkeit** — Backend-Server können hinzugefügt oder entfernt werden, ohne den Client zu beeinträchtigen, da der Datenverkehr vom Proxy verteilt wird.
- **TLS-Terminierung** — entlastet Backend-Server von Ver- und Entschlüsselung und verringert so deren Arbeitslast.
- **Sicherheit** — interne Dienst-Endpunkte bleiben vor externem Zugriff verborgen, wodurch sich die Angriffsfläche verringert.

## Wie ein Reverse Proxy mit HTTP umgeht

Eingehende Verbindungen werden am Proxy terminiert; für ausgehende Anfragen an Ziele werden neue, gepoolte Verbindungen verwendet. Anhand der konfigurierten Routingregeln bestimmt YARP, welcher Cluster die Anfrage bearbeiten soll, leitet sie weiter — wobei Pfad und Header bei Bedarf transformiert werden — und gibt die Antwort des Backends an den Client zurück.

:::example Kurzes Beispiel
Registriert den Proxy und lädt Routen und Cluster direkt aus der Konfiguration.

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
Die Konfiguration wird bei Änderungen der Quelle automatisch neu geladen — ohne dass ein Neustart erforderlich ist. Siehe [Konfigurationsfilter](doc:config-filters), um die Konfiguration während des Ladevorgangs zu ändern.
:::

## Warum YARP anderen Proxys vorziehen

YARP baut auf ASP.NET Core auf und lässt sich dadurch direkt in das .NET-Ökosystem integrieren; es bietet eine Vielzahl von Erweiterungspunkten — Routing, Lastverteilung und Transformationen lassen sich allesamt im vertrauten C# statt in einer proxyspezifischen Konfigurationssprache anpassen. Es wird aktiv von Microsoft gepflegt, und sowohl YARP als auch seine Dokumentation sind Open Source.
