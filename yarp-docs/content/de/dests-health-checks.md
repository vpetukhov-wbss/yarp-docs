---
slug: dests-health-checks
title: Integritätsprüfungen für Ziele
lede: >-
  In den meisten realen Systemen ist zu erwarten, dass deren Knoten gelegentlich
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks
lastUpdated: 2026-08-11
---

In den meisten realen Systemen ist zu erwarten, dass deren Knoten gelegentlich vorübergehende Probleme haben und aus verschiedenen Gründen wie Überlastung, Ressourcenlecks, Hardwarefehlern usw. vollständig ausfallen. Idealerweise wäre es wünschenswert, solche unglücklichen Ereignisse proaktiv vollständig zu verhindern, aber die Kosten für das Entwerfen und Erstellen eines solchen idealen Systems sind in der Regel unerschwinglich hoch. Es gibt jedoch einen anderen, reaktiven Ansatz, der kostengünstiger ist und darauf abzielt, die negativen Auswirkungen von Ausfällen auf Clientanforderungen zu minimieren. Der Proxy kann den Integritätszustand jedes Knotens analysieren und den Clientdatenverkehr an fehlerhafte Knoten stoppen, bis diese sich erholt haben. YARP setzt diesen Ansatz in Form von aktiven und passiven Integritätsprüfungen für Ziele um. Sie sind unabhängig voneinander und werden in den entsprechenden Eigenschaften jedes Ziels gespeichert. Integritätszustände werden mit dem Wert Unknown initialisiert, der später durch die entsprechenden Richtlinien wie unten erläutert in Healthy oder Unhealthy geändert werden kann.

## Aktive Integritätsprüfungen

YARP kann den Integritätszustand von Zielen proaktiv überwachen, indem es periodische Prüfanforderungen an festgelegte Integritäts-Endpunkte sendet und die Antworten analysiert. Diese Analyse wird von einer für einen Cluster angegebenen aktiven Integritätsprüfungsrichtlinie durchgeführt und führt zur Berechnung der neuen Integritätszustände der Ziele. Am Ende markiert die Richtlinie jedes Ziel basierend auf dem HTTP-Antwortcode (2xx gilt als fehlerfrei) als fehlerfrei oder fehlerhaft und baut die Sammlung der fehlerfreien Ziele des Clusters neu auf.

Es gibt mehrere clusterweite Konfigurationseinstellungen zur Steuerung aktiver Integritätsprüfungen, die entweder in der Konfigurationsdatei oder im Code festgelegt werden können. Ein dedizierter Integritäts-Endpunkt kann auch pro Ziel angegeben werden.

## Dateibeispiel

```json
"Clusters": {
   "cluster1": {
      "HealthCheck": {
         "Active": {
             "Enabled": "true",
             "Interval": "00:00:10",
             "Timeout": "00:00:10",
             "Policy": "ConsecutiveFailures",
             "Path": "/api/health",
                      "Query": "?foo=bar"
                   }
      },
      "Metadata": {
                   "ConsecutiveFailuresHealthPolicy.Threshold": "3"
      },
      "Destinations": {
                   "cluster1/destination1": {
                      "Address": "https://localhost:10000/"
                   },
                   "cluster1/destination2": {
                      "Address": "http://localhost:10010/",
                      "Health": "http://localhost:10020/"
                   }
      }
   }
}
```

## Codebeispiel

```csharp
   var clusters = new[]
   {
          new ClusterConfig()
          {
                 ClusterId = "cluster1",
                 HealthCheck = new HealthCheckConfig
                 {
                       Active = new ActiveHealthCheckConfig
                       {
                              Enabled = true,
                              Interval = TimeSpan.FromSeconds(10),
                              Timeout = TimeSpan.FromSeconds(10),
                              Policy = HealthCheckConstants.ActivePolicy.ConsecutiveFailures,
                              Path = "/api/health",
                              Query = "?foo=bar",
                       }
                 },
                 Metadata = new Dictionary<string, string> { {
   ConsecutiveFailuresHealthPolicyOptions.ThresholdMetadataName, "5" } },
                 Destinations =
                 {
                       { "destination1", new DestinationConfig() { Address =
   "https://localhost:10000" } },
                       { "destination2", new DestinationConfig() { Address =
   "https://localhost:10010", Health = "https://localhost:10010" } }
                 }
          }
   };
```

## Konfiguration

