---
slug: http-client-config
title: HTTP-Client-Konfiguration
lede: >-
  Jeder Cluster erhält seinen eigenen HTTP-Client für die Kommunikation mit seinen Zielen –
  konfigurieren Sie dessen Verbindung, TLS und Verhalten pro Anfrage unabhängig von jedem anderen
  Cluster.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http-client-config
lastUpdated: 2025-02-10
---

## Ein Client pro Cluster

Jeder Cluster besitzt seinen eigenen `HttpMessageInvoker`, der für jede an seine Ziele weitergeleitete Anfrage verwendet wird. Beim Start erhält jeder Cluster einen neuen; ändert sich die Konfiguration eines Clusters später, entscheidet `IForwarderHttpClientFactory`, ob der bestehende Client weiterverwendet werden kann oder ein neuer benötigt wird – die Standardimplementierung erstellt immer dann einen neuen, wenn sich `HttpClientConfig` selbst geändert hat.

## HttpClient-Einstellungen

Wird auf einem Cluster unter `HttpClient` mittels `HttpClientConfig` konfiguriert:

```json
"HttpClient": {
  "SslProtocols": ["Tls12", "Tls13"],
  "MaxConnectionsPerServer": "10",
  "DangerousAcceptAnyServerCertificate": "false",
  "RequestHeaderEncoding": "utf-8",
  "ResponseHeaderEncoding": "utf-8",
  "EnableMultipleHttp2Connections": "true",
  "WebProxy": {
    "Address": "http://myproxy:8080",
    "BypassOnLocal": "true",
    "UseDefaultCredentials": "false"
  }
}
```

- **`SslProtocols`** — welche TLS/SSL-Protokollversionen dieser Client akzeptiert. Standardmäßig ist kein Wert festgelegt.
- **`MaxConnectionsPerServer`** — maximale Anzahl gleichzeitiger HTTP/1.1-Verbindungen zum selben Ziel. Der Standardwert ist `int32.MaxValue`.
- **`DangerousAcceptAnyServerCertificate`** — `true` deaktiviert jegliche Validierung des TLS-Zertifikats des Ziels. Der Standardwert ist `false`; der Name ist eine bewusste Warnung, keine Empfehlung.
- **`RequestHeaderEncoding`** / **`ResponseHeaderEncoding`** — Kodierung (z. B. `"utf-8"`, `"iso-8859-1"`), die über die Header-Encoding-Selektoren von `SocketsHttpHandler` für Nicht-ASCII-Headerwerte bei ausgehenden Anfragen bzw. eingehenden Antworten verwendet wird.
- **`EnableMultipleHttp2Connections`** — erlaubt das Öffnen zusätzlicher HTTP/2-Verbindungen zum selben Ziel, sobald die bestehenden ihr Limit an gleichzeitigen Streams erreichen. Der Standardwert ist `true`.
- **`WebProxy`** — leitet ausgehende Anfragen an Ziele über einen vorgelagerten HTTP-Proxy: `Address` des Proxys, `BypassOnLocal`, um ihn für lokale Adressen zu umgehen, `UseDefaultCredentials`, um sich mit den eigenen Anmeldeinformationen der App bei ihm zu authentifizieren.

:::important
Wenn Sie hier eine andere Header-Kodierung als ASCII festlegen, muss auch dem Server, auf dem YARP gehostet wird, mitgeteilt werden, dass er sie akzeptieren soll. Bei Kestrel bedeutet das, `KestrelServerOptions.RequestHeaderEncodingSelector`/`ResponseHeaderEncodingSelector` passend zu setzen – andernfalls weist Kestrel genau die Header zurück, die diese Einstellung eigentlich zulassen sollte.

```csharp
builder.WebHost.ConfigureKestrel(kestrel =>
{
    kestrel.RequestHeaderEncodingSelector = _ => Encoding.Latin1;
    kestrel.ResponseHeaderEncodingSelector = _ => Encoding.Latin1;
});
```
:::

## HttpRequest-Einstellungen

Wird auf einem Cluster unter `HttpRequest` mittels `ForwarderRequestConfig` konfiguriert – diese Einstellungen betreffen die ausgehende Anfrage selbst, nicht die zugrunde liegende Verbindung:

