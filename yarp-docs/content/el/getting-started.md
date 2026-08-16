---
slug: getting-started
title: Ξεκινώντας με το YARP
lede: >-
  Προσθέστε το YARP σε ένα νέο έργο ASP.NET Core και προωθήστε κάθε αίτημα σε ένα μοναδικό backend
  με λίγες γραμμές κώδικα.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/getting-started
lastUpdated: 2025-02-10
---

## Προαπαιτούμενα

Το .NET SDK, και έναν διακομιστή backend προς τον οποίο θα προωθούνται τα αιτήματα - οποιοσδήποτε διακομιστής HTTP αρκεί για δοκιμές, συμπεριλαμβανομένης μιας άλλης εφαρμογής ASP.NET Core που εκτελείται τοπικά.

## Δημιουργία του έργου

Δημιουργήστε ένα κενό έργο ASP.NET Core και προσθέστε το πακέτο `Yarp.ReverseProxy`:

:::example Δημιουργία και προσθήκη του πακέτου
Από έναν κενό φάκελο.

```dotnetcli
dotnet new web -o MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```
:::

## Διαμόρφωση του διακομιστή μεσολάβησης

Καταχωρίστε τον αντίστροφο διακομιστή μεσολάβησης και φορτώστε τη διαμόρφωσή του από το `appsettings.json`:

:::example Program.cs
Καταχωρεί τον διακομιστή μεσολάβησης και αντιστοιχίζει τις διαδρομές του.

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```
:::

:::note
Δείτε [Αρχεία διαμόρφωσης](doc:config-files) για την πλήρη μορφή του `appsettings.json` - μια διαδρομή και ένα cluster με τουλάχιστον έναν προορισμό.
:::

## Εκτέλεσή του

Ξεκινήστε την εφαρμογή με `dotnet run` και στείλτε ένα αίτημα στο URL του διακομιστή μεσολάβησης - αυτό το προωθεί στον διαμορφωμένο προορισμό σας και αναμεταδίδει την απόκριση πίσω, αμετάβλητη.
