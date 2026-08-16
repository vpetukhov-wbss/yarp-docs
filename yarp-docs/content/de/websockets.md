---
slug: websockets
title: WebSockets & SPDY
lede: >-
  YARP ermöglicht standardmäßig das Weiterleiten von WebSocket- und SPDY-Verbindungen. Diese
  Unterstützung funktioniert mit
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/websockets
lastUpdated: 2026-08-11
---

## YARP-Weiterleitung von WebSockets und SPDY

## Einführung

YARP ermöglicht standardmäßig das Weiterleiten von WebSocket- und SPDY-Verbindungen. Diese Unterstützung funktioniert sowohl mit dem Ansatz der direkten Weiterleitung als auch mit der vollständigen Pipeline.

WebSockets ist ein bidirektionales Streamingprotokoll, das auf HTTP/1.1 aufbaut und später für HTTP/2 angepasst wurde.

SPDY ist der Vorläufer von HTTP/2 und wird häufig in Kubernetes-Umgebungen eingesetzt.

## HTTP/1.1-Upgrades

WebSockets und SPDY bauen auf HTTP/1.1 auf und nutzen dabei eine Funktion namens Connection Upgrades. YARP leitet die ursprüngliche Anforderung weiter, und wenn der Zielserver mit 101 Switching Protocols antwortet, wird die Verbindung zu einem undurchsichtigen, bidirektionalen Stream mit dem neuen Protokoll hochgestuft. Auf diese Weise unterstützt YARP kein Upgrade auf andere Protokolle wie HTTP/2.

## HTTP/2

YARP unterstützt WebSockets über HTTP/2 seit .NET 7 und YARP 2.0. Kestrel ist der einzige verfügbare AspNetCore-Server, der eingehende HTTP/2-WebSocket-Anforderungen akzeptiert, und diese Unterstützung ist automatisch aktiviert. Browser können diese vom Server angekündigte Unterstützung erkennen und automatisch zu HTTP/2 wechseln.

Die eingehenden und ausgehenden Protokollversionen müssen nicht übereinstimmen. Die eingehende WebSocket-Anforderung kann HTTP/1.1 oder 2 sein. Für ausgehende Anforderungen gibt es keine WebSocket-spezifische Konfiguration; YARP verwendet die Eigenschaften Version und VersionPolicy von ForwarderRequestConfig, um die zu verwendende ausgehende Version zu bestimmen. Diese sind standardmäßig auf HTTP/2 und RequestVersionOrLower eingestellt.

WebSockets benötigen für HTTP/2 andere HTTP-Header, daher fügt YARP diese Header bei Bedarf hinzu oder entfernt sie, wenn zwischen den verschiedenen Versionen angepasst wird.

Nach dem anfänglichen Handshake funktionieren WebSockets bei beiden HTTP-Versionen auf dieselbe Weise.

## Timeout

HTTP-Anforderungstimeouts (.NET 8+) können standardmäßig oder richtlinienbasiert auf alle Anforderungen angewendet werden.

Diese Timeouts werden nach einem WebSocket-Handshake deaktiviert. Sie gelten weiterhin für gRPC-

Anforderungen. Weitere Konfigurationsmöglichkeiten finden Sie unter Timeouts.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
