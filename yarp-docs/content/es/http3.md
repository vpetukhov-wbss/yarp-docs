---
slug: http3
title: HTTP/3
lede: >-
  YARP 1.1 admite HTTP/3 para las conexiones entrantes y salientes mediante la compatibilidad con
  HTTP/3
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http3
lastUpdated: 2026-08-11
---

## Introducción

YARP 1.1 admite HTTP/3 para las conexiones entrantes y salientes mediante la compatibilidad con HTTP/3 de .NET 7. Para habilitar el protocolo HTTP/3 en YARP, debe:

Configurar las conexiones entrantes en Kestrel. Configurar las conexiones salientes en HttpClient.

## Configurar HTTP/3 en Kestrel

Los protocolos deben especificarse en las opciones del agente de escucha:

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.WebHost.ConfigureKestrel(kestrel =>
   {
          kestrel.ListenAnyIP(443, portOptions =>
          {
                 portOptions.Protocols = HttpProtocols.Http1AndHttp2AndHttp3;
                 portOptions.UseHttps();
          });
   });
```

## HttpClient

La versión predeterminada de HttpRequest debe reemplazarse por "3"; encontrará más información sobre la configuración de HttpRequest aquí.

:::note
El autor creó este artículo con la ayuda de la IA. Más información
:::
