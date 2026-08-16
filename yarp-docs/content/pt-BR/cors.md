---
slug: cors
title: Requisições entre origens (CORS)
lede: >-
  O proxy reverso pode tratar requisições entre origens antes que sejam encaminhadas para o
  destino
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/cors
lastUpdated: 2026-08-11
---

## Introdução

O proxy reverso pode tratar requisições entre origens antes que sejam encaminhadas para os servidores de destino. Isso pode reduzir a carga nos servidores de destino e garantir que políticas consistentes sejam implementadas em suas aplicações.

## Padrões

As requisições não serão automaticamente correspondidas para requisições de preflight do CORS, a menos que isso seja habilitado na configuração da rota ou da aplicação.

## Configuração

As políticas de CORS podem ser especificadas por rota por meio de RouteConfig.CorsPolicy e podem ser vinculadas a partir das seções Routes do arquivo de configuração. Assim como outras propriedades de rota, isso pode ser modificado e recarregado sem reiniciar o proxy. Os nomes das políticas não diferenciam maiúsculas de minúsculas.

Exemplo:

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "CorsPolicy": "customPolicy",
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
CORS policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides the
above configuration to specify a policy per route and the rest is handled by existing ASP.NET
Core CORS Middleware.
CORS policies can be configured in the application as follows:
   services.AddCors(options =>
   {
          options.AddPolicy("customPolicy", builder =>
          {
                 builder.AllowAnyOrigin();
          });
   });
Then add the CORS middleware.
   app.UseCors();
   app.MapReverseProxy();
```

## DefaultPolicy

Especificar o valor default no parâmetro CorsPolicy de uma rota significa que essa rota usará a política definida em CorsOptions.DefaultPolicy.

## Desabilitar o CORS

Especificar o valor disable no parâmetro CorsPolicy de uma rota significa que o middleware de CORS recusará as requisições de CORS.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
