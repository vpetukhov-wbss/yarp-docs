---
slug: transforms-response
title: 响应与响应尾部转换
lede: >-
  默认情况下,系统会将所有响应标头和响应尾部从代理响应复制到发往客户端的响应中。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response
lastUpdated: 2026-08-11
---

## 响应与响应尾部

默认情况下,系统会将所有响应标头和响应尾部从代理响应复制到发往客户端的响应中。响应转换和响应尾部转换可以指定自己应仅应用于成功的响应,还是应用于所有响应。

在代码中,它们分别通过派生自抽象类 ResponseTransform 和 ResponseTrailersTransform 来实现。

## ResponseHeadersCopy

设置是否将目标的响应标头复制到客户端

键 ResponseHeadersCopy 的值为 true/false,默认值为 true,为必需项。

配置:

JSON { "ResponseHeadersCopy": "false" }

代码:

C# routeConfig = routeConfig.WithTransformCopyResponseHeaders(copy: false);

C# transformBuilderContext.CopyResponseHeaders = false;

此设置用于控制是否将所有代理响应标头复制到客户端响应中。该设置默认处于启用状态,可以通过将转换配置为 false 值来禁用。即使禁用了此设置,引用特定标头的转换仍然会运行。

## ResponseHeader

## 添加或替换响应标头

键 ResponseHeader 的值为标头名称,没有默认值,为必需项。键 Set/Append 的值为标头值,没有默认值,同样为必需项。键 When 的值为 Success/Always/Failure 之一,默认值为 Success,为可选项。

配置:

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

## 移除响应标头

键 ResponseHeaderRemove 的值为标头名称,没有默认值,为必需项。键 When 的值为 Success/Always/Failure 之一,默认值为 Success,为可选项。

配置:

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

键 ResponseHeadersAllowed 的值为一个以分号分隔的允许标头名称列表,为必需项。

配置:

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

设置是否将目标的响应尾部标头复制到客户端

键 ResponseTrailersCopy 的值为 true/false,默认值为 true,为必需项。

配置:

JSON { "ResponseTrailersCopy": "false" }

代码:

C# routeConfig = routeConfig.WithTransformCopyResponseTrailers(copy: false);

C# transformBuilderContext.CopyResponseTrailers = false;

此设置用于控制是否将所有代理响应尾部标头复制到客户端响应中。该设置默认处于启用状态,可以通过将转换配置为 false 值来禁用。即使禁用了此设置,引用特定标头的转换仍然会运行。

## ResponseTrailer

## 添加或替换响应尾部标头

键 ResponseTrailer 的值为标头名称,没有默认值,为必需项。键 Set/Append 的值为标头值,没有默认值,同样为必需项。键 When 的值为 Success/Always/Failure 之一,默认值为 Success,为可选项。

配置:

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

## 移除响应尾部标头

键 ResponseTrailerRemove 的值为标头名称,没有默认值,为必需项。键 When 的值为 Success/Always/Failure 之一,默认值为 Success,为可选项。

配置:

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

键 ResponseTrailersAllowed 的值为一个以分号分隔的允许标头名称列表,为必需项。

配置:

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
