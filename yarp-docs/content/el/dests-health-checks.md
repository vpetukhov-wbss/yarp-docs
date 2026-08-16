---
slug: dests-health-checks
title: Έλεγχοι υγείας προορισμού
lede: >-
  Στα περισσότερα πραγματικά συστήματα, είναι αναμενόμενο οι κόμβοι τους να αντιμετωπίζουν κατά
  καιρούς παροδικά προβλήματα
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks
lastUpdated: 2026-08-11
---

Στα περισσότερα πραγματικά συστήματα, είναι αναμενόμενο οι κόμβοι τους να αντιμετωπίζουν κατά καιρούς παροδικά προβλήματα και να καταρρέουν εντελώς, για ποικίλους λόγους όπως υπερφόρτωση, διαρροή πόρων, βλάβες υλικού κ.λπ. Ιδανικά, θα ήταν επιθυμητό να αποτρέπονται εντελώς αυτά τα ατυχή συμβάντα με προληπτικό τρόπο, όμως το κόστος σχεδίασης και κατασκευής ενός τέτοιου ιδανικού συστήματος είναι συνήθως απαγορευτικά υψηλό. Υπάρχει ωστόσο και μια εναλλακτική, αντιδραστική προσέγγιση, η οποία είναι φθηνότερη και στοχεύει στην ελαχιστοποίηση του αρνητικού αντίκτυπου που προκαλούν οι αστοχίες στα αιτήματα των clients. Ο διακομιστής μεσολάβησης μπορεί να αναλύει την υγεία κάθε κόμβου και να σταματά να στέλνει κυκλοφορία client σε όσους δεν είναι υγιείς, μέχρι να ανακάμψουν. Το YARP υλοποιεί αυτή την προσέγγιση με τη μορφή ενεργών και παθητικών ελέγχων υγείας προορισμού. Είναι ανεξάρτητοι μεταξύ τους και αποθηκεύονται στις αντίστοιχες ιδιότητες κάθε προορισμού. Οι καταστάσεις υγείας αρχικοποιούνται με την τιμή Unknown, η οποία μπορεί αργότερα να αλλάξει σε Healthy ή Unhealthy από τις αντίστοιχες πολιτικές, όπως εξηγείται παρακάτω.

## Ενεργοί έλεγχοι υγείας

Το YARP μπορεί να παρακολουθεί προληπτικά την υγεία των προορισμών, στέλνοντας περιοδικά αιτήματα δοκιμής σε καθορισμένα endpoints υγείας και αναλύοντας τις αποκρίσεις. Αυτή η ανάλυση εκτελείται από μια πολιτική ενεργού ελέγχου υγείας που καθορίζεται για ένα cluster, και καταλήγει στον υπολογισμό των νέων καταστάσεων υγείας προορισμού. Στο τέλος, η πολιτική χαρακτηρίζει κάθε προορισμό ως υγιή ή μη υγιή, με βάση τον κωδικό απόκρισης HTTP (ο κωδικός 2xx θεωρείται υγιής) και ανακατασκευάζει τη συλλογή υγιών προορισμών του cluster.

Υπάρχουν αρκετές ρυθμίσεις διαμόρφωσης σε επίπεδο cluster που ελέγχουν τους ενεργούς ελέγχους υγείας, οι οποίες μπορούν να οριστούν είτε στο αρχείο διαμόρφωσης είτε σε κώδικα. Μπορεί επίσης να καθοριστεί ένα αφιερωμένο endpoint υγείας ανά προορισμό.

## Παράδειγμα αρχείου

```json
"Clusters": {
   "cluster1": {
      "HealthCheck": {
         "Active": {
             "Enabled": "true",
             "Interval": "00:00:10",
             "Timeout": "00:00:10",
             "Policy": "ConsecutiveFailures",
             "Path": "/api/health",
                      "Query": "?foo=bar"
                   }
      },
      "Metadata": {
                   "ConsecutiveFailuresHealthPolicy.Threshold": "3"
      },
      "Destinations": {
                   "cluster1/destination1": {
                      "Address": "https://localhost:10000/"
                   },
                   "cluster1/destination2": {
                      "Address": "http://localhost:10010/",
                      "Health": "http://localhost:10020/"
                   }
      }
   }
}
```

