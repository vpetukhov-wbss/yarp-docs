---
slug: extensibility-transforms
title: Μετασχηματισμοί αιτήματος και απόκρισης
lede: >-
  Κατά την προώθηση (proxying) ενός αιτήματος, είναι συνηθισμένο να τροποποιούνται τμήματα του
  αιτήματος ή της απόκρισης ώστε να προσαρμόζονται στις
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility-transforms
lastUpdated: 2026-08-11
---

## Μετασχηματισμός αιτήματος και απόκρισης

## Επεκτασιμότητα

## Εισαγωγή

Κατά την προώθηση (proxying) ενός αιτήματος, είναι συνηθισμένο να τροποποιούνται τμήματα του αιτήματος ή της απόκρισης ώστε να προσαρμόζονται στις απαιτήσεις του διακομιστή προορισμού ή για τη μεταφορά επιπλέον δεδομένων, όπως η αρχική διεύθυνση IP του client. Αυτή η διαδικασία υλοποιείται μέσω μετασχηματισμών (Transforms). Οι τύποι μετασχηματισμών ορίζονται καθολικά για την εφαρμογή, και στη συνέχεια οι επιμέρους διαδρομές παρέχουν τις παραμέτρους για την ενεργοποίηση και τη διαμόρφωση αυτών των μετασχηματισμών. Τα αρχικά αντικείμενα αιτήματος δεν τροποποιούνται από αυτούς τους μετασχηματισμούς, παρά μόνο τα αιτήματα του διακομιστή μεσολάβησης.

Το YARP περιλαμβάνει ένα σύνολο ενσωματωμένων μετασχηματισμών αιτήματος και απόκρισης που μπορούν να χρησιμοποιηθούν. Για περισσότερες πληροφορίες, δείτε το YARP Request and Response Transforms. Αν αυτοί οι μετασχηματισμοί δεν επαρκούν, τότε μπορούν να προστεθούν προσαρμοσμένοι μετασχηματισμοί.

## RequestTransform

Όλοι οι μετασχηματισμοί αιτήματος πρέπει να παράγονται (derive) από την αφηρημένη βασική κλάση RequestTransform. Αυτοί μπορούν να τροποποιήσουν ελεύθερα το HttpRequestMessage του διακομιστή μεσολάβησης. Αποφύγετε την ανάγνωση ή την τροποποίηση του σώματος του αιτήματος, καθώς αυτό μπορεί να διαταράξει τη ροή προώθησης (proxying). Εξετάστε επίσης το ενδεχόμενο προσθήκης μιας παραμετροποιημένης μεθόδου επέκτασης στο TransformBuilderContext για ευκολότερη ανακάλυψη και χρήση.

Ένας μετασχηματισμός αιτήματος μπορεί υπό όρους να παράγει μια άμεση απόκριση, όπως για παράδειγμα σε συνθήκες σφάλματος. Αυτό εμποδίζει την εκτέλεση τυχόν υπόλοιπων μετασχηματισμών και την προώθηση του αιτήματος. Αυτό υποδεικνύεται ορίζοντας το HttpResponse.StatusCode σε τιμή διαφορετική από 200, καλώντας το HttpResponse.StartAsync() , ή γράφοντας στο HttpResponse.Body ή στο BodyWriter .

Το AddRequestTransform είναι μια μέθοδος επέκτασης του TransformBuilderContext που ορίζει έναν μετασχηματισμό αιτήματος ως Func<RequestTransformContext, ValueTask> . Αυτό επιτρέπει τη δημιουργία ενός προσαρμοσμένου μετασχηματισμού αιτήματος χωρίς να χρειάζεται να υλοποιήσετε μια παράγωγη κλάση του RequestTransform.

## ResponseTransform

Όλοι οι μετασχηματισμοί απόκρισης πρέπει να παράγονται από την αφηρημένη βασική κλάση ResponseTransform. Αυτοί μπορούν να τροποποιήσουν ελεύθερα το HttpResponse του client. Αποφύγετε την ανάγνωση ή την τροποποίηση του σώματος της απόκρισης καθώς

