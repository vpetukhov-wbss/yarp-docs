---
slug: http-client-config
title: Διαμόρφωση πελάτη HTTP
lede: >-
  Κάθε cluster αποκτά τον δικό του πελάτη HTTP για την επικοινωνία με τους προορισμούς του -
  διαμορφώστε τη σύνδεσή του, το TLS και τη συμπεριφορά ανά αίτημα ανεξάρτητα από κάθε άλλο
  cluster.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http-client-config
lastUpdated: 2025-02-10
---

## Ένας πελάτης ανά cluster

Κάθε cluster διαθέτει το δικό του `HttpMessageInvoker`, το οποίο χρησιμοποιείται για κάθε αίτημα που προωθείται προς τους προορισμούς του. Κατά την εκκίνηση, κάθε cluster αποκτά έναν νέο· αν η διαμόρφωση ενός cluster αλλάξει αργότερα, το `IForwarderHttpClientFactory` αποφασίζει αν ο υπάρχων πελάτης μπορεί να συνεχίσει να χρησιμοποιείται ή αν χρειάζεται νέος - η προεπιλεγμένη υλοποίηση δημιουργεί έναν νέο κάθε φορά που αλλάζει το ίδιο το `HttpClientConfig`.

## Ρυθμίσεις HttpClient

Διαμορφώνονται κάτω από το `HttpClient` σε ένα cluster, χρησιμοποιώντας το `HttpClientConfig`:

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

- **`SslProtocols`** — ποιες εκδόσεις πρωτοκόλλου TLS/SSL δέχεται αυτός ο πελάτης. Δεν ορίζεται καμία τιμή από προεπιλογή.
- **`MaxConnectionsPerServer`** — μέγιστος αριθμός ταυτόχρονων συνδέσεων HTTP/1.1 προς τον ίδιο προορισμό. Η προεπιλογή είναι `int32.MaxValue`.
- **`DangerousAcceptAnyServerCertificate`** — η τιμή `true` απενεργοποιεί κάθε επικύρωση του πιστοποιητικού TLS του προορισμού. Η προεπιλογή είναι `false`· το όνομα αποτελεί σκόπιμη προειδοποίηση, όχι πρόταση.
- **`RequestHeaderEncoding`** / **`ResponseHeaderEncoding`** — η κωδικοποίηση (π.χ. `"utf-8"`, `"iso-8859-1"`) που χρησιμοποιείται για τιμές κεφαλίδων που δεν είναι ASCII, σε εξερχόμενα αιτήματα / εισερχόμενες αποκρίσεις, μέσω των επιλογέων κωδικοποίησης κεφαλίδων του `SocketsHttpHandler`.
- **`EnableMultipleHttp2Connections`** — επιτρέπει το άνοιγμα επιπλέον συνδέσεων HTTP/2 προς τον ίδιο προορισμό μόλις οι υπάρχουσες φτάσουν στο όριό τους ταυτόχρονων ροών (streams). Η προεπιλογή είναι `true`.
- **`WebProxy`** — δρομολογεί τα εξερχόμενα αιτήματα προς τους προορισμούς μέσω ενός upstream HTTP proxy: το `Address` του proxy, το `BypassOnLocal` για να παρακάμπτεται για τοπικές διευθύνσεις, το `UseDefaultCredentials` για έλεγχο ταυτότητας σε αυτό με τα δικά της διαπιστευτήρια της εφαρμογής.

:::important
Αν ορίσετε εδώ μια κωδικοποίηση κεφαλίδων διαφορετική από ASCII, ο διακομιστής που φιλοξενεί το YARP πρέπει επίσης να ενημερωθεί ώστε να την αποδέχεται. Για τον Kestrel, αυτό σημαίνει ότι πρέπει να ορίσετε αντίστοιχα τα `KestrelServerOptions.RequestHeaderEncodingSelector`/`ResponseHeaderEncodingSelector` - διαφορετικά ο Kestrel απορρίπτει ακριβώς τις κεφαλίδες που αυτή η ρύθμιση σκόπευε να επιτρέψει.

