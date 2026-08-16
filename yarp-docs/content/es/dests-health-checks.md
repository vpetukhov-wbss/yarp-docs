---
slug: dests-health-checks
title: Comprobaciones de estado de los destinos
lede: >-
  En la mayoría de los sistemas del mundo real, es de esperar que sus nodos experimenten
  ocasionalmente
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks
lastUpdated: 2026-08-11
---

En la mayoría de los sistemas del mundo real, es de esperar que sus nodos experimenten ocasionalmente problemas transitorios, o incluso que dejen de funcionar por completo, por diversos motivos, como sobrecarga, fugas de recursos, fallos de hardware, etc. Lo ideal sería evitar por completo, de forma proactiva, que ocurrieran esos incidentes, pero el costo de diseñar y construir un sistema tan perfecto suele ser prohibitivo. Sin embargo, existe otro enfoque reactivo, más económico, orientado a minimizar el impacto negativo que los fallos causan en las solicitudes de los clientes. El proxy puede analizar el estado de cada nodo y dejar de enviar tráfico de cliente a los que no estén en buen estado hasta que se recuperen. YARP implementa este enfoque mediante comprobaciones de estado activas y pasivas de los destinos. Son independientes entre sí y se almacenan en las propiedades correspondientes de cada destino. Los estados de salud se inicializan con el valor Unknown, que las directivas correspondientes pueden cambiar posteriormente a Healthy o Unhealthy, tal como se explica más abajo.

## Comprobaciones de estado activas

YARP puede supervisar de forma proactiva el estado de los destinos enviando solicitudes de sondeo periódicas a los puntos de conexión de estado designados y analizando las respuestas. Ese análisis lo realiza una directiva de comprobación de estado activa especificada para un clúster, y da como resultado el cálculo de los nuevos estados de salud de los destinos. Al final, la directiva marca cada destino como en buen o mal estado según el código de respuesta HTTP (2xx se considera en buen estado) y reconstruye la colección de destinos en buen estado del clúster.

Hay varios valores de configuración a nivel de clúster que controlan las comprobaciones de estado activas y que se pueden establecer tanto en el archivo de configuración como en el código. También se puede especificar un punto de conexión de estado dedicado por destino.

## Ejemplo de archivo

```json
"Clusters": {
   "cluster1": {
      "HealthCheck": {
         "Active": {
             "Enabled": "true",
             "Interval": "00:00:10",
             "Timeout": "00:00:10",
             "Policy": "ConsecutiveFailures",
             "Path": "/api/health",
                      "Query": "?foo=bar"
                   }
      },
      "Metadata": {
                   "ConsecutiveFailuresHealthPolicy.Threshold": "3"
      },
      "Destinations": {
                   "cluster1/destination1": {
                      "Address": "https://localhost:10000/"
                   },
                   "cluster1/destination2": {
                      "Address": "http://localhost:10010/",
                      "Health": "http://localhost:10020/"
                   }
      }
   }
}
```

## Ejemplo de código

```csharp
   var clusters = new[]
   {
          new ClusterConfig()
          {
                 ClusterId = "cluster1",
                 HealthCheck = new HealthCheckConfig
                 {
                       Active = new ActiveHealthCheckConfig
                       {
                              Enabled = true,
                              Interval = TimeSpan.FromSeconds(10),
                              Timeout = TimeSpan.FromSeconds(10),
                              Policy = HealthCheckConstants.ActivePolicy.ConsecutiveFailures,
                              Path = "/api/health",
                              Query = "?foo=bar",
                       }
                 },
                 Metadata = new Dictionary<string, string> { {
   ConsecutiveFailuresHealthPolicyOptions.ThresholdMetadataName, "5" } },
                 Destinations =
                 {
                       { "destination1", new DestinationConfig() { Address =
   "https://localhost:10000" } },
                       { "destination2", new DestinationConfig() { Address =
   "https://localhost:10010", Health = "https://localhost:10010" } }
                 }
          }
   };
```

