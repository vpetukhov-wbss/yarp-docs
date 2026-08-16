---
slug: httpsys-delegation
title: Ανάθεση HTTP.sys
lede: >-
  Η ανάθεση (delegation) HTTP.sys είναι ένα χαρακτηριστικό σε επίπεδο πυρήνα (kernel) που
  προστέθηκε σε νεότερες εκδόσεις των Windows, το οποίο
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/httpsys-delegation
lastUpdated: 2026-08-11
---

## Εισαγωγή

Η ανάθεση (delegation) HTTP.sys είναι ένα χαρακτηριστικό σε επίπεδο πυρήνα (kernel) που προστέθηκε σε νεότερες εκδόσεις των Windows και επιτρέπει τη μεταφορά ενός αιτήματος από την ουρά HTTP.sys της διεργασίας λήψης στην ουρά HTTP.sys μιας διεργασίας-στόχου, με ελάχιστη επιβάρυνση ή πρόσθετη καθυστέρηση. Για να λειτουργήσει αυτή η ανάθεση, η διεργασία λήψης επιτρέπεται να διαβάσει μόνο τις κεφαλίδες του αιτήματος. Αν έχει ξεκινήσει η ανάγνωση του σώματος ή έχει ξεκινήσει μια απόκριση, η προσπάθεια ανάθεσης του αιτήματος θα αποτύχει. Η απόκριση δεν θα είναι ορατή στον διακομιστή μεσολάβησης μετά την ανάθεση, γεγονός που περιορίζει τη λειτουργικότητα των στοιχείων συνάφειας συνεδρίας και παθητικών ελέγχων υγείας, καθώς και ορισμένων αλγορίθμων εξισορρόπησης φορτίου. Εσωτερικά, το YARP αξιοποιεί το IHttpSysRequestDelegationFeature του ASP.NET Core

## Απαιτήσεις

Η ανάθεση HTTP.sys απαιτεί:

Τον διακομιστή HTTP.sys του ASP.NET Core. Windows Server 2019 ή Windows 10 (build 1809) ή νεότερο.

## Προεπιλογές

Η ανάθεση HTTP.sys δεν θα χρησιμοποιηθεί εκτός αν προστεθεί στο pipeline του διακομιστή μεσολάβησης και ενεργοποιηθεί στη διαμόρφωση του προορισμού.

## Διαμόρφωση

Η ανάθεση HTTP.sys μπορεί να ενεργοποιηθεί ανά προορισμό προσθέτοντας τα μεταδεδομένα HttpSysDelegationQueue στον προορισμό. Η τιμή αυτών των μεταδεδομένων θα πρέπει να είναι το όνομα της ουράς HTTP.sys-στόχου. Το Address του προορισμού χρησιμοποιείται για να καθορίσει το πρόθεμα url της ουράς HTTP.sys.

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Path": "{**catch-all}"
                      }
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                         "cluster1/destination1": {
                            "Address": "http://*:80/",
                            "Metadata": {
                               "HttpSysDelegationQueue": "TargetHttpSysQueueName"
                            }
                         }
                      }
                   }
      }
   }
}
In host configuration, configure the host to use the HTTP.sys server:
    C#
   webBuilder.UseHttpSys();
In application configuration, use the MapReverseProxy overload that allows you to customize
the pipeline and add HTTP.sys delegation by calling UseHttpSysDelegation :
```

```csharp
   app.MapReverseProxy(proxyPipeline =>
   {
          // Add the three middleware YARP adds by default plus the HTTP.sys
          // delegation middleware
          proxyPipeline.UseSessionAffinity(); // No affect on delegation destinations
          proxyPipeline.UseLoadBalancing();
          proxyPipeline.UsePassiveHealthChecks();
          proxyPipeline.UseHttpSysDelegation();
   });
```

## Κύκλος ζωής της ουράς ανάθεσης

Όταν το YARP έχει διαμορφωθεί ώστε να χρησιμοποιεί ανάθεση για έναν προορισμό, δημιουργείται μια λαβή (handle) προς την καθορισμένη ουρά HTTP.sys. Αυτή η λαβή παραμένει ενεργή για όσο διάστημα υπάρχουν οι προορισμοί που την αναφέρουν. Ο καθαρισμός αυτών των λαβών γίνεται κατά τη διάρκεια του GC, οπότε είναι πιθανό ο καθαρισμός της λαβής να καθυστερήσει αν καταλήξει στη Gen2. Αυτό ενδέχεται να προκαλέσει προβλήματα σε ορισμένους παραλήπτες κατά την επανεκκίνηση της διεργασίας, επειδή, αν προσπαθήσουν να δημιουργήσουν την ουρά κατά την εκκίνηση, αυτό αποτυγχάνει καθώς η ουρά εξακολουθεί να υπάρχει αφού το YARP

διατηρεί μια λαβή προς αυτήν. Οι παραλήπτες πρέπει να είναι αρκετά έξυπνοι ώστε να συνδέονται (attach) αντ' αυτού και να επαναρυθμίζουν σωστά

την ουρά. Ο διακομιστής HTTP.sys του ASP.NET Core έχει αυτό το πρόβλημα. Για περισσότερες πληροφορίες, δείτε το Http.sys

server should support setting up URL groups when attaching to an existing queue

(dotnet/aspnetcore #40359) .

Το YARP εκθέτει έναν τρόπο επαναφοράς της λαβής του προς την ουρά. Αυτό επιτρέπει στους καταναλωτές να γράψουν προσαρμοσμένη λογική για να καθορίσουν πότε θα πρέπει να καθαρίζεται η λαβή προς την ουρά.

Παράδειγμα:

```csharp
var delegator = app.Services.GetRequiredService<IHttpSysDelegator>();
delegator.ResetQueue("TargetHttpSysQueueName", "http://*:80");
 Note: The author created this article with assistance from AI. Learn more
```