```csharp
builder.WebHost.ConfigureKestrel(kestrel =>
{
    kestrel.RequestHeaderEncodingSelector = _ => Encoding.Latin1;
    kestrel.ResponseHeaderEncodingSelector = _ => Encoding.Latin1;
});
```
:::

## Ρυθμίσεις HttpRequest

Διαμορφώνονται κάτω από το `HttpRequest` σε ένα cluster, χρησιμοποιώντας το `ForwarderRequestConfig` - αυτές διέπουν το ίδιο το εξερχόμενο αίτημα, όχι την υποκείμενη σύνδεση:

```json
"HttpRequest": {
  "ActivityTimeout": "00:01:40",
  "Version": "2",
  "VersionPolicy": "RequestVersionOrLower",
  "AllowResponseBuffering": "false"
}
```

- **`ActivityTimeout`** — πόσο καιρό μπορεί ένα αίτημα να παραμείνει ανενεργό μεταξύ λειτουργιών πριν ακυρωθεί. Η προεπιλογή είναι 100 δευτερόλεπτα· επαναφέρεται όποτε φτάνουν κεφαλίδες απόκρισης ή διαβάζονται/γράφονται δεδομένα αιτήματος/απόκρισης/ροής (gRPC, WebSockets). Τα TCP keep-alive και τα HTTP/2 ping δεν το επαναφέρουν· τα WebSocket ping το επαναφέρουν.
- **`Version`** — η εξερχόμενη έκδοση HTTP: `1.0`, `1.1`, `2` ή `3`. Η προεπιλογή είναι `2`.
- **`VersionPolicy`** — πώς επιλέγεται η τελική έκδοση: `RequestVersionOrLower` (προεπιλογή), `RequestVersionOrHigher` ή `RequestVersionExact`.
- **`AllowResponseBuffering`** — επιτρέπει την προσωρινή αποθήκευση εγγραφής (write-buffering) κατά την αποστολή της απόκρισης πίσω στον client, εφόσον ο host το υποστηρίζει. Αν ενεργοποιηθεί, διακόπτει τα server-sent events.

:::example Δύο clusters με διαφορετικές ρυθμίσεις HTTP
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

## Διαμόρφωση μέσω κώδικα

Οι ίδιες ρυθμίσεις ισχύουν όταν δημιουργείτε clusters απευθείας αντί μέσω `IConfiguration` - αναθέστε ένα `HttpClientConfig` στο `ClusterConfig.HttpClient` πριν περάσετε το cluster στη `LoadFromMemory`:

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

Για οτιδήποτε δεν καλύπτει το schema, η `ConfigureHttpClient` εκθέτει απευθείας το υποκείμενο `SocketsHttpHandler` - εκτελείται κάθε φορά που προστίθεται ή αλλάζει ένα cluster, αφού έχουν ήδη εφαρμοστεί οι δικές του ρυθμίσεις:

```csharp
services.AddReverseProxy()
    .ConfigureHttpClient((context, handler) =>
    {
        handler.SslOptions.ClientCertificates.Add(clientCert);
    });
```

## Πλήρης αντικατάσταση του client factory

Για πλήρη έλεγχο, αντικαταστήστε το `IForwarderHttpClientFactory` με μια προσαρμοσμένη υλοποίηση - η κληρονόμηση από το προεπιλεγμένο `ForwarderHttpClientFactory` καλύπτει τις περισσότερες περιπτώσεις. Ένα προσαρμοσμένο factory θα πρέπει και πάλι να ορίζει τις ίδιες ιδιότητες `SocketsHttpHandler` που ορίζει και το προεπιλεγμένο, ώστε να μην διαταράσσεται η συμπεριφορά του διακομιστή μεσολάβησης ή να προστίθεται περιττό overhead: `UseProxy = false`, `AllowAutoRedirect = false`, `AutomaticDecompression = DecompressionMethods.None`, `UseCookies = false`.

:::important
Επιστρέφετε πάντα ένα `HttpMessageInvoker`, όχι ένα `HttpClient` - το `HttpClient` κάνει buffer τις αποκρίσεις από προεπιλογή, κάτι που διακόπτει τη ροή (streaming) και προσθέτει καθυστέρηση και επιβάρυνση μνήμης που η απλή προώθηση δεν χρειάζεται.
:::
