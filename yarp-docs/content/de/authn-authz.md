---
slug: authn-authz
title: Authentifizierung & Autorisierung
lede: >-
  Der Reverse Proxy kann verwendet werden, um Anforderungen zu authentifizieren und zu
  autorisieren, bevor sie weitergeleitet werden
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/authn-authz
lastUpdated: 2026-08-11
---

## YARP-Authentifizierung und -Autorisierung

## Einführung

Der Reverse Proxy kann verwendet werden, um Anforderungen zu authentifizieren und zu autorisieren, bevor sie an die Zielserver weitergeleitet werden. Dadurch kann die Auslastung der Zielserver reduziert, eine zusätzliche Schutzschicht hinzugefügt und die konsistente Umsetzung von Richtlinien in Ihren Anwendungen sichergestellt werden.

## Standardverhalten

Es wird keine Authentifizierung oder Autorisierung für Anforderungen durchgeführt, sofern dies nicht in der Routen- oder Anwendungskonfiguration aktiviert ist.

## Konfiguration

Autorisierungsrichtlinien können pro Route über RouteConfig.AuthorizationPolicy angegeben und aus den Routes-Abschnitten der Konfigurationsdatei gebunden werden. Wie bei anderen Route-Eigenschaften kann dies geändert und neu geladen werden, ohne den Proxy neu zu starten. Bei Richtliniennamen wird die Groß-/Kleinschreibung nicht beachtet.

Beispiel:

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "AuthorizationPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
          }
      },
      "Clusters": {
          "cluster1": {
             "Destinations": {
                "cluster1/destination1": {
                    "Address": "https://localhost:10001/"
                }
             }
          }
      }
             }
          }
Authorization policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core authentication and authorization components.
Authorization policies can be configured in the application as follows:
   services.AddAuthorization(options =>
   {
          options.AddPolicy("customPolicy", policy =>
                 policy.RequireAuthenticatedUser());
   });
In Program.cs add the Authorization and Authentication middleware.
   app.UseAuthentication();
   app.UseAuthorization();
   app.MapReverseProxy();
See the Authentication docs for setting up your preferred kind of authentication.
Special values:
In addition to custom policy names, there are two special values that can be specified in a
route's authorization parameter: default and anonymous . ASP.NET Core also has a
FallbackPolicy setting that applies to routes that do not specify a policy.
```

## DefaultPolicy

Wird im Autorisierungsparameter einer Route der Wert default angegeben, verwendet diese Route die in AuthorizationOptions.DefaultPolicy definierte Richtlinie. Diese Richtlinie ist standardmäßig so konfiguriert, dass authentifizierte Benutzer erforderlich sind.

## Anonymous

Wird im Autorisierungsparameter einer Route der Wert anonymous angegeben, bedeutet dies, dass für diese Route keine Autorisierung erforderlich ist,

unabhängig von jeder anderen Konfiguration in der Anwendung, wie etwa der

FallbackPolicy.

## FallbackPolicy

AuthorizationOptions.FallbackPolicy ist die Richtlinie, die für jede Anforderung oder Route verwendet wird, die nicht mit einer Richtlinie konfiguriert wurde. FallbackPolicy hat standardmäßig keinen Wert, sodass jede Anforderung zugelassen wird.

## Weiterleiten von Anmeldeinformationen

Auch nachdem eine Anforderung im Proxy autorisiert wurde, muss der Zielserver möglicherweise weiterhin wissen, wer der Benutzer ist (Authentifizierung) und was er tun darf (Autorisierung). Wie Sie diese Informationen weiterleiten, hängt von der verwendeten Art der Authentifizierung ab.

## Cookie, Bearer, API-Schlüssel

Diese Authentifizierungstypen übergeben ihre Werte bereits in den Anforderungsheadern, und diese werden standardmäßig an den Zielserver weitergeleitet. Dieser Server muss die Werte weiterhin überprüfen und interpretieren, was zu einem gewissen Mehraufwand führt.

## OAuth2, OpenIdConnect, WsFederation

Diese Protokolle werden häufig mit externen Identitätsanbietern verwendet. Der Authentifizierungsprozess kann in der Proxyanwendung konfiguriert werden und führt zu einem Authentifizierungscookie. Dieses Cookie wird als normaler Anforderungsheader an den Zielserver weitergeleitet.

## Windows, Negotiate, NTLM, Kerberos

Diese Authentifizierungstypen sind häufig an eine bestimmte Verbindung gebunden. Sie werden nicht als Mittel zur Authentifizierung eines Benutzers auf einem Zielserver hinter dem YARP-Proxy unterstützt (siehe #166 . Sie können verwendet werden, um eine eingehende Anforderung beim Proxy zu authentifizieren, doch diese Identitätsinformationen müssen dem Zielserver in anderer Form mitgeteilt werden. Sie können auch verwendet werden, um den Proxy gegenüber den Zielservern zu authentifizieren, allerdings nur als eigener Benutzer des Proxys – die Identitätsübernahme des Clients wird nicht unterstützt.

## Clientzertifikate

Clientzertifikate sind eine TLS-Funktion und werden im Rahmen einer Verbindung ausgehandelt. Weitere Informationen finden Sie in dieser Dokumentation

zu diesem Thema. Das Zertifikat kann dem Zielserver als

HTTP-Header übergeben werden – unter Verwendung der ClientCert-Transformation.

## Authentifizierungstypen austauschen

Authentifizierungstypen wie Windows, die nicht auf natürliche Weise an den Zielserver weitergeleitet werden, müssen im Proxy in eine alternative Form umgewandelt werden. Beispielsweise kann ein JWT-Bearer-Token mit den Benutzerinformationen erstellt und in der Proxyanforderung festgelegt werden.

Diese Umwandlungen können mithilfe benutzerdefinierter Anforderungstransformationen durchgeführt werden. Bei ausreichendem Interesse der Community können detaillierte Beispiele für bestimmte Szenarien entwickelt werden. Wir benötigen mehr Feedback aus der Community dazu, wie Sie Identitätsinformationen umwandeln und weiterleiten möchten.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
