---
slug: https-tls
title: HTTPS & TLS
lede: >-
  HTTPS (HTTP mediante conexiones cifradas con TLS) es la forma estándar de realizar solicitudes
  HTTP en
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/https-tls
lastUpdated: 2026-08-11
---

HTTPS (HTTP mediante conexiones cifradas con TLS) es la forma estándar de realizar solicitudes HTTP en Internet por motivos de seguridad, integridad y privacidad. Hay varias consideraciones sobre HTTPS/TLS que se deben tener en cuenta al usar un proxy inverso como YARP.

## Terminación de TLS

YARP es un proxy HTTP de nivel 7, lo que significa que las conexiones HTTPS/TLS entrantes se descifran por completo en el proxy para que este pueda procesar y reenviar las solicitudes HTTP. Esto se conoce comúnmente como terminación de TLS. Las conexiones salientes hacia el destino o los destinos pueden estar cifradas o no, según la configuración proporcionada.

Túnel TLS (CONNECT)

El túnel TLS mediante el método CONNECT es una función que se usa para hacer proxy de las solicitudes sin descifrarlas. YARP no admite esta función y no hay planes de agregarla.

## Configurar las conexiones entrantes

YARP puede ejecutarse sobre todos los servidores de ASP.NET Core, y la configuración de HTTPS/TLS para las conexiones entrantes depende de cada servidor. Consulte la documentación de Kestrel, IIS y Http.Sys para obtener los detalles de configuración.

## Filtros TLS avanzados con Kestrel

Kestrel admite interceptar las conexiones entrantes antes del protocolo de enlace (handshake) TLS. YARP incluye una API TlsFrameHelper capaz de analizar el protocolo de enlace TLS sin procesar, lo que le permite recopilar telemetría personalizada o rechazar conexiones de forma anticipada. Estas API no pueden modificar el protocolo de enlace TLS ni descifrar el flujo de datos. Consulte este ejemplo.

## Configurar las conexiones salientes

Para habilitar el cifrado TLS al comunicarse con un destino, especifique la dirección de destino con el esquema https, por ejemplo "https://destinationHost". Consulte la documentación de configuración para ver ejemplos.

De forma predeterminada, el nombre de host especificado en la dirección de destino se usará para el protocolo de enlace TLS, incluidos el SNI y la validación del certificado de servidor. Si el reenvío del encabezado host original está habilitado, se usará ese valor en su lugar para el protocolo de enlace TLS. Si es necesario usar un valor de host personalizado, use la transformación RequestHeader para establecer el encabezado host.

Las conexiones salientes a los destinos son gestionadas por HttpClient/SocketsHttpHandler. Se puede configurar una instancia y una configuración distintas por clúster. Algunos valores están disponibles en el modelo de configuración, mientras que otros solo se pueden configurar en código. Consulte la documentación de HttpClient para obtener más información.

Los certificados del servidor de destino deben ser de confianza para el proxy, o bien se debe aplicar una validación personalizada mediante la configuración de HttpClient.

:::note
El autor creó este artículo con la ayuda de la IA. Más información
:::
