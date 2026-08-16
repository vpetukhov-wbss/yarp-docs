---
slug: direct-forwarding
title: Директно препращане
lede: >-
  Някои приложения се нуждаят единствено от възможността да вземат конкретна заявка и да я
  препратят към конкретна
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/direct-forwarding
lastUpdated: 2026-08-11
---

Някои приложения се нуждаят единствено от възможността да вземат конкретна заявка и да я препратят към конкретна дестинация. Тези приложения нямат нужда от останалите функции на прокси сървъра — като откриване на конфигурация, маршрутизация, балансиране на натоварването и т.н. — или са ги решили по друг начин.

## IHttpForwarder

IHttpForwarder служи като основен прокси адаптер между входящите AspNetCore заявки и изходящите заявки чрез System.Net.Http. Той се грижи за механиката по създаването на HttpRequestMessage от HttpContext, изпращането му и предаването на отговора.

IHttpForwarder поддържа:

Динамичен избор на дестинация — вие указвате дестинацията за всяка заявка Персонализиране на HTTP клиента — вие предоставяте HttpMessageInvoker Персонализиране на заявката и отговора (с изключение на телата) Поточни протоколи като gRPC и WebSockets Обработка на грешки

Не включва:

Маршрутизация Балансиране на натоварването Афинитет Повторни опити

## Пример

Вижте ReverseProxy.Direct.Sample като готов пример, или следвайте стъпките по-долу.

## Създаване на нов проект

Следвайте ръководството Getting Started, за да създадете проект и да добавите зависимостта от nuget пакета Yarp.ReverseProxy.

## Актуализиране на Program.cs

В този пример IHttpForwarder се регистрира в DI, инжектира се в метода на крайната точка и се

използва за препращане на заявки от конкретен маршрут към https://localhost:10000/prefix/ .

Незадължителните трансформации показват как да се копират всички заглавни части на заявката с изключение на Host , обичайно е дестинацията да изисква собствен Host от url адреса.

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

Съществуват и разширяващи методи, които опростяват съпоставянето на IHttpForwarder към крайни точки.

```csharp
   app.MapForwarder("/{**catch-all}", "https://localhost:10000/", requestConfig,
   transformer, httpClient);
```

## HTTP клиентът

HTTP клиентът може да бъде персонализиран, но горният пример е препоръчителен за обичайните прокси сценарии. Винаги използвайте HttpMessageInvoker вместо HttpClient, HttpClient буферира отговорите по подразбиране. Буферирането нарушава поточните сценарии и увеличава използването на памет и латентността. Препоръчително е повторно да използвате клиент за заявки към една и съща дестинация поради причини, свързани с производителността, тъй като това позволява повторно използване на пул от връзки. Клиентът може да бъде повторно използван и за заявки към различни дестинации, ако конфигурацията е една и съща.

## Трансформации

Заявката и отговорът могат да бъдат променяни, като се предостави производен клас на HttpTransformer като параметър на метода SendAsync.

## Обработка на грешки

IHttpForwarder улавя изключения и таймаути от HTTP клиента, логва ги и ги превръща в 5xx статус кодове или прекратява отговора. От SendAsync се връща код на грешка, а подробностите за грешката могат да бъдат достъпени чрез IForwarderErrorFeature, както е показано по-горе.

:::note
Тази статия е създадена от автора с помощта на AI. Научете повече
:::