```json
"HttpRequest": {
  "ActivityTimeout": "00:01:40",
  "Version": "2",
  "VersionPolicy": "RequestVersionOrLower",
  "AllowResponseBuffering": "false"
}
```

- **`ActivityTimeout`** — wie lange eine Anfrage zwischen Operationen inaktiv bleiben darf, bevor sie abgebrochen wird. Der Standardwert ist 100 Sekunden; er wird zurückgesetzt, sobald Antwort-Header eintreffen oder Anfrage-/Antwort-/Streamingdaten (gRPC, WebSockets) gelesen oder geschrieben werden. TCP-Keep-Alives und HTTP/2-Pings setzen ihn nicht zurück; WebSocket-Pings hingegen schon.
- **`Version`** — die ausgehende HTTP-Version: `1.0`, `1.1`, `2` oder `3`. Der Standardwert ist `2`.
- **`VersionPolicy`** — wie die endgültige Version ausgewählt wird: `RequestVersionOrLower` (Standard), `RequestVersionOrHigher` oder `RequestVersionExact`.
- **`AllowResponseBuffering`** — erlaubt Schreibpufferung beim Zurücksenden der Antwort an den Client, sofern der Host dies unterstützt. Bricht bei Aktivierung Server-Sent Events.

:::example Zwei Cluster mit unterschiedlichen HTTP-Einstellungen
```json
{
  "Clusters": {
    "cluster1": {
      "LoadBalancingPolicy": "Random",
      "HttpClient": { "SslProtocols": ["Tls12"], "MaxConnectionsPerServer": "10" },
      "HttpRequest": { "ActivityTimeout": "00:00:30" },
      "Destinations": {
        "cluster1/destination1": { "Address": "https://localhost:10000/" }
      }
    },
    "cluster2": {
      "HttpClient": { "SslProtocols": ["Tls12"] },
      "HttpRequest": { "Version": "1.1", "VersionPolicy": "RequestVersionExact" },
      "Destinations": {
        "cluster2/destination1": { "Address": "https://localhost:10001/" }
      }
    }
  }
}
```
:::

## Konfiguration im Code

Dieselben Einstellungen gelten, wenn Cluster direkt im Code statt aus `IConfiguration` erstellt werden – weisen Sie `ClusterConfig.HttpClient` ein `HttpClientConfig` zu, bevor Sie den Cluster an `LoadFromMemory` übergeben:

```csharp
var clusters = new[]
{
    new ClusterConfig
    {
        ClusterId = "cluster1",
        Destinations = { { "destination1", new DestinationConfig { Address = "https://localhost:10000" } } },
        HttpClient = new HttpClientConfig
        {
            MaxConnectionsPerServer = 10,
            SslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13,
        },
    },
};

services.AddReverseProxy().LoadFromMemory(routes, clusters);
```

Für alles, was das Schema nicht abdeckt, macht `ConfigureHttpClient` den zugrunde liegenden `SocketsHttpHandler` direkt zugänglich – es läuft jedes Mal, wenn ein Cluster hinzugefügt oder geändert wird, nachdem die eigenen Einstellungen des Clusters bereits angewendet wurden:

```csharp
services.AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.ClientCertificates.Add(clientCert);
    });
```

## Die Client-Factory vollständig ersetzen

Für vollständige Kontrolle ersetzen Sie `IForwarderHttpClientFactory` durch eine eigene Implementierung – die meisten Fälle deckt eine Ableitung von der Standardimplementierung `ForwarderHttpClientFactory` ab. Eine benutzerdefinierte Factory sollte weiterhin dieselben `SocketsHttpHandler`-Eigenschaften setzen wie die Standardimplementierung, um das Proxy-Verhalten nicht zu beeinträchtigen oder unnötigen Overhead zu erzeugen: `UseProxy = false`, `AllowAutoRedirect = false`, `AutomaticDecompression = DecompressionMethods.None`, `UseCookies = false`.

:::important
Geben Sie stets einen `HttpMessageInvoker` zurück, keinen `HttpClient` – `HttpClient` puffert Antworten standardmäßig, was Streaming unterbricht und Latenz sowie Speicher-Overhead hinzufügt, den reines Proxying nicht benötigt.
:::
