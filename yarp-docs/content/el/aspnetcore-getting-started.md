---
slug: aspnetcore-getting-started
title: Ξεκινώντας με το ASP.NET Core
lede: >-
  Αυτό το σεμινάριο δείχνει πώς να δημιουργήσετε και να εκτελέσετε μια εφαρμογή web ASP.NET Core
  χρησιμοποιώντας το .NET CLI.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/getting-started/
lastUpdated: 2026-08-11
---

Σεμινάριο: Ξεκινώντας με το ASP.NET Core

Αυτό το σεμινάριο δείχνει πώς να δημιουργήσετε και να εκτελέσετε μια εφαρμογή web ASP.NET Core χρησιμοποιώντας το .NET CLI.

Για σεμινάρια Blazor, δείτε τα σεμινάρια ASP.NET Core Blazor.

Θα μάθετε πώς να: Δημιουργήσετε ένα έργο εφαρμογής web. Εκτελέσετε την εφαρμογή. Επεξεργαστείτε μια σελίδα Razor.

Στο τέλος, θα έχετε μια λειτουργική εφαρμογή web που εκτελείται στον τοπικό σας υπολογιστή.

## Προαπαιτούμενα

## .NET 8 SDK

## Δημιουργία ενός έργου εφαρμογής web

Ανοίξτε ένα κέλυφος εντολών και εισαγάγετε την παρακάτω εντολή:

.NET CLI dotnet new webapp --output aspnetcoreapp --no-https

Η προηγούμενη εντολή δημιουργεί ένα νέο έργο εφαρμογής web σε έναν κατάλογο με το όνομα aspnetcoreapp .

Το έργο δεν χρησιμοποιεί HTTPS.

## Εκτέλεση της εφαρμογής

Εκτελέστε τις παρακάτω εντολές:

```dotnetcli
   cd aspnetcoreapp
   dotnet run
The run command produces output like the following example:
```

```output
   Building...
   info: Microsoft.Hosting.Lifetime[14]
             Now listening on: http://localhost:5109
   info: Microsoft.Hosting.Lifetime[0]
             Application started. Press Ctrl+C to shut down.
   info: Microsoft.Hosting.Lifetime[0]
             Hosting environment: Development
   info: Microsoft.Hosting.Lifetime[0]
             Content root path: C:\aspnetcoreapp
Open a browser and go to the URL shown in the output. In this example, the URL is
http://localhost:5109 .
The browser shows the home page.
```

## Επεξεργασία μιας σελίδας Razor

Αλλάξτε την αρχική σελίδα:

Στο κέλυφος εντολών, πατήστε Ctrl+C (Cmd+C σε macOS) για να τερματίσετε το πρόγραμμα.

Ανοίξτε το Pages/Index.cshtml σε έναν επεξεργαστή κειμένου.

Αντικαταστήστε τη γραμμή που ξεκινά με "Learn about" με την παρακάτω επισημασμένη σήμανση (markup) και κώδικα:

## CSHTML

@page @model IndexModel @{

ViewData["Title"] = "Home page"; }

<div class="text-center"> <h1 class="display-4">Welcome</h1> <p>Hello, world! The time on the server is @DateTime.Now</p>

## </div>

Αποθηκεύστε τις αλλαγές σας. Στο κέλυφος εντολών, εκτελέστε ξανά την εντολή dotnet run. Στο πρόγραμμα περιήγησης, ανανεώστε τη σελίδα και επαληθεύστε ότι εμφανίζονται οι αλλαγές.

## Επόμενα βήματα

Σε αυτό το σεμινάριο, μάθατε πώς να:

Δημιουργήσετε ένα έργο εφαρμογής web. Εκτελέσετε το έργο. Κάνετε μια αλλαγή.

Για να μάθετε περισσότερα σχετικά με το ASP.NET Core, δείτε τα παρακάτω:

## Επισκόπηση του ASP.NET Core