Alle bis auf eine der aktiven Integritätsprüfungseinstellungen werden auf Clusterebene im Abschnitt Cluster/HealthCheck/Active angegeben. Die einzige Ausnahme ist ein optionales Element Destination/Health, das einen separaten aktiven Integritätsprüfungs-Endpunkt angibt. Die tatsächliche Prüf-URI wird als Destination/Address (oder Destination/Health, falls festgelegt) + Cluster/HealthCheck/Active/Path zusammengesetzt.

Aktive Integritätsprüfungseinstellungen können auch im Code über die entsprechenden Typen im Namespace Yarp.ReverseProxy.Configuration festgelegt werden, die den Konfigurationsvertrag widerspiegeln.

Abschnitt Cluster/HealthCheck/Active und ActiveHealthCheckConfig:

Enabled : Kennzeichnet, ob die aktive Integritätsprüfung für einen Cluster aktiviert ist. Standard

false

Interval : Intervall zum Senden von Prüfanforderungen. Standard 00:00:15 Timeout : Timeout für Prüfanforderungen. Standard 00:00:10 Policy : Name einer Richtlinie zur Bewertung der aktiven Integritätszustände der Ziele. Erforderlicher Parameter Path : Integritätsprüfungspfad auf allen Zielen des Clusters. Standard null . Query : Integritätsprüfungs-Abfrage auf allen Zielen des Clusters. Standard null .

Abschnitt Destination und DestinationConfig.

Health : Ein dedizierter Endpunkt für die Integritätsprüfung, etwa http://destination:12345/ . Standardmäßig null, wobei dann auf Destination/Address zurückgegriffen wird.

## Integrierte Richtlinien

Derzeit gibt es eine integrierte aktive Integritätsprüfungsrichtlinie – ConsecutiveFailuresHealthPolicy . Sie zählt aufeinanderfolgende Fehlschläge bei der Integritätsprüfung und markiert ein Ziel als fehlerhaft, sobald der angegebene Schwellenwert erreicht ist. Bei der ersten erfolgreichen Antwort wird ein Ziel als fehlerfrei markiert und der Zähler zurückgesetzt. Die Parameter der Richtlinie werden wie folgt in den Metadaten des Clusters festgelegt:

ConsecutiveFailuresHealthPolicy.Threshold - Anzahl der aufeinanderfolgenden fehlgeschlagenen aktiven Prüfanforderungen, die erforderlich ist, um ein Ziel als fehlerhaft zu markieren. Standard 2 .

## Design

Der Hauptdienst in diesem Prozess ist IActiveHealthCheckMonitor, der über IProbingRequestFactory periodisch Prüfanforderungen erstellt, diese an alle DestinationConfig jeder

ClusterConfig mit aktivierten aktiven Integritätsprüfungen sendet und dann alle Antworten an eine

IActiveHealthCheckPolicy weitergibt, die für einen Cluster angegeben ist. IActiveHealthCheckMonitor trifft nicht die

eigentliche Entscheidung, ob ein Ziel fehlerfrei ist oder nicht, sondern delegiert diese Aufgabe an eine

IActiveHealthCheckPolicy, die für einen Cluster angegeben ist. Eine Richtlinie wird aufgerufen, um die neuen Integritätszustände

zu bewerten, sobald die Prüfung aller Ziele des Clusters abgeschlossen ist. Sie erhält einen ClusterState,

der den dynamischen Zustand des Clusters darstellt, sowie eine Menge von DestinationProbingResult, die die Prüfergebnisse der

Ziele des Clusters speichert. Nachdem für jedes Ziel ein neuer Integritätszustand bewertet wurde,

ruft die Richtlinie IDestinationHealthUpdater auf, um die Werte von DestinationHealthState.Active tatsächlich zu aktualisieren.

