---
slug: http3
title: HTTP/3
lede: >-
  Το YARP 1.1 υποστηρίζει το HTTP/3 για εισερχόμενες και εξερχόμενες συνδέσεις, αξιοποιώντας την
  υποστήριξη HTTP/3.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http3
lastUpdated: 2026-08-11
---

## Εισαγωγή

Το YARP 1.1 υποστηρίζει το HTTP/3 για εισερχόμενες και εξερχόμενες συνδέσεις, αξιοποιώντας την υποστήριξη HTTP/3 του .NET 7. Για να ενεργοποιήσετε το πρωτόκολλο HTTP/3 στο YARP, πρέπει να:

- Διαμορφώσετε τις εισερχόμενες συνδέσεις στο Kestrel
- Διαμορφώσετε τις εξερχόμενες συνδέσεις στο HttpClient

## Ρύθμιση του HTTP/3 στο Kestrel

Απαιτείται ορισμός των πρωτοκόλλων στις επιλογές του listener:

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.WebHost.ConfigureKestrel(kestrel =>
   {
          kestrel.ListenAnyIP(443, portOptions =>
          {
                 portOptions.Protocols = HttpProtocols.Http1AndHttp2AndHttp3;
                 portOptions.UseHttps();
          });
   });
```

## HttpClient

Η προεπιλεγμένη έκδοση του `HttpRequest` θα πρέπει να αντικατασταθεί με «3» - δείτε περισσότερες λεπτομέρειες σχετικά με τη διαμόρφωση του `HttpRequest`.

:::note
Αυτό το άρθρο δημιουργήθηκε από τον συγγραφέα με τη βοήθεια τεχνητής νοημοσύνης (AI). Μάθετε περισσότερα
:::
