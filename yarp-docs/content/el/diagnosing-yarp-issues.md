---
slug: diagnosing-yarp-issues
title: Διάγνωση διακομιστών μεσολάβησης που βασίζονται σε YARP
lede: >-
  Όταν χρησιμοποιείτε έναν αντίστροφο διακομιστή μεσολάβησης, υπάρχει ένα επιπλέον hop από τον
  client προς τον διακομιστή μεσολάβησης, και στη συνέχεια
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/diagnosing-yarp-issues
lastUpdated: 2026-08-11
---

Όταν χρησιμοποιείτε έναν αντίστροφο διακομιστή μεσολάβησης, υπάρχει ένα επιπλέον hop από τον client προς τον διακομιστή μεσολάβησης, και έπειτα από τον διακομιστή μεσολάβησης προς τον προορισμό, όπου μπορεί κάτι να πάει στραβά. Αυτό το θέμα στοχεύει να παρέχει μερικές συμβουλές και υποδείξεις για το πώς να εντοπίζετε και να διαγιγνώσκετε προβλήματα όταν προκύπτουν. Θεωρεί δεδομένο ότι ο διακομιστής μεσολάβησης ήδη εκτελείται, και επομένως δεν καλύπτει προβλήματα κατά την εκκίνηση, όπως σφάλματα διαμόρφωσης.

## Καταγραφή

Το πρώτο βήμα για να μπορείτε να καταλάβετε τι συμβαίνει με το YARP είναι να ενεργοποιήσετε την καταγραφή (logging). Πρόκειται για μια σημαία διαμόρφωσης, οπότε μπορεί να αλλάξει εν κινήσει (on the fly). Το YARP υλοποιείται ως στοιχείο ενδιάμεσου λογισμικού για το ASP.NET Core, οπότε χρειάζεται να ενεργοποιήσετε την καταγραφή τόσο για το YARP όσο και για το ASP.NET, ώστε να έχετε την πλήρη εικόνα του τι συμβαίνει.

Από προεπιλογή, το ASP.NET καταγράφει στην κονσόλα, και το αρχείο διαμόρφωσης μπορεί να χρησιμοποιηθεί για τον έλεγχο του επιπέδου καταγραφής.

```json
       //Sets the Logging level for ASP.NET
       "Logging": {
          "LogLevel": {
             "Default": "Information",
             // Uncomment to hide diagnostic messages from runtime and proxy
             // "Microsoft": "Warning",
             // "Yarp" : "Warning",
             "Microsoft.Hosting.Lifetime": "Information"
          }
       },
You want logging information from the Microsoft.AspNetCore.\* and Yarp.ReverseProxy.\*
providers. The preceding example emits Information -level events from both providers to the
console. Changing the level to Debug shows additional entries. ASP.NET implements change
detection for configuration files, so you can edit the appsettings.json file (or
appsettings.development.json for the Development environment) while the project is running
and observe changes to the log output.
 Note
Settings in the appsettings.development.json file override settings in appsettings.json
when running in the Development environment, so make sure that if you are editing
appsettings.json that the values aren't overridden.
```

## Κατανόηση των καταχωρίσεων καταγραφής

Η έξοδος καταγραφής συνδέεται άμεσα με τον τρόπο που το ASP.NET Core επεξεργάζεται τα αιτήματα. Είναι σημαντικό να συνειδητοποιήσετε ότι, ως ενδιάμεσο λογισμικό, το YARP βασίζεται σε μεγάλο μέρος της λειτουργικότητας του ASP.NET για την επεξεργασία των αιτημάτων· για παράδειγμα, ακολουθεί η επεξεργασία ενός αιτήματος με ενεργοποιημένη τη λειτουργία "Debug":

Level Log Message Description

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[39] Connections are Connection id "0HMCD0JK7K51U" accepted. independent of requests, so this is a new connection

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[1] Connection id "0HMCD0JK7K51U" started.

info Microsoft.AspNetCore.Hosting.Diagnostics[1] This is the incoming Request starting HTTP/1.1 GET http://localhost:5000/ - - request to ASP.NET

dbug Microsoft.AspNetCore.HostFiltering.HostFilteringMiddleware[0] My configuration does Wildcard detected, all requests with hosts will be allowed. not tie endpoints to specific hostnames

dbug Microsoft.AspNetCore.Routing.Matching.DfaMatcher[1001] This shows what 1 candidate(s) found for the request path '/' possible matches there are for the route

dbug Microsoft.AspNetCore.Routing.Matching.DfaMatcher[1005] The minimum route Endpoint 'minimumroute' with route pattern '{**catch-all}' is valid for from YARPs the request path '/' configuration has matched

