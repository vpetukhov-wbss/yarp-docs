---
slug: transforms-request
title: Μετασχηματισμοί αιτήματος
lede: >-
  Οι μετασχηματισμοί αιτήματος περιλαμβάνουν το path, το query, την έκδοση HTTP, τη μέθοδο και τις
  κεφαλίδες του αιτήματος. Στον κώδικα αυτά αναπαρίστανται από το
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request
lastUpdated: 2026-08-11
---

Οι μετασχηματισμοί αιτήματος περιλαμβάνουν το path, το query, την έκδοση HTTP, τη μέθοδο και τις κεφαλίδες του αιτήματος. Στον κώδικα αυτά αναπαρίστανται από το αντικείμενο RequestTransformContext και επεξεργάζονται από υλοποιήσεις της αφηρημένης κλάσης RequestTransform.

Σημειώσεις:

Το σχήμα (http/https), η αρχή (authority) και το path base του αιτήματος του διακομιστή μεσολάβησης λαμβάνονται από τη διεύθυνση του διακομιστή προορισμού (https://localhost:10001/Path/Base στο παραπάνω παράδειγμα) και δεν θα πρέπει να τροποποιούνται από μετασχηματισμούς. Η κεφαλίδα Host μπορεί να αντικατασταθεί από μετασχηματισμούς ανεξάρτητα από την authority, δείτε το RequestHeader παρακάτω. Η αρχική ιδιότητα PathBase του αιτήματος δεν χρησιμοποιείται κατά την κατασκευή του αιτήματος του διακομιστή μεσολάβησης, δείτε το X-Forwarded. Όλες οι κεφαλίδες του εισερχόμενου αιτήματος αντιγράφονται από προεπιλογή στο αίτημα του διακομιστή μεσολάβησης, με εξαίρεση την κεφαλίδα Host (δείτε Προεπιλογές). Κεφαλίδες X-Forwarded προστίθενται επίσης από προεπιλογή. Αυτές οι συμπεριφορές μπορούν να διαμορφωθούν χρησιμοποιώντας τους παρακάτω μετασχηματισμούς. Μπορούν να οριστούν επιπλέον κεφαλίδες αιτήματος, ή κεφαλίδες αιτήματος μπορούν να εξαιρεθούν ορίζοντάς τες σε κενή τιμή.

Οι ακόλουθοι είναι ενσωματωμένοι μετασχηματισμοί, αναγνωρισμένοι από το κύριο κλειδί διαμόρφωσής τους. Αυτοί οι μετασχηματισμοί εφαρμόζονται με τη σειρά που ορίζονται στη διαμόρφωση της διαδρομής.

## PathPrefix

## Τροποποιεί το path του αιτήματος προσθέτοντας μια τιμή προθέματος

Key Value Required PathPrefix Ένα path που ξεκινά με '/' yes

Διαμόρφωση:

JSON { "PathPrefix": "/prefix" }

Κώδικας:

C# routeConfig = routeConfig.WithTransformPathPrefix(prefix: "/prefix");

C# transformBuilderContext.AddPathPrefix(prefix: "/prefix");

Παράδειγμα: το /request/path γίνεται /prefix/request/path. Αυτό προσθέτει την καθορισμένη τιμή ως πρόθεμα στο path του αιτήματος.

## PathRemovePrefix

## Τροποποιεί το path του αιτήματος αφαιρώντας μια τιμή προθέματος

Key Value Expand table PathRemovePrefix Ένα path που ξεκινά με '/' Required yes Διαμόρφωση: 1/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathRemovePrefix": "/prefix" }

Κώδικας:

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

## Αντικαθιστά το path του αιτήματος με την καθορισμένη τιμή

Key Value Required PathSet Ένα path που ξεκινά με '/' yes

Διαμόρφωση:

JSON { "PathSet": "/newpath" }

Κώδικας:

C# routeConfig = routeConfig.WithTransformPathSet(path: "/newpath");

C# transformBuilderContext.AddPathSet(path: "/newpath");

Παράδειγμα: το /request/path γίνεται /newpath. Αυτό ορίζει το path του αιτήματος στην καθορισμένη τιμή.

## PathPattern

## Αντικαθιστά το path του αιτήματος χρησιμοποιώντας ένα πρότυπο (pattern template)

Key Value Expand table PathPattern Ένα πρότυπο path που ξεκινά με '/' Required yes Διαμόρφωση: 2/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathPattern": "/my/{plugin}/api/{**remainder}" }

Κώδικας:

C# routeConfig = routeConfig.WithTransformPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

C# transformBuilderContext.AddPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

Αυτό ορίζει το path του αιτήματος με την καθορισμένη τιμή και αντικαθιστά κάθε τμήμα {} με την αντίστοιχη τιμή διαδρομής (route value). Τμήματα {} χωρίς αντίστοιχη τιμή διαδρομής αφαιρούνται. Το τελευταίο τμήμα {} μπορεί να επισημανθεί ως {**remainder} για να υποδείξει ότι πρόκειται για ένα catch-all τμήμα που μπορεί να περιέχει πολλαπλά τμήματα path. Δείτε την τεκμηρίωση δρομολόγησης του ASP.NET Core για περισσότερες πληροφορίες σχετικά με τα route templates.

Παράδειγμα:

Step Value Route definition Request path /api/{plugin}/stuff/{**remainder} Plugin value /api/v1/stuff/more/stuff Remainder value v1 PathPattern more/stuff Result /my/{plugin}/api/{**remainder} /my/v1/api/more/stuff

## QueryValueParameter

Προσθέτει ή αντικαθιστά παραμέτρους στη συμβολοσειρά ερωτήματος του αιτήματος

Key Value Expand table QueryValueParameter Όνομα μιας παραμέτρου ερωτήματος Required Set/Append Στατική τιμή yes yes Διαμόρφωση: 3/13 JSON

{ "QueryValueParameter": "foo", "Append": "bar"

}

Κώδικας:

C# routeConfig = routeConfig.WithTransformQueryValue(queryKey: "foo", value: "bar", append: true);

C# transformBuilderContext.AddQueryValue(queryKey: "foo", value: "bar", append: true);

Αυτό προσθέτει μια παράμετρο ερωτήματος με το όνομα foo και την ορίζει στη στατική τιμή bar. https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 Παράδειγμα: Value Step Query ?a=b QueryValueParameter foo Append remainder Result ?a=b&foo=remainder

## QueryRouteParameter

Προσθέτει ή αντικαθιστά μια παράμετρο ερωτήματος με μια τιμή από τη διαμόρφωση της διαδρομής

Key Value Expand table QueryRouteParameter Όνομα μιας παραμέτρου ερωτήματος Required Set/Append Το όνομα μιας τιμής διαδρομής yes yes Διαμόρφωση:

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

Αφαιρεί την καθορισμένη παράμετρο από τη συμβολοσειρά ερωτήματος του αιτήματος

Key Value Expand table QueryRemoveParameter Όνομα μιας παραμέτρου ερωτήματος Required yes Διαμόρφωση: JSON { "QueryRemoveParameter": "foo" }

Κώδικας:

C# routeConfig = routeConfig.WithTransformQueryRemoveKey(queryKey: "foo");

C# transformBuilderContext.AddQueryRemoveKey(queryKey: "foo");

Αυτό αφαιρεί μια παράμετρο ερωτήματος με το όνομα foo, αν υπάρχει στο αίτημα. Παράδειγμα:

Step Value Request path QueryRemoveParameter ?a=b&foo=c Result foo ?a=b

## HttpMethodChange

## Αλλάζει τη μέθοδο HTTP που χρησιμοποιείται στο αίτημα

Key Value Expand table HttpMethodChange Η μέθοδος HTTP προς αντικατάσταση Required Set Η νέα μέθοδος HTTP yes yes Διαμόρφωση:

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

Ορίζει αν οι κεφαλίδες του εισερχόμενου αιτήματος αντιγράφονται στο εξερχόμενο αίτημα

Key Value Default Expand table RequestHeadersCopy true/false true Required yes Διαμόρφωση:

JSON { "RequestHeadersCopy": "false" }

Κώδικας:

C# routeConfig = routeConfig.WithTransformCopyRequestHeaders(copy: false);

C# transformBuilderContext.CopyRequestHeaders = false;

Αυτό ορίζει αν όλες οι κεφαλίδες του εισερχόμενου αιτήματος αντιγράφονται στο αίτημα του διακομιστή μεσολάβησης. Αυτή η ρύθμιση είναι ενεργοποιημένη από προεπιλογή και μπορεί να απενεργοποιηθεί διαμορφώνοντας τον μετασχηματισμό με τιμή false. Μετασχηματισμοί που αναφέρονται σε συγκεκριμένες κεφαλίδες θα εξακολουθήσουν να εκτελούνται ακόμα κι αν αυτό είναι απενεργοποιημένο.

## RequestHeaderOriginalHost

Καθορίζει αν η κεφαλίδα Host του εισερχόμενου αιτήματος πρέπει να αντιγραφεί στο αίτημα του διακομιστή μεσολάβησης

Key Value Default Expand table RequestHeaderOriginalHost true/false false Required yes Διαμόρφωση:

JSON { "RequestHeaderOriginalHost": "true" }

C# routeConfig = routeConfig.WithTransformUseOriginalHostHeader(useOriginal: true);

C# transformBuilderContext.AddOriginalHost(true);

Αυτό καθορίζει αν η κεφαλίδα Host του εισερχόμενου αιτήματος πρέπει να αντιγραφεί στο αίτημα του διακομιστή μεσολάβησης. Αυτή η ρύθμιση είναι απενεργοποιημένη από προεπιλογή και μπορεί να ενεργοποιηθεί διαμορφώνοντας τον μετασχηματισμό με τιμή true. Μετασχηματισμοί που αναφέρονται απευθείας στην κεφαλίδα Host θα υπερισχύσουν αυτού του μετασχηματισμού.

## RequestHeader

## Προσθέτει ή αντικαθιστά κεφαλίδες αιτήματος

Key Expand table RequestHeader Set/Append Value Required Το όνομα της κεφαλίδας yes Διαμόρφωση: Η τιμή της κεφαλίδας yes

JSON {

"RequestHeader": "MyHeader", "Set": "MyValue" }

Κώδικας:

C# routeConfig = routeConfig.WithTransformRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

C# transformBuilderContext.AddRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

Παράδειγμα:

MyHeader: MyValue

Αυτό ορίζει ή προσθέτει την τιμή για την ονομαζόμενη κεφαλίδα. Το Set αντικαθιστά κάθε υπάρχουσα κεφαλίδα. Το Append προσθέτει μια επιπλέον κεφαλίδα με την καθορισμένη τιμή. Σημείωση: ο ορισμός "" ως τιμής κεφαλίδας δεν συνιστάται και μπορεί να προκαλέσει απροσδιόριστη συμπεριφορά.

## RequestHeaderRouteValue

Προσθέτει ή αντικαθιστά μια κεφαλίδα με μια τιμή από τη διαμόρφωση της διαδρομής

Key Value Expand table RequestHeader Όνομα μιας παραμέτρου ερωτήματος Required Set/Append Το όνομα μιας τιμής διαδρομής yes yes

Διαμόρφωση:

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

## Αφαιρεί κεφαλίδες αιτήματος

Key Value Expand table RequestHeaderRemove Το όνομα της κεφαλίδας Required yes Διαμόρφωση:

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

Key Value Expand table RequestHeadersAllowed Μια λίστα επιτρεπόμενων ονομάτων κεφαλίδων, χωρισμένη με ερωτηματικά. Required yes https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 8/13 Διαμόρφωση:

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

Προσθέτει κεφαλίδες με πληροφορίες σχετικά με το αρχικό αίτημα του client

Key Value Default Required X-Forwarded Προεπιλεγμένη ενέργεια (Set, Append, Remove, Off) που εφαρμόζεται σε όλες τις παρακάτω κεφαλίδες X-Forwarded-* Set yes For Ενέργεια που εφαρμόζεται σε αυτή την κεφαλίδα * Δείτε X-Forwarded no Proto Ενέργεια που εφαρμόζεται σε αυτή την κεφαλίδα * Δείτε X-Forwarded no Host Ενέργεια που εφαρμόζεται σε αυτή την κεφαλίδα * Δείτε X-Forwarded no Prefix Ενέργεια που εφαρμόζεται σε αυτή την κεφαλίδα * Δείτε X-Forwarded no HeaderPrefix Το πρόθεμα ονόματος κεφαλίδας "X-Forwarded-" no

Η ενέργεια "Off" απενεργοποιεί εντελώς τον μετασχηματισμό.

Διαμόρφωση:

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

Προσθέτει μια κεφαλίδα με πληροφορίες σχετικά με το αρχικό αίτημα του client

Key Value Default Re

Forwarded Λίστα χωρισμένη με κόμματα που περιέχει οποιαδήποτε από αυτές τις τιμές: for,by,proto,host (καμία) ναι

ForFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

ByFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

Action Ενέργεια που εφαρμόζεται σε αυτή την κεφαλίδα (Set, Append, Remove, Off) Set no

Διαμόρφωση:

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

Προωθεί το πιστοποιητικό client που χρησιμοποιήθηκε στην εισερχόμενη σύνδεση, ως κεφαλίδα προς τον προορισμό

Key Value Required ClientCert Το όνομα της κεφαλίδας yes

Διαμόρφωση:

JSON { "ClientCert": "X-Client-Cert" }

Κώδικας:

C# routeConfig = routeConfig.WithTransformClientCertHeader(headerName: "X-Client-Cert");

C# transformBuilderContext.AddClientCertHeader(headerName: "X-Client-Cert");

Παράδειγμα:

X-Client-Cert: SSdtIGEgY2VydGlmaWNhdGU...

Εφόσον η εισερχόμενη και η εξερχόμενη σύνδεση είναι ανεξάρτητες, χρειάζεται ένας τρόπος να περαστεί οποιοδήποτε πιστοποιητικό client εισερχόμενης σύνδεσης στον διακομιστή προορισμού. Αυτός ο μετασχηματισμός προκαλεί την κωδικοποίηση σε Base64 του πιστοποιητικού client, το οποίο λαμβάνεται από το HttpContext.Connection.ClientCertificate, και τον ορισμό του ως τιμή για την καθορισμένη κεφαλίδα. Ο διακομιστής προορισμού μπορεί να χρειαστεί αυτό το πιστοποιητικό για να πιστοποιήσει τον client. Δεν υπάρχει πρότυπο που να ορίζει αυτή την κεφαλίδα και οι υλοποιήσεις διαφέρουν, ελέγξτε τον διακομιστή προορισμού σας για υποστήριξη.

Οι διακομιστές κάνουν ελάχιστη επικύρωση στο εισερχόμενο πιστοποιητικό client από προεπιλογή. Το πιστοποιητικό θα πρέπει να επικυρώνεται είτε στον διακομιστή μεσολάβησης είτε στον προορισμό, δείτε την τεκμηρίωση ελέγχου ταυτότητας με πιστοποιητικό client για λεπτομέρειες.

Αυτός ο μετασχηματισμός θα εφαρμοστεί μόνο αν το πιστοποιητικό client είναι ήδη παρόν στη σύνδεση. Δείτε την τεκμηρίωση για προαιρετικά πιστοποιητικά αν χρειάζεται να ζητηθεί από τον client ανά διαδρομή.

:::note
Ο συγγραφέας δημιούργησε αυτό το άρθρο με τη βοήθεια AI. Μάθετε περισσότερα
:::
