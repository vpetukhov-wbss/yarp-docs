---
slug: grpc
title: gRPC weiterleiten
lede: >-
  gRPC ist ein sprachunabhängiges, hochperformantes Remote Procedure Call (RPC)-Framework. Es ist
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/grpc
lastUpdated: 2026-08-11
---

## Einführung

gRPC ist ein sprachunabhängiges, hochperformantes Remote Procedure Call (RPC)-Framework. Es baut auf HTTP/2 auf und kann über YARP als Proxy weitergeleitet werden. YARP muss die gRPC-Nachrichten selbst nicht kennen, es muss jedoch sichergestellt sein, dass das richtige HTTP-Protokoll aktiviert ist. gRPC erfordert HTTP/2, und gRPC-Aufrufe schlagen fehl, wenn YARP nicht korrekt für das Senden und Empfangen von HTTP/2-Anforderungen konfiguriert ist.

## YARPs eingehende Protokolle konfigurieren

gRPC erfordert in den meisten Szenarien HTTP/2. HTTP/1.1 und HTTP/2 sind auf ASP.NET Core-Servern (der Front-End-Komponente von YARP) standardmäßig aktiviert, benötigen für HTTP/2 jedoch https (TLS). YARP muss daher auf einer https://-URL lauschen.

HTTP/2 über http (ohne TLS) wird nur von Kestrel unterstützt und erfordert spezielle Einstellungen. Weitere Informationen finden Sie unter gRPC-Dienste mit ASP.NET Core.

Das folgende Beispiel zeigt, wie Kestrel für die Verwendung von HTTP/2 über http (ohne TLS) konfiguriert wird:

```json
   {
       "Kestrel": {
          "Endpoints": {
             "http": {
                 "Url": "http://localhost:5000",
                 "Protocols": "Http2"
             }
          }
       }
   }
```

## YARPs ausgehende Protokolle konfigurieren

YARP handelt für ausgehende Proxyanforderungen automatisch HTTP/1.1 oder HTTP/2 aus, jedoch nur für https (TLS). HTTP/2 über http (ohne TLS) erfordert zusätzliche Einstellungen. Beachten Sie, dass die ausgehenden Protokolle unabhängig von den eingehenden sind. So kann beispielsweise https für die eingehende

Verbindung und http für die ausgehende verwendet werden; dies wird als TLS-Terminierung bezeichnet. Konfigurationsdetails

finden Sie unter YARP-HTTP-Clientkonfiguration.

Das folgende Beispiel zeigt, wie die ausgehende Proxyanforderung für die Verwendung von HTTP/2 konfiguriert wird:

```json
"cluster1": {
   "HttpRequest": {
      "Version": "2",
      "VersionPolicy": "RequestVersionExact"
   },
   "Destinations": {
      "cluster1/destination1": {
          "Address": "http://localhost:6000/"
      }
   }
},
```

## gRPC-Web

gRPC-Web ist ein alternatives Übertragungsformat für gRPC, das mit HTTP/1.1 kompatibel ist.

application/grpc - gRPC über HTTP/2 ist die typische Verwendungsweise von gRPC. application/grpc-web - gRPC-Web passt das gRPC-Protokoll an, damit es mit HTTP/1.1 kompatibel ist. gRPC-Web kann an mehr Orten eingesetzt werden. gRPC-Web kann von Browseranwendungen und in Netzwerken ohne vollständige HTTP/2-Unterstützung verwendet werden. Zwei erweiterte gRPC-Funktionen werden nicht unterstützt: Client-Streaming und bidirektionales Streaming.

gRPC-Web kann mit der Standardkonfiguration von YARP ohne besondere Vorkehrungen als Proxy weitergeleitet werden.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