αυτό μπορεί να διαταράξει τη ροή προώθησης. Εξετάστε επίσης το ενδεχόμενο προσθήκης μιας παραμετροποιημένης μεθόδου επέκτασης στο

TransformBuilderContext για ευκολότερη ανακάλυψη και χρήση.

Το AddResponseTransform είναι μια μέθοδος επέκτασης του TransformBuilderContext που ορίζει έναν μετασχηματισμό απόκρισης ως Func<ResponseTransformContext, ValueTask> . Αυτό επιτρέπει τη δημιουργία ενός προσαρμοσμένου μετασχηματισμού απόκρισης χωρίς να χρειάζεται να υλοποιήσετε μια παράγωγη κλάση του ResponseTransform.

## ResponseTrailersTransform

Όλοι οι μετασχηματισμοί trailers απόκρισης πρέπει να παράγονται από την αφηρημένη βασική κλάση ResponseTrailersTransform. Αυτοί μπορούν να τροποποιήσουν ελεύθερα τα trailers του HttpResponse του client. Εκτελούνται μετά το σώμα της απόκρισης και δεν θα πρέπει να επιχειρούν να τροποποιήσουν τις κεφαλίδες ή το σώμα της απόκρισης. Εξετάστε επίσης το ενδεχόμενο προσθήκης μιας παραμετροποιημένης μεθόδου επέκτασης στο TransformBuilderContext για ευκολότερη ανακάλυψη και χρήση.

Το AddResponseTrailersTransform είναι μια μέθοδος επέκτασης του TransformBuilderContext που ορίζει έναν μετασχηματισμό trailers απόκρισης ως Func<ResponseTrailersTransformContext, ValueTask> . Αυτό επιτρέπει τη δημιουργία ενός προσαρμοσμένου μετασχηματισμού trailers απόκρισης χωρίς να χρειάζεται να υλοποιήσετε μια παράγωγη κλάση του ResponseTrailersTransform.

## Μετασχηματισμοί σώματος αιτήματος

Το YARP δεν παρέχει ενσωματωμένους μετασχηματισμούς για την τροποποίηση του σώματος του αιτήματος. Ωστόσο, το σώμα μπορεί να τροποποιηθεί από προσαρμοσμένους μετασχηματισμούς.

Να είστε προσεκτικοί σχετικά με το ποια είδη αιτημάτων τροποποιούνται, πόσα δεδομένα αποθηκεύονται προσωρινά σε buffer, την επιβολή ορίων χρόνου, την ανάλυση μη έμπιστων δεδομένων εισόδου, και την ενημέρωση κεφαλίδων που σχετίζονται με το σώμα, όπως η Content-Length .

Το παρακάτω παράδειγμα χρησιμοποιεί απλή, μη αποδοτική προσωρινή αποθήκευση (buffering) για τον μετασχηματισμό αιτημάτων. Μια πιο αποδοτική υλοποίηση θα περιτύλισσε (wrap) και θα αντικαθιστούσε το HttpContext.Request.Body με ένα stream που θα εκτελούσε τις απαραίτητες τροποποιήσεις καθώς τα δεδομένα προωθούνταν από τον client στον server. Αυτό θα απαιτούσε επίσης την αφαίρεση της κεφαλίδας Content-Length, καθώς το τελικό μήκος δεν θα ήταν γνωστό εκ των προτέρων.

Αυτό το δείγμα απαιτεί YARP 1.1, δείτε https://github.com/microsoft/reverse-proxy/pull/1569 .