dbug Microsoft.AspNetCore.Routing.EndpointRoutingMiddleware[1] Request matched endpoint 'minimumroute'

info Microsoft.AspNetCore.Routing.EndpointMiddleware[0] Executing endpoint 'minimumroute'

info Yarp.ReverseProxy.Forwarder.HttpForwarder[9] YARP is proxying the Proxying to http://www.example.com/ request to example.com

info Microsoft.AspNetCore.Routing.EndpointMiddleware[1] Executed endpoint 'minimumroute'

Level Log Message Description

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[9] The response has Connection id "0HMCD0JK7K51U" completed keep alive response. finished, but connection can be kept alive.

info Microsoft.AspNetCore.Hosting.Diagnostics[2] The response completed Request finished HTTP/1.1 GET http://localhost:5000/ - - - 200 1256 with status code 200, text/html;+charset=utf-8 12.7797ms responding with 1256 bytes as text/html in ~13ms.

dbug Microsoft.AspNetCore.Server.Kestrel.Transport.Sockets[6] Diagnostic information Connection id "0HMCD0JK7K51U" received FIN. about the connection to determine who closed it and how cleanly

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[10] Connection id "0HMCD0JK7K51U" disconnecting.

dbug Microsoft.AspNetCore.Server.Kestrel.Connections[2] Connection id "0HMCD0JK7K51U" stopped.

dbug Microsoft.AspNetCore.Server.Kestrel.Transport.Sockets[7] Connection id "0HMCD0JK7K51U" sending FIN because: "The Socket transport's send loop completed gracefully."

Τα παραπάνω παρέχουν γενικές πληροφορίες σχετικά με το αίτημα και τον τρόπο επεξεργασίας του.

## Χρήση της καταγραφής αιτημάτων του ASP.NET

Το ASP.NET περιλαμβάνει ένα στοιχείο ενδιάμεσου λογισμικού που μπορεί να χρησιμοποιηθεί για την παροχή περισσότερων λεπτομερειών σχετικά με το αίτημα και την απόκριση. Το στοιχείο UseHttpLogging μπορεί να προστεθεί στο pipeline αιτημάτων, το οποίο προσθέτει επιπλέον καταχωρίσεις στο log που καταγράφουν τις εισερχόμενες και εξερχόμενες κεφαλίδες αιτημάτων.

```csharp
   app.UseHttpLogging();
   // Enable endpoint routing, required for the reverse proxy
   app.UseRouting();
   // Register the reverse proxy routes
   app.MapReverseProxy();
For example:
```

```console
info: Microsoft.AspNetCore.HttpLogging.HttpLoggingMiddleware[1]
         Request:
         Protocol: HTTP/1.1
         Method: GET
         Scheme: http
         PathBase:
         Path: /
         Accept: */*
         Host: localhost:5000
         User-Agent: curl/7.55.1
info: Microsoft.AspNetCore.HttpLogging.HttpLoggingMiddleware[2]
         Response:
         StatusCode: 200
         Content-Type: text/html; charset=utf-8
         Date: Tue, 12 Oct 2021 23:29:20 GMT
         Server: ECS,(sec/97A5)
         Age: 113258
         Cache-Control: [Redacted]
         ETag: [Redacted]
         Expires: Tue, 19 Oct 2021 23:29:20 GMT
         Last-Modified: Thu, 17 Oct 2019 07:18:26 GMT
         Vary: [Redacted]
         Content-Length: 1256
         X-Cache: [Redacted]
```

## Χρήση συμβάντων τηλεμετρίας

Συνιστούμε να διαβάσετε το Networking telemetry in .NET ως εισαγωγή στο πώς να καταναλώνετε τηλεμετρία δικτύωσης στο .NET.

Το δείγμα Metrics δείχνει πώς να ακούτε συμβάντα από τους διάφορους providers που συλλέγουν τηλεμετρία ως μέρος του YARP. Τα πιο σημαντικά από την οπτική της διάγνωσης είναι:

ForwarderTelemetryConsumer HttpClientTelemetryConsumer

Για να χρησιμοποιήσετε οποιοδήποτε από αυτά, δημιουργήστε μια κλάση που υλοποιεί μια διεπαφή Yarp.Telemetry.Consumption, όπως η IForwarderTelemetryConsumer:

