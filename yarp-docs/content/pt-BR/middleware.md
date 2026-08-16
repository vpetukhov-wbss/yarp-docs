---
slug: middleware
title: Middleware
lede: >-
  O ASP.NET Core usa um pipeline de middleware para dividir o processamento de requisições em
  etapas discretas. O
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/middleware
lastUpdated: 2026-08-11
---

## Introdução

O ASP.NET Core usa um pipeline de middleware para dividir o processamento de requisições em etapas discretas. O desenvolvedor da aplicação pode adicionar e ordenar middlewares conforme necessário. O middleware do ASP.NET Core também é usado para implementar e personalizar a funcionalidade do proxy reverso.

## Padrões

O exemplo de primeiros passos mostra o seguinte método Configure. Ele configura um pipeline de middleware com ferramentas de desenvolvimento, roteamento e os endpoints configurados do proxy ( MapReverseProxy ).

```csharp
         var builder = WebApplication.CreateBuilder(args);
         builder.Services.AddReverseProxy()
                .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
         var app = builder.Build();
         app.MapReverseProxy();
         app.Run();
The parameterless MapReverseProxy() in ReverseProxyIEndpointRouteBuilderExtensions
overload includes all standard proxy middleware for session affinity, load balancing, passive
health checks, and the final proxying of the request. Each of these check the configuration of
the matched route, cluster, and destination and perform their task accordingly.
```

## Adicionando middleware

O middleware adicionado ao pipeline da sua aplicação verá a requisição em diferentes estados de processamento, dependendo de onde o middleware for adicionado. O middleware adicionado antes de UseRouting verá todas as requisições e pode manipulá-las antes que qualquer roteamento ocorra. O middleware adicionado entre UseRouting e UseEndpoints pode chamar HttpContext.GetEndpoint() para verificar a qual endpoint o roteamento associou a requisição (se houver) e usar qualquer metadado associado a esse endpoint. É assim que Autenticação, Autorização e CORS são tratados.

ReverseProxyIEndpointRouteBuilderExtensions fornece uma sobrecarga de MapReverseProxy que permite criar um pipeline de middleware que será executado apenas para requisições correspondentes a rotas

configuradas do proxy.

app.MapReverseProxy(proxyPipeline => {

proxyPipeline.Use((context, next) => {

## // Custom inline middleware

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); proxyPipeline.UsePassiveHealthChecks(); });

Por padrão, essa sobrecarga de MapReverseProxy inclui apenas a configuração mínima, a lógica de encaminhamento e a aplicação de limites no início e no fim do seu pipeline. O middleware de afinidade de sessão, balanceamento de carga e verificações de integridade passivas não é incluído por padrão, para que você possa excluí-lo, substituí-lo ou controlar sua ordem com qualquer middleware adicional.

## Middleware de proxy personalizado

O middleware dentro do pipeline do MapReverseProxy tem acesso a todos os dados e ao estado do proxy associados a uma requisição (a rota, o cluster, os destinos etc.) por meio do IReverseProxyFeature. Isso está disponível em HttpContext.Features ou pelo método de extensão HttpContext.GetReverseProxyFeature() .

Os dados em IReverseProxyFeature são capturados (snapshot) a partir da configuração do proxy no início do pipeline de proxy e não serão afetados por alterações na configuração do proxy que ocorram enquanto a requisição está sendo processada.

```csharp
   proxyPipeline.Use((context, next) =>
   {
          var proxyFeature = context.GetReverseProxyFeature();
          var cluster = proxyFeature.Cluster;
          var destinations = proxyFeature.AvailableDestinations;
          return next();
   });
```

## O que fazer com o middleware

O middleware pode gerar logs, controlar se uma requisição é encaminhada ou não, influenciar para onde ela é encaminhada e adicionar funcionalidades adicionais, como tratamento de erros, novas tentativas etc.

## Logs e métricas

O middleware pode inspecionar campos da requisição e da resposta para gerar logs e agregar métricas. Veja a observação sobre corpos de mensagem em "O que não fazer com o middleware", abaixo.

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          LogRequest(context);
          await next();
          LogResponse(context);
   });