```csharp
.AddTransforms(context =>
{
      context.AddRequestTransform(async requestContext =>
      {
             using var reader =
                      new StreamReader(requestContext.HttpContext.Request.Body);
                   // TODO: size limits, timeouts
                   var body = await reader.ReadToEndAsync();
                   if (!string.IsNullOrEmpty(body))
                   {
                      body = body.Replace("Alpha", "Charlie");
                      var bytes = Encoding.UTF8.GetBytes(body);
                      // Change Content-Length to match the modified body, or remove it
                      requestContext.HttpContext.Request.Body = new MemoryStream(bytes);
                      // Request headers are copied before transforms are invoked, update
```

## any

## // needed headers on the ProxyRequest

requestContext.ProxyRequest.Content.Headers.ContentLength =

bytes.Length;

}

});

});

Οι προσαρμοσμένοι μετασχηματισμοί μπορούν να τροποποιήσουν το σώμα ενός αιτήματος μόνο αν αυτό υπάρχει ήδη. Δεν μπορούν να προσθέσουν νέο σώμα σε ένα αίτημα που δεν διαθέτει ένα (για παράδειγμα, ένα αίτημα POST χωρίς σώμα ή ένα αίτημα GET). Αν χρειάζεται να προσθέσετε σώμα για συγκεκριμένη μέθοδο HTTP και διαδρομή, πρέπει να το κάνετε σε ενδιάμεσο λογισμικό που εκτελείται πριν από το YARP, όχι σε μετασχηματισμό.

Το παρακάτω ενδιάμεσο λογισμικό δείχνει πώς να προσθέσετε σώμα σε ένα αίτημα που δεν διαθέτει ένα:

```csharp
public class AddRequestBodyMiddleware
{
      private readonly RequestDelegate _next;
     public AddRequestBodyMiddleware(RequestDelegate next)
     {
           _next = next;
     }
     public async Task InvokeAsync(HttpContext context)
     {
           // Only modify specific route and method
           if (context.Request.Method == HttpMethods.Get &&
                  context.Request.Path == "/special-route")
           {
                  var bodyContent = "key=value";
                  var bodyBytes = Encoding.UTF8.GetBytes(bodyContent);
                      // Create a new request body
                      context.Request.Body = new MemoryStream(bodyBytes);
                      context.Request.ContentLength = bodyBytes.Length;
                      // Replace IHttpRequestBodyDetectionFeature so YARP knows
                      // a body is present
                      context.Features.Set<IHttpRequestBodyDetectionFeature>(
                      new CustomBodyDetectionFeature());
                   }
          await _next(context);
    }
      // Helper class to indicate the request can have a body
      private class CustomBodyDetectionFeature : IHttpRequestBodyDetectionFeature
      {
             public bool CanHaveBody => true;
      }
}
 Note
You can use context.GetRouteModel().Config.RouteId in middleware to conditionally
apply this logic for specific YARP routes.
```

## Μετασχηματισμοί σώματος απόκρισης

Το YARP δεν παρέχει ενσωματωμένους μετασχηματισμούς για την τροποποίηση του σώματος της απόκρισης. Ωστόσο, το σώμα μπορεί να τροποποιηθεί από προσαρμοσμένους μετασχηματισμούς.

Να είστε προσεκτικοί σχετικά με το ποια είδη αποκρίσεων τροποποιούνται, πόσα δεδομένα αποθηκεύονται προσωρινά σε buffer, την επιβολή ορίων χρόνου, την ανάλυση μη έμπιστων δεδομένων εισόδου, και την ενημέρωση κεφαλίδων που σχετίζονται με το σώμα, όπως η Content-Length . Ενδέχεται να χρειαστεί να αποσυμπιέσετε το περιεχόμενο πριν το τροποποιήσετε, όπως υποδεικνύεται από την κεφαλίδα Content-Encoding, και στη συνέχεια να το συμπιέσετε ξανά ή να αφαιρέσετε την κεφαλίδα.

