---
slug: transforms
title: Übersicht
lede: >-
  Beim Proxying einer Anforderung ist es üblich, Teile der Anforderung oder Antwort zu ändern, um
  sie an
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/transforms
lastUpdated: 2026-08-11
---

## YARP-Anforderungs- und Antworttransformationen

## Einführung

Beim Proxying einer Anforderung ist es üblich, Teile der Anforderung oder Antwort zu ändern, um sie an die Anforderungen des Zielservers anzupassen oder zusätzliche Daten wie die ursprüngliche IP-Adresse des Clients weiterzugeben. Dieser Vorgang wird über Transforms implementiert. Transformationstypen werden global für die Anwendung definiert, und einzelne Routen liefern anschließend die Parameter, um diese Transformationen zu aktivieren und zu konfigurieren. Die ursprünglichen Anforderungsobjekte werden von diesen Transformationen nicht verändert, sondern nur die Proxyanforderungen.

Transformationen des Anforderungs- und Antwortkörpers werden von YARP nicht bereitgestellt, Sie können hierfür jedoch eine Middleware schreiben.

## Standardeinstellungen

Die folgenden Transformationen sind standardmäßig für alle Routen aktiviert. Sie können wie später in diesem Dokument gezeigt konfiguriert oder deaktiviert werden.

Host - Unterdrückt den Host-Header der eingehenden Anforderung. Die Proxyanforderung verwendet standardmäßig den in der Zieladresse angegebenen Hostnamen. Siehe RequestHeaderOriginalHost weiter unten. X-Forwarded-For - Setzt die IP-Adresse des Clients in den X-Forwarded-For-Header. Siehe X- Forwarded weiter unten. X-Forwarded-Proto - Setzt das ursprüngliche Schema der Anforderung (http/https) in den X-Forwarded- Proto-Header. Siehe X-Forwarded weiter unten. X-Forwarded-Host - Setzt den ursprünglichen Host der Anforderung in den X-Forwarded-Host-Header. Siehe X-Forwarded weiter unten. X-Forwarded-Prefix - Setzt die ursprüngliche PathBase der Anforderung, falls vorhanden, in den X-Forwarded- Prefix-Header. Siehe X-Forwarded weiter unten.

Zum Beispiel würde die folgende eingehende Anforderung an http://IncomingHost:5000/path :

GET /path HTTP/1.1 Host: IncomingHost:5000 Accept: */* header1: foo

mit diesen Standardeinstellungen transformiert und wie folgt an den Zielserver https://DestinationHost:6000/ weitergeleitet

werden:

GET /path HTTP/1.1 Host: DestinationHost:6000 Accept: */* header1: foo X-Forwarded-For: 5.5.5.5 X-Forwarded-Proto: http X-Forwarded-Host: IncomingHost:5000

## Transformationskategorien

Transformationen lassen sich in einige Kategorien einteilen: Request, Response und Response Trailers. Anforderungs-Trailer werden nicht unterstützt, da sie vom zugrunde liegenden HttpClient nicht unterstützt werden.

Reicht die integrierte Auswahl an Transformationen nicht aus, können über die Erweiterbarkeit benutzerdefinierte Transformationen hinzugefügt werden.

## Transformationen hinzufügen

Transformationen können Routen entweder über die Konfiguration oder programmgesteuert hinzugefügt werden.

## Über die Konfiguration

Transformationen können über RouteConfig.Transforms konfiguriert und aus dem Abschnitt „Routes“ der Konfigurationsdatei gebunden werden. Diese können geändert und neu geladen werden, ohne den Proxy neu zu starten. Eine Transformation wird über ein oder mehrere Schlüssel-Wert-Paare vom Typ string konfiguriert.

Hier ein Beispiel für gängige Transformationen:

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Hosts": [ "localhost" ]
             },
             "Transforms": [
                { "PathPrefix": "/apis" },
                          {
                             "RequestHeader": "header1",
                             "Append": "bar"
                          },
                          {
                             "ResponseHeader": "header2",
                             "Append": "bar",
                             "When": "Always"
                          },
                          { "ClientCert": "X-Client-Cert" },
                          { "RequestHeadersCopy": "true" },
                          { "RequestHeaderOriginalHost": "true" },
                          {
                             "X-Forwarded": "Append",
                             "HeaderPrefix": "X-Forwarded-"
                          }
                      ]
                   },
                   "route2" : {
                      "ClusterId": "cluster1",
                      "Match": {
                          "Path": "/api/{plugin}/stuff/{**remainder}"
                      },
                      "Transforms": [
                          { "PathPattern": "/foo/{plugin}/bar/{**remainder}" },
                          {
                             "QueryValueParameter": "q",
                             "Append": "plugin"
                          }
                      ]
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                          "cluster1/destination1": {
                             "Address": "https://localhost:10001/Path/Base"
                          }
                      }
                   }
      }
   }
}
All configuration entries are treated as case-insensitive, though the destination server may
treat the resulting values as case sensitive or insensitive such as the path.
The details for these transforms are covered later in this document.
Developers that want to integrate their custom transforms with the Transforms section of
configuration can do so using ITransformFactory described below.
```

## Über Code

Transformationen können Routen programmgesteuert hinzugefügt werden, indem die Methode AddTransforms aufgerufen wird.

AddTransforms kann nach AddReverseProxy aufgerufen werden, um einen Rückruf zum Konfigurieren von Transformationen bereitzustellen. Dieser Rückruf wird jedes Mal aufgerufen, wenn eine Route erstellt oder neu erstellt wird, und ermöglicht es dem Entwickler, die RouteConfig-Informationen zu prüfen und bedingt Transformationen dafür hinzuzufügen.

Der AddTransforms-Rückruf stellt einen TransformBuilderContext bereit, über den Transformationen hinzugefügt oder konfiguriert werden können. Für die meisten Transformationen stehen TransformBuilderContext-Erweiterungsmethoden bereit, die das Hinzufügen erleichtern. Diese Erweiterungen werden weiter unten zusammen mit den einzelnen Transformationsbeschreibungen dokumentiert.

Der TransformBuilderContext enthält außerdem einen IServiceProvider für den Zugriff auf benötigte Dienste.

```csharp
services.AddReverseProxy()
      .LoadFromConfig(_configuration.GetSection("ReverseProxy"))
      .AddTransforms(builderContext =>
      {
             // Added to all routes.
             builderContext.AddPathPrefix("/prefix");
             // Conditionally add a transform for routes that require auth.
             if (!string.IsNullOrEmpty(builderContext.Route.AuthorizationPolicy))
             {
                    builderContext.AddRequestTransform(async transformContext =>
                    {
                          transformContext.ProxyRequest.Headers.Add("CustomHeader",
"CustomValue");
                    });
             }
      });
For more advanced control see ITransformProvider described below.
 Note: The author created this article with assistance from AI. Learn more
```
