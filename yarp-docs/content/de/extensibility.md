---
slug: extensibility
title: Übersicht
lede: >-
  Es gibt zwei Hauptstile der Erweiterbarkeit für YARP, je nachdem, welches Routingverhalten
  gewünscht ist:
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility
lastUpdated: 2026-08-11
---

## Übersicht über die YARP-Erweiterbarkeit

Es gibt zwei Hauptstile der Erweiterbarkeit für YARP, je nachdem, welches Routingverhalten gewünscht ist:

Middleware-Pipeline HTTP Forwarder

## Middleware-Pipeline

YARP verwendet das Konzept von Routen, Clustern und Zielen. Diese können über Konfigurationsdateien oder direkt über Code bereitgestellt werden. Anhand der Routingregeln wählt YARP einen Cluster aus und ermittelt die möglichen Ziele. Anschließend verwendet es die Middleware-Pipeline, um das Ziel anhand der Zielintegrität, der Sitzungsaffinität, des Lastenausgleichs usw. auszuwählen.

Der Großteil der vorgefertigten Pipeline lässt sich über Code anpassen:

Konfigurationsanbieter Zielaufzählung Sitzungsaffinität Lastenausgleich Integritätsprüfungen Anforderungstransformationen HttpClient-Konfiguration

Sie können die Pipelinedefinition auch ändern, um Module durch eigene Implementierungen zu ersetzen oder bei Bedarf zusätzliche Module hinzuzufügen. Weitere Informationen finden Sie unter Middleware.

## HTTP Forwarder

Wenn die YARP-Pipeline für Ihren Anwendungsfall zu starr ist oder der Umfang der Routingregeln und Ziele nicht für das Laden in den Arbeitsspeicher geeignet ist, können Sie Ihre eigene Routinglogik implementieren und den HTTP Forwarder verwenden, um Anforderungen an das von Ihnen gewählte Ziel zu leiten. Die HttpForwarder-Komponente nimmt den HTTP-Kontext entgegen und leitet die Anforderung an das angegebene Ziel weiter.

Die Transform-Komponente kann weiterhin verwendet werden, wenn der Forwarder benötigt wird. Weitere Informationen finden Sie unter Direkte Weiterleitung.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
