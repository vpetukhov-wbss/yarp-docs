---
slug: rate-limiting
title: Limitação de taxa
lede: >-
  O proxy reverso pode ser usado para limitar a taxa de requisições antes que elas sejam
  encaminhadas ao destino
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/rate-limiting
lastUpdated: 2026-08-11
---

## Introdução

O proxy reverso pode ser usado para limitar a taxa de requisições antes que elas sejam encaminhadas aos servidores de destino. Isso pode reduzir a carga nos servidores de destino, adicionar uma camada de proteção e garantir que políticas consistentes sejam aplicadas em todas as suas aplicações.

Este recurso está disponível apenas ao usar o .NET 7 ou posterior

## Padrões

Nenhuma limitação de taxa é aplicada às requisições, a menos que seja habilitada na configuração da rota ou da aplicação. No entanto, o middleware de limitação de taxa ( app.UseRateLimiter() ) pode aplicar um limitador padrão a todas as rotas, e isso não exige nenhuma adesão explícita na configuração. Exemplo:

```csharp
   services.AddRateLimiter(options => options.GlobalLimiter = globalLimiter);
```

## Configuração

As políticas do RateLimiter podem ser especificadas por rota via RouteConfig.RateLimiterPolicy e podem ser vinculadas a partir das seções Routes do arquivo de configuração. Assim como outras propriedades de rota, isso pode ser modificado e recarregado sem reiniciar o proxy. Os nomes de política não diferenciam maiúsculas de minúsculas.

Exemplo:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "RateLimiterPolicy": "customPolicy",
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
RateLimiter policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core rate limiting middleware.
RateLimiter policies can be configured in services as follows:
```

```csharp
   services.AddRateLimiter(options =>
   {
          options.AddFixedWindowLimiter("customPolicy", opt =>
          {
                 opt.PermitLimit = 4;
                 opt.Window = TimeSpan.FromSeconds(12);
                 opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                 opt.QueueLimit = 2;
          });
   });
Then add the RateLimiter middleware.
    C#
   app.UseRateLimiter();
   app.MapReverseProxy();
See the Rate Limiting docs for setting up your preferred kind of rate limiting.
```

## Desabilitar a limitação de taxa

Especificar o valor disable no parâmetro RateLimiterPolicy de uma rota significa que o middleware de limitação de taxa não aplicará nenhuma política a essa rota, nem mesmo a política padrão.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