## Παράδειγμα κώδικα

```csharp
   var clusters = new[]
   {
          new ClusterConfig()
          {
                 ClusterId = "cluster1",
                 HealthCheck = new HealthCheckConfig
                 {
                       Active = new ActiveHealthCheckConfig
                       {
                              Enabled = true,
                              Interval = TimeSpan.FromSeconds(10),
                              Timeout = TimeSpan.FromSeconds(10),
                              Policy = HealthCheckConstants.ActivePolicy.ConsecutiveFailures,
                              Path = "/api/health",
                              Query = "?foo=bar",
                       }
                 },
                 Metadata = new Dictionary<string, string> { {
   ConsecutiveFailuresHealthPolicyOptions.ThresholdMetadataName, "5" } },
                 Destinations =
                 {
                       { "destination1", new DestinationConfig() { Address =
   "https://localhost:10000" } },
                       { "destination2", new DestinationConfig() { Address =
   "https://localhost:10010", Health = "https://localhost:10010" } }
                 }
          }
   };
```

## Διαμόρφωση

Όλες οι ρυθμίσεις ενεργού ελέγχου υγείας, εκτός από μία, καθορίζονται σε επίπεδο cluster, στην ενότητα Cluster/HealthCheck/Active. Η μόνη εξαίρεση είναι το προαιρετικό στοιχείο Destination/Health, το οποίο καθορίζει ένα ξεχωριστό endpoint ενεργού ελέγχου υγείας. Το πραγματικό URI δοκιμής υγείας κατασκευάζεται ως Destination/Address (ή Destination/Health, όταν έχει οριστεί) + Cluster/HealthCheck/Active/Path.

Οι ρυθμίσεις ενεργού ελέγχου υγείας μπορούν επίσης να οριστούν σε κώδικα, μέσω των αντίστοιχων τύπων στον χώρο ονομάτων Yarp.ReverseProxy.Configuration, που αντικατοπτρίζουν τη σύμβαση διαμόρφωσης.

Η ενότητα Cluster/HealthCheck/Active και το ActiveHealthCheckConfig:

Enabled: Σημαία που υποδεικνύει αν ο ενεργός έλεγχος υγείας είναι ενεργοποιημένος για ένα cluster. Προεπιλογή

false

Interval: Περίοδος αποστολής αιτημάτων δοκιμής υγείας. Προεπιλογή 00:00:15. Timeout: Χρονικό όριο του αιτήματος δοκιμής. Προεπιλογή 00:00:10. Policy: Όνομα μιας πολιτικής που αξιολογεί τις ενεργές καταστάσεις υγείας των προορισμών. Υποχρεωτική παράμετρος. Path: Το path ελέγχου υγείας σε όλους τους προορισμούς του cluster. Προεπιλογή null. Query: Η συμβολοσειρά ερωτήματος ελέγχου υγείας σε όλους τους προορισμούς του cluster. Προεπιλογή null.

Η ενότητα Destination και το DestinationConfig.

Health: Ένα αφιερωμένο endpoint δοκιμής υγείας, όπως http://destination:12345/. Προεπιλογή null, οπότε χρησιμοποιείται το Destination/Address.

## Ενσωματωμένες πολιτικές

Υπάρχει προς το παρόν μία ενσωματωμένη πολιτική ενεργού ελέγχου υγείας - η ConsecutiveFailuresHealthPolicy. Μετρά τις διαδοχικές αποτυχίες δοκιμής υγείας και χαρακτηρίζει έναν προορισμό ως μη υγιή, μόλις επιτευχθεί το καθορισμένο όριο. Στην πρώτη επιτυχημένη απόκριση, ένας προορισμός χαρακτηρίζεται υγιής και ο μετρητής μηδενίζεται. Οι παράμετροι της πολιτικής ορίζονται στα metadata του cluster, ως εξής:

