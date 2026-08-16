---
slug: http-client-config
title: Configuration du client HTTP
lede: >-
  Chaque cluster dispose de son propre client HTTP pour communiquer avec ses destinations -
  configurez sa connexion, TLS et son comportement par requête indépendamment de tout autre
  cluster.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http-client-config
lastUpdated: 2025-02-10
---

## Un client par cluster

Chaque cluster possède son propre `HttpMessageInvoker`, utilisé pour chaque requête transférée vers ses destinations. Au démarrage, chaque cluster en reçoit un nouveau ; si la configuration d'un cluster change ultérieurement, `IForwarderHttpClientFactory` détermine si le client existant peut continuer à être utilisé ou si un nouveau est nécessaire - l'implémentation par défaut en crée un nouveau chaque fois que `HttpClientConfig` lui-même a changé.

## Paramètres HttpClient

Configuré sous `HttpClient` sur un cluster, à l'aide de `HttpClientConfig` :

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

- **`SslProtocols`** — les versions de protocole TLS/SSL que ce client accepte. Aucune valeur n'est définie par défaut.
- **`MaxConnectionsPerServer`** — nombre maximal de connexions HTTP/1.1 simultanées vers une même destination. La valeur par défaut est `int32.MaxValue`.
- **`DangerousAcceptAnyServerCertificate`** — la valeur `true` désactive toute validation du certificat TLS de la destination. La valeur par défaut est `false` ; ce nom est un avertissement délibéré, pas une suggestion.
- **`RequestHeaderEncoding`** / **`ResponseHeaderEncoding`** — encodage (par exemple `"utf-8"`, `"iso-8859-1"`) utilisé pour les valeurs d'en-tête non-ASCII sur les requêtes sortantes / réponses entrantes, via les sélecteurs d'encodage d'en-têtes de `SocketsHttpHandler`.
- **`EnableMultipleHttp2Connections`** — autorise l'ouverture de connexions HTTP/2 supplémentaires vers la même destination une fois que les connexions existantes atteignent leur limite de flux simultanés. La valeur par défaut est `true`.
- **`WebProxy`** — achemine les requêtes sortantes vers les destinations à travers un proxy HTTP amont : `Address` du proxy, `BypassOnLocal` pour le contourner pour les adresses locales, `UseDefaultCredentials` pour s'y authentifier avec les propres informations d'identification de l'application.

:::important
Si vous définissez ici un encodage d'en-tête autre qu'ASCII, le serveur qui héberge YARP doit également être informé de l'accepter. Pour Kestrel, cela signifie définir `KestrelServerOptions.RequestHeaderEncodingSelector`/`ResponseHeaderEncodingSelector` en conséquence - sinon Kestrel rejette précisément les en-têtes que ce paramètre était censé autoriser.

```csharp
builder.WebHost.ConfigureKestrel(kestrel =>
{
    kestrel.RequestHeaderEncodingSelector = _ => Encoding.Latin1;
    kestrel.ResponseHeaderEncodingSelector = _ => Encoding.Latin1;
});
```
:::

## Paramètres HttpRequest

Configuré sous `HttpRequest` sur un cluster, à l'aide de `ForwarderRequestConfig` - ces paramètres régissent la requête sortante elle-même, et non la connexion sous-jacente :

```json
"HttpRequest": {
  "ActivityTimeout": "00:01:40",
  "Version": "2",
  "VersionPolicy": "RequestVersionOrLower",
  "AllowResponseBuffering": "false"
}
```

- **`ActivityTimeout`** — durée pendant laquelle une requête peut rester inactive entre deux opérations avant d'être annulée. La valeur par défaut est 100 secondes ; elle est réinitialisée dès que les en-têtes de réponse arrivent ou que des données de requête/réponse/streaming (gRPC, WebSockets) sont lues ou écrites. Les keep-alive TCP et les pings HTTP/2 ne la réinitialisent pas ; les pings WebSocket, si.
- **`Version`** — la version HTTP sortante : `1.0`, `1.1`, `2` ou `3`. La valeur par défaut est `2`.
- **`VersionPolicy`** — la façon dont la version finale est choisie : `RequestVersionOrLower` (par défaut), `RequestVersionOrHigher` ou `RequestVersionExact`.
- **`AllowResponseBuffering`** — autorise la mise en mémoire tampon en écriture lors du renvoi de la réponse au client, si l'hôte le prend en charge. Casse les server-sent events si cette option est activée.

:::example Deux clusters avec des paramètres HTTP différents
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

## Configurer dans le code

Les mêmes paramètres s'appliquent lors de la construction directe des clusters plutôt qu'à partir d'`IConfiguration` - affectez un `HttpClientConfig` à `ClusterConfig.HttpClient` avant de transmettre le cluster à `LoadFromMemory` :

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

Pour tout ce que le schéma ne couvre pas, `ConfigureHttpClient` expose directement le `SocketsHttpHandler` sous-jacent - il s'exécute chaque fois qu'un cluster est ajouté ou modifié, après que les paramètres propres au cluster ont déjà été appliqués :

```csharp
services.AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.ClientCertificates.Add(clientCert);
    });
```

## Remplacer entièrement la fabrique de clients

Pour un contrôle total, remplacez `IForwarderHttpClientFactory` par une implémentation personnalisée - hériter de `ForwarderHttpClientFactory`, l'implémentation par défaut, couvre la plupart des cas. Une fabrique personnalisée doit tout de même définir les mêmes propriétés `SocketsHttpHandler` que celle par défaut, afin de ne pas casser le comportement du proxy ni ajouter de surcharge inutile : `UseProxy = false`, `AllowAutoRedirect = false`, `AutomaticDecompression = DecompressionMethods.None`, `UseCookies = false`.

:::important
Retournez toujours un `HttpMessageInvoker`, et non un `HttpClient` - `HttpClient` met les réponses en mémoire tampon par défaut, ce qui casse le streaming et ajoute une latence ainsi qu'une surcharge mémoire dont un simple relais proxy n'a pas besoin.
:::
