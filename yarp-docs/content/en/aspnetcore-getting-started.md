---
slug: aspnetcore-getting-started
title: Get started with ASP.NET Core
lede: >-
  This tutorial shows how to create and run an ASP.NET Core web app using the .NET CLI.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/getting-started/
lastUpdated: 2026-08-11
---

Tutorial: Get started with ASP.NET Core

This tutorial shows how to create and run an ASP.NET Core web app using the .NET CLI.

For Blazor tutorials, see ASP.NET Core Blazor tutorials.

You'll learn how to: Create a web app project. Run the app. Edit a Razor page.

At the end, you'll have a working web app running on your local machine.

## Prerequisites {#prerequisites}

## .NET 8 SDK {#net-8-sdk}

## Create a web app project {#create-a-web-app-project}

Open a command shell, and enter the following command:

.NET CLI dotnet new webapp --output aspnetcoreapp --no-https

The preceding command creates a new web app project in a directory named aspnetcoreapp .

The project doesn't use HTTPS.

## Run the app {#run-the-app}

Run the following commands:

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

## Edit a Razor page {#edit-a-razor-page}

Change the home page:

In the command shell, press Ctrl+C (Cmd+C in macOS) to exit the program.

Open Pages/Index.cshtml in a text editor.

Replace the line that begins with "Learn about" with the following highlighted markup and code:

## CSHTML {#cshtml}

@page @model IndexModel @{

ViewData["Title"] = "Home page"; }

<div class="text-center"> <h1 class="display-4">Welcome</h1> <p>Hello, world! The time on the server is @DateTime.Now</p>

## </div> {#div}

Save your changes. In the command shell run the dotnet run command again. In the browser, refresh the page and verify the changes are displayed.

## Next steps {#next-steps}

In this tutorial, you learned how to:

Create a web app project. Run the project. Make a change.

To learn more about ASP.NET Core, see the following:

## Overview of ASP.NET Core {#overview-of-asp-net-core}
