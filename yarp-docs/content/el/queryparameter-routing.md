---
slug: queryparameter-routing
title: Δρομολόγηση βάσει παραμέτρων ερωτήματος
lede: >-
  Οι διαδρομές του διακομιστή μεσολάβησης που ορίζονται στη διαμόρφωση ή μέσω κώδικα πρέπει να
  περιλαμβάνουν τουλάχιστον ένα path ή έναν host προς αντιστοίχιση
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/queryparameter-routing
lastUpdated: 2026-08-11
---

## Δρομολόγηση βάσει παραμέτρων ερωτήματος στο YARP

Οι διαδρομές του διακομιστή μεσολάβησης που ορίζονται στη διαμόρφωση ή μέσω κώδικα πρέπει να περιλαμβάνουν τουλάχιστον ένα path ή έναν host προς αντιστοίχιση. Πέρα από αυτά, μια διαδρομή μπορεί επίσης να ορίσει μία ή περισσότερες παραμέτρους ερωτήματος που πρέπει να είναι παρούσες στο αίτημα.

## Προτεραιότητα

Η προεπιλεγμένη σειρά προτεραιότητας αντιστοίχισης διαδρομών είναι 1) path, 2) μέθοδος, 3) host, 4) κεφαλίδες, 5) παράμετροι ερωτήματος. Αυτό σημαίνει ότι μια διαδρομή που ορίζει μεθόδους αλλά όχι παραμέτρους ερωτήματος θα αντιστοιχιστεί πριν από μια διαδρομή που ορίζει παραμέτρους ερωτήματος αλλά όχι μεθόδους. Αυτό μπορεί να παρακαμφθεί ορίζοντας την ιδιότητα Order σε μια διαδρομή.

## Διαμόρφωση

Οι παράμετροι ερωτήματος ορίζονται στην ενότητα Match μιας διαδρομής μεσολάβησης.

Αν έχουν οριστεί πολλαπλοί κανόνες παραμέτρων ερωτήματος σε μια διαδρομή, τότε όλοι πρέπει να ταιριάξουν για να επιλεγεί η διαδρομή. Λογική OR πρέπει να υλοποιηθεί είτε μέσα σε έναν κανόνα παραμέτρου ερωτήματος είτε ως ξεχωριστές διαδρομές.

Διαμόρφωση:

```json
"Routes": {
   "route1" : {
      "ClusterId": "cluster1",
      "Match": {
         "Path": "{**catch-all}",
         "QueryParameters": [
             {
                "Name": "queryparam1",
                "Values": [ "value1" ],
                "Mode": "Exact"
             }
         ]
      }
   },
   "route2" : {
      "ClusterId": "cluster1",
      "Match": {
         "Path": "{**catch-all}",
         "QueryParameters": [
             {
                          "Name": "queryparam2",
                          "Values": [ "1prefix", "2prefix" ],
                          "Mode": "Prefix"
                      }
                   ]
}
},
"route3" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam3",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route4" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam4",
                          "Values": [ "value1", "value2" ],
                          "Mode": "Exact"
                      },
                      {
                          "Name": "queryparam5",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route5" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam5",
                          "Values": [ "value1", "value2" ],
                          "Mode": "Contains"
                      },
                      {
                          "Name": "queryparam6",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route6" : {
"ClusterId": "cluster1",
       "Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam6",
                          "Values": [ "value1", "value2" ],
                          "Mode": "NotContains"
                      },
                      {
                          "Name": "queryparam7",
                          "Mode": "Exists"
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
                   QueryParameters = new[]
                   {
                          new RouteQueryParameter()
                          {
                                 Name = "QueryParam1",
                                 Values = new[] { "value1" },
                                 Mode = QueryParameterMatchMode.Exact
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
                   QueryParameters = new[]
                   {
                          new RouteQueryParameter()
                          {
                                 Name = "QueryParam2",
                             Values = new[] { "1prefix", "2prefix" },
                             Mode = QueryParameterMatchMode.Prefix
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
                      QueryParameters = new[]
                      {
                         new RouteQueryParameter()
                         {
                             Name = "QueryParam3",
                             Mode = QueryParameterMatchMode.Exists
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
                      QueryParameters = new[]
                      {
                      new RouteQueryParameter()
                         {
                             Name = "QueryParam4",
                             Values = new[] { "value1", "value2" },
                             Mode = QueryParameterMatchMode.Exact
                         },
                         new RouteQueryParameter()
                         {
                             Name = "QueryParam5",
                             Mode = QueryParameterMatchMode.Exists
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
                      QueryParameters = new[]
                      {
                         new RouteQueryParameter()
                         {
                            Name = "QueryParam5",
                            Values = new[] { "value1", "value2" },
                            Mode = QueryParameterMatchMode.Contains
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
                      QueryParameters = new[]
                      {
                         new RouteQueryParameter()
                         {
                            Name = "QueryParam6",
                            Values = new[] { "value1", "value2" },
                            Mode = QueryParameterMatchMode.NotContains
                         }
                      }
                   }
    }
};
```