ConsecutiveFailuresHealthPolicy.Threshold - αριθμός διαδοχικά αποτυχημένων αιτημάτων ενεργού ελέγχου υγείας που απαιτούνται για να χαρακτηριστεί ένας προορισμός μη υγιής. Προεπιλογή 2.

## Σχεδιασμός

Η κύρια υπηρεσία σε αυτή τη διαδικασία είναι το IActiveHealthCheckMonitor, το οποίο δημιουργεί περιοδικά αιτήματα δοκιμής μέσω του IProbingRequestFactory, τα στέλνει σε όλα τα DestinationConfig κάθε

ClusterConfig με ενεργοποιημένους ενεργούς ελέγχους υγείας, και στη συνέχεια περνά όλες τις αποκρίσεις παρακάτω σε μια

IActiveHealthCheckPolicy που καθορίζεται για ένα cluster. Το IActiveHealthCheckMonitor δεν παίρνει το ίδιο την

τελική απόφαση για το αν ένας προορισμός είναι υγιής ή όχι, αλλά αναθέτει αυτή την ευθύνη σε μια

IActiveHealthCheckPolicy που καθορίζεται για ένα cluster. Μια πολιτική καλείται για να αξιολογήσει τις νέες

καταστάσεις υγείας, μόλις ολοκληρωθούν όλες οι δοκιμές όλων των προορισμών του cluster. Δέχεται ένα ClusterState

που αναπαριστά τη δυναμική κατάσταση του cluster, και ένα σύνολο DestinationProbingResult που αποθηκεύει τα

αποτελέσματα δοκιμής των προορισμών του cluster. Αφού αξιολογήσει τη νέα κατάσταση υγείας για κάθε προορισμό, η

πολιτική καλεί το IDestinationHealthUpdater για να ενημερώσει πραγματικά τις τιμές DestinationHealthState.Active.

-{Για κάθε προορισμό του cluster}- IActiveHealthCheckMonitor <--(Δημιουργία αιτήματος δοκιμής)--> IProbingRequestFactory

| V HttpMessageInvoker <--(Αποστολή δοκιμής και λήψη απόκρισης)--> Destination | (Αποθήκευση αποτελέσματος δοκιμής) | V DestinationProbingResult --------------{ΤΕΛΟΣ}--------------- | (Αξιολόγηση νέων ενεργών καταστάσεων υγείας προορισμού, χρησιμοποιώντας τα αποτελέσματα δοκιμής) | V IActiveHealthCheckPolicy --(Νέες ενεργές καταστάσεις υγείας)--> IDestinationHealthUpdater --(Ενημέρωση για κάθε προορισμό)--> DestinationState.Health.Active

Υπάρχουν προεπιλεγμένες ενσωματωμένες υλοποιήσεις για όλα τα προαναφερθέντα στοιχεία, οι οποίες μπορούν επίσης να αντικατασταθούν με προσαρμοσμένες, όταν χρειάζεται.

## Επεκτασιμότητα

Υπάρχουν 2 κύρια σημεία επεκτασιμότητας στο υποσύστημα ενεργού ελέγχου υγείας.

## IActiveHealthCheckPolicy

Το IActiveHealthCheckPolicy αναλύει πώς οι προορισμοί ανταποκρίνονται στις ενεργές δοκιμές υγείας που στέλνει το IActiveHealthCheckMonitor, αξιολογεί νέες ενεργές καταστάσεις υγείας για όλους τους προορισμούς που δοκιμάστηκαν, και στη συνέχεια καλεί το IDestinationHealthUpdater.SetActive για να ορίσει τις νέες ενεργές καταστάσεις υγείας και να ανακατασκευάσει τη συλλογή υγιών προορισμών με βάση τις ενημερωμένες τιμές.