## Configuración

Todos los valores de configuración de las comprobaciones de estado activas, salvo uno, se especifican a nivel de clúster en la sección Cluster/HealthCheck/Active. La única excepción es el elemento opcional Destination/Health, que especifica un punto de conexión de comprobación de estado activa independiente. El URI real de sondeo de estado se construye como Destination/Address (o Destination/Health, cuando está establecido) + Cluster/HealthCheck/Active/Path.

Los valores de configuración de las comprobaciones de estado activas también se pueden definir en código mediante los tipos correspondientes del espacio de nombres Yarp.ReverseProxy.Configuration, que reflejan el contrato de configuración.

Sección Cluster/HealthCheck/Active y ActiveHealthCheckConfig:

Enabled: marca que indica si la comprobación de estado activa está habilitada para un clúster. Predeterminado:

false

Interval: período de envío de las solicitudes de sondeo de estado. Predeterminado: 00:00:15. Timeout: tiempo de espera de la solicitud de sondeo. Predeterminado: 00:00:10. Policy: nombre de una directiva que evalúa los estados de salud activos de los destinos. Parámetro obligatorio. Path: ruta de acceso de comprobación de estado en todos los destinos del clúster. Predeterminado: null. Query: cadena de consulta de comprobación de estado en todos los destinos del clúster. Predeterminado: null.

Sección Destination y DestinationConfig.

Health: un punto de conexión de sondeo de estado dedicado, como http://destination:12345/. Predeterminado: null; en ese caso, recae en Destination/Address.

## Directivas integradas

Actualmente hay una directiva de comprobación de estado activa integrada: ConsecutiveFailuresHealthPolicy. Cuenta los fallos consecutivos de los sondeos de estado y marca un destino como en mal estado cuando se alcanza el umbral indicado. En la primera respuesta correcta, el destino se marca como en buen estado y el contador se reinicia. Los parámetros de la directiva se establecen en los metadatos del clúster de la siguiente manera:

ConsecutiveFailuresHealthPolicy.Threshold: número de solicitudes de sondeo de estado activas fallidas de forma consecutiva necesarias para marcar un destino como en mal estado. Predeterminado: 2.

## Diseño

El servicio principal de este proceso es IActiveHealthCheckMonitor, que crea periódicamente solicitudes de sondeo mediante IProbingRequestFactory, las envía a todos los DestinationConfig de cada ClusterConfig con comprobaciones de estado activas habilitadas y, después, pasa todas las respuestas a la IActiveHealthCheckPolicy especificada para el clúster. IActiveHealthCheckMonitor no toma la decisión real sobre si un destino está en buen estado, sino que delega esa responsabilidad en la IActiveHealthCheckPolicy especificada para el clúster. Se invoca a una directiva para evaluar los nuevos estados de salud una vez que finaliza el sondeo de todos los destinos del clúster. Esta recibe un ClusterState que representa el estado dinámico del clúster y un conjunto de DestinationProbingResult que almacena los resultados de sondeo de los destinos del clúster. Tras evaluar un nuevo estado de salud para cada destino, la directiva invoca a IDestinationHealthUpdater para actualizar los valores de DestinationHealthState.Active.

-{Para cada destino del clúster}- IActiveHealthCheckMonitor <--(Crear solicitud de sondeo)--> IProbingRequestFactory

| V HttpMessageInvoker <--(Enviar sondeo y recibir respuesta)--> Destination | (Guardar resultado del sondeo) | V DestinationProbingResult --------------{FIN}--------------- | (Evaluar los nuevos estados de salud activos de los destinos usando los resultados del sondeo) | V IActiveHealthCheckPolicy --(Nuevos estados de salud activos)--> IDestinationHealthUpdater --(Actualizar el de cada destino)--> DestinationState.Health.Active

Existen implementaciones integradas predeterminadas para todos los componentes mencionados, que también se pueden reemplazar por otras personalizadas cuando sea necesario.

## Extensibilidad

