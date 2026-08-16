---
slug: authn-authz
title: Authentication & authorization
lede: >-
  The reverse proxy can be used to authenticate and authorize requests before they are proxied
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/authn-authz
lastUpdated: 2026-08-11
---

## YARP Authentication and Authorization {#yarp-authentication-and-authorization}

## Introduction {#introduction}

The reverse proxy can be used to authenticate and authorize requests before they are proxied to the destination servers. This can reduce load on the destination servers, add a layer of protection, and ensure consistent policies are implemented across your applications.

## Defaults {#defaults}

No authentication or authorization is performed on requests unless enabled in the route or application configuration.

## Configuration {#configuration}

Authorization policies can be specified per route via RouteConfig.AuthorizationPolicy and can be bound from the Routes sections of the config file. As with other route properties, this can be modified and reloaded without restarting the proxy. Policy names are case insensitive.

Example:

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

## DefaultPolicy {#defaultpolicy}

Specifying the value default in a route's authorization parameter means that route will use the policy defined in AuthorizationOptions.DefaultPolicy. That policy is pre-configured to require authenticated users.

## Anonymous {#anonymous}

Specifying the value anonymous in a route's authorization parameter means that route will not

require authorization regardless of any other configuration in the application such as the

FallbackPolicy.

## FallbackPolicy {#fallbackpolicy}

AuthorizationOptions.FallbackPolicy is the policy that will be used for any request or route that was not configured with a policy. FallbackPolicy does not have a value by default, any request will be allowed.

## Flowing Credentials {#flowing-credentials}

Even after a request has been authorized in the proxy, the destination server may still need to know who the user is (authentication) and what they're allowed to do (authorization). How you flow that information will depend on the type of authentication being used.

## Cookie, bearer, API keys {#cookie-bearer-api-keys}

These authentication types already pass their values in the request headers and these will flow to the destination server by default. That server will still need to verify and interpret those values, causing some double work.

## OAuth2, OpenIdConnect, WsFederation {#oauth2-openidconnect-wsfederation}

These protocols are commonly used with remote identity providers. The authentication process can be configured in the proxy application and will result in an authentication cookie. That cookie will flow to the destination server as a normal request header.

## Windows, Negotiate, NTLM, Kerberos {#windows-negotiate-ntlm-kerberos}

These authentication types are often bound to a specific connection. They are not supported as means of authenticating a user in a destination server behind the YARP proxy (see #166 . They can be used to authenticate an incoming request to the proxy, but that identity information will have to be communicated to the destination server in another form. They can also be used to authenticate the proxy to the destination servers, but only as the proxy's own user, impersonating the client is not supported.

## Client Certificates {#client-certificates}

Client certificates are a TLS feature and are negotiated as part of a connection. See these docs

for additional information. The certificate can be forwarded to the destination server as an

HTTP header using the ClientCert transform.

## Swapping authentication types {#swapping-authentication-types}

Authentication types like Windows that don't flow naturally to the destination server will need to be converted in the proxy to an alternate form. For example a JWT bearer token can be created with the user information and set on the proxy request.

These swaps can be performed using custom request transforms. Detailed examples can be developed for specific scenarios if there is enough community interest. We need more community feedback on how you want to convert and flow identity information.

:::note
The author created this article with assistance from AI. Learn more
:::
