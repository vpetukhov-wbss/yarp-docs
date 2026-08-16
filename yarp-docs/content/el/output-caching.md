---
slug: output-caching
title: Προσωρινή αποθήκευση εξόδου
lede: >-
  Ο αντίστροφος διακομιστής μεσολάβησης μπορεί να χρησιμοποιηθεί για την προσωρινή αποθήκευση
  προωθημένων αποκρίσεων και την εξυπηρέτηση αιτημάτων.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/output-caching
lastUpdated: 2026-08-11
---

## Εισαγωγή

Ο αντίστροφος διακομιστής μεσολάβησης μπορεί να χρησιμοποιηθεί για την προσωρινή αποθήκευση προωθημένων αποκρίσεων και την εξυπηρέτηση αιτημάτων πριν αυτά προωθηθούν στους διακομιστές προορισμού. Αυτό μπορεί να μειώσει το φόρτο στους διακομιστές προορισμού, να προσθέσει ένα επιπλέον επίπεδο προστασίας και να διασφαλίσει ότι εφαρμόζονται συνεπείς πολιτικές σε όλες τις εφαρμογές σας.

Αυτή η λειτουργία είναι διαθέσιμη μόνο όταν χρησιμοποιείτε .NET 7 ή νεότερη έκδοση.

## Προεπιλογές

Δεν πραγματοποιείται προσωρινή αποθήκευση εξόδου, εκτός αν αυτή ενεργοποιηθεί στη διαμόρφωση της διαδρομής ή της εφαρμογής.

## Διαμόρφωση

Οι πολιτικές προσωρινής αποθήκευσης εξόδου (Output Cache) μπορούν να οριστούν ανά διαδρομή μέσω του `RouteConfig.OutputCachePolicy` και μπορούν να δεσμευτούν από την ενότητα Routes του αρχείου διαμόρφωσης. Όπως και με τις υπόλοιπες ιδιότητες διαδρομής, αυτό μπορεί να τροποποιηθεί και να επαναφορτωθεί χωρίς επανεκκίνηση του διακομιστή μεσολάβησης. Τα ονόματα πολιτικών δεν κάνουν διάκριση πεζών-κεφαλαίων.

Παράδειγμα:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "OutputCachePolicy": "customPolicy",
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
Output cache policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core output caching middleware.
Output cache policies can be configured in Program.cs as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddOutputCache(options =>
   {
          options.AddPolicy("customPolicy", builder =>
   builder.Expire(TimeSpan.FromSeconds(20)));
   });
Then add the output caching middleware:
    C#
   var app = builder.Build();
   app.UseOutputCache();
   app.MapReverseProxy();
See the Output Caching docs for setting up your preferred kind of output caching.
 Note: The author created this article with assistance from AI. Learn more
```
