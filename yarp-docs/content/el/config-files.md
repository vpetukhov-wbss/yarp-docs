---
slug: config-files
title: Αρχεία διαμόρφωσης
lede: >-
  Φορτώστε διαδρομές και clusters από το appsettings.json ή από οποιαδήποτε άλλη πηγή
  IConfiguration, και αφήστε τον διακομιστή μεσολάβησης να εντοπίζει τις αλλαγές αυτόματα, χωρίς
  επανεκκίνηση.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-files
lastUpdated: 2025-02-10
---

## Φόρτωση διαμόρφωσης

Το YARP μπορεί να φορτώσει τις διαδρομές και τα clusters του από οποιαδήποτε πηγή `IConfiguration` - το `appsettings.json` στα παρακάτω παραδείγματα, αλλά κάθε πάροχος λειτουργεί με τον ίδιο τρόπο. Ο διακομιστής μεσολάβησης διαβάζει εκ νέου τη διαμόρφωση και εφαρμόζει τις αλλαγές αυτόματα κάθε φορά που η πηγή αλλάζει, χωρίς να απαιτείται επανεκκίνηση.

:::example Program.cs
Καταχωρεί τον διακομιστή μεσολάβησης από την ενότητα "ReverseProxy" της διαμόρφωσης.

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
:::

:::note
Η διαμόρφωση μπορεί να τροποποιηθεί καθώς φορτώνεται, πριν επικυρωθεί και εφαρμοστεί - δείτε [Φίλτρα διαμόρφωσης](doc:config-filters).
:::

## Δομή διαμόρφωσης

Η ονομασμένη ενότητα που περνά στη `LoadFromConfig` - η `"ReverseProxy"` παραπάνω - περιέχει δύο υποενότητες: τις `Routes` και τις `Clusters`.

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": {
          "Path": "{**catch-all}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"]
        }
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

## Διαδρομές

Το `Routes` είναι μια μη ταξινομημένη συλλογή καταχωρίσεων διαδρομών, καθεμία από τις οποίες απαιτεί τουλάχιστον:

- **`RouteId`** — ένα μοναδικό όνομα για τη διαδρομή.
- **`ClusterId`** — το όνομα μιας καταχώρισης στο `Clusters` προς την οποία αποστέλλονται τα αιτήματα που ταιριάζουν με αυτή τη διαδρομή.
- **`Match`** — έναν πίνακα `Hosts`, ένα μοτίβο `Path` (ένα route template του ASP.NET Core), ή και τα δύο.

Όταν περισσότερες από μία διαδρομές θα μπορούσαν να ταιριάξουν με ένα αίτημα, επικρατεί η πιο συγκεκριμένη διαδρομή - δείτε [Δρομολόγηση με βάση κεφαλίδες](doc:header-routing) για το πώς λειτουργεί η προτεραιότητα αναλυτικά, ή ορίστε ένα ρητό `Order` (οι μικρότερες τιμές επικρατούν) για να το ελέγξετε απευθείας. Κεφαλίδες, εξουσιοδότηση, CORS και άλλες πολιτικές ανά αίτημα μπορούν επίσης να οριστούν σε μια καταχώριση διαδρομής.

## Clusters

Το `Clusters` είναι μια μη ταξινομημένη συλλογή ονομασμένων clusters. Κάθε cluster περιέχει ένα σύνολο ονομασμένων `Destinations` - διευθύνσεις backend που θεωρούνται ικανές να διαχειριστούν αιτήματα για οποιαδήποτε διαδρομή που δείχνει σε αυτό το cluster. Μόλις μια διαδρομή ταιριάξει, η πολιτική εξισορρόπησης φορτίου του cluster επιλέγει ποιος προορισμός θα εξυπηρετήσει τελικά το αίτημα - δείτε [Εξισορρόπηση φορτίου](doc:load-balancing).

## Πολλαπλές πηγές διαμόρφωσης

Η `LoadFromConfig` μπορεί να κληθεί περισσότερες από μία φορές, δείχνοντας σε διαφορετικές ενότητες ή ακόμα και σε διαφορετικούς παρόχους - συνδυάστε τη με [έναν προσαρμοσμένο πάροχο διαμόρφωσης](doc:config-providers) που φορτώνει από κάπου εντελώς διαφορετικό:

```csharp
services.AddReverseProxy()
    .LoadFromConfig(Configuration.GetSection("ReverseProxy1"))
    .LoadFromConfig(Configuration.GetSection("ReverseProxy2"));
```

Μια διαδρομή που ορίζεται σε μία πηγή μπορεί να αναφέρεται σε ένα cluster που ορίζεται σε μια άλλη. Αυτό που δεν υποστηρίζεται είναι η συγχώνευση *μερικής* διαμόρφωσης για την ίδια διαδρομή ή cluster από δύο πηγές - καθεμία πρέπει να προέρχεται εξ ολοκλήρου από μία μόνο πηγή.

## Όλες οι ιδιότητες διαμόρφωσης

Μια μεμονωμένη διαδρομή και ένα πλήρως καθορισμένο cluster, που παρουσιάζουν όλες τις ιδιότητες πρώτου επιπέδου μαζί:

:::example Πλήρης μορφή αναφοράς
Τα περισσότερα πεδία είναι προαιρετικά· μόνο τα `RouteId`/`ClusterId`/`Match` σε μια διαδρομή και το `Destinations` σε ένα cluster είναι υποχρεωτικά. Τα `HealthCheck`, `SessionAffinity` και `HttpClient`/`HttpRequest` έχουν το καθένα τη δική του αφιερωμένη σελίδα - δείτε [Έλεγχοι υγείας προορισμού](doc:dests-health-checks), [Συνάφεια συνεδρίας](doc:session-affinity) και [Διαμόρφωση πελάτη HTTP](doc:http-client-config).

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Order": 100,
        "MaxRequestBodySize": 1000000,
        "AuthorizationPolicy": "Anonymous",
        "CorsPolicy": "Default",
        "Match": {
          "Path": "/something/{**remainder}",
          "Hosts": ["www.aaaaa.com", "www.bbbbb.com"],
          "Methods": ["GET", "PUT"],
          "Headers": [
            { "Name": "MyCustomHeader", "Values": ["value1", "value2"], "Mode": "ExactHeader" }
          ],
          "QueryParameters": [
            { "Name": "MyQueryParameter", "Values": ["value1", "value2"], "Mode": "Exact" }
          ]
        },
        "Metadata": { "MyName": "MyValue" },
        "Transforms": [{ "RequestHeader": "MyHeader", "Set": "MyValue" }]
      }
    },
    "Clusters": {
      "cluster1": {
        "LoadBalancingPolicy": "PowerOfTwoChoices",
        "Destinations": {
          "cluster1/destination1": { "Address": "https://contoso.com" },
          "cluster1/destination2": { "Address": "https://10.20.30.40", "Health": "https://10.20.30.40:12345/test" }
        },
        "SessionAffinity": { "Enabled": true, "Policy": "Cookie" },
        "HealthCheck": {
          "Active": { "Enabled": true, "Interval": "00:00:10", "Path": "/api/health" },
          "Passive": { "Enabled": true, "Policy": "TransportFailureRateHealthPolicy" }
        },
        "HttpClient": { "SslProtocols": "Tls13", "MaxConnectionsPerServer": 1024 },
        "Metadata": { "MyKey": "MyValue" }
      }
    }
  }
}
```
:::