Hay dos puntos de extensibilidad principales en el subsistema de comprobación de estado activa.

## IActiveHealthCheckPolicy

IActiveHealthCheckPolicy analiza cómo responden los destinos a los sondeos de estado activos enviados por IActiveHealthCheckMonitor, evalúa los nuevos estados de salud activos de todos los destinos sondeados y, después, invoca a IDestinationHealthUpdater.SetActive para establecer los nuevos estados de salud activos y reconstruir la colección de destinos en buen estado según los valores actualizados.

A continuación se muestra un ejemplo simple de una IActiveHealthCheckPolicy personalizada que marca un destino como Healthy si el sondeo devolvió un código de respuesta correcto, y como Unhealthy en caso contrario.

```csharp
public class FirstUnsuccessfulResponseHealthPolicy : IActiveHealthCheckPolicy
{
      private readonly IDestinationHealthUpdater _healthUpdater;
      public FirstUnsuccessfulResponseHealthPolicy(IDestinationHealthUpdater
healthUpdater)
      {
             _healthUpdater = healthUpdater;
      }
      public string Name => "FirstUnsuccessfulResponse";
      public void ProbingCompleted(ClusterState cluster,
IReadOnlyList<DestinationProbingResult> probingResults)
      {
             if (probingResults.Count == 0)
             {
                   return;
             }
             var newHealthStates = new
NewActiveDestinationHealth[probingResults.Count];
             for (var i = 0; i < probingResults.Count; i++)
             {
                   var response = probingResults[i].Response;
                   var newHealth = response is not null && response.IsSuccessStatusCode ?
DestinationHealth.Healthy : DestinationHealth.Unhealthy;
                   newHealthStates[i] = new
NewActiveDestinationHealth(probingResults[i].Destination, newHealth);
             }
             _healthUpdater.SetActive(cluster, newHealthStates);
      }
}
```

## IProbingRequestFactory

IProbingRequestFactory crea las solicitudes de sondeo de estado activo que se envían a los puntos de conexión de estado de los destinos. Puede tener en cuenta ActiveHealthCheckOptions.Path, DestinationConfig.Health y otros valores de configuración para construir las solicitudes de sondeo.

El IProbingRequestFactory predeterminado usa la misma configuración de HttpRequest que las solicitudes de proxy; para personalizarlo, implemente su propio IProbingRequestFactory y regístrelo en la inserción de dependencias como se muestra a continuación.

```csharp
services.AddSingleton<IProbingRequestFactory, CustomProbingRequestFactory>();
The below is a simple example of a customer IProbingRequestFactory concatenating
DestinationConfig.Address and a fixed health probe path to create the probing request URI.
```

```csharp
   public class CustomProbingRequestFactory : IProbingRequestFactory
   {
          public HttpRequestMessage CreateRequest(ClusterConfig clusterConfig,
   DestinationConfig destinationConfig)
          {
                 var probeUri = new Uri(destinationConfig.Address + "/api/probe-health");
                 return new HttpRequestMessage(HttpMethod.Get, probeUri) { Version =
   ProtocolHelper.Http11Version };
          }
   }
```

## Comprobaciones de estado pasivas

YARP puede observar de forma pasiva los aciertos y errores al enviar solicitudes de cliente por proxy, para evaluar de forma reactiva los estados de salud de los destinos. Las respuestas a las solicitudes enviadas por proxy las intercepta un middleware de comprobación de estado pasiva dedicado, que las pasa a una directiva configurada en el clúster. La directiva analiza las respuestas para evaluar si los destinos que las produjeron están en buen estado o no. Después, calcula y asigna nuevos estados de salud pasivos a los destinos correspondientes y reconstruye la colección de destinos en buen estado del clúster.

:::note
normalmente, la respuesta se envía al cliente antes de que se ejecute la directiva de estado pasiva, por lo que una directiva no puede interceptar el cuerpo de la respuesta ni modificar nada en los encabezados de la respuesta, a menos que la aplicación de proxy introduzca un almacenamiento en búfer completo de la respuesta.
:::

