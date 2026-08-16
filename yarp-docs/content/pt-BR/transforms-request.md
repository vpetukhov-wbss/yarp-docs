---
slug: transforms-request
title: Transformações de requisição
lede: >-
  As transformações de requisição incluem o caminho, a query, a versão HTTP, o método e os
  cabeçalhos da requisição. No código, elas são representadas pela
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request
lastUpdated: 2026-08-11
---

As transformações de requisição incluem o caminho, a query, a versão HTTP, o método e os cabeçalhos da requisição. No código, elas são representadas pelo objeto RequestTransformContext e processadas por implementações da classe abstrata RequestTransform.

Observações:

O esquema (http/https), a autoridade (authority) e o path base da requisição de proxy são obtidos do endereço do servidor de destino ( https://localhost:10001/Path/Base no exemplo acima) e não devem ser modificados pelas transformações. O cabeçalho Host pode ser sobrescrito por transformações independentemente da autoridade; veja RequestHeader abaixo. A propriedade PathBase original da requisição não é usada ao construir a requisição de proxy; veja X-Forwarded. Por padrão, todos os cabeçalhos da requisição de entrada são copiados para a requisição de proxy, com exceção do cabeçalho Host (veja Defaults Defaults). Os cabeçalhos X-Forwarded também são adicionados por padrão. Esses comportamentos podem ser configurados usando as transformações a seguir. Cabeçalhos de requisição adicionais podem ser especificados, ou cabeçalhos de requisição podem ser excluídos definindo-os com um valor vazio.

A seguir estão as transformações internas (built-in), identificadas por sua chave de configuração principal. Essas transformações são aplicadas na ordem em que são especificadas na configuração da rota.

## PathPrefix

## Modifica o caminho da requisição adicionando um valor de prefixo

Key Value Required PathPrefix A path starting with a '/' yes

Configuração:

JSON { "PathPrefix": "/prefix" }

Código:

C# routeConfig = routeConfig.WithTransformPathPrefix(prefix: "/prefix");

C# transformBuilderContext.AddPathPrefix(prefix: "/prefix");

Exemplo: /request/path se torna /prefix/request/path Isso prefixará o caminho da requisição com o valor informado.

## PathRemovePrefix

## Modifica o caminho da requisição removendo um valor de prefixo

Key Value Expand table PathRemovePrefix A path starting with a '/' Required yes Config: 1/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathRemovePrefix": "/prefix" }

Código:

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

## Substitui o caminho da requisição pelo valor especificado

Key Value Required PathSet A path starting with a '/' yes

Configuração:

JSON { "PathSet": "/newpath" }

Código:

C# routeConfig = routeConfig.WithTransformPathSet(path: "/newpath");

C# transformBuilderContext.AddPathSet(path: "/newpath");

Exemplo: /request/path se torna /newpath Isso definirá o caminho da requisição com o valor informado.

## PathPattern

## Substitui o caminho da requisição usando um modelo de padrão

Key Value Expand table PathPattern A path template starting with a '/' Required yes Config: 2/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathPattern": "/my/{plugin}/api/{**remainder}" }

Código:

C# routeConfig = routeConfig.WithTransformPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

C# transformBuilderContext.AddPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

Isso definirá o caminho da requisição com o valor informado e substituirá quaisquer segmentos {} pelo valor de rota associado. Segmentos {} sem um valor de rota correspondente são removidos. O segmento {} final pode ser marcado como {**remainder} para indicar que se trata de um segmento coringa (catch-all) que pode conter múltiplos segmentos de caminho. Consulte a documentação de roteamento do ASP.NET Core para mais informações sobre modelos de rota.

Exemplo:

Step Value Route definition Request path /api/{plugin}/stuff/{**remainder} Plugin value /api/v1/stuff/more/stuff Remainder value v1 PathPattern more/stuff Result /my/{plugin}/api/{**remainder} /my/v1/api/more/stuff

## QueryValueParameter

Adiciona ou substitui parâmetros na cadeia de consulta (query string) da requisição

Key Value Expand table QueryValueParameter Name of a query string parameter Required Set/Append Static value yes yes Config: 3/13 JSON

{ "QueryValueParameter": "foo", "Append": "bar"

}

Código:

C# routeConfig = routeConfig.WithTransformQueryValue(queryKey: "foo", value: "bar", append: true);

C# transformBuilderContext.AddQueryValue(queryKey: "foo", value: "bar", append: true);

Isso adicionará um parâmetro de query com o nome foo e o definirá com o valor estático bar . https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 Example: Value Step Query ?a=b QueryValueParameter foo Append remainder Result ?a=b&foo=remainder

## QueryRouteParameter

Adiciona ou substitui um parâmetro de query com um valor da configuração de rota

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

Remove o parâmetro especificado da cadeia de consulta (query string) da requisição

Key Value Expand table QueryRemoveParameter Name of a query string parameter Required yes Config: JSON { "QueryRemoveParameter": "foo" }

Código:

C# routeConfig = routeConfig.WithTransformQueryRemoveKey(queryKey: "foo");

C# transformBuilderContext.AddQueryRemoveKey(queryKey: "foo");

Isso removerá um parâmetro de query com o nome foo, se presente na requisição. Exemplo:

Step Value Request path QueryRemoveParameter ?a=b&foo=c Result foo ?a=b

## HttpMethodChange

## Altera o método HTTP usado na requisição

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

Define se os cabeçalhos da requisição de entrada são copiados para a requisição de saída

Key Value Default Expand table RequestHeadersCopy true/false true Required yes Config:

JSON { "RequestHeadersCopy": "false" }

Código:

C# routeConfig = routeConfig.WithTransformCopyRequestHeaders(copy: false);

C# transformBuilderContext.CopyRequestHeaders = false;

Isso define se todos os cabeçalhos da requisição de entrada são copiados para a requisição de proxy. Essa configuração é habilitada por padrão e pode ser desabilitada configurando a transformação com o valor false. Transformações que referenciam cabeçalhos específicos ainda serão executadas mesmo que isso esteja desabilitado.

## RequestHeaderOriginalHost

Especifica se o cabeçalho Host da requisição de entrada deve ser copiado para a requisição de proxy

Key Value Default Expand table RequestHeaderOriginalHost true/false false Required yes Config:

JSON { "RequestHeaderOriginalHost": "true" }

C# routeConfig = routeConfig.WithTransformUseOriginalHostHeader(useOriginal: true);

C# transformBuilderContext.AddOriginalHost(true);

Isso especifica se o cabeçalho Host da requisição de entrada deve ser copiado para a requisição de proxy. Essa configuração é desabilitada por padrão e pode ser habilitada configurando a transformação com o valor true. Transformações que referenciam diretamente o cabeçalho Host substituirão esta transformação.

## RequestHeader

## Adiciona ou substitui cabeçalhos de requisição

Key Expand table RequestHeader Set/Append Value Required The header name yes Config: The header value yes

JSON {

"RequestHeader": "MyHeader", "Set": "MyValue" }

Código:

C# routeConfig = routeConfig.WithTransformRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

C# transformBuilderContext.AddRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

Exemplo:

MyHeader: MyValue

Isso define ou anexa o valor do cabeçalho informado. Set substitui qualquer cabeçalho existente. Append adiciona um cabeçalho adicional com o valor informado. Nota: definir "" como valor de cabeçalho não é recomendado e pode causar comportamento indefinido.

## RequestHeaderRouteValue

Adiciona ou substitui um cabeçalho com um valor da configuração de rota

Key Value Expand table RequestHeader Name of a query string parameter Required Set/Append The name of a route value yes yes

Configuração:

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

## Remove cabeçalhos de requisição

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

Adiciona cabeçalhos com informações sobre a requisição original do cliente

Key Value Default Required X-Forwarded Default action (Set, Append, Remove, Off) to apply to all X-Forwarded-* listed below Set yes For Action to apply to this header * See X-Forwarded no Proto Action to apply to this header * See X-Forwarded no Host Action to apply to this header * See X-Forwarded no Prefix Action to apply to this header * See X-Forwarded no HeaderPrefix The header name prefix "X-Forwarded-" no

A ação "Off" desabilita completamente a transformação.

Configuração:

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

Adiciona um cabeçalho com informações sobre a requisição original do cliente

Key Value Default Re

Forwarded A comma separated list containing any of these values: for,by,proto,host (none) ye

ForFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

ByFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

Action Action to apply to this header (Set, Append, Remove, Off) Set no

Configuração:

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

Encaminha o certificado de cliente usado na conexão de entrada como um cabeçalho para o destino

Key Value Required ClientCert The header name yes

Configuração:

JSON { "ClientCert": "X-Client-Cert" }

Código:

C# routeConfig = routeConfig.WithTransformClientCertHeader(headerName: "X-Client-Cert");

C# transformBuilderContext.AddClientCertHeader(headerName: "X-Client-Cert");

Exemplo:

X-Client-Cert: SSdtIGEgY2VydGlmaWNhdGU...

Como as conexões de entrada e saída são independentes, é necessário haver uma forma de passar qualquer certificado de cliente de entrada para o servidor de destino. Esta transformação faz com que o certificado de cliente obtido de HttpContext.Connection.ClientCertificate seja codificado em Base64 e definido como o valor do cabeçalho informado. O servidor de destino pode precisar desse certificado para autenticar o cliente. Não existe um padrão que defina esse cabeçalho e as implementações variam; verifique o suporte no seu servidor de destino.

Por padrão, os servidores realizam validação mínima do certificado de cliente recebido. O certificado deve ser validado no proxy ou no destino; consulte a documentação de autenticação por certificado de cliente para mais detalhes.

Esta transformação só será aplicada se o certificado de cliente já estiver presente na conexão. Consulte a documentação de certificados opcionais caso ele precise ser solicitado ao cliente por rota.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
