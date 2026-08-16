---
slug: transforms
title: Visão geral
lede: >-
  Ao fazer proxy de uma requisição, é comum modificar partes da requisição ou da resposta para se
  adaptar a
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms
lastUpdated: 2026-08-11
---

## Transformações de requisição e resposta do YARP

## Introdução

Ao fazer proxy de uma requisição, é comum modificar partes da requisição ou da resposta para se adaptar aos requisitos do servidor de destino ou para propagar dados adicionais, como o endereço IP original do cliente. Esse processo é implementado por meio de Transforms (transformações). Os tipos de transformação são definidos globalmente para a aplicação e, em seguida, rotas individuais fornecem os parâmetros para habilitar e configurar essas transformações. Os objetos da requisição original não são modificados por essas transformações, apenas as requisições de proxy.

As transformações de corpo de requisição e resposta não são fornecidas pelo YARP, mas você pode escrever um middleware para fazer isso.

## Padrões

As seguintes transformações são habilitadas por padrão para todas as rotas. Elas podem ser configuradas ou desabilitadas conforme mostrado mais adiante neste documento.

Host - Suprime o cabeçalho Host da requisição de entrada. A requisição de proxy usará por padrão o nome de host especificado no endereço do servidor de destino. Veja RequestHeaderOriginalHost abaixo. X-Forwarded-For - Define o endereço IP do cliente no cabeçalho X-Forwarded-For. Veja X-Forwarded abaixo. X-Forwarded-Proto - Define o esquema original da requisição (http/https) no cabeçalho X-Forwarded-Proto. Veja X-Forwarded abaixo. X-Forwarded-Host - Define o Host original da requisição no cabeçalho X-Forwarded-Host. Veja X-Forwarded abaixo. X-Forwarded-Prefix - Define o PathBase original da requisição, se houver, no cabeçalho X-Forwarded-Prefix. Veja X-Forwarded abaixo.

Por exemplo, a seguinte requisição de entrada para http://IncomingHost:5000/path :

GET /path HTTP/1.1 Host: IncomingHost:5000 Accept: */* header1: foo

seria transformada e encaminhada por proxy para o servidor de destino https://DestinationHost:6000/ da

seguinte forma usando esses padrões:

GET /path HTTP/1.1 Host: DestinationHost:6000 Accept: */* header1: foo X-Forwarded-For: 5.5.5.5 X-Forwarded-Proto: http X-Forwarded-Host: IncomingHost:5000

## Categorias de transformação

As transformações se dividem em algumas categorias: Request (requisição), Response (resposta) e Response Trailers (trailers de resposta). Trailers de requisição não são suportados porque não são suportados pelo HttpClient subjacente.

Se o conjunto interno de transformações for insuficiente, transformações personalizadas podem ser adicionadas por meio de extensibilidade.

## Adicionando transformações

Transformações podem ser adicionadas a rotas por meio de configuração ou de forma programática.

## A partir da configuração

As transformações podem ser configuradas em RouteConfig.Transforms e podem ser vinculadas a partir das seções Routes do arquivo de configuração. Elas podem ser modificadas e recarregadas sem reiniciar o proxy. Uma transformação é configurada usando um ou mais pares de string chave-valor.

Aqui está um exemplo de transformações comuns:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Hosts": [ "localhost" ]
             },
             "Transforms": [
                { "PathPrefix": "/apis" },
                          {
                             "RequestHeader": "header1",
                             "Append": "bar"
                          },
                          {
                             "ResponseHeader": "header2",
                             "Append": "bar",
                             "When": "Always"
                          },
                          { "ClientCert": "X-Client-Cert" },
                          { "RequestHeadersCopy": "true" },
                          { "RequestHeaderOriginalHost": "true" },
                          {
                             "X-Forwarded": "Append",
                             "HeaderPrefix": "X-Forwarded-"
                          }
                      ]
                   },
                   "route2" : {
                      "ClusterId": "cluster1",
                      "Match": {
                          "Path": "/api/{plugin}/stuff/{**remainder}"
                      },
                      "Transforms": [
                          { "PathPattern": "/foo/{plugin}/bar/{**remainder}" },
                          {
                             "QueryValueParameter": "q",
                             "Append": "plugin"
                          }
                      ]
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                          "cluster1/destination1": {
                             "Address": "https://localhost:10001/Path/Base"
                          }
                      }
                   }
      }
   }
}
All configuration entries are treated as case-insensitive, though the destination server may
treat the resulting values as case sensitive or insensitive such as the path.
The details for these transforms are covered later in this document.
Developers that want to integrate their custom transforms with the Transforms section of
configuration can do so using ITransformFactory described below.
```

## A partir do código

Transformações podem ser adicionadas a rotas de forma programática chamando o método AddTransforms.

AddTransforms pode ser chamado após AddReverseProxy para fornecer um callback de configuração de transformações. Esse callback é invocado toda vez que uma rota é construída ou reconstruída e permite que o desenvolvedor inspecione as informações do RouteConfig e adicione transformações condicionalmente para ela.

O callback AddTransforms fornece um TransformBuilderContext onde transformações podem ser adicionadas ou configuradas. A maioria das transformações fornece métodos de extensão de TransformBuilderContext para facilitar sua adição. Essas extensões estão documentadas abaixo, junto com as descrições de cada transformação individual.

O TransformBuilderContext também inclui um IServiceProvider para acesso a quaisquer serviços necessários.

```csharp
services.AddReverseProxy()
      .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
      .AddTransforms(builderContext =>
      {
             // Added to all routes.
             builderContext.AddPathPrefix("/prefix");
             // Conditionally add a transform for routes that require auth.
             if (!string.IsNullOrEmpty(builderContext.Route.AuthorizationPolicy))
             {
                    builderContext.AddRequestTransform(async transformContext =>
                    {
                          transformContext.ProxyRequest.Headers.Add("CustomHeader",
"CustomValue");
                    });
             }
      });
For more advanced control see ITransformProvider described below.
 Note: The author created this article with assistance from AI. Learn more
```
