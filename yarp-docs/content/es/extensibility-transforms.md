---
slug: extensibility-transforms
title: Transformaciones de solicitud y respuesta
lede: >-
  Al hacer proxy de una solicitud, es habitual modificar partes de la solicitud o de la respuesta
  para adaptarse a
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility-transforms
lastUpdated: 2026-08-11
---

## Transformación de solicitud y respuesta

## Extensibilidad

## Introducción

Al hacer proxy de una solicitud, es habitual modificar partes de la solicitud o de la respuesta para adaptarse a los requisitos del servidor de destino, o para transportar datos adicionales, como la dirección IP original del cliente. Este proceso se implementa mediante transformaciones (transforms). Los tipos de transformación se definen globalmente para la aplicación, y luego cada ruta concreta proporciona los parámetros para habilitarlas y configurarlas. Estas transformaciones no modifican los objetos de la solicitud original, solo las solicitudes del proxy.

YARP incluye un conjunto de transformaciones de solicitud y respuesta integradas que se pueden usar; para más información, consulte YARP Request and Response Transforms. Si esas transformaciones no son suficientes, se pueden agregar transformaciones personalizadas.

## RequestTransform

Todas las transformaciones de solicitud deben derivar de la clase base abstracta `RequestTransform`, que puede modificar libremente el `HttpRequestMessage` del proxy. Evite leer o modificar el cuerpo de la solicitud, ya que esto puede interrumpir el flujo del proxy. Considere también agregar un método de extensión parametrizado sobre `TransformBuilderContext` para facilitar su descubrimiento y uso.

Una transformación de solicitud puede producir condicionalmente una respuesta inmediata, por ejemplo, ante condiciones de error. Esto impide que se ejecuten las transformaciones restantes y que la solicitud se reenvíe al destino. Esto se indica estableciendo `HttpResponse.StatusCode` en un valor distinto de 200, llamando a `HttpResponse.StartAsync()`, o escribiendo en `HttpResponse.Body` o en `BodyWriter`.

`AddRequestTransform` es un método de extensión de `TransformBuilderContext` que define una transformación de solicitud como un `Func<RequestTransformContext, ValueTask>`. Esto permite crear una transformación de solicitud personalizada sin implementar una clase derivada de `RequestTransform`.

## ResponseTransform

Todas las transformaciones de respuesta deben derivar de la clase base abstracta `ResponseTransform`, que puede modificar libremente el `HttpResponse` del cliente. Evite leer o modificar el cuerpo de la respuesta, ya que esto puede interrumpir el flujo del proxy. Considere también agregar un método de extensión parametrizado sobre `TransformBuilderContext` para facilitar su descubrimiento y uso.

`AddResponseTransform` es un método de extensión de `TransformBuilderContext` que define una transformación de respuesta como un `Func<ResponseTransformContext, ValueTask>`. Esto permite crear una transformación de respuesta personalizada sin implementar una clase derivada de `ResponseTransform`.

## ResponseTrailersTransform

Todas las transformaciones de trailers de respuesta deben derivar de la clase base abstracta `ResponseTrailersTransform`, que puede modificar libremente los trailers del `HttpResponse` del cliente. Estas transformaciones se ejecutan después del cuerpo de la respuesta y no deben intentar modificar los encabezados ni el cuerpo de la respuesta. Considere también agregar un método de extensión parametrizado sobre `TransformBuilderContext` para facilitar su descubrimiento y uso.

`AddResponseTrailersTransform` es un método de extensión de `TransformBuilderContext` que define una transformación de trailers de respuesta como un `Func<ResponseTrailersTransformContext, ValueTask>`. Esto permite crear una transformación de trailers de respuesta personalizada sin implementar una clase derivada de `ResponseTrailersTransform`.

## Transformaciones del cuerpo de la solicitud

YARP no proporciona transformaciones integradas para modificar el cuerpo de la solicitud; sin embargo, el cuerpo se puede modificar mediante transformaciones personalizadas.

