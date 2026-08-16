---
slug: middleware
title: Middleware
lede: >-
  ASP.NET Core verwendet eine Middleware-Pipeline, um die Anforderungsverarbeitung in einzelne
  Schritte zu unterteilen. Der
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/middleware
lastUpdated: 2026-08-11
---

## Einführung

ASP.NET Core verwendet eine Middleware-Pipeline, um die Anforderungsverarbeitung in einzelne Schritte zu unterteilen. Der App-Entwickler kann Middleware nach Bedarf hinzufügen und deren Reihenfolge festlegen. ASP.NET Core-Middleware wird auch verwendet, um die Reverse-Proxy-Funktionalität zu implementieren und anzupassen.

## Standardeinstellungen

Das Beispiel zum Einstieg zeigt die folgende Configure-Methode. Diese richtet eine Middleware-Pipeline mit Entwicklungstools, Routing und proxykonfigurierten Endpunkten ein ( MapReverseProxy ).

```csharp
         var builder = WebApplication.CreateBuilder(args);
         builder.Services.AddReverseProxy()
                .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
         var app = builder.Build();
         app.MapReverseProxy();
         app.Run();
The parameterless MapReverseProxy() in ReverseProxyIEndpointRouteBuilderExtensions
overload includes all standard proxy middleware for session affinity, load balancing, passive
health checks, and the final proxying of the request. Each of these check the configuration of
the matched route, cluster, and destination and perform their task accordingly.
```

## Middleware hinzufügen

Zu Ihrer Anwendungspipeline hinzugefügte Middleware sieht die Anforderung je nach Position der Middleware in unterschiedlichen Verarbeitungszuständen. Middleware, die vor UseRouting hinzugefügt wird, sieht alle Anforderungen und kann sie manipulieren, bevor ein Routing stattfindet. Middleware, die zwischen UseRouting und UseEndpoints hinzugefügt wird, kann HttpContext.GetEndpoint() aufrufen, um zu prüfen, welchem Endpunkt das Routing die Anforderung zugeordnet hat (falls vorhanden), und die mit diesem Endpunkt verknüpften Metadaten verwenden. So werden Authentifizierung, Autorisierung und CORS gehandhabt.

ReverseProxyIEndpointRouteBuilderExtensions stellt eine Überladung von MapReverseProxy bereit, mit der Sie eine Middleware-Pipeline erstellen können, die nur für Anforderungen ausgeführt wird, die proxy-

konfigurierten Routen zugeordnet sind.

app.MapReverseProxy(proxyPipeline => {

proxyPipeline.Use((context, next) => {

## // Custom inline middleware

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); proxyPipeline.UsePassiveHealthChecks(); });

By default this overload of MapReverseProxy only includes the minimal setup, proxying logic, and limit enforcement at the start and end of its pipeline. Middleware for session affinity, load balancing, and passive health checks are not included by default so that you can exclude, replace, or control their ordering with any additional middleware.

## Benutzerdefinierte Proxy-Middleware

Middleware innerhalb der MapReverseProxy-Pipeline hat über die IReverseProxyFeature Zugriff auf alle Proxydaten und den mit einer Anforderung verknüpften Zustand (Route, Cluster, Ziele usw.). Diese ist über HttpContext.Features oder die Erweiterungsmethode HttpContext.GetReverseProxyFeature() verfügbar.

Die Daten in IReverseProxyFeature werden zu Beginn der Proxy-Pipeline als Momentaufnahme der Proxykonfiguration erstellt und werden von Änderungen der Proxykonfiguration, die während der Verarbeitung der Anforderung auftreten, nicht beeinflusst.

```csharp
   proxyPipeline.Use((context, next) =>
   {
          var proxyFeature = context.GetReverseProxyFeature();
          var cluster = proxyFeature.Cluster;
          var destinations = proxyFeature.AvailableDestinations;
          return next();
   });
```

## Was mit Middleware getan werden sollte

Middleware kann Protokolle generieren, steuern, ob eine Anforderung weitergeleitet wird oder nicht, beeinflussen, wohin sie weitergeleitet wird, und zusätzliche Funktionen wie Fehlerbehandlung, Wiederholungsversuche usw. hinzufügen.

## Protokolle und Metriken

Middleware kann Anforderungs- und Antwortfelder untersuchen, um Protokolle zu generieren und Metriken zu aggregieren. Beachten Sie den Hinweis zu Bodies weiter unten unter „Was mit Middleware nicht getan werden sollte“.

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          LogRequest(context);
          await next();
          LogResponse(context);
   });
