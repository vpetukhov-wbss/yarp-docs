---
slug: output-caching
title: Cache de saída
lede: >-
  O proxy reverso pode ser usado para armazenar em cache as respostas encaminhadas por proxy e
  atender requisições antes que elas sejam
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/output-caching
lastUpdated: 2026-08-11
---

## Introdução

O proxy reverso pode ser usado para armazenar em cache as respostas encaminhadas por proxy e atender requisições antes que elas sejam encaminhadas para os servidores de destino. Isso pode reduzir a carga nos servidores de destino, adicionar uma camada de proteção e garantir que políticas consistentes sejam implementadas em suas aplicações.

Esse recurso está disponível somente ao usar o .NET 7 ou posterior

## Padrões

Nenhum cache de saída é realizado, a menos que isso seja habilitado na configuração da rota ou da aplicação.

## Configuração

As políticas de Output Cache podem ser especificadas por rota por meio de RouteConfig.OutputCachePolicy e podem ser vinculadas a partir das seções Routes do arquivo de configuração. Assim como outras propriedades de rota, isso pode ser modificado e recarregado sem reiniciar o proxy. Os nomes das políticas não diferenciam maiúsculas de minúsculas.

Exemplo:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "OutputCachePolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
         }
      },
      "Clusters": {
         "cluster1": {
             "Destinations": {
                "cluster1/destination1": {
                   "Address": "https://localhost:10001/"
                }
             }
         }
      }
             }
          }
Output cache policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core output caching middleware.
Output cache policies can be configured in Program.cs as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddOutputCache(options =>
   {
          options.AddPolicy("customPolicy", builder =>
   builder.Expire(TimeSpan.FromSeconds(20)));
   });
Then add the output caching middleware:
    C#
   var app = builder.Build();
   app.UseOutputCache();
   app.MapReverseProxy();
See the Output Caching docs for setting up your preferred kind of output caching.
 Note: The author created this article with assistance from AI. Learn more
```
