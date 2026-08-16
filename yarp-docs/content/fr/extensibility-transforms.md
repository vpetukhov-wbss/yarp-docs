---
slug: extensibility-transforms
title: Transformations de requête et de réponse
lede: >-
  Lors de la proxification d'une requête, il est courant de modifier certaines parties de la
  requête ou de la réponse afin de s'adapter
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility-transforms
lastUpdated: 2026-08-11
---

## Transformation de requête et de réponse

## Extensibilité

## Introduction

Lors de la proxification d'une requête, il est courant de modifier certaines parties de la requête ou de la réponse afin de s'adapter aux exigences du serveur de destination, ou de transmettre des données supplémentaires telles que l'adresse IP d'origine du client. Ce processus est implémenté via les transformations (Transforms). Les types de transformations sont définis globalement pour l'application, puis les routes individuelles fournissent les paramètres permettant d'activer et de configurer ces transformations. Les objets de la requête d'origine ne sont pas modifiés par ces transformations, seules les requêtes du proxy le sont.

YARP inclut un ensemble de transformations de requête et de réponse intégrées prêtes à l'emploi. Pour plus d'informations, consultez les transformations de requête et de réponse de YARP. Si ces transformations ne suffisent pas, des transformations personnalisées peuvent être ajoutées.

## RequestTransform

Toutes les transformations de requête doivent dériver de la classe de base abstraite RequestTransform. Celles-ci peuvent librement modifier le HttpRequestMessage du proxy. Évitez de lire ou de modifier le corps de la requête, car cela peut perturber le flux de proxying. Pensez également à ajouter une méthode d'extension paramétrée sur TransformBuilderContext pour faciliter la découverte et l'utilisation.

Une transformation de requête peut, sous certaines conditions, produire une réponse immédiate, par exemple en cas d'erreur. Cela empêche l'exécution des transformations restantes et le proxying de la requête. Cela se traduit par la définition de HttpResponse.StatusCode à une valeur autre que 200, l'appel de HttpResponse.StartAsync(), ou l'écriture dans HttpResponse.Body ou BodyWriter.

AddRequestTransform est une méthode d'extension de TransformBuilderContext qui définit une transformation de requête sous la forme d'un Func<RequestTransformContext, ValueTask>. Cela permet de créer une transformation de requête personnalisée sans implémenter de classe dérivée de RequestTransform.

## ResponseTransform

Toutes les transformations de réponse doivent dériver de la classe de base abstraite ResponseTransform. Celles-ci peuvent librement modifier le HttpResponse du client. Évitez de lire ou de modifier le corps de la réponse, car

cela peut perturber le flux de proxying. Pensez également à ajouter une méthode d'extension paramétrée sur

TransformBuilderContext pour faciliter la découverte et l'utilisation.

AddResponseTransform est une méthode d'extension de TransformBuilderContext qui définit une transformation de réponse sous la forme d'un Func<ResponseTransformContext, ValueTask>. Cela permet de créer une transformation de réponse personnalisée sans implémenter de classe dérivée de ResponseTransform.

## ResponseTrailersTransform

Toutes les transformations de trailers de réponse doivent dériver de la classe de base abstraite ResponseTrailersTransform. Celles-ci peuvent librement modifier les trailers du HttpResponse du client. Elles s'exécutent après le corps de la réponse et ne doivent pas tenter de modifier les en-têtes ou le corps de la réponse. Pensez également à ajouter une méthode d'extension paramétrée sur TransformBuilderContext pour faciliter la découverte et l'utilisation.

AddResponseTrailersTransform est une méthode d'extension de TransformBuilderContext qui définit une transformation de trailers de réponse sous la forme d'un Func<ResponseTrailersTransformContext, ValueTask>. Cela permet de créer une transformation de trailers de réponse personnalisée sans implémenter de classe dérivée de ResponseTrailersTransform.

## Transformations du corps de la requête

YARP ne fournit aucune transformation intégrée pour modifier le corps de la requête. Toutefois, le corps peut être modifié par des transformations personnalisées.

