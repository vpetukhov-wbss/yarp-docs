---
slug: extensibility-transforms
title: Transformações de requisição e resposta
lede: >-
  Ao encaminhar uma requisição, é comum modificar partes da requisição ou da resposta para se
  adequar a
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility-transforms
lastUpdated: 2026-08-11
---

## Transformação de requisição e resposta

## Extensibilidade

## Introdução

Ao encaminhar uma requisição, é comum modificar partes da requisição ou da resposta para se adequar aos requisitos do servidor de destino ou para propagar dados adicionais, como o endereço IP original do cliente. Esse processo é implementado por meio de Transformações (Transforms). Os tipos de transformação são definidos globalmente para a aplicação, e cada rota individual fornece os parâmetros para habilitar e configurar essas transformações. Os objetos de requisição originais não são modificados por essas transformações, apenas as requisições de proxy.

O YARP inclui um conjunto de transformações de requisição e resposta integradas que podem ser usadas. Para mais informações, consulte YARP Request and Response Transforms. Se essas transformações não forem suficientes, transformações personalizadas podem ser adicionadas.

## RequestTransform

Todas as transformações de requisição devem derivar da classe base abstrata RequestTransform. Elas podem modificar livremente o HttpRequestMessage do proxy. Evite ler ou modificar o corpo da requisição, pois isso pode atrapalhar o fluxo de encaminhamento. Considere também adicionar um método de extensão parametrizado em TransformBuilderContext para facilitar a descoberta e o uso.

Uma transformação de requisição pode, condicionalmente, produzir uma resposta imediata, como em condições de erro. Isso impede que as demais transformações sejam executadas e que a requisição seja encaminhada. Isso é indicado definindo o HttpResponse.StatusCode com um valor diferente de 200, chamando HttpResponse.StartAsync() , ou escrevendo em HttpResponse.Body ou BodyWriter .

AddRequestTransform é um método de extensão de TransformBuilderContext que define uma transformação de requisição como um Func<RequestTransformContext, ValueTask> . Isso permite criar uma transformação de requisição personalizada sem implementar uma classe derivada de RequestTransform.

## ResponseTransform

Todas as transformações de resposta devem derivar da classe base abstrata ResponseTransform. Elas podem modificar livremente o HttpResponse do cliente. Evite ler ou modificar o corpo da resposta, pois

isso pode atrapalhar o fluxo de encaminhamento. Considere também adicionar um método de extensão parametrizado em

TransformBuilderContext para facilitar a descoberta e o uso.

AddResponseTransform é um método de extensão de TransformBuilderContext que define uma transformação de resposta como um Func<ResponseTransformContext, ValueTask> . Isso permite criar uma transformação de resposta personalizada sem implementar uma classe derivada de ResponseTransform.

## ResponseTrailersTransform

Todas as transformações de trailers de resposta devem derivar da classe base abstrata ResponseTrailersTransform. Elas podem modificar livremente os trailers do HttpResponse do cliente. Elas são executadas após o corpo da resposta e não devem tentar modificar os cabeçalhos ou o corpo da resposta. Considere também adicionar um método de extensão parametrizado em TransformBuilderContext para facilitar a descoberta e o uso.

AddResponseTrailersTransform é um método de extensão de TransformBuilderContext que define uma transformação de trailers de resposta como um Func<ResponseTrailersTransformContext, ValueTask> . Isso permite criar uma transformação de trailers de resposta personalizada sem implementar uma classe derivada de ResponseTrailersTransform.

## Transformações do corpo da requisição

O YARP não fornece nenhuma transformação integrada para modificar o corpo da requisição. No entanto, o corpo pode ser modificado por transformações personalizadas.

Tenha cuidado com quais tipos de requisições são modificadas, quanto dado é armazenado em buffer, a aplicação de tempos limite, a análise de entradas não confiáveis e a atualização dos cabeçalhos relacionados ao corpo, como Content-Length .

O exemplo abaixo usa um buffering simples e ineficiente para transformar as requisições. Uma implementação mais eficiente envolveria e substituiria o HttpContext.Request.Body por um stream que realizasse as modificações necessárias à medida que os dados fossem encaminhados do cliente para o servidor. Isso também exigiria a remoção do cabeçalho Content-Length, já que o comprimento final não seria conhecido com antecedência.

Este exemplo requer o YARP 1.1, veja https://github.com/microsoft/reverse-proxy/pull/1569 .

