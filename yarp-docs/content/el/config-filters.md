---
slug: config-filters
title: Φίλτρα διαμόρφωσης
lede: >-
  Τροποποιήστε διαδρομές και clusters αμέσως μετά τη φόρτωσή τους και πριν επικυρωθούν -
  συμπληρώστε τιμές από το περιβάλλον, εφαρμόστε προεπιλογές ή επιβάλετε πολιτικές σε κάθε
  καταχώριση.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-filters
lastUpdated: 2025-02-10
---

## Ο σκοπός των φίλτρων

Η διαμόρφωση που φορτώνεται από αρχεία ή από [έναν προσαρμοσμένο πάροχο](doc:config-providers) αποτελεί ακατέργαστη είσοδο - ένα φίλτρο έχει την ευκαιρία να την τροποποιήσει πριν επικυρωθεί και εφαρμοστεί. Συνήθεις χρήσεις:

- Συμπλήρωση πεδίων από το περιβάλλον ανάπτυξης (μια διεύθυνση προορισμού που είναι γνωστή μόνο κατά την εκτέλεση).
- Εφαρμογή προεπιλογών σε επίπεδο οργανισμού ή επιβολή πολιτικών σε κάθε διαδρομή ή cluster.
- Αντικατάσταση τιμών placeholder.
- Κανονικοποίηση ή διόρθωση μικρών σφαλμάτων διαμόρφωσης πριν αυτά εξελιχθούν σε σοβαρές αποτυχίες.

## Καταχώριση ενός φίλτρου

Τα φίλτρα καταχωρίζονται στο dependency injection με τη `AddConfigFilter`. Μπορούν να προστεθούν όσα χρειάζονται· εκτελούνται με τη σειρά που καταχωρίστηκαν.

```csharp
services.AddReverseProxy()
    .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
    .AddConfigFilter<CustomConfigFilter>();
```

## Συγγραφή ενός φίλτρου

Ένα φίλτρο υλοποιεί το `IProxyConfigFilter`, με μία μέθοδο ανά τύπο διαμόρφωσης - τις `ConfigureRouteAsync` και `ConfigureClusterAsync`. Επειδή τα φίλτρα ανακτώνται από το DI, μπορούν να δέχονται εξαρτήσεις constructor όπως κάθε άλλη καταχωρισμένη υπηρεσία. Κάθε μέθοδος εκτελείται μία φορά ανά διαδρομή ή cluster, κάθε φορά που η διαμόρφωση φορτώνεται ή επαναφορτώνεται, και επιστρέφει είτε το αρχικό στιγμιότυπο αμετάβλητο είτε ένα τροποποιημένο αντίγραφο - η έκφραση `with` των records της C# 9 είναι ένας βολικός τρόπος για την παραγωγή αυτού του αντιγράφου χωρίς να αγγίξετε το υπόλοιπο αντικείμενο.

:::example Αντικατάσταση διευθύνσεων προορισμού από μεταβλητές περιβάλλοντος
Αναζητά placeholders `{{key}}` στις διευθύνσεις προορισμού ενός cluster και αντικαθιστά καθεμία με την τιμή μιας μεταβλητής περιβάλλοντος με όνομα `key`, εκτοξεύοντας εξαίρεση αν δεν έχει οριστεί. Επίσης, αυξάνει το `Order` κάθε διαδρομής σε τουλάχιστον `1`, ώστε οι διαδρομές που καταχωρίζονται μέσω κώδικα (οι οποίες έχουν προεπιλογή `0`) να έχουν πάντα προτεραιότητα έναντι εκείνων που φορτώνονται από τη διαμόρφωση.

```csharp
using System.Text.RegularExpressions;
using Yarp.ReverseProxy.Configuration;

public class CustomConfigFilter : IProxyConfigFilter
{
    private readonly Regex _exp = new("\\{\\{(\\w+)\\}\\}");

    public ValueTask<ClusterConfig> ConfigureClusterAsync(ClusterConfig cluster, CancellationToken cancel)
    {
        var newDestinations = new Dictionary<string, DestinationConfig>(StringComparer.OrdinalIgnoreCase);
        foreach (var d in cluster.Destinations)
        {
            var match = _exp.Match(d.Value.Address);
            if (!match.Success)
            {
                newDestinations.Add(d.Key, d.Value);
                continue;
            }
            var name = match.Groups[1].Value;
            var value = Environment.GetEnvironmentVariable(name)
                ?? throw new ArgumentException($"Substitution for '{name}' in cluster '{d.Key}' was not found.");
            newDestinations.Add(d.Key, d.Value with { Address = value });
        }
        return new ValueTask<ClusterConfig>(cluster with { Destinations = newDestinations });
    }

    public ValueTask<RouteConfig> ConfigureRouteAsync(RouteConfig route, ClusterConfig cluster, CancellationToken cancel)
    {
        if (route.Order is < 1)
        {
            return new ValueTask<RouteConfig>(route with { Order = 1 });
        }
        return new ValueTask<RouteConfig>(route);
    }
}
```
:::
