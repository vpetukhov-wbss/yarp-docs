---
slug: transforms
title: Обзор
lede: >-
  При проксировании запроса части запроса или ответа часто требуется изменить, чтобы адаптировать
  их к
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms
lastUpdated: 2026-08-11
---

## Преобразования запросов и ответов YARP

## Введение

При проксировании запроса части запроса или ответа часто требуется изменить, чтобы адаптировать их к требованиям сервера назначения или передать дополнительные данные, например исходный IP-адрес клиента. Этот процесс реализуется с помощью преобразований (Transforms). Типы преобразований определяются глобально для приложения, а затем отдельные маршруты предоставляют параметры для включения и настройки этих преобразований. Эти преобразования не изменяют исходные объекты запроса — изменяются только запросы прокси.

YARP не предоставляет преобразований тела запроса и ответа, но для этого можно написать собственное промежуточное ПО (middleware).

## Значения по умолчанию

Следующие преобразования включены по умолчанию для всех маршрутов. Их можно настроить или отключить, как показано далее в этом документе.

Host — подавляет заголовок Host входящего запроса. По умолчанию прокси-запрос будет использовать имя узла, указанное в адресе сервера назначения. См. RequestHeaderOriginalHost ниже. X-Forwarded-For — записывает IP-адрес клиента в заголовок X-Forwarded-For. См. X-Forwarded ниже. X-Forwarded-Proto — записывает исходную схему запроса (http/https) в заголовок X-Forwarded-Proto. См. X-Forwarded ниже. X-Forwarded-Host — записывает исходный заголовок Host запроса в заголовок X-Forwarded-Host. См. X-Forwarded ниже. X-Forwarded-Prefix — записывает исходный PathBase запроса, если он есть, в заголовок X-Forwarded-Prefix. См. X-Forwarded ниже.

Например, следующий входящий запрос к http://IncomingHost:5000/path :

GET /path HTTP/1.1 Host: IncomingHost:5000 Accept: */* header1: foo

будет преобразован и проксирован на сервер назначения https://DestinationHost:6000/ следующим

образом, с использованием следующих параметров по умолчанию:

GET /path HTTP/1.1 Host: DestinationHost:6000 Accept: */* header1: foo X-Forwarded-For: 5.5.5.5 X-Forwarded-Proto: http X-Forwarded-Host: IncomingHost:5000

## Категории преобразований

Преобразования делятся на несколько категорий: запросы (Request), ответы (Response) и трейлеры ответа (Response Trailers). Трейлеры запроса не поддерживаются, поскольку они не поддерживаются используемым HttpClient.

Если встроенного набора преобразований недостаточно, можно добавить пользовательские преобразования с помощью механизма расширяемости.

## Добавление преобразований

Преобразования можно добавлять к маршрутам либо через конфигурацию, либо программно.

## Через конфигурацию

Преобразования можно настроить в RouteConfig.Transforms, они также могут быть привязаны из раздела Routes файла конфигурации. Их можно изменять и перезагружать без перезапуска прокси. Преобразование настраивается с помощью одной или нескольких пар «ключ — значение» в виде строк.

Ниже приведён пример часто используемых преобразований:

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

## Через код

Преобразования можно добавлять к маршрутам программно, вызывая метод AddTransforms.

Метод AddTransforms можно вызвать после AddReverseProxy, чтобы указать обратный вызов (callback) для настройки преобразований. Этот обратный вызов вызывается каждый раз при построении или перестроении маршрута и позволяет разработчику проверить сведения RouteConfig и добавить преобразования для него по определённому условию.

Обратный вызов AddTransforms предоставляет TransformBuilderContext, в котором можно добавлять или настраивать преобразования. Для большинства преобразований предусмотрены методы расширения TransformBuilderContext, упрощающие их добавление. Эти методы расширения описаны ниже вместе с описанием отдельных преобразований.

TransformBuilderContext также включает IServiceProvider для доступа к необходимым службам.

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
