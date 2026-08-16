---
slug: session-affinity
title: Sitzungsaffinität
lede: >-
  Sitzungsaffinität ist ein Mechanismus, um eine kausal zusammenhängende Anforderungsfolge an das
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/session-affinity
lastUpdated: 2026-08-11
---

## Konzept

Sitzungsaffinität ist ein Mechanismus, um eine kausal zusammenhängende Anforderungsfolge an das Ziel zu binden (zu affinitisieren), das die erste Anforderung verarbeitet hat, wenn die Last auf mehrere Ziele verteilt wird. Dies ist in Szenarien nützlich, in denen die meisten Anforderungen einer Folge mit denselben Daten arbeiten und sich die Kosten des Datenzugriffs je nach dem Knoten (Ziel) unterscheiden, der die Anforderungen verarbeitet. Das häufigste Beispiel ist ein kurzlebiger Cache (z. B. im Arbeitsspeicher), bei dem die erste Anforderung Daten aus einem langsameren persistenten Speicher in einen schnellen lokalen Cache lädt und die weiteren Anforderungen nur mit den zwischengespeicherten Daten arbeiten, wodurch der Durchsatz erhöht wird.

## Konfiguration

## Dienste- und Middleware-Registrierung

Die Dienste für die Sitzungsaffinität werden automatisch von AddReverseProxy() im DI-Container registriert. Die Middleware UseSessionAffinity() ist standardmäßig in der parameterlosen Methode MapReverseProxy enthalten. Wenn Sie die Proxy-Pipeline anpassen, platzieren Sie diese Middleware vor dem Hinzufügen von UseLoadBalancing() .

Beispiel:

```csharp
   app.MapReverseProxy(proxyPipeline =>
   {
          proxyPipeline.UseSessionAffinity();
          proxyPipeline.UseLoadBalancing();
   });
Note Some session affinity implementations depend on Data Protection, which will require
additional configuration for scenarios like multiple proxy instances. See Key Protection for
details.
```

## Clusterkonfiguration

Die Sitzungsaffinität wird pro Cluster gemäß dem folgenden Konfigurationsschema konfiguriert.

```json
"ReverseProxy": {
   "Clusters": {
      "<cluster-name>": {
         "SessionAffinity": {
             "Enabled": "(true|false)", // defaults to 'false'
             "Policy": "(HashCookie|ArrCookie|Cookie|CustomHeader)", // defaults to
'HashCookie'
             "FailurePolicy": "(Redistribute|Return503Error)", // defaults to
'Redistribute'
             "AffinityKeyName": "Key1",
             "Cookie": {
                "Domain": "localhost",
                "Expiration": "03:00:00",
                "HttpOnly": true,
                "IsEssential": true,
                "MaxAge": "1.00:00:00",
                "Path": "mypath",
                "SameSite": "Strict",
                "SecurePolicy": "Always"
             }
         }
      }
   }
}
```

## Cookiekonfiguration

Attribute zum Konfigurieren des Cookies, das von den Richtlinien HashCookie, ArrCookie und Cookie verwendet wird, können über SessionAffinityCookieConfig festgelegt werden. Die Eigenschaften lassen sich wie oben gezeigt per JSON-Konfiguration oder wie unten gezeigt im Code festlegen:

```csharp
new ClusterConfig
{
      ClusterId = "cluster1",
      SessionAffinity = new SessionAffinityConfig
      {
             Enabled = true,
             FailurePolicy = "Return503Error",
             Policy = "HashCookie",
             AffinityKeyName = "Key1",
             Cookie = new SessionAffinityCookieConfig
             {
                   Domain = "mydomain",
                   Expiration = TimeSpan.FromHours(3),
                   HttpOnly = true,
                   IsEssential = true,
                   MaxAge = TimeSpan.FromDays(1),
                      Path = "mypath",
                      SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict,
                      SecurePolicy =
Microsoft.AspNetCore.Http.CookieSecurePolicy.SameAsRequest
                   }
   }
}
```

## Affinitätsschlüssel

