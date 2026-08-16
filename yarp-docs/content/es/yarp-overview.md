---
slug: yarp-overview
title: Información general sobre YARP
lede: >-
  YARP (Yet Another Reverse Proxy) es una biblioteca de proxy inverso altamente personalizable para .NET,
  creada para ser robusta, flexible, escalable, segura y fácil de ejecutar delante de los servicios que
  ya tiene.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/yarp-overview
lastUpdated: 2025-02-21
---

## Introducción

YARP ayuda a los desarrolladores a crear soluciones de proxy inverso potentes y eficientes, adaptadas a sus necesidades específicas. Se sitúa entre los dispositivos cliente y los servidores back-end, reenviando las solicitudes del cliente al destino adecuado y devolviendo la respuesta — el mismo papel que desempeñan nginx o Envoy, pero como una biblioteca que se hospeda dentro de su propio proceso de ASP.NET Core.

## Qué hace un proxy inverso

Un proxy inverso ofrece varias ventajas sobre un back-end sencillo:

- **Enrutamiento** — dirige las solicitudes a distintos servidores back-end según reglas predefinidas, como patrones de URL o encabezados de solicitud. `/images`, `/api` y `/db` pueden dirigirse cada uno a un servidor diferente.
- **Equilibrio de carga** — distribuye el tráfico entrante entre varios servidores back-end para evitar sobrecargar a cualquiera de ellos.
- **Escalabilidad** — los servidores back-end se pueden agregar o quitar sin afectar al cliente, ya que el proxy distribuye el tráfico.
- **Terminación de TLS** — descarga el cifrado y descifrado de los servidores back-end, reduciendo su carga de trabajo.
- **Seguridad** — los puntos de conexión internos del servicio permanecen ocultos de la exposición externa, lo que reduce la superficie de ataque.

## Cómo controla HTTP un proxy inverso

Las conexiones entrantes finalizan en el proxy; para las solicitudes salientes a los destinos se usan conexiones nuevas y agrupadas. Según las reglas de enrutamiento configuradas, YARP determina qué clúster debe gestionar la solicitud, la reenvía — transformando la ruta y los encabezados según sea necesario — y devuelve al cliente la respuesta del back-end.

:::example Ejemplo rápido
Registre el proxy y cargue rutas y clústeres directamente desde la configuración.

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```

```json
{
  "ReverseProxy": {
    "Routes": {
      "route1": {
        "ClusterId": "cluster1",
        "Match": { "Path": "{**catch-all}" }
      }
    },
    "Clusters": {
      "cluster1": {
        "Destinations": {
          "cluster1/destination1": { "Address": "https://example.com/" }
        }
      }
    }
  }
}
```
:::

:::note
La configuración se recarga automáticamente cuando el origen cambia, sin necesidad de reiniciar. Consulte [Filtros de configuración](doc:config-filters) para modificar la configuración durante la secuencia de carga.
:::

## Por qué elegir YARP en lugar de otros proxies

YARP está construido sobre ASP.NET Core, por lo que se integra directamente con el ecosistema de .NET y ofrece un amplio conjunto de puntos de extensibilidad — el enrutamiento, el equilibrio de carga y las transformaciones se pueden personalizar en C# conocido en lugar de un lenguaje de configuración específico de proxy. Microsoft lo mantiene de forma activa, y tanto YARP como su documentación son de código abierto.
