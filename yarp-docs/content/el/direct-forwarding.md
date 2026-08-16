---
slug: direct-forwarding
title: Απευθείας προώθηση
lede: >-
  Ορισμένες εφαρμογές χρειάζονται μόνο τη δυνατότητα να λαμβάνουν ένα συγκεκριμένο αίτημα και να το
  προωθούν.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/direct-forwarding
lastUpdated: 2026-08-11
---

Ορισμένες εφαρμογές χρειάζονται μόνο τη δυνατότητα να λαμβάνουν ένα συγκεκριμένο αίτημα και να το προωθούν σε έναν συγκεκριμένο προορισμό. Αυτές οι εφαρμογές δεν χρειάζονται —ή έχουν αντιμετωπίσει με άλλους τρόπους— τις υπόλοιπες λειτουργίες του διακομιστή μεσολάβησης, όπως την ανακάλυψη διαμόρφωσης, τη δρομολόγηση, την εξισορρόπηση φορτίου κ.λπ.

## IHttpForwarder

Το `IHttpForwarder` λειτουργεί ως ο βασικός προσαρμογέας (adapter) του διακομιστή μεσολάβησης ανάμεσα στα εισερχόμενα αιτήματα ASP.NET Core και τα εξερχόμενα αιτήματα `System.Net.Http`. Χειρίζεται τη μηχανική της δημιουργίας ενός `HttpRequestMessage` από ένα `HttpContext`, της αποστολής του και της αναμετάδοσης της απόκρισης.

Το `IHttpForwarder` υποστηρίζει:

- Δυναμική επιλογή προορισμού — καθορίζετε τον προορισμό για κάθε αίτημα
- Προσαρμογή του HTTP client — παρέχετε το `HttpMessageInvoker`
- Προσαρμογή αιτήματος και απόκρισης (εκτός από τα σώματα)
- Πρωτόκολλα ροής (streaming) όπως το gRPC και τα WebSockets
- Χειρισμό σφαλμάτων

Δεν περιλαμβάνει:

- Δρομολόγηση
- Εξισορρόπηση φορτίου
- Συνάφεια (affinity)
- Επαναλήψεις (retries)

## Παράδειγμα

Δείτε το `ReverseProxy.Direct.Sample` ως ένα προκατασκευασμένο δείγμα, ή ακολουθήστε τα παρακάτω βήματα.

## Δημιουργία νέου έργου

Ακολουθήστε τον οδηγό «Ξεκινώντας» για να δημιουργήσετε ένα έργο και να προσθέσετε την εξάρτηση nuget `Yarp.ReverseProxy`.

## Ενημέρωση του Program.cs

Σε αυτό το παράδειγμα, το `IHttpForwarder` καταχωρίζεται στο DI, γίνεται inject στη μέθοδο endpoint, και χρησιμοποιείται για να προωθεί αιτήματα από μια συγκεκριμένη διαδρομή προς το `https://localhost:10000/prefix/`.

Οι προαιρετικοί μετασχηματισμοί δείχνουν πώς να αντιγράψετε όλες τις κεφαλίδες αιτήματος εκτός από το `Host`· είναι σύνηθες ο προορισμός να απαιτεί το δικό του `Host` από το URL.

```csharp
using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Yarp.ReverseProxy.Forwarder;
using Yarp.ReverseProxy.Transforms;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpForwarder();
var app = builder.Build();
// Configure our own HttpMessageInvoker for outbound calls for proxy operations
var httpClient = new HttpMessageInvoker(new SocketsHttpHandler
{
      UseProxy = false,
      AllowAutoRedirect = false,
      AutomaticDecompression = DecompressionMethods.None,
      UseCookies = false,
      EnableMultipleHttp2Connections = true,
      ActivityHeadersPropagator = new
ReverseProxyPropagator(DistributedContextPropagator.Current),
      ConnectTimeout = TimeSpan.FromSeconds(15),
});
// Setup our own request transform class
var transformer = new CustomTransformer(); // or HttpTransformer.Default;
var requestConfig = new ForwarderRequestConfig { ActivityTimeout =
TimeSpan.FromSeconds(100) };
app.UseRouting();
// When using IHttpForwarder for direct forwarding you are responsible for rout-
ing, destination discovery, load balancing, affinity, etc..
// For an alternate example that includes those features see BasicYarpSample.
app.Map("/test/{**catch-all}", async (HttpContext httpContext, IHttpForwarder for-
warder) =>
{
      var error = await forwarder.SendAsync(httpContext, "https://localhost:10000/",
                   httpClient, requestConfig, transformer);
```

