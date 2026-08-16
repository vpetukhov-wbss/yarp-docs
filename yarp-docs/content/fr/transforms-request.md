---
slug: transforms-request
title: Transformations de requête
lede: >-
  Les transformations de requête portent sur le chemin, la chaîne de requête, la version HTTP, la
  méthode et les en-têtes de la requête. En code, elles sont représentées par l'objet
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request
lastUpdated: 2026-08-11
---

Les transformations de requête portent sur le chemin, la chaîne de requête, la version HTTP, la méthode et les en-têtes de la requête. En code, elles sont représentées par l'objet RequestTransformContext et traitées par des implémentations de la classe abstraite RequestTransform.

Remarques :

Le schéma (http/https), l'autorité et la base de chemin de la requête du proxy sont extraits de l'adresse du serveur de destination ( https://localhost:10001/Path/Base dans l'exemple ci-dessus) et ne doivent pas être modifiés par les transformations. L'en-tête Host peut être remplacé par des transformations indépendamment de l'autorité, voir RequestHeader ci-dessous. La propriété PathBase d'origine de la requête n'est pas utilisée lors de la construction de la requête du proxy, voir X-Forwarded. Tous les en-têtes de la requête entrante sont copiés par défaut vers la requête du proxy, à l'exception de l'en-tête Host (voir Valeurs par défaut). Les en-têtes X-Forwarded sont également ajoutés par défaut. Ces comportements peuvent être configurés à l'aide des transformations suivantes. Des en-têtes de requête supplémentaires peuvent être spécifiés, ou des en-têtes de requête peuvent être exclus en leur donnant une valeur vide.

Voici les transformations intégrées, identifiées par leur clé de configuration principale. Ces transformations sont appliquées dans l'ordre où elles sont spécifiées dans la configuration de la route.

## PathPrefix

## Modifie le chemin de la requête en ajoutant un préfixe

Key Value Required PathPrefix A path starting with a '/' yes

Configuration :

JSON { "PathPrefix": "/prefix" }

Code :

C# routeConfig = routeConfig.WithTransformPathPrefix(prefix: "/prefix");

C# transformBuilderContext.AddPathPrefix(prefix: "/prefix");

Exemple : /request/path devient /prefix/request/path. Ceci préfixe le chemin de la requête avec la valeur donnée.

## PathRemovePrefix

## Modifie le chemin de la requête en supprimant un préfixe

Key Value Expand table PathRemovePrefix A path starting with a '/' Required yes Config: 1/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathRemovePrefix": "/prefix" }

Code :

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

## Remplace le chemin de la requête par la valeur spécifiée

Key Value Required PathSet A path starting with a '/' yes

Configuration :

JSON { "PathSet": "/newpath" }

Code :

C# routeConfig = routeConfig.WithTransformPathSet(path: "/newpath");

C# transformBuilderContext.AddPathSet(path: "/newpath");

Exemple : /request/path devient /newpath. Ceci définit le chemin de la requête avec la valeur donnée.

## PathPattern

## Remplace le chemin de la requête à l'aide d'un modèle

Key Value Expand table PathPattern A path template starting with a '/' Required yes Config: 2/13 JSON

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 { "PathPattern": "/my/{plugin}/api/{**remainder}" }

Code :

C# routeConfig = routeConfig.WithTransformPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

C# transformBuilderContext.AddPathRouteValues(pattern: new PathString("/my/{plugin}/api/{**remainder}"));

Ceci définit le chemin de la requête avec la valeur donnée et remplace les segments {} par la valeur de route associée. Les segments {} sans valeur de route correspondante sont supprimés. Le dernier segment {} peut être marqué {**remainder} pour indiquer qu'il s'agit d'un segment fourre-tout pouvant contenir plusieurs segments de chemin. Consultez la documentation ASP.NET Core sur le routage pour en savoir plus sur les modèles de route.

Exemple :

Step Value Route definition Request path /api/{plugin}/stuff/{**remainder} Plugin value /api/v1/stuff/more/stuff Remainder value v1 PathPattern more/stuff Result /my/{plugin}/api/{**remainder} /my/v1/api/more/stuff

## QueryValueParameter

Ajoute ou remplace des paramètres dans la chaîne de requête

Key Value Expand table QueryValueParameter Name of a query string parameter Required Set/Append Static value yes yes Config: 3/13 JSON

{ "QueryValueParameter": "foo", "Append": "bar"

}

Code :

C# routeConfig = routeConfig.WithTransformQueryValue(queryKey: "foo", value: "bar", append: true);

C# transformBuilderContext.AddQueryValue(queryKey: "foo", value: "bar", append: true);

Ceci ajoute un paramètre de chaîne de requête nommé foo et lui affecte la valeur statique bar . https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms-request?view=aspnetcore-9.0 Example: Value Step Query ?a=b QueryValueParameter foo Append remainder Result ?a=b&foo=remainder

## QueryRouteParameter

Ajoute ou remplace un paramètre de chaîne de requête par une valeur issue de la configuration de route

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

Supprime le paramètre spécifié de la chaîne de requête

Key Value Expand table QueryRemoveParameter Name of a query string parameter Required yes Config: JSON { "QueryRemoveParameter": "foo" }

Code :

C# routeConfig = routeConfig.WithTransformQueryRemoveKey(queryKey: "foo");

C# transformBuilderContext.AddQueryRemoveKey(queryKey: "foo");

Ceci supprime un paramètre de chaîne de requête nommé foo s'il est présent sur la requête. Exemple :

Step Value Request path QueryRemoveParameter ?a=b&foo=c Result foo ?a=b

## HttpMethodChange

## Modifie la méthode HTTP utilisée dans la requête

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

Définit si les en-têtes de la requête entrante sont copiés vers la requête sortante

Key Value Default Expand table RequestHeadersCopy true/false true Required yes Config:

JSON { "RequestHeadersCopy": "false" }

Code :

C# routeConfig = routeConfig.WithTransformCopyRequestHeaders(copy: false);

C# transformBuilderContext.CopyRequestHeaders = false;

Ceci définit si tous les en-têtes de la requête entrante sont copiés vers la requête du proxy. Ce paramètre est activé par défaut et peut être désactivé en configurant la transformation avec la valeur false . Les transformations qui référencent des en-têtes spécifiques continueront de s'exécuter même si ce paramètre est désactivé.

## RequestHeaderOriginalHost

Spécifie si l'en-tête Host de la requête entrante doit être copié vers la requête du proxy

Key Value Default Expand table RequestHeaderOriginalHost true/false false Required yes Config:

JSON { "RequestHeaderOriginalHost": "true" }

C# routeConfig = routeConfig.WithTransformUseOriginalHostHeader(useOriginal: true);

C# transformBuilderContext.AddOriginalHost(true);

Ceci spécifie si l'en-tête Host de la requête entrante doit être copié vers la requête du proxy. Ce paramètre est désactivé par défaut et peut être activé en configurant la transformation avec la valeur true . Les transformations qui référencent directement l'en-tête Host prendront le pas sur cette transformation.

## RequestHeader

## Ajoute ou remplace des en-têtes de requête

Key Expand table RequestHeader Set/Append Value Required The header name yes Config: The header value yes

JSON {

"RequestHeader": "MyHeader", "Set": "MyValue" }

Code :

C# routeConfig = routeConfig.WithTransformRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

C# transformBuilderContext.AddRequestHeader(headerName: "MyHeader", value: "MyValue", append: false);

Exemple :

MyHeader: MyValue

Ceci définit ou ajoute la valeur de l'en-tête nommé. Set remplace tout en-tête existant. Append ajoute un en-tête supplémentaire avec la valeur donnée. Remarque : définir "" comme valeur d'en-tête n'est pas recommandé et peut entraîner un comportement indéfini.

## RequestHeaderRouteValue

Ajoute ou remplace un en-tête par une valeur issue de la configuration de route

Key Value Expand table RequestHeader Name of a query string parameter Required Set/Append The name of a route value yes yes

Configuration :

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

## Supprime des en-têtes de requête

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

Ajoute des en-têtes contenant des informations sur la requête client d'origine

Key Value Default Required X-Forwarded Default action (Set, Append, Remove, Off) to apply to all X-Forwarded-* listed below Set yes For Action to apply to this header * See X-Forwarded no Proto Action to apply to this header * See X-Forwarded no Host Action to apply to this header * See X-Forwarded no Prefix Action to apply to this header * See X-Forwarded no HeaderPrefix The header name prefix "X-Forwarded-" no

L'action "Off" désactive complètement la transformation.

Configuration :

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

Ajoute un en-tête contenant des informations sur la requête client d'origine

Key Value Default Re

Forwarded A comma separated list containing any of these values: for,by,proto,host (none) ye

ForFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

ByFormat Random/RandomAndPort/RandomAndRandomPort/Unknown/UnknownAndPort/UnknownAndRandomPort/Ip/IpAndPort/IpAndRandomPort Random no

Action Action to apply to this header (Set, Append, Remove, Off) Set no

Configuration :

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

Transfère le certificat client utilisé sur la connexion entrante sous la forme d'un en-tête vers la destination

Key Value Required ClientCert The header name yes

Configuration :

JSON { "ClientCert": "X-Client-Cert" }

Code :

C# routeConfig = routeConfig.WithTransformClientCertHeader(headerName: "X-Client-Cert");

C# transformBuilderContext.AddClientCertHeader(headerName: "X-Client-Cert");

Exemple :

X-Client-Cert: SSdtIGEgY2VydGlmaWNhdGU...

Les connexions entrante et sortante étant indépendantes, il faut un moyen de transmettre au serveur de destination un éventuel certificat client entrant. Cette transformation encode en Base64 le certificat client obtenu via HttpContext.Connection.ClientCertificate et le définit comme valeur de l'en-tête donné. Le serveur de destination peut avoir besoin de ce certificat pour authentifier le client. Il n'existe aucune norme définissant cet en-tête et les implémentations varient ; vérifiez la prise en charge par votre serveur de destination.

Par défaut, les serveurs n'effectuent qu'une validation minimale du certificat client entrant. Le certificat doit être validé soit dans le proxy, soit dans la destination ; consultez la documentation sur l'authentification par certificat client pour plus de détails.

Cette transformation ne s'applique que si le certificat client est déjà présent sur la connexion. Consultez la documentation sur les certificats optionnels s'il doit être demandé au client au cas par cas, par route.

:::note
L'auteur a rédigé cet article avec l'aide de l'IA. En savoir plus
:::
