---
slug: middleware
title: Междинен софтуер
lede: >-
  ASP.NET Core използва конвейер от междинен софтуер, за да раздели обработката на заявките на
  отделни стъпки. Разработчикът
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/middleware
lastUpdated: 2026-08-11
---

## Въведение

ASP.NET Core използва конвейер от междинен софтуер (middleware pipeline), за да раздели обработката на заявките на отделни стъпки. Разработчикът на приложението може да добавя и подрежда междинния софтуер според нуждите. Междинният софтуер на ASP.NET Core се използва и за реализиране и персонализиране на функционалността на обратния прокси.

## По подразбиране

Примерът от Getting Started показва следния метод Configure. Той настройва конвейер от междинен софтуер с инструменти за разработка, маршрутизация и крайни точки, конфигурирани за прокси ( MapReverseProxy ).

```csharp
         var builder = WebApplication.CreateBuilder(args);
         builder.Services.AddReverseProxy()
                .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
         var app = builder.Build();
         app.MapReverseProxy();
         app.Run();
The parameterless MapReverseProxy() in ReverseProxyIEndpointRouteBuilderExtensions
overload includes all standard proxy middleware for session affinity, load balancing, passive
health checks, and the final proxying of the request. Each of these check the configuration of
the matched route, cluster, and destination and perform their task accordingly.
```

## Добавяне на междинен софтуер

Междинният софтуер, добавен към конвейера на вашето приложение, ще вижда заявката в различни състояния на обработка в зависимост от това къде е добавен. Междинният софтуер, добавен преди UseRouting, ще вижда всички заявки и може да ги манипулира, преди да се извърши каквато и да е маршрутизация. Междинният софтуер, добавен между UseRouting и UseEndpoints, може да извика HttpContext.GetEndpoint(), за да провери коя крайна точка е съпоставена със заявката (ако има такава), и да използва метаданните, свързани с тази крайна точка. Именно по този начин се обработват удостоверяването, оторизацията и CORS.

ReverseProxyIEndpointRouteBuilderExtensions предоставя претоварване (overload) на MapReverseProxy, което ви позволява да изградите конвейер от междинен софтуер, който ще се изпълнява само за заявки, съпоставени с конфигурирани за прокси

маршрути.

app.MapReverseProxy(proxyPipeline => {

proxyPipeline.Use((context, next) => {

## // Custom inline middleware

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); proxyPipeline.UsePassiveHealthChecks(); });

По подразбиране това претоварване на MapReverseProxy включва само минималната настройка, логиката за проксиране и налагането на ограничения в началото и края на конвейера си. Междинният софтуер за афинитет на сесията, балансиране на натоварването и пасивни проверки за състояние не са включени по подразбиране, за да можете да ги изключвате, заменяте или контролирате реда им с допълнителен междинен софтуер.

## Персонализиран прокси междинен софтуер

Междинният софтуер в конвейера на MapReverseProxy има достъп до всички прокси данни и състояние, свързани със заявката (маршрут, клъстер, дестинации и т.н.), чрез IReverseProxyFeature. Той е достъпен от HttpContext.Features или чрез разширяващия метод HttpContext.GetReverseProxyFeature() .

Данните в IReverseProxyFeature са снимка (snapshot) на прокси конфигурацията в началото на прокси конвейера и не се влияят от промени в конфигурацията, настъпили, докато заявката се обработва.

```csharp
   proxyPipeline.Use((context, next) =>
   {
          var proxyFeature = context.GetReverseProxyFeature();
          var cluster = proxyFeature.Cluster;
          var destinations = proxyFeature.AvailableDestinations;
          return next();
   });
```

## Какво да правите с междинния софтуер

Междинният софтуер може да генерира логове, да контролира дали заявката се проксира или не, да влияе на това къде се проксира, и да добавя допълнителни функции като обработка на грешки, повторни опити и др.

## Логове и метрики

Междинният софтуер може да инспектира полетата на заявката и отговора, за да генерира логове и да агрегира метрики. Вижте бележката за телата на съобщенията в раздела „Какво да не правите с междинния софтуер“ по-долу.

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          LogRequest(context);
          await next();
          LogResponse(context);
   });
