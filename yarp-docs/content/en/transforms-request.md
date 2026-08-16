---
slug: transforms-request
title: Request transforms
lede: >-
  Request transforms include the request path, query, HTTP version, method, and headers. In code
  these are represented by the
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request
lastUpdated: 2026-08-11
---

Request transforms include the request path, query, HTTP version, method, and headers. In code these are represented by the RequestTransformContext object and processed by implementations of the abstract class RequestTransform.

Notes:

The proxy request scheme (http/https), authority, and path base, are taken from the destination server address ( https://localhost:10001/Path/Base in the example above) and should not be modified by transforms. The Host header can be overridden by transforms independent of the authority, see RequestHeader below. The request's original PathBase property is not used when constructing the proxy request, see X-Forwarded. All incoming request headers are copied to the proxy request by default with the exception of the Host header (see Defaults Defaults). X- Forwarded headers are also added by default. These behaviors can be configured using the following transforms. Additional request headers can be specified, or request headers can be excluded by setting them to an empty value.

The following are built in transforms identified by their primary config key. These transforms are applied in the order they are specified in the route configuration.

## PathPrefix {#pathprefix}

## Modifies the request path adding a prefix value {#modifies-the-request-path-adding-a-prefix-value}

Key Value Required PathPrefix A path starting with a '/' yes

Config:

JSON { "PathPrefix": "/prefix" }

Code:

C# routeConfig = routeConfig.WithTransformPathPrefix(prefix: "/prefix");

C# transformBuilderContext.AddPathPrefix(prefix: "/prefix");

Example: /request/path becomes /prefix/request/path This will prefix the request path with the given value.

## PathRemovePrefix {#pathremoveprefix}

## Modifies the request path removing a prefix value {#modifies-the-request-path-removing-a-prefix-value}

Key Value Expand table PathRemovePrefix A path starting with a '/' Required yes Config: 1/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathRemovePrefix": "/prefix" }

Code:

C# routeConfig = routeConfig.WithTransformPathRemovePrefix(prefix: "/prefix");

```csharp
   transformBuilderContext.AddPathRemovePrefix(prefix: "/prefix");
Example:
/prefix/request/path becomes /request/path
/prefix2/request/path is not modified
This will remove the matching prefix from the request path. Matches are made on path segment boundaries ( / ). If the prefix does not match then
no changes are made.
```

## PathSet {#pathset}

## Replaces the request path with the specified value {#replaces-the-request-path-with-the-specified-value}

Key Value Required PathSet A path starting with a '/' yes

Config:

JSON { "PathSet": "/newpath" }

Code:

C# routeConfig = routeConfig.WithTransformPathSet(path: "/newpath");

C# transformBuilderContext.AddPathSet(path: "/newpath");

Example: /request/path becomes /newpath This will set the request path with the given value.

## PathPattern {#pathpattern}

## Replaces the request path using a pattern template {#replaces-the-request-path-using-a-pattern-template}

Key Value Expand table PathPattern A path template starting with a '/' Required yes Config: 2/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathPattern": "/my/{plugin}/api/{**remainder}" }

Code:

C# routeConfig = routeConfig.WithTransformPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

C# transformBuilderContext.AddPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

This will set the request path with the given value and replace any {} segments with the associated route value. {} segments without a matching route value are removed. The final {} segment can be marked as {**remainder} to indicate this is a catch-all segment that may contain multiple path segments. See ASP.NET Core's routing docs for more information about route templates.

Example:

Step Value Route definition Request path /api/{plugin}/stuff/{**remainder} Plugin value /api/v1/stuff/more/stuff Remainder value v1 PathPattern more/stuff Result /my/{plugin}/api/{**remainder} /my/v1/api/more/stuff

## QueryValueParameter {#queryvalueparameter}

Adds or replaces parameters in the request query string

Key Value Expand table QueryValueParameter Name of a query string parameter Required Set/Append Static value yes yes Config: 3/13 JSON

{ "QueryValueParameter": "foo", "Append": "bar"

}

Code:

C# routeConfig = routeConfig.WithTransformQueryValue(queryKey: "foo", value: "bar", append: true);

C# transformBuilderContext.AddQueryValue(queryKey: "foo", value: "bar", append: true);

This will add a query string parameter with the name foo and sets it to the static value bar . https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 Example: Value Step Query ?a=b QueryValueParameter foo Append remainder Result ?a=b&foo=remainder

## QueryRouteParameter {#queryrouteparameter}

Adds or replaces a query string parameter with a value from the route configuration

Key Value Expand table QueryRouteParameter Name of a query string parameter Required Set/Append The name of a route value yes yes Config:

```json
   {
       "QueryRouteParameter": "foo",
       "Append": "remainder"
   }
Code:
    C#
   routeConfig = routeConfig.WithTransformQueryRouteValue(queryKey: "foo", routeValueKey: "remainder", append: true);
    C#
   transformBuilderContext.AddQueryRouteValue(queryKey: "foo", routeValueKey: "remainder", append: true);
This will add a query string parameter with the name foo and sets it to the value of the associated route value.
Example:
Step                                                           Value
Route definition
Request path                                                   /api/{*remainder}
Remainder value                                                /api/more/stuff
QueryRouteParameter                                            more/stuff
Append                                                         foo
Result                                                         remainder
                                                               ?foo=more/stuff
```

## QueryRemoveParameter {#queryremoveparameter}

Removes the specified parameter from the request query string

Key Value Expand table QueryRemoveParameter Name of a query string parameter Required yes Config: JSON { "QueryRemoveParameter": "foo" }

Code:

C# routeConfig = routeConfig.WithTransformQueryRemoveKey(queryKey: "foo");

C# transformBuilderContext.AddQueryRemoveKey(queryKey: "foo");

This will remove a query string parameter with the name foo if present on the request. Example:

Step Value Request path QueryRemoveParameter ?a=b&foo=c Result foo ?a=b

## HttpMethodChange {#httpmethodchange}

## Changes the http method used in the request {#changes-the-http-method-used-in-the-request}

Key Value Expand table HttpMethodChange The http method to replace Required Set The new http method yes yes Config:

```json
   {
       "HttpMethodChange": "PUT",
       "Set": "POST"
   }
Code:
    C#
   routeConfig = routeConfig.WithTransformHttpMethodChange(fromHttpMethod: HttpMethods.Put, toHttpMethod: HttpMethods.Post);
C#
transformBuilderContext.AddHttpMethodChange(fromHttpMethod: HttpMethods.Put, toHttpMethod: HttpMethods.Post);
      This will change PUT requests to POST.
```

## RequestHeadersCopy {#requestheaderscopy}

Sets whether incoming request headers are copied to the outbound request

Key Value Default Expand table RequestHeadersCopy true/false true Required yes Config:

JSON { "RequestHeadersCopy": "false" }

Code:

C# routeConfig = routeConfig.WithTransformCopyRequestHeaders(copy: false);

C# transformBuilderContext.CopyRequestHeaders = false;

This sets if all incoming request headers are copied to the proxy request. This setting is enabled by default and can by disabled by configuring the transform with a false value. Transforms that reference specific headers will still be run if this is disabled.

## RequestHeaderOriginalHost {#requestheaderoriginalhost}

Specifies if the incoming request Host header should be copied to the proxy request

Key Value Default Expand table RequestHeaderOriginalHost true/false false Required yes Config:

JSON { "RequestHeaderOriginalHost": "true" }

C# routeConfig = routeConfig.WithTransformUseOriginalHostHeader(useOriginal: true);

C# transformBuilderContext.AddOriginalHost(true);

This specifies if the incoming request Host header should be copied to the proxy request. This setting is disabled by default and can be enabled by configuring the transform with a true value. Transforms that directly reference the Host header will override this transform.

## RequestHeader {#requestheader}

## Adds or replaces request headers {#adds-or-replaces-request-headers}

Key Expand table RequestHeader Set/Append Value Required The header name yes Config: The header value yes

JSON {

"RequestHeader": "MyHeader", "Set": "MyValue" }

Code:

C# routeConfig = routeConfig.WithTransformRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

C# transformBuilderContext.AddRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

Example:

MyHeader: MyValue

This sets or appends the value for the named header. Set replaces any existing header. Append adds an additional header with the given value. Note: setting "" as a header value is not recommended and can cause an undefined behavior.

## RequestHeaderRouteValue {#requestheaderroutevalue}

Adds or replaces a header with a value from the route configuration

Key Value Expand table RequestHeader Name of a query string parameter Required Set/Append The name of a route value yes yes

Config:

```json
{
   "RequestHeaderRouteValue": "MyHeader",
   "Set": "MyRouteKey"
}
Code:
    C#
   routeConfig = routeConfig.WithTransformRequestHeaderRouteValue(headerName: "MyHeader", routeValueKey: "key", append: false);
C#
transformBuilderContext.AddRequestHeaderRouteValue(headerName: "MyHeader", routeValueKey: "key", append: false);
      Example:
Step                                                                        Value
Route definition
Request path                                                                /api/{*remainder}
Remainder value                                                             /api/more/stuff
RequestHeaderFromRoute                                                      more/stuff
Append                                                                      foo
Result                                                                      remainder
                                                                            foo: more/stuff
This sets or appends the value for the named header with a value from the route configuration. Set replaces any existing header. Append adds an
additional header with the given value. Note: setting "" as a header value is not recommended and can cause an undefined behavior.
```

## RequestHeaderRemove {#requestheaderremove}

## Removes request headers {#removes-request-headers}

Key Value Expand table RequestHeaderRemove The header name Required yes Config:

```json
   {
       "RequestHeaderRemove": "MyHeader"
   }
Code:
    C#
   routeConfig = routeConfig.WithTransformRequestHeaderRemove(headerName: "MyHeader");
    C#
   transformBuilderContext.AddRequestHeaderRemove(headerName: "MyHeader");
Example:
   MyHeader: MyValue
   AnotherHeader: AnotherValue
This removes the named header.
```

## RequestHeadersAllowed {#requestheadersallowed}

Key Value Expand table RequestHeadersAllowed A semicolon separated list of allowed header names. Required yes https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 8/13 Config:

```json
           {
              "RequestHeadersAllowed": "Header1;header2"
           }
Code:
    C#
   routeConfig = routeConfig.WithTransformRequestHeadersAllowed("Header1", "header2");
```

```csharp
   transformBuilderContext.AddRequestHeadersAllowed("Header1", "header2");
YARP copies most request headers to the proxy request by default (see RequestHeadersCopy). Some security models only allow specific headers
to be proxied. This transform disables RequestHeadersCopy and only copies the given headers. Other transforms that modify or append to
existing headers may be affected if not included in the allow list.
Note that there are some headers YARP does not copy by default since they are connection specific or otherwise security sensitive (e.g.
Connection , Alt-Svc ). Putting those header names in the allow list will bypass that restriction but is strongly discouraged as it may negatively
affect the functionality of the proxy or cause security vulnerabilities.
Example:
   Header1: value1
   Header2: value2
   AnotherHeader: AnotherValue
Only header1 and header2 are copied to the proxy request.
```

## X-Forwarded {#x-forwarded}

Adds headers with information about the original client request

Key Value Default Required X-Forwarded Default action (Set, Append, Remove, Off) to apply to all X-Forwarded-* listed below Set yes For Action to apply to this header * See X-Forwarded no Proto Action to apply to this header * See X-Forwarded no Host Action to apply to this header * See X-Forwarded no Prefix Action to apply to this header * See X-Forwarded no HeaderPrefix The header name prefix "X-Forwarded-" no

Action "Off" completely disables the transform.

Config:

```json
   {
       "X-Forwarded": "Set",
       "For": "Remove",
       "Proto": "Append",
       "Prefix": "Off",
       "HeaderPrefix": "X-Forwarded-"
   }
      Code:
```

```csharp
routeConfig = routeConfig.WithTransformXForwarded(
   headerPrefix = "X-Forwarded-",
   ForwardedTransformActions xDefault = ForwardedTransformActions.Set,
   ForwardedTransformActions? xFor = null,
   ForwardedTransformActions? xHost = null,
   ForwardedTransformActions? xProto = null,
   ForwardedTransformActions? xPrefix = null);
```

```csharp
   transformBuilderContext.AddXForwarded(ForwardedTransformActions.Set);
   transformBuilderContext.AddXForwardedFor(headerName: "X-Forwarded-For", ForwardedTransformActions.Append);
   transformBuilderContext.AddXForwardedHost(headerName: "X-Forwarded-Host", ForwardedTransformActions.Append);
   transformBuilderContext.AddXForwardedProto(headerName: "X-Forwarded-Proto", ForwardedTransformActions.Off);
   transformBuilderContext.AddXForwardedPrefix(headerName: "X-Forwarded-Prefix", ForwardedTransformActions.Remove);
Example:
   X-Forwarded-For: 5.5.5.5
   X-Forwarded-Proto: https
   X-Forwarded-Host: IncomingHost:5000
   X-Forwarded-Prefix: /path/base
Disable default headers:
```

```json
   { "X-Forwarded": "Off" }
C#
transformBuilderContext.UseDefaultForwarders = false;
When the proxy connects to the destination server, the connection is independent from the one the client made to the proxy. The destination
server likely needs original connection information for security checks and to properly generate absolute URIs for links and redirects. To enable
information about the client connection to be passed to the destination a set of extra headers can be added. Until the Forwarded standard was
created, a common solution is to use X-Forwarded-* headers. There is no official standard that defines the X-Forwarded-* headers and
implementations vary, check your destination server for support.
This transform is enabled by default even if not specified in the route config.
Set the X-Forwarded value to a comma separated list containing the headers you need to enable. All for headers are enabled by default. All can be
disabled by specifying the value "Off" .
The Prefix specifies the header name prefix to use for each header. With the default X-Forwarded- prefix the resulting headers will be X-
Forwarded-For , X-Forwarded-Proto , X-Forwarded-Host , and X-Forwarded-Prefix .
Transform action specifies how each header should be combined with an existing header of the same name. It can be "Set", "Append", "Remove,
or "Off" (completely disable the transform). A request traversing multiple proxies may accumulate a list of such headers and the destination server
will need to evaluate the list to determine the original value. If action is "Set" and the associated value is not available on the request (e.g.
RemoteIpAddress is null), any existing header is still removed to prevent spoofing.
The {Prefix}For header value is taken from HttpContext.Connection.RemoteIpAddress representing the prior caller's IP address. The port is not
included. IPv6 addresses do not include the bounding [] brackets.
The {Prefix}Proto header value is taken from HttpContext.Request.Scheme indicating if the prior caller used HTTP or HTTPS.
The {Prefix}Host header value is taken from the incoming request's Host header. This is independent of RequestHeaderOriginalHost specified
above. Unicode/IDN hosts are punycode encoded.
The {Prefix}Prefix header value is taken from HttpContext.Request.PathBase . The PathBase property is not used when generating the proxy request
so the destination server will need the original value to correctly generate links and directs. The value is in the percent encoded Uri format.
```

## Forwarded {#forwarded}

Adds a header with information about the original client request

Key Value Default Re

Forwarded A comma separated list containing any of these values: for,by,proto,host (none) ye

ForFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

ByFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

Action Action to apply to this header (Set, Append, Remove, Off) Set no

Config:

```json
   {
       "Forwarded": "by,for,host,proto",
       "ByFormat": "Random",
       "ForFormat": "IpAndPort",
       "Action": "Append"
   },
Code:
```

```csharp
   routeConfig = routeConfig.WithTransformForwarded(useHost: true, useProto: true, forFormat: NodeFormat.IpAndPort, ByFormat:
   NodeFormat.Random, action: ForwardedTransformAction.Append);
    C#
   transformBuilderContext.AddForwarded(useHost: true, useProto: true, forFormat: NodeFormat.IpAndPort, ByFormat: NodeFormat.Random,
   action: ForwardedTransformAction.Append);
Example:
   Forwarded: proto=https;host="localhost:5001";for="[::1]:20173";by=_YQuN68tm6
The Forwarded header is defined by RFC 7239 . It consolidates many of the same functions as the unofficial X-Forwarded headers, flowing
information to the destination server that would otherwise be obscured by using a proxy.
Enabling this transform will disable the default X-Forwarded transforms as they carry similar information in another format. The X-Forwarded
transforms can still be explicitly enabled.
Action: This specifies how the transform should handle an existing Forwarded header. It can be "Set", "Append", "Remove, or "Off" (completely
disable the transform). A request traversing multiple proxies may accumulate a list of such headers and the destination server will need to
evaluate the list to determine the original value.
Proto: This value is taken from HttpContext.Request.Scheme indicating if the prior caller used HTTP or HTTPS.
Host: This value is taken from the incoming request's Host header. This is independent of RequestHeaderOriginalHost specified above.
Unicode/IDN hosts are punycode encoded.
For: This value identifies the prior caller. IP addresses are taken from HttpContext.Connection.RemoteIpAddress . See ByFormat and ForFormat
below for details.
By: This value identifies where the proxy received the request. IP addresses are taken from HttpContext.Connection.LocalIpAddress . See ByFormat
and ForFormat below for details.
ByFormat and ForFormat:
The RFC allows a variety of formats for the By and For fields. It requires that the default format uses an obfuscated identifier identified here as
Random.
Format             Description                                                                                                Example
Random             An obfuscated identifier that is generated randomly per request. This allows for diagnostic tracing        by=_YQuN68tm6
                   scenarios while limiting the flow of uniquely identifying information for privacy reasons.
RandomAndPort      The Random identifier plus the port.                                                                       by="_YQuN68tm6:80"
RandomAndRandomPort The Random identifier plus another random identifier for the port.                                        by="_YQuN68tm6:_jDw5Cf3tQ"
Unknown            This can be used when the identity of the preceding entity is not known, but the proxy server still wants  by=unknown
                   to signal that the request was forwarded.
UnknownAndPort     The Unknown identifier plus the port if available.                                                         by="unknown:80"
UnknownAndRandomPort The Unknown identifier plus random identifier for the port.                                              by="unknown:_jDw5Cf3tQ"
Ip                 An IPv4 address or an IPv6 address including brackets.                                                     by="[::1]"
IpAndPort          The IP address plus the port.                                                                              by="[::1]:80"
IpAndRandomPort    The IP address plus random identifier for the port.                                                        by="[::1]:_jDw5Cf3tQ"
```

## ClientCert {#clientcert}

Forwards the client cert used on the inbound connection as a header to destination

Key Value Required ClientCert The header name yes

Config:

JSON { "ClientCert": "X-Client-Cert" }

Code:

C# routeConfig = routeConfig.WithTransformClientCertHeader(headerName: "X-Client-Cert");

C# transformBuilderContext.AddClientCertHeader(headerName: "X-Client-Cert");

Example:

X-Client-Cert: SSdtIGEgY2VydGlmaWNhdGU...

As the inbound and outbound connections are independent, there needs to be a way to pass any inbound client certificate to the destination server. This transform causes the client certificate taken from HttpContext.Connection.ClientCertificate to be Base64 encoded and set as the value for the given header name. The destination server may need that certificate to authenticate the client. There is no standard that defines this header and implementations vary, check your destination server for support.

Servers do minimal validation on the incoming client certificate by default. The certificate should be validated either in the proxy or the destination, see the client certificate auth docs for details.

This transform will only apply if the client certificate is already present on the connection. See the optional certs doc if it needs to be requested from the client on a per-route basis.

:::note
The author created this article with assistance from AI. Learn more
:::
