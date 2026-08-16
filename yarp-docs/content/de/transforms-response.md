---
slug: transforms-response
title: Antwort- und Trailer-Transformationen
lede: >-
  Standardmäßig werden alle Antwortheader und Trailer von der Proxyantwort in die ausgehende
  Clientantwort
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response
lastUpdated: 2026-08-11
---

## Antwort und Antwort-Trailer

Standardmäßig werden alle Antwortheader und Trailer von der Proxyantwort in die ausgehende Clientantwort kopiert. Antwort- und Antwort-Trailer-Transformationen können angeben, ob sie nur für erfolgreiche Antworten oder für alle Antworten angewendet werden sollen.

Im Code werden diese als Ableitungen der abstrakten Klassen ResponseTransform und ResponseTrailersTransform implementiert.

## ResponseHeadersCopy

Legt fest, ob Antwortheader des Ziels an den Client kopiert werden

Schlüssel Wert Standard Tabelle erweitern ResponseHeadersCopy true/false true Erforderlich ja

Konfiguration:

JSON { "ResponseHeadersCopy": "false" }

Code:

C# routeConfig = routeConfig.WithTransformCopyResponseHeaders(copy: false);

C# transformBuilderContext.CopyResponseHeaders = false;

Dies legt fest, ob alle Proxy-Antwortheader in die Clientantwort kopiert werden. Diese Einstellung ist standardmäßig aktiviert und kann deaktiviert werden, indem die Transformation mit dem Wert false konfiguriert wird. Transformationen, die sich auf bestimmte Header beziehen, werden weiterhin ausgeführt, auch wenn dies deaktiviert ist.

## ResponseHeader

## Fügt Antwortheader hinzu oder ersetzt sie

Schlüssel Wert Standard Tabelle erweitern ResponseHeader Der Headername (keine) Erforderlich Set/Append Der Headerwert (keine) ja When Success/Always/Failure Success ja nein

Konfiguration:

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

## Entfernt Antwortheader

Schlüssel Wert Standard Erforderlich ResponseHeaderRemove Der Headername (keine) ja When Success/Always/Failure Success nein

Konfiguration:

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

Schlüssel Wert Erforderlich ResponseHeadersAllowed Eine durch Semikolon getrennte Liste zulässiger Headernamen. ja

Konfiguration:

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

Legt fest, ob nachgestellte Antwortheader (Trailer) des Ziels an den Client kopiert werden

Schlüssel Wert Standard Tabelle erweitern ResponseTrailersCopy true/false true Erforderlich ja

Konfiguration:

JSON { "ResponseTrailersCopy": "false" }

Code:

C# routeConfig = routeConfig.WithTransformCopyResponseTrailers(copy: false);

C# transformBuilderContext.CopyResponseTrailers = false;

Dies legt fest, ob alle Proxy-Antwort-Trailer in die Clientantwort kopiert werden. Diese Einstellung ist standardmäßig aktiviert und kann deaktiviert werden, indem die Transformation mit dem Wert false konfiguriert wird. Transformationen, die sich auf bestimmte Header beziehen, werden weiterhin ausgeführt, auch wenn dies deaktiviert ist.

## ResponseTrailer

## Fügt Antwort-Trailer hinzu oder ersetzt sie

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response?view=aspnetcore-9.0 Tabelle erweitern

5/8

Schlüssel Wert Standard Erforderlich ResponseTrailer Set/Append Der Headername (keine) ja When Der Headerwert (keine) ja

Success/Always/Failure Success nein

Konfiguration:

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

## Entfernt Antwort-Trailer

Schlüssel Tabelle erweitern ResponseTrailerRemove When Wert Standard Erforderlich Der Headername (keine) ja Success/Always/Failure Success nein

Konfiguration:

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

ja Schlüssel Wert ResponseTrailersAllowed Eine durch Semikolon getrennte Liste zulässiger Headernamen.

Konfiguration:

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
