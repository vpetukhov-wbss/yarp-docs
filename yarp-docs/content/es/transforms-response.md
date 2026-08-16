---
slug: transforms-response
title: Transformaciones de respuesta y trailers
lede: >-
  Todos los encabezados y trailers de la respuesta se copian de forma predeterminada de la
  respuesta que pasa por el proxy a la respuesta saliente del cliente
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response
lastUpdated: 2026-08-11
---

## Respuesta y trailers de respuesta

Todos los encabezados y trailers de la respuesta se copian de forma predeterminada de la respuesta que pasa por el proxy a la respuesta saliente del cliente. Las transformaciones de respuesta y de trailers de respuesta pueden especificar si deben aplicarse solo a las respuestas correctas o a todas las respuestas.

En el código, se implementan como derivaciones de las clases abstractas ResponseTransform y ResponseTrailersTransform.

## ResponseHeadersCopy

Establece si los encabezados de respuesta del destino se copian al cliente.

Clave: ResponseHeadersCopy. Valor: true/false. Predeterminado: true. Obligatorio: sí.

Configuración:

JSON { "ResponseHeadersCopy": "false" }

Código:

C# routeConfig = routeConfig.WithTransformCopyResponseHeaders(copy: false);

C# transformBuilderContext.CopyResponseHeaders = false;

Esto establece si todos los encabezados de la respuesta de proxy se copian en la respuesta al cliente. Este valor está habilitado de forma predeterminada y se puede deshabilitar configurando la transformación con el valor false. Las transformaciones que hacen referencia a encabezados específicos se seguirán ejecutando aunque esta opción esté deshabilitada.

## ResponseHeader

## Agrega o reemplaza encabezados de respuesta

Clave: ResponseHeader (el nombre del encabezado). Predeterminado: ninguno. Obligatorio: sí. Valor: Set/Append (el valor del encabezado). Predeterminado: ninguno. Obligatorio: sí. When: Success/Always/Failure. Predeterminado: Success. Obligatorio: no.

Configuración:

```json
   {
       "ResponseHeader": "HeaderName",
       "Append": "value",
       "When": "Success"
   }
Code:
```

```csharp
   routeConfig = routeConfig.WithTransformResponseHeader(headerName: "HeaderName",
   value: "value", append: true, ResponseCondition.Success);
    C#
   transformBuilderContext.AddResponseHeader(headerName: "HeaderName", value:
   "value", append: true, always: ResponseCondition.Success);
Example:
   HeaderName: value
This sets or appends the value for the named response header. Set replaces any existing
header. Append adds an additional header with the given value. Note: setting "" as a header
value is not recommended and can cause an undefined behavior.
When specifies if the response header should be included for all, successful, or failure
responses. Any response with a status code less than 400 is considered a success.
```

## ResponseHeaderRemove

## Quita encabezados de respuesta

Clave: ResponseHeaderRemove (el nombre del encabezado). Predeterminado: ninguno. Obligatorio: sí. When: Success/Always/Failure. Predeterminado: Success. Obligatorio: no.

Configuración:

```json
{
   "ResponseHeaderRemove": "HeaderName",
   "When": "Success"
}
Code:
```

```csharp
   routeConfig = routeConfig.WithTransformResponseHeaderRemove(headerName:
   "HeaderName", ResponseCondition.Success);
    C#
   transformBuilderContext.AddResponseHeaderRemove(headerName: "HeaderName",
   ResponseCondition.Success);
Example:
HeaderName: value
AnotherHeader: another-value
This removes the named response header.
When specifies if the response header should be removed for all, successful, or failure
responses. Any response with a status code less than 400 is considered a success.
```

## ResponseHeadersAllowed

Clave: ResponseHeadersAllowed (una lista de nombres de encabezado permitidos, separados por punto y coma). Obligatorio: sí.

Configuración:

```json
   {
       "ResponseHeadersAllowed": "Header1;header2"
   }
Code:
```

```csharp
   routeConfig = routeConfig.WithTransformResponseHeadersAllowed("Header1",
   "header2");
```

