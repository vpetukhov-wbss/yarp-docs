---
slug: https-tls
title: HTTPS & TLS
lede: >-
  HTTPS (HTTP über TLS-verschlüsselte Verbindungen) ist die Standardmethode für HTTP-Anforderungen
  im
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/https-tls
lastUpdated: 2026-08-11
---

HTTPS (HTTP über TLS-verschlüsselte Verbindungen) ist aus Gründen der Sicherheit, Integrität und des Datenschutzes die Standardmethode für HTTP-Anforderungen im Internet. Bei der Verwendung eines Reverse Proxys wie YARP sind mehrere HTTPS/TLS-Aspekte zu berücksichtigen.

## TLS-Terminierung

YARP ist ein HTTP-Proxy der Schicht 7, das heißt, eingehende HTTPS/TLS-Verbindungen werden vom Proxy vollständig entschlüsselt, damit er die HTTP-Anforderungen verarbeiten und weiterleiten kann. Dies wird gemeinhin als TLS-Terminierung bezeichnet. Die ausgehenden Verbindungen zum Ziel bzw. zu den Zielen können je nach bereitgestellter Konfiguration verschlüsselt sein oder nicht.

TLS-Tunneling (CONNECT)

TLS-Tunneling über die CONNECT-Methode ist eine Funktion, mit der Anforderungen weitergeleitet werden können, ohne sie zu entschlüsseln. Dies wird von YARP nicht unterstützt, und es ist auch nicht geplant, dies zu ändern.

## Eingehende Verbindungen konfigurieren

YARP kann auf allen ASP.NET Core-Servern ausgeführt werden, und die Konfiguration von HTTPS/TLS für eingehende Verbindungen ist serverspezifisch. Details zur Konfiguration finden Sie in der Dokumentation zu Kestrel, IIS und Http.Sys.

## Erweiterte TLS-Filter mit Kestrel

Kestrel unterstützt das Abfangen eingehender Verbindungen vor dem TLS-Handshake. YARP enthält eine TlsFrameHelper-API, mit der sich der rohe TLS-Handshake analysieren lässt, sodass Sie benutzerdefinierte Telemetriedaten erfassen oder Verbindungen frühzeitig ablehnen können. Diese APIs können den TLS-Handshake weder ändern noch den Datenstrom entschlüsseln. Siehe dieses Beispiel .

## Ausgehende Verbindungen konfigurieren

Um die TLS-Verschlüsselung bei der Kommunikation mit einem Ziel zu aktivieren, geben Sie die Zieladresse als https an, etwa "https://destinationHost" . Beispiele finden Sie in der Konfigurationsdokumentation.

Der in der Zieladresse angegebene Hostname wird standardmäßig für den TLS-Handshake verwendet,

einschließlich SNI und Serverzertifikatsprüfung. Wenn die Weiterleitung des ursprünglichen Host-Headers

aktiviert ist, wird stattdessen dieser Wert für den TLS-Handshake verwendet. Wenn ein benutzerdefinierter Hostwert verwendet

werden muss, verwenden Sie die RequestHeader-Transformation, um den Host-Header festzulegen.

Ausgehende Verbindungen zu den Zielen werden von HttpClient/SocketsHttpHandler verarbeitet. Pro Cluster kann eine eigene Instanz mit eigenen Einstellungen konfiguriert werden. Einige Einstellungen sind im Konfigurationsmodell verfügbar, andere lassen sich nur im Code konfigurieren. Details finden Sie in der HttpClient-Dokumentation.

Zertifikate der Zielserver müssen vom Proxy als vertrauenswürdig eingestuft werden, oder es muss über die HttpClient-Konfiguration eine benutzerdefinierte Überprüfung angewendet werden.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