Το παρακάτω παράδειγμα χρησιμοποιεί απλή, μη αποδοτική προσωρινή αποθήκευση για τον μετασχηματισμό αποκρίσεων. Μια πιο αποδοτική υλοποίηση θα περιτύλισσε το stream που επιστρέφεται από τη ReadAsStreamAsync() με ένα stream που θα εκτελούσε τις απαραίτητες τροποποιήσεις καθώς τα δεδομένα προωθούνταν από τον client στον server. Αυτό θα απαιτούσε επίσης την αφαίρεση της κεφαλίδας Content-Length, καθώς το τελικό μήκος δεν θα ήταν γνωστό εκ των προτέρων.

```csharp
.AddTransforms(context =>
{
      context.AddResponseTransform(async responseContext =>
      {
             var stream =
                   await responseContext.ProxyResponse.Content.ReadAsStreamAsync();
             using var reader = new StreamReader(stream);
             // TODO: size limits, timeouts
                   var body = await reader.ReadToEndAsync();
                   if (!string.IsNullOrEmpty(body))
                   {
                         responseContext.SuppressResponseBody = true;
                   body = body.Replace("Bravo", "Charlie");
                   var bytes = Encoding.UTF8.GetBytes(body);
                   // Change Content-Length to match the modified body, or remove it
                   responseContext.HttpContext.Response.ContentLength = bytes.Length;
                   // Response headers are copied before transforms are invoked, update
                   // any needed headers on the HttpContext.Response
                   await responseContext.HttpContext.Response.Body.WriteAsync(bytes);
             }
      });
});
```

## ITransformProvider

Το ITransformProvider παρέχει τη λειτουργικότητα του AddTransforms που περιγράφηκε παραπάνω, καθώς και ενσωμάτωση με το DI και υποστήριξη επικύρωσης.

Υλοποιήσεις του ITransformProvider μπορούν να καταχωριστούν στο DI καλώντας το AddTransforms. Μπορούν να καταχωριστούν πολλαπλές υλοποιήσεις ITransformProvider, και όλες θα εκτελεστούν.

Το ITransformProvider διαθέτει δύο μεθόδους, την Validate και την Apply . Η Validate σάς δίνει τη δυνατότητα να επιθεωρήσετε τη διαδρομή για τυχόν παραμέτρους που χρειάζονται για τη διαμόρφωση ενός μετασχηματισμού, όπως προσαρμοσμένα μεταδεδομένα, και να επιστρέψετε σφάλματα επικύρωσης στο context αν λείπουν ή είναι μη έγκυρες οι απαιτούμενες τιμές. Η μέθοδος Apply παρέχει την ίδια λειτουργικότητα με το AddTransform, όπως συζητήθηκε παραπάνω, προσθέτοντας και διαμορφώνοντας μετασχηματισμούς ανά διαδρομή.

```csharp
   services.AddReverseProxy()
          .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
          .AddTransforms<MyTransformProvider>();
```

```csharp
internal class MyTransformProvider : ITransformProvider
{
      public void ValidateRoute(TransformRouteValidationContext context)
      {
             // Check all routes for a custom property and validate the associated
             // transform data
             if (context.Route.Metadata?.TryGetValue("CustomMetadata", out var value)
??
                      false)
                   {
                      if (string.IsNullOrEmpty(value))
                      {
                         context.Errors.Add(new ArgumentException(
                              "A non-empty CustomMetadata value is required"));
                      }
                   }
}
public void ValidateCluster(TransformClusterValidationContext context)
{
      // Check all clusters for a custom property and validate the associated
      // transform data.
      if (context.Cluster.Metadata?.TryGetValue("CustomMetadata", out var value)
             ?? false)
      {
             if (string.IsNullOrEmpty(value))
             {
                   context.Errors.Add(new ArgumentException(
                          "A non-empty CustomMetadata value is required"));
             }
      }
}
      public void Apply(TransformBuilderContext transformBuildContext)
      {
             // Check all routes for a custom property and add the associated trans-
form.
             if ((transformBuildContext.Route.Metadata?.TryGetValue("CustomMetadata",
                   out var value) ?? false)
                   || (transformBuildContext.Cluster?.Metadata?.TryGetValue(
                   "CustomMetadata", out value) ?? false))
             {
                   if (string.IsNullOrEmpty(value))
                   {
                          throw new ArgumentException(
                                 "A non-empty CustomMetadata value is required");
                   }
                      transformBuildContext.AddRequestTransform(transformContext =>
                      {
                            transformContext.ProxyRequest.Options.Set(
                                   new HttpRequestOptionsKey<string>("CustomMetadata"), value);
                          return default;
                   });
             }
      }
}
```