```csharp
   transformBuilderContext.AddResponseHeadersAllowed("Header1", "header2");
YARP copies most response headers from the proxy response by default (see
ResponseHeadersCopy). Some security models only allow specific headers to be proxied. This
transform disables ResponseHeadersCopy and only copies the given headers. Other transforms
that modify or append to existing headers may be affected if not included in the allow list.
Note that there are some headers YARP does not copy by default since they are connection
specific or otherwise security sensitive (e.g. Connection , Alt-Svc ). Putting those header names
in the allow list will bypass that restriction but is strongly discouraged as it may negatively
affect the functionality of the proxy or cause security vulnerabilities.
Example:
Header1: value1
Header2: value2
AnotherHeader: AnotherValue
Only header1 and header2 are copied from the proxy response.
```

## ResponseTrailersCopy

Establece si los trailers de respuesta del destino se copian al cliente.

Clave: ResponseTrailersCopy. Valor: true/false. Predeterminado: true. Obligatorio: sí.

Configuración:

JSON { "ResponseTrailersCopy": "false" }

C# routeConfig = routeConfig.WithTransformCopyResponseTrailers(copy: false);

C# transformBuilderContext.CopyResponseTrailers = false;

Esto establece si todos los trailers de la respuesta de proxy se copian en la respuesta al cliente. Este valor está habilitado de forma predeterminada y se puede deshabilitar configurando la transformación con el valor false. Las transformaciones que hacen referencia a encabezados específicos se seguirán ejecutando aunque esta opción esté deshabilitada.

## ResponseTrailer

## Agrega o reemplaza trailers de respuesta

Clave: ResponseTrailer (el nombre del encabezado). Predeterminado: ninguno. Obligatorio: sí. Valor: Set/Append (el valor del encabezado). Predeterminado: ninguno. Obligatorio: sí. When: Success/Always/Failure. Predeterminado: Success. Obligatorio: no.

Configuración:

```json
   {
       "ResponseTrailer": "HeaderName",
       "Append": "value",
       "When": "Success"
   }
Code:
```

```csharp
   routeConfig = routeConfig.WithTransformResponseTrailer(headerName: "HeaderName",
   value: "value", append: true, ResponseCondition.Success);
    C#
   transformBuilderContext.AddResponseTrailer(headerName: "HeaderName", value:
   "value", append: true, ResponseCondition.Success);
Example:
HeaderName: value
Response trailers are headers sent at the end of the response body. Support for trailers is
uncommon in HTTP/1.1 implementations but is becoming common in HTTP/2
implementations. Check your client and server for support.
ResponseTrailer follows the same structure and guidance as ResponseHeader.
```

## ResponseTrailerRemove

## Quita trailers de respuesta

Clave: ResponseTrailerRemove (el nombre del encabezado). Predeterminado: ninguno. Obligatorio: sí. When: Success/Always/Failure. Predeterminado: Success. Obligatorio: no.

Configuración:

```json
   {
       "ResponseTrailerRemove": "HeaderName",
       "When": "Success"
   }
Code:
```

```csharp
   routeConfig = routeConfig.WithTransformResponseTrailerRemove(headerName:
   "HeaderName", ResponseCondition.Success);
    C#
   transformBuilderContext.AddResponseTrailerRemove(headerName: "HeaderName",
   ResponseCondition.Success);
Example:
   HeaderName: value
   AnotherHeader: another-value
This removes the named trailing header.
ResponseTrailerRemove follows the same structure and guidance as ResponseHeaderRemove.
```

## ResponseTrailersAllowed

Clave: ResponseTrailersAllowed (una lista de nombres de encabezado permitidos, separados por punto y coma). Obligatorio: sí.

Configuración:

```json
{
   "ResponseTrailersAllowed": "Header1;header2"
}
Code:
```

```csharp
   routeConfig = routeConfig.WithTransformResponseTrailersAllowed("Header1",
   "header2");
```

```csharp
   transformBuilderContext.AddResponseTrailersAllowed("Header1", "header2");
YARP copies most response trailers from the proxy response by default (see
ResponseTrailersCopy). Some security models only allow specific headers to be proxied. This
transform disables ResponseTrailersCopy and only copies the given headers. Other transforms
that modify or append to existing headers may be affected if not included in the allow list.
Note that there are some headers YARP does not copy by default since they are connection
specific or otherwise security sensitive (e.g. Connection , Alt-Svc ). Putting those header names
in the allow list will bypass that restriction but is strongly discouraged as it may negatively
affect the functionality of the proxy or cause security vulnerabilities.
Example:
Header1: value1
Header2: value2
AnotherHeader: AnotherValue
Only header1 and header2 are copied from the proxy response.
 Note: The author created this article with assistance from AI. Learn more
```
