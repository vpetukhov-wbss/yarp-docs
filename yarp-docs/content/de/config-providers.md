---
slug: config-providers
title: Konfigurationsprovider
lede: >-
  Laden Sie Routen und Cluster programmgesteuert statt aus einer Datei, indem Sie
  IProxyConfigProvider selbst implementieren – nützlich für eine Datenbank, eine Remote-API oder
  jede andere Quelle.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-providers
lastUpdated: 2025-02-10
---

## Die Provider-Schnittstelle

[Konfigurationsdateien](doc:config-files) decken den üblichen Fall des Ladens aus `IConfiguration` ab. Um von anderswoher zu laden, implementieren Sie `IProxyConfigProvider` und `IProxyConfig` selbst.

`IProxyConfigProvider` besitzt eine einzige Methode, `GetConfig()`, die ein `IProxyConfig` zurückgibt – eine Momentaufnahme mit den aktuellen Routen und Clustern sowie ein `IChangeToken`, das der Provider immer dann auslöst, wenn diese Momentaufnahme veraltet ist, was den Proxy veranlasst, `GetConfig()` erneut aufzurufen.

## Routen und Cluster direkt laden

Für den einfachsten Fall – Routen und Cluster, die vollständig im Code bekannt sind – ist `InMemoryConfigProvider` ein fertiger `IProxyConfigProvider`:

```csharp
services.AddReverseProxy().LoadFromMemory(routes, clusters);
```

Um diese Konfiguration später zu ändern, lösen Sie `InMemoryConfigProvider` aus dem Dienstcontainer auf und rufen Sie `Update` auf:

```csharp
httpContext.RequestServices.GetRequiredService<InMemoryConfigProvider>()
    .Update(routes, clusters);
```

## Lebenszyklus des Providers

### Start

`IProxyConfigProvider` wird als Singleton registriert. Beim Start löst der Proxy ihn auf und ruft einmal `GetConfig()` auf; der Provider kann dabei:

- einen Fehler auslösen, wenn er keine gültige Konfiguration erzeugen kann – dies verhindert den Start der Anwendung;
- synchron blockieren, bis die Konfiguration geladen ist, wodurch sich der Start verzögert, bis gültige Routendaten vorliegen; oder
- sofort ein leeres `IProxyConfig` zurückgeben und im Hintergrund laden, wobei sein `IChangeToken` ausgelöst wird, sobald echte Daten bereitstehen.

Jede zurückgegebene Konfiguration wird validiert, und ein ungültiges Ergebnis löst eine Ausnahme aus, die den Start verhindert – ein Provider kann stattdessen zuerst mit `IConfigValidator` selbst vorvalidieren und ungültige Einträge ausschließen.

Routen- und Cluster-Objekte, die dem Proxy übergeben werden, sollten nach der Rückgabe durch `GetConfig()` als schreibgeschützt behandelt werden.

### Neu laden

Wenn das `IChangeToken` aktive Änderungsrückrufe unterstützt, registriert der Proxy nach dem ersten Laden einen solchen; andernfalls wird `HasChanged` alle 5 Minuten abgefragt. Um eine neue Konfiguration zu veröffentlichen, sollte ein Provider sie im Hintergrund laden – dabei neue Routen-/Cluster-Instanzen erstellen, da diese unveränderlich sind, wobei unveränderte Instanzen wiederverwendet werden können –, sie optional validieren und erst dann das *vorherige* `IChangeToken` auslösen. Der Proxy ruft daraufhin erneut `GetConfig()` auf und vergleicht das Ergebnis mit der aktuellen Konfiguration, wobei nur geänderte Teile aktualisiert werden; der Austausch erfolgt atomar und betrifft nur neue Anfragen, nicht bereits laufende.

:::important
`IChangeToken`s sind nur einmal verwendbar. Wirft `GetConfig()` während eines Neuladens einen Fehler, verliert der Proxy die Fähigkeit, auf weitere Änderungen dieses Providers zu reagieren. Alle anderen Fehler beim Neuladen werden stattdessen protokolliert und unterdrückt, und der Proxy verwendet weiterhin die zuletzt bekannte funktionierende Konfiguration.
:::

Werden mehrere Neuladevorgänge kurz hintereinander signalisiert, kann der Proxy einige davon überspringen und lädt stattdessen das, was verfügbar ist, sobald er aufholt – jedes `IProxyConfig` ist eine vollständige Momentaufnahme und kein Diff, sodass durch das Überspringen einer Zwischenversion nichts verloren geht.

## Mehrere Provider

Es können mehrere `IProxyConfigProvider` als Singleton registriert werden; alle werden aufgelöst und ihre Konfigurationen zusammengeführt, ebenso wie mehrere Abschnitte einer [Konfigurationsdatei](doc:config-files) kombiniert werden können. Eine Route eines Providers kann auf einen Cluster eines anderen verweisen, aber eine einzelne Route oder ein einzelner Cluster kann nicht aus partiellen Daten zusammengesetzt werden, die sich über zwei Provider verteilen.