```

## Eine sofortige Antwort senden

Wenn eine Middleware eine Anforderung untersucht und feststellt, dass sie nicht weitergeleitet werden soll, kann sie eine eigene Antwort generieren und die Kontrolle an den Server zurückgeben, ohne next() aufzurufen.

```csharp
   proxyPipeline.Use((context, next) =>
   {
          if (!CheckAllowedRequest(context, out var reason))
          {
                 context.Response.StatusCode = StatusCodes.Status400BadRequest;
                 return context.Response.WriteAsync(reason);
          }
          return next();
   });
```

## Ziele filtern

Middleware wie Sitzungsaffinität und Lastenausgleich untersucht IReverseProxyFeature und die Clusterkonfiguration, um zu entscheiden, an welches Ziel eine Anforderung gesendet werden soll. AllDestinations listet alle Ziele im ausgewählten Cluster auf.

AvailableDestinations listet die Ziele auf, die derzeit als geeignet gelten, um die

Anforderung zu verarbeiten. Sie wird mit AllDestinations initialisiert, wobei nicht integre Ziele ausgeschlossen werden, sofern Integritätsprüfungen

aktiviert sind. AvailableDestinations sollte bis zum Ende der

Pipeline auf ein einzelnes Ziel reduziert werden, andernfalls wird eines zufällig aus dem Rest ausgewählt.

ProxiedDestination wird von der Proxylogik am Ende der Pipeline festgelegt, um anzugeben, welches Ziel letztlich verwendet wurde. Wenn keine verfügbaren Ziele mehr vorhanden sind, wird eine 503-Fehlerantwort gesendet.

```csharp
proxyPipeline.Use(async (context, next) =>
{
      var proxyFeature = context.GetReverseProxyFeature();
      proxyFeature.AvailableDestinations =
Filter(proxyFeature.AvailableDestinations);
      await next();
      Report(proxyFeature.ProxiedDestination);
});
DestinationState implements IReadOnlyList<DestinationState> so a single destination can be
assigned to AvailableDestinations without creating a new list.
```

## Fehlerbehandlung

Middleware kann den Aufruf von await next() in einen try/catch-Block einschließen, um Ausnahmen aus späteren Komponenten zu behandeln.

Die Proxylogik am Ende der Pipeline (IHttpForwarder) löst bei üblichen Proxyfehlern von Anforderungen keine Ausnahmen aus. Diese werden erfasst und in IForwarderErrorFeature gemeldet, das über HttpContext.Features oder die Erweiterungsmethode HttpContext.GetForwarderErrorFeature() verfügbar ist.

```csharp
   proxyPipeline.Use(async (context, next) =>
   {
          await next();
          var errorFeature = context.GetForwarderErrorFeature();
          if (errorFeature is not null)
          {
                 Report(errorFeature.Error, errorFeature.Exception);
                 }
          });
If the response has not started ( HttpResponse.HasStarted ) it can be cleared
( HttpResponse.Clear() ) and an alternate response sent, or the proxy feature fields may be
reset and the request retried.
```

## Was mit Middleware nicht getan werden sollte

Middleware sollte vorsichtig sein, wenn sie Anforderungsfelder wie Header ändert, um die ausgehende weitergeleitete Anforderung zu beeinflussen. Solche Änderungen können mit Funktionen wie Wiederholungsversuchen in Konflikt geraten und werden möglicherweise besser über Transforms gehandhabt.

Middleware MUSS HttpResponse.HasStarted prüfen, bevor sie nach dem Aufruf von next() Antwortfelder ändert. Wenn die Antwort bereits an den Client gesendet wird, kann die Middleware sie nicht mehr ändern (außer eventuell Trailers). Transforms können verwendet werden, um unerwünschte Antworten zu untersuchen und zu unterdrücken. Andernfalls siehe den nächsten Hinweis.

Middleware sollte die Interaktion mit Anforderungs- oder Antwort-Bodies vermeiden. Bodies werden standardmäßig nicht gepuffert, sodass eine Interaktion mit ihnen verhindern kann, dass sie ihr Ziel erreichen. Das Aktivieren der Pufferung ist zwar möglich, wird jedoch nicht empfohlen, da dies erheblichen Speicher- und Latenzaufwand verursachen kann. Es wird empfohlen, einen umschließenden Streaming-Ansatz zu verwenden, wenn der Body untersucht oder geändert werden muss. Ein Beispiel finden Sie in der ResponseCompression-Middleware.

Middleware DARF KEINE Multithread-Arbeit für eine einzelne Anforderung durchführen; HttpContext und die zugehörigen Member sind nicht threadsicher.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