```csharp
public class ForwarderTelemetry : IForwarderTelemetryConsumer
{
      /// Called before forwarding a request.
      public void OnForwarderStart(DateTime timestamp, string destinationPrefix)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnForwarderStart :: Destination prefix: {destinationPrefix}");
                 }
/// Called after forwarding a request.
public void OnForwarderStop(DateTime timestamp, int statusCode)
{
      Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
             $"OnForwarderStop :: Status: {statusCode}");
}
      /// Called before <see cref="OnForwarderStop(DateTime, int)"/> if forwarding
the request failed.
      public void OnForwarderFailed(DateTime timestamp, ForwarderError error)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnForwarderFailed :: Error: {error.ToString()}");
      }
/// Called when reaching a given stage of forwarding a request.
public void OnForwarderStage(DateTime timestamp, ForwarderStage stage)
{
      Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
             $"OnForwarderStage :: Stage: {stage.ToString()}");
}
      /// Called periodically while a content transfer is active.
      public void OnContentTransferring(DateTime timestamp, bool isRequest, long
contentLength,
             long iops, TimeSpan readTime, TimeSpan writeTime)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnContentTransferring :: Is request: {isRequest}, Content length:
{contentLength}, " +
                   $"IOps: {iops}, Read time: {readTime:s\\.fff}, Write time:
{writeTime:s\\.fff}");
      }
      /// Called after transferring the request or response content.
      public void OnContentTransferred(DateTime timestamp, bool isRequest, long con-
tentLength,
             long iops, TimeSpan readTime, TimeSpan writeTime, TimeSpan firstReadTime)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnContentTransferred :: Is request: {isRequest}, Content length:
{contentLength}, " +
                   $"IOps: {iops}, Read time: {readTime:s\\.fff}, Write time:
{writeTime:s\\.fff}");
      }
      /// Called before forwarding a request from `ForwarderMiddleware`, therefore
is not called for direct forwarding scenarios.
      public void OnForwarderInvoke(DateTime timestamp, string clusterId, string
routeId,
             string destinationId)
      {
             Console.WriteLine($"Forwarder Telemetry [{timestamp:HH:mm:ss.fff}] => " +
                   $"OnForwarderInvoke:: Cluster id: {clusterId}, Route Id: {routeId},
Destination: {destinationId}");
   }
}
Register the class as part of services, for example:
```

```csharp
   services.AddTelemetryConsumer<ForwarderTelemetry>();
   // Add the reverse proxy to capability to the server
   var proxyBuilder = services.AddReverseProxy();
   // Initialize the reverse proxy from the "ReverseProxy" section of configuration
   proxyBuilder.LoadFromConfig(Configuration.GetSection("ReverseProxy"));
Details are logged on each part of the request, for example:
```

```console
   Forwarder Telemetry [06:40:48.186] => OnForwarderInvoke::
          Cluster id: minimumcluster, Route Id: minimumroute, Destination: example.com
   Forwarder Telemetry [06:41:00.269] => OnForwarderStart ::
          Destination prefix: http://www.example.com/
   Forwarder Telemetry [06:41:00.298] => OnForwarderStage :: Stage: SendAsyncStart
   Forwarder Telemetry [06:41:00.507] => OnForwarderStage :: Stage: SendAsyncStop
   Forwarder Telemetry [06:41:00.530] => OnForwarderStage :: Stage:
          ResponseContentTransferStart
   Forwarder Telemetry [06:41:03.655] => OnForwarderStop :: Status: 200
The events for telemetry are fired as they occur, so you can obtain the HttpContext and the
YARP feature from it:
```

```csharp
   services.AddTelemetryConsumer<ForwarderTelemetry>();
   services.AddHttpContextAccessor();
   ...
   public void OnForwarderInvoke(DateTime timestamp, string clusterId, string
   routeId,
          string destinationId)
   {
          var context = new HttpContextAccessor().HttpContext;
          var YarpFeature = context.GetReverseProxyFeature();
          var dests = from d in YarpFeature.AvailableDestinations
                 select d.Model.Config.Address;
   Console.WriteLine($"Destinations: {string.Join(", ", dests)}");
}
```

## Χρήση προσαρμοσμένου ενδιάμεσου λογισμικού

Ένας άλλος τρόπος για να επιθεωρήσετε την κατάσταση των αιτημάτων είναι να εισαγάγετε επιπλέον ενδιάμεσο λογισμικό στο pipeline αιτημάτων. Μπορείτε να το εισαγάγετε ανάμεσα στα άλλα στάδια για να δείτε την κατάσταση του αιτήματος.