## // Έλεγχος αν η λειτουργία ήταν επιτυχής

if (error != ForwarderError.None)

{

var errorFeature = httpContext.GetForwarderErrorFeature();

var exception = errorFeature.Exception;

}

});

app.Run();

/// <summary> /// Custom request transformation /// </summary> internal class CustomTransformer : HttpTransformer {

/// <summary> /// A callback that is invoked prior to sending the proxied request. All HttpRequestMessage /// fields are initialized except RequestUri, which will be initialized after the /// callback if no value is provided. The string parameter represents the des- tination /// URI prefix that should be used when constructing the RequestUri. The head- ers /// are copied by the base implementation, excluding some protocol headers like HTTP/2 /// pseudo headers (":authority"). /// </summary> /// <param name="httpContext">The incoming request.</param> /// <param name="proxyRequest">The outgoing proxy request.</param> /// <param name="destinationPrefix">The uri prefix for the selected destina- tion server which can be used to create /// the RequestUri.</param> public override async ValueTask TransformRequestAsync(HttpContext httpContext, HttpRequestMessage proxyRequest, string destinationPrefix, CancellationToken can- cellationToken) {

// Copy all request headers await base.TransformRequestAsync(httpContext, proxyRequest, destination- Prefix, cancellationToken);

// Customize the query string: var queryContext = new QueryTransformContext(httpContext.Request); queryContext.Collection.Remove("param1"); queryContext.Collection["area"] = "xx2";

// Assign the custom uri. Be careful about extra slashes when concatenat- ing here. RequestUtilities.MakeDestinationAddress is a safe default.

proxyRequest.RequestUri = RequestUtilities.MakeDestinationAddress("https://example.com", httpContext.Request.Path, queryContext.QueryString);

// Suppress the original request header, use the one from the destination

Uri.

} proxyRequest.Headers.Host = null; }

Υπάρχουν επίσης διαθέσιμες μέθοδοι επέκτασης που απλοποιούν την αντιστοίχιση του `IHttpForwarder` σε endpoints.

```csharp
   app.MapForwarder("/{**catch-all}", "https://localhost:10000/", requestConfig,
   transformer, httpClient);
```

## Ο HTTP Client

Ο HTTP client μπορεί να προσαρμοστεί, όμως το παραπάνω παράδειγμα συνιστάται για τα συνήθη σενάρια χρήσης διακομιστή μεσολάβησης. Χρησιμοποιείτε πάντα `HttpMessageInvoker` αντί για `HttpClient`, καθώς το `HttpClient` αποθηκεύει προσωρινά τις αποκρίσεις σε buffer από προεπιλογή. Το buffering διακόπτει τα σενάρια ροής (streaming) και αυξάνει τη χρήση μνήμης και την καθυστέρηση (latency). Συνιστάται η επαναχρησιμοποίηση ενός client για αιτήματα προς τον ίδιο προορισμό, για λόγους απόδοσης, καθώς επιτρέπει την επαναχρησιμοποίηση ομαδοποιημένων (pooled) συνδέσεων. Ένας client μπορεί επίσης να επαναχρησιμοποιηθεί για αιτήματα προς διαφορετικούς προορισμούς, αν η διαμόρφωση είναι ίδια.

## Μετασχηματισμοί

Το αίτημα και η απόκριση μπορούν να τροποποιηθούν παρέχοντας έναν παράγωγο `HttpTransformer` ως παράμετρο στη μέθοδο `SendAsync`.

## Χειρισμός σφαλμάτων

Το `IHttpForwarder` συλλαμβάνει εξαιρέσεις και timeouts από τον HTTP client, τα καταγράφει και τα μετατρέπει σε κωδικούς κατάστασης 5xx ή ματαιώνει την απόκριση. Από τη `SendAsync` επιστρέφεται ένας κωδικός σφάλματος, και οι λεπτομέρειες του σφάλματος είναι προσβάσιμες μέσω του `IForwarderErrorFeature`, όπως φαίνεται παραπάνω.

:::note
Αυτό το άρθρο δημιουργήθηκε από τον συγγραφέα με τη βοήθεια τεχνητής νοημοσύνης (AI). Μάθετε περισσότερα
:::
