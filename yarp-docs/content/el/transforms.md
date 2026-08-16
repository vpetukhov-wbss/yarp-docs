---
slug: transforms
title: Επισκόπηση
lede: >-
  Κατά τη μεσολάβηση ενός αιτήματος, είναι συνηθισμένο να τροποποιούνται τμήματα του αιτήματος ή
  της απόκρισης για προσαρμογή
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms
lastUpdated: 2026-08-11
---

## Μετασχηματισμοί αιτήματος και απόκρισης στο YARP

## Εισαγωγή

Κατά τη μεσολάβηση ενός αιτήματος, είναι συνηθισμένο να τροποποιούνται τμήματα του αιτήματος ή της απόκρισης, ώστε να προσαρμόζονται στις απαιτήσεις του διακομιστή προορισμού ή για να μεταφέρονται πρόσθετα δεδομένα, όπως η αρχική διεύθυνση IP του client. Αυτή η διαδικασία υλοποιείται μέσω μετασχηματισμών (Transforms). Οι τύποι μετασχηματισμών ορίζονται καθολικά για την εφαρμογή, και στη συνέχεια οι επιμέρους διαδρομές παρέχουν τις παραμέτρους για την ενεργοποίηση και τη διαμόρφωση αυτών των μετασχηματισμών. Τα αρχικά αντικείμενα αιτήματος δεν τροποποιούνται από αυτούς τους μετασχηματισμούς, παρά μόνο τα αιτήματα του διακομιστή μεσολάβησης.

Οι μετασχηματισμοί σώματος αιτήματος και απόκρισης δεν παρέχονται από το YARP, αλλά μπορείτε να γράψετε ενδιάμεσο λογισμικό γι' αυτό.

## Προεπιλογές

Οι ακόλουθοι μετασχηματισμοί είναι ενεργοποιημένοι από προεπιλογή για όλες τις διαδρομές. Μπορούν να διαμορφωθούν ή να απενεργοποιηθούν όπως φαίνεται παρακάτω σε αυτό το έγγραφο.

Host - Καταστέλλει την κεφαλίδα Host του εισερχόμενου αιτήματος. Το αίτημα του διακομιστή μεσολάβησης θα χρησιμοποιήσει από προεπιλογή το όνομα host που ορίζεται στη διεύθυνση του διακομιστή προορισμού. Δείτε το RequestHeaderOriginalHost παρακάτω. X-Forwarded-For - Ορίζει τη διεύθυνση IP του client στην κεφαλίδα X-Forwarded-For. Δείτε το X-Forwarded παρακάτω. X-Forwarded-Proto - Ορίζει το αρχικό σχήμα (http/https) του αιτήματος στην κεφαλίδα X-Forwarded-Proto. Δείτε το X-Forwarded παρακάτω. X-Forwarded-Host - Ορίζει το αρχικό Host του αιτήματος στην κεφαλίδα X-Forwarded-Host. Δείτε το X-Forwarded παρακάτω. X-Forwarded-Prefix - Ορίζει το αρχικό PathBase του αιτήματος, αν υπάρχει, στην κεφαλίδα X-Forwarded-Prefix. Δείτε το X-Forwarded παρακάτω.

Για παράδειγμα, το ακόλουθο εισερχόμενο αίτημα προς το http://IncomingHost:5000/path:

GET /path HTTP/1.1 Host: IncomingHost:5000 Accept: */* header1: foo

θα μετασχηματιζόταν και θα μεσολαβούνταν προς τον διακομιστή προορισμού https://DestinationHost:6000/ ως

εξής, χρησιμοποιώντας αυτές τις προεπιλογές:

GET /path HTTP/1.1 Host: DestinationHost:6000 Accept: */* header1: foo X-Forwarded-For: 5.5.5.5 X-Forwarded-Proto: http X-Forwarded-Host: IncomingHost:5000

## Κατηγορίες μετασχηματισμών

Οι μετασχηματισμοί κατατάσσονται σε λίγες κατηγορίες: αιτήματος, απόκρισης και trailer απόκρισης. Τα trailer αιτήματος δεν υποστηρίζονται, επειδή δεν υποστηρίζονται από το υποκείμενο HttpClient.

Αν το ενσωματωμένο σύνολο μετασχηματισμών δεν επαρκεί, τότε μπορούν να προστεθούν προσαρμοσμένοι μετασχηματισμοί μέσω επεκτασιμότητας.