## ITransformFactory

Οι προγραμματιστές που θέλουν να ενσωματώσουν τους προσαρμοσμένους μετασχηματισμούς τους με την ενότητα Transforms της διαμόρφωσης μπορούν να υλοποιήσουν ένα ITransformFactory. Αυτό θα πρέπει να καταχωριστεί στο DI χρησιμοποιώντας τη μέθοδο

AddTransformFactory<T>() . Μπορούν να καταχωριστούν πολλαπλά factories, και όλα θα χρησιμοποιηθούν.

Το ITransformFactory παρέχει δύο μεθόδους, την Validate και την Build . Αυτές επεξεργάζονται ένα σύνολο τιμών μετασχηματισμού τη φορά, το οποίο αναπαρίσταται από ένα IReadOnlyDictionary<string, string> .

Η μέθοδος Validate καλείται κατά τη φόρτωση μιας διαμόρφωσης, για να επαληθεύσει τα περιεχόμενα και να αναφέρει όλα τα σφάλματα. Τυχόν σφάλματα που αναφέρονται θα εμποδίσουν την εφαρμογή της διαμόρφωσης.

Η μέθοδος Build λαμβάνει τη δεδομένη διαμόρφωση και παράγει τα σχετικά στιγμιότυπα μετασχηματισμού για τη διαδρομή.

```csharp
services.AddReverseProxy()
      .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
      .AddTransformFactory<MyTransformFactory>();
```

```csharp
internal class MyTransformFactory : ITransformFactory
{
      public bool Validate(TransformRouteValidationContext context,
             IReadOnlyDictionary<string, string> transformValues)
      {
             if (transformValues.TryGetValue("CustomTransform", out var value))
             {
                   if (string.IsNullOrEmpty(value))
                   {
                          context.Errors.Add(new ArgumentException(
                                 "A non-empty CustomTransform value is required"));
                   }
                         return true; // Matched
                   }
          return false;
    }
    public bool Build(TransformBuilderContext context,
          IReadOnlyDictionary<string, string> transformValues)
    {
          if (transformValues.TryGetValue("CustomTransform", out var value))
          {
                 if (string.IsNullOrEmpty(value))
                 {
                       throw new ArgumentException(
                              "A non-empty CustomTransform value is required");
                 }
                   context.AddRequestTransform(transformContext =>
                   {
                         transformContext.ProxyRequest.Options.Set(
                                new HttpRequestOptionsKey<string>("CustomTransform"), value);
                         return default;
                   });
                         return true;
                   }
             return false;
      }
}
Validate and Build return true if they've identified the given transform configuration as one
that they own. A ITransformFactory may implement multiple transforms. Any
RouteConfig.Transforms entries not handled by any ITransformFactory will be considered
configuration errors and prevent the configuration from being applied.
Consider also adding parametrized extension methods on RouteConfig like
WithTransformQueryValue to facilitate programmatic route construction.
```

```csharp
   public static RouteConfig WithTransformQueryValue(this RouteConfig routeConfig,
          string queryKey, string value, bool append = true)
   {
          var type = append ? QueryTransformFactory.AppendKey :
                 QueryTransformFactory.SetKey;
          return routeConfig.WithTransform(transform =>
          {
                 transform[QueryTransformFactory.QueryValueParameterKey] = queryKey;
                 transform[type] = value;
          });
   }
 Note: The author created this article with assistance from AI. Learn more
```
