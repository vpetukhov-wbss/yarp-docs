---
slug: middleware
title: Ενδιάμεσο λογισμικό
lede: >-
  Το ASP.NET Core χρησιμοποιεί ένα pipeline ενδιάμεσου λογισμικού για να διαιρέσει την επεξεργασία
  των αιτημάτων σε διακριτά βήματα.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/middleware
lastUpdated: 2026-08-11
---

## Εισαγωγή

Το ASP.NET Core χρησιμοποιεί ένα pipeline ενδιάμεσου λογισμικού για να διαιρέσει την επεξεργασία των αιτημάτων σε διακριτά βήματα. Ο προγραμματιστής της εφαρμογής μπορεί να προσθέσει και να ορίσει τη σειρά του ενδιάμεσου λογισμικού όπως χρειάζεται. Το ενδιάμεσο λογισμικό του ASP.NET Core χρησιμοποιείται επίσης για την υλοποίηση και την προσαρμογή της λειτουργικότητας του αντίστροφου διακομιστή μεσολάβησης.

## Προεπιλογές

Το δείγμα κώδικα «Ξεκινώντας» δείχνει την ακόλουθη μέθοδο διαμόρφωσης. Αυτή ρυθμίζει ένα pipeline ενδιάμεσου λογισμικού με εργαλεία ανάπτυξης, δρομολόγηση και τα endpoints διαμόρφωσης του διακομιστή μεσολάβησης (`MapReverseProxy`).

```csharp
         var builder = WebApplication.CreateBuilder(args);
         builder.Services.AddReverseProxy()
                .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
         var app = builder.Build();
         app.MapReverseProxy();
         app.Run();
The parameterless MapReverseProxy() in ReverseProxyIEndpointRouteBuilderExtensions
overload includes all standard proxy middleware for session affinity, load balancing, passive
health checks, and the final proxying of the request. Each of these check the configuration of
the matched route, cluster, and destination and perform their task accordingly.
```

## Προσθήκη ενδιάμεσου λογισμικού

Το ενδιάμεσο λογισμικό που προστίθεται στο pipeline της εφαρμογής σας θα βλέπει το αίτημα σε διαφορετικά στάδια επεξεργασίας, ανάλογα με το πού έχει προστεθεί. Το ενδιάμεσο λογισμικό που προστίθεται πριν από το `UseRouting` θα βλέπει όλα τα αιτήματα και μπορεί να τα τροποποιήσει πριν πραγματοποιηθεί οποιαδήποτε δρομολόγηση. Το ενδιάμεσο λογισμικό που προστίθεται ανάμεσα στα `UseRouting` και `UseEndpoints` μπορεί να καλέσει το `HttpContext.GetEndpoint()` για να ελέγξει σε ποιο endpoint αντιστοιχίστηκε το αίτημα από τη δρομολόγηση (αν υπάρχει), και να χρησιμοποιήσει τυχόν μεταδεδομένα που σχετίζονται με αυτό το endpoint. Με αυτόν τον τρόπο υλοποιούνται ο έλεγχος ταυτότητας (Authentication), η εξουσιοδότηση (Authorization) και το CORS.

Το `ReverseProxyIEndpointRouteBuilderExtensions` παρέχει μια υπερφόρτωση (overload) της `MapReverseProxy` που σας επιτρέπει να δημιουργήσετε ένα pipeline ενδιάμεσου λογισμικού το οποίο θα εκτελείται μόνο για αιτήματα που αντιστοιχίζονται σε διαδρομές διαμορφωμένες στον διακομιστή μεσολάβησης.