```

## Enviar uma resposta imediata

Se um middleware inspecionar uma requisição e determinar que ela não deve ser encaminhada, ele pode gerar sua própria resposta e devolver o controle ao servidor sem chamar next() .

```csharp
   proxyPipeline.Use((context, next) =>
   {
          if (!CheckAllowedRequest(context, out var reason))
          {
                 context.Response.StatusCode = StatusCodes.Status400BadRequest;
                 return context.Response.WriteAsync(reason);
          }
          return next();
   });
```

## Filtrar destinos

Middlewares como afinidade de sessão e balanceamento de carga examinam o IReverseProxyFeature e a configuração do cluster para decidir para qual destino uma requisição deve ser enviada. AllDestinations lista todos os destinos do cluster selecionado.

AvailableDestinations lista os destinos atualmente considerados elegíveis para atender a

requisição. Ele é inicializado com AllDestinations , excluindo os não íntegros caso as verificações de integridade estejam

habilitadas. AvailableDestinations deve ser reduzido a um único destino até o final do

pipeline, caso contrário um será selecionado aleatoriamente entre os restantes.

ProxiedDestination é definido pela lógica do proxy ao final do pipeline para indicar qual destino foi finalmente usado. Se não restarem destinos disponíveis, então uma resposta de erro 503 é enviada.

```csharp
proxyPipeline.Use(async (context, next) =>
{
      var proxyFeature = context.GetReverseProxyFeature();
      proxyFeature.AvailableDestinations =
Filter(proxyFeature.AvailableDestinations);
      await next();
      Report(proxyFeature.ProxiedDestination);
});
DestinationState implements IReadOnlyList<DestinationState> so a single destination can be
assigned to AvailableDestinations without creating a new list.
```

## Tratamento de erros

O middleware pode envolver a chamada a await next() em um bloco try/catch para tratar exceções de componentes posteriores.

A lógica de proxy no final do pipeline (IHttpForwarder) não lança exceções para erros comuns de encaminhamento de requisições. Esses erros são capturados e relatados em IForwarderErrorFeature, disponível em HttpContext.Features ou pelo método de extensão HttpContext.GetForwarderErrorFeature() .

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          await next();
          var errorFeature = context.GetForwarderErrorFeature();
          if (errorFeature is not null)
          {
                 Report(errorFeature.Error, errorFeature.Exception);
                 }
          });
If the response has not started ( HttpResponse.HasStarted ) it can be cleared
( HttpResponse.Clear() ) and an alternate response sent, or the proxy feature fields may be
reset and the request retried.
```

## O que não fazer com o middleware

O middleware deve ter cautela ao modificar campos da requisição, como cabeçalhos, para afetar a requisição de proxy de saída. Essas modificações podem interferir em funcionalidades como novas tentativas e podem ser mais bem tratadas por meio de transformações.

O middleware DEVE verificar HttpResponse.HasStarted antes de modificar campos da resposta após chamar next() . Se a resposta já tiver começado a ser enviada ao cliente, o middleware não poderá mais modificá-la (exceto talvez os Trailers). Transformações podem ser usadas para inspecionar e suprimir respostas indesejadas. Caso contrário, veja a observação a seguir.

O middleware deve evitar interagir com os corpos da requisição ou da resposta. Os corpos não são armazenados em buffer por padrão, portanto interagir com eles pode impedir que cheguem ao seu destino. Embora seja possível habilitar o buffering, isso é desaconselhado, pois pode adicionar sobrecarga significativa de memória e latência. Recomenda-se usar uma abordagem envolvida (wrapped) em streaming caso o corpo precise ser examinado ou modificado. Veja o middleware ResponseCompression como exemplo.

O middleware NÃO DEVE realizar nenhum trabalho multithread em uma requisição individual; o HttpContext e seus membros associados não são thread-safe.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
