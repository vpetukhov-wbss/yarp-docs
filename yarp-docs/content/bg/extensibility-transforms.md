---
slug: extensibility-transforms
title: Трансформации на заявки и отговори
lede: >-
  При проксиране на заявка е обичайно да се променят части от заявката или отговора, за да се
  адаптират към
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility-transforms
lastUpdated: 2026-08-11
---

## Трансформация на заявки и отговори

## Разширяемост

## Въведение

При проксиране на заявка е обичайно да се променят части от заявката или отговора, за да се адаптират към изискванията на целевия сървър или за да се предаде допълнителна информация, като оригиналния IP адрес на клиента. Този процес се реализира чрез трансформации (Transforms). Видовете трансформации се дефинират глобално за приложението, а отделните маршрути предоставят параметрите за активиране и конфигуриране на тези трансформации. Оригиналните обекти на заявката не се променят от тези трансформации — само прокси заявките.

YARP включва набор от вградени трансформации на заявки и отговори, които могат да се използват. За повече информация вижте YARP Request and Response Transforms. Ако тези трансформации не са достатъчни, могат да бъдат добавени персонализирани трансформации.

## RequestTransform

Всички трансформации на заявки трябва да наследяват абстрактния базов клас RequestTransform. Те могат свободно да променят прокси HttpRequestMessage . Избягвайте четенето или промяната на тялото на заявката, тъй като това може да наруши потока на проксиране. Обмислете и добавянето на параметризиран разширяващ метод на TransformBuilderContext за по-лесно откриване и използване.

Трансформация на заявка може условно да генерира незабавен отговор, например при условия за грешка. Това предотвратява изпълнението на всички останали трансформации и проксирането на заявката. Това се обозначава чрез задаване на HttpResponse.StatusCode на стойност, различна от 200, чрез извикване на HttpResponse.StartAsync() , или чрез запис в HttpResponse.Body или BodyWriter .

AddRequestTransform е разширяващ метод на TransformBuilderContext, който дефинира трансформация на заявка като Func<RequestTransformContext, ValueTask> . Това позволява създаването на персонализирана трансформация на заявка без да се реализира клас, наследен от RequestTransform.

## ResponseTransform

Всички трансформации на отговори трябва да наследяват абстрактния базов клас ResponseTransform. Те могат свободно да променят клиентския HttpResponse . Избягвайте четенето или промяната на тялото на отговора, тъй като

това може да наруши потока на проксиране. Обмислете и добавянето на параметризиран разширяващ метод на

TransformBuilderContext за по-лесно откриване и използване.

AddResponseTransform е разширяващ метод на TransformBuilderContext, който дефинира трансформация на отговор като Func<ResponseTransformContext, ValueTask> . Това позволява създаването на персонализирана трансформация на отговор без да се реализира клас, наследен от ResponseTransform.

## ResponseTrailersTransform

Всички трансформации на трейлъри на отговори трябва да наследяват абстрактния базов клас ResponseTrailersTransform. Те могат свободно да променят трейлърите на клиентския HttpResponse. Те се изпълняват след тялото на отговора и не трябва да се опитват да променят заглавните части или тялото на отговора. Обмислете и добавянето на параметризиран разширяващ метод на TransformBuilderContext за по-лесно откриване и използване.

AddResponseTrailersTransform е разширяващ метод на TransformBuilderContext, който дефинира трансформация на трейлъри на отговор като Func<ResponseTrailersTransformContext, ValueTask> . Това позволява създаването на персонализирана трансформация на трейлъри на отговор без да се реализира клас, наследен от ResponseTrailersTransform.

## Трансформации на тялото на заявката

YARP не предоставя вградени трансформации за промяна на тялото на заявката. Въпреки това тялото може да бъде променяно чрез персонализирани трансформации.

Внимавайте кои видове заявки се променят, колко данни се буферират, налагането на таймаути, анализирането на ненадежден вход и актуализирането на свързаните с тялото заглавни части, като Content-Length .

Примерът по-долу използва просто, неефективно буфериране за трансформиране на заявки. По-ефективна реализация би обвила и заменила HttpContext.Request.Body с поток (stream), който извършва необходимите промени, докато данните се проксират от клиента към сървъра. Това би изисквало и премахването на заглавната част Content-Length, тъй като крайната дължина не би била известна предварително.

Този пример изисква YARP 1.1, вижте https://github.com/microsoft/reverse-proxy/pull/1569 .

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

Персонализираните трансформации могат да променят тялото на заявката само ако то вече съществува. Те не могат да добавят ново тяло към заявка, която няма такова (например POST заявка без тяло или GET заявка). Ако трябва да добавите тяло за конкретен HTTP метод и маршрут, трябва да направите това в междинен софтуер, който се изпълнява преди YARP, а не в трансформация.

Следният междинен софтуер демонстрира как да добавите тяло към заявка, която няма такова:

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

## Трансформации на тялото на отговора

YARP не предоставя вградени трансформации за промяна на тялото на отговора. Въпреки това тялото може да бъде променяно чрез персонализирани трансформации.

Внимавайте кои видове отговори се променят, колко данни се буферират, налагането на таймаути, анализирането на ненадежден вход и актуализирането на свързаните с тялото заглавни части, като Content-Length . Може да се наложи да декомпресирате съдържанието, преди да го промените, съгласно указаното от заглавната част Content-Encoding, а след това да го компресирате отново или да премахнете заглавната част.

Примерът по-долу използва просто, неефективно буфериране за трансформиране на отговори. По-ефективна реализация би обвила потока, върнат от ReadAsStreamAsync(), с поток, който извършва необходимите промени, докато данните се проксират от клиента към сървъра. Това би изисквало и премахването на заглавната част Content-Length, тъй като крайната дължина не би била известна предварително.

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

ITransformProvider предоставя функционалността на AddTransforms, описана по-горе, както и интеграция с DI и поддръжка на валидация.

Инстанции на ITransformProvider могат да бъдат регистрирани в DI чрез извикване на AddTransforms. Могат да бъдат регистрирани множество реализации на ITransformProvider и всички ще бъдат изпълнени.

ITransformProvider има два метода — Validate и Apply . Validate ви дава възможност да прегледате маршрута за параметри, необходими за конфигуриране на трансформация, като персонализирани метаданни, и да върнете грешки при валидация в контекста, ако липсват или са невалидни необходими стойности. Методът Apply предоставя същата функционалност като AddTransform, обсъдена по-горе — добавяне и конфигуриране на трансформации за отделен маршрут.

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

Разработчиците, които искат да интегрират своите персонализирани трансформации с раздела Transforms на

конфигурацията, могат да реализират ITransformFactory. Той трябва да бъде регистриран в DI чрез

метода AddTransformFactory<T>(). Могат да бъдат регистрирани множество фабрики и всички ще бъдат използвани.

ITransformFactory предоставя два метода — Validate и Build . Те обработват по един набор от стойности на трансформация наведнъж, представен чрез IReadOnlyDictionary<string, string> .

Методът Validate се извиква при зареждане на конфигурация, за да провери съдържанието и да съобщи за всички грешки. Всяка съобщена грешка ще попречи на прилагането на конфигурацията.

Методът Build приема дадената конфигурация и произвежда съответните инстанции на трансформации за маршрута.

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
