---
slug: header-guidelines
title: Directrices para encabezados HTTP
lede: >-
  Los encabezados son una parte muy importante del procesamiento de las solicitudes HTTP, y cada
  uno tiene su propia
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-guidelines
lastUpdated: 2026-08-11
---

Los encabezados son una parte muy importante del procesamiento de las solicitudes HTTP, y cada uno tiene su propia semántica y sus propias consideraciones. La mayoría de los encabezados se reenvían de forma predeterminada, aunque algunos que se usan para controlar cómo se entrega la solicitud son ajustados o eliminados automáticamente por el proxy. Las conexiones entre el cliente y el proxy, y entre el proxy y el destino, son independientes entre sí. Por lo tanto, los encabezados que afectan a la conexión y al transporte deben filtrarse. Muchos encabezados contienen información como nombres de dominio, rutas de acceso u otros detalles que pueden verse afectados cuando se incorpora un proxy inverso a la arquitectura de la aplicación. A continuación se ofrece una recopilación de directrices sobre cómo pueden verse afectados determinados encabezados y qué hacer al respecto.

## Filtrado de encabezados de YARP

YARP quita automáticamente los encabezados de solicitud y de respuesta que podrían afectar a su capacidad de reenviar una solicitud correctamente, o que podrían usarse con fines malintencionados para eludir funciones del proxy. Puede encontrar una lista completa aquí; a continuación se describen algunos de los aspectos más destacados.

## Connection , KeepAlive , Close

Estos encabezados controlan cómo se administra la conexión TCP y se quitan para evitar que afecten a la conexión situada al otro lado del proxy.

## Transfer-Encoding

Este encabezado describe el formato del cuerpo de la solicitud o de la respuesta en la conexión, por ejemplo "chunked", y se quita porque el formato puede variar entre la conexión interna y la externa. Las pilas HTTP entrantes y salientes agregarán los encabezados de transporte que sean necesarios.

## TE

Solo se permite el paso a través del proxy del valor de encabezado TE: trailers, ya que es necesario para algunas implementaciones de gRPC.

## Upgrade

Se usa para protocolos como WebSockets. Se quita de forma predeterminada y solo se vuelve a agregar para los protocolos específicamente admitidos (WebSockets, SPDY).

## Proxy-*

Son encabezados que se usan con proxies y no se considera adecuado reenviarlos.

## Alt-Svc

Este encabezado de respuesta se usa con las actualizaciones a HTTP/3 y solo se aplica a la conexión inmediata.

## Encabezados de seguimiento distribuido

Estos encabezados incluyen TraceParent, Request-Id, TraceState, Baggage y Correlation-Context.

Se quitan automáticamente en función de DistributedContextPropagator.Fields, lo que permite que el HttpClient de reenvío los reemplace por valores actualizados.

Puede excluirse de la modificación de estos encabezados estableciendo SocketsHttpHandler.ActivityHeadersPropagator en null:

```csharp
   services.AddReverseProxy()
          .ConfigureHttpClient((_, handler) => handler.ActivityHeadersPropagator =
   null);
```

## Strict-Transport-Security

Este encabezado indica a los clientes que usen siempre HTTPS, pero puede producirse un conflicto entre los valores proporcionados por el proxy y por el destino. Para evitar confusiones, el valor del destino no se copia en la respuesta si la aplicación proxy ya le había agregado su propio valor.

## Otras directrices sobre encabezados

## Host

El encabezado Host indica a qué sitio del servidor está destinada la solicitud. Este encabezado se quita de forma predeterminada, ya que el nombre de host que usa públicamente el proxy probablemente sea distinto del que usa el servicio situado detrás del proxy. Esto se puede configurar mediante la transformación RequestHeaderOriginalHost.

## X-Forwarded-* , Forwarded

Dado que se usa una conexión independiente para comunicarse con el destino, estos encabezados de solicitud pueden usarse para reenviar información sobre la conexión original, como la IP, el esquema, el puerto y el certificado de cliente. X-Forwarded-For, X-Forwarded-Proto, X-Forwarded-Host y X-Forwarded-Prefix están habilitados de forma predeterminada. Esta información es susceptible de sufrir ataques de suplantación, por lo que los encabezados ya existentes en la solicitud se quitan y se reemplazan de forma predeterminada. La aplicación de destino debe tener cuidado con el grado de confianza que deposita en estos valores. Consulte transforms para configurarlos en el proxy. Para obtener instrucciones sobre cómo configurar la aplicación de destino para leer estos encabezados, consulte Configure ASP.NET Core to work with proxy servers and load balancers.

## X-http-method-override , x-http-method , x-method-override

Algunos clientes y servidores limitan los métodos HTTP que permiten (por ejemplo, GET). Estos encabezados de solicitud se usan a veces para sortear esas restricciones. Estos encabezados se reenvían de forma predeterminada. Si desea impedir estas omisiones en el proxy, use la transformación RequestHeaderRemove.

## Set-Cookie

Este encabezado de respuesta puede contener campos que restringen aspectos de la URL, como el esquema, el dominio o la ruta de acceso en los que debe usarse la cookie. El uso de un proxy inverso puede cambiar, desde el punto de vista público, el esquema, el dominio o la ruta de acceso efectivos de un sitio. Aunque sería posible reescribir las cookies de respuesta mediante transformaciones personalizadas, se recomienda en su lugar usar los encabezados Forwarded descritos anteriormente para propagar los valores correctos a la aplicación de destino, de modo que esta pueda generar los encabezados set-cookie correctos.

## Location

Este encabezado de respuesta se usa con las redirecciones y, debido al uso del proxy, puede contener un esquema, un dominio y una ruta de acceso que difieran de los valores públicos. Aunque sería posible reescribir el encabezado Location mediante transformaciones personalizadas, se recomienda en su lugar usar los encabezados Forwarded descritos anteriormente para propagar los valores correctos a la aplicación de destino, de modo que esta pueda generar los encabezados Location correctos.

## Server

Este encabezado de respuesta indica qué tecnología de servidor se usó para generar la respuesta (por ejemplo, IIS, Kestrel). Este encabezado se reenvía desde el destino de forma predeterminada. Las aplicaciones que deseen quitarlo pueden usar la transformación ResponseHeaderRemove, en cuyo caso se usará el encabezado de servidor predeterminado del proxy. La supresión del encabezado de servidor predeterminado del proxy depende del servidor, como ocurre con Kestrel.

## X-Powered-By

Este encabezado de respuesta indica qué marco de trabajo web se usó para generar la respuesta (por ejemplo, ASP.NET). ASP.NET Core no genera este encabezado, pero IIS sí puede hacerlo. Este encabezado se reenvía desde el destino de forma predeterminada. Las aplicaciones que deseen quitarlo pueden usar la transformación ResponseHeaderRemove.

:::note
El autor creó este artículo con la ayuda de la IA. Más información
:::