```csharp
.AddTransforms(context =>
{
      context.AddRequestTransform(async requestContext =>
      {
             using var reader =
                      new StreamReader(requestContext.HttpContext.Request.Body);
                   // TODO: size limits, timeouts
                   var body = await reader.ReadToEndAsync();
                   if (!string.IsNullOrEmpty(body))
                   {
                      body = body.Replace("Alpha", "Charlie");
                      var bytes = Encoding.UTF8.GetBytes(body);
                      // Change Content-Length to match the modified body, or remove it
                      requestContext.HttpContext.Request.Body = new MemoryStream(bytes);
                      // Request headers are copied before transforms are invoked, update
```

## any

## // needed headers on the ProxyRequest

requestContext.ProxyRequest.Content.Headers.ContentLength =

bytes.Length;

}

});

});

Transformações personalizadas só podem modificar o corpo de uma requisição se ele já estiver presente. Elas não podem adicionar um novo corpo a uma requisição que não possui um (por exemplo, uma requisição POST sem corpo ou uma requisição GET). Se você precisar adicionar um corpo para um método HTTP e uma rota específicos, deve fazê-lo em um middleware executado antes do YARP, não em uma transformação.

O middleware a seguir demonstra como adicionar um corpo a uma requisição que não possui um:

```csharp
public class AddRequestBodyMiddleware
{
      private readonly RequestDelegate _next;
     public AddRequestBodyMiddleware(RequestDelegate next)
     {
           _next = next;
     }
     public async Task InvokeAsync(HttpContext context)
     {
           // Only modify specific route and method
           if (context.Request.Method == HttpMethods.Get &&
                  context.Request.Path == "/special-route")
           {
                  var bodyContent = "key=value";
                  var bodyBytes = Encoding.UTF8.GetBytes(bodyContent);
                      // Create a new request body
                      context.Request.Body = new MemoryStream(bodyBytes);
                      context.Request.ContentLength = bodyBytes.Length;
                      // Replace IHttpRequestBodyDetectionFeature so YARP knows
                      // a body is present
                      context.Features.Set<IHttpRequestBodyDetectionFeature>(
                      new CustomBodyDetectionFeature());
                   }
          await _next(context);
    }
      // Helper class to indicate the request can have a body
      private class CustomBodyDetectionFeature : IHttpRequestBodyDetectionFeature
      {
             public bool CanHaveBody => true;
      }
}
 Note
You can use context.GetRouteModel().Config.RouteId in middleware to conditionally
apply this logic for specific YARP routes.
```

## Transformações do corpo da resposta

O YARP não fornece nenhuma transformação integrada para modificar o corpo da resposta. No entanto, o corpo pode ser modificado por transformações personalizadas.

Tenha cuidado com quais tipos de respostas são modificadas, quanto dado é armazenado em buffer, a aplicação de tempos limite, a análise de entradas não confiáveis e a atualização dos cabeçalhos relacionados ao corpo, como Content-Length . Pode ser necessário descomprimir o conteúdo antes de modificá-lo, conforme indicado pelo cabeçalho Content-Encoding, e depois recomprimi-lo ou remover o cabeçalho.

O exemplo abaixo usa um buffering simples e ineficiente para transformar as respostas. Uma implementação mais eficiente envolveria o stream retornado por ReadAsStreamAsync() com um stream que realizasse as modificações necessárias à medida que os dados fossem encaminhados do cliente para o servidor. Isso também exigiria a remoção do cabeçalho Content-Length, já que o comprimento final não seria conhecido com antecedência.

```csharp
.AddTransforms(context =>
{
      context.AddResponseTransform(async responseContext =>
      {
             var stream =
                   await responseContext.ProxyResponse.Content.ReadAsStreamAsync();
             using var reader = new StreamReader(stream);
             // TODO: size limits, timeouts
                   var body = await reader.ReadToEndAsync();
                   if (!string.IsNullOrEmpty(body))
                   {
                         responseContext.SuppressResponseBody = true;
                   body = body.Replace("Bravo", "Charlie");
                   var bytes = Encoding.UTF8.GetBytes(body);
                   // Change Content-Length to match the modified body, or remove it
                   responseContext.HttpContext.Response.ContentLength = bytes.Length;
                   // Response headers are copied before transforms are invoked, update
                   // any needed headers on the HttpContext.Response
                   await responseContext.HttpContext.Response.Body.WriteAsync(bytes);
             }
      });
});
```

## ITransformProvider

ITransformProvider fornece a funcionalidade de AddTransforms descrita acima, além de integração com DI e suporte a validação.

Instâncias de ITransformProvider podem ser registradas na DI chamando AddTransforms. Múltiplas implementações de ITransformProvider podem ser registradas, e todas serão executadas.

ITransformProvider tem dois métodos, Validate e Apply . Validate oferece a oportunidade de inspecionar a rota em busca de quaisquer parâmetros necessários para configurar uma transformação, como metadados personalizados, e de retornar erros de validação no contexto caso algum valor necessário esteja ausente ou inválido. O método Apply oferece a mesma funcionalidade de AddTransform discutida acima, adicionando e configurando transformações por rota.

