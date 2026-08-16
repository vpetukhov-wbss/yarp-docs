---
slug: http-client-config
title: Configuração do cliente HTTP
lede: >-
  Cada cluster recebe seu próprio cliente HTTP para se comunicar com seus destinos - configure a
  conexão, o TLS e o comportamento por requisição de forma independente para cada cluster.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http-client-config
lastUpdated: 2025-02-10
---

## Um cliente por cluster

Cada cluster tem seu próprio `HttpMessageInvoker`, usado em toda requisição encaminhada para seus destinos. Na inicialização, cada cluster recebe um novo; se a configuração de um cluster mudar posteriormente, `IForwarderHttpClientFactory` decide se o cliente existente pode continuar sendo usado ou se um novo é necessário - a implementação padrão cria um novo sempre que o próprio `HttpClientConfig` tiver mudado.

## Configurações de HttpClient

Configuradas em `HttpClient` em um cluster, usando `HttpClientConfig`:

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

- **`SslProtocols`** — quais versões de protocolo TLS/SSL esse cliente aceita. Nenhum valor é definido por padrão.
- **`MaxConnectionsPerServer`** — número máximo de conexões HTTP/1.1 simultâneas para o mesmo destino. O padrão é `int32.MaxValue`.
- **`DangerousAcceptAnyServerCertificate`** — `true` desabilita toda a validação do certificado TLS do destino. O padrão é `false`; o nome é um aviso deliberado, não uma sugestão.
- **`RequestHeaderEncoding`** / **`ResponseHeaderEncoding`** — codificação (por exemplo, `"utf-8"`, `"iso-8859-1"`) usada para valores de cabeçalho não ASCII em requisições de saída / respostas de entrada, por meio dos seletores de codificação de cabeçalho do `SocketsHttpHandler`.
- **`EnableMultipleHttp2Connections`** — permite abrir conexões HTTP/2 adicionais para o mesmo destino quando as existentes atingem seu limite de streams simultâneos. O padrão é `true`.
- **`WebProxy`** — encaminha as requisições de saída para os destinos por meio de um proxy HTTP upstream: `Address` do proxy, `BypassOnLocal` para ignorá-lo em endereços locais, `UseDefaultCredentials` para se autenticar nele usando as próprias credenciais do aplicativo.

:::important
Se você definir aqui uma codificação de cabeçalho diferente de ASCII, o servidor que hospeda o YARP também precisa ser instruído a aceitá-la. No caso do Kestrel, isso significa definir `KestrelServerOptions.RequestHeaderEncodingSelector`/`ResponseHeaderEncodingSelector` correspondentes - caso contrário, o Kestrel rejeita justamente os cabeçalhos que essa configuração deveria permitir.

```csharp
builder.WebHost.ConfigureKestrel(kestrel =>
{
    kestrel.RequestHeaderEncodingSelector = _ => Encoding.Latin1;
    kestrel.ResponseHeaderEncodingSelector = _ => Encoding.Latin1;
});
```
:::

## Configurações de HttpRequest

Configuradas em `HttpRequest` em um cluster, usando `ForwarderRequestConfig` - elas regem a própria requisição de saída, não a conexão subjacente:

```json
"HttpRequest": {
  "ActivityTimeout": "00:01:40",
  "Version": "2",
  "VersionPolicy": "RequestVersionOrLower",
  "AllowResponseBuffering": "false"
}
```

- **`ActivityTimeout`** — por quanto tempo uma requisição pode ficar ociosa entre operações antes de ser cancelada. O padrão é 100 segundos; é reiniciado sempre que os cabeçalhos de resposta chegam ou dados de requisição/resposta/streaming (gRPC, WebSockets) são lidos ou gravados. Keep-alives de TCP e pings de HTTP/2 não o reiniciam; pings de WebSocket, sim.
- **`Version`** — a versão do HTTP de saída: `1.0`, `1.1`, `2` ou `3`. O padrão é `2`.
- **`VersionPolicy`** — como a versão final é escolhida: `RequestVersionOrLower` (padrão), `RequestVersionOrHigher` ou `RequestVersionExact`.
- **`AllowResponseBuffering`** — permite o buffer de escrita ao enviar a resposta de volta ao cliente, se o host oferecer suporte a isso. Quebra os server-sent events se ativado.

:::example Dois clusters com configurações de HTTP diferentes
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

## Configurando no código

As mesmas configurações se aplicam ao construir clusters diretamente em vez de a partir de `IConfiguration` - atribua um `HttpClientConfig` a `ClusterConfig.HttpClient` antes de passar o cluster para `LoadFromMemory`:

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

Para qualquer coisa que o esquema não cubra, `ConfigureHttpClient` expõe diretamente o `SocketsHttpHandler` subjacente - ele é executado toda vez que um cluster é adicionado ou alterado, depois que as próprias configurações do cluster já foram aplicadas:

```csharp
services.AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.ClientCertificates.Add(clientCert);
    });
```

## Substituindo completamente a fábrica de clientes

Para controle total, substitua `IForwarderHttpClientFactory` por uma implementação personalizada - derivar do `ForwarderHttpClientFactory` padrão cobre a maioria dos casos. Uma fábrica personalizada ainda deve definir as mesmas propriedades de `SocketsHttpHandler` que a padrão define, para evitar quebrar o comportamento do proxy ou adicionar overhead desnecessário: `UseProxy = false`, `AllowAutoRedirect = false`, `AutomaticDecompression = DecompressionMethods.None`, `UseCookies = false`.

:::important
Sempre retorne um `HttpMessageInvoker`, não um `HttpClient` - o `HttpClient` armazena respostas em buffer por padrão, o que quebra o streaming e adiciona latência e overhead de memória que o proxying simples não precisa.
:::
