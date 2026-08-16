---
slug: direct-forwarding
title: Reenvío directo
lede: >-
  Algunas aplicaciones solo necesitan la capacidad de tomar una solicitud específica y reenviarla
  a un destino
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/direct-forwarding
lastUpdated: 2026-08-11
---

Algunas aplicaciones solo necesitan la capacidad de tomar una solicitud específica y reenviarla a un destino específico. Estas aplicaciones no necesitan las demás funciones del proxy, como el descubrimiento de configuración, el enrutamiento, el equilibrio de carga, etc., o bien ya las han resuelto de otra manera.

## IHttpForwarder

IHttpForwarder actúa como el adaptador de proxy central entre las solicitudes entrantes de AspNetCore y las solicitudes salientes de System.Net.Http. Se encarga de la mecánica de crear un HttpRequestMessage a partir de un HttpContext, enviarlo y transmitir la respuesta.

IHttpForwarder admite:

Selección dinámica de destino: usted especifica el destino de cada solicitud. Personalización del cliente HTTP: usted proporciona el HttpMessageInvoker. Personalización de la solicitud y la respuesta (excepto los cuerpos). Protocolos de streaming como gRPC y WebSockets. Manejo de errores.

No incluye:

Enrutamiento. Equilibrio de carga. Afinidad. Reintentos.

## Ejemplo

Consulte ReverseProxy.Direct.Sample como ejemplo prediseñado, o siga los pasos que se indican a continuación.

## Crear un nuevo proyecto

Siga la guía de introducción para crear un proyecto y agregar la dependencia NuGet Yarp.ReverseProxy.

## Actualizar Program.cs

En este ejemplo, IHttpForwarder se registra en la inyección de dependencias, se inserta en el método del endpoint y

se usa para reenviar solicitudes de una ruta específica a https://localhost:10000/prefix/ .

Las transformaciones opcionales muestran cómo copiar todos los encabezados de la solicitud excepto Host, ya que es habitual que el destino requiera su propio Host a partir de la URL.

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

También existen métodos de extensión disponibles que simplifican la asignación de IHttpForwarder a los endpoints.

```csharp
   app.MapForwarder("/{**catch-all}", "https://localhost:10000/", requestConfig,
   transformer, httpClient);
```

## El cliente HTTP

El cliente HTTP se puede personalizar, pero se recomienda el ejemplo anterior para los escenarios de proxy habituales. Use siempre HttpMessageInvoker en lugar de HttpClient; HttpClient almacena las respuestas en búfer de forma predeterminada. El almacenamiento en búfer interrumpe los escenarios de streaming y aumenta el uso de memoria y la latencia. Se recomienda reutilizar un cliente para las solicitudes al mismo destino por motivos de rendimiento, ya que permite reutilizar las conexiones agrupadas (pooled). Un cliente también se puede reutilizar para solicitudes a destinos diferentes si la configuración es la misma.

## Transformaciones

La solicitud y la respuesta se pueden modificar proporcionando un HttpTransformer derivado como parámetro del método SendAsync.

## Manejo de errores

IHttpForwarder captura las excepciones y los tiempos de espera procedentes del cliente HTTP, los registra y los convierte en códigos de estado 5xx, o bien anula la respuesta. SendAsync devuelve un código de error, y se puede acceder a los detalles del error desde IForwarderErrorFeature, como se mostró anteriormente.

:::note
El autor creó este artículo con la ayuda de la IA. Más información
:::
