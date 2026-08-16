---
slug: authn-authz
title: 身份验证与授权
lede: >-
  反向代理可用于在请求被转发之前对其进行身份验证和授权
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/authn-authz
lastUpdated: 2026-08-11
---

## YARP 身份验证与授权

## 简介

反向代理可用于在请求转发到目标服务器之前对其进行身份验证和授权。这样可以减轻目标服务器的负载,增加一层保护,并确保在各个应用程序中实施一致的策略。

## 默认设置

除非在路由或应用程序配置中启用,否则不会对请求执行任何身份验证或授权。

## 配置

可以通过 RouteConfig.AuthorizationPolicy 为每个路由指定授权策略,并可从配置文件的 Routes 部分进行绑定。与其他路由属性一样,可以在不重启代理的情况下修改并重新加载该设置。策略名称不区分大小写。

示例:

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "AuthorizationPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
          }
      },
      "Clusters": {
          "cluster1": {
             "Destinations": {
                "cluster1/destination1": {
                    "Address": "https://localhost:10001/"
                }
             }
          }
      }
             }
          }
Authorization policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core authentication and authorization components.
Authorization policies can be configured in the application as follows:
   services.AddAuthorization(options =>
   {
          options.AddPolicy("customPolicy", policy =>
                 policy.RequireAuthenticatedUser());
   });
In Program.cs add the Authorization and Authentication middleware.
   app.UseAuthentication();
   app.UseAuthorization();
   app.MapReverseProxy();
See the Authentication docs for setting up your preferred kind of authentication.
Special values:
In addition to custom policy names, there are two special values that can be specified in a
route's authorization parameter: default and anonymous . ASP.NET Core also has a
FallbackPolicy setting that applies to routes that do not specify a policy.
```

## DefaultPolicy

在路由的授权参数中指定值 default 表示该路由将使用 AuthorizationOptions.DefaultPolicy 中定义的策略。该策略已预先配置为要求经过身份验证的用户。

## Anonymous

在路由的授权参数中指定值 anonymous 表示该路由将不会

要求进行授权,无论应用程序中是否配置了其他策略,例如

FallbackPolicy。

## FallbackPolicy

AuthorizationOptions.FallbackPolicy 是应用于未配置策略的任何请求或路由的策略。FallbackPolicy 默认没有值,此时将允许所有请求通过。

## 传递凭据

即使请求已在代理中获得授权,目标服务器可能仍需要知道用户是谁(身份验证)以及他们被允许执行哪些操作(授权)。如何传递这些信息取决于所使用的身份验证类型。

## Cookie、持有者令牌、API 密钥

这些身份验证类型已经在请求标头中传递其值,默认情况下这些值会传递到目标服务器。目标服务器仍需要验证并解释这些值,这会造成一些重复工作。

## OAuth2、OpenIdConnect、WsFederation

这些协议通常与远程标识提供程序一起使用。身份验证过程可以在代理应用程序中进行配置,并会生成一个身份验证 Cookie。该 Cookie 将作为普通请求标头传递到目标服务器。

## Windows、Negotiate、NTLM、Kerberos

这些身份验证类型通常绑定到特定连接。不支持将它们用作在 YARP 代理背后的目标服务器中对用户进行身份验证的手段(参见 #166)。它们可用于对传入代理的请求进行身份验证,但该身份信息必须以其他形式传递给目标服务器。它们也可用于让代理向目标服务器进行身份验证,但仅限于以代理自身用户的身份,不支持模拟客户端。

## 客户端证书

客户端证书是 TLS 的一项功能,在连接建立过程中进行协商。请参阅这些文档

了解更多信息。可以使用 ClientCert 转换将该证书作为

HTTP 标头转发到目标服务器。

## 转换身份验证类型

像 Windows 这样无法自然传递到目标服务器的身份验证类型,需要在代理中转换为另一种形式。例如,可以使用用户信息创建 JWT 持有者令牌,并将其设置在代理请求上。

这些转换可以通过自定义请求转换来实现。如果社区有足够的兴趣,可以针对特定场景开发详细示例。我们需要更多社区反馈,以了解您希望如何转换和传递身份信息。

:::note
本文作者在 AI 的协助下创作本文。了解详情
:::