```csharp
   services.AddReverseProxy()
          .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
          .AddTransforms<MyTransformProvider>();
```

```csharp
internal class MyTransformProvider : ITransformProvider
{
      public void ValidateRoute(TransformRouteValidationContext context)
      {
             // Check all routes for a custom property and validate the associated
             // transform data
             if (context.Route.Metadata?.TryGetValue("CustomMetadata", out var value)
??
                      false)
                   {
                      if (string.IsNullOrEmpty(value))
                      {
                         context.Errors.Add(new ArgumentException(
                              "A non-empty CustomMetadata value is required"));
                      }
                   }
}
public void ValidateCluster(TransformClusterValidationContext context)
{
      // Check all clusters for a custom property and validate the associated
      // transform data.
      if (context.Cluster.Metadata?.TryGetValue("CustomMetadata", out var value)
             ?? false)
      {
             if (string.IsNullOrEmpty(value))
             {
                   context.Errors.Add(new ArgumentException(
                          "A non-empty CustomMetadata value is required"));
             }
      }
}
      public void Apply(TransformBuilderContext transformBuildContext)
      {
             // Check all routes for a custom property and add the associated trans-
form.
             if ((transformBuildContext.Route.Metadata?.TryGetValue("CustomMetadata",
                   out var value) ?? false)
                   || (transformBuildContext.Cluster?.Metadata?.TryGetValue(
                   "CustomMetadata", out value) ?? false))
             {
                   if (string.IsNullOrEmpty(value))
                   {
                          throw new ArgumentException(
                                 "A non-empty CustomMetadata value is required");
                   }
                      transformBuildContext.AddRequestTransform(transformContext =>
                      {
                            transformContext.ProxyRequest.Options.Set(
                                   new HttpRequestOptionsKey<string>("CustomMetadata"), value);
                          return default;
                   });
             }
      }
}
```

## ITransformFactory

Desenvolvedores que desejam integrar suas transformações personalizadas à seção Transforms da

configuração podem implementar um ITransformFactory. Ele deve ser registrado na DI usando o

método AddTransformFactory<T>() . Múltiplas factories podem ser registradas, e todas serão usadas.

ITransformFactory fornece dois métodos, Validate e Build . Eles processam um conjunto de valores de transformação por vez, representado por um IReadOnlyDictionary<string, string> .

O método Validate é chamado ao carregar uma configuração para verificar o conteúdo e reportar todos os erros. Quaisquer erros reportados impedirão que a configuração seja aplicada.

O método Build recebe a configuração fornecida e produz as instâncias de transformação associadas para a rota.

```csharp
services.AddReverseProxy()
      .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
      .AddTransformFactory<MyTransformFactory>();
```

```csharp
internal class MyTransformFactory : ITransformFactory
{
      public bool Validate(TransformRouteValidationContext context,
             IReadOnlyDictionary<string, string> transformValues)
      {
             if (transformValues.TryGetValue("CustomTransform", out var value))
             {
                   if (string.IsNullOrEmpty(value))
                   {
                          context.Errors.Add(new ArgumentException(
                                 "A non-empty CustomTransform value is required"));
                   }
                         return true; // Matched
                   }
          return false;
    }
    public bool Build(TransformBuilderContext context,
          IReadOnlyDictionary<string, string> transformValues)
    {
          if (transformValues.TryGetValue("CustomTransform", out var value))
          {
                 if (string.IsNullOrEmpty(value))
                 {
                       throw new ArgumentException(
                              "A non-empty CustomTransform value is required");
                 }
                   context.AddRequestTransform(transformContext =>
                   {
                         transformContext.ProxyRequest.Options.Set(
                                new HttpRequestOptionsKey<string>("CustomTransform"), value);
                         return default;
                   });
                         return true;
                   }
             return false;
      }
}
Validate and Build return true if they've identified the given transform configuration as one
that they own. A ITransformFactory may implement multiple transforms. Any
RouteConfig.Transforms entries not handled by any ITransformFactory will be considered
configuration errors and prevent the configuration from being applied.
Consider also adding parametrized extension methods on RouteConfig like
WithTransformQueryValue to facilitate programmatic route construction.
```

```csharp
   public static RouteConfig WithTransformQueryValue(this RouteConfig routeConfig,
          string queryKey, string value, bool append = true)
   {
          var type = append ? QueryTransformFactory.AppendKey :
                 QueryTransformFactory.SetKey;
          return routeConfig.WithTransform(transform =>
          {
                 transform[QueryTransformFactory.QueryValueParameterKey] = queryKey;
                 transform[type] = value;
          });
   }
 Note: The author created this article with assistance from AI. Learn more
```
