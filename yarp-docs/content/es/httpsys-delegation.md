---
slug: httpsys-delegation
title: Delegación de HTTP.sys
lede: >-
  La delegación de HTTP.sys es una característica de nivel de kernel agregada en versiones más
  recientes de Windows que
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/httpsys-delegation
lastUpdated: 2026-08-11
---

## Introducción

La delegación de HTTP.sys es una característica de nivel de kernel agregada en versiones más recientes de Windows que permite transferir una solicitud desde la cola de HTTP.sys del proceso receptor a la cola de HTTP.sys de un proceso de destino, con muy poca sobrecarga o latencia adicional. Para que esta delegación funcione, el proceso receptor solo puede leer los encabezados de la solicitud; si ya se ha empezado a leer el cuerpo o a enviar una respuesta, el intento de delegar la solicitud producirá un error. Después de la delegación, el proxy ya no podrá ver la respuesta, lo que limita la funcionalidad de los componentes de afinidad de sesión y de comprobaciones de estado pasivas, así como algunos de los algoritmos de equilibrio de carga. Internamente, YARP aprovecha `IHttpSysRequestDelegationFeature` de ASP.NET Core.

## Requisitos

La delegación de HTTP.sys requiere:

- El servidor HTTP.sys de ASP.NET Core.
- Windows Server 2019 o Windows 10 (compilación 1809) o versiones posteriores.

## Valores predeterminados

La delegación de HTTP.sys no se usará a menos que se agregue a la canalización del proxy y se habilite en la configuración del destino.

## Configuración

La delegación de HTTP.sys puede habilitarse por destino agregando los metadatos `HttpSysDelegationQueue` al destino. El valor de estos metadatos debe ser el nombre de la cola de HTTP.sys de destino. La propiedad `Address` del destino se usa para especificar el prefijo de URL de la cola de HTTP.sys.

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Path": "{**catch-all}"
                      }
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                         "cluster1/destination1": {
                            "Address": "http://*:80/",
                            "Metadata": {
                               "HttpSysDelegationQueue": "TargetHttpSysQueueName"
                            }
                         }
                      }
                   }
      }
   }
}
In host configuration, configure the host to use the HTTP.sys server:
    C#
   webBuilder.UseHttpSys();
In application configuration, use the MapReverseProxy overload that allows you to customize
the pipeline and add HTTP.sys delegation by calling UseHttpSysDelegation :
```

```csharp
   app.MapReverseProxy(proxyPipeline =>
   {
          // Add the three middleware YARP adds by default plus the HTTP.sys
          // delegation middleware
          proxyPipeline.UseSessionAffinity(); // No affect on delegation destinations
          proxyPipeline.UseLoadBalancing();
          proxyPipeline.UsePassiveHealthChecks();
          proxyPipeline.UseHttpSysDelegation();
   });
```

## Duración de la cola de delegación

Cuando YARP se configura para delegar en un destino, se crea un identificador (handle) hacia la cola de HTTP.sys especificada. Este identificador se mantiene vivo mientras existan destinos que hagan referencia a él. La limpieza de estos identificadores se realiza durante la recolección de basura (GC), por lo que es posible que dicha limpieza se retrase si el objeto termina en la generación 2 (Gen2). Esto puede causar problemas en algunos receptores durante el reinicio del proceso, porque si intentan crear la cola durante el inicio, la operación falla, ya que la cola sigue existiendo mientras YARP mantenga un identificador hacia ella. Los receptores deben ser lo bastante inteligentes como para adjuntarse a la cola existente en su lugar y volver a configurarla correctamente. El servidor HTTP.sys de ASP.NET Core presenta este problema; para más información, consulte Http.sys server should support setting up URL groups when attaching to an existing queue (dotnet/aspnetcore #40359).

YARP expone una forma de restablecer su identificador hacia la cola, lo que permite a los consumidores escribir lógica personalizada para determinar cuándo debe limpiarse el identificador de la cola.

Ejemplo:

```csharp
var delegator = app.Services.GetRequiredService<IHttpSysDelegator>();
delegator.ResetQueue("TargetHttpSysQueueName", "http://*:80");
 Note: The author created this article with assistance from AI. Learn more
```