## Σύμβαση

Το RouteQueryParameter ορίζει τη σύμβαση κώδικα και αντιστοιχίζεται από τη διαμόρφωση.

## Name

Το όνομα της παραμέτρου ερωτήματος που αναζητείται στο αίτημα. Απαιτείται μια μη κενή τιμή. Αυτό το πεδίο δεν κάνει διάκριση πεζών-κεφαλαίων.

## Values

Μια λίστα πιθανών τιμών προς αναζήτηση. Η παράμετρος ερωτήματος πρέπει να ταιριάζει με τουλάχιστον μία από αυτές τις τιμές, σύμφωνα με το καθορισμένο Mode, με εξαίρεση το 'NotContains'. Απαιτείται τουλάχιστον μία τιμή, εκτός αν το Mode έχει οριστεί σε Exists.

## Mode

Το QueryParameterMatchMode καθορίζει τον τρόπο αντιστοίχισης της τιμής/τιμών με την παράμετρο

ερωτήματος του αιτήματος. Η προεπιλογή είναι Exact.

Exact - Η παράμετρος ερωτήματος πρέπει να ταιριάζει εξ ολοκλήρου, ανάλογα με την τιμή του IsCaseSensitive. Υποστηρίζονται μόνο μεμονωμένες παράμετροι ερωτήματος. Αν υπάρχουν πολλαπλές παράμετροι ερωτήματος με το ίδιο όνομα, η αντιστοίχιση αποτυγχάνει. Prefix - Η παράμετρος ερωτήματος πρέπει να ταιριάζει βάσει προθέματος, ανάλογα με την τιμή του IsCaseSensitive. Υποστηρίζονται μόνο μεμονωμένες παράμετροι ερωτήματος. Αν υπάρχουν πολλαπλές παράμετροι ερωτήματος με το ίδιο όνομα, η αντιστοίχιση αποτυγχάνει. Exists - Η παράμετρος ερωτήματος πρέπει να υπάρχει και να περιέχει οποιαδήποτε μη κενή τιμή. Contains - Η παράμετρος ερωτήματος πρέπει να περιέχει την τιμή για να υπάρξει αντιστοίχιση, ανάλογα με την τιμή του IsCaseSensitive. Υποστηρίζονται μόνο μεμονωμένες παράμετροι ερωτήματος. Αν υπάρχουν πολλαπλές παράμετροι ερωτήματος με το ίδιο όνομα, η αντιστοίχιση αποτυγχάνει. NotContains - Η παράμετρος ερωτήματος δεν πρέπει να περιέχει καμία από τις τιμές αντιστοίχισης, ανάλογα με την τιμή του IsCaseSensitive. Υποστηρίζονται μόνο μεμονωμένες παράμετροι ερωτήματος. Αν υπάρχουν πολλαπλές παράμετροι ερωτήματος με το ίδιο όνομα, η αντιστοίχιση αποτυγχάνει.

## IsCaseSensitive