Soyez attentif au type de requêtes modifiées, à la quantité de données mises en mémoire tampon, à l'application de délais d'expiration, à l'analyse d'entrées non fiables, et à la mise à jour des en-têtes liés au corps du message, comme Content-Length.

L'exemple ci-dessous utilise une mise en mémoire tampon simple et peu efficace pour transformer les requêtes. Une implémentation plus efficace consisterait à envelopper et remplacer HttpContext.Request.Body par un flux effectuant les modifications nécessaires au fur et à mesure que les données sont proxifiées du client vers le serveur. Cela nécessiterait également de supprimer l'en-tête Content-Length, car la longueur finale ne serait pas connue à l'avance.

Cet exemple nécessite YARP 1.1, voir https://github.com/microsoft/reverse-proxy/pull/1569.

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

Les transformations personnalisées ne peuvent modifier le corps d'une requête que si celui-ci est déjà présent. Elles ne peuvent pas ajouter un nouveau corps à une requête qui n'en possède pas (par exemple, une requête POST sans corps ou une requête GET). Si vous devez ajouter un corps pour une méthode HTTP et une route spécifiques, vous devez le faire dans un middleware qui s'exécute avant YARP, et non dans une transformation.

Le middleware suivant montre comment ajouter un corps à une requête qui n'en possède pas :

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

## Transformations du corps de la réponse

YARP ne fournit aucune transformation intégrée pour modifier le corps de la réponse. Toutefois, le corps peut être modifié par des transformations personnalisées.

Soyez attentif au type de réponses modifiées, à la quantité de données mises en mémoire tampon, à l'application de délais d'expiration, à l'analyse d'entrées non fiables, et à la mise à jour des en-têtes liés au corps du message, comme Content-Length. Il peut être nécessaire de décompresser le contenu avant de le modifier, comme l'indique l'en-tête Content-Encoding, puis de le recompresser ou de supprimer cet en-tête.

L'exemple ci-dessous utilise une mise en mémoire tampon simple et peu efficace pour transformer les réponses. Une implémentation plus efficace consisterait à envelopper le flux retourné par ReadAsStreamAsync() dans un flux effectuant les modifications nécessaires au fur et à mesure que les données sont proxifiées du client vers le serveur. Cela nécessiterait également de supprimer l'en-tête Content-Length, car la longueur finale ne serait pas connue à l'avance.

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

ITransformProvider fournit les fonctionnalités d'AddTransforms décrites ci-dessus, ainsi qu'une prise en charge de l'intégration avec l'injection de dépendances et de la validation.

Les ITransformProvider peuvent être inscrits dans l'injection de dépendances en appelant AddTransforms. Plusieurs implémentations de ITransformProvider peuvent être inscrites, et toutes seront exécutées.

ITransformProvider possède deux méthodes, Validate et Apply. Validate vous permet d'inspecter la route à la recherche des paramètres nécessaires à la configuration d'une transformation, comme des métadonnées personnalisées, et de renvoyer des erreurs de validation sur le contexte si des valeurs requises sont manquantes ou invalides. La méthode Apply offre les mêmes fonctionnalités qu'AddTransform, décrites ci-dessus, en ajoutant et en configurant les transformations pour chaque route.

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

Les développeurs qui souhaitent intégrer leurs transformations personnalisées à la section Transforms de la

configuration peuvent implémenter un ITransformFactory. Celui-ci doit être inscrit dans l'injection de dépendances à l'aide de la

méthode AddTransformFactory<T>(). Plusieurs fabriques peuvent être inscrites, et toutes seront utilisées.

ITransformFactory fournit deux méthodes, Validate et Build. Celles-ci traitent un ensemble de valeurs de transformation à la fois, représenté par un IReadOnlyDictionary<string, string>.

La méthode Validate est appelée lors du chargement d'une configuration afin d'en vérifier le contenu et de signaler toutes les erreurs. Toute erreur signalée empêchera l'application de la configuration.

La méthode Build prend la configuration fournie et produit les instances de transformation associées pour la route.

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
