---
slug: transforms-response
title: Transformations de réponse et de trailer
lede: >-
  Par défaut, tous les en-têtes et trailers de réponse sont copiés de la réponse du proxy vers la
  réponse envoyée au client
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response
lastUpdated: 2026-08-11
---

## Réponse et trailers de réponse

Par défaut, tous les en-têtes et trailers de réponse sont copiés de la réponse du proxy vers la réponse envoyée au client. Les transformations de réponse et de trailer de réponse peuvent préciser si elles doivent s'appliquer uniquement aux réponses réussies ou à toutes les réponses.

En code, elles sont implémentées comme des dérivations des classes abstraites ResponseTransform et ResponseTrailersTransform.

## ResponseHeadersCopy

Définit si les en-têtes de réponse de la destination sont copiés vers le client

Key Value Default Expand table ResponseHeadersCopy true/false true Required yes

Configuration :

JSON { "ResponseHeadersCopy": "false" }

Code :

C# routeConfig = routeConfig.WithTransformCopyResponseHeaders(copy: false);

C# transformBuilderContext.CopyResponseHeaders = false;

Ceci définit si tous les en-têtes de réponse du proxy sont copiés vers la réponse du client. Ce paramètre est activé par défaut et peut être désactivé en configurant la transformation avec la valeur false . Les transformations qui référencent des en-têtes spécifiques continueront de s'exécuter même si ce paramètre est désactivé.

## ResponseHeader

## Ajoute ou remplace des en-têtes de réponse

Key Value Default Expand table ResponseHeader The header name (none) Required Set/Append The header value (none) yes When Success/Always/Failure Success yes no

Configuration :

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

## Supprime des en-têtes de réponse

Key Value Default Required ResponseHeaderRemove The header name (none) yes When Success/Always/Failure Success no

Configuration :

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

Key Value Required ResponseHeadersAllowed A semicolon separated list of allowed header names. yes

Configuration :

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

Définit si les trailers de réponse de la destination sont copiés vers le client

Key Value Default Expand table ResponseTrailersCopy true/false true Required yes

Configuration :

JSON { "ResponseTrailersCopy": "false" }

Code :

C# routeConfig = routeConfig.WithTransformCopyResponseTrailers(copy: false);

C# transformBuilderContext.CopyResponseTrailers = false;

Ceci définit si tous les trailers de réponse du proxy sont copiés vers la réponse du client. Ce paramètre est activé par défaut et peut être désactivé en configurant la transformation avec la valeur false . Les transformations qui référencent des en-têtes spécifiques continueront de s'exécuter même si ce paramètre est désactivé.

## ResponseTrailer

## Ajoute ou remplace des trailers de réponse

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response?view=aspnetcore-9.0 Expand table

5/8

Key Value Default Required ResponseTrailer Set/Append The header name (none) yes When The header value (none) yes

Success/Always/Failure Success no

Configuration :

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

## Supprime des trailers de réponse

Key Expand table ResponseTrailerRemove When Value Default Required The header name (none) yes Success/Always/Failure Success no

Configuration :

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

yes Key Value ResponseTrailersAllowed A semicolon separated list of allowed header names.

Configuration :

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
