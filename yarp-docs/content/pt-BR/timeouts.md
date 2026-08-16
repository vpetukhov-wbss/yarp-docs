---
slug: timeouts
title: Tempos limite de requisição
lede: >-
  O .NET 8 introduziu o Middleware de Tempos Limite de Requisição para permitir a configuração de
  tempos limite de requisição
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/timeouts
lastUpdated: 2026-08-11
---

## Introdução

O .NET 8 introduziu o Middleware de Tempos Limite de Requisição para permitir a configuração de tempos limite de requisição de forma global, bem como por endpoint. Essa funcionalidade também está disponível no YARP 2.1 ao executar no .NET 8 ou mais recente.

## Padrões

As requisições não têm nenhum tempo limite por padrão, além do Tempo Limite de Atividade usado para encerrar requisições ociosas. Uma política padrão especificada em RequestTimeoutOptions também será aplicada às requisições encaminhadas pelo proxy.

## Configuração

Tempos limite e Políticas de Tempo Limite podem ser especificados por rota via RouteConfig e podem ser vinculados a partir das seções Routes do arquivo de configuração. Assim como outras propriedades de rota, isso pode ser modificado e recarregado sem reiniciar o proxy. Os nomes de política não diferenciam maiúsculas de minúsculas.

Os tempos limite são especificados no formato TimeSpan (HH:MM:SS). Especificar tanto um Timeout quanto uma TimeoutPolicy na mesma rota é inválido e fará com que a configuração seja rejeitada.

:::note
que os tempos limite de requisição não se aplicam quando um depurador está anexado ao processo.
:::

Exemplo:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "TimeoutPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
         }
         "route2" : {
             "ClusterId": "cluster1",
             "Timeout": "00:01:00",
             "Match": {
                         "Hosts": [ "localhost2" ]
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
Timeout policies and the default policy can be configured in the service collection and the
middleware can be added as follows:
```

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.Services.AddReverseProxy()
          .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
   builder.Services.AddRequestTimeouts(options =>
   {
          options.AddPolicy("customPolicy", TimeSpan.FromSeconds(20));
   });
   var app = builder.Build();
   app.UseRequestTimeouts();
   app.MapReverseProxy();
   app.Run();
```

## Desabilitar tempos limite

Especificar o valor disable no parâmetro TimeoutPolicy de uma rota significa que o middleware de tempo limite de requisição não aplicará tempos limite a essa rota.

## WebSockets

Os tempos limite de requisição são desabilitados após a negociação inicial do handshake do WebSocket.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