## Προσθήκη μετασχηματισμών

Οι μετασχηματισμοί μπορούν να προστεθούν σε διαδρομές είτε μέσω διαμόρφωσης είτε προγραμματιστικά.

## Από τη διαμόρφωση

Οι μετασχηματισμοί μπορούν να διαμορφωθούν στο RouteConfig.Transforms και μπορούν να δεσμευτούν (bind) από τις ενότητες Routes του αρχείου διαμόρφωσης. Αυτοί μπορούν να τροποποιηθούν και να επαναφορτωθούν χωρίς επανεκκίνηση του διακομιστή μεσολάβησης. Ένας μετασχηματισμός διαμορφώνεται χρησιμοποιώντας ένα ή περισσότερα ζεύγη κλειδιού-τιμής τύπου string.

Ακολουθεί ένα παράδειγμα συνηθισμένων μετασχηματισμών:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Hosts": [ "localhost" ]
             },
             "Transforms": [
                { "PathPrefix": "/apis" },
                          {
                             "RequestHeader": "header1",
                             "Append": "bar"
                          },
                          {
                             "ResponseHeader": "header2",
                             "Append": "bar",
                             "When": "Always"
                          },
                          { "ClientCert": "X-Client-Cert" },
                          { "RequestHeadersCopy": "true" },
                          { "RequestHeaderOriginalHost": "true" },
                          {
                             "X-Forwarded": "Append",
                             "HeaderPrefix": "X-Forwarded-"
                          }
                      ]
                   },
                   "route2" : {
                      "ClusterId": "cluster1",
                      "Match": {
                          "Path": "/api/{plugin}/stuff/{**remainder}"
                      },
                      "Transforms": [
                          { "PathPattern": "/foo/{plugin}/bar/{**remainder}" },
                          {
                             "QueryValueParameter": "q",
                             "Append": "plugin"
                          }
                      ]
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                          "cluster1/destination1": {
                             "Address": "https://localhost:10001/Path/Base"
                          }
                      }
                   }
      }
   }
}
All configuration entries are treated as case-insensitive, though the destination server may
treat the resulting values as case sensitive or insensitive such as the path.
The details for these transforms are covered later in this document.
Developers that want to integrate their custom transforms with the Transforms section of
configuration can do so using ITransformFactory described below.
```

## Από τον κώδικα

Οι μετασχηματισμοί μπορούν να προστεθούν σε διαδρομές προγραμματιστικά, καλώντας τη μέθοδο AddTransforms.

Η AddTransforms μπορεί να κληθεί μετά την AddReverseProxy για να παρέχει ένα callback διαμόρφωσης μετασχηματισμών. Αυτό το callback καλείται κάθε φορά που μια διαδρομή δημιουργείται ή ξαναδημιουργείται, και επιτρέπει στον προγραμματιστή να επιθεωρήσει τις πληροφορίες RouteConfig και να προσθέσει υπό όρους μετασχηματισμούς γι' αυτήν.

Το callback της AddTransforms παρέχει ένα TransformBuilderContext, όπου μπορούν να προστεθούν ή να διαμορφωθούν μετασχηματισμοί. Οι περισσότεροι μετασχηματισμοί παρέχουν μεθόδους επέκτασης (extension methods) του TransformBuilderContext, ώστε να είναι ευκολότερη η προσθήκη τους. Αυτές είναι οι μέθοδοι επέκτασης που τεκμηριώνονται παρακάτω μαζί με τις περιγραφές των επιμέρους μετασχηματισμών.

Το TransformBuilderContext περιλαμβάνει επίσης έναν IServiceProvider για πρόσβαση σε όποιες υπηρεσίες χρειάζονται.

```csharp
services.AddReverseProxy()
      .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
      .AddTransforms(builderContext =>
      {
             // Added to all routes.
             builderContext.AddPathPrefix("/prefix");
             // Conditionally add a transform for routes that require auth.
             if (!string.IsNullOrEmpty(builderContext.Route.AuthorizationPolicy))
             {
                    builderContext.AddRequestTransform(async transformContext =>
                    {
                          transformContext.ProxyRequest.Headers.Add("CustomHeader",
"CustomValue");
                    });
             }
      });
For more advanced control see ITransformProvider described below.
 Note: The author created this article with assistance from AI. Learn more
```
