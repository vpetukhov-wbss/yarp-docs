---
slug: transforms-request
title: Anforderungstransformationen
lede: >-
  Zu den Anforderungstransformationen zählen Anforderungspfad, Abfrage, HTTP-Version, Methode und
  Header. Im Code werden diese durch das
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request
lastUpdated: 2026-08-11
---

Zu den Anforderungstransformationen zählen Anforderungspfad, Abfrage, HTTP-Version, Methode und Header. Im Code werden diese durch das Objekt RequestTransformContext repräsentiert und von Implementierungen der abstrakten Klasse RequestTransform verarbeitet.

Hinweise:

Schema (http/https), Autorität und Pfadbasis der Proxyanforderung werden der Zieladresse entnommen ( https://localhost:10001/Path/Base im obigen Beispiel) und sollten nicht von Transformationen geändert werden. Der Host-Header kann unabhängig von der Autorität durch Transformationen überschrieben werden, siehe RequestHeader weiter unten. Die ursprüngliche PathBase-Eigenschaft der Anforderung wird beim Erstellen der Proxyanforderung nicht verwendet, siehe X-Forwarded. Standardmäßig werden alle eingehenden Anforderungsheader mit Ausnahme des Host-Headers in die Proxyanforderung kopiert (siehe Defaults Standardeinstellungen). Ebenfalls standardmäßig werden X-Forwarded-Header hinzugefügt. Dieses Verhalten kann über die folgenden Transformationen konfiguriert werden. Zusätzliche Anforderungsheader können angegeben werden, oder Anforderungsheader können ausgeschlossen werden, indem sie auf einen leeren Wert gesetzt werden.

Im Folgenden finden Sie die integrierten Transformationen, identifiziert anhand ihres primären Konfigurationsschlüssels. Diese Transformationen werden in der Reihenfolge angewendet, in der sie in der Routenkonfiguration angegeben sind.

## PathPrefix

## Ändert den Anforderungspfad durch Hinzufügen eines Präfixwerts

Schlüssel Wert Erforderlich PathPrefix Ein Pfad, der mit einem „/“ beginnt ja

Konfiguration:

JSON { "PathPrefix": "/prefix" }

Code:

C# routeConfig = routeConfig.WithTransformPathPrefix(prefix: "/prefix");

C# transformBuilderContext.AddPathPrefix(prefix: "/prefix");

Beispiel: /request/path wird zu /prefix/request/path Dadurch wird dem Anforderungspfad der angegebene Wert vorangestellt.

## PathRemovePrefix

## Ändert den Anforderungspfad durch Entfernen eines Präfixwerts

Schlüssel Wert Tabelle erweitern PathRemovePrefix Ein Pfad, der mit einem „/“ beginnt Erforderlich ja Konfiguration: 1/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathRemovePrefix": "/prefix" }

Code:

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

## Ersetzt den Anforderungspfad durch den angegebenen Wert

Schlüssel Wert Erforderlich PathSet Ein Pfad, der mit einem „/“ beginnt ja

Konfiguration:

JSON { "PathSet": "/newpath" }

Code:

C# routeConfig = routeConfig.WithTransformPathSet(path: "/newpath");

C# transformBuilderContext.AddPathSet(path: "/newpath");

Beispiel: /request/path wird zu /newpath Dadurch wird der Anforderungspfad auf den angegebenen Wert gesetzt.

## PathPattern

## Ersetzt den Anforderungspfad anhand einer Mustervorlage

Schlüssel Wert Tabelle erweitern PathPattern Eine Pfadvorlage, die mit einem „/“ beginnt Erforderlich ja Konfiguration: 2/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathPattern": "/my/{plugin}/api/{**remainder}" }

Code:

C# routeConfig = routeConfig.WithTransformPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

C# transformBuilderContext.AddPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

Dadurch wird der Anforderungspfad auf den angegebenen Wert gesetzt, und alle {}-Segmente werden durch den zugehörigen Routenwert ersetzt. {}-Segmente ohne passenden Routenwert werden entfernt. Das letzte {}-Segment kann als {**remainder} gekennzeichnet werden, um anzuzeigen, dass es sich um ein Catch-all-Segment handelt, das mehrere Pfadsegmente enthalten kann. Weitere Informationen zu Routenvorlagen finden Sie in der Routingdokumentation von ASP.NET Core.

Beispiel:

Schritt Wert Routendefinition Anforderungspfad /api/{plugin}/stuff/{**remainder} Plugin-Wert /api/v1/stuff/more/stuff Remainder-Wert v1 PathPattern more/stuff Ergebnis /my/{plugin}/api/{**remainder} /my/v1/api/more/stuff

## QueryValueParameter

Fügt Parameter in der Abfragezeichenfolge der Anforderung hinzu oder ersetzt sie

Schlüssel Wert Tabelle erweitern QueryValueParameter Name eines Abfragezeichenfolgenparameters Erforderlich Set/Append Statischer Wert ja ja Konfiguration: 3/13 JSON

{ "QueryValueParameter": "foo", "Append": "bar"

}

Code:

C# routeConfig = routeConfig.WithTransformQueryValue(queryKey: "foo", value: "bar", append: true);

C# transformBuilderContext.AddQueryValue(queryKey: "foo", value: "bar", append: true);

Dadurch wird ein Abfragezeichenfolgenparameter mit dem Namen foo hinzugefügt und auf den statischen Wert bar gesetzt. https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 Beispiel: Wert Schritt Abfrage ?a=b QueryValueParameter foo Append remainder Ergebnis ?a=b&foo=remainder

## QueryRouteParameter

Fügt einen Abfragezeichenfolgenparameter mit einem Wert aus der Routenkonfiguration hinzu oder ersetzt ihn

Schlüssel Wert Tabelle erweitern QueryRouteParameter Name eines Abfragezeichenfolgenparameters Erforderlich Set/Append Der Name eines Routenwerts ja ja Konfiguration:

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

Entfernt den angegebenen Parameter aus der Abfragezeichenfolge der Anforderung

Schlüssel Wert Tabelle erweitern QueryRemoveParameter Name eines Abfragezeichenfolgenparameters Erforderlich ja Konfiguration: JSON { "QueryRemoveParameter": "foo" }

Code:

C# routeConfig = routeConfig.WithTransformQueryRemoveKey(queryKey: "foo");

C# transformBuilderContext.AddQueryRemoveKey(queryKey: "foo");

Dadurch wird ein Abfragezeichenfolgenparameter mit dem Namen foo entfernt, sofern er in der Anforderung vorhanden ist. Beispiel:

Schritt Wert Anforderungspfad QueryRemoveParameter ?a=b&foo=c Ergebnis foo ?a=b

## HttpMethodChange

## Ändert die in der Anforderung verwendete HTTP-Methode

Schlüssel Wert Tabelle erweitern HttpMethodChange Die zu ersetzende HTTP-Methode Erforderlich Set Die neue HTTP-Methode ja ja Konfiguration:

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

Legt fest, ob eingehende Anforderungsheader in die ausgehende Anforderung kopiert werden

Schlüssel Wert Standard Tabelle erweitern RequestHeadersCopy true/false true Erforderlich ja Konfiguration:

JSON { "RequestHeadersCopy": "false" }

Code:

C# routeConfig = routeConfig.WithTransformCopyRequestHeaders(copy: false);

C# transformBuilderContext.CopyRequestHeaders = false;

Dies legt fest, ob alle eingehenden Anforderungsheader in die Proxyanforderung kopiert werden. Diese Einstellung ist standardmäßig aktiviert und kann deaktiviert werden, indem die Transformation mit dem Wert false konfiguriert wird. Transformationen, die sich auf bestimmte Header beziehen, werden weiterhin ausgeführt, auch wenn dies deaktiviert ist.

## RequestHeaderOriginalHost

Legt fest, ob der Host-Header der eingehenden Anforderung in die Proxyanforderung kopiert werden soll

Schlüssel Wert Standard Tabelle erweitern RequestHeaderOriginalHost true/false false Erforderlich ja Konfiguration:

JSON { "RequestHeaderOriginalHost": "true" }

C# routeConfig = routeConfig.WithTransformUseOriginalHostHeader(useOriginal: true);

C# transformBuilderContext.AddOriginalHost(true);

Dies legt fest, ob der Host-Header der eingehenden Anforderung in die Proxyanforderung kopiert werden soll. Diese Einstellung ist standardmäßig deaktiviert und kann aktiviert werden, indem die Transformation mit dem Wert true konfiguriert wird. Transformationen, die den Host-Header direkt referenzieren, überschreiben diese Transformation.

## RequestHeader

## Fügt Anforderungsheader hinzu oder ersetzt sie

Schlüssel Tabelle erweitern RequestHeader Set/Append Wert Erforderlich Der Headername ja Konfiguration: Der Headerwert ja

JSON {

"RequestHeader": "MyHeader", "Set": "MyValue" }

Code:

C# routeConfig = routeConfig.WithTransformRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

C# transformBuilderContext.AddRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

Beispiel:

MyHeader: MyValue

Dies setzt oder fügt den Wert für den benannten Header hinzu. Set ersetzt einen vorhandenen Header. Append fügt einen zusätzlichen Header mit dem angegebenen Wert hinzu. Hinweis: Das Festlegen von "" als Headerwert wird nicht empfohlen und kann zu undefiniertem Verhalten führen.

## RequestHeaderRouteValue

Fügt einen Header mit einem Wert aus der Routenkonfiguration hinzu oder ersetzt ihn

Schlüssel Wert Tabelle erweitern RequestHeader Name eines Abfragezeichenfolgenparameters Erforderlich Set/Append Der Name eines Routenwerts ja ja

Konfiguration:

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

## Entfernt Anforderungsheader

Schlüssel Wert Tabelle erweitern RequestHeaderRemove Der Headername Erforderlich ja Konfiguration:

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

Schlüssel Wert Tabelle erweitern RequestHeadersAllowed Eine durch Semikolon getrennte Liste zulässiger Headernamen. Erforderlich ja https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 8/13 Konfiguration:

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

Fügt Header mit Informationen über die ursprüngliche Clientanforderung hinzu

Schlüssel Wert Standard Erforderlich X-Forwarded Standardaktion (Set, Append, Remove, Off), die auf alle unten aufgeführten X-Forwarded-* angewendet wird Set ja For Anzuwendende Aktion für diesen Header * Siehe X-Forwarded nein Proto Anzuwendende Aktion für diesen Header * Siehe X-Forwarded nein Host Anzuwendende Aktion für diesen Header * Siehe X-Forwarded nein Prefix Anzuwendende Aktion für diesen Header * Siehe X-Forwarded nein HeaderPrefix Das Headername-Präfix "X-Forwarded-" nein

Die Aktion "Off" deaktiviert die Transformation vollständig.

Konfiguration:

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

Fügt einen Header mit Informationen über die ursprüngliche Clientanforderung hinzu

Schlüssel Wert Standard Er

Forwarded Eine durch Kommas getrennte Liste, die eine beliebige Kombination dieser Werte enthält: for,by,proto,host (keine) j

ForFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random nein

ByFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random nein

Action Anzuwendende Aktion für diesen Header (Set, Append, Remove, Off) Set nein

Konfiguration:

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

Leitet das bei der eingehenden Verbindung verwendete Clientzertifikat als Header an das Ziel weiter

Schlüssel Wert Erforderlich ClientCert Der Headername ja

Konfiguration:

JSON { "ClientCert": "X-Client-Cert" }

Code:

C# routeConfig = routeConfig.WithTransformClientCertHeader(headerName: "X-Client-Cert");

C# transformBuilderContext.AddClientCertHeader(headerName: "X-Client-Cert");

Beispiel:

X-Client-Cert: SSdtIGEgY2VydGlmaWNhdGU...

Da die eingehende und die ausgehende Verbindung unabhängig voneinander sind, muss es eine Möglichkeit geben, ein eingehendes Clientzertifikat an den Zielserver weiterzugeben. Diese Transformation sorgt dafür, dass das Clientzertifikat aus HttpContext.Connection.ClientCertificate Base64-codiert und als Wert für den angegebenen Headernamen festgelegt wird. Der Zielserver benötigt dieses Zertifikat unter Umständen, um den Client zu authentifizieren. Es gibt keinen Standard, der diesen Header definiert, und die Implementierungen sind unterschiedlich – prüfen Sie, ob Ihr Zielserver dies unterstützt.

Server führen standardmäßig nur eine minimale Validierung des eingehenden Clientzertifikats durch. Das Zertifikat sollte entweder im Proxy oder im Ziel validiert werden, Details dazu finden Sie in der Dokumentation zur Clientzertifikatauthentifizierung.

Diese Transformation greift nur, wenn das Clientzertifikat bereits auf der Verbindung vorhanden ist. Falls es pro Route vom Client angefordert werden muss, finden Sie weitere Informationen in der Dokumentation zu optionalen Zertifikaten.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