Παρακάτω δίνεται ένα απλό παράδειγμα μιας προσαρμοσμένης IActiveHealthCheckPolicy, η οποία χαρακτηρίζει έναν προορισμό ως Healthy αν επιστράφηκε επιτυχημένος κωδικός απόκρισης για μια δοκιμή, και ως Unhealthy σε κάθε άλλη περίπτωση.

```csharp
public class FirstUnsuccessfulResponseHealthPolicy : IActiveHealthCheckPolicy
{
      private readonly IDestinationHealthUpdater _healthUpdater;
      public FirstUnsuccessfulResponseHealthPolicy(IDestinationHealthUpdater
healthUpdater)
      {
             _healthUpdater = healthUpdater;
      }
      public string Name => "FirstUnsuccessfulResponse";
      public void ProbingCompleted(ClusterState cluster,
IReadOnlyList<DestinationProbingResult> probingResults)
      {
             if (probingResults.Count == 0)
             {
                   return;
             }
             var newHealthStates = new
NewActiveDestinationHealth[probingResults.Count];
             for (var i = 0; i < probingResults.Count; i++)
             {
                   var response = probingResults[i].Response;
                   var newHealth = response is not null && response.IsSuccessStatusCode ?
DestinationHealth.Healthy : DestinationHealth.Unhealthy;
                   newHealthStates[i] = new
NewActiveDestinationHealth(probingResults[i].Destination, newHealth);
             }
             _healthUpdater.SetActive(cluster, newHealthStates);
      }
}
```

## IProbingRequestFactory

Το IProbingRequestFactory δημιουργεί αιτήματα ενεργής δοκιμής υγείας που θα σταλούν στα endpoints υγείας των προορισμών. Μπορεί να λάβει υπόψη τα ActiveHealthCheckOptions.Path, DestinationConfig.Health και άλλες ρυθμίσεις διαμόρφωσης, για να κατασκευάσει τα αιτήματα δοκιμής.

Το προεπιλεγμένο IProbingRequestFactory χρησιμοποιεί την ίδια διαμόρφωση HttpRequest με τα αιτήματα του διακομιστή μεσολάβησης· για να το προσαρμόσετε, υλοποιήστε το δικό σας IProbingRequestFactory και καταχωρίστε το στο DI, όπως παρακάτω.

```csharp
services.AddSingleton<IProbingRequestFactory, CustomProbingRequestFactory>();
The below is a simple example of a customer IProbingRequestFactory concatenating
DestinationConfig.Address and a fixed health probe path to create the probing request URI.
```

```csharp
   public class CustomProbingRequestFactory : IProbingRequestFactory
   {
          public HttpRequestMessage CreateRequest(ClusterConfig clusterConfig,
   DestinationConfig destinationConfig)
          {
                 var probeUri = new Uri(destinationConfig.Address + "/api/probe-health");
                 return new HttpRequestMessage(HttpMethod.Get, probeUri) { Version =
   ProtocolHelper.Http11Version };
          }
   }
```

## Παθητικοί έλεγχοι υγείας

Το YARP μπορεί να παρακολουθεί παθητικά τις επιτυχίες και τις αποτυχίες κατά τη μεσολάβηση αιτημάτων clients, ώστε να αξιολογεί αντιδραστικά τις καταστάσεις υγείας των προορισμών. Οι αποκρίσεις στα αιτήματα που μεσολαβούνται υποκλέπτονται από ένα αφιερωμένο ενδιάμεσο λογισμικό παθητικού ελέγχου υγείας, το οποίο τις περνά σε μια πολιτική διαμορφωμένη στο cluster. Η πολιτική αναλύει τις αποκρίσεις για να αξιολογήσει αν οι προορισμοί που τις παρήγαγαν είναι υγιείς ή όχι. Στη συνέχεια, υπολογίζει και αναθέτει νέες παθητικές καταστάσεις υγείας στους αντίστοιχους προορισμούς, και ανακατασκευάζει τη συλλογή υγιών προορισμών του cluster.