Tenga cuidado con qué tipos de solicitudes se modifican, cuánta cantidad de datos se almacena en búfer, la aplicación de tiempos de espera, el análisis de entradas no confiables y la actualización de encabezados relacionados con el cuerpo, como `Content-Length`.

El siguiente ejemplo usa un almacenamiento en búfer simple, pero ineficiente, para transformar solicitudes. Una implementación más eficiente encapsularía y reemplazaría `HttpContext.Request.Body` por un stream que realizara las modificaciones necesarias a medida que los datos se transfieren del cliente al servidor; eso también requeriría quitar el encabezado `Content-Length`, ya que la longitud final no se conocería de antemano.

Este ejemplo requiere YARP 1.1; consulte https://github.com/microsoft/reverse-proxy/pull/1569.

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

`requestContext.ProxyRequest.Content.Headers.ContentLength =`

`bytes.Length;`

`}`

`});`

`});`

Las transformaciones personalizadas solo pueden modificar el cuerpo de una solicitud si esta ya tiene uno; no pueden agregar un cuerpo nuevo a una solicitud que no lo tiene (por ejemplo, una solicitud POST sin cuerpo o una solicitud GET). Si necesita agregar un cuerpo para un método HTTP y una ruta específicos, debe hacerlo en un middleware que se ejecute antes de YARP, no en una transformación.

El siguiente middleware muestra cómo agregar un cuerpo a una solicitud que no lo tiene:

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

## Transformaciones del cuerpo de la respuesta

YARP no proporciona transformaciones integradas para modificar el cuerpo de la respuesta; sin embargo, el cuerpo se puede modificar mediante transformaciones personalizadas.

Tenga cuidado con qué tipos de respuestas se modifican, cuánta cantidad de datos se almacena en búfer, la aplicación de tiempos de espera, el análisis de entradas no confiables y la actualización de encabezados relacionados con el cuerpo, como `Content-Length`. Es posible que deba descomprimir el contenido antes de modificarlo, según lo indique el encabezado `Content-Encoding`, y volver a comprimirlo después o quitar dicho encabezado.

El siguiente ejemplo usa un almacenamiento en búfer simple, pero ineficiente, para transformar respuestas. Una implementación más eficiente encapsularía el stream devuelto por `ReadAsStreamAsync()` con un stream que realizara las modificaciones necesarias a medida que los datos se transfieren del cliente al servidor; eso también requeriría quitar el encabezado `Content-Length`, ya que la longitud final no se conocería de antemano.

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

`ITransformProvider` ofrece la misma funcionalidad que `AddTransforms`, descrita anteriormente, además de integración con la inyección de dependencias y compatibilidad con la validación.

Los `ITransformProvider` se registran en la inyección de dependencias llamando a `AddTransforms`. Se pueden registrar varias implementaciones de `ITransformProvider`, y todas se ejecutarán.

`ITransformProvider` tiene dos métodos, `Validate` y `Apply`. `Validate` le da la oportunidad de inspeccionar la ruta en busca de los parámetros necesarios para configurar una transformación, como metadatos personalizados, y de devolver errores de validación en el contexto si falta algún valor necesario o si no es válido. El método `Apply` ofrece la misma funcionalidad que `AddTransform`, descrita anteriormente, agregando y configurando transformaciones por ruta.

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

Los desarrolladores que quieran integrar sus transformaciones personalizadas con la sección `Transforms` de la configuración pueden implementar un `ITransformFactory`, que debe registrarse en la inyección de dependencias mediante el método `AddTransformFactory<T>()`. Se pueden registrar varias factories, y todas se usarán.

`ITransformFactory` ofrece dos métodos, `Validate` y `Build`, que procesan un conjunto de valores de transformación a la vez, representado por un `IReadOnlyDictionary<string, string>`.

El método `Validate` se llama al cargar una configuración para comprobar su contenido e informar de todos los errores; cualquier error notificado impedirá que la configuración se aplique.

El método `Build` toma la configuración proporcionada y produce las instancias de transformación asociadas para la ruta.

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