Υποδεικνύει αν η αντιστοίχιση τιμών πρέπει να γίνεται με διάκριση ή χωρίς διάκριση πεζών-κεφαλαίων. Η προεπιλογή είναι false, δηλαδή χωρίς διάκριση.

## Encoding

Η συμβολοσειρά ερωτήματος του αιτήματος αναλύεται και αποκωδικοποιείται πριν από την αντιστοίχιση με τους κανόνες της διαδρομής.

"route8" : { "ClusterId": "cluster1", "Match": { "Path": "{**catch-all}", "QueryParameters": [ { "Name": "queryparam8", "Values": [ "another value" ], "Mode": "Exact" } ] }

Αντιστοιχίζεται σε

?queryparam8=another%20value

ή

?queryparam8=another+value

## Παραδείγματα

Αυτά τα παραδείγματα χρησιμοποιούν τη διαμόρφωση που ορίστηκε παραπάνω.

## Σενάριο 1 - Ακριβής αντιστοίχιση παραμέτρου ερωτήματος

Ένα αίτημα με την ακόλουθη παράμετρο ερωτήματος θα ταιριάξει με το route1.

?QueryParam1=Value1

Πολλαπλές παράμετροι ερωτήματος με το ίδιο όνομα δεν υποστηρίζονται προς το παρόν και δεν θα ταιριάξουν.

?QueryParam1=Value1&QueryParam1=Value2

## Σενάριο 2 - Πολλαπλές τιμές

Το route2 όρισε πολλαπλές τιμές προς αναζήτηση σε μια παράμετρο ερωτήματος ("1prefix", "2prefix"), οποιαδήποτε από τις τιμές είναι αποδεκτή. Όρισε επίσης το Mode ως Prefix, οπότε οποιαδήποτε παράμετρος ερωτήματος ξεκινά με αυτές τις τιμές είναι αποδεκτή. Οποιαδήποτε από τις ακόλουθες παραμέτρους ερωτήματος θα ταιριάξει με το route2.

?QueryParam2=1prefix

?QueryParam2=2prefix

?QueryParam2=1prefix-extra

?QueryParam2=2prefix-extra

Πολλαπλές παράμετροι ερωτήματος με το ίδιο όνομα δεν υποστηρίζονται προς το παρόν και δεν θα ταιριάξουν.

?QueryParam2=2prefix&QueryParam2=1prefix

## Σενάριο 3 - Exists

Το route3 απαιτεί μόνο η παράμετρος ερωτήματος "QueryParam3" να υπάρχει με οποιαδήποτε μη κενή τιμή. Το ακόλουθο είναι ένα παράδειγμα που θα ταιριάξει με το route3.

?QueryParam3=value

Μια κενή παράμετρος ερωτήματος δεν θα ταιριάξει.

?QueryParam3 ?QueryParam3=

Αυτή η λειτουργία υποστηρίζει παραμέτρους ερωτήματος με πολλαπλές τιμές και πολλαπλές παραμέτρους ερωτήματος με το ίδιο όνομα, αφού δεν εξετάζει το περιεχόμενο της παραμέτρου ερωτήματος. Το ακόλουθο θα ταιριάξει.

?QueryParam3=value1&QueryParam3=value2

## Σενάριο 4 - Πολλαπλές παράμετροι ερωτήματος

Το route4 απαιτεί τόσο το QueryParam4 όσο και το QueryParam5, καθένα να ταιριάζει σύμφωνα με το καθορισμένο Mode. Οι ακόλουθες παράμετροι ερωτήματος θα ταιριάξουν με το route4:

?QueryParam4=value1&QueryParam5=AnyValue

?QueryParam4=value2&QueryParam5=AnyValue

Οι παρακάτω δεν θα ταιριάξουν με το route4 επειδή τους λείπει μία από τις απαιτούμενες παραμέτρους ερωτήματος:

?QueryParam4=value2

?QueryParam5=AnyValue Σημείωση: Ο συγγραφέας δημιούργησε αυτό το άρθρο με τη βοήθεια AI. Μάθετε περισσότερα
