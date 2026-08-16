---
slug: transforms-request
title: Преобразования запросов
lede: >-
  Преобразования запроса затрагивают путь запроса, строку запроса, версию HTTP, метод и заголовки.
  В коде они представлены
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request
lastUpdated: 2026-08-11
---

Преобразования запроса затрагивают путь запроса, строку запроса, версию HTTP, метод и заголовки. В коде они представлены объектом RequestTransformContext и обрабатываются реализациями абстрактного класса RequestTransform.

Примечания:

Схема прокси-запроса (http/https), адрес узла (authority) и базовый путь берутся из адреса сервера назначения (в примере выше — https://localhost:10001/Path/Base) и не должны изменяться преобразованиями. Заголовок Host может быть переопределён преобразованиями независимо от адреса узла — см. RequestHeader ниже. Исходное свойство PathBase запроса не используется при формировании прокси-запроса — см. X-Forwarded. Все входящие заголовки запроса по умолчанию копируются в прокси-запрос, за исключением заголовка Host (см. Defaults Defaults). Заголовки X-Forwarded также добавляются по умолчанию. Это поведение можно настроить с помощью описанных ниже преобразований. Можно указать дополнительные заголовки запроса или исключить заголовки запроса, задав им пустое значение.

Ниже перечислены встроенные преобразования, каждое из которых определяется своим основным ключом конфигурации. Преобразования применяются в том порядке, в котором они указаны в конфигурации маршрута.

## PathPrefix

## Добавляет префикс к пути запроса

Key Value Required PathPrefix A path starting with a '/' yes

Конфигурация:

JSON { "PathPrefix": "/prefix" }

Код:

C# routeConfig = routeConfig.WithTransformPathPrefix(prefix: "/prefix");

C# transformBuilderContext.AddPathPrefix(prefix: "/prefix");

Example: /request/path becomes /prefix/request/path This will prefix the request path with the given value.

## PathRemovePrefix

## Удаляет префикс из пути запроса

Key Value Expand table PathRemovePrefix A path starting with a '/' Required yes Config: 1/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathRemovePrefix": "/prefix" }

Код:

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

## Заменяет путь запроса указанным значением

Key Value Required PathSet A path starting with a '/' yes

Конфигурация:

JSON { "PathSet": "/newpath" }

Код:

C# routeConfig = routeConfig.WithTransformPathSet(path: "/newpath");

C# transformBuilderContext.AddPathSet(path: "/newpath");

Example: /request/path becomes /newpath This will set the request path with the given value.

## PathPattern

## Заменяет путь запроса с помощью шаблона

Key Value Expand table PathPattern A path template starting with a '/' Required yes Config: 2/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathPattern": "/my/{plugin}/api/{**remainder}" }

Код:

C# routeConfig = routeConfig.WithTransformPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

C# transformBuilderContext.AddPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

Это преобразование задаёт путь запроса указанным значением и заменяет любые сегменты {} соответствующим значением маршрута. Сегменты {}, для которых нет соответствующего значения маршрута, удаляются. Последний сегмент {} можно пометить как {**remainder}, чтобы обозначить его как catch-all-сегмент, который может содержать несколько сегментов пути. Дополнительные сведения о шаблонах маршрутов см. в документации ASP.NET Core по маршрутизации.

Пример:

Step Value Route definition Request path /api/{plugin}/stuff/{**remainder} Plugin value /api/v1/stuff/more/stuff Remainder value v1 PathPattern more/stuff Result /my/{plugin}/api/{**remainder} /my/v1/api/more/stuff

## QueryValueParameter

Добавляет или заменяет параметры в строке запроса

Key Value Expand table QueryValueParameter Name of a query string parameter Required Set/Append Static value yes yes Config: 3/13 JSON

{ "QueryValueParameter": "foo", "Append": "bar"

}

Код:

C# routeConfig = routeConfig.WithTransformQueryValue(queryKey: "foo", value: "bar", append: true);

C# transformBuilderContext.AddQueryValue(queryKey: "foo", value: "bar", append: true);

This will add a query string parameter with the name foo and sets it to the static value bar . https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 Example: Value Step Query ?a=b QueryValueParameter foo Append remainder Result ?a=b&foo=remainder

## QueryRouteParameter

Добавляет или заменяет параметр строки запроса значением из конфигурации маршрута

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

## QueryRemoveParameter

Удаляет указанный параметр из строки запроса

Key Value Expand table QueryRemoveParameter Name of a query string parameter Required yes Config: JSON { "QueryRemoveParameter": "foo" }

Код:

C# routeConfig = routeConfig.WithTransformQueryRemoveKey(queryKey: "foo");

C# transformBuilderContext.AddQueryRemoveKey(queryKey: "foo");

Это преобразование удаляет параметр строки запроса с именем foo, если он присутствует в запросе. Пример:

Step Value Request path QueryRemoveParameter ?a=b&foo=c Result foo ?a=b

## HttpMethodChange

## Изменяет HTTP-метод запроса

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

## RequestHeadersCopy

Определяет, копируются ли входящие заголовки запроса в исходящий запрос

Key Value Default Expand table RequestHeadersCopy true/false true Required yes Config:

JSON { "RequestHeadersCopy": "false" }

Код:

C# routeConfig = routeConfig.WithTransformCopyRequestHeaders(copy: false);

C# transformBuilderContext.CopyRequestHeaders = false;

Этот параметр определяет, копируются ли все входящие заголовки запроса в прокси-запрос. По умолчанию эта функция включена и может быть отключена заданием для преобразования значения false. Преобразования, ссылающиеся на конкретные заголовки, всё равно будут выполняться, даже если эта функция отключена.

## RequestHeaderOriginalHost

Определяет, следует ли копировать заголовок Host входящего запроса в прокси-запрос

Key Value Default Expand table RequestHeaderOriginalHost true/false false Required yes Config:

JSON { "RequestHeaderOriginalHost": "true" }

C# routeConfig = routeConfig.WithTransformUseOriginalHostHeader(useOriginal: true);

C# transformBuilderContext.AddOriginalHost(true);

Это преобразование определяет, следует ли копировать заголовок Host входящего запроса в прокси-запрос. По умолчанию эта функция отключена и может быть включена заданием для преобразования значения true. Преобразования, напрямую ссылающиеся на заголовок Host, переопределяют это преобразование.

## RequestHeader

## Добавляет или заменяет заголовки запроса

Key Expand table RequestHeader Set/Append Value Required The header name yes Config: The header value yes

JSON {

"RequestHeader": "MyHeader", "Set": "MyValue" }

Код:

C# routeConfig = routeConfig.WithTransformRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

C# transformBuilderContext.AddRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

Пример:

MyHeader: MyValue

Это преобразование задаёт или добавляет значение для указанного заголовка. Set заменяет существующий заголовок, если он есть. Append добавляет дополнительный заголовок с указанным значением. Примечание: не рекомендуется задавать пустую строку "" в качестве значения заголовка — это может привести к неопределённому поведению.

## RequestHeaderRouteValue

Добавляет или заменяет заголовок значением из конфигурации маршрута

Key Value Expand table RequestHeader Name of a query string parameter Required Set/Append The name of a route value yes yes

Конфигурация:

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

## Удаляет заголовки запроса

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

## RequestHeadersAllowed

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

## X-Forwarded

Добавляет заголовки со сведениями об исходном запросе клиента

Key Value Default Required X-Forwarded Default action (Set, Append, Remove, Off) to apply to all X-Forwarded-* listed below Set yes For Action to apply to this header * See X-Forwarded no Proto Action to apply to this header * See X-Forwarded no Host Action to apply to this header * See X-Forwarded no Prefix Action to apply to this header * See X-Forwarded no HeaderPrefix The header name prefix "X-Forwarded-" no

Значение действия "Off" полностью отключает преобразование.

Конфигурация:

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

Добавляет заголовок со сведениями об исходном запросе клиента

Key Value Default Re

Forwarded A comma separated list containing any of these values: for,by,proto,host (none) ye

ForFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

ByFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

Action Action to apply to this header (Set, Append, Remove, Off) Set no

Конфигурация:

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

Пересылает клиентский сертификат, использованный для входящего подключения, в заголовке к серверу назначения

Key Value Required ClientCert The header name yes

Конфигурация:

JSON { "ClientCert": "X-Client-Cert" }

Код:

C# routeConfig = routeConfig.WithTransformClientCertHeader(headerName: "X-Client-Cert");

C# transformBuilderContext.AddClientCertHeader(headerName: "X-Client-Cert");

Пример:

X-Client-Cert: SSdtIGEgY2VydGlmaWNhdGU...

Поскольку входящее и исходящее подключения независимы друг от друга, необходим способ передать серверу назначения клиентский сертификат, использованный для входящего подключения. Это преобразование берёт клиентский сертификат из HttpContext.Connection.ClientCertificate, кодирует его в Base64 и задаёт как значение указанного заголовка. Серверу назначения этот сертификат может понадобиться для проверки подлинности клиента. Стандарта, определяющего этот заголовок, не существует, реализации различаются — уточните поддержку у вашего сервера назначения.

По умолчанию серверы выполняют лишь минимальную проверку входящего клиентского сертификата. Проверку сертификата следует выполнять либо на прокси, либо на сервере назначения — подробнее см. документацию по проверке подлинности с помощью клиентских сертификатов.

Это преобразование применяется только в том случае, если клиентский сертификат уже присутствует в соединении. Если сертификат нужно запрашивать у клиента для отдельных маршрутов, см. документацию по опциональным сертификатам.

:::note
Эта статья создана автором при содействии ИИ. Подробнее.
:::
