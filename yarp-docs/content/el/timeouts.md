---
slug: timeouts
title: Χρονικά όρια αιτήματος
lede: >-
  Το .NET 8 εισήγαγε το Request Timeouts Middleware, για τη διαμόρφωση χρονικών ορίων αιτήματος
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/timeouts
lastUpdated: 2026-08-11
---

## Εισαγωγή

Το .NET 8 εισήγαγε το Request Timeouts Middleware, το οποίο επιτρέπει τη διαμόρφωση χρονικών ορίων αιτήματος καθολικά, καθώς και ανά endpoint. Αυτή η λειτουργικότητα είναι επίσης διαθέσιμη στο YARP 2.1, όταν εκτελείται σε .NET 8 ή νεότερο.

## Προεπιλογές

Τα αιτήματα δεν έχουν κανένα χρονικό όριο από προεπιλογή, πέρα από το Activity Timeout που χρησιμοποιείται για τον καθαρισμό ανενεργών αιτημάτων. Μια προεπιλεγμένη πολιτική, καθορισμένη στο RequestTimeoutOptions, θα εφαρμόζεται επίσης σε αιτήματα που μεσολαβούνται.

## Διαμόρφωση

Τα χρονικά όρια και οι πολιτικές χρονικού ορίου μπορούν να καθοριστούν ανά διαδρομή, μέσω του RouteConfig, και μπορούν να δεσμευτούν (bind) από τις ενότητες Routes του αρχείου διαμόρφωσης. Όπως και με τις άλλες ιδιότητες διαδρομής, αυτό μπορεί να τροποποιηθεί και να επαναφορτωθεί χωρίς επανεκκίνηση του διακομιστή μεσολάβησης. Τα ονόματα πολιτικών δεν κάνουν διάκριση πεζών-κεφαλαίων.

Τα χρονικά όρια καθορίζονται σε μορφή TimeSpan (HH:MM:SS). Ο ορισμός τόσο ενός Timeout όσο και ενός TimeoutPolicy στην ίδια διαδρομή δεν είναι έγκυρος, και θα προκαλέσει την απόρριψη της διαμόρφωσης.

:::note
τα χρονικά όρια αιτήματος δεν εφαρμόζονται όταν ένας debugger είναι προσαρτημένος στη διεργασία.
:::

Παράδειγμα:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "TimeoutPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
         }
         "route2" : {
             "ClusterId": "cluster1",
             "Timeout": "00:01:00",
             "Match": {
                         "Hosts": [ "localhost2" ]
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
Timeout policies and the default policy can be configured in the service collection and the
middleware can be added as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddReverseProxy()
          .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
   builder.Services.AddRequestTimeouts(options =>
   {
          options.AddPolicy("customPolicy", TimeSpan.FromSeconds(20));
   });
   var app = builder.Build();
   app.UseRequestTimeouts();
   app.MapReverseProxy();
   app.Run();
```

## Απενεργοποίηση χρονικών ορίων

Ο ορισμός της τιμής disable στην παράμετρο TimeoutPolicy μιας διαδρομής σημαίνει ότι το ενδιάμεσο λογισμικό χρονικού ορίου αιτήματος δεν θα εφαρμόσει χρονικά όρια σε αυτή τη διαδρομή.

## WebSockets

Τα χρονικά όρια αιτήματος απενεργοποιούνται μετά την αρχική χειραψία (handshake) του WebSocket.

:::note
Ο συγγραφέας δημιούργησε αυτό το άρθρο με τη βοήθεια AI. Μάθετε περισσότερα
:::
