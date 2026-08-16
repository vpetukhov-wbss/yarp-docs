---
slug: extensibility-transforms
title: Anforderungs- und Antworttransformationen
lede: >-
  Beim Weiterleiten einer Anforderung ist es üblich, Teile der Anforderung oder Antwort zu ändern,
  um sie an
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility-transforms
lastUpdated: 2026-08-11
---

## Anforderungs- und Antworttransformation

## Erweiterbarkeit

## Einführung

Beim Weiterleiten einer Anforderung ist es üblich, Teile der Anforderung oder Antwort zu ändern, um sie an die Anforderungen des Zielservers anzupassen oder um zusätzliche Daten wie die ursprüngliche IP-Adresse des Clients weiterzugeben. Dieser Vorgang wird über Transforms implementiert. Transformationstypen werden global für die Anwendung definiert, und einzelne Routen stellen dann die Parameter bereit, um diese Transforms zu aktivieren und zu konfigurieren. Die ursprünglichen Anforderungsobjekte werden von diesen Transforms nicht verändert, sondern nur die Proxyanforderungen.

YARP enthält eine Reihe integrierter Anforderungs- und Antworttransformationen, die verwendet werden können. Weitere Informationen finden Sie unter YARP-Anforderungs- und Antworttransformationen. Wenn diese Transforms nicht ausreichen, können benutzerdefinierte Transforms hinzugefügt werden.

## RequestTransform

Alle Anforderungstransformationen müssen von der abstrakten Basisklasse RequestTransform abgeleitet werden. Diese können die Proxy-HttpRequestMessage frei verändern. Vermeiden Sie es, den Anforderungs-Body zu lesen oder zu ändern, da dies den Weiterleitungsablauf stören kann. Erwägen Sie außerdem, eine parametrisierte Erweiterungsmethode für TransformBuilderContext hinzuzufügen, um die Auffindbarkeit und einfache Nutzung zu verbessern.

Eine Anforderungstransformation kann unter bestimmten Bedingungen eine sofortige Antwort erzeugen, etwa bei Fehlerbedingungen. Dadurch wird verhindert, dass verbleibende Transforms ausgeführt werden und die Anforderung weitergeleitet wird. Dies wird angezeigt, indem HttpResponse.StatusCode auf einen anderen Wert als 200 gesetzt wird, HttpResponse.StartAsync() aufgerufen wird oder in HttpResponse.Body bzw. BodyWriter geschrieben wird.

AddRequestTransform ist eine Erweiterungsmethode von TransformBuilderContext, die eine Anforderungstransformation als Func<RequestTransformContext, ValueTask> definiert. Dies ermöglicht das Erstellen einer benutzerdefinierten Anforderungstransformation, ohne eine von RequestTransform abgeleitete Klasse zu implementieren.

## ResponseTransform

Alle Antworttransformationen müssen von der abstrakten Basisklasse ResponseTransform abgeleitet werden. Diese können die Client-HttpResponse frei verändern. Vermeiden Sie es, den Antwort-Body zu lesen oder zu ändern, da

dies den Weiterleitungsablauf stören kann. Erwägen Sie außerdem, eine parametrisierte Erweiterungsmethode für

TransformBuilderContext hinzuzufügen, um die Auffindbarkeit und einfache Nutzung zu verbessern.

AddResponseTransform ist eine Erweiterungsmethode von TransformBuilderContext, die eine Antworttransformation als Func<ResponseTransformContext, ValueTask> definiert. Dies ermöglicht das Erstellen einer benutzerdefinierten Antworttransformation, ohne eine von ResponseTransform abgeleitete Klasse zu implementieren.

## ResponseTrailersTransform

Alle Transformationen von Antwort-Trailern müssen von der abstrakten Basisklasse ResponseTrailersTransform abgeleitet werden. Diese können die Trailer der Client-HttpResponse frei verändern. Sie werden nach dem Antwort-Body ausgeführt und sollten nicht versuchen, die Antwortheader oder den Antwort-Body zu ändern. Erwägen Sie außerdem, eine parametrisierte Erweiterungsmethode für TransformBuilderContext hinzuzufügen, um die Auffindbarkeit und einfache Nutzung zu verbessern.

AddResponseTrailersTransform ist eine Erweiterungsmethode von TransformBuilderContext, die eine Trailer-Transformation der Antwort als Func<ResponseTrailersTransformContext, ValueTask> definiert. Dies ermöglicht das Erstellen einer benutzerdefinierten Trailer-Transformation der Antwort, ohne eine von ResponseTrailersTransform abgeleitete Klasse zu implementieren.

## Transformationen des Anforderungs-Bodys

