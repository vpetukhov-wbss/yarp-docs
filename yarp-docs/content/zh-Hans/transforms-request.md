---
slug: transforms-request
title: 请求转换
lede: >-
  请求转换涉及请求路径、查询字符串、HTTP 版本、方法和标头。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request
lastUpdated: 2026-08-11
---

请求转换涉及请求路径、查询字符串、HTTP 版本、方法和标头。在代码中,它们由 RequestTransformContext 对象表示,并由抽象类 RequestTransform 的实现进行处理。

说明:

代理请求的方案(http/https)、颁发机构(authority)和路径基,均取自目标服务器地址(如上例中的 https://localhost:10001/Path/Base),不应由转换对其进行修改。可以通过转换独立于颁发机构来覆盖 Host 标头,详见下文的 RequestHeader。构建代理请求时不会使用请求原始的 PathBase 属性,详见 X-Forwarded。默认情况下,除 Host 标头外(参见"默认设置"),所有传入的请求标头都会被复制到代理请求中。默认情况下还会添加 X-Forwarded 标头。可以使用以下转换来配置这些行为。可以指定额外的请求标头,也可以通过将请求标头设置为空值来将其排除。

以下是通过其主要配置键来标识的内置转换。这些转换会按照它们在路由配置中指定的顺序被应用。

## PathPrefix

## 为请求路径添加前缀值

键为 PathPrefix,值为以 '/' 开头的路径,为必需项。

配置:

JSON { "PathPrefix": "/prefix" }

代码:

C# routeConfig = routeConfig.WithTransformPathPrefix(prefix: "/prefix");

C# transformBuilderContext.AddPathPrefix(prefix: "/prefix");

示例:/request/path 变为 /prefix/request/path。这会为请求路径添加给定的前缀值。

## PathRemovePrefix

## 从请求路径中移除前缀值

键为 PathRemovePrefix,值为以 '/' 开头的路径,为必需项。

配置:

JSON { "PathRemovePrefix": "/prefix" }

代码:

C# routeConfig = routeConfig.WithTransformPathRemovePrefix(prefix: "/prefix");

```csharp
   transformBuilderContext.AddPathRemovePrefix(prefix: "/prefix");
Example:
/prefix/request/path becomes /request/path
/prefix2/request/path is not modified
This will remove the matching prefix from the request path. Matches are made on path segment boundaries ( / ). If the prefix does not match then
no changes are made.
```

## PathSet

## 将请求路径替换为指定的值

键为 PathSet,值为以 '/' 开头的路径,为必需项。

配置:

JSON { "PathSet": "/newpath" }

代码:

C# routeConfig = routeConfig.WithTransformPathSet(path: "/newpath");

C# transformBuilderContext.AddPathSet(path: "/newpath");

示例:/request/path 变为 /newpath。这会将请求路径设置为给定的值。

## PathPattern

## 使用模式模板替换请求路径

键为 PathPattern,值为以 '/' 开头的路径模板,为必需项。

配置:

JSON { "PathPattern": "/my/{plugin}/api/{**remainder}" }

代码:

C# routeConfig = routeConfig.WithTransformPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

C# transformBuilderContext.AddPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

这会将请求路径设置为给定的值,并将其中的 {} 片段替换为对应的路由值。没有匹配路由值的 {} 片段会被移除。最后一个 {} 片段可以标记为 {**remainder},表示这是一个可以包含多个路径片段的捕获所有(catch-all)片段。有关路由模板的更多信息,请参阅 ASP.NET Core 的路由文档。

示例:

路由定义的请求路径为 /api/{plugin}/stuff/{**remainder}。对于请求 /api/v1/stuff/more/stuff,plugin 的值为 v1,remainder 的值为 more/stuff。将 PathPattern 设置为 /my/{plugin}/api/{**remainder} 后,结果为 /my/v1/api/more/stuff。

## QueryValueParameter

在请求查询字符串中添加或替换参数

键 QueryValueParameter 的值为查询字符串参数的名称,为必需项;键 Set/Append 的值为静态值,同样为必需项。

配置:

JSON { "QueryValueParameter": "foo", "Append": "bar"

}

代码:

C# routeConfig = routeConfig.WithTransformQueryValue(queryKey: "foo", value: "bar", append: true);

C# transformBuilderContext.AddQueryValue(queryKey: "foo", value: "bar", append: true);

这会添加一个名为 foo 的查询字符串参数,并将其设置为静态值 bar。

示例:对于查询字符串 ?a=b,配置 QueryValueParameter 为 foo、Append 为 remainder,结果为 ?a=b&foo=remainder。

## QueryRouteParameter

使用来自路由配置的值添加或替换查询字符串参数

键 QueryRouteParameter 的值为查询字符串参数的名称,为必需项;键 Set/Append 的值为路由值的名称,同样为必需项。

配置:

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

## QueryRemoveParameter

从请求查询字符串中移除指定的参数

键 QueryRemoveParameter 的值为查询字符串参数的名称,为必需项。

配置:

JSON { "QueryRemoveParameter": "foo" }

代码:

C# routeConfig = routeConfig.WithTransformQueryRemoveKey(queryKey: "foo");

C# transformBuilderContext.AddQueryRemoveKey(queryKey: "foo");

这会移除请求中名为 foo 的查询字符串参数(如果存在)。

示例:对于请求路径的查询字符串 ?a=b&foo=c,配置 QueryRemoveParameter 为 foo,结果为 ?a=b。

## HttpMethodChange

## 更改请求中使用的 HTTP 方法

键 HttpMethodChange 的值为要替换的 HTTP 方法,为必需项;键 Set 的值为新的 HTTP 方法,同样为必需项。

配置:

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

## RequestHeadersCopy

设置是否将传入的请求标头复制到出站请求

键 RequestHeadersCopy 的值为 true/false,默认值为 true,为必需项。

配置:

JSON { "RequestHeadersCopy": "false" }

代码:

C# routeConfig = routeConfig.WithTransformCopyRequestHeaders(copy: false);

C# transformBuilderContext.CopyRequestHeaders = false;

此设置用于控制是否将所有传入的请求标头复制到代理请求中。该设置默认处于启用状态,可以通过将转换配置为 false 值来禁用。即使禁用了此设置,引用特定标头的转换仍然会运行。

## RequestHeaderOriginalHost

指定是否应将传入请求的 Host 标头复制到代理请求

键 RequestHeaderOriginalHost 的值为 true/false,默认值为 false,为必需项。

配置:

JSON { "RequestHeaderOriginalHost": "true" }

C# routeConfig = routeConfig.WithTransformUseOriginalHostHeader(useOriginal: true);

C# transformBuilderContext.AddOriginalHost(true);

此设置用于指定是否应将传入请求的 Host 标头复制到代理请求中。该设置默认处于禁用状态,可以通过将转换配置为 true 值来启用。直接引用 Host 标头的转换会覆盖此设置。

## RequestHeader

## 添加或替换请求标头

键 RequestHeader 的值为标头名称,为必需项;键 Set/Append 的值为标头值,同样为必需项。

配置:

JSON {

"RequestHeader": "MyHeader", "Set": "MyValue" }

代码:

C# routeConfig = routeConfig.WithTransformRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

C# transformBuilderContext.AddRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

示例:

MyHeader: MyValue

这会设置或追加指定标头的值。Set 会替换任何已存在的标头。Append 会添加一个带有给定值的附加标头。注意:不建议将标头值设置为 "",这可能导致未定义的行为。

## RequestHeaderRouteValue

通过路由配置中的值添加或替换标头

键 RequestHeader 的值为查询字符串参数的名称,为必需项;键 Set/Append 的值为路由值的名称,同样为必需项。

配置:

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

## RequestHeaderRemove

## 移除请求标头

键 RequestHeaderRemove 的值为标头名称,为必需项。

配置:

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

## RequestHeadersAllowed

键 RequestHeadersAllowed 的值为一个以分号分隔的允许标头名称列表,为必需项。

配置:

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

## X-Forwarded

添加包含原始客户端请求信息的标头

键 X-Forwarded 的值为要应用于下面列出的所有 X-Forwarded-* 标头的默认操作(Set、Append、Remove、Off),默认值为 Set,为必需项。键 For、Proto、Host、Prefix 的值分别是要应用于对应标头的操作(参见下文的 X-Forwarded),均为可选项。键 HeaderPrefix 的值为标头名称前缀,默认值为 "X-Forwarded-",为可选项。

操作值为 "Off" 时会完全禁用该转换。

配置:

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

## Forwarded

添加一个包含原始客户端请求信息的标头

键 Forwarded 的值为一个以逗号分隔的列表,可包含 for、by、proto、host 中的任意值,没有默认值,为必需项。键 ForFormat 和 ByFormat 的可选值为 Random、RandomAndPort、RandomAndRandomPort、Unknown、UnknownAndPort、UnknownAndRandomPort、Ip、IpAndPort、IpAndRandomPort,默认值均为 Random,为可选项。键 Action 的值为要应用于该标头的操作(Set、Append、Remove、Off),默认值为 Set,为可选项。

配置:

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

## ClientCert

将入站连接上使用的客户端证书作为标头转发给目标

键 ClientCert 的值为标头名称,为必需项。

配置:

JSON { "ClientCert": "X-Client-Cert" }

代码:

C# routeConfig = routeConfig.WithTransformClientCertHeader(headerName: "X-Client-Cert");

C# transformBuilderContext.AddClientCertHeader(headerName: "X-Client-Cert");

示例:

X-Client-Cert: SSdtIGEgY2VydGlmaWNhdGU...

由于入站连接和出站连接是相互独立的,因此需要一种方式将任何入站客户端证书传递给目标服务器。此转换会将从 HttpContext.Connection.ClientCertificate 获取的客户端证书进行 Base64 编码,并将其设置为给定标头名称的值。目标服务器可能需要该证书来对客户端进行身份验证。目前没有标准定义此标头,各实现方式各不相同,请检查你的目标服务器是否支持。

默认情况下,服务器只会对传入的客户端证书执行最基本的验证。该证书应当在代理或目标中进行验证,详见客户端证书身份验证文档。

只有当客户端证书已经存在于连接上时,此转换才会生效。如果需要按路由逐一从客户端请求证书,请参阅可选证书文档。

:::note
本文作者在 AI 的协助下创作本文。了解详情
:::
