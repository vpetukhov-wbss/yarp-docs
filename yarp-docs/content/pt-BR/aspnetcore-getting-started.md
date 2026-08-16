---
slug: aspnetcore-getting-started
title: Introdução ao ASP.NET Core
lede: >-
  Este tutorial mostra como criar e executar um aplicativo web ASP.NET Core usando a CLI do .NET.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/getting-started/
lastUpdated: 2026-08-11
---

Tutorial: Introdução ao ASP.NET Core

Este tutorial mostra como criar e executar um aplicativo web ASP.NET Core usando a CLI do .NET.

Para tutoriais do Blazor, consulte os tutoriais do ASP.NET Core Blazor.

Você aprenderá a: Criar um projeto de aplicativo web. Executar o aplicativo. Editar uma página Razor.

Ao final, você terá um aplicativo web funcional em execução na sua máquina local.

## Pré-requisitos

## SDK do .NET 8

## Criar um projeto de aplicativo web

Abra um shell de comando e insira o seguinte comando:

.NET CLI dotnet new webapp --output aspnetcoreapp --no-https

O comando anterior cria um novo projeto de aplicativo web em um diretório chamado aspnetcoreapp.

O projeto não usa HTTPS.

## Executar o aplicativo

Execute os seguintes comandos:

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

## Editar uma página Razor

Altere a página inicial:

No shell de comando, pressione Ctrl+C (Cmd+C no macOS) para sair do programa.

Abra Pages/Index.cshtml em um editor de texto.

Substitua a linha que começa com "Learn about" pela seguinte marcação e código realçados:

## CSHTML

@page @model IndexModel @{

ViewData["Title"] = "Home page"; }

<div class="text-center"> <h1 class="display-4">Welcome</h1> <p>Hello, world! The time on the server is @DateTime.Now</p>

## </div>

Salve as alterações. No shell de comando, execute o comando dotnet run novamente. No navegador, atualize a página e verifique se as alterações são exibidas.

## Próximas etapas

Neste tutorial, você aprendeu a:

Criar um projeto de aplicativo web. Executar o projeto. Fazer uma alteração.

Para saber mais sobre o ASP.NET Core, consulte o seguinte:

## Visão geral do ASP.NET Core