YARP stellt keine integrierten Transforms zum Ändern des Anforderungs-Bodys bereit. Der Body kann jedoch durch benutzerdefinierte Transforms geändert werden.

Achten Sie darauf, welche Arten von Anforderungen geändert werden, wie viele Daten gepuffert werden, dass Timeouts durchgesetzt werden, wie nicht vertrauenswürdige Eingaben verarbeitet werden und dass body-bezogene Header wie Content-Length aktualisiert werden.

Das folgende Beispiel verwendet eine einfache, ineffiziente Pufferung, um Anforderungen zu transformieren. Eine effizientere Implementierung würde HttpContext.Request.Body mit einem Stream umschließen und ersetzen, der die erforderlichen Änderungen vornimmt, während die Daten vom Client zum Server weitergeleitet werden. Dies würde außerdem erfordern, dass der Content-Length-Header entfernt wird, da die endgültige Länge nicht im Voraus bekannt wäre.

Dieses Beispiel erfordert YARP 1.1, siehe https://github.com/microsoft/reverse-proxy/pull/1569 .

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

Benutzerdefinierte Transforms können einen Anforderungs-Body nur ändern, wenn bereits einer vorhanden ist. Sie können keinen neuen Body zu einer Anforderung hinzufügen, die keinen besitzt (zum Beispiel eine POST-Anforderung ohne Body oder eine GET-Anforderung). Wenn Sie für eine bestimmte HTTP-Methode und Route einen Body hinzufügen müssen, müssen Sie dies in einer Middleware tun, die vor YARP ausgeführt wird, nicht in einem Transform.

Die folgende Middleware zeigt, wie einer Anforderung, die keinen Body besitzt, ein Body hinzugefügt werden kann:

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

## Transformationen des Antwort-Bodys

YARP stellt keine integrierten Transforms zum Ändern des Antwort-Bodys bereit. Der Body kann jedoch durch benutzerdefinierte Transforms geändert werden.

Achten Sie darauf, welche Arten von Antworten geändert werden, wie viele Daten gepuffert werden, dass Timeouts durchgesetzt werden, wie nicht vertrauenswürdige Eingaben verarbeitet werden und dass body-bezogene Header wie Content-Length aktualisiert werden. Möglicherweise müssen Sie den Inhalt vor der Änderung dekomprimieren, wie durch den Content-Encoding-Header angegeben, und ihn anschließend wieder komprimieren oder den Header entfernen.

Das folgende Beispiel verwendet eine einfache, ineffiziente Pufferung, um Antworten zu transformieren. Eine effizientere Implementierung würde den von ReadAsStreamAsync() zurückgegebenen Stream mit einem Stream umschließen, der die erforderlichen Änderungen vornimmt, während die Daten vom Client zum Server weitergeleitet werden. Dies würde außerdem erfordern, dass der Content-Length-Header entfernt wird, da die endgültige Länge nicht im Voraus bekannt wäre.

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

ITransformProvider bietet die oben beschriebene Funktionalität von AddTransforms sowie DI-Integration und Unterstützung für die Validierung.

ITransformProvider-Instanzen können durch Aufrufen von AddTransforms in der DI registriert werden. Es können mehrere ITransformProvider-Implementierungen registriert werden, und alle werden ausgeführt.

ITransformProvider verfügt über zwei Methoden, Validate und Apply. Validate bietet Ihnen die Möglichkeit, die Route auf Parameter zu prüfen, die zum Konfigurieren eines Transforms benötigt werden, etwa benutzerdefinierte Metadaten, und Validierungsfehler im Kontext zurückzugeben, falls benötigte Werte fehlen oder ungültig sind. Die Apply-Methode bietet dieselbe Funktionalität wie das oben beschriebene AddTransform, indem sie Transforms pro Route hinzufügt und konfiguriert.

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

Entwickler, die ihre benutzerdefinierten Transforms in den Transforms-Abschnitt der

Konfiguration integrieren möchten, können eine ITransformFactory implementieren. Diese sollte mithilfe der

Methode AddTransformFactory<T>() in der DI registriert werden. Es können mehrere Factories registriert werden, und alle werden verwendet.

ITransformFactory bietet zwei Methoden, Validate und Build. Diese verarbeiten jeweils eine Gruppe von Transformwerten, dargestellt durch ein IReadOnlyDictionary<string, string>.

Die Validate-Methode wird beim Laden einer Konfiguration aufgerufen, um deren Inhalt zu überprüfen und alle Fehler zu melden. Gemeldete Fehler verhindern, dass die Konfiguration angewendet wird.

Die Build-Methode nimmt die angegebene Konfiguration entgegen und erzeugt die zugehörigen Transform-Instanzen für die Route.

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
