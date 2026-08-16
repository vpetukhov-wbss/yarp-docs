---
slug: extensibility-transforms
title: Преобразования запросов и ответов
lede: >-
  При проксировании запроса нередко требуется изменить часть запроса или ответа, чтобы
  адаптировать их
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility-transforms
lastUpdated: 2026-08-11
---

## Преобразование запросов и ответов

## Расширяемость

## Введение

При проксировании запроса нередко требуется изменить часть запроса или ответа, чтобы адаптировать их к требованиям сервера назначения или передать дополнительные данные, например исходный IP-адрес клиента. Этот процесс реализуется с помощью преобразований (Transforms). Типы преобразований определяются глобально для приложения, а отдельные маршруты передают параметры, включающие и настраивающие эти преобразования. Такие преобразования не изменяют исходные объекты запроса — только проксируемые запросы.

YARP включает набор встроенных преобразований запросов и ответов, готовых к использованию. Дополнительные сведения см. в разделе YARP Request and Response Transforms. Если этих преобразований недостаточно, можно добавить пользовательские преобразования.

## RequestTransform

Все преобразования запросов должны наследоваться от абстрактного базового класса RequestTransform. Они могут свободно изменять проксируемый HttpRequestMessage . Избегайте чтения или изменения тела запроса, так как это может нарушить процесс проксирования. Также рекомендуется добавить параметризованный метод расширения для TransformBuilderContext, чтобы обеспечить обнаруживаемость и удобство использования.

Преобразование запроса может при определённых условиях сформировать немедленный ответ, например при ошибке. Это предотвращает выполнение оставшихся преобразований и проксирование запроса. Признаком этого служит установка HttpResponse.StatusCode в значение, отличное от 200, вызов HttpResponse.StartAsync() , либо запись в HttpResponse.Body или BodyWriter .

AddRequestTransform is a TransformBuilderContext extension method that defines a request transform as a Func<RequestTransformContext, ValueTask> . This allows creating a custom request transform without implementing a RequestTransform derived class.

## ResponseTransform

Все преобразования ответов должны наследоваться от абстрактного базового класса ResponseTransform. Они могут свободно изменять клиентский HttpResponse . Избегайте чтения или изменения тела ответа, так как

это может нарушить процесс проксирования. Также рекомендуется добавить параметризованный метод расширения для

TransformBuilderContext, чтобы обеспечить обнаруживаемость и удобство использования.

AddResponseTransform — это метод расширения TransformBuilderContext, который определяет преобразование ответа как Func<ResponseTransformContext, ValueTask> . Это позволяет создать пользовательское преобразование ответа без реализации производного класса ResponseTransform.

## ResponseTrailersTransform

Все преобразования трейлеров ответа должны наследоваться от абстрактного базового класса ResponseTrailersTransform. Они могут свободно изменять трейлеры клиентского HttpResponse. Они выполняются после тела ответа и не должны пытаться изменять заголовки или тело ответа. Также рекомендуется добавить параметризованный метод расширения для TransformBuilderContext, чтобы обеспечить обнаруживаемость и удобство использования.

AddResponseTrailersTransform — это метод расширения TransformBuilderContext, который определяет преобразование трейлеров ответа как Func<ResponseTrailersTransformContext, ValueTask> . Это позволяет создать пользовательское преобразование трейлеров ответа без реализации производного класса ResponseTrailersTransform.

## Преобразования тела запроса

YARP не предоставляет встроенных преобразований для изменения тела запроса. Однако тело можно изменить с помощью пользовательских преобразований.

Внимательно относитесь к тому, какие запросы изменяются, сколько данных буферизуется, к применению тайм-аутов, разбору ненадёжных входных данных и обновлению связанных с телом заголовков, таких как Content-Length .

В примере ниже для преобразования запросов используется простая, неэффективная буферизация. Более эффективная реализация оборачивала бы и заменяла HttpContext.Request.Body потоком, выполняющим необходимые изменения по мере проксирования данных от клиента к серверу. Это также потребовало бы удаления заголовка Content-Length, поскольку итоговая длина заранее не известна.

Этот пример требует YARP 1.1, см. https://github.com/microsoft/reverse-proxy/pull/1569 .

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

Пользовательские преобразования могут изменять тело запроса, только если оно уже присутствует. Они не могут добавить новое тело к запросу, у которого его нет (например, к запросу POST без тела или к запросу GET). Если необходимо добавить тело для определённого HTTP-метода и маршрута, это нужно делать в промежуточном ПО, выполняющемся перед YARP, а не в преобразовании.

В следующем примере промежуточного ПО показано, как добавить тело к запросу, у которого его нет:

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

## Преобразования тела ответа

YARP не предоставляет встроенных преобразований для изменения тела ответа. Однако тело можно изменить с помощью пользовательских преобразований.

Внимательно относитесь к тому, какие ответы изменяются, сколько данных буферизуется, к применению тайм-аутов, разбору ненадёжных входных данных и обновлению связанных с телом заголовков, таких как Content-Length . Может потребоваться распаковать содержимое перед изменением, если это указано заголовком Content-Encoding, а затем заново сжать его или удалить заголовок.

В примере ниже для преобразования ответов используется простая, неэффективная буферизация. Более эффективная реализация оборачивала бы поток, возвращаемый ReadAsStreamAsync(), потоком, выполняющим необходимые изменения по мере проксирования данных от клиента к серверу. Это также потребовало бы удаления заголовка Content-Length, поскольку итоговая длина заранее не известна.

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

ITransformProvider предоставляет функциональность AddTransforms, описанную выше, а также поддержку интеграции с DI и валидации.

Реализации ITransformProvider можно регистрировать в DI, вызывая AddTransforms. Можно зарегистрировать несколько реализаций ITransformProvider — все они будут выполнены.

У ITransformProvider есть два метода — Validate и Apply . Validate даёт возможность проверить маршрут на наличие параметров, необходимых для настройки преобразования, например пользовательских метаданных, и вернуть в контексте ошибки валидации, если нужные значения отсутствуют или недопустимы. Метод Apply предоставляет ту же функциональность, что и AddTransform, описанный выше, — добавление и настройку преобразований для каждого маршрута.

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

Разработчики, которые хотят интегрировать свои пользовательские преобразования с разделом Transforms

конфигурации, могут реализовать ITransformFactory. Его следует регистрировать в DI с помощью метода

AddTransformFactory<T>() . Можно зарегистрировать несколько фабрик — все они будут использованы.

ITransformFactory предоставляет два метода — Validate и Build . Они обрабатывают один набор значений преобразования за раз, представленный в виде IReadOnlyDictionary<string, string> .

Метод Validate вызывается при загрузке конфигурации, чтобы проверить содержимое и сообщить обо всех ошибках. Любые сообщённые ошибки предотвратят применение конфигурации.

Метод Build принимает заданную конфигурацию и создаёт соответствующие экземпляры преобразований для маршрута.

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
