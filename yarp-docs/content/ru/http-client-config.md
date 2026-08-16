---
slug: http-client-config
title: Настройка HTTP-клиента
lede: >-
  У каждого кластера есть собственный HTTP-клиент для обращения к его узлам назначения —
  настраивайте его подключение, TLS и поведение на уровне запроса независимо от любого другого кластера.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http-client-config
lastUpdated: 2025-02-10
---

## Один клиент на кластер

У каждого кластера есть собственный `HttpMessageInvoker`, который используется для каждого запроса, перенаправляемого к его узлам назначения. При запуске каждый кластер получает новый экземпляр; если конфигурация кластера впоследствии меняется, `IForwarderHttpClientFactory` решает, можно ли продолжать использовать существующий клиент или требуется новый — реализация по умолчанию создаёт новый клиент при каждом изменении самого `HttpClientConfig`.

## Настройки HttpClient

Настраиваются в разделе `HttpClient` кластера с помощью `HttpClientConfig`:

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

- **`SslProtocols`** — версии протокола TLS/SSL, которые принимает этот клиент. По умолчанию значение не задано.
- **`MaxConnectionsPerServer`** — максимальное количество одновременных подключений HTTP/1.1 к одному и тому же узлу назначения. По умолчанию — `int32.MaxValue`.
- **`DangerousAcceptAnyServerCertificate`** — значение `true` отключает любую проверку TLS-сертификата узла назначения. По умолчанию — `false`; само название параметра — намеренное предупреждение, а не рекомендация к использованию.
- **`RequestHeaderEncoding`** / **`ResponseHeaderEncoding`** — кодировка (например, `"utf-8"`, `"iso-8859-1"`), используемая для значений заголовков за пределами ASCII в исходящих запросах / входящих ответах, через селекторы кодировки заголовков `SocketsHttpHandler`.
- **`EnableMultipleHttp2Connections`** — разрешает открывать дополнительные HTTP/2-подключения к одному и тому же узлу назначения после того, как существующие достигают предела одновременных потоков. По умолчанию — `true`.
- **`WebProxy`** — направляет исходящие запросы к узлам назначения через вышестоящий HTTP-прокси: `Address` — адрес прокси, `BypassOnLocal` — пропускать его для локальных адресов, `UseDefaultCredentials` — выполнять на нём аутентификацию с использованием собственных учётных данных приложения.

:::important
Если здесь задать кодировку заголовков, отличную от ASCII, серверу, на котором размещён YARP, также нужно указать принимать её. Для Kestrel это означает установку соответствующих `KestrelServerOptions.RequestHeaderEncodingSelector`/`ResponseHeaderEncodingSelector` — иначе Kestrel будет отклонять как раз те заголовки, которые этот параметр призван разрешить.

```csharp
builder.WebHost.ConfigureKestrel(kestrel =>
{
    kestrel.RequestHeaderEncodingSelector = _ => Encoding.Latin1;
    kestrel.ResponseHeaderEncodingSelector = _ => Encoding.Latin1;
});
```
:::

## Настройки HttpRequest

Настраиваются в разделе `HttpRequest` кластера с помощью `ForwarderRequestConfig` — эти параметры управляют самим исходящим запросом, а не базовым подключением:

```json
"HttpRequest": {
  "ActivityTimeout": "00:01:40",
  "Version": "2",
  "VersionPolicy": "RequestVersionOrLower",
  "AllowResponseBuffering": "false"
}
```

- **`ActivityTimeout`** — как долго запрос может простаивать между операциями, прежде чем он будет отменён. По умолчанию — 100 секунд; сбрасывается при получении заголовков ответа или при чтении/записи данных запроса/ответа/потоковой передачи (gRPC, WebSocket). TCP keep-alive и пинги HTTP/2 таймер не сбрасывают; пинги WebSocket — сбрасывают.
- **`Version`** — версия исходящего HTTP: `1.0`, `1.1`, `2` или `3`. По умолчанию — `2`.
- **`VersionPolicy`** — как выбирается итоговая версия: `RequestVersionOrLower` (по умолчанию), `RequestVersionOrHigher` или `RequestVersionExact`.
- **`AllowResponseBuffering`** — разрешает буферизацию записи при отправке ответа обратно клиенту, если хост это поддерживает. При включении нарушает работу server-sent events.

:::example Два кластера с разными настройками HTTP
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

## Настройка в коде

Те же настройки применимы и при построении кластеров непосредственно в коде, а не из `IConfiguration` — присвойте `HttpClientConfig` свойству `ClusterConfig.HttpClient` перед передачей кластера в `LoadFromMemory`:

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

Для всего, что не охвачено схемой, `ConfigureHttpClient` предоставляет прямой доступ к базовому `SocketsHttpHandler` — он выполняется при каждом добавлении или изменении кластера, уже после применения собственных настроек кластера:

```csharp
services.AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.ClientCertificates.Add(clientCert);
    });
```

## Полная замена фабрики клиентов

Для полного контроля замените `IForwarderHttpClientFactory` собственной реализацией — наследование от стандартной `ForwarderHttpClientFactory` покрывает большинство случаев. Пользовательская фабрика всё равно должна устанавливать те же свойства `SocketsHttpHandler`, что и стандартная, чтобы не нарушить поведение прокси-сервера и не добавить лишних издержек: `UseProxy = false`, `AllowAutoRedirect = false`, `AutomaticDecompression = DecompressionMethods.None`, `UseCookies = false`.

:::important
Всегда возвращайте `HttpMessageInvoker`, а не `HttpClient` — `HttpClient` по умолчанию буферизует ответы, что нарушает потоковую передачу и добавляет издержки по задержке и памяти, не нужные при простом проксировании.
:::