Die Affinität zwischen Anforderung und Ziel wird über den Affinitätsschlüssel hergestellt, der das Ziel identifiziert. Dieser Schlüssel kann je nach der jeweiligen Implementierung der Sitzungsaffinität an unterschiedlichen Stellen der Anforderung gespeichert werden, wobei jede Anforderung jedoch nicht mehr als einen solchen Schlüssel enthalten kann. Die genaue Semantik des Schlüssels ist implementierungsabhängig, aber die integrierten Richtlinien verwenden derzeit DestinationId als Affinitätsschlüssel.

Das aktuelle Design erfordert nicht, dass ein Schlüssel das einzelne affinitisierte Ziel eindeutig identifiziert. Es ist zulässig, die Affinität zu einer Zielgruppe herzustellen. In diesem Fall wird das genaue Ziel, das die jeweilige Anforderung verarbeitet, vom Lastenausgleich bestimmt.

Herstellen einer neuen Affinität oder Auflösung einer bestehenden

Sobald eine Anforderung eintrifft und an einen Cluster mit aktivierter Sitzungsaffinität weitergeleitet wird, entscheidet der Proxy automatisch anhand des Vorhandenseins und der Gültigkeit eines Affinitätsschlüssels in der Anforderung, ob eine neue Affinität hergestellt oder eine bestehende aufgelöst werden muss, und zwar wie folgt:

1. Die Anforderung enthält keinen Schlüssel. Die Auflösung wird übersprungen, und es wird eine neue Affinität zu dem vom Lastenausgleich ausgewählten Ziel hergestellt

2. Der Affinitätsschlüssel wird in der Anforderung gefunden und ist gültig. Der Affinitätsmechanismus versucht, alle fehlerfreien Ziele zu finden, die dem Schlüssel entsprechen, und leitet die Anforderung in der Pipeline weiter, wenn er welche findet. Werden mehrere passende Ziele gefunden, wird der Lastenausgleich aufgerufen, um das Ziel auszuwählen. Wird nur ein passendes Ziel gefunden, führt der Lastenausgleich keine Aktion aus.

3. Der Affinitätsschlüssel ist ungültig, oder es wurden keine fehlerfreien affinitisierten Ziele gefunden. Dies wird als Fehler behandelt, der von einer weiter unten erläuterten Fehlerrichtlinie verarbeitet wird

Wenn für die Anforderung eine neue Affinität hergestellt wurde, wird der Affinitätsschlüssel an eine Antwort angehängt, wobei die genaue Darstellung und Position des Schlüssels von der Implementierung abhängt. Derzeit gibt es zwei integrierte Richtlinien, die den Schlüssel in einem Cookie oder einem benutzerdefinierten Header speichern. Sobald die Antwort

an den Client übermittelt wurde, liegt es in der Verantwortung des Clients, den Schlüssel an alle folgenden Anforderungen in

derselben Sitzung anzuhängen. Wenn außerdem die nächste Anforderung, die den Schlüssel enthält, beim Proxy eintrifft,

löst dieser die bestehende Affinität auf, aber der Affinitätsschlüssel wird der Antwort nicht erneut angehängt. Somit

enthält nur die erste Antwort den Affinitätsschlüssel.

Es gibt vier integrierte Affinitätsrichtlinien, die den Schlüssel in Anforderungen und Antworten unterschiedlich formatieren und speichern. Die Standardrichtlinie ist HashCookie .

Die Richtlinien HashCookie , ArrCookie und Cookie speichern den Schlüssel als Cookie, und zwar gehasht bzw. verschlüsselt, siehe Schlüsselschutz weiter unten. Der Schlüssel der Anforderung wird als Cookie mit dem konfigurierten Namen übermittelt, und dasselbe Cookie wird über den Set-Cookie-Header in der ersten Antwort einer affinitisierten Folge gesetzt. Der Cookiename muss explizit über SessionAffinityConfig.AffinityKeyName festgelegt werden. Weitere Cookie-Eigenschaften können über SessionAffinityCookieConfig konfiguriert werden. CustomHeader speichert den Schlüssel als verschlüsselten Header. Dabei wird erwartet, dass der Affinitätsschlüssel in einem benutzerdefinierten Header mit dem konfigurierten Namen übermittelt wird, und derselbe Header wird in der ersten Antwort einer affinitisierten Folge gesetzt. Der Headername muss über SessionAffinityConfig.AffinityKeyName festgelegt werden.