:::note
η απόκριση συνήθως αποστέλλεται στον client πριν εκτελεστεί η πολιτική παθητικού ελέγχου υγείας, οπότε μια πολιτική δεν μπορεί να υποκλέψει το σώμα της απόκρισης, ούτε να τροποποιήσει οτιδήποτε στις κεφαλίδες απόκρισης, εκτός αν η εφαρμογή του διακομιστή μεσολάβησης εισάγει πλήρη buffering απόκρισης.
:::

Υπάρχει μία σημαντική διαφορά από τη λογική του ενεργού ελέγχου υγείας. Μόλις σε έναν προορισμό ανατεθεί μια μη υγιής παθητική κατάσταση, σταματά να λαμβάνει κάθε νέα κυκλοφορία, γεγονός που εμποδίζει τη μελλοντική επαναξιολόγηση της υγείας του. Η πολιτική προγραμματίζει επίσης μια επανενεργοποίηση του προορισμού μετά την καθορισμένη περίοδο. Επανενεργοποίηση σημαίνει επαναφορά της παθητικής κατάστασης υγείας από Unhealthy πίσω στην αρχική τιμή Unknown, γεγονός που καθιστά τον προορισμό και πάλι επιλέξιμο για κυκλοφορία.

Υπάρχουν αρκετές ρυθμίσεις διαμόρφωσης σε επίπεδο cluster που ελέγχουν τους παθητικούς ελέγχους υγείας, οι οποίες μπορούν να οριστούν είτε στο αρχείο διαμόρφωσης είτε σε κώδικα.

## Παράδειγμα αρχείου

```json
"Clusters": {
   "cluster1": {
      "HealthCheck": {
         "Passive": {
             "Enabled": "true",
             "Policy": "TransportFailureRate",
             "ReactivationPeriod": "00:02:00"
         }
      },
      "Metadata": {
         "TransportFailureRateHealthPolicy.RateLimit": "0.5"
      },
      "Destinations": {
         "cluster1/destination1": {
             "Address": "https://localhost:10000/"
         },
         "cluster1/destination2": {
             "Address": "http://localhost:10010/"
         }
      }
   }
}
```

## Παράδειγμα κώδικα

```csharp
var clusters = new[]
{
      new ClusterConfig()
      {
             ClusterId = "cluster1",
             HealthCheck = new HealthCheckConfig
             {
                   Passive = new PassiveHealthCheckConfig
                   {
                          Enabled = true,
                          Policy = HealthCheckConstants.PassivePolicy.TransportFailureRate,
                          ReactivationPeriod = TimeSpan.FromMinutes(2)
                   }
             },
             Metadata = new Dictionary<string, string> { {
TransportFailureRateHealthPolicyOptions.FailureRateLimitMetadataName, "0.5" } },
             Destinations =
             {
                   { "destination1", new DestinationConfig() { Address =
"https://localhost:10000" } },
                   { "destination2", new DestinationConfig() { Address =
"https://localhost:10010" } }
             }
                 }
          };
```

## Διαμόρφωση

Οι ρυθμίσεις παθητικού ελέγχου υγείας καθορίζονται σε επίπεδο cluster, στην ενότητα Cluster/HealthCheck/Passive. Εναλλακτικά, μπορούν να οριστούν σε κώδικα, μέσω των αντίστοιχων τύπων στον χώρο ονομάτων Yarp.ReverseProxy.Configuration, που αντικατοπτρίζουν τη σύμβαση διαμόρφωσης.

Οι παθητικοί έλεγχοι υγείας απαιτούν την προσθήκη του PassiveHealthCheckMiddleware στο pipeline, για να λειτουργήσουν. Η προεπιλεγμένη μέθοδος MapReverseProxy(this IEndpointRouteBuilder endpoints) το κάνει αυτόματα, αλλά σε περίπτωση χειροκίνητης κατασκευής pipeline πρέπει να κληθεί η μέθοδος UsePassiveHealthChecks για να προστεθεί αυτό το ενδιάμεσο λογισμικό, όπως φαίνεται στο παράδειγμα παρακάτω.