```

## Изпращане на незабавен отговор

Ако междинният софтуер инспектира заявка и определи, че тя не трябва да бъде проксирана, той може да генерира собствен отговор и да върне контрола на сървъра, без да извиква next() .

```csharp
   proxyPipeline.Use((context, next) =>
   {
          if (!CheckAllowedRequest(context, out var reason))
          {
                 context.Response.StatusCode = StatusCodes.Status400BadRequest;
                 return context.Response.WriteAsync(reason);
          }
          return next();
   });
```

## Филтриране на дестинации

Междинен софтуер като афинитета на сесията и балансирането на натоварването проверява IReverseProxyFeature и конфигурацията на клъстера, за да реши към коя дестинация трябва да бъде изпратена заявката. AllDestinations изброява всички дестинации в избрания клъстер.

AvailableDestinations изброява дестинациите, които в момента се считат за допустими за обработка на

заявката. Инициализира се със стойността на AllDestinations , като изключва нездравите, ако проверките за състояние са

активирани. Към края на конвейера AvailableDestinations трябва да бъде сведена до една-единствена дестинация,

в противен случай тя ще бъде избрана произволно от оставащите.

ProxiedDestination се задава от прокси логиката в края на конвейера, за да укаже коя дестинация в крайна сметка е използвана. Ако не остават налични дестинации, се изпраща отговор с грешка 503.

```csharp
proxyPipeline.Use(async (context, next) =>
{
      var proxyFeature = context.GetReverseProxyFeature();
      proxyFeature.AvailableDestinations =
Filter(proxyFeature.AvailableDestinations);
      await next();
      Report(proxyFeature.ProxiedDestination);
});
DestinationState implements IReadOnlyList<DestinationState> so a single destination can be
assigned to AvailableDestinations without creating a new list.
```

## Обработка на грешки

Междинният софтуер може да обвие извикването на await next() в блок try/catch, за да обработва изключения от следващите компоненти.

Прокси логиката в края на конвейера (IHttpForwarder) не хвърля изключения при обичайни грешки при проксиране на заявки. Те се улавят и се съобщават чрез IForwarderErrorFeature, достъпен от HttpContext.Features или чрез разширяващия метод HttpContext.GetForwarderErrorFeature() .

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          await next();
          var errorFeature = context.GetForwarderErrorFeature();
          if (errorFeature is not null)
          {
                 Report(errorFeature.Error, errorFeature.Exception);
                 }
          });
If the response has not started ( HttpResponse.HasStarted ) it can be cleared
( HttpResponse.Clear() ) and an alternate response sent, or the proxy feature fields may be
reset and the request retried.
```

## Какво да не правите с междинния софтуер

Междинният софтуер трябва да бъде внимателен при промяна на полета на заявката, като заглавни части, с цел да повлияе на изходящата проксирана заявка. Подобни промени могат да пречат на функции като повторните опити и е по-добре да бъдат обработвани чрез трансформации.

Междинният софтуер ТРЯБВА да проверява HttpResponse.HasStarted преди да променя полетата на отговора след извикването на next() . Ако изпращането на отговора към клиента вече е започнало, междинният софтуер вече не може да го променя (с евентуално изключение на Trailers). Трансформациите могат да се използват за инспектиране и потискане на нежелани отговори. В противен случай вижте следващата бележка.

Междинният софтуер трябва да избягва взаимодействие с телата на заявките или отговорите. По подразбиране телата не се буферират, така че взаимодействието с тях може да им попречи да достигнат дестинацията си. Макар да е възможно активирането на буфериране, това не се препоръчва, тъй като може да добави значителни разходи по памет и латентност. Ако тялото трябва да бъде прегледано или променено, се препоръчва обвит, поточен подход. За пример вижте междинния софтуер ResponseCompression.

Междинният софтуер НЕ ТРЯБВА да извършва многонишкова работа върху отделна заявка — HttpContext и свързаните с него членове не са thread safe.

:::note
Тази статия е създадена от автора с помощта на AI. Научете повече
:::
