---
slug: destination-resolvers
title: Solucionadores de destinos
lede: >-
  YARP usa un solucionador de destinos para expandir el conjunto de direcciones de destino
  configuradas. El
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/destination-resolvers
lastUpdated: 2026-08-11
---

## Extensibilidad de YARP: solucionadores de destinos

## Introducción

YARP usa un solucionador de destinos para expandir el conjunto de direcciones de destino configuradas. El solucionador de destinos puede usarse como punto de integración con sistemas de detección de servicios (service discovery).

## Estructura

## IDestinationResolver tiene un único método

`ResolveDestinationsAsync(IReadOnlyDictionary<string, DestinationConfig> destinations, CancellationToken cancellationToken)`, que debe devolver una instancia de `ResolvedDestinationCollection`. Esta clase contiene una colección de instancias de `DestinationConfig`, además de un `IChangeToken` que notifica al proxy cuando la información queda obsoleta y debe recargarse; esto hace que `ResolveDestinationsAsync` se vuelva a invocar.

## DestinationConfig

`DestinationConfig` expone una propiedad `Host` que permite especificar el valor de encabezado `Host` predeterminado que el proxy debe usar al comunicarse con ese destino. Esto permite que `IDestinationResolver` resuelva destinos hacia una colección de direcciones IP, por ejemplo, sin que el enrutamiento basado en SNI o en el host deje de funcionar.

## Ciclo de vida

## Inicio

`IDestinationResolver` debe registrarse en el contenedor de inyección de dependencias como singleton. Al iniciarse, el proxy resolverá esta instancia y llamará a `ResolveDestinationsAsync(...)` con los destinos configurados, obtenidos de los `IProxyConfigProvider` resueltos. En esta primera llamada, el proveedor puede optar por:

- Generar una excepción si no puede producir una configuración de proxy válida por cualquier motivo; esto impedirá que la aplicación se inicie.
- Resolver los destinos de forma asincrónica; esto impedirá que la aplicación termine de iniciarse hasta que los destinos resueltos estén disponibles.
- O bien, devolver una instancia vacía de `ResolvedDestinationCollection` mientras resuelve los destinos en segundo plano; en ese caso, el proveedor deberá activar el `IChangeToken` cuando la configuración esté disponible.

## Atomicidad

Los objetos y las colecciones de destinos que se entregan al proxy deben ser de solo lectura y no deben modificarse una vez entregados a través de `GetConfig()`.

## Recarga

Si el `IChangeToken` admite `ActiveChangeCallbacks`, una vez que el proxy haya procesado el conjunto inicial de destinos registrará una devolución de llamada (callback) con ese token. Si el proveedor no admite devoluciones de llamada, `HasChanged` se sondeará junto con los tokens de cambio de `IProxyConfig`, cada 5 minutos.

Cuando el proveedor quiera proporcionar un nuevo conjunto de destinos al proxy, debe:

- Resolver esos destinos en segundo plano. `ResolvedDestinationCollection` es inmutable, por lo que deben crearse instancias nuevas para cualquier dato nuevo; los objetos de los destinos que no hayan cambiado pueden reutilizarse, o bien pueden crearse instancias nuevas.
- Invalidar el `IChangeToken` devuelto por la invocación anterior de `ResolveDestinationsAsync`.

Una vez aplicados los nuevos destinos, el proxy registrará una devolución de llamada con el nuevo `IChangeToken`. Tenga en cuenta que, si se señalan varias recargas en rápida sucesión, el proxy puede omitir algunas de ellas y resolver los destinos en cuanto esté listo.

## Solucionador de destinos DNS

YARP incluye una implementación de `IDestinationResolver` que expande el conjunto de destinos configurados resolviendo cada nombre de host a una o varias direcciones IP mediante DNS, creando un destino por cada IP resuelta. El solucionador de destinos DNS puede agregarse al proxy inverso mediante el método `IReverseProxyBuilder.AddDnsDestinationResolver(Action<DnsDestinationResolverOptions>)`. El método acepta un delegado opcional para configurar las opciones del solucionador, `DnsDestinationResolverOptions`.

## Ejemplo

```csharp
// Add the DNS destination resolver, restricting results to IPv4 addresses
reverseProxyBuilder.AddDnsDestinationResolver(o => o.AddressFamily =
AddressFamily.InterNetwork);
```

## Configuración

Las opciones del solucionador de destinos DNS, `DnsDestinationResolverOptions`, exponen las siguientes propiedades:

## RefreshPeriod

El período entre solicitudes de actualización de un nombre resuelto. El valor predeterminado es 5 minutos.

## AddressFamily

Opcionalmente, especifique un valor `System.Net.Sockets.AddressFamily` de `AddressFamily.InterNetwork` o `AddressFamily.InterNetworkV6` para restringir la resolución a direcciones IPv4 o IPv6, respectivamente. El valor predeterminado, `null`, indica al solucionador que no restrinja la familia de direcciones de los resultados y que acepte todas las direcciones devueltas.

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
