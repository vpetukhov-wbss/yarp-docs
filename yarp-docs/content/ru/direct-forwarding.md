---
slug: direct-forwarding
title: Прямая пересылка
lede: >-
  Некоторым приложениям достаточно возможности взять конкретный запрос и переслать его на
  конкретный
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/direct-forwarding
lastUpdated: 2026-08-11
---

Некоторым приложениям достаточно возможности взять конкретный запрос и переслать его на конкретный узел назначения. Таким приложениям не нужны — либо они реализованы иным способом — остальные возможности прокси, такие как обнаружение конфигурации, маршрутизация, балансировка нагрузки и т. д.

## IHttpForwarder

IHttpForwarder служит основным адаптером прокси между входящими запросами AspNetCore и исходящими запросами System.Net.Http. Он берёт на себя механику создания HttpRequestMessage из HttpContext, его отправку и передачу ответа.

IHttpForwarder поддерживает:

Динамический выбор узла назначения — вы указываете узел назначения для каждого запроса. Настройку HTTP-клиента — вы предоставляете HttpMessageInvoker. Настройку запроса и ответа (кроме тел). Потоковые протоколы, такие как gRPC и WebSockets. Обработку ошибок.

Он не включает:

Маршрутизацию. Балансировку нагрузки. Привязку сеансов. Повторные попытки.

## Пример

См. готовый пример ReverseProxy.Direct.Sample либо выполните приведённые ниже шаги.

## Создание нового проекта

Следуйте руководству по началу работы, чтобы создать проект и добавить зависимость NuGet-пакета Yarp.ReverseProxy.

## Обновление Program.cs

В этом примере IHttpForwarder регистрируется в DI, внедряется в метод конечной точки и

используется для пересылки запросов с определённого маршрута на https://localhost:10000/prefix/ .

Необязательные преобразования показывают, как скопировать все заголовки запроса, кроме Host , — узел назначения часто требует собственного значения Host, определяемого его URL.

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

Существуют также методы расширения, упрощающие сопоставление IHttpForwarder с конечными точками.

```csharp
   app.MapForwarder("/{**catch-all}", "https://localhost:10000/", requestConfig,
   transformer, httpClient);
```

## HTTP-клиент

HTTP-клиент можно настроить по-своему, но для типичных сценариев прокси рекомендуется приведённый выше пример. Всегда используйте HttpMessageInvoker вместо HttpClient — HttpClient по умолчанию буферизует ответы. Буферизация нарушает потоковые сценарии и увеличивает потребление памяти и задержку. Из соображений производительности рекомендуется повторно использовать клиент для запросов к одному и тому же узлу назначения, поскольку это позволяет повторно использовать пул соединений. Клиент также можно повторно использовать для запросов к разным узлам назначения, если их конфигурация совпадает.

## Преобразования

Запрос и ответ можно изменять, передав производный класс HttpTransformer в качестве параметра метода SendAsync.

## Обработка ошибок

IHttpForwarder перехватывает исключения и тайм-ауты от HTTP-клиента, регистрирует их в журнале и преобразует в коды состояния 5xx либо прерывает ответ. Метод SendAsync возвращает код ошибки, а подробности ошибки можно получить из IForwarderErrorFeature, как показано выше.

:::note
Автор подготовил эту статью с помощью ИИ. Подробнее
:::
