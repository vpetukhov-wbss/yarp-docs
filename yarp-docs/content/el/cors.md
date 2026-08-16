---
slug: cors
title: Αιτήματα διαφορετικής προέλευσης (CORS)
lede: >-
  Ο αντίστροφος διακομιστής μεσολάβησης μπορεί να χειρίζεται αιτήματα διαφορετικής προέλευσης πριν
  αυτά προωθηθούν στον προορισμό.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/cors
lastUpdated: 2026-08-11
---

## Εισαγωγή

Ο αντίστροφος διακομιστής μεσολάβησης μπορεί να χειρίζεται αιτήματα διαφορετικής προέλευσης πριν αυτά προωθηθούν στους διακομιστές προορισμού. Αυτό μπορεί να μειώσει το φόρτο στους διακομιστές προορισμού και να διασφαλίσει ότι εφαρμόζονται συνεπείς πολιτικές σε όλες τις εφαρμογές σας.

## Προεπιλογές

Τα αιτήματα δεν θα αντιστοιχίζονται αυτόματα σε προκαταρκτικά (preflight) αιτήματα CORS, εκτός αν αυτό ενεργοποιηθεί στη διαμόρφωση της διαδρομής ή της εφαρμογής.

## Διαμόρφωση

Οι πολιτικές CORS μπορούν να οριστούν ανά διαδρομή μέσω του `RouteConfig.CorsPolicy` και μπορούν να δεσμευτούν από την ενότητα Routes του αρχείου διαμόρφωσης. Όπως και με τις υπόλοιπες ιδιότητες διαδρομής, αυτό μπορεί να τροποποιηθεί και να επαναφορτωθεί χωρίς επανεκκίνηση του διακομιστή μεσολάβησης. Τα ονόματα πολιτικών δεν κάνουν διάκριση πεζών-κεφαλαίων.

Παράδειγμα:

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "CorsPolicy": "customPolicy",
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
CORS policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides the
above configuration to specify a policy per route and the rest is handled by existing ASP.NET
Core CORS Middleware.
CORS policies can be configured in the application as follows:
   services.AddCors(options =>
   {
          options.AddPolicy("customPolicy", builder =>
          {
                 builder.AllowAnyOrigin();
          });
   });
Then add the CORS middleware.
   app.UseCors();
   app.MapReverseProxy();
```

## DefaultPolicy

Ο ορισμός της τιμής `default` στην παράμετρο `CorsPolicy` μιας διαδρομής σημαίνει ότι η διαδρομή αυτή θα χρησιμοποιήσει την πολιτική που ορίζεται στο `CorsOptions.DefaultPolicy`.

## Απενεργοποίηση του CORS

Ο ορισμός της τιμής `disable` στην παράμετρο `CorsPolicy` μιας διαδρομής σημαίνει ότι το ενδιάμεσο λογισμικό CORS θα απορρίπτει τα αιτήματα CORS.

:::note
Αυτό το άρθρο δημιουργήθηκε από τον συγγραφέα με τη βοήθεια τεχνητής νοημοσύνης (AI). Μάθετε περισσότερα
:::
