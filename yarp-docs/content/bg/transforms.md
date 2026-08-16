---
slug: transforms
title: Преглед
lede: >-
  При проксиране на заявка е обичайно да се променят части от заявката или отговора, за да се
  адаптират към
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms
lastUpdated: 2026-08-11
---

## Трансформации на заявки и отговори в YARP

## Въведение

При проксиране на заявка е обичайно да се променят части от заявката или отговора, за да се адаптират към изискванията на дестинационния сървър или за да се предадат допълнителни данни, като например оригиналния IP адрес на клиента. Този процес се реализира чрез трансформации (Transforms). Типовете трансформации се дефинират глобално за приложението, а отделните маршрути предоставят параметрите, чрез които тези трансформации се активират и конфигурират. Оригиналните обекти на заявката не се променят от тези трансформации - променят се само прокси заявките.

YARP не предоставя трансформации за тялото на заявката или отговора, но можете да напишете междинен софтуер (middleware), който да ги реализира.

## Стойности по подразбиране

Следните трансформации са активирани по подразбиране за всички маршрути. Те могат да бъдат конфигурирани или деактивирани, както е показано по-нататък в този документ.

Host - потиска заглавната част Host на входящата заявка. Прокси заявката ще използва по подразбиране името на хоста, зададено в адреса на дестинационния сървър. Вижте RequestHeaderOriginalHost по-долу. X-Forwarded-For - задава IP адреса на клиента в заглавната част X-Forwarded-For. Вижте X-Forwarded по-долу. X-Forwarded-Proto - задава оригиналната схема на заявката (http/https) в заглавната част X-Forwarded-Proto. Вижте X-Forwarded по-долу. X-Forwarded-Host - задава оригиналния Host на заявката в заглавната част X-Forwarded-Host. Вижте X-Forwarded по-долу. X-Forwarded-Prefix - задава оригиналния PathBase на заявката, ако има такъв, в заглавната част X-Forwarded-Prefix. Вижте X-Forwarded по-долу.

Например, следната входяща заявка към http://IncomingHost:5000/path:

GET /path HTTP/1.1 Host: IncomingHost:5000 Accept: */* header1: foo

ще бъде трансформирана и проксирана към дестинационния сървър https://DestinationHost:6000/ по следния

начин, използвайки тези стойности по подразбиране:

GET /path HTTP/1.1 Host: DestinationHost:6000 Accept: */* header1: foo X-Forwarded-For: 5.5.5.5 X-Forwarded-Proto: http X-Forwarded-Host: IncomingHost:5000

## Категории трансформации

Трансформациите се разделят на няколко категории: Request (заявка), Response (отговор) и Response Trailers (трейлъри на отговора). Трейлъри на заявката не се поддържат, тъй като не се поддържат от използвания HttpClient.

Ако вграденият набор от трансформации не е достатъчен, могат да бъдат добавени персонализирани трансформации чрез разширяемост (extensibility).

## Добавяне на трансформации

Трансформации могат да се добавят към маршрути както чрез конфигурация, така и програмно.

## От конфигурация

Трансформациите могат да се конфигурират чрез RouteConfig.Transforms и могат да се обвързват от секциите Routes на конфигурационния файл. Те могат да бъдат променяни и презареждани без рестартиране на прокси сървъра. Трансформацията се конфигурира с помощта на една или повече двойки ключ-стойност от тип низ.

Ето пример за често срещани трансформации:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Hosts": [ "localhost" ]
             },
             "Transforms": [
                { "PathPrefix": "/apis" },
                          {
                             "RequestHeader": "header1",
                             "Append": "bar"
                          },
                          {
                             "ResponseHeader": "header2",
                             "Append": "bar",
                             "When": "Always"
                          },
                          { "ClientCert": "X-Client-Cert" },
                          { "RequestHeadersCopy": "true" },
                          { "RequestHeaderOriginalHost": "true" },
                          {
                             "X-Forwarded": "Append",
                             "HeaderPrefix": "X-Forwarded-"
                          }
                      ]
                   },
                   "route2" : {
                      "ClusterId": "cluster1",
                      "Match": {
                          "Path": "/api/{plugin}/stuff/{**remainder}"
                      },
                      "Transforms": [
                          { "PathPattern": "/foo/{plugin}/bar/{**remainder}" },
                          {
                             "QueryValueParameter": "q",
                             "Append": "plugin"
                          }
                      ]
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                          "cluster1/destination1": {
                             "Address": "https://localhost:10001/Path/Base"
                          }
                      }
                   }
      }
   }
}
All configuration entries are treated as case-insensitive, though the destination server may
treat the resulting values as case sensitive or insensitive such as the path.
The details for these transforms are covered later in this document.
Developers that want to integrate their custom transforms with the Transforms section of
configuration can do so using ITransformFactory described below.
```

## От код

Трансформации могат да се добавят към маршрути програмно чрез извикване на метода AddTransforms.

AddTransforms може да се извика след AddReverseProxy, за да предостави обратно извикване (callback) за конфигуриране на трансформации. Това обратно извикване се извиква всеки път, когато маршрут се изгражда или преизгражда, и позволява на разработчика да прегледа информацията в RouteConfig и условно да добави трансформации за него.

Обратното извикване на AddTransforms предоставя TransformBuilderContext, в който могат да се добавят или конфигурират трансформации. Повечето трансформации предоставят разширяващи методи (extension methods) на TransformBuilderContext, които улесняват добавянето им. Тези разширения са документирани по-долу заедно с описанията на отделните трансформации.

TransformBuilderContext също включва IServiceProvider за достъп до всички необходими услуги.

```csharp
services.AddReverseProxy()
      .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
      .AddTransforms(builderContext =>
      {
             // Added to all routes.
             builderContext.AddPathPrefix("/prefix");
             // Conditionally add a transform for routes that require auth.
             if (!string.IsNullOrEmpty(builderContext.Route.AuthorizationPolicy))
             {
                    builderContext.AddRequestTransform(async transformContext =>
                    {
                          transformContext.ProxyRequest.Headers.Add("CustomHeader",
"CustomValue");
                    });
             }
      });
For more advanced control see ITransformProvider described below.
 Note: The author created this article with assistance from AI. Learn more
```