```csharp
   endpoints.MapReverseProxy(proxyPipeline =>
   {
          proxyPipeline.UseAffinitizedDestinationLookup();
          proxyPipeline.UseProxyLoadBalancing();
          proxyPipeline.UseRequestAffinitizer();
          proxyPipeline.UsePassiveHealthChecks();
   });
Cluster/HealthCheck/Passive section and PassiveHealthCheckConfig:
       Enabled - flag indicating whether passive health check is enabled for a cluster. Default
        false
       Policy - name of a policy evaluating destinations' passive health states. Mandatory
      parameter
       ReactivationPeriod - period after which an unhealthy destination's passive health state is
      reset to Unknown and it starts receiving traffic again. Default value is null which means
      the period will be set by a IPassiveHealthCheckPolicy
```

## Ενσωματωμένες πολιτικές

Υπάρχει προς το παρόν μία ενσωματωμένη πολιτική παθητικού ελέγχου υγείας - η TransportFailureRateHealthPolicy. Υπολογίζει το ποσοστό αποτυχίας των αιτημάτων που μεσολαβούνται για κάθε προορισμό, και τον χαρακτηρίζει ως μη υγιή, αν ξεπεραστεί το καθορισμένο όριο. Το ποσοστό υπολογίζεται ως ποσοστό αποτυχημένων αιτημάτων προς το συνολικό αριθμό αιτημάτων που μεσολαβήθηκαν προς έναν προορισμό, σε μια δεδομένη χρονική περίοδο. Οι μετρητές αποτυχημένων και συνολικών αιτημάτων παρακολουθούνται σε ένα κυλιόμενο χρονικό παράθυρο, γεγονός που σημαίνει ότι μόνο οι πρόσφατες μετρήσεις που εμπίπτουν

στο παράθυρο λαμβάνονται υπόψη. Υπάρχουν δύο σύνολα παραμέτρων πολιτικής, οριζόμενα καθολικά

και σε επίπεδο cluster.

Οι καθολικές παράμετροι ορίζονται μέσω του μηχανισμού επιλογών (options), χρησιμοποιώντας τον τύπο TransportFailureRateHealthPolicyOptions, με τις ακόλουθες ιδιότητες:

DetectionWindowSize - χρονική περίοδος κατά την οποία διατηρούνται οι εντοπισμένες αποτυχίες και λαμβάνονται υπόψη στον υπολογισμό του ποσοστού. Προεπιλογή 00:01:00. MinimalTotalCountThreshold - ελάχιστος συνολικός αριθμός αιτημάτων που πρέπει να έχουν μεσολαβηθεί προς έναν προορισμό εντός του παραθύρου εντοπισμού, πριν αυτή η πολιτική αρχίσει να αξιολογεί την υγεία του προορισμού και να επιβάλλει το όριο ποσοστού αποτυχίας. Προεπιλογή 10. DefaultFailureRateLimit - προεπιλεγμένο όριο ποσοστού αποτυχίας για να χαρακτηριστεί ένας προορισμός μη υγιής, το οποίο εφαρμόζεται αν δεν έχει οριστεί στα metadata ενός cluster. Η τιμή βρίσκεται στο εύρος (0,1). Προεπιλογή 0.3 (30%).

Οι καθολικές επιλογές πολιτικής μπορούν να οριστούν σε κώδικα ως εξής:

```csharp
services.Configure<TransportFailureRateHealthPolicyOptions>(o =>
{
      o.DetectionWindowSize = TimeSpan.FromSeconds(30);
      o.MinimalTotalCountThreshold = 5;
      o.DefaultFailureRateLimit = 0.5;
});
Cluster-specific parameters are set in the cluster's metadata as follows:
TransportFailureRateHealthPolicy.RateLimit - failure rate limit for a destination to be marked
as unhealthy. The value is in range (0,1) . Default value is provided by the global
DefaultFailureRateLimit parameter.
```

## Σχεδιασμός

