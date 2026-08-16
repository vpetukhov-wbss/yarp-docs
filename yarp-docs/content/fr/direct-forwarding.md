---
slug: direct-forwarding
title: Transfert direct
lede: >-
  Certaines applications ont uniquement besoin de la possibilité de prendre une requête spécifique
  et de la transférer vers une
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/direct-forwarding
lastUpdated: 2026-08-11
---

Certaines applications ont uniquement besoin de la possibilité de prendre une requête spécifique et de la transférer vers une destination spécifique. Ces applications n'ont pas besoin des autres fonctionnalités du proxy, comme la découverte de configuration, le routage, la répartition de charge, etc., ou les ont traitées autrement.

## IHttpForwarder

IHttpForwarder sert d'adaptateur de proxy central entre les requêtes AspNetCore entrantes et les requêtes System.Net.Http sortantes. Il gère la mécanique de création d'un HttpRequestMessage à partir d'un HttpContext, son envoi, et la retransmission de la réponse.

IHttpForwarder prend en charge :

La sélection dynamique de la destination : vous spécifiez la destination pour chaque requête. La personnalisation du client HTTP : vous fournissez le HttpMessageInvoker. La personnalisation de la requête et de la réponse (à l'exception des corps de message). Les protocoles de streaming comme gRPC et WebSockets. La gestion des erreurs.

Il n'inclut pas :

Le routage La répartition de charge L'affinité Les nouvelles tentatives

## Exemple

Consultez ReverseProxy.Direct.Sample comme exemple prêt à l'emploi, ou suivez les étapes ci-dessous.

## Créer un projet

Suivez le guide de prise en main pour créer un projet et ajouter la dépendance NuGet Yarp.ReverseProxy.

## Mettre à jour Program.cs

Dans cet exemple, IHttpForwarder est inscrit dans le conteneur d'injection de dépendances, injecté dans la méthode du point de terminaison, et

utilisé pour transférer les requêtes d'une route spécifique vers https://localhost:10000/prefix/.

Les transformations facultatives montrent comment copier tous les en-têtes de la requête à l'exception de Host ; il est courant que la destination exige son propre en-tête Host, déterminé à partir de l'URL.

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

Des méthodes d'extension sont également disponibles pour simplifier le mappage de IHttpForwarder à des points de terminaison.

```csharp
   app.MapForwarder("/{**catch-all}", "https://localhost:10000/", requestConfig,
   transformer, httpClient);
```

## Le client HTTP

Le client HTTP peut être personnalisé, mais l'exemple ci-dessus est recommandé pour les scénarios de proxy courants. Utilisez toujours HttpMessageInvoker plutôt que HttpClient : HttpClient met en mémoire tampon les réponses par défaut. Cette mise en mémoire tampon casse les scénarios de streaming et augmente l'utilisation de la mémoire ainsi que la latence. Il est recommandé de réutiliser un client pour les requêtes vers la même destination, pour des raisons de performances, car cela permet de réutiliser les connexions groupées. Un client peut également être réutilisé pour des requêtes vers des destinations différentes si la configuration est identique.

## Transformations

La requête et la réponse peuvent être modifiées en fournissant une classe dérivée de HttpTransformer en tant que paramètre de la méthode SendAsync.

## Gestion des erreurs

IHttpForwarder intercepte les exceptions et les délais d'expiration provenant du client HTTP, les journalise, et les convertit en codes de statut 5xx ou interrompt la réponse. Un code d'erreur est renvoyé par SendAsync, et les détails de l'erreur sont accessibles via IForwarderErrorFeature, comme illustré ci-dessus.

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
