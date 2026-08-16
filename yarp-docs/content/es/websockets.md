---
slug: websockets
title: WebSockets & SPDY
lede: >-
  YARP permite reenviar conexiones WebSocket y SPDY de forma predeterminada. Esta compatibilidad
  funciona con
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/websockets
lastUpdated: 2026-08-11
---

## Reenvío de WebSockets y SPDY con YARP

## Introducción

YARP permite reenviar conexiones WebSocket y SPDY de forma predeterminada. Esta compatibilidad funciona tanto con el enfoque de reenvío directo como con el de canalización completa.

WebSockets es un protocolo de transmisión bidireccional construido sobre HTTP/1.1 o versiones posteriores, y adaptado también a HTTP/2.

SPDY es el precursor de HTTP/2 y se usa habitualmente en entornos de Kubernetes.

## Actualizaciones de HTTP/1.1

WebSockets y SPDY se basan en HTTP/1.1 mediante una función denominada actualizaciones de conexión (connection upgrades). YARP reenvía la solicitud inicial y, si el servidor de destino responde con 101 Switching Protocols, actualiza la conexión a una transmisión bidireccional opaca que usa el nuevo protocolo. YARP no admite de esta forma la actualización a otros protocolos como HTTP/2.

## HTTP/2

YARP admite WebSockets sobre HTTP/2 desde .NET 7 y YARP 2.0. Kestrel es el único servidor de AspNetCore disponible que acepta solicitudes WebSocket entrantes sobre HTTP/2, y esa compatibilidad se habilita automáticamente. Los navegadores pueden detectar esta compatibilidad anunciada por el servidor y cambiar automáticamente a HTTP/2.

Las versiones de protocolo entrante y saliente no tienen por qué coincidir. La solicitud WebSocket entrante puede ser HTTP/1.1 o 2. No existe ninguna configuración específica de WebSockets para las solicitudes salientes: YARP usa las propiedades Version y VersionPolicy de ForwarderRequestConfig para determinar la versión saliente que se debe usar. Estas tienen como valores predeterminados HTTP/2 y RequestVersionOrLower.

WebSockets requiere encabezados HTTP diferentes para HTTP/2, por lo que YARP agrega y quita estos encabezados según sea necesario al adaptarse entre las distintas versiones.

Después del protocolo de enlace (handshake) inicial, WebSockets funciona de la misma manera en ambas versiones de HTTP.

## Tiempo de espera

Los tiempos de espera de solicitudes HTTP (.NET 8 y versiones posteriores) pueden aplicarse a todas las solicitudes de forma predeterminada o mediante una directiva.

Estos tiempos de espera se deshabilitan después de un protocolo de enlace de WebSocket. Seguirán aplicándose a las solicitudes de gRPC. Para obtener más información sobre la configuración, consulte Tiempos de espera.

:::note
El autor creó este artículo con la ayuda de la IA. Más información
:::
