---
slug: header-guidelines
title: Richtlinien für HTTP-Header
lede: >-
  Header sind ein sehr wichtiger Bestandteil der Verarbeitung von HTTP-Anforderungen, und jeder
  hat seine eigenen
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-guidelines
lastUpdated: 2026-08-11
---

Header sind ein sehr wichtiger Bestandteil der Verarbeitung von HTTP-Anforderungen, und jeder hat seine eigene Semantik und eigene Besonderheiten. Die meisten Header werden standardmäßig weitergeleitet, wobei einige, die die Übermittlung der Anforderung steuern, vom Proxy automatisch angepasst oder entfernt werden. Die Verbindungen zwischen dem Client und dem Proxy sowie zwischen dem Proxy und dem Ziel sind unabhängig voneinander. Daher müssen Header, die die Verbindung und den Transport betreffen, gefiltert werden. Viele Header enthalten Informationen wie Domänennamen, Pfade oder andere Details, die betroffen sein können, wenn ein Reverse Proxy in die Anwendungsarchitektur eingebunden wird. Im Folgenden finden Sie eine Zusammenstellung von Richtlinien dazu, wie sich bestimmte Header auswirken können und wie damit umzugehen ist.

## YARP-Headerfilterung

YARP entfernt automatisch Anforderungs- und Antwortheader, die die Fähigkeit beeinträchtigen könnten, eine Anforderung korrekt weiterzuleiten, oder die böswillig verwendet werden könnten, um Funktionen des Proxys zu umgehen. Eine vollständige Liste finden Sie hier , einige Highlights werden im Folgenden beschrieben.

## Connection , KeepAlive , Close

Diese Header steuern, wie die TCP-Verbindung verwaltet wird, und werden entfernt, um zu verhindern, dass sie sich auf die Verbindung auf der anderen Seite des Proxys auswirken.

## Transfer-Encoding

Dieser Header beschreibt das Format des Anforderungs- oder Antworttexts auf der Leitung, z. B. „chunked", und wird entfernt, da sich das Format zwischen der internen und der externen Verbindung unterscheiden kann. Die eingehenden und ausgehenden HTTP-Stacks fügen bei Bedarf eigene Transportheader hinzu.

## TE

Nur der Headerwert TE: trailers wird durch den Proxy zugelassen, da er für einige gRPC-Implementierungen erforderlich ist.

## Upgrade

Dies wird für Protokolle wie WebSockets verwendet. Er wird standardmäßig entfernt und nur für ausdrücklich unterstützte Protokolle (WebSockets, SPDY) wieder hinzugefügt.

## Proxy-*

Dies sind Header, die mit Proxys verwendet werden und deren Weiterleitung nicht als angemessen betrachtet wird.

## Alt-Svc

Dieser Antwortheader wird bei HTTP/3-Upgrades verwendet und gilt nur für die unmittelbare Verbindung.

## Header für verteiltes Tracing

Zu diesen Headern zählen TraceParent , Request-Id , TraceState , Baggage und Correlation- Context .

Sie werden automatisch anhand von DistributedContextPropagator.Fields entfernt, sodass der weiterleitende HttpClient sie durch aktualisierte Werte ersetzen kann.

Sie können das Ändern dieser Header deaktivieren, indem Sie SocketsHttpHandler.ActivityHeadersPropagator auf null setzen:

```csharp
   services.AddReverseProxy()
          .ConfigureHttpClient((_, handler) => handler.ActivityHeadersPropagator =
   null);
```

## Strict-Transport-Security

Dieser Header weist Clients an, immer HTTPS zu verwenden, wobei es jedoch zu einem Konflikt zwischen den vom Proxy und vom Ziel bereitgestellten Werten kommen kann. Um Verwirrung zu vermeiden, wird der Wert des Ziels nicht in die Antwort kopiert, wenn die Proxyanwendung der Antwort bereits einen eigenen Wert hinzugefügt hat.

## Weitere Header-Richtlinien

## Host

