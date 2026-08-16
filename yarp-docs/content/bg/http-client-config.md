---
slug: http-client-config
title: Конфигурация на HTTP клиента
lede: >-
  Всеки клъстер получава собствен HTTP клиент за комуникация с дестинациите си - конфигурирайте
  връзката, TLS и поведението за отделните заявки независимо от всеки друг клъстер.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http-client-config
lastUpdated: 2025-02-10
---

## По един клиент за клъстер

Всеки клъстер има собствен `HttpMessageInvoker`, използван за всяка заявка, препратена към неговите дестинации. При стартиране всеки клъстер получава нов такъв; ако конфигурацията на клъстера по-късно се промени, `IForwarderHttpClientFactory` решава дали съществуващият клиент може да продължи да се използва, или е необходим нов - реализацията по подразбиране създава нов винаги, когато самият `HttpClientConfig` се е променил.

## Настройки на HttpClient

Конфигурират се под `HttpClient` на клъстер, чрез `HttpClientConfig`:

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

- **`SslProtocols`** — кои версии на протокола TLS/SSL приема този клиент. По подразбиране не е зададена стойност.
- **`MaxConnectionsPerServer`** — максимален брой едновременни HTTP/1.1 връзки към една и съща дестинация. По подразбиране е `int32.MaxValue`.
- **`DangerousAcceptAnyServerCertificate`** — `true` изключва цялата валидация на TLS сертификата на дестинацията. По подразбиране е `false`; името е умишлено предупреждение, а не препоръка.
- **`RequestHeaderEncoding`** / **`ResponseHeaderEncoding`** — кодировка (напр. `"utf-8"`, `"iso-8859-1"`), използвана за стойности на заглавки извън ASCII при изходящите заявки / входящите отговори, чрез селекторите за кодировка на заглавки на `SocketsHttpHandler`.
- **`EnableMultipleHttp2Connections`** — позволява отварянето на допълнителни HTTP/2 връзки към една и съща дестинация, след като съществуващите достигнат лимита си за едновременни потоци. По подразбиране е `true`.
- **`WebProxy`** — насочва изходящите заявки към дестинациите през upstream HTTP прокси: `Address` на проксито, `BypassOnLocal`, за да се пропуска за локални адреси, `UseDefaultCredentials`, за да се удостоверява пред него с идентификационните данни на самото приложение.

:::important
Ако тук зададете кодировка на заглавките, различна от ASCII, сървърът, хостващ YARP, също трябва да бъде инструктиран да я приема. За Kestrel това означава задаване на `KestrelServerOptions.RequestHeaderEncodingSelector`/`ResponseHeaderEncodingSelector` в съответствие с това - иначе Kestrel отхвърля точно онези заглавки, които тази настройка е трябвало да разреши.

```csharp
builder.WebHost.ConfigureKestrel(kestrel =>
{
    kestrel.RequestHeaderEncodingSelector = _ => Encoding.Latin1;
    kestrel.ResponseHeaderEncodingSelector = _ => Encoding.Latin1;
});
```
:::

## Настройки на HttpRequest

Конфигурират се под `HttpRequest` на клъстер, чрез `ForwarderRequestConfig` - те управляват самата изходяща заявка, а не основната връзка:

```json
"HttpRequest": {
  "ActivityTimeout": "00:01:40",
  "Version": "2",
  "VersionPolicy": "RequestVersionOrLower",
  "AllowResponseBuffering": "false"
}
```

- **`ActivityTimeout`** — колко дълго заявката може да остане неактивна между операциите, преди да бъде отменена. По подразбиране е 100 секунди; нулира се при пристигане на заглавки на отговора или при четене/запис на данни от заявката/отговора/поточно предаване (gRPC, WebSockets). TCP keep-alive пакетите и HTTP/2 ping пакетите не я нулират; WebSocket ping пакетите го правят.
- **`Version`** — изходящата HTTP версия: `1.0`, `1.1`, `2` или `3`. По подразбиране е `2`.
- **`VersionPolicy`** — как се избира крайната версия: `RequestVersionOrLower` (по подразбиране), `RequestVersionOrHigher` или `RequestVersionExact`.
- **`AllowResponseBuffering`** — разрешава буфериране при запис при изпращане на отговора обратно към клиента, ако хостът го поддържа. Нарушава server-sent events, ако е включено.

:::example Два клъстера с различни HTTP настройки
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

## Конфигуриране в кода

Същите настройки важат и при изграждане на клъстери директно, а не от `IConfiguration` - задайте `HttpClientConfig` на `ClusterConfig.HttpClient`, преди да подадете клъстера на `LoadFromMemory`:

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

За всичко, което схемата не покрива, `ConfigureHttpClient` предоставя директен достъп до основния `SocketsHttpHandler` - той се изпълнява всеки път, когато клъстер бъде добавен или променен, след като собствените настройки на клъстера вече са били приложени:

```csharp
services.AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.ClientCertificates.Add(clientCert);
    });
```

## Пълна замяна на фабриката за клиенти

За пълен контрол заменете `IForwarderHttpClientFactory` със собствена реализация - наследяването от стандартния `ForwarderHttpClientFactory` покрива повечето случаи. Персонализираната фабрика все пак трябва да задава същите свойства на `SocketsHttpHandler`, каквито задава и стандартната, за да не наруши поведението на проксито и да не добави ненужни разходи: `UseProxy = false`, `AllowAutoRedirect = false`, `AutomaticDecompression = DecompressionMethods.None`, `UseCookies = false`.

:::important
Винаги връщайте `HttpMessageInvoker`, а не `HttpClient` - `HttpClient` буферира отговорите по подразбиране, което нарушава поточното предаване и добавя латентност и разход на памет, от които обикновеното проксиране няма нужда.
:::
