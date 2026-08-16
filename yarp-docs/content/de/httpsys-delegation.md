---
slug: httpsys-delegation
title: HTTP.sys-Delegierung
lede: >-
  Die HTTP.sys-Delegierung ist eine Funktion auf Kernelebene, die in neueren Windows-Versionen
  hinzugefügt wurde und
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/httpsys-delegation
lastUpdated: 2026-08-11
---

## Einführung

Die HTTP.sys-Delegierung ist eine Funktion auf Kernelebene, die in neueren Windows-Versionen hinzugefügt wurde und es ermöglicht, eine Anforderung mit sehr geringem Mehraufwand oder zusätzlicher Latenz von der HTTP.sys-Warteschlange des empfangenden Prozesses in die HTTP.sys-Warteschlange eines Zielprozesses zu übertragen. Damit diese Delegierung funktioniert, darf der empfangende Prozess nur die Anforderungsheader lesen. Wenn bereits mit dem Lesen des Textkörpers begonnen wurde oder eine Antwort begonnen hat, schlägt der Versuch, die Anforderung zu delegieren, fehl. Die Antwort ist nach der Delegierung für den Proxy nicht mehr sichtbar, was die Funktionalität der Komponenten für Sitzungsaffinität und passive Integritätsprüfungen sowie einiger Lastenausgleichsalgorithmen einschränkt. Intern nutzt YARP die IHttpSysRequestDelegationFeature von ASP.NET Core

## Anforderungen

Für die HTTP.sys-Delegierung ist Folgendes erforderlich:

Der HTTP.sys-Server von ASP.NET Core Windows Server 2019 oder Windows 10 (Buildnummer 1809) oder neuer.

## Standardeinstellungen

Die HTTP.sys-Delegierung wird nur verwendet, wenn sie der Proxypipeline hinzugefügt und in der Zielkonfiguration aktiviert wurde.

## Konfiguration

Die HTTP.sys-Delegierung kann pro Ziel aktiviert werden, indem dem Ziel die Metadaten HttpSysDelegationQueue hinzugefügt werden. Der Wert dieser Metadaten sollte der Name der Ziel-HTTP.sys-Warteschlange sein. Die Address des Ziels wird verwendet, um das URL-Präfix der HTTP.sys-Warteschlange anzugeben.

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Path": "{**catch-all}"
                      }
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                         "cluster1/destination1": {
                            "Address": "http://*:80/",
                            "Metadata": {
                               "HttpSysDelegationQueue": "TargetHttpSysQueueName"
                            }
                         }
                      }
                   }
      }
   }
}
In host configuration, configure the host to use the HTTP.sys server:
    C#
   webBuilder.UseHttpSys();
In application configuration, use the MapReverseProxy overload that allows you to customize
the pipeline and add HTTP.sys delegation by calling UseHttpSysDelegation :
```

```csharp
   app.MapReverseProxy(proxyPipeline =>
   {
          // Add the three middleware YARP adds by default plus the HTTP.sys
          // delegation middleware
          proxyPipeline.UseSessionAffinity(); // No affect on delegation destinations
          proxyPipeline.UseLoadBalancing();
          proxyPipeline.UsePassiveHealthChecks();
          proxyPipeline.UseHttpSysDelegation();
   });
```

## Lebensdauer der Delegierungswarteschlange

Wenn YARP für die Verwendung der Delegierung für ein Ziel konfiguriert ist, wird ein Handle für die angegebene HTTP.sys-Warteschlange erstellt. Dieses Handle bleibt aktiv, solange die Ziele, die darauf verweisen, vorhanden sind. Die Bereinigung dieser Handles erfolgt während der Garbage Collection. Es ist daher möglich, dass sich die Bereinigung des Handles verzögert, wenn es in Gen2 landet. Dies kann bei einigen Empfängern beim Neustart des Prozesses zu Problemen führen, da der Versuch, die Warteschlange beim Start zu erstellen, fehlschlägt, weil sie noch existiert, da YARP

über ein Handle darauf verfügt. Die Empfänger müssen intelligent genug sein, um sich stattdessen anzuhängen und die Warteschlange ordnungsgemäß erneut

einzurichten. Der HTTP.sys-Server von ASP.NET Core weist dieses Problem auf. Weitere Informationen finden Sie unter Http.sys

server should support setting up URL groups when attaching to an existing queue

(dotnet/aspnetcore #40359) .

YARP bietet eine Möglichkeit, sein Handle zur Warteschlange zurückzusetzen. Dies ermöglicht es Consumern, eigene Logik zu schreiben, um zu bestimmen, wann das Handle zur Warteschlange bereinigt werden soll.

Beispiel:

```csharp
var delegator = app.Services.GetRequiredService<IHttpSysDelegator>();
delegator.ResetQueue("TargetHttpSysQueueName", "http://*:80");
 Note: The author created this article with assistance from AI. Learn more
```
