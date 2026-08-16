---
slug: http-client-config
title: Configuración del cliente HTTP
lede: >-
  Cada clúster obtiene su propio cliente HTTP para comunicarse con sus destinos - configure su
  conexión, TLS y comportamiento por solicitud de forma independiente de cualquier otro clúster.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http-client-config
lastUpdated: 2025-02-10
---

## Un cliente por clúster

Cada clúster tiene su propio `HttpMessageInvoker`, que se usa para cada solicitud reenviada a sus destinos. Al iniciar, cada clúster obtiene uno nuevo; si la configuración de un clúster cambia posteriormente, `IForwarderHttpClientFactory` decide si el cliente existente puede seguir usándose o si se necesita uno nuevo - la implementación predeterminada crea uno nuevo siempre que `HttpClientConfig` haya cambiado.

## Configuración de HttpClient

Se configura bajo `HttpClient` en un clúster, mediante `HttpClientConfig`:

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

- **`SslProtocols`** — qué versiones de protocolo TLS/SSL acepta este cliente. No se establece ningún valor de forma predeterminada.
- **`MaxConnectionsPerServer`** — número máximo de conexiones HTTP/1.1 simultáneas al mismo destino. El valor predeterminado es `int32.MaxValue`.
- **`DangerousAcceptAnyServerCertificate`** — `true` deshabilita toda la validación del certificado TLS del destino. El valor predeterminado es `false`; el nombre es una advertencia deliberada, no una sugerencia.
- **`RequestHeaderEncoding`** / **`ResponseHeaderEncoding`** — codificación (por ejemplo, `"utf-8"`, `"iso-8859-1"`) usada para los valores de encabezado que no son ASCII en las solicitudes salientes y las respuestas entrantes, a través de los selectores de codificación de encabezados de `SocketsHttpHandler`.
- **`EnableMultipleHttp2Connections`** — permite abrir conexiones HTTP/2 adicionales al mismo destino una vez que las existentes alcanzan su límite de secuencias simultáneas. El valor predeterminado es `true`.
- **`WebProxy`** — enruta las solicitudes salientes a los destinos a través de un proxy HTTP ascendente: `Address` del proxy, `BypassOnLocal` para omitirlo en las direcciones locales, `UseDefaultCredentials` para autenticarse ante él con las credenciales propias de la aplicación.

:::important
Si aquí establece una codificación de encabezado distinta de ASCII, también debe indicarle al servidor que hospeda YARP que la acepte. En el caso de Kestrel, eso significa establecer `KestrelServerOptions.RequestHeaderEncodingSelector`/`ResponseHeaderEncodingSelector` para que coincidan - de lo contrario, Kestrel rechaza precisamente los encabezados que esta opción pretendía permitir.

```csharp
builder.WebHost.ConfigureKestrel(kestrel =>
{
    kestrel.RequestHeaderEncodingSelector = _ => Encoding.Latin1;
    kestrel.ResponseHeaderEncodingSelector = _ => Encoding.Latin1;
});
```
:::

## Configuración de HttpRequest

Se configura bajo `HttpRequest` en un clúster, mediante `ForwarderRequestConfig` - estos valores rigen la propia solicitud saliente, no la conexión subyacente:

```json
"HttpRequest": {
  "ActivityTimeout": "00:01:40",
  "Version": "2",
  "VersionPolicy": "RequestVersionOrLower",
  "AllowResponseBuffering": "false"
}
```

- **`ActivityTimeout`** — cuánto tiempo puede permanecer inactiva una solicitud entre operaciones antes de cancelarse. El valor predeterminado es 100 segundos; se reinicia cada vez que llegan encabezados de respuesta o se leen o escriben datos de solicitud, respuesta o streaming (gRPC, WebSockets). Los keep-alive de TCP y los pings de HTTP/2 no lo reinician; los pings de WebSocket sí.
- **`Version`** — la versión de HTTP saliente: `1.0`, `1.1`, `2` o `3`. El valor predeterminado es `2`.
- **`VersionPolicy`** — cómo se elige la versión final: `RequestVersionOrLower` (valor predeterminado), `RequestVersionOrHigher` o `RequestVersionExact`.
- **`AllowResponseBuffering`** — permite el almacenamiento en búfer de escritura al devolver la respuesta al cliente, si el host lo admite. Si se habilita, interrumpe los eventos enviados por el servidor.

:::example Dos clústeres con distinta configuración HTTP
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

## Configuración en código

Los mismos valores se aplican al construir clústeres directamente en lugar de hacerlo desde `IConfiguration` - asigne un `HttpClientConfig` a `ClusterConfig.HttpClient` antes de pasar el clúster a `LoadFromMemory`:

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

Para todo lo que el esquema no cubra, `ConfigureHttpClient` expone directamente el `SocketsHttpHandler` subyacente - se ejecuta cada vez que se agrega o cambia un clúster, después de que ya se hayan aplicado los valores propios del clúster:

```csharp
services.AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.ClientCertificates.Add(clientCert);
    });
```

## Sustitución completa de la fábrica de clientes

Para tener control total, sustituya `IForwarderHttpClientFactory` por una implementación personalizada - derivar de la `ForwarderHttpClientFactory` predeterminada cubre la mayoría de los casos. Una fábrica personalizada debe seguir estableciendo las mismas propiedades de `SocketsHttpHandler` que establece la predeterminada, para no alterar el comportamiento del proxy ni agregar sobrecarga innecesaria: `UseProxy = false`, `AllowAutoRedirect = false`, `AutomaticDecompression = DecompressionMethods.None`, `UseCookies = false`.

:::important
Devuelva siempre un `HttpMessageInvoker`, no un `HttpClient` - `HttpClient` almacena las respuestas en búfer de forma predeterminada, lo que interrumpe el streaming y agrega latencia y sobrecarga de memoria que el proxy simple no necesita.
:::