Hay una diferencia importante respecto a la lógica de comprobación de estado activa. Una vez que a un destino se le asigna un estado pasivo en mal estado, deja de recibir todo el tráfico nuevo, lo que bloquea futuras reevaluaciones de estado. La directiva también programa la reactivación del destino después del período configurado. La reactivación consiste en restablecer el estado de salud pasivo de Unhealthy al valor inicial Unknown, lo que hace que el destino vuelva a ser apto para recibir tráfico.

Hay varios valores de configuración a nivel de clúster que controlan las comprobaciones de estado pasivas y que se pueden establecer tanto en el archivo de configuración como en el código.

## Ejemplo de archivo

```json
"Clusters": {
   "cluster1": {
      "HealthCheck": {
         "Passive": {
             "Enabled": "true",
             "Policy": "TransportFailureRate",
             "ReactivationPeriod": "00:02:00"
         }
      },
      "Metadata": {
         "TransportFailureRateHealthPolicy.RateLimit": "0.5"
      },
      "Destinations": {
         "cluster1/destination1": {
             "Address": "https://localhost:10000/"
         },
         "cluster1/destination2": {
             "Address": "http://localhost:10010/"
         }
      }
   }
}
```

## Ejemplo de código

```csharp
var clusters = new[]
{
      new ClusterConfig()
      {
             ClusterId = "cluster1",
             HealthCheck = new HealthCheckConfig
             {
                   Passive = new PassiveHealthCheckConfig
                   {
                          Enabled = true,
                          Policy = HealthCheckConstants.PassivePolicy.TransportFailureRate,
                          ReactivationPeriod = TimeSpan.FromMinutes(2)
                   }
             },
             Metadata = new Dictionary<string, string> { {
TransportFailureRateHealthPolicyOptions.FailureRateLimitMetadataName, "0.5" } },
             Destinations =
             {
                   { "destination1", new DestinationConfig() { Address =
"https://localhost:10000" } },
                   { "destination2", new DestinationConfig() { Address =
"https://localhost:10010" } }
             }
                 }
          };
```

## Configuración

Los valores de configuración de las comprobaciones de estado pasivas se especifican a nivel de clúster en la sección Cluster/HealthCheck/Passive. Como alternativa, se pueden definir en código mediante los tipos correspondientes del espacio de nombres Yarp.ReverseProxy.Configuration, que reflejan el contrato de configuración.

Para que las comprobaciones de estado pasivas funcionen, es necesario agregar PassiveHealthCheckMiddleware a la canalización. El método predeterminado MapReverseProxy(this IEndpointRouteBuilder endpoints) lo hace automáticamente, pero en caso de construir la canalización manualmente, se debe invocar el método UsePassiveHealthChecks para agregar ese middleware, como se muestra en el siguiente ejemplo.

```csharp
   endpoints.MapReverseProxy(proxyPipeline =>
   {
          proxyPipeline.UseAffinitizedDestinationLookup();
          proxyPipeline.UseProxyLoadBalancing();
          proxyPipeline.UseRequestAffinitizer();
          proxyPipeline.UsePassiveHealthChecks();
   });
Cluster/HealthCheck/Passive section and PassiveHealthCheckConfig:
       Enabled - flag indicating whether passive health check is enabled for a cluster. Default
        false
       Policy - name of a policy evaluating destinations' passive health states. Mandatory
      parameter
       ReactivationPeriod - period after which an unhealthy destination's passive health state is
      reset to Unknown and it starts receiving traffic again. Default value is null which means
      the period will be set by a IPassiveHealthCheckPolicy
```

## Directivas integradas

Actualmente hay una directiva de comprobación de estado pasiva integrada: TransportFailureRateHealthPolicy. Calcula la tasa de error de las solicitudes enviadas por proxy para cada destino y lo marca como en mal estado si se supera el límite especificado. La tasa se calcula como el porcentaje de solicitudes fallidas respecto al número total de solicitudes enviadas por proxy a un destino en un período de tiempo determinado. Los contadores de fallidas y totales se registran en una ventana de tiempo deslizante, lo que significa que solo se tienen en cuenta las lecturas recientes que caben en esa ventana. Hay dos conjuntos de parámetros de directiva: unos definidos globalmente y otros a nivel de clúster.