app.MapReverseProxy(proxyPipeline => {

proxyPipeline.Use((context, next) => {

## // Προσαρμοσμένο inline ενδιάμεσο λογισμικό

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); proxyPipeline.UsePassiveHealthChecks(); });

Από προεπιλογή, αυτή η υπερφόρτωση της `MapReverseProxy` περιλαμβάνει μόνο την ελάχιστη ρύθμιση, τη λογική προώθησης και την επιβολή ορίων στην αρχή και στο τέλος του pipeline της. Το ενδιάμεσο λογισμικό για τη συνάφεια συνεδρίας, την εξισορρόπηση φορτίου και τους παθητικούς ελέγχους υγείας δεν περιλαμβάνεται από προεπιλογή, ώστε να μπορείτε να το εξαιρέσετε, να το αντικαταστήσετε ή να ελέγξετε τη σειρά του μαζί με οποιοδήποτε επιπλέον ενδιάμεσο λογισμικό.

## Προσαρμοσμένο ενδιάμεσο λογισμικό διακομιστή μεσολάβησης

Το ενδιάμεσο λογισμικό εντός του pipeline της `MapReverseProxy` έχει πρόσβαση σε όλα τα δεδομένα και την κατάσταση του διακομιστή μεσολάβησης που σχετίζονται με ένα αίτημα (τη διαδρομή, το cluster, τους προορισμούς κ.λπ.) μέσω του `IReverseProxyFeature`. Αυτό είναι διαθέσιμο από το `HttpContext.Features` ή τη μέθοδο επέκτασης `HttpContext.GetReverseProxyFeature()`.

Τα δεδομένα στο `IReverseProxyFeature` αποτελούν στιγμιότυπο (snapshot) της διαμόρφωσης του διακομιστή μεσολάβησης στην αρχή του pipeline, και δεν επηρεάζονται από αλλαγές διαμόρφωσης που πραγματοποιούνται όσο το αίτημα βρίσκεται υπό επεξεργασία.

```csharp
   proxyPipeline.Use((context, next) =>
   {
          var proxyFeature = context.GetReverseProxyFeature();
          var cluster = proxyFeature.Cluster;
          var destinations = proxyFeature.AvailableDestinations;
          return next();
   });
```

## Τι μπορείτε να κάνετε με το ενδιάμεσο λογισμικό

Το ενδιάμεσο λογισμικό μπορεί να παράγει logs, να ελέγχει αν ένα αίτημα θα προωθηθεί ή όχι, να επηρεάζει προς τα πού θα προωθηθεί, και να προσθέτει επιπλέον λειτουργίες όπως ο χειρισμός σφαλμάτων, οι επαναλήψεις (retries) κ.λπ.

## Logs και μετρικές

Το ενδιάμεσο λογισμικό μπορεί να επιθεωρεί πεδία του αιτήματος και της απόκρισης για να παράγει logs και να συγκεντρώνει μετρικές. Δείτε τη σημείωση σχετικά με τα σώματα (bodies) στην ενότητα «Τι δεν πρέπει να κάνετε με το ενδιάμεσο λογισμικό» παρακάτω.

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          LogRequest(context);
          await next();
          LogResponse(context);
   });
```

## Αποστολή άμεσης απόκρισης

Αν ένα ενδιάμεσο λογισμικό επιθεωρήσει ένα αίτημα και διαπιστώσει ότι δεν θα πρέπει να προωθηθεί, μπορεί να δημιουργήσει τη δική του απόκριση και να επιστρέψει τον έλεγχο στον διακομιστή χωρίς να καλέσει το `next()`.

```csharp
   proxyPipeline.Use((context, next) =>
   {
          if (!CheckAllowedRequest(context, out var reason))
          {
                 context.Response.StatusCode = StatusCodes.Status400BadRequest;
                 return context.Response.WriteAsync(reason);
          }
          return next();
   });
