---
slug: transforms-request
title: Transformaciones de solicitud
lede: >-
  Las transformaciones de solicitud incluyen la ruta de acceso, la cadena de consulta, la versión
  HTTP, el método y los encabezados de la solicitud. En el código, se representan mediante el
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request
lastUpdated: 2026-08-11
---

Las transformaciones de solicitud incluyen la ruta de acceso, la cadena de consulta, la versión HTTP, el método y los encabezados de la solicitud. En el código, se representan mediante el objeto RequestTransformContext y se procesan mediante implementaciones de la clase abstracta RequestTransform.

Notas:

El esquema de la solicitud de proxy (http/https), la autoridad y la base de ruta de acceso se toman de la dirección del servidor de destino ( https://localhost:10001/Path/Base en el ejemplo anterior) y las transformaciones no deben modificarlos. El encabezado Host se puede reemplazar mediante transformaciones con independencia de la autoridad; véase RequestHeader más abajo. La propiedad PathBase original de la solicitud no se usa al construir la solicitud de proxy; véase X-Forwarded. De forma predeterminada, todos los encabezados de la solicitud entrante se copian en la solicitud de proxy, con la excepción del encabezado Host (véase «Valores predeterminados»). Los encabezados X-Forwarded también se agregan de forma predeterminada. Estos comportamientos se pueden configurar mediante las siguientes transformaciones. Se pueden especificar encabezados de solicitud adicionales, o bien excluir encabezados de solicitud estableciéndolos en un valor vacío.

A continuación se muestran las transformaciones integradas, identificadas por su clave de configuración principal. Estas transformaciones se aplican en el orden en que se especifican en la configuración de la ruta.

## PathPrefix

## Modifica la ruta de acceso de la solicitud agregando un valor de prefijo

Clave: PathPrefix. Valor: una ruta que comience con «/». Obligatorio: sí.

Configuración:

JSON { "PathPrefix": "/prefix" }

Código:

C# routeConfig = routeConfig.WithTransformPathPrefix(prefix: "/prefix");

C# transformBuilderContext.AddPathPrefix(prefix: "/prefix");

Ejemplo: /request/path se convierte en /prefix/request/path. Esto antepone el valor indicado a la ruta de acceso de la solicitud.

## PathRemovePrefix

## Modifica la ruta de acceso de la solicitud quitando un valor de prefijo

Clave: PathRemovePrefix. Valor: una ruta que comience con «/». Obligatorio: sí.

Configuración:

JSON { "PathRemovePrefix": "/prefix" }

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

## Reemplaza la ruta de acceso de la solicitud por el valor especificado

Clave: PathSet. Valor: una ruta que comience con «/». Obligatorio: sí.

Configuración:

JSON { "PathSet": "/newpath" }

Código:

C# routeConfig = routeConfig.WithTransformPathSet(path: "/newpath");

C# transformBuilderContext.AddPathSet(path: "/newpath");

Ejemplo: /request/path se convierte en /newpath. Esto establece la ruta de acceso de la solicitud con el valor indicado.

## PathPattern

## Reemplaza la ruta de acceso de la solicitud mediante una plantilla de patrón

Clave: PathPattern. Valor: una plantilla de ruta que comience con «/». Obligatorio: sí.

Configuración:

JSON { "PathPattern": "/my/{plugin}/api/{**remainder}" }

Código:

C# routeConfig = routeConfig.WithTransformPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

C# transformBuilderContext.AddPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

Esto establece la ruta de acceso de la solicitud con el valor indicado y reemplaza cualquier segmento {} por el valor de ruta asociado. Los segmentos {} sin un valor de ruta coincidente se quitan. El segmento {} final se puede marcar como {**remainder} para indicar que es un segmento de captura general que puede contener varios segmentos de ruta. Consulte la documentación de enrutamiento de ASP.NET Core para obtener más información sobre las plantillas de ruta.

Ejemplo: para la definición de ruta con ruta de acceso de solicitud /api/{plugin}/stuff/{**remainder}, un valor de plugin igual a v1 y un valor de remainder igual a more/stuff, al aplicar PathPattern con /my/{plugin}/api/{**remainder} se obtiene el resultado /my/v1/api/more/stuff.

## QueryValueParameter

Agrega o reemplaza parámetros en la cadena de consulta de la solicitud.

Clave: QueryValueParameter (nombre de un parámetro de cadena de consulta). Valor: Set/Append (un valor estático). Ambos son obligatorios.

Configuración:

JSON { "QueryValueParameter": "foo", "Append": "bar" }

Código:

C# routeConfig = routeConfig.WithTransformQueryValue(queryKey: "foo", value: "bar", append: true);

C# transformBuilderContext.AddQueryValue(queryKey: "foo", value: "bar", append: true);

Esto agrega un parámetro de cadena de consulta con el nombre foo y lo establece en el valor estático bar. Ejemplo: partiendo de la consulta ?a=b, con QueryValueParameter igual a foo y Append igual a remainder, el resultado es ?a=b&foo=remainder.

## QueryRouteParameter

Agrega o reemplaza un parámetro de cadena de consulta con un valor procedente de la configuración de la ruta.

Clave: QueryRouteParameter (nombre de un parámetro de cadena de consulta). Valor: Set/Append (el nombre de un valor de ruta). Ambos son obligatorios.

Configuración:

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

Quita el parámetro indicado de la cadena de consulta de la solicitud.

Clave: QueryRemoveParameter (nombre de un parámetro de cadena de consulta). Obligatorio: sí.

Configuración:

JSON { "QueryRemoveParameter": "foo" }

Código:

C# routeConfig = routeConfig.WithTransformQueryRemoveKey(queryKey: "foo");

C# transformBuilderContext.AddQueryRemoveKey(queryKey: "foo");

Esto quita, si está presente en la solicitud, un parámetro de cadena de consulta con el nombre foo. Ejemplo: partiendo de la ruta de solicitud ?a=b&foo=c, con QueryRemoveParameter igual a foo, el resultado es ?a=b.

## HttpMethodChange

## Cambia el método HTTP usado en la solicitud

Clave: HttpMethodChange (el método HTTP que se debe reemplazar). Valor: Set (el nuevo método HTTP). Ambos son obligatorios.

Configuración:

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

Establece si los encabezados de la solicitud entrante se copian en la solicitud saliente.

Clave: RequestHeadersCopy. Valor: true/false. Predeterminado: true. Obligatorio: sí.

Configuración:

JSON { "RequestHeadersCopy": "false" }

Código:

C# routeConfig = routeConfig.WithTransformCopyRequestHeaders(copy: false);

C# transformBuilderContext.CopyRequestHeaders = false;

Esto establece si todos los encabezados de la solicitud entrante se copian en la solicitud de proxy. Este valor está habilitado de forma predeterminada y se puede deshabilitar configurando la transformación con el valor false. Las transformaciones que hacen referencia a encabezados específicos se seguirán ejecutando aunque esta opción esté deshabilitada.

## RequestHeaderOriginalHost

Especifica si el encabezado Host de la solicitud entrante se debe copiar en la solicitud de proxy.

Clave: RequestHeaderOriginalHost. Valor: true/false. Predeterminado: false. Obligatorio: sí.

Configuración:

JSON { "RequestHeaderOriginalHost": "true" }

C# routeConfig = routeConfig.WithTransformUseOriginalHostHeader(useOriginal: true);

C# transformBuilderContext.AddOriginalHost(true);

Esto especifica si el encabezado Host de la solicitud entrante se debe copiar en la solicitud de proxy. Este valor está deshabilitado de forma predeterminada y se puede habilitar configurando la transformación con el valor true. Las transformaciones que hacen referencia directa al encabezado Host tendrán prioridad sobre esta.

## RequestHeader

## Agrega o reemplaza encabezados de solicitud

Clave: RequestHeader (el nombre del encabezado). Valor: Set/Append (el valor del encabezado). Ambos son obligatorios.

Configuración:

JSON { "RequestHeader": "MyHeader", "Set": "MyValue" }

Código:

C# routeConfig = routeConfig.WithTransformRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

C# transformBuilderContext.AddRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

Ejemplo:

MyHeader: MyValue

Esto establece o agrega el valor del encabezado indicado. Set reemplaza cualquier encabezado existente. Append agrega un encabezado adicional con el valor indicado. Nota: no se recomienda establecer "" como valor de encabezado, ya que puede causar un comportamiento indefinido.

## RequestHeaderRouteValue

Agrega o reemplaza un encabezado con un valor procedente de la configuración de la ruta.

Clave: RequestHeader (nombre de un parámetro de cadena de consulta). Valor: Set/Append (el nombre de un valor de ruta). Ambos son obligatorios.

Configuración:

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

## Quita encabezados de solicitud

Clave: RequestHeaderRemove (el nombre del encabezado). Obligatorio: sí.

Configuración:

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

Clave: RequestHeadersAllowed (una lista de nombres de encabezado permitidos, separados por punto y coma). Obligatorio: sí.

Configuración:

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

Agrega encabezados con información sobre la solicitud original del cliente.

- Clave X-Forwarded: acción predeterminada (Set, Append, Remove, Off) aplicable a todos los encabezados X-Forwarded-* que se indican a continuación. Valor predeterminado: Set. Obligatorio: sí.
- For: la acción que se aplica a este encabezado en particular. Valor predeterminado: el que indique X-Forwarded. No obligatorio.
- Proto: la acción que se aplica a este encabezado en particular. Valor predeterminado: el que indique X-Forwarded. No obligatorio.
- Host: la acción que se aplica a este encabezado en particular. Valor predeterminado: el que indique X-Forwarded. No obligatorio.
- Prefix: la acción que se aplica a este encabezado en particular. Valor predeterminado: el que indique X-Forwarded. No obligatorio.
- HeaderPrefix: el prefijo del nombre de encabezado. Valor predeterminado: "X-Forwarded-". No obligatorio.

La acción "Off" deshabilita completamente la transformación.

Configuración:

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

Agrega un encabezado con información sobre la solicitud original del cliente.

- Clave Forwarded: una lista separada por comas que contiene cualquiera de estos valores: for, by, proto, host. Valor predeterminado: ninguno. Obligatorio: sí.
- ForFormat: Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort. Valor predeterminado: Random. No obligatorio.
- ByFormat: Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort. Valor predeterminado: Random. No obligatorio.
- Action: la acción que se aplica a este encabezado (Set, Append, Remove, Off). Valor predeterminado: Set. No obligatorio.

Configuración:

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

Reenvía al destino, como encabezado, el certificado de cliente usado en la conexión entrante.

Clave: ClientCert (el nombre del encabezado). Obligatorio: sí.

Configuración:

JSON { "ClientCert": "X-Client-Cert" }

Código:

C# routeConfig = routeConfig.WithTransformClientCertHeader(headerName: "X-Client-Cert");

C# transformBuilderContext.AddClientCertHeader(headerName: "X-Client-Cert");

Ejemplo:

X-Client-Cert: SSdtIGEgY2VydGlmaWNhdGU...

Dado que las conexiones entrante y saliente son independientes, hace falta una forma de pasar al servidor de destino cualquier certificado de cliente presente en la conexión entrante. Esta transformación toma el certificado de cliente de HttpContext.Connection.ClientCertificate, lo codifica en Base64 y lo establece como valor del encabezado indicado. Es posible que el servidor de destino necesite ese certificado para autenticar al cliente. No existe un estándar que defina este encabezado y las implementaciones varían; compruebe si su servidor de destino lo admite.

De forma predeterminada, los servidores realizan una validación mínima del certificado de cliente entrante. El certificado se debe validar en el proxy o en el destino; consulte la documentación de autenticación con certificados de cliente para obtener más información.

Esta transformación solo se aplica si el certificado de cliente ya está presente en la conexión. Consulte la documentación sobre certificados opcionales si es necesario solicitarlo al cliente por cada ruta.

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