Το κύριο στοιχείο είναι το PassiveHealthCheckMiddleware, το οποίο βρίσκεται στο pipeline αιτημάτων και αναλύει τις αποκρίσεις που επιστρέφουν οι προορισμοί. Για κάθε απόκριση από έναν προορισμό που ανήκει σε ένα cluster με ενεργοποιημένους παθητικούς ελέγχους υγείας, το PassiveHealthCheckMiddleware καλεί μια IPassiveHealthCheckPolicy που καθορίζεται για το cluster. Η πολιτική αναλύει τη δεδομένη απόκριση, αξιολογεί μια νέα παθητική κατάσταση υγείας για τον προορισμό, και καλεί το IDestinationHealthUpdater για να ενημερώσει πραγματικά την τιμή DestinationHealthState.Passive. Η ενημέρωση γίνεται ασύγχρονα στο παρασκήνιο και δεν μπλοκάρει το pipeline αιτημάτων. Όταν ένας προορισμός χαρακτηριστεί μη υγιής, σταματά να λαμβάνει νέα αιτήματα, μέχρι να επανενεργοποιηθεί μετά από μια καθορισμένη περίοδο. Επανενεργοποίηση σημαίνει ότι η κατάσταση DestinationHealthState.Passive του προορισμού επαναφέρεται από

Unhealthy σε Unknown, και η λίστα υγιών προορισμών του cluster ανακατασκευάζεται ώστε να τον περιλαμβάνει. Μια

επανενεργοποίηση προγραμματίζεται από το IDestinationHealthUpdater αμέσως μετά τον ορισμό του DestinationHealthState.Passive

του προορισμού σε Unhealthy.

(Απόκριση σε ένα αίτημα που μεσολαβήθηκε) |

PassiveHealthCheckMiddleware | V

IPassiveHealthCheckPolicy |

(Αξιολόγηση νέας παθητικής κατάστασης υγείας) |

IDestinationHealthUpdater --(Ασύγχρονη ενημέρωση παθητικής κατάστασης)--> DestinationState.Health.Passive

| V (Προγραμματισμός επανενεργοποίησης) --(Ορισμός σε Unknown)--> DestinationState.Health.Passive

## Επεκτασιμότητα

Υπάρχει ένα κύριο σημείο επεκτασιμότητας στο υποσύστημα παθητικού ελέγχου υγείας, το IPassiveHealthCheckPolicy.

## IPassiveHealthCheckPolicy

Το IPassiveHealthCheckPolicy αναλύει πώς ανταποκρίθηκε ένας προορισμός σε ένα αίτημα client που μεσολαβήθηκε, αξιολογεί τη νέα παθητική κατάσταση υγείας του, και τέλος καλεί το IDestinationHealthUpdater.SetPassiveAsync για να δημιουργήσει μια ασύγχρονη εργασία που ενημερώνει πραγματικά την παθητική κατάσταση υγείας και ανακατασκευάζει τη συλλογή υγιών προορισμών.

Παρακάτω δίνεται ένα απλό παράδειγμα μιας προσαρμοσμένης IPassiveHealthCheckPolicy, η οποία χαρακτηρίζει έναν προορισμό ως Unhealthy στην πρώτη ανεπιτυχή απόκριση σε ένα αίτημα που μεσολαβήθηκε.

C# 10/13

public class FirstUnsuccessfulResponseHealthPolicy : IPassiveHealthCheckPolicy {

private static readonly TimeSpan _defaultReactivationPeriod = TimeSpan.FromSeconds(60);

private readonly IDestinationHealthUpdater _healthUpdater;

public FirstUnsuccessfulResponseHealthPolicy(IDestinationHealthUpdater

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks?view=aspnetcore-9.0

healthUpdater)

{

_healthUpdater = healthUpdater;

}

public string Name => "FirstUnsuccessfulResponse";

public void RequestProxied(HttpContext context, ClusterState cluster, DestinationState destination)

{ var error = context.Features.Get<IForwarderErrorFeature>(); if (error is not null) { var reactivationPeriod =

cluster.Model.Config.HealthCheck?.Passive?.ReactivationPeriod ?? _defaultReactivationPeriod;

_healthUpdater.SetPassive(cluster, destination, DestinationHealth.Unhealthy, reactivationPeriod);

} } }