```

## Φιλτράρισμα προορισμών

Ενδιάμεσο λογισμικό όπως η συνάφεια συνεδρίας και η εξισορρόπηση φορτίου εξετάζουν το `IReverseProxyFeature` και τη διαμόρφωση του cluster για να αποφασίσουν σε ποιον προορισμό θα σταλεί ένα αίτημα. Το `AllDestinations` περιέχει όλους τους προορισμούς του επιλεγμένου cluster.

Το `AvailableDestinations` περιέχει τους προορισμούς που θεωρούνται αυτή τη στιγμή κατάλληλοι να χειριστούν το αίτημα. Αρχικοποιείται με το `AllDestinations`, εξαιρώντας τους μη υγιείς προορισμούς αν είναι ενεργοποιημένοι οι έλεγχοι υγείας. Το `AvailableDestinations` θα πρέπει να περιοριστεί σε έναν μόνο προορισμό μέχρι το τέλος του pipeline, διαφορετικά θα επιλεγεί τυχαία ένας από τους υπόλοιπους.

Το `ProxiedDestination` ορίζεται από τη λογική του διακομιστή μεσολάβησης στο τέλος του pipeline, για να υποδείξει ποιος προορισμός χρησιμοποιήθηκε τελικά. Αν δεν απομένει κανένας διαθέσιμος προορισμός, τότε αποστέλλεται μια απόκριση σφάλματος 503.

```csharp
proxyPipeline.Use(async (context, next) =>
{
      var proxyFeature = context.GetReverseProxyFeature();
      proxyFeature.AvailableDestinations =
Filter(proxyFeature.AvailableDestinations);
      await next();
      Report(proxyFeature.ProxiedDestination);
});
DestinationState implements IReadOnlyList<DestinationState> so a single destination can be
assigned to AvailableDestinations without creating a new list.
```

## Χειρισμός σφαλμάτων

Το ενδιάμεσο λογισμικό μπορεί να τυλίξει την κλήση `await next()` σε ένα block `try/catch` για να χειριστεί εξαιρέσεις από μεταγενέστερα components.

Η λογική του διακομιστή μεσολάβησης στο τέλος του pipeline (`IHttpForwarder`) δεν εκτοξεύει εξαιρέσεις για τα συνηθισμένα σφάλματα προώθησης αιτημάτων. Αυτά καταγράφονται και αναφέρονται στο `IForwarderErrorFeature`, διαθέσιμο από το `HttpContext.Features` ή τη μέθοδο επέκτασης `HttpContext.GetForwarderErrorFeature()`.

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          await next();
          var errorFeature = context.GetForwarderErrorFeature();
          if (errorFeature is not null)
          {
                 Report(errorFeature.Error, errorFeature.Exception);
                 }
          });
If the response has not started ( HttpResponse.HasStarted ) it can be cleared
( HttpResponse.Clear() ) and an alternate response sent, or the proxy feature fields may be
reset and the request retried.
```

## Τι δεν πρέπει να κάνετε με το ενδιάμεσο λογισμικό

Το ενδιάμεσο λογισμικό θα πρέπει να είναι προσεκτικό ως προς την τροποποίηση πεδίων του αιτήματος, όπως οι κεφαλίδες, με σκοπό να επηρεάσει το εξερχόμενο προωθημένο αίτημα. Τέτοιες τροποποιήσεις μπορεί να παρεμβαίνουν σε λειτουργίες όπως οι επαναλήψεις (retries) και ενδέχεται να είναι καλύτερο να γίνονται μέσω μετασχηματισμών.

Το ενδιάμεσο λογισμικό ΠΡΕΠΕΙ να ελέγχει το `HttpResponse.HasStarted` πριν τροποποιήσει πεδία της απόκρισης μετά την κλήση του `next()`. Αν η απόκριση έχει ήδη αρχίσει να αποστέλλεται στον client, το ενδιάμεσο λογισμικό δεν μπορεί πλέον να την τροποποιήσει (με πιθανή εξαίρεση τα Trailers). Οι μετασχηματισμοί μπορούν να χρησιμοποιηθούν για την επιθεώρηση και την καταστολή ανεπιθύμητων αποκρίσεων. Διαφορετικά, δείτε την επόμενη σημείωση.

Το ενδιάμεσο λογισμικό θα πρέπει να αποφεύγει την αλληλεπίδραση με τα σώματα (bodies) του αιτήματος ή της απόκρισης. Τα σώματα δεν αποθηκεύονται προσωρινά σε buffer από προεπιλογή, οπότε η αλληλεπίδραση μαζί τους μπορεί να τα εμποδίσει από το να φτάσουν στον προορισμό τους. Παρόλο που είναι δυνατή η ενεργοποίηση buffering, αυτό αποθαρρύνεται καθώς μπορεί να προσθέσει σημαντική επιβάρυνση σε μνήμη και καθυστέρηση (latency). Συνιστάται η χρήση μιας τυλιγμένης (wrapped), ροϊκής (streaming) προσέγγισης αν το σώμα πρέπει να εξεταστεί ή να τροποποιηθεί. Δείτε το ενδιάμεσο λογισμικό `ResponseCompression` για ένα παράδειγμα.

Το ενδιάμεσο λογισμικό ΔΕΝ ΠΡΕΠΕΙ να εκτελεί οποιαδήποτε πολυνηματική (multi-threaded) εργασία σε ένα μεμονωμένο αίτημα· το `HttpContext` και τα συσχετισμένα μέλη του δεν είναι thread-safe.

:::note
Αυτό το άρθρο δημιουργήθηκε από τον συγγραφέα με τη βοήθεια τεχνητής νοημοσύνης (AI). Μάθετε περισσότερα
:::
