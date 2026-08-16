---
slug: direct-forwarding
title: Direkte Weiterleitung
lede: >-
  Manche Anwendungen benötigen lediglich die Möglichkeit, eine bestimmte Anforderung
  entgegenzunehmen und an ein bestimmtes
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/direct-forwarding
lastUpdated: 2026-08-11
---

Manche Anwendungen benötigen lediglich die Möglichkeit, eine bestimmte Anforderung entgegenzunehmen und an ein bestimmtes Ziel weiterzuleiten. Diese Anwendungen benötigen die übrigen Funktionen des Proxys wie Konfigurationserkennung, Routing, Lastenausgleich usw. nicht oder haben sie auf andere Weise gelöst.

## IHttpForwarder

IHttpForwarder dient als zentraler Proxy-Adapter zwischen eingehenden AspNetCore- und ausgehenden System.Net.Http-Anforderungen. Er übernimmt die Mechanik des Erstellens einer HttpRequestMessage aus einem HttpContext, deren Versand und die Weiterleitung der Antwort.

IHttpForwarder unterstützt:

Dynamische Zielauswahl – Sie geben das Ziel für jede Anforderung an Anpassung des HTTP-Clients – Sie stellen den HttpMessageInvoker bereit Anpassung von Anforderung und Antwort (außer Bodies) Streamingprotokolle wie gRPC und WebSockets Fehlerbehandlung

Nicht enthalten sind:

Routing Lastenausgleich Affinität Wiederholungsversuche

## Beispiel

Siehe ReverseProxy.Direct.Sample als vorgefertigtes Beispiel, oder folgen Sie den nachstehenden Schritten.

## Neues Projekt erstellen

Folgen Sie der Anleitung zum Einstieg, um ein Projekt zu erstellen und die NuGet-Abhängigkeit Yarp.ReverseProxy hinzuzufügen.

## Program.cs aktualisieren

In diesem Beispiel wird IHttpForwarder in der DI registriert, in die Endpunktmethode injiziert und

verwendet, um Anforderungen von einer bestimmten Route an https://localhost:10000/prefix/ weiterzuleiten.

Die optionalen Transforms zeigen, wie alle Anforderungsheader mit Ausnahme von Host kopiert werden; häufig benötigt das Ziel seinen eigenen Host aus der URL.

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

Außerdem stehen Erweiterungsmethoden zur Verfügung, die die Zuordnung von IHttpForwarder zu Endpunkten vereinfachen.

```csharp
   app.MapForwarder("/{**catch-all}", "https://localhost:10000/", requestConfig,
   transformer, httpClient);
```

## Der HTTP-Client

Der HTTP-Client kann angepasst werden, für gängige Proxyszenarien wird jedoch das obige Beispiel empfohlen. Verwenden Sie stets HttpMessageInvoker anstelle von HttpClient; HttpClient puffert Antworten standardmäßig. Pufferung beeinträchtigt Streamingszenarien und erhöht den Speicherverbrauch sowie die Latenz. Aus Leistungsgründen wird empfohlen, für Anforderungen an dasselbe Ziel denselben Client wiederzuverwenden, da dies die Wiederverwendung gepoolter Verbindungen ermöglicht. Ein Client kann auch für Anforderungen an unterschiedliche Ziele wiederverwendet werden, sofern die Konfiguration identisch ist.

## Transforms

Anforderung und Antwort können geändert werden, indem ein abgeleiteter HttpTransformer als Parameter an die SendAsync-Methode übergeben wird.

## Fehlerbehandlung

IHttpForwarder fängt Ausnahmen und Timeouts vom HTTP-Client ab, protokolliert sie und wandelt sie in 5xx-Statuscodes um oder bricht die Antwort ab. Von SendAsync wird ein Fehlercode zurückgegeben, und die Fehlerdetails können wie oben gezeigt über IForwarderErrorFeature abgerufen werden.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
