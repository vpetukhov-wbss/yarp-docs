---
slug: extensibility-transforms
title: 请求与响应转换
lede: >-
  在代理请求时，通常需要修改请求或响应的部分内容，以适应
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility-transforms
lastUpdated: 2026-08-11
---

## 请求与响应转换

## 可扩展性

## 简介

在代理请求时，通常需要修改请求或响应的某些部分，以适应目标服务器的要求，或者传递额外的数据（例如客户端的原始 IP 地址）。这一过程是通过转换来实现的。转换的类型是在应用程序级别全局定义的，然后由各个路由提供参数来启用并配置这些转换。这些转换不会修改原始请求对象，只会修改代理请求。

YARP 内置了一套可供使用的请求和响应转换。有关更多信息，请参阅"YARP 请求与响应转换"。如果这些内置转换无法满足需求，还可以添加自定义转换。

## RequestTransform

所有请求转换都必须派生自抽象基类 RequestTransform。它们可以自由修改代理的 HttpRequestMessage。请避免读取或修改请求正文，因为这可能会破坏代理流程。此外，建议在 TransformBuilderContext 上添加一个带参数的扩展方法，以提升可发现性并方便使用。

请求转换可以在满足特定条件时（例如出现错误）立即生成响应。这样会阻止其余转换继续运行，也不会再代理该请求。判断依据是：将 HttpResponse.StatusCode 设置为非 200 的值，或调用 HttpResponse.StartAsync()，或向 HttpResponse.Body 或 BodyWriter 写入数据。

AddRequestTransform 是 TransformBuilderContext 的一个扩展方法，它将请求转换定义为一个 Func<RequestTransformContext, ValueTask>。这样就可以在不实现 RequestTransform 派生类的情况下创建自定义请求转换。

## ResponseTransform

所有响应转换都必须派生自抽象基类 ResponseTransform。它们可以自由修改客户端的 HttpResponse。请避免读取或修改响应正文，因为这可能会破坏代理流程。此外，建议在 TransformBuilderContext 上添加一个带参数的扩展方法，以提升可发现性并方便使用。

AddResponseTransform 是 TransformBuilderContext 的一个扩展方法，它将响应转换定义为一个 Func<ResponseTransformContext, ValueTask>。这样就可以在不实现 ResponseTransform 派生类的情况下创建自定义响应转换。

## ResponseTrailersTransform

所有响应尾部转换都必须派生自抽象基类 ResponseTrailersTransform。它们可以自由修改客户端 HttpResponse 的尾部（trailers）。这些转换在响应正文之后运行，不应尝试修改响应标头或正文。此外，建议在 TransformBuilderContext 上添加一个带参数的扩展方法，以提升可发现性并方便使用。

AddResponseTrailersTransform 是 TransformBuilderContext 的一个扩展方法，它将响应尾部转换定义为一个 Func<ResponseTrailersTransformContext, ValueTask>。这样就可以在不实现 ResponseTrailersTransform 派生类的情况下创建自定义响应尾部转换。

## 请求正文转换

YARP 没有提供任何用于修改请求正文的内置转换，不过可以通过自定义转换来修改正文。

请谨慎考虑要修改哪些类型的请求、需要缓冲多少数据、如何强制实施超时、如何解析不受信任的输入，以及如何更新与正文相关的标头（例如 Content-Length）。

下面的示例使用简单但效率较低的缓冲方式来转换请求。更高效的实现方式是包装并替换 HttpContext.Request.Body，使用一个能够在数据从客户端代理到服务器的过程中执行所需修改的流。这样做还需要移除 Content-Length 标头，因为最终长度事先无法确定。

此示例需要 YARP 1.1，请参阅 https://github.com/microsoft/reverse-proxy/pull/1569 。

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

## 任何

## // 在 ProxyRequest 上需要的标头

requestContext.ProxyRequest.Content.Headers.ContentLength =

bytes.Length;

}

});

});

自定义转换只能在请求已经存在正文的情况下修改该正文。它们无法为原本没有正文的请求添加新的正文（例如没有正文的 POST 请求，或 GET 请求）。如果需要为特定的 HTTP 方法和路由添加正文，则必须在运行于 YARP 之前的中间件中完成，而不能在转换中完成。

以下中间件演示了如何为原本没有正文的请求添加正文：

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

## 响应正文转换

YARP 没有提供任何用于修改响应正文的内置转换，不过可以通过自定义转换来修改正文。

请谨慎考虑要修改哪些类型的响应、需要缓冲多少数据、如何强制实施超时、如何解析不受信任的输入，以及如何更新与正文相关的标头（例如 Content-Length）。根据 Content-Encoding 标头的指示，您可能需要先解压缩内容再进行修改，之后再重新压缩内容或移除该标头。

下面的示例使用简单但效率较低的缓冲方式来转换响应。更高效的实现方式是包装 ReadAsStreamAsync() 返回的流，使用一个能够在数据从客户端代理到服务器的过程中执行所需修改的流。这样做还需要移除 Content-Length 标头，因为最终长度事先无法确定。

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

ITransformProvider 提供了上文所述 AddTransforms 的功能，此外还提供了依赖关系注入集成和验证支持。

可以通过调用 AddTransforms 将 ITransformProvider 注册到依赖关系注入容器中。可以注册多个 ITransformProvider 实现，它们都会被运行。

ITransformProvider 有两个方法：Validate 和 Apply。Validate 使您有机会检查路由中配置转换所需的各项参数（例如自定义元数据），并在所需值缺失或无效时，在上下文中返回验证错误。Apply 方法提供的功能与前文所述的 AddTransform 相同，用于按路由添加和配置转换。

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

如果开发人员希望将自定义转换与配置的 Transforms 部分集成，可以实现一个 ITransformFactory。该实现应使用 AddTransformFactory<T>() 方法注册到依赖关系注入容器中。可以注册多个工厂，它们都会被使用。

ITransformFactory 提供了两个方法：Validate 和 Build。它们每次处理一组转换值，这组值以 IReadOnlyDictionary<string, string> 的形式表示。

加载配置时会调用 Validate 方法，用于验证内容并报告所有错误。任何被报告的错误都会阻止该配置被应用。

Build 方法接收给定的配置，并为该路由生成相应的转换实例。

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
