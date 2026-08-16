---
slug: direct-forwarding
title: Encaminhamento direto
lede: >-
  Algumas aplicações precisam apenas da capacidade de pegar uma requisição específica e
  encaminhá-la para um destino
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/direct-forwarding
lastUpdated: 2026-08-11
---

Algumas aplicações precisam apenas da capacidade de pegar uma requisição específica e encaminhá-la para um destino específico. Essas aplicações não precisam dos outros recursos do proxy, como descoberta de configuração, roteamento, balanceamento de carga etc., ou já os resolveram de outras formas.

## IHttpForwarder

IHttpForwarder atua como o adaptador central de proxy entre as requisições AspNetCore de entrada e as requisições System.Net.Http de saída. Ele cuida da mecânica de criar um HttpRequestMessage a partir de um HttpContext, enviá-lo e repassar a resposta.

IHttpForwarder oferece suporte a:

Seleção dinâmica de destino, você especifica o destino para cada requisição Personalização do cliente HTTP, você fornece o HttpMessageInvoker Personalização de requisição e resposta (exceto corpos) Protocolos de streaming como gRPC e WebSockets Tratamento de erros

Ele não inclui:

Roteamento Balanceamento de carga Afinidade Novas tentativas

## Exemplo

Veja o ReverseProxy.Direct.Sample como um exemplo pré-construído, ou siga as etapas abaixo.

## Criar um novo projeto

Siga o guia de Primeiros passos para criar um projeto e adicionar a dependência nuget Yarp.ReverseProxy.

## Atualizar o Program.cs

Neste exemplo o IHttpForwarder é registrado na DI, injetado no método do endpoint e

usado para encaminhar requisições de uma rota específica para https://localhost:10000/prefix/ .

As transformações opcionais mostram como copiar todos os cabeçalhos da requisição, exceto o Host , já que é comum que o destino exija seu próprio Host a partir da URL.

```csharp
using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Yarp.ReverseProxy.Forwarder;
using Yarp.ReverseProxy.Transforms;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpForwarder();
var app = builder.Build();
// Configure our own HttpMessageInvoker for outbound calls for proxy operations
var httpClient = new HttpMessageInvoker(new SocketsHttpHandler
{
      UseProxy = false,
      AllowAutoRedirect = false,
      AutomaticDecompression = DecompressionMethods.None,
      UseCookies = false,
      EnableMultipleHttp2Connections = true,
      ActivityHeadersPropagator = new
ReverseProxyPropagator(DistributedContextPropagator.Current),
      ConnectTimeout = TimeSpan.FromSeconds(15),
});
// Setup our own request transform class
var transformer = new CustomTransformer(); // or HttpTransformer.Default;
var requestConfig = new ForwarderRequestConfig { ActivityTimeout =
TimeSpan.FromSeconds(100) };
app.UseRouting();
// When using IHttpForwarder for direct forwarding you are responsible for rout-
ing, destination discovery, load balancing, affinity, etc..
// For an alternate example that includes those features see BasicYarpSample.
app.Map("/test/{**catch-all}", async (HttpContext httpContext, IHttpForwarder for-
warder) =>
{
      var error = await forwarder.SendAsync(httpContext, "https://localhost:10000/",
                   httpClient, requestConfig, transformer);
```

## // Check if the operation was successful

if (error != ForwarderError.None)

{

var errorFeature = httpContext.GetForwarderErrorFeature();

var exception = errorFeature.Exception;

}

});

app.Run();

/// <summary> /// Custom request transformation /// </summary> internal class CustomTransformer : HttpTransformer {

/// <summary> /// A callback that is invoked prior to sending the proxied request. All HttpRequestMessage /// fields are initialized except RequestUri, which will be initialized after the /// callback if no value is provided. The string parameter represents the des- tination /// URI prefix that should be used when constructing the RequestUri. The head- ers /// are copied by the base implementation, excluding some protocol headers like HTTP/2 /// pseudo headers (":authority"). /// </summary> /// <param name="httpContext">The incoming request.</param> /// <param name="proxyRequest">The outgoing proxy request.</param> /// <param name="destinationPrefix">The uri prefix for the selected destina- tion server which can be used to create /// the RequestUri.</param> public override async ValueTask TransformRequestAsync(HttpContext httpContext, HttpRequestMessage proxyRequest, string destinationPrefix, CancellationToken can- cellationToken) {

// Copy all request headers await base.TransformRequestAsync(httpContext, proxyRequest, destination- Prefix, cancellationToken);

// Customize the query string: var queryContext = new QueryTransformContext(httpContext.Request); queryContext.Collection.Remove("param1"); queryContext.Collection["area"] = "xx2";

// Assign the custom uri. Be careful about extra slashes when concatenat- ing here. RequestUtilities.MakeDestinationAddress is a safe default.

proxyRequest.RequestUri = RequestUtilities.MakeDestinationAddress("https://example.com", httpContext.Request.Path, queryContext.QueryString);

// Suppress the original request header, use the one from the destination

Uri.

} proxyRequest.Headers.Host = null; }

Também existem métodos de extensão disponíveis que simplificam o mapeamento do IHttpForwarder para endpoints.

```csharp
   app.MapForwarder("/{**catch-all}", "https://localhost:10000/", requestConfig,
   transformer, httpClient);
```

## O cliente HTTP

O cliente HTTP pode ser personalizado, mas o exemplo acima é recomendado para cenários comuns de proxy. Sempre use HttpMessageInvoker em vez de HttpClient; o HttpClient armazena respostas em buffer por padrão. O buffering quebra cenários de streaming e aumenta o uso de memória e a latência. Reutilizar um cliente para requisições ao mesmo destino é recomendado por motivos de desempenho, pois permite reutilizar conexões do pool. Um cliente também pode ser reutilizado para requisições a destinos diferentes se a configuração for a mesma.

## Transformações

A requisição e a resposta podem ser modificadas fornecendo um HttpTransformer derivado como parâmetro para o método SendAsync.

## Tratamento de erros

IHttpForwarder captura exceções e tempos limite do cliente HTTP, registra-os em log e os converte em códigos de status 5xx ou aborta a resposta. Um código de erro é retornado por SendAsync , e os detalhes do erro podem ser acessados a partir do IForwarderErrorFeature, conforme mostrado acima.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
