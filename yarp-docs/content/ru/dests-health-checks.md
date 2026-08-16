---
slug: dests-health-checks
title: Проверки работоспособности узлов назначения
lede: >-
  В большинстве реальных систем следует ожидать, что их узлы будут время от времени испытывать
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks
lastUpdated: 2026-08-11
---

В большинстве реальных систем следует ожидать, что их узлы будут время от времени испытывать временные проблемы или полностью выходить из строя по самым разным причинам — из-за перегрузки, утечки ресурсов, аппаратных сбоев и так далее. В идеале хотелось бы полностью и проактивно предотвращать подобные неприятные события, однако стоимость проектирования и создания такой идеальной системы обычно непомерно высока. Тем не менее существует другой, реактивный подход, который обходится дешевле и направлен на то, чтобы минимизировать негативное влияние сбоев на клиентские запросы. Прокси может анализировать состояние каждого узла и прекращать направлять на неработоспособные узлы клиентский трафик до тех пор, пока они не восстановятся. YARP реализует такой подход в виде активных и пассивных проверок работоспособности узлов назначения. Они независимы друг от друга и хранятся в соответствующих свойствах каждого узла назначения. Состояния работоспособности инициализируются значением Unknown, которое впоследствии может быть изменено на Healthy или Unhealthy соответствующими политиками, как описано ниже.

## Активные проверки работоспособности

YARP может проактивно отслеживать работоспособность узлов назначения, периодически отправляя пробные запросы на назначенные конечные точки проверки работоспособности и анализируя ответы. Этот анализ выполняет политика активной проверки работоспособности, заданная для кластера, и в результате вычисляются новые состояния работоспособности узлов назначения. В итоге политика помечает каждый узел назначения как работоспособный или неработоспособный на основе кода HTTP-ответа (коды 2xx считаются признаком работоспособности) и перестраивает список работоспособных узлов назначения кластера.

Активными проверками работоспособности управляет несколько параметров конфигурации уровня кластера, которые можно задать как в файле конфигурации, так и в коде. Для каждого узла назначения также можно указать отдельную конечную точку проверки работоспособности.

## Пример файла

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

## Пример кода

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

## Конфигурация

Все параметры активной проверки работоспособности, кроме одного, задаются на уровне кластера в разделе Cluster/HealthCheck/Active. Единственное исключение — необязательный элемент Destination/Health, задающий отдельную конечную точку активной проверки работоспособности. Фактический URI пробного запроса строится как Destination/Address (или Destination/Health, если он задан) + Cluster/HealthCheck/Active/Path .

Параметры активной проверки работоспособности также можно задать в коде через соответствующие типы в пространстве имён Yarp.ReverseProxy.Configuration, повторяющие контракт конфигурации.

Раздел Cluster/HealthCheck/Active и ActiveHealthCheckConfig:

Enabled : флаг, указывающий, включена ли активная проверка работоспособности для кластера. По умолчанию

false

Interval : период отправки пробных запросов проверки работоспособности. По умолчанию 00:00:15 Timeout : тайм-аут пробного запроса. По умолчанию 00:00:10 Policy : имя политики, вычисляющей состояния активной работоспособности узлов назначения. Обязательный параметр Path : путь проверки работоспособности для всех узлов назначения кластера. По умолчанию null . Query : строка запроса проверки работоспособности для всех узлов назначения кластера. По умолчанию null .

Раздел Destination и DestinationConfig.

Health : отдельная конечная точка для пробных запросов проверки работоспособности, например http://destination:12345/ . По умолчанию null , в этом случае используется значение Destination/Address .

## Встроенные политики

В настоящее время есть одна встроенная политика активной проверки работоспособности — ConsecutiveFailuresHealthPolicy . Она подсчитывает число подряд идущих неудачных пробных запросов и помечает узел назначения как неработоспособный, как только достигнут заданный порог. При первом успешном ответе узел назначения помечается как работоспособный, а счётчик сбрасывается. Параметры политики задаются в метаданных кластера следующим образом:

ConsecutiveFailuresHealthPolicy.Threshold - число подряд идущих неудачных пробных запросов активной проверки работоспособности, необходимое, чтобы пометить узел назначения как неработоспособный. По умолчанию 2 .

## Архитектура

Основная служба в этом процессе — IActiveHealthCheckMonitor, которая периодически создаёт пробные запросы через IProbingRequestFactory, отправляет их всем DestinationConfig каждого

ClusterConfig с включёнными активными проверками работоспособности, а затем передаёт все ответы в

IActiveHealthCheckPolicy, заданную для кластера. IActiveHealthCheckMonitor не принимает

фактическое решение о том, работоспособен узел назначения или нет, а делегирует эту задачу

IActiveHealthCheckPolicy, заданной для кластера. Политика вызывается для вычисления новых

состояний работоспособности после завершения опроса всех узлов назначения кластера. Она принимает ClusterState,

представляющий динамическое состояние кластера, и набор DestinationProbingResult, хранящих

результаты опроса узлов назначения кластера. Вычислив новое состояние работоспособности для каждого узла назначения,

политика вызывает IDestinationHealthUpdater, чтобы фактически обновить значения DestinationHealthState.Active.

-{For each cluster's destination}- IActiveHealthCheckMonitor <--(Create probing request)--> IProbingRequestFactory

| V HttpMessageInvoker <--(Send probe and receive response)--> Destination | (Save probing result) | V DestinationProbingResult --------------{END}--------------- | (Evaluate new destination active health states using probing results) | V IActiveHealthCheckPolicy --(New active health states)--> IDestinationHealthUpdater --(Update each destination's)--> DestinationState.Health.Active

Для всех перечисленных выше компонентов есть встроенные реализации по умолчанию, которые при необходимости можно заменить собственными.

## Расширяемость

В подсистеме активной проверки работоспособности есть 2 основные точки расширения.

## IActiveHealthCheckPolicy

IActiveHealthCheckPolicy анализирует, как узлы назначения отвечают на активные пробные запросы, отправляемые IActiveHealthCheckMonitor , вычисляет новые состояния активной работоспособности для всех опрошенных узлов назначения, а затем вызывает IDestinationHealthUpdater.SetActive , чтобы установить новые состояния работоспособности и перестроить список работоспособных узлов назначения на основе обновлённых значений.

Ниже приведён простой пример пользовательской IActiveHealthCheckPolicy, которая помечает узел назначения как Healthy , если на пробный запрос был получен успешный код ответа, и как Unhealthy в противном случае.

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

IProbingRequestFactory создаёт активные пробные запросы, которые отправляются на конечные точки проверки работоспособности узлов назначения. При построении пробных запросов она может учитывать ActiveHealthCheckOptions.Path , DestinationConfig.Health и другие параметры конфигурации.

Реализация IProbingRequestFactory по умолчанию использует ту же конфигурацию HttpRequest, что и проксируемые запросы. Чтобы изменить это поведение, реализуйте собственную IProbingRequestFactory и зарегистрируйте её в DI, как показано ниже.

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

## Пассивные проверки работоспособности

YARP может пассивно отслеживать успешные и неуспешные попытки проксирования клиентских запросов, чтобы реактивно вычислять состояния работоспособности узлов назначения. Ответы на проксируемые запросы перехватываются специальным промежуточным ПО пассивной проверки работоспособности, которое передаёт их политике, настроенной для кластера. Политика анализирует ответы, чтобы определить, работоспособны ли узлы назначения, от которых они получены. Затем она вычисляет и присваивает соответствующим узлам назначения новые состояния пассивной работоспособности и перестраивает список работоспособных узлов назначения кластера.

:::note
как правило, ответ отправляется клиенту до того, как выполнится политика пассивной проверки работоспособности, поэтому политика не может перехватить тело ответа или изменить что-либо в заголовках ответа, если только приложение прокси не вводит полную буферизацию ответа.
:::

Есть одно важное отличие от логики активной проверки работоспособности. Как только узлу назначения присваивается неработоспособное пассивное состояние, он перестаёт получать какой-либо новый трафик, что блокирует дальнейшую переоценку работоспособности. Политика также планирует повторную активацию узла назначения по истечении заданного периода. Повторная активация означает сброс пассивного состояния работоспособности из Unhealthy обратно в исходное значение Unknown, после чего узел назначения снова становится доступен для трафика.

Пассивными проверками работоспособности управляет несколько параметров конфигурации уровня кластера, которые можно задать как в файле конфигурации, так и в коде.

## Пример файла

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

## Пример кода

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

## Конфигурация

Параметры пассивной проверки работоспособности задаются на уровне кластера в разделе Cluster/HealthCheck/Passive. Их также можно задать в коде через соответствующие типы в пространстве имён Yarp.ReverseProxy.Configuration, повторяющие контракт конфигурации.

Для работы пассивных проверок работоспособности в конвейер должно быть добавлено PassiveHealthCheckMiddleware. Метод MapReverseProxy(this IEndpointRouteBuilder endpoints) по умолчанию делает это автоматически, но при самостоятельном построении конвейера для добавления этого промежуточного ПО необходимо вызвать метод UsePassiveHealthChecks, как показано в примере ниже.

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

## Встроенные политики

В настоящее время есть одна встроенная политика пассивной проверки работоспособности — TransportFailureRateHealthPolicy. Она вычисляет для каждого узла назначения долю неудачных проксированных запросов и помечает узел как неработоспособный, если заданный предел превышен. Доля вычисляется как процент неудачных запросов от общего числа запросов, проксированных на узел назначения за заданный период времени. Счётчики неудачных и общих запросов отслеживаются в скользящем временном окне, то есть учитываются только те недавние показания, которые попадают

в это окно. Есть два набора параметров политики: одни задаются глобально,

а другие — на уровне отдельного кластера.

Глобальные параметры задаются через механизм options с помощью типа TransportFailureRateHealthPolicyOptions со следующими свойствами:

DetectionWindowSize - период времени, в течение которого обнаруженные сбои сохраняются и учитываются при вычислении доли сбоев. По умолчанию 00:01:00 . MinimalTotalCountThreshold - минимальное общее число запросов, которые должны быть проксированы на узел назначения в пределах окна обнаружения, прежде чем эта политика начнёт оценивать работоспособность узла и применять предел доли сбоев. По умолчанию 10 . DefaultFailureRateLimit - предел доли сбоев по умолчанию, при превышении которого узел назначения помечается как неработоспособный; применяется, если значение не задано в метаданных кластера. Значение находится в диапазоне (0,1) . По умолчанию 0.3 (30%).

Глобальные параметры политики можно задать в коде следующим образом:

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

## Архитектура

Основной компонент — PassiveHealthCheckMiddleware, находящийся в конвейере обработки запроса и анализирующий ответы, возвращаемые узлами назначения. Для каждого ответа от узла назначения, принадлежащего кластеру с включёнными пассивными проверками работоспособности, PassiveHealthCheckMiddleware вызывает IPassiveHealthCheckPolicy, заданную для кластера. Политика анализирует полученный ответ, вычисляет новое пассивное состояние работоспособности узла назначения и вызывает IDestinationHealthUpdater, чтобы фактически обновить значение DestinationHealthState.Passive. Обновление выполняется асинхронно в фоновом режиме и не блокирует конвейер обработки запроса. Когда узел назначения помечается как неработоспособный, он перестаёт получать новые запросы, пока не будет повторно активирован по истечении заданного периода. Повторная активация означает, что состояние DestinationHealthState.Passive узла назначения сбрасывается из

Unhealthy в Unknown, а список работоспособных узлов назначения кластера перестраивается так, чтобы включить его.

Повторная активация планируется IDestinationHealthUpdater сразу после того, как для узла назначения

будет установлено значение DestinationHealthState.Passive, равное Unhealthy .

(Response to a proxied request) |

PassiveHealthCheckMiddleware | V

IPassiveHealthCheckPolicy |

(Evaluate new passive health state) |

IDestinationHealthUpdater --(Asynchronously update passive state)--> DestinationState.Health.Passive

| V (Schedule a reactivation) --(Set to Unknown)--> DestinationState.Health.Passive

## Расширяемость

В подсистеме пассивной проверки работоспособности есть одна основная точка расширения — IPassiveHealthCheckPolicy .

## IPassiveHealthCheckPolicy

IPassiveHealthCheckPolicy анализирует, как узел назначения ответил на проксируемый клиентский запрос, вычисляет его новое пассивное состояние работоспособности и в итоге вызывает IDestinationHealthUpdater.SetPassiveAsync, чтобы создать асинхронную задачу, которая фактически обновляет пассивное состояние работоспособности и перестраивает список работоспособных узлов назначения.

Ниже приведён простой пример пользовательской IPassiveHealthCheckPolicy, которая помечает узел назначения как Unhealthy при первом неуспешном ответе на проксируемый запрос.

C# 10/13

public class FirstUnsuccessfulResponseHealthPolicy : IPassiveHealthCheckPolicy {

private static readonly TimeSpan _defaultReactivationPeriod = TimeSpan.FromSeconds(60);

private readonly IDestinationHealthUpdater _healthUpdater;

public FirstUnsuccessfulResponseHealthPolicy(IDestinationHealthUpdater

https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks?view=aspnetcore-9.0

healthUpdater)

{

_healthUpdater = healthUpdater;

}

public string Name => "FirstUnsuccessfulResponse";

public void RequestProxied(HttpContext context, ClusterState cluster, DestinationState destination)

{ var error = context.Features.Get<IForwarderErrorFeature>(); if (error is not null) { var reactivationPeriod =

cluster.Model.Config.HealthCheck?.Passive?.ReactivationPeriod ?? _defaultReactivationPeriod;

_healthUpdater.SetPassive(cluster, destination, DestinationHealth.Unhealthy, reactivationPeriod);

} } }

## Список доступных узлов назначения

Состояние работоспособности узлов назначения используется для определения того, какие из них могут принимать проксируемые запросы. Каждый кластер ведёт собственный список доступных узлов назначения в свойстве AvailableDestinations типа ClusterDestinationState. Этот список перестраивается при изменении состояния работоспособности любого узла назначения. Этим процессом управляет IClusterDestinationsUpdater, который вызывает IAvailableDestinationsPolicy, настроенную для кластера, чтобы фактически выбрать доступные узлы назначения из всех узлов назначения кластера. Ниже перечислены предоставляемые встроенные политики; при необходимости можно реализовать собственные.

HealthyAndUnknown - проверяет каждый DestinationState и добавляет его в список доступных узлов назначения, если все перечисленные ниже условия истинны (TRUE). Если ни один узел назначения не доступен, запросы получат ошибку 503.

Active health checks are disabled on the cluster OR DestinationHealthState.Active !=

DestinationHealth.Unhealthy

Passive health checks are disabled on the cluster OR DestinationHealthState.Passive

!= DestinationHealth.Unhealthy

HealthyOrPanic - сначала вызывает политику HealthyAndUnknown, чтобы получить доступные узлы назначения. Если в результате не возвращено ни одного узла, помечает все узлы назначения кластера как доступные. Это политика по умолчанию.

:::note
Политика доступных узлов назначения, настроенная для кластера, вызывается всегда, независимо от того, включена ли для данного кластера какая-либо проверка работоспособности. Состояние работоспособности отключённой проверки
:::

устанавливается равным Unknown .

## Конфигурация

## Пример файла

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