## Συλλογή διαθέσιμων προορισμών

Η κατάσταση υγείας των προορισμών χρησιμοποιείται για να καθοριστεί ποιοι από αυτούς είναι επιλέξιμοι να λαμβάνουν αιτήματα που μεσολαβούνται. Κάθε cluster διατηρεί τη δική του λίστα διαθέσιμων προορισμών, στην ιδιότητα AvailableDestinations του τύπου ClusterDestinationState. Αυτή η λίστα ανακατασκευάζεται όποτε αλλάζει η κατάσταση υγείας κάποιου προορισμού. Το IClusterDestinationsUpdater ελέγχει αυτή τη διαδικασία και καλεί μια IAvailableDestinationsPolicy διαμορφωμένη στο cluster, για να επιλέξει πραγματικά τους διαθέσιμους προορισμούς από το σύνολο των προορισμών του cluster. Υπάρχουν οι ακόλουθες ενσωματωμένες πολιτικές, και προσαρμοσμένες μπορούν να υλοποιηθούν, αν χρειάζεται.

HealthyAndUnknown - Εξετάζει κάθε DestinationState και το προσθέτει στη λίστα διαθέσιμων προορισμών, αν όλες οι ακόλουθες προτάσεις είναι TRUE. Αν δεν υπάρχουν διαθέσιμοι προορισμοί, τα αιτήματα θα λάβουν σφάλμα 503.

Οι ενεργοί έλεγχοι υγείας είναι απενεργοποιημένοι στο cluster Ή DestinationHealthState.Active !=

DestinationHealth.Unhealthy

Οι παθητικοί έλεγχοι υγείας είναι απενεργοποιημένοι στο cluster Ή DestinationHealthState.Passive

!= DestinationHealth.Unhealthy

HealthyOrPanic - Καλεί πρώτα την πολιτική HealthyAndUnknown για να λάβει τους διαθέσιμους προορισμούς. Αν δεν επιστραφεί κανένας από αυτή την κλήση, χαρακτηρίζει όλους τους προορισμούς του cluster ως διαθέσιμους. Αυτή είναι η προεπιλεγμένη πολιτική.

:::note
Μια πολιτική διαθέσιμων προορισμών, διαμορφωμένη σε ένα cluster, θα καλείται πάντα, ανεξάρτητα από το αν είναι ενεργοποιημένος οποιοσδήποτε έλεγχος υγείας στο δεδομένο cluster. Η κατάσταση υγείας ενός απενεργοποιημένου ελέγχου
:::

υγείας ορίζεται σε Unknown.

## Διαμόρφωση

## Παράδειγμα αρχείου

```json
   "Clusters": {
       "cluster1": {
          "HealthCheck": {
             "AvailableDestinationsPolicy": "HealthyOrPanic",
             "Passive": {
                 "Enabled": "true"
             }
          },
          "Destinations": {
             "cluster1/destination1": {
                 "Address": "https://localhost:10000/"
             },
             "cluster1/destination2": {
                 "Address": "http://localhost:10010/"
             }
          }
       }
   }
    Code example                                                                                                 12/13
```

```csharp
          var clusters = new[]
          {
                 new ClusterConfig()
                 {
                       ClusterId = "cluster1",
                       HealthCheck = new HealthCheckConfig
                       {
                              AvailableDestinationsPolicy =
          HealthCheckConstants.AvailableDestinations.HealthyOrPanic,
                              Passive = new PassiveHealthCheckConfig
                              {
                                     Enabled = true
                              }
                       },
                       Destinations =
                       {
                              { "destination1", new DestinationConfig() { Address =
          "https://localhost:10000" } },
https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks?view=aspnetcore-9.0
                      { "destination2", new DestinationConfig() { Address =
"https://localhost:10010" } }
                   }
    }
};
 Note: The author created this article with assistance from AI. Learn more
```
