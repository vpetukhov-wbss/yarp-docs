---
slug: grpc
title: Proxy de gRPC
lede: >-
  gRPC es un marco de trabajo de llamada a procedimiento remoto (RPC) independiente del lenguaje y
  de alto rendimiento. Está
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/grpc
lastUpdated: 2026-08-11
---

## Introducción

gRPC es un marco de trabajo de llamada a procedimiento remoto (RPC) independiente del lenguaje y de alto rendimiento. Está construido sobre HTTP/2 y se puede reenviar a través de YARP. Aunque YARP no necesita conocer los mensajes de gRPC, sí debe asegurarse de que esté habilitado el protocolo HTTP correcto. gRPC requiere HTTP/2, y las llamadas de gRPC producirán un error si YARP no está configurado correctamente para enviar y recibir solicitudes HTTP/2.

## Configurar los protocolos entrantes de YARP

gRPC requiere HTTP/2 en la mayoría de los escenarios. HTTP/1.1 y HTTP/2 están habilitados de forma predeterminada en los servidores de ASP.NET Core (el front-end de YARP), pero requieren https (TLS) para usar HTTP/2, por lo que YARP debe estar escuchando en una URL https://.

HTTP/2 sobre http (sin TLS) solo se admite en Kestrel y requiere una configuración específica. Para obtener más información, consulte gRPC services with ASP.NET Core.

A continuación se muestra cómo configurar Kestrel para usar HTTP/2 sobre http (sin TLS):

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

## Configurar los protocolos salientes de YARP

YARP negocia automáticamente HTTP/1.1 o HTTP/2 para las solicitudes de proxy salientes, pero solo cuando se usa https (TLS). HTTP/2 sobre http (sin TLS) requiere una configuración adicional. Tenga en cuenta que los protocolos salientes son independientes de los entrantes. Por ejemplo, se puede usar https para la conexión entrante y http para la saliente; esto se conoce como terminación de TLS. Para obtener los detalles de configuración, consulte YARP HTTP Client Configuration.

A continuación se muestra cómo configurar la solicitud de proxy saliente para usar HTTP/2:

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

gRPC-Web es un formato de transmisión alternativo para gRPC compatible con HTTP/1.1.

application/grpc: gRPC sobre HTTP/2 es la forma habitual de usar gRPC. application/grpc-web: gRPC-Web adapta el protocolo gRPC para que sea compatible con HTTP/1.1. gRPC-Web se puede usar en más lugares. gRPC-Web puede usarse desde aplicaciones de navegador y en redes sin compatibilidad completa con HTTP/2. No se admiten dos funciones avanzadas de gRPC: la transmisión desde el cliente (client streaming) y la transmisión bidireccional.

gRPC-Web se puede reenviar mediante la configuración predeterminada de YARP, sin necesidad de ninguna consideración especial.

:::note
El autor creó este artículo con la ayuda de la IA. Más información
:::
