---
slug: header-routing
title: Δρομολόγηση βάσει κεφαλίδων
lede: >-
  Οι διαδρομές του διακομιστή μεσολάβησης που ορίζονται στη διαμόρφωση ή μέσω κώδικα πρέπει να
  περιλαμβάνουν τουλάχιστον ένα path ή έναν host προς αντιστοίχιση
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-routing
lastUpdated: 2026-08-11
---

## Δρομολόγηση βάσει κεφαλίδων στο YARP

Οι διαδρομές του διακομιστή μεσολάβησης που ορίζονται στη διαμόρφωση ή μέσω κώδικα πρέπει να περιλαμβάνουν τουλάχιστον ένα path ή έναν host προς αντιστοίχιση. Πέρα από αυτά, μια διαδρομή μπορεί επίσης να ορίσει μία ή περισσότερες κεφαλίδες που πρέπει να είναι παρούσες στο αίτημα.

## Προτεραιότητα

Η προεπιλεγμένη σειρά προτεραιότητας αντιστοίχισης διαδρομών είναι

1. path
1. μέθοδος
1. host
1. κεφαλίδες
1. παράμετροι ερωτήματος

Αυτό σημαίνει ότι μια διαδρομή που ορίζει μεθόδους αλλά όχι κεφαλίδες θα αντιστοιχιστεί πριν από μια διαδρομή που ορίζει κεφαλίδες αλλά όχι μεθόδους. Αυτό μπορεί να παρακαμφθεί ορίζοντας την ιδιότητα Order σε μια διαδρομή (δείτε το παράδειγμα στις ιδιότητες διαμόρφωσης).

## Διαμόρφωση

Οι κεφαλίδες ορίζονται στην ενότητα Match μιας διαδρομής μεσολάβησης.

Αν έχουν οριστεί πολλαπλοί κανόνες κεφαλίδων σε μια διαδρομή, τότε όλοι πρέπει να ταιριάξουν για να επιλεγεί η διαδρομή. Λογική OR πρέπει να υλοποιηθεί είτε μέσα σε έναν κανόνα κεφαλίδας είτε ως ξεχωριστές διαδρομές.

Διαμόρφωση:

```json
"Routes": {
   "route1" : {
      "ClusterId": "cluster1",
      "Match": {
         "Path": "{**catch-all}",
         "Headers": [
             {
                "Name": "header1",
                "Values": [ "value1" ],
                "Mode": "ExactHeader"
             }
         ]
      }
},
"route2" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header2",
                          "Values": [ "1prefix", "2prefix" ],
                          "Mode": "HeaderPrefix"
                      }
                   ]
}
},
"route3" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header3",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route4" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header4",
                          "Values": [ "value1", "value2" ],
                          "Mode": "ExactHeader"
                      },
                      {
                          "Name": "header5",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route5" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header5",
                          "Values": [ "value1", "value2" ],
                          "Mode": "Contains"
                      },
                      {
                          "Name": "header6",
                          "Mode": "Exists"
                      }
                   ]
       }
    },
    "route6" : {
       "ClusterId": "cluster1",
       "Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header6",
                          "Values": [ "value1", "value2" ],
                          "Mode": "NotContains"
                      },
                      {
                          "Name": "header7",
                          "Mode": "Exists"
                      }
                   ]
       }
    },
    "route7" : {
       "ClusterId": "cluster1",
       "Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header7",
                          "Mode": "NotExists"
                      }
                   ]
       }
    }
}
Code:
```

```csharp
var routes = new[]
{
      new RouteConfig()
      {
             RouteId = "route1",
             ClusterId = "cluster1",
             Match = new RouteMatch
             {
                   Path = "{**catch-all}",
                   Headers = new[]
                   {
                          new RouteHeader()
                          {
                            Name = "Header1",
                            Values = new[] { "value1" },
                            Mode = HeaderMatchMode.ExactHeader
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route2",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header2",
                            Values = new[] { "1prefix", "2prefix" },
                            Mode = HeaderMatchMode.HeaderPrefix
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route3",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header3",
                            Mode = HeaderMatchMode.Exists
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route4",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header4",
                            Values = new[] { "value1", "value2" },
                             Mode = HeaderMatchMode.ExactHeader
                         },
                         new RouteHeader()
                         {
                             Name = "Header5",
                             Mode = HeaderMatchMode.Exists
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route5",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                             Name = "Header5",
                             Values = new[] { "value1", "value2" },
                             Mode = HeaderMatchMode.Contains
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route6",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                             Name = "Header6",
                             Values = new[] { "value1", "value2" },
                             Mode = HeaderMatchMode.NotContains
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route7",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header7",
                            Mode = HeaderMatchMode.NotExists
                         }
                      }
                   }
    }
};
```

