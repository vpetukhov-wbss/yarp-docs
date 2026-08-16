---
slug: rate-limiting
title: Περιορισμός ρυθμού
lede: >-
  Ο αντίστροφος διακομιστής μεσολάβησης μπορεί να χρησιμοποιηθεί για τον περιορισμό ρυθμού αιτημάτων πριν
  αυτά μεσολαβηθούν προς τους διακομιστές προορισμού
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/rate-limiting
lastUpdated: 2026-08-11
---

## Εισαγωγή

Ο αντίστροφος διακομιστής μεσολάβησης μπορεί να χρησιμοποιηθεί για τον περιορισμό ρυθμού αιτημάτων, πριν αυτά μεσολαβηθούν προς τους διακομιστές προορισμού. Αυτό μπορεί να μειώσει το φόρτο στους διακομιστές προορισμού, να προσθέσει ένα επιπλέον επίπεδο προστασίας, και να διασφαλίσει ότι εφαρμόζονται συνεπείς πολιτικές σε όλες τις εφαρμογές σας.

Αυτή η λειτουργία είναι διαθέσιμη μόνο όταν χρησιμοποιείτε .NET 7 ή νεότερο.

## Προεπιλογές

Δεν εκτελείται κανένας περιορισμός ρυθμού στα αιτήματα, εκτός αν ενεργοποιηθεί στη διαμόρφωση της διαδρομής ή της εφαρμογής. Ωστόσο, το ενδιάμεσο λογισμικό Rate Limiting (app.UseRateLimiter()) μπορεί να εφαρμόσει έναν προεπιλεγμένο limiter σε όλες τις διαδρομές, και αυτό δεν απαιτεί καμία ρητή συμμετοχή (opt-in) από τη διαμόρφωση. Παράδειγμα:

```csharp
   services.AddRateLimiter(options => options.GlobalLimiter = globalLimiter);
```

## Διαμόρφωση

Οι πολιτικές του Rate Limiter μπορούν να καθοριστούν ανά διαδρομή, μέσω του RouteConfig.RateLimiterPolicy, και μπορούν να δεσμευτούν (bind) από τις ενότητες Routes του αρχείου διαμόρφωσης. Όπως και με τις άλλες ιδιότητες διαδρομής, αυτό μπορεί να τροποποιηθεί και να επαναφορτωθεί χωρίς επανεκκίνηση του διακομιστή μεσολάβησης. Τα ονόματα πολιτικών δεν κάνουν διάκριση πεζών-κεφαλαίων.

Παράδειγμα:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "RateLimiterPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                         "cluster1/destination1": {
                            "Address": "https://localhost:10001/"
                         }
                      }
                   }
      }
   }
}
RateLimiter policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core rate limiting middleware.
RateLimiter policies can be configured in services as follows:
```

```csharp
   services.AddRateLimiter(options =>
   {
          options.AddFixedWindowLimiter("customPolicy", opt =>
          {
                 opt.PermitLimit = 4;
                 opt.Window = TimeSpan.FromSeconds(12);
                 opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                 opt.QueueLimit = 2;
          });
   });
Then add the RateLimiter middleware.
    C#
   app.UseRateLimiter();
   app.MapReverseProxy();
See the Rate Limiting docs for setting up your preferred kind of rate limiting.
```

## Απενεργοποίηση περιορισμού ρυθμού

Ο ορισμός της τιμής disable στην παράμετρο RateLimiterPolicy μιας διαδρομής σημαίνει ότι το ενδιάμεσο λογισμικό rate limiter δεν θα εφαρμόσει καμία πολιτική σε αυτή τη διαδρομή, ούτε καν την προεπιλεγμένη πολιτική.

:::note
Ο συγγραφέας δημιούργησε αυτό το άρθρο με τη βοήθεια AI. Μάθετε περισσότερα
:::
