---
slug: transforms-response
title: Преобразования ответов и трейлеров
lede: >-
  Все заголовки и трейлеры ответа копируются из проксируемого ответа в исходящий ответ клиента
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response
lastUpdated: 2026-08-11
---

## Ответ и трейлеры ответа

По умолчанию все заголовки и трейлеры ответа копируются из проксируемого ответа в исходящий ответ клиенту. Преобразования заголовков ответа и трейлеров ответа могут указывать, должны ли они применяться только к успешным ответам или ко всем ответам.

В коде они реализованы как производные от абстрактных классов ResponseTransform и ResponseTrailersTransform.

## ResponseHeadersCopy

Определяет, копируются ли заголовки ответа сервера назначения клиенту

Key Value Default Expand table ResponseHeadersCopy true/false true Required yes

Конфигурация:

JSON { "ResponseHeadersCopy": "false" }

Код:

C# routeConfig = routeConfig.WithTransformCopyResponseHeaders(copy: false);

C# transformBuilderContext.CopyResponseHeaders = false;

Этот параметр определяет, копируются ли все заголовки ответа прокси в ответ клиенту. По умолчанию эта функция включена и может быть отключена заданием для преобразования значения false. Преобразования, ссылающиеся на конкретные заголовки, всё равно будут выполняться, даже если эта функция отключена.

## ResponseHeader

## Добавляет или заменяет заголовки ответа

Key Value Default Expand table ResponseHeader The header name (none) Required Set/Append The header value (none) yes When Success/Always/Failure Success yes no

Конфигурация:

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

## Удаляет заголовки ответа

Key Value Default Required ResponseHeaderRemove The header name (none) yes When Success/Always/Failure Success no

Конфигурация:

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

Конфигурация:

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

Определяет, копируются ли трейлер-заголовки ответа сервера назначения клиенту

Key Value Default Expand table ResponseTrailersCopy true/false true Required yes

Конфигурация:

JSON { "ResponseTrailersCopy": "false" }

Код:

C# routeConfig = routeConfig.WithTransformCopyResponseTrailers(copy: false);

C# transformBuilderContext.CopyResponseTrailers = false;

Этот параметр определяет, копируются ли все трейлеры ответа прокси в ответ клиенту. По умолчанию эта функция включена и может быть отключена заданием для преобразования значения false. Преобразования, ссылающиеся на конкретные заголовки, всё равно будут выполняться, даже если эта функция отключена.

## ResponseTrailer

## Добавляет или заменяет трейлер-заголовки ответа

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response?view=aspnetcore-9.0 Expand table

5/8

Key Value Default Required ResponseTrailer Set/Append The header name (none) yes When The header value (none) yes

Success/Always/Failure Success no

Конфигурация:

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

## Удаляет трейлер-заголовки ответа

Key Expand table ResponseTrailerRemove When Value Default Required The header name (none) yes Success/Always/Failure Success no

Конфигурация:

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

Конфигурация:

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