## Σύμβαση

Το RouteHeader ορίζει τη σύμβαση κώδικα και αντιστοιχίζεται από τη διαμόρφωση.

## Name

Το όνομα της κεφαλίδας που αναζητείται στο αίτημα. Απαιτείται μια μη κενή τιμή. Αυτό το πεδίο δεν κάνει διάκριση πεζών-κεφαλαίων, σύμφωνα με τα RFC του HTTP.

## Values

Μια λίστα πιθανών τιμών προς αναζήτηση. Η κεφαλίδα πρέπει να ταιριάζει με τουλάχιστον μία από αυτές τις τιμές, σύμφωνα με το καθορισμένο Mode, με εξαίρεση το 'NotContains'. Απαιτείται τουλάχιστον μία τιμή, εκτός αν το Mode έχει οριστεί σε Exists ή NotExists.

## Mode

Το HeaderMatchMode καθορίζει τον τρόπο αντιστοίχισης της τιμής/τιμών με την κεφαλίδα του αιτήματος. Η προεπιλογή είναι ExactHeader.

ExactHeader - Οποιαδήποτε από τις κεφαλίδες με το δεδομένο όνομα πρέπει να ταιριάζει εξ ολοκλήρου, ανάλογα με την τιμή του IsCaseSensitive. Αν μια κεφαλίδα περιέχει πολλαπλές τιμές (χωρισμένες με , ή ;), αυτές διαχωρίζονται πριν από την αντιστοίχιση. Ένα μοναδικό ζεύγος εισαγωγικών αφαιρείται επίσης από την τιμή πριν από την αντιστοίχιση. HeaderPrefix - Οποιαδήποτε από τις κεφαλίδες με το δεδομένο όνομα πρέπει να ταιριάζει βάσει προθέματος, ανάλογα με την τιμή του IsCaseSensitive. Αν μια κεφαλίδα περιέχει πολλαπλές τιμές (χωρισμένες με , ή ;), αυτές διαχωρίζονται πριν από την αντιστοίχιση. Ένα μοναδικό ζεύγος εισαγωγικών αφαιρείται επίσης από την τιμή πριν από την αντιστοίχιση. Exists - Η κεφαλίδα πρέπει να υπάρχει και να περιέχει οποιαδήποτε μη κενή τιμή. Αν υπάρχουν πολλαπλές κεφαλίδες με το ίδιο όνομα, ο κανόνας θα ταιριάξει επίσης.

Contains - Οποιαδήποτε από τις κεφαλίδες με το δεδομένο όνομα πρέπει να περιέχει οποιαδήποτε από τις τιμές αντιστοίχισης,

ανάλογα με την τιμή του IsCaseSensitive.

NotContains - Καμία από τις κεφαλίδες με το δεδομένο όνομα δεν επιτρέπεται να περιέχει καμία από τις τιμές

αντιστοίχισης, ανάλογα με την τιμή του IsCaseSensitive.

## IsCaseSensitive

Υποδεικνύει αν η αντιστοίχιση τιμών πρέπει να γίνεται με διάκριση ή χωρίς διάκριση πεζών-κεφαλαίων. Η προεπιλογή είναι false, δηλαδή χωρίς διάκριση.

## Παραδείγματα

Αυτά τα παραδείγματα χρησιμοποιούν τη διαμόρφωση που ορίστηκε παραπάνω.

## Σενάριο 1 - Ακριβής αντιστοίχιση κεφαλίδας

Ένα αίτημα με την ακόλουθη κεφαλίδα θα ταιριάξει με το route1.

Header1: Value1