:::note
AffinityKeyName muss über alle Cluster mit aktivierter Sitzungsaffinität hinweg eindeutig sein, um Konflikte zu vermeiden.
:::

## Schlüsselschutz

Die Richtlinie HashCookie verwendet den XxHash64-Hash, um ein schnelles, kompaktes und verschleiertes Ausgabeformat für den Cookiewert zu erzeugen.

Die Richtlinie ArrCookie verwendet den SHA-256-Hash, um eine verschleierte Ausgabe für den Cookiewert zu erzeugen, die dem ARR-Affinitäts-Cookieformat von IIS entspricht. ARR verwendet den Hostnamen des Ziels als Eingabewert, sodass die Ziel-IDs von YARP entsprechend konfiguriert werden müssten, wenn sie zusammen mit ARR verwendet werden.

HashCookie und ArrCookie bieten keinen starken Datenschutz, und vertrauliche Daten sollten nicht in Ziel-IDs enthalten sein. Diese Richtlinien verbergen zudem nicht die Gesamtzahl der eindeutigen Ziele hinter dem Proxy und sollten nicht verwendet werden, wenn dies ein Problem darstellt.

Die Richtlinien Cookie und CustomHeader verschlüsseln den Schlüssel mithilfe von Data Protection. Dies bietet einen starken Datenschutz für den Schlüssel, erfordert jedoch zusätzliche Konfiguration, wenn mehr als eine Proxy-Instanz verwendet wird.

## Richtlinie für Affinitätsfehler

Wenn der Affinitätsschlüssel nicht decodiert werden kann oder kein fehlerfreies Ziel gefunden wird, wird dies als

Fehler betrachtet, und eine Richtlinie für Affinitätsfehler wird aufgerufen, um ihn zu behandeln. Die Richtlinie hat vollen Zugriff auf den

HttpContext und kann selbst eine Antwort an den Client senden. Sie gibt einen booleschen Wert zurück, der angibt,

ob die Anforderungsverarbeitung in der Pipeline fortgesetzt werden kann oder abgebrochen werden muss.

Es gibt zwei integrierte Fehlerrichtlinien. Die Standardrichtlinie ist Redistribute .

1. Redistribute – versucht, eine neue Affinität zu einem der verfügbaren fehlerfreien Ziele herzustellen, indem der Schritt der Affinitätssuche übersprungen wird und alle fehlerfreien Ziele an den Lastenausgleich übergeben werden, genau wie bei einer Anforderung ohne jegliche Affinität. Die Anforderungsverarbeitung wird fortgesetzt. Dies wird durch RedistributeAffinityFailurePolicy implementiert.

2. Return503Error – sendet eine 503-Antwort an den Client zurück, und die Anforderungsverarbeitung wird abgebrochen. Dies wird durch Return503ErrorAffinityFailurePolicy implementiert

## Anforderungspipeline

Die Mechanismen der Sitzungsaffinität werden durch die oben genannten Dienste und die beiden folgenden Middlewares implementiert:

1. SessionAffinityMiddleware – koordiniert den Prozess der Affinitätsauflösung für die Anforderung. Zunächst ruft sie die für den jeweiligen Cluster in der Eigenschaft ClusterConfig.SessionAffinity.Policy angegebene Richtlinie auf. Anschließend prüft sie den von der Richtlinie zurückgegebenen Status der Affinitätsauflösung und ruft im Fehlerfall die in ClusterConfig.SessionAffinity.FailurePolicy festgelegte Fehlerbehandlungsrichtlinie auf. Sie muss vor dem Lastenausgleich in die Pipeline eingefügt werden.

2. AffinitizeTransform – setzt den Schlüssel in der Antwort, wenn für die Anforderung eine neue Affinität hergestellt wurde. Andernfalls, wenn die Anforderung einer bestehenden Affinität folgt, unternimmt sie nichts. Diese wird automatisch als Antworttransformation hinzugefügt.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
