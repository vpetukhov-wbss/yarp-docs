---
slug: getting-started
title: Primeiros passos com o YARP
lede: >-
  Adicione o YARP a um novo projeto ASP.NET Core e encaminhe todas as requisições para um único
  backend em poucas linhas de código.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/getting-started
lastUpdated: 2025-02-10
---

## Pré-requisitos

O SDK do .NET e um servidor de backend para o qual encaminhar as requisições - qualquer servidor HTTP serve para testes, incluindo outro aplicativo ASP.NET Core em execução localmente.

## Criando o projeto

Crie um projeto ASP.NET Core vazio e adicione o pacote `Yarp.ReverseProxy`:

:::example Criar e adicionar o pacote
A partir de uma pasta vazia.

```dotnetcli
dotnet new web -o MyProxy
cd MyProxy
dotnet add package Yarp.ReverseProxy
```
:::

## Configurando o proxy

Registre o proxy reverso e carregue sua configuração a partir do `appsettings.json`:

:::example Program.cs
Registra o proxy e mapeia suas rotas.

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
Veja [Arquivos de configuração](doc:config-files) para a forma completa do `appsettings.json` - uma rota e um cluster com pelo menos um destino.
:::

## Executando

Inicie o aplicativo com `dotnet run` e envie uma requisição para a URL do proxy - ele a encaminha para o destino configurado e retransmite a resposta de volta, sem alterações.