Los parámetros globales se establecen mediante el mecanismo de opciones, usando el tipo TransportFailureRateHealthPolicyOptions, con las siguientes propiedades:

DetectionWindowSize: período de tiempo durante el cual se conservan los fallos detectados y se tienen en cuenta en el cálculo de la tasa. Predeterminado: 00:01:00. MinimalTotalCountThreshold: número total mínimo de solicitudes que se deben enviar por proxy a un destino dentro de la ventana de detección antes de que esta directiva empiece a evaluar el estado del destino y a aplicar el límite de tasa de error. Predeterminado: 10. DefaultFailureRateLimit: límite de tasa de error predeterminado para marcar un destino como en mal estado, que se aplica si no se establece en los metadatos de un clúster. El valor está en el rango (0,1). Predeterminado: 0.3 (30 %).

Las opciones de directiva globales se pueden establecer en código de la siguiente manera:

```csharp
services.Configure<TransportFailureRateHealthPolicyOptions>(o =>
{
      o.DetectionWindowSize = TimeSpan.FromSeconds(30);
      o.MinimalTotalCountThreshold = 5;
      o.DefaultFailureRateLimit = 0.5;
});
Cluster-specific parameters are set in the cluster's metadata as follows:
TransportFailureRateHealthPolicy.RateLimit - failure rate limit for a destination to be marked
as unhealthy. The value is in range (0,1) . Default value is provided by the global
DefaultFailureRateLimit parameter.
```

## Diseño

El componente principal es PassiveHealthCheckMiddleware, que se sitúa en la canalización de solicitudes y analiza las respuestas devueltas por los destinos. Para cada respuesta de un destino que pertenece a un clúster con comprobaciones de estado pasivas habilitadas, PassiveHealthCheckMiddleware invoca a la IPassiveHealthCheckPolicy especificada para el clúster. La directiva analiza la respuesta dada, evalúa el nuevo estado de salud pasivo del destino e invoca a IDestinationHealthUpdater para actualizar realmente el valor de DestinationHealthState.Passive. La actualización se produce de forma asíncrona en segundo plano y no bloquea la canalización de solicitudes. Cuando un destino se marca como en mal estado, deja de recibir solicitudes nuevas hasta que se reactiva tras el período configurado. La reactivación implica restablecer el estado

DestinationHealthState.Passive del destino de Unhealthy a Unknown, y reconstruir la lista de destinos en buen estado del clúster para incluirlo. IDestinationHealthUpdater

programa la reactivación justo después de establecer el

DestinationHealthState.Passive del destino en Unhealthy.

(Respuesta a una solicitud enviada por proxy) |

PassiveHealthCheckMiddleware | V

IPassiveHealthCheckPolicy |

(Evaluar el nuevo estado de salud pasivo) |

IDestinationHealthUpdater --(Actualizar el estado pasivo de forma asíncrona)--> DestinationState.Health.Passive

| V (Programar una reactivación) --(Establecer en Unknown)--> DestinationState.Health.Passive

## Extensibilidad

Hay un punto de extensibilidad principal en el subsistema de comprobación de estado pasiva: IPassiveHealthCheckPolicy.

## IPassiveHealthCheckPolicy

IPassiveHealthCheckPolicy analiza cómo respondió un destino a una solicitud de cliente enviada por proxy, evalúa su nuevo estado de salud pasivo y, finalmente, invoca a IDestinationHealthUpdater.SetPassiveAsync para crear una tarea asíncrona que actualiza realmente el estado de salud pasivo y reconstruye la colección de destinos en buen estado.

