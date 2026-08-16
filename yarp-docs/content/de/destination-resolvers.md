---
slug: destination-resolvers
title: Ziel-Resolver
lede: >-
  YARP verwendet einen Ziel-Resolver, um die Menge der konfigurierten Zieladressen zu erweitern.
  Der
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/destination-resolvers
lastUpdated: 2026-08-11
---

## YARP-Erweiterbarkeit: Ziel-Resolver

## Einführung

YARP verwendet einen Ziel-Resolver, um die Menge der konfigurierten Zieladressen zu erweitern. Der Ziel-Resolver kann als Integrationspunkt mit Systemen zur Dienstermittlung (Service Discovery) verwendet werden.

## Struktur

## IDestinationResolver hat eine einzige Methode

ResolveDestinationsAsync(IReadOnlyDictionary<string, DestinationConfig> destinations,

CancellationToken cancellationToken), die eine ResolvedDestinationCollection-Instanz zurückgeben soll. Die ResolvedDestinationCollection enthält eine Sammlung von DestinationConfig-Instanzen sowie ein IChangeToken, um den Proxy zu benachrichtigen, wenn diese Informationen veraltet sind und neu geladen werden sollten, was dazu führt, dass ResolveDestinationsAsync erneut aufgerufen wird.

## DestinationConfig

DestinationConfig verfügt über eine Host-Eigenschaft, mit der der Standard-Host-Headerwert angegeben werden kann, den der Proxy bei der Kommunikation mit diesem Ziel verwenden soll. Dies ermöglicht es dem IDestinationResolver, Ziele beispielsweise auf eine Sammlung von IP-Adressen aufzulösen, ohne dass SNI- oder hostbasiertes Routing dabei fehlschlägt.

## Lebenszyklus

## Start

Der IDestinationResolver sollte im DI-Container als Singleton registriert werden. Beim Start löst der Proxy diese Instanz auf und ruft ResolveDestinationsAsync(...) mit den konfigurierten Zielen auf, die von den aufgelösten IProxyConfigProviders abgerufen wurden. Bei diesem ersten Aufruf kann der Anbieter Folgendes tun:

Eine Ausnahme auslösen, wenn der Anbieter aus irgendeinem Grund keine gültige Proxykonfiguration erzeugen kann. Dadurch wird der Start der Anwendung verhindert. Die Ziele asynchron auflösen. Dadurch wird der Start der Anwendung so lange verzögert, bis aufgelöste Ziele verfügbar sind.

Oder, er kann eine leere ResolvedDestinationCollection-Instanz zurückgeben, während er

Ziele im Hintergrund auflöst. Der Anbieter muss das

IChangeToken auslösen, sobald die Konfiguration verfügbar ist.

## Atomarität

Die dem Proxy bereitgestellten Zielobjekte und -sammlungen sollten schreibgeschützt sein und nicht mehr geändert werden, sobald sie dem Proxy über GetConfig() übergeben wurden.

## Neuladen

Wenn das IChangeToken ActiveChangeCallbacks unterstützt, registriert der Proxy nach der Verarbeitung der anfänglichen Zielmenge einen Callback bei diesem Token. Unterstützt der Anbieter keine Callbacks, wird HasChanged alle 5 Minuten zusammen mit den IProxyConfig-Änderungstoken abgefragt.

Wenn der Anbieter dem Proxy eine neue Menge von Zielen bereitstellen möchte, sollte er:

Diese Ziele im Hintergrund auflösen. ResolvedDestinationCollection ist unveränderlich, sodass für neue Daten stets neue Instanzen erstellt werden müssen. Objekte für unveränderte Ziele können wiederverwendet werden, oder es können neue Instanzen erstellt werden.

Das von dem vorherigen Aufruf von ResolveDestinationsAsync zurückgegebene IChangeToken ungültig machen.

Sobald die neuen Ziele angewendet wurden, registriert der Proxy einen Callback beim neuen IChangeToken. Beachten Sie, dass der Proxy bei mehreren, kurz aufeinanderfolgend signalisierten Neuladevorgängen einige davon überspringen und Ziele auflösen kann, sobald er bereit ist.

## DNS-Ziel-Resolver

YARP enthält eine Implementierung von IDestinationResolver, die die Menge der konfigurierten Ziele erweitert, indem jeder Hostname per DNS in eine oder mehrere IP-Adressen aufgelöst wird und für jede aufgelöste IP ein Ziel erstellt wird. Der DNS-Ziel-Resolver kann Ihrem Reverse Proxy über die Methode

IReverseProxyBuilder.AddDnsDestinationResolver(Action<DnsDestinationResolverOptions>)

hinzugefügt werden. Die Methode akzeptiert einen optionalen Delegaten, um die Optionen des Resolvers zu konfigurieren, DnsDestinationResolverOptions.

## Beispiel

```csharp
// Add the DNS destination resolver, restricting results to IPv4 addresses
reverseProxyBuilder.AddDnsDestinationResolver(o => o.AddressFamily =
AddressFamily.InterNetwork);
```

## Konfiguration

Die Optionen des DNS-Ziel-Resolvers, DnsDestinationResolverOptions, verfügen über die folgenden Eigenschaften:

## RefreshPeriod

Der Zeitraum zwischen den Anforderungen zur Aktualisierung eines aufgelösten Namens. Der Standardwert beträgt 5 Minuten.

## AddressFamily

Optional können Sie einen System.Net.Sockets.AddressFamily-Wert von AddressFamily.InterNetwork oder AddressFamily.InterNetworkV6 angeben, um die Auflösung auf IPv4- bzw. IPv6-Adressen zu beschränken. Der Standardwert null weist den Resolver an, die Adressfamilie der Ergebnisse nicht einzuschränken und alle zurückgegebenen Adressen zu akzeptieren.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
