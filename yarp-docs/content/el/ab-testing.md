---
slug: ab-testing
title: Δοκιμές A/B και σταδιακές αναβαθμίσεις
lede: >-
  Οι δοκιμές A/B και οι σταδιακές αναβαθμίσεις (rolling upgrades) απαιτούν διαδικασίες για τη
  δυναμική ανάθεση εισερχόμενης κυκλοφορίας
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/ab-testing
lastUpdated: 2026-08-11
---

## Δοκιμές A/B και σταδιακές αναβαθμίσεις στο YARP

## Εισαγωγή

Οι δοκιμές A/B και οι σταδιακές αναβαθμίσεις απαιτούν διαδικασίες για τη δυναμική ανάθεση της εισερχόμενης κυκλοφορίας, ώστε να αξιολογούνται αλλαγές στην εφαρμογή προορισμού. Το YARP δεν διαθέτει ενσωματωμένο μοντέλο για αυτό, εκθέτει όμως κάποια υποδομή χρήσιμη για τη δημιουργία ενός τέτοιου συστήματος. Δείτε το issue #126 για επιπλέον λεπτομέρειες σχετικά με αυτό το σενάριο.

## Παράδειγμα

app.MapReverseProxy(proxyPipeline => {

// Custom cluster selection proxyPipeline.Use((context, next) => {

var lookup = context.RequestServices.GetRequiredService<IProxyStateLookup> ();

if (lookup.TryGetCluster(ChooseCluster(context), out var cluster)) {

context.ReassignProxyRequest(cluster); }

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); });

string ChooseCluster(HttpContext context) {

// Decide which cluster to use. This could be random, weighted, based on head- ers, etc.

return Random.Shared.Next(2) == 1 ? "cluster1" : "cluster2"; }

## Χρήση

Αυτό το σενάριο κάνει χρήση δύο API, του IProxyStateLookup και του ReassignProxyRequest, που καλούνται από ένα προσαρμοσμένο ενδιάμεσο λογισμικό διακομιστή μεσολάβησης, όπως φαίνεται στο παραπάνω παράδειγμα.

Το IProxyStateLookup είναι μια υπηρεσία διαθέσιμη στο container έγχυσης εξαρτήσεων (Dependency Injection) που μπορεί να χρησιμοποιηθεί για την αναζήτηση ή την απαρίθμηση των τρεχουσών διαδρομών και clusters. Σημειώστε ότι αυτά τα δεδομένα ενδέχεται να αλλάξουν αν αλλάξει η διαμόρφωση. Ένας αλγόριθμος ενορχήστρωσης A/B μπορεί να εξετάσει το αίτημα, να αποφασίσει σε ποιο cluster θα το στείλει, και στη συνέχεια να ανακτήσει αυτό το cluster από το IProxyStateLookup.TryGetCluster .

Μόλις επιλεγεί το cluster, μπορεί να κληθεί η ReassignProxyRequest για να αναθέσει το αίτημα σε αυτό το cluster. Αυτό ενημερώνει το IReverseProxyFeature με τις νέες πληροφορίες cluster και προορισμού που χρειάζονται ώστε το υπόλοιπο pipeline ενδιάμεσου λογισμικού του διακομιστή μεσολάβησης να διαχειριστεί το αίτημα.

## Συνάφεια συνεδρίας

:::note
ότι η λειτουργικότητα της συνάφειας συνεδρίας διαμοιράζεται μεταξύ του ενδιάμεσου λογισμικού, το οποίο διαβάζει τις ρυθμίσεις της από το τρέχον cluster, και των μετασχηματισμών, οι οποίοι αποτελούν μέρος της αρχικής διαδρομής. Τα clusters που χρησιμοποιούνται για δοκιμές A/B θα πρέπει να χρησιμοποιούν την ίδια διαμόρφωση συνάφειας συνεδρίας για να αποφεύγονται συγκρούσεις.
:::

:::note
Ο συγγραφέας δημιούργησε αυτό το άρθρο με τη βοήθεια AI. Μάθετε περισσότερα
:::