-{For each cluster's destination}- IActiveHealthCheckMonitor <--(Create probing request)--> IProbingRequestFactory

| V HttpMessageInvoker <--(Send probe and receive response)--> Destination | (Save probing result) | V DestinationProbingResult --------------{END}--------------- | (Evaluate new destination active health states using probing results) | V IActiveHealthCheckPolicy --(New active health states)--> IDestinationHealthUpdater --(Update each destination's)--> DestinationState.Health.Active

Für alle oben genannten Komponenten gibt es standardmäßige integrierte Implementierungen, die bei Bedarf auch durch benutzerdefinierte ersetzt werden können.

## Erweiterbarkeit

Es gibt 2 wesentliche Erweiterbarkeitspunkte im Teilsystem der aktiven Integritätsprüfung.

## IActiveHealthCheckPolicy

IActiveHealthCheckPolicy analysiert, wie Ziele auf aktive Integritätsprüfungen reagieren, die von IActiveHealthCheckMonitor gesendet werden, bewertet neue aktive Integritätszustände für alle geprüften Ziele und ruft anschließend IDestinationHealthUpdater.SetActive auf, um neue aktive Integritätszustände festzulegen und die Sammlung der fehlerfreien Ziele anhand der aktualisierten Werte neu aufzubauen.

Im Folgenden finden Sie ein einfaches Beispiel für eine benutzerdefinierte IActiveHealthCheckPolicy, die ein Ziel als Healthy markiert, wenn für eine Prüfung ein erfolgreicher Antwortcode zurückgegeben wurde, und andernfalls als Unhealthy .

```csharp
public class FirstUnsuccessfulResponseHealthPolicy : IActiveHealthCheckPolicy
{
      private readonly IDestinationHealthUpdater _healthUpdater;
      public FirstUnsuccessfulResponseHealthPolicy(IDestinationHealthUpdater
healthUpdater)
      {
             _healthUpdater = healthUpdater;
      }
      public string Name => "FirstUnsuccessfulResponse";
      public void ProbingCompleted(ClusterState cluster,
IReadOnlyList<DestinationProbingResult> probingResults)
      {
             if (probingResults.Count == 0)
             {
                   return;
             }
             var newHealthStates = new
NewActiveDestinationHealth[probingResults.Count];
             for (var i = 0; i < probingResults.Count; i++)
             {
                   var response = probingResults[i].Response;
                   var newHealth = response is not null && response.IsSuccessStatusCode ?
DestinationHealth.Healthy : DestinationHealth.Unhealthy;
                   newHealthStates[i] = new
NewActiveDestinationHealth(probingResults[i].Destination, newHealth);
             }
             _healthUpdater.SetActive(cluster, newHealthStates);
      }
}
```

## IProbingRequestFactory

IProbingRequestFactory erstellt aktive Prüfanforderungen, die an die Integritäts-Endpunkte der Ziele gesendet werden. Dabei können ActiveHealthCheckOptions.Path , DestinationConfig.Health und andere Konfigurationseinstellungen berücksichtigt werden, um Prüfanforderungen zu erstellen.

Die Standard-IProbingRequestFactory verwendet dieselbe HttpRequest-Konfiguration wie Proxyanforderungen. Um dies anzupassen, implementieren Sie Ihre eigene IProbingRequestFactory, und registrieren Sie sie wie unten gezeigt in der DI.

```csharp
services.AddSingleton<IProbingRequestFactory, CustomProbingRequestFactory>();
The below is a simple example of a customer IProbingRequestFactory concatenating
DestinationConfig.Address and a fixed health probe path to create the probing request URI.
```

```csharp
   public class CustomProbingRequestFactory : IProbingRequestFactory
   {
          public HttpRequestMessage CreateRequest(ClusterConfig clusterConfig,
   DestinationConfig destinationConfig)
          {
                 var probeUri = new Uri(destinationConfig.Address + "/api/probe-health");
                 return new HttpRequestMessage(HttpMethod.Get, probeUri) { Version =
   ProtocolHelper.Http11Version };
          }
   }
```

## Passive Integritätsprüfungen

YARP kann Erfolge und Fehler bei der Proxyweiterleitung von Clientanforderungen passiv beobachten, um die Integritätszustände der Ziele reaktiv zu bewerten. Antworten auf die weitergeleiteten Anforderungen werden von einer dedizierten Middleware für passive Integritätsprüfungen abgefangen, die sie an eine für den Cluster konfigurierte Richtlinie weitergibt. Die Richtlinie analysiert die Antworten, um zu bewerten, ob die Ziele, die sie erzeugt haben, fehlerfrei sind oder nicht. Anschließend berechnet und weist sie den jeweiligen Zielen neue passive Integritätszustände zu und baut die Sammlung der fehlerfreien Ziele des Clusters neu auf.

:::note
Die Antwort wird normalerweise bereits an den Client gesendet, bevor die passive Integritätsprüfungsrichtlinie ausgeführt wird. Eine Richtlinie kann den Antworttext daher nicht abfangen und auch nichts an den Antwortheadern ändern, es sei denn, die Proxyanwendung führt eine vollständige Pufferung der Antwort ein.
:::

Es gibt einen wichtigen Unterschied zur Logik der aktiven Integritätsprüfung. Sobald einem Ziel ein fehlerhafter passiver Zustand zugewiesen wird, empfängt es keinen neuen Datenverkehr mehr, was eine erneute Bewertung der Integrität in Zukunft blockiert. Die Richtlinie plant außerdem eine Reaktivierung des Ziels nach dem konfigurierten Zeitraum. Reaktivierung bedeutet, den passiven Integritätszustand von Unhealthy zurück auf den ursprünglichen Wert Unknown zurückzusetzen, wodurch das Ziel wieder für den Datenverkehr infrage kommt.

Es gibt mehrere clusterweite Konfigurationseinstellungen zur Steuerung passiver Integritätsprüfungen, die entweder in der Konfigurationsdatei oder im Code festgelegt werden können.

## Dateibeispiel

```json
"Clusters": {
   "cluster1": {
      "HealthCheck": {
         "Passive": {
             "Enabled": "true",
             "Policy": "TransportFailureRate",
             "ReactivationPeriod": "00:02:00"
         }
      },
      "Metadata": {
         "TransportFailureRateHealthPolicy.RateLimit": "0.5"
      },
      "Destinations": {
         "cluster1/destination1": {
             "Address": "https://localhost:10000/"
         },
         "cluster1/destination2": {
             "Address": "http://localhost:10010/"
         }
      }
   }
}
```

## Codebeispiel

```csharp
var clusters = new[]
{
      new ClusterConfig()
      {
             ClusterId = "cluster1",
             HealthCheck = new HealthCheckConfig
             {
                   Passive = new PassiveHealthCheckConfig
                   {
                          Enabled = true,
                          Policy = HealthCheckConstants.PassivePolicy.TransportFailureRate,
                          ReactivationPeriod = TimeSpan.FromMinutes(2)
                   }
             },
             Metadata = new Dictionary<string, string> { {
TransportFailureRateHealthPolicyOptions.FailureRateLimitMetadataName, "0.5" } },
             Destinations =
             {
                   { "destination1", new DestinationConfig() { Address =
"https://localhost:10000" } },
                   { "destination2", new DestinationConfig() { Address =
"https://localhost:10010" } }
             }
                 }
          };
```

## Konfiguration

Einstellungen für die passive Integritätsprüfung werden auf Clusterebene im Abschnitt Cluster/HealthCheck/Passive angegeben. Alternativ können sie im Code über die entsprechenden Typen im Namespace Yarp.ReverseProxy.Configuration festgelegt werden, die den Konfigurationsvertrag widerspiegeln.

Passive Integritätsprüfungen erfordern, dass die PassiveHealthCheckMiddleware in die Pipeline eingefügt wird, damit sie funktionieren. Die Standardmethode MapReverseProxy(this IEndpointRouteBuilder endpoints) erledigt dies automatisch. Bei manuellem Aufbau der Pipeline muss jedoch die Methode UsePassiveHealthChecks aufgerufen werden, um diese Middleware wie im folgenden Beispiel gezeigt hinzuzufügen.

```csharp
   endpoints.MapReverseProxy(proxyPipeline =>
   {
          proxyPipeline.UseAffinitizedDestinationLookup();
          proxyPipeline.UseProxyLoadBalancing();
          proxyPipeline.UseRequestAffinitizer();
          proxyPipeline.UsePassiveHealthChecks();
   });
Cluster/HealthCheck/Passive section and PassiveHealthCheckConfig:
       Enabled - flag indicating whether passive health check is enabled for a cluster. Default
        false
       Policy - name of a policy evaluating destinations' passive health states. Mandatory
      parameter
       ReactivationPeriod - period after which an unhealthy destination's passive health state is
      reset to Unknown and it starts receiving traffic again. Default value is null which means
      the period will be set by a IPassiveHealthCheckPolicy
```

## Integrierte Richtlinien

Derzeit gibt es eine integrierte passive Integritätsprüfungsrichtlinie – TransportFailureRateHealthPolicy. Sie berechnet die Fehlerrate der weitergeleiteten Anforderungen für jedes Ziel und markiert es als fehlerhaft, wenn der angegebene Grenzwert überschritten wird. Die Rate wird als Prozentsatz der fehlgeschlagenen Anforderungen im Verhältnis zur Gesamtzahl der an ein Ziel weitergeleiteten Anforderungen in einem bestimmten Zeitraum berechnet. Fehlgeschlagene und Gesamtzähler werden in einem gleitenden Zeitfenster erfasst, was bedeutet, dass nur die aktuellen Messwerte, die in

das Fenster passen, berücksichtigt werden. Es gibt zwei Sätze von Richtlinienparametern, die global

und auf Clusterebene definiert werden.

Globale Parameter werden über den Optionsmechanismus mithilfe des Typs TransportFailureRateHealthPolicyOptions mit den folgenden Eigenschaften festgelegt:

DetectionWindowSize - Zeitraum, über den erkannte Fehler aufbewahrt und bei der Ratenberechnung berücksichtigt werden. Standard ist 00:01:00 . MinimalTotalCountThreshold - Mindestanzahl der Anforderungen, die innerhalb des Erkennungsfensters an ein Ziel weitergeleitet werden müssen, bevor diese Richtlinie mit der Bewertung der Integrität des Ziels beginnt und den Grenzwert der Fehlerrate durchsetzt. Standard ist 10 . DefaultFailureRateLimit - Standard-Fehlerratengrenzwert für ein Ziel, das als fehlerhaft markiert werden soll und der angewendet wird, wenn er nicht in den Metadaten eines Clusters festgelegt ist. Der Wert liegt im Bereich (0,1) . Standard ist 0.3 (30 %).

Globale Richtlinienoptionen können im Code wie folgt festgelegt werden:

```csharp
services.Configure<TransportFailureRateHealthPolicyOptions>(o =>
{
      o.DetectionWindowSize = TimeSpan.FromSeconds(30);
      o.MinimalTotalCountThreshold = 5;
      o.DefaultFailureRateLimit = 0.5;
});
Cluster-specific parameters are set in the cluster's metadata as follows:
TransportFailureRateHealthPolicy.RateLimit - failure rate limit for a destination to be marked
as unhealthy. The value is in range (0,1) . Default value is provided by the global
DefaultFailureRateLimit parameter.
```

## Design

Die Hauptkomponente ist PassiveHealthCheckMiddleware, die in der Anforderungspipeline sitzt und die von den Zielen zurückgegebenen Antworten analysiert. Für jede Antwort eines Ziels, das zu einem Cluster mit aktivierten passiven Integritätsprüfungen gehört, ruft PassiveHealthCheckMiddleware eine für den Cluster angegebene IPassiveHealthCheckPolicy auf. Die Richtlinie analysiert die jeweilige Antwort, bewertet einen neuen passiven Integritätszustand des Ziels und ruft IDestinationHealthUpdater auf, um den Wert von DestinationHealthState.Passive tatsächlich zu aktualisieren. Die Aktualisierung erfolgt asynchron im Hintergrund und blockiert die Anforderungspipeline nicht. Wenn ein Ziel als fehlerhaft markiert wird, empfängt es keine neuen Anforderungen mehr, bis es nach einem konfigurierten Zeitraum reaktiviert wird. Reaktivierung bedeutet, dass der Zustand DestinationHealthState.Passive des Ziels zurückgesetzt wird von

Unhealthy zu Unknown, und die Liste der fehlerfreien Ziele des Clusters wird neu aufgebaut, um es einzuschließen. Eine

Reaktivierung wird von IDestinationHealthUpdater unmittelbar nach dem Setzen von

DestinationHealthState.Passive des Ziels auf Unhealthy geplant.

(Response to a proxied request) |

PassiveHealthCheckMiddleware | V

IPassiveHealthCheckPolicy |

(Evaluate new passive health state) |

IDestinationHealthUpdater --(Asynchronously update passive state)--> DestinationState.Health.Passive

| V (Schedule a reactivation) --(Set to Unknown)--> DestinationState.Health.Passive

## Erweiterbarkeit

Es gibt einen wesentlichen Erweiterbarkeitspunkt im Teilsystem der passiven Integritätsprüfung, die IPassiveHealthCheckPolicy .

## IPassiveHealthCheckPolicy

IPassiveHealthCheckPolicy analysiert, wie ein Ziel auf eine weitergeleitete Clientanforderung reagiert hat, bewertet dessen neuen passiven Integritätszustand und ruft schließlich IDestinationHealthUpdater.SetPassiveAsync auf, um einen asynchronen Task zu erstellen, der den passiven Integritätszustand tatsächlich aktualisiert und die Sammlung der fehlerfreien Ziele neu aufbaut.

Im Folgenden finden Sie ein einfaches Beispiel für eine benutzerdefinierte IPassiveHealthCheckPolicy, die ein Ziel bei der ersten fehlgeschlagenen Antwort auf eine weitergeleitete Anforderung als Unhealthy markiert.

C# 10/13

public class FirstUnsuccessfulResponseHealthPolicy : IPassiveHealthCheckPolicy {

private static readonly TimeSpan _defaultReactivationPeriod = TimeSpan.FromSeconds(60);

private readonly IDestinationHealthUpdater _healthUpdater;

public FirstUnsuccessfulResponseHealthPolicy(IDestinationHealthUpdater

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks?view=aspnetcore-9.0

healthUpdater)

{

_healthUpdater = healthUpdater;

}

public string Name => "FirstUnsuccessfulResponse";

public void RequestProxied(HttpContext context, ClusterState cluster, DestinationState destination)

{ var error = context.Features.Get<IForwarderErrorFeature>(); if (error is not null) { var reactivationPeriod =

cluster.Model.Config.HealthCheck?.Passive?.ReactivationPeriod ?? _defaultReactivationPeriod;

_healthUpdater.SetPassive(cluster, destination, DestinationHealth.Unhealthy, reactivationPeriod);

} } }

## Verfügbare Zielsammlung

Der Integritätszustand der Ziele wird verwendet, um zu bestimmen, welche von ihnen für den Empfang weitergeleiteter Anforderungen infrage kommen. Jeder Cluster verwaltet seine eigene Liste verfügbarer Ziele in der Eigenschaft AvailableDestinations des Typs ClusterDestinationState. Diese Liste wird neu aufgebaut, wenn sich der Integritätszustand eines Ziels ändert. Der IClusterDestinationsUpdater steuert diesen Prozess und ruft eine für den Cluster konfigurierte IAvailableDestinationsPolicy auf, um die verfügbaren Ziele tatsächlich aus allen Zielen des Clusters auszuwählen. Es werden die folgenden integrierten Richtlinien bereitgestellt, und bei Bedarf können benutzerdefinierte implementiert werden.

HealthyAndUnknown - Prüft jeden DestinationState und fügt ihn der Liste der verfügbaren Ziele hinzu, wenn alle folgenden Aussagen TRUE sind. Sind keine Ziele verfügbar, erhalten Anforderungen einen 503-Fehler.

Active health checks are disabled on the cluster OR DestinationHealthState.Active !=

DestinationHealth.Unhealthy

Passive health checks are disabled on the cluster OR DestinationHealthState.Passive

!= DestinationHealth.Unhealthy

HealthyOrPanic - Ruft zunächst die Richtlinie HealthyAndUnknown auf, um die verfügbaren Ziele zu ermitteln. Werden von diesem Aufruf keine zurückgegeben, markiert sie alle Ziele des Clusters als verfügbar. Dies ist die Standardrichtlinie.

:::note
Eine für einen Cluster konfigurierte Richtlinie für verfügbare Ziele wird immer aufgerufen, unabhängig davon, ob für den jeweiligen Cluster eine Integritätsprüfung aktiviert ist. Der Integritätszustand einer deaktivierten
:::

Integritätsprüfung ist auf Unknown gesetzt.

## Konfiguration

## Dateibeispiel

```json
   "Clusters": {
       "cluster1": {
          "HealthCheck": {
             "AvailableDestinationsPolicy": "HealthyOrPanic",
             "Passive": {
                 "Enabled": "true"
             }
          },
          "Destinations": {
             "cluster1/destination1": {
                 "Address": "https://localhost:10000/"
             },
             "cluster1/destination2": {
                 "Address": "http://localhost:10010/"
             }
          }
       }
   }
    Code example                                                                                                 12/13
```

```csharp
          var clusters = new[]
          {
                 new ClusterConfig()
                 {
                       ClusterId = "cluster1",
                       HealthCheck = new HealthCheckConfig
                       {
                              AvailableDestinationsPolicy =
          HealthCheckConstants.AvailableDestinations.HealthyOrPanic,
                              Passive = new PassiveHealthCheckConfig
                              {
                                     Enabled = true
                              }
                       },
                       Destinations =
                       {
                              { "destination1", new DestinationConfig() { Address =
          "https://localhost:10000" } },
https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks?view=aspnetcore-9.0
                      { "destination2", new DestinationConfig() { Address =
"https://localhost:10010" } }
                   }
    }
};
 Note: The author created this article with assistance from AI. Learn more
```