A continuación se muestra un ejemplo simple de una IPassiveHealthCheckPolicy personalizada que marca un destino como Unhealthy en la primera respuesta fallida a una solicitud enviada por proxy.

C#

public class FirstUnsuccessfulResponseHealthPolicy : IPassiveHealthCheckPolicy {

private static readonly TimeSpan _defaultReactivationPeriod = TimeSpan.FromSeconds(60);

private readonly IDestinationHealthUpdater _healthUpdater;

public FirstUnsuccessfulResponseHealthPolicy(IDestinationHealthUpdater healthUpdater)

{

_healthUpdater = healthUpdater;

}

public string Name => "FirstUnsuccessfulResponse";

public void RequestProxied(HttpContext context, ClusterState cluster, DestinationState destination)

{ var error = context.Features.Get<IForwarderErrorFeature>(); if (error is not null) { var reactivationPeriod =

cluster.Model.Config.HealthCheck?.Passive?.ReactivationPeriod ?? _defaultReactivationPeriod;

_healthUpdater.SetPassive(cluster, destination, DestinationHealth.Unhealthy, reactivationPeriod);

} } }

## Colección de destinos disponibles

El estado de salud de los destinos se usa para determinar cuáles de ellos son aptos para recibir solicitudes enviadas por proxy. Cada clúster mantiene su propia lista de destinos disponibles en la propiedad AvailableDestinations del tipo ClusterDestinationState. Esa lista se reconstruye cuando cambia el estado de salud de cualquier destino. IClusterDestinationsUpdater controla ese proceso e invoca a una IAvailableDestinationsPolicy configurada en el clúster para elegir realmente los destinos disponibles entre todos los destinos del clúster. Se proporcionan las siguientes directivas integradas, y se pueden implementar otras personalizadas si es necesario.

HealthyAndUnknown: inspecciona cada DestinationState y lo agrega a la lista de destinos disponibles si se cumplen todas las siguientes condiciones. Si no hay ningún destino disponible, las solicitudes recibirán un error 503.

Las comprobaciones de estado activas están deshabilitadas en el clúster, o bien DestinationHealthState.Active !=

DestinationHealth.Unhealthy

Las comprobaciones de estado pasivas están deshabilitadas en el clúster, o bien DestinationHealthState.Passive

!= DestinationHealth.Unhealthy

HealthyOrPanic: invoca primero a la directiva HealthyAndUnknown para obtener los destinos disponibles. Si esta no devuelve ninguno, marca todos los destinos del clúster como disponibles. Esta es la directiva predeterminada.

:::note
Una directiva de destinos disponibles configurada en un clúster siempre se invoca, independientemente de si hay alguna comprobación de estado habilitada en dicho clúster. El estado de salud de una comprobación
:::

deshabilitada se establece en Unknown.

## Configuración

## Ejemplo de archivo

```json
   "Clusters": {
       "cluster1": {
          "HealthCheck": {
             "AvailableDestinationsPolicy": "HealthyOrPanic",
             "Passive": {
                 "Enabled": "true"
             }
          },
          "Destinations": {
             "cluster1/destination1": {
                 "Address": "https://localhost:10000/"
             },
             "cluster1/destination2": {
                 "Address": "http://localhost:10010/"
             }
          }
       }
   }
    Code example                                                                                                 12/13
```

```csharp
          var clusters = new[]
          {
                 new ClusterConfig()
                 {
                       ClusterId = "cluster1",
                       HealthCheck = new HealthCheckConfig
                       {
                              AvailableDestinationsPolicy =
          HealthCheckConstants.AvailableDestinations.HealthyOrPanic,
                              Passive = new PassiveHealthCheckConfig
                              {
                                     Enabled = true
                              }
                       },
                       Destinations =
                       {
                              { "destination1", new DestinationConfig() { Address =
          "https://localhost:10000" } },
https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks?view=aspnetcore-9.0
                      { "destination2", new DestinationConfig() { Address =
"https://localhost:10010" } }
                   }
    }
};
 Note: The author created this article with assistance from AI. Learn more
```
