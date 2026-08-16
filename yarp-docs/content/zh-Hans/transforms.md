---
slug: transforms
title: 概述
lede: >-
  在代理请求时,通常需要修改请求或响应的部分内容,以适应目标服务器的要求。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms
lastUpdated: 2026-08-11
---

## YARP 请求与响应转换

## 简介

在代理请求时,通常需要修改请求或响应的部分内容,以适应目标服务器的要求,或传递客户端原始 IP 地址等额外数据。这一过程是通过转换来实现的。转换的类型在应用程序级别全局定义,随后由各个路由提供参数来启用和配置这些转换。这些转换不会修改原始请求对象,只会修改代理请求。

YARP 本身不提供请求正文和响应正文的转换,但你可以编写中间件来实现这一点。

## 默认设置

以下转换针对所有路由默认启用,可以按照本文后面所示的方式对其进行配置或禁用。

Host——抑制传入请求的 Host 标头。代理请求默认使用目标服务器地址中指定的主机名。参见下文的 RequestHeaderOriginalHost。X-Forwarded-For——将客户端的 IP 地址设置到 X-Forwarded-For 标头中。参见下文的 X-Forwarded。X-Forwarded-Proto——将请求的原始方案(http/https)设置到 X-Forwarded-Proto 标头中。参见下文的 X-Forwarded。X-Forwarded-Host——将请求的原始 Host 设置到 X-Forwarded-Host 标头中。参见下文的 X-Forwarded。X-Forwarded-Prefix——将请求的原始 PathBase(如果有)设置到 X-Forwarded-Prefix 标头中。参见下文的 X-Forwarded。

例如,以下这个传入 http://IncomingHost:5000/path 的请求:

GET /path HTTP/1.1 Host: IncomingHost:5000 Accept: */* header1: foo

使用这些默认设置进行转换后,会被代理到目标服务器 https://DestinationHost:6000/,结果如下:

GET /path HTTP/1.1 Host: DestinationHost:6000 Accept: */* header1: foo X-Forwarded-For: 5.5.5.5 X-Forwarded-Proto: http X-Forwarded-Host: IncomingHost:5000

## 转换类别

转换分为几个类别:请求、响应,以及响应尾部标头。由于底层的 HttpClient 不支持请求尾部标头,因此不支持对其进行转换。

如果内置的转换集合不够用,可以通过扩展性机制添加自定义转换。

## 添加转换

转换既可以通过配置添加到路由,也可以通过编程方式添加。

## 通过配置添加

转换可以在 RouteConfig.Transforms 上进行配置,并可以从配置文件的 Routes 部分绑定。这些设置可以在不重启代理的情况下进行修改和重新加载。一个转换通过一个或多个键值字符串对来配置。

下面是一个常见转换的示例:

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

## 通过代码添加

可以通过调用 AddTransforms 方法,以编程方式将转换添加到路由。

AddTransforms 可以在 AddReverseProxy 之后调用,用于提供一个配置转换的回调。每当路由被构建或重新构建时都会调用该回调,开发者可以借此检查 RouteConfig 信息,并按条件为其添加转换。

AddTransforms 回调会提供一个 TransformBuilderContext,可以在其中添加或配置转换。大多数转换都提供了 TransformBuilderContext 扩展方法,以便更容易地添加它们。这些扩展方法都记录在下文各个转换的说明中。

TransformBuilderContext 还包含一个 IServiceProvider,用于访问所需的任何服务。

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
