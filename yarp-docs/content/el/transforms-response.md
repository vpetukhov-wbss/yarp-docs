---
slug: transforms-response
title: Μετασχηματισμοί απόκρισης και trailer
lede: >-
  Όλες οι κεφαλίδες και τα trailer της απόκρισης αντιγράφονται από την απόκριση του διακομιστή
  μεσολάβησης στην εξερχόμενη απόκριση προς τον client
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response
lastUpdated: 2026-08-11
---

## Απόκριση και trailer απόκρισης

Όλες οι κεφαλίδες και τα trailer της απόκρισης αντιγράφονται από την απόκριση του διακομιστή μεσολάβησης στην εξερχόμενη απόκριση προς τον client, από προεπιλογή. Οι μετασχηματισμοί απόκρισης και trailer απόκρισης μπορούν να καθορίσουν αν θα εφαρμόζονται μόνο για επιτυχημένες αποκρίσεις ή για όλες τις αποκρίσεις.

Στον κώδικα, αυτοί υλοποιούνται ως παράγωγα των αφηρημένων κλάσεων ResponseTransform και ResponseTrailersTransform.

## ResponseHeadersCopy

Ορίζει αν οι κεφαλίδες απόκρισης του προορισμού αντιγράφονται στον client

Key Value Default Expand table ResponseHeadersCopy true/false true Required yes

Διαμόρφωση:

JSON { "ResponseHeadersCopy": "false" }

Κώδικας:

C# routeConfig = routeConfig.WithTransformCopyResponseHeaders(copy: false);

C# transformBuilderContext.CopyResponseHeaders = false;

Αυτό ορίζει αν όλες οι κεφαλίδες απόκρισης του διακομιστή μεσολάβησης αντιγράφονται στην απόκριση προς τον client. Αυτή η ρύθμιση είναι ενεργοποιημένη από προεπιλογή και μπορεί να απενεργοποιηθεί διαμορφώνοντας τον μετασχηματισμό με τιμή false. Μετασχηματισμοί που αναφέρονται σε συγκεκριμένες κεφαλίδες θα εξακολουθήσουν να εκτελούνται ακόμα κι αν αυτό είναι απενεργοποιημένο.

## ResponseHeader

## Προσθέτει ή αντικαθιστά κεφαλίδες απόκρισης

Key Value Default Expand table ResponseHeader Το όνομα της κεφαλίδας (καμία) Required Set/Append Η τιμή της κεφαλίδας (καμία) yes When Success/Always/Failure Success yes no

Διαμόρφωση:

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

## Αφαιρεί κεφαλίδες απόκρισης

Key Value Default Required ResponseHeaderRemove Το όνομα της κεφαλίδας (καμία) yes When Success/Always/Failure Success no

Διαμόρφωση:

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

Key Value Required ResponseHeadersAllowed Μια λίστα επιτρεπόμενων ονομάτων κεφαλίδων, χωρισμένη με ερωτηματικά. yes

Διαμόρφωση:

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

Ορίζει αν τα trailer της απόκρισης του προορισμού αντιγράφονται στον client

Key Value Default Expand table ResponseTrailersCopy true/false true Required yes

Διαμόρφωση:

JSON { "ResponseTrailersCopy": "false" }

Κώδικας:

C# routeConfig = routeConfig.WithTransformCopyResponseTrailers(copy: false);

C# transformBuilderContext.CopyResponseTrailers = false;

Αυτό ορίζει αν όλα τα trailer απόκρισης του διακομιστή μεσολάβησης αντιγράφονται στην απόκριση προς τον client. Αυτή η ρύθμιση είναι ενεργοποιημένη από προεπιλογή και μπορεί να απενεργοποιηθεί διαμορφώνοντας τον μετασχηματισμό με τιμή false. Μετασχηματισμοί που αναφέρονται σε συγκεκριμένες κεφαλίδες θα εξακολουθήσουν να εκτελούνται ακόμα κι αν αυτό είναι απενεργοποιημένο.

## ResponseTrailer

## Προσθέτει ή αντικαθιστά trailer απόκρισης

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-response?view=aspnetcore-9.0 Expand table

5/8

Key Value Default Required ResponseTrailer Set/Append Το όνομα της κεφαλίδας (καμία) yes When Η τιμή της κεφαλίδας (καμία) yes

Success/Always/Failure Success no

Διαμόρφωση:

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

## Αφαιρεί trailer απόκρισης

Key Expand table ResponseTrailerRemove When Value Default Required Το όνομα της κεφαλίδας (καμία) yes Success/Always/Failure Success no

Διαμόρφωση:

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

yes Key Value ResponseTrailersAllowed Μια λίστα επιτρεπόμενων ονομάτων κεφαλίδων, χωρισμένη με ερωτηματικά.

Διαμόρφωση:

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