```csharp
   // We can customize the proxy pipeline and add/remove/replace steps
   app.MapReverseProxy(proxyPipeline =>
   {
          // Use a custom proxy middleware, defined below
          proxyPipeline.Use(MyCustomProxyStep);
          // Don't forget to include these two middleware when you make a custom proxy
   pipeline (if you need them).
          proxyPipeline.UseSessionAffinity();
          proxyPipeline.UseLoadBalancing();
   });
   ...
   public Task MyCustomProxyStep(HttpContext context, Func<Task> next)
   {
          // Can read data from the request via the context
          foreach (var header in context.Request.Headers)
          {
                 Console.WriteLine($"{header.Key}: {header.Value}");
          }
          // The context also stores a ReverseProxyFeature which holds proxy specific
   data such as the cluster, route and destinations
          var proxyFeature = context.GetReverseProxyFeature();
   Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(proxyFeature.Route.Con
   fig));
          // Important - required to move to the next step in the proxy pipeline
          return next();
   }
You can also use ASP.NET middleware within Configure that will enable you to inspect the
request before the proxy pipeline.
 Note
The proxy streams the response from the destination server back to the client, so the
response headers and body aren't readily accessible via middleware.
```

## Χρήση του debugger

Ένας debugger, όπως το Visual Studio, μπορεί να συνδεθεί (attached) στη διεργασία του διακομιστή μεσολάβησης. Ωστόσο, εκτός αν διαθέτετε ήδη ενδιάμεσο λογισμικό, δεν υπάρχει κάποιο κατάλληλο σημείο στον κώδικα της εφαρμογής για να διακόψετε την εκτέλεση και να επιθεωρήσετε την κατάσταση του αιτήματος. Επομένως, ο debugger χρησιμοποιείται καλύτερα σε συνδυασμό με μία από τις προηγούμενες τεχνικές, ώστε να έχετε συγκεκριμένα σημεία για την τοποθέτηση breakpoints.

## Ιχνηλάτηση δικτύου

Μπορεί να είναι δελεαστικό να χρησιμοποιήσετε εργαλεία ιχνηλάτησης δικτύου όπως το Fiddler ή το Wireshark, για να προσπαθήσετε να παρακολουθήσετε τι συμβαίνει και στις δύο πλευρές του διακομιστή μεσολάβησης. Ωστόσο, να είστε προσεκτικοί όταν χρησιμοποιείτε και τα δύο εργαλεία:

Το Fiddler καταχωρίζεται ως proxy και βασίζεται στο ότι οι εφαρμογές χρησιμοποιούν τον προεπιλεγμένο proxy για να μπορεί να παρακολουθεί την κυκλοφορία. Αυτό λειτουργεί για την εισερχόμενη κυκλοφορία από ένα πρόγραμμα περιήγησης προς το YARP, αλλά δεν θα καταγράψει τα εξερχόμενα αιτήματα, καθώς το YARP έχει διαμορφωθεί να μη χρησιμοποιεί τις ρυθμίσεις proxy για την εξερχόμενη κυκλοφορία. Στα Windows, το Wireshark χρησιμοποιεί το Npcap για τη λήψη δεδομένων πακέτων δικτυακής κυκλοφορίας, οπότε καταγράφει τόσο την εισερχόμενη όσο και την εξερχόμενη κυκλοφορία και μπορεί να χρησιμοποιηθεί για την παρακολούθηση κυκλοφορίας HTTP. Η κυκλοφορία HTTPS είναι κρυπτογραφημένη και δεν μπορεί να αποκρυπτογραφηθεί αυτόματα από εργαλεία παρακολούθησης δικτύου. Κάθε εργαλείο διαθέτει λύσεις παράκαμψης που ενδέχεται να επιτρέψουν την παρακολούθηση της κυκλοφορίας, απαιτούν όμως ριψοκίνδυνη χρήση πιστοποιητικών και αλλαγές στις σχέσεις εμπιστοσύνης. Επειδή το YARP πραγματοποιεί εξερχόμενα αιτήματα, οι τεχνικές εξαπάτησης προγραμμάτων περιήγησης δεν ισχύουν για τη διεργασία του YARP.

Η επιλογή πρωτοκόλλου για την εξερχόμενη κυκλοφορία γίνεται με βάση το URL προορισμού στη διαμόρφωση του cluster. Αν χρησιμοποιείται παρακολούθηση κυκλοφορίας για διάγνωση, η αλλαγή των εξερχόμενων URL σε http:// , όπου είναι δυνατόν, μπορεί να είναι η απλούστερη προσέγγιση ώστε να λειτουργήσουν τα εργαλεία παρακολούθησης, εφόσον τα προβλήματα που διαγιγνώσκονται δεν σχετίζονται με το πρωτόκολλο μεταφοράς.

:::note
Ο συγγραφέας δημιούργησε αυτό το άρθρο με τη βοήθεια AI. Μάθετε περισσότερα
:::