Αν μια κεφαλίδα περιέχει πολλαπλές τιμές, καθεμία θα αντιστοιχιστεί ξεχωριστά. Το ακόλουθο αίτημα θα ταιριάξει.

Header1: Value1, Value2

Το ίδιο ισχύει αν πολλαπλές τιμές διαμοιράζονται σε πολλαπλές κεφαλίδες με το ίδιο όνομα.

Header1: Value1 Header1: Value2

Ένα μοναδικό ζεύγος περικλειόμενων εισαγωγικών μπορεί να αφαιρεθεί από την τιμή πριν από την αντιστοίχιση. Το ακόλουθο αίτημα θα ταιριάξει.

Header1: "Value1"

Πολλαπλά ζεύγη εισαγωγικών δεν θα ταιριάξουν.

Header1: ""Value1""

## Σενάριο 2 - Πολλαπλές τιμές

Το route2 όρισε πολλαπλές τιμές προς αναζήτηση σε μια κεφαλίδα ("1prefix", "2prefix"), οποιαδήποτε από τις τιμές είναι αποδεκτή. Όρισε επίσης το Mode ως HeaderPrefix, οπότε οποιαδήποτε κεφαλίδα ξεκινά με αυτές τις τιμές είναι αποδεκτή. Οποιαδήποτε από τις ακόλουθες κεφαλίδες θα ταιριάξει με το route2.

Header2: 1prefix

Header2: 2prefix

Header2: 1prefix-extra

Header2: 2prefix-extra

Αν μια κεφαλίδα περιέχει πολλαπλές τιμές, καθεμία θα αντιστοιχιστεί ξεχωριστά. Το ακόλουθο αίτημα θα ταιριάξει.

Header2: foo, 1prefix, 2prefix

Το ίδιο ισχύει αν πολλαπλές τιμές διαμοιράζονται σε πολλαπλές κεφαλίδες με το ίδιο όνομα.

Header2: 1prefix Header2: 2prefix

Ένα μοναδικό ζεύγος περικλειόμενων εισαγωγικών μπορεί να αφαιρεθεί από την τιμή πριν από την αντιστοίχιση. Το ακόλουθο αίτημα θα ταιριάξει.

Header2: "2prefix"

Πολλαπλά ζεύγη εισαγωγικών δεν θα ταιριάξουν.

Header2: ""2prefix""

## Σενάριο 3 - Exists

Το route3 απαιτεί μόνο η κεφαλίδα "Header3" να υπάρχει με οποιαδήποτε μη κενή τιμή. Το ακόλουθο είναι ένα παράδειγμα που θα ταιριάξει με το route3.

Header3: value

Μια κενή κεφαλίδα δεν θα ταιριάξει.

Header3:

Αυτή η λειτουργία υποστηρίζει κεφαλίδες με πολλαπλές τιμές και πολλαπλές κεφαλίδες με το ίδιο όνομα, αφού δεν εξετάζει το περιεχόμενο της κεφαλίδας. Το ακόλουθο θα ταιριάξει.

Header3: value1, value2

Header3: value1 Header3: value2

Header3: Header3:

## Σενάριο 4 - Πολλαπλές κεφαλίδες

Το route4 απαιτεί τόσο την header4 όσο και την header5, καθεμία να ταιριάζει σύμφωνα με το καθορισμένο Mode. Οι ακόλουθες κεφαλίδες θα ταιριάξουν με το route4:

Header4: value1 Header5: AnyValue

Header4: value2 Header5: AnyValue

Οι παρακάτω δεν θα ταιριάξουν με το route4 επειδή τους λείπει μία από τις απαιτούμενες κεφαλίδες:

Header4: value2

Header5: AnyValue

## Σενάριο 5 - NotExists

Το route7 απαιτεί η κεφαλίδα "Header7" να μην υπάρχει. Οι ακόλουθες κεφαλίδες θα ταιριάξουν με το route7:

NotHeader7: AnyValue

Οι ακόλουθες κεφαλίδες δεν θα ταιριάξουν με το route7 επειδή η κεφαλίδα "Header7" υπάρχει.

Header7: AnyValue

Header7: Σημείωση: Ο συγγραφέας δημιούργησε αυτό το άρθρο με τη βοήθεια AI. Μάθετε περισσότερα