Der Host-Header gibt an, für welche Website auf dem Server die Anforderung bestimmt ist. Dieser Header wird standardmäßig entfernt, da sich der öffentlich vom Proxy verwendete Hostname wahrscheinlich von dem des dahinterliegenden Diensts unterscheidet. Dies lässt sich mithilfe der RequestHeaderOriginalHost-Transformation konfigurieren.

## X-Forwarded-* , Forwarded

Da für die Kommunikation mit dem Ziel eine separate Verbindung verwendet wird, können diese Anforderungsheader genutzt werden, um Informationen über die ursprüngliche Verbindung weiterzuleiten, etwa IP-Adresse, Schema, Port und Clientzertifikat. X-Forwarded-For , X-Forwarded-Proto , X-Forwarded-Host und X-Forwarded-Prefix sind standardmäßig aktiviert. Da diese Informationen anfällig für Spoofing-Angriffe sind, werden vorhandene Header der Anforderung standardmäßig entfernt und ersetzt. Die Zielanwendung sollte vorsichtig sein, wie viel Vertrauen sie diesen Werten entgegenbringt. Informationen zur Konfiguration dieser Header im Proxy finden Sie unter Transforms. Hinweise zur Konfiguration der Zielanwendung, damit sie diese Header liest, finden Sie unter Configure ASP.NET Core to work with proxy servers and load balancers.

## X-http-method-override , x-http-method , x-method-override

Einige Clients und Server schränken ein, welche HTTP-Methoden sie zulassen (zum Beispiel GET). Diese Anforderungsheader werden manchmal verwendet, um diese Einschränkungen zu umgehen. Diese Header werden standardmäßig weitergeleitet. Wenn Sie im Proxy solche Umgehungen verhindern möchten, verwenden Sie die RequestHeaderRemove-Transformation.

## Set-Cookie

Dieser Antwortheader kann Felder enthalten, die Aspekte der URL einschränken, etwa das Schema, die Domäne oder den Pfad, in dem das Cookie verwendet werden soll. Die Verwendung eines Reverse Proxys kann das effektive Schema, die Domäne oder den Pfad einer Website aus öffentlicher Sicht verändern. Es wäre zwar möglich, Antwortcookies mithilfe benutzerdefinierter Transformationen umzuschreiben, wir empfehlen stattdessen jedoch, die zuvor beschriebenen Forwarded-Header zu verwenden, um die korrekten Werte an die Zielanwendung weiterzuleiten, damit diese die richtigen Set-Cookie-Header generieren kann.

## Location

Dieser Antwortheader wird bei Umleitungen verwendet und kann aufgrund der Verwendung des Proxys ein Schema, eine Domäne und einen Pfad enthalten, die von den öffentlichen Werten abweichen. Es wäre zwar möglich, den Location-Header mithilfe benutzerdefinierter Transformationen umzuschreiben, es wird jedoch stattdessen empfohlen, die oben beschriebenen Forwarded-Header zu verwenden, um die korrekten Werte an die Zielanwendung weiterzuleiten, damit diese die richtigen Location-Header generieren kann.

## Server

Dieser Antwortheader gibt an, welche Servertechnologie zur Erzeugung der Antwort verwendet wurde (zum Beispiel IIS, Kestrel). Dieser Header wird standardmäßig vom Ziel weitergeleitet. Anwendungen, die ihn entfernen möchten, können die ResponseHeaderRemove-Transformation verwenden; in diesem Fall wird der

standardmäßige Server-Header des Proxys verwendet. Das Unterdrücken des standardmäßigen Server-Headers des Proxys ist

serverspezifisch, etwa bei Kestrel.

## X-Powered-By

Dieser Antwortheader gibt an, welches Webframework zur Erzeugung der Antwort verwendet wurde (zum Beispiel ASP.NET). ASP.NET Core generiert diesen Header nicht, IIS hingegen kann dies tun. Dieser Header wird standardmäßig vom Ziel weitergeleitet. Anwendungen, die ihn entfernen möchten, können die ResponseHeaderRemove-Transformation verwenden.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
