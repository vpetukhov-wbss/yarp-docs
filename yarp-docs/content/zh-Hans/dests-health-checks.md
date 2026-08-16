---
slug: dests-health-checks
title: 目标运行状况检查
lede: >-
  在大多数实际系统中，人们预期其节点会偶尔遇到
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks
lastUpdated: 2026-08-11
---

在大多数实际系统中，其节点难免会由于过载、资源泄漏、硬件故障等多种原因，偶尔出现瞬时问题，甚至完全宕机。从理想角度来说，最好能够以主动方式彻底防止这类不幸事件的发生，但设计和构建这样一套理想系统的成本通常高得令人望而却步。不过，还有另一种成本更低的被动应对方式，其目标是尽量减小故障对客户端请求造成的负面影响：代理可以分析各个节点的运行状况，并停止向运行状况不佳的节点发送客户端流量，直到它们恢复为止。YARP 通过主动和被动两种目标运行状况检查实现了这一方法。这两种检查彼此独立，各自的状态保存在每个目标相应的属性中。运行状况的初始值为 Unknown，之后会由下文所述的相应策略将其更改为 Healthy 或 Unhealthy。

## 主动运行状况检查

YARP 可以通过向指定的运行状况终结点定期发送探测请求并分析响应，来主动监视目标的运行状况。这项分析由为群集指定的主动运行状况检查策略执行，并计算出新的目标运行状况。最终，该策略会根据 HTTP 响应代码（2xx 被视为运行状况良好）将每个目标标记为健康或不健康，并重新构建群集中运行状况良好的目标集合。

有若干个群集级别的配置设置用于控制主动运行状况检查，既可以在配置文件中设置，也可以在代码中设置。此外，还可以为每个目标单独指定一个专用的运行状况终结点。

## 文件示例

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

## 代码示例

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

## 配置

除一项设置外，所有主动运行状况检查设置都在群集级别的 Cluster/HealthCheck/Active 部分中指定。唯一的例外是可选的 Destination/Health 元素，用于指定单独的主动运行状况检查终结点。实际的运行状况探测 URI 由 Destination/Address（如果设置了 Destination/Health，则使用该值）+ Cluster/HealthCheck/Active/Path 拼接而成。

主动运行状况检查设置也可以通过代码来定义，具体方式是使用 Yarp.ReverseProxy.Configuration 命名空间中与配置契约相对应的类型。

Cluster/HealthCheck/Active 部分与 ActiveHealthCheckConfig：

- Enabled：指示是否为群集启用主动运行状况检查的标志。默认值为 false。
- Interval：发送运行状况探测请求的间隔周期。默认值为 00:00:15。
- Timeout：探测请求的超时时间。默认值为 00:00:10。
- Policy：用于评估目标主动运行状况的策略名称。此参数为必填项。
- Path：群集所有目标上的运行状况检查路径。默认值为 null。
- Query：群集所有目标上的运行状况检查查询字符串。默认值为 null。

Destination 部分与 DestinationConfig：

- Health：专用的运行状况探测终结点，例如 http://destination:12345/。默认值为 null，此时将回退使用 Destination/Address。

## 内置策略

目前有一个内置的主动运行状况检查策略——ConsecutiveFailuresHealthPolicy。它会统计连续的运行状况探测失败次数，一旦达到给定阈值，就将目标标记为不健康。收到第一个成功响应时，目标会被标记为健康，同时计数器会被重置。该策略的参数在群集的元数据中按如下方式设置：

- ConsecutiveFailuresHealthPolicy.Threshold——将目标标记为不健康所需的连续主动运行状况探测失败次数。默认值为 2。

## 设计

在此过程中，主要的服务是 IActiveHealthCheckMonitor，它会通过 IProbingRequestFactory 定期创建探测请求，将其发送给每个已启用主动运行状况检查的 ClusterConfig 下的所有 DestinationConfig，然后将所有响应下发给为该群集指定的 IActiveHealthCheckPolicy。IActiveHealthCheckMonitor 本身并不实际判断目标是否健康，而是将这一职责委托给为群集指定的 IActiveHealthCheckPolicy。当群集所有目标的探测都完成后，就会调用该策略来评估新的运行状况。该策略接收一个表示群集动态状态的 ClusterState，以及一组保存了群集各目标探测结果的 DestinationProbingResult。为每个目标评估出新的运行状况后，该策略会调用 IDestinationHealthUpdater 来实际更新 DestinationHealthState.Active 的值。

-{对群集的每个目标}- IActiveHealthCheckMonitor <--(创建探测请求)--> IProbingRequestFactory

| V HttpMessageInvoker <--(发送探测并接收响应)--> Destination | (保存探测结果) | V DestinationProbingResult --------------{结束}--------------- | (使用探测结果评估目标的新主动运行状况) | V IActiveHealthCheckPolicy --(新的主动运行状况)--> IDestinationHealthUpdater --(更新每个目标的)--> DestinationState.Health.Active

上述所有组件都提供了默认的内置实现，如有需要，也可以替换为自定义实现。

## 可扩展性

主动运行状况检查子系统中有两个主要的可扩展点。

## IActiveHealthCheckPolicy

IActiveHealthCheckPolicy 会分析各个目标对 IActiveHealthCheckMonitor 发送的主动运行状况探测的响应情况，为所有被探测的目标评估出新的主动运行状况，然后调用 IDestinationHealthUpdater.SetActive 来设置新的主动运行状况，并根据更新后的值重新构建运行状况良好的目标集合。

下面是一个自定义 IActiveHealthCheckPolicy 的简单示例：如果探测返回了成功的响应代码，就将目标标记为 Healthy，否则标记为 Unhealthy。

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

IProbingRequestFactory 用于创建将发送到目标运行状况终结点的主动运行状况探测请求。它可以参考 ActiveHealthCheckOptions.Path、DestinationConfig.Health 以及其他配置设置来构造探测请求。

默认的 IProbingRequestFactory 使用与代理请求相同的 HttpRequest 配置；如果要自定义该行为，可以实现自己的 IProbingRequestFactory，并按如下方式将其注册到依赖关系注入容器中。

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

## 被动运行状况检查

YARP 可以被动地观察客户端请求代理过程中的成功和失败情况，从而以被动方式评估目标的运行状况。代理请求的响应会被一个专门的被动运行状况检查中间件拦截，并传递给为该群集配置的策略。该策略会分析这些响应，以评估产生这些响应的目标是否健康，然后为相应的目标计算并分配新的被动运行状况，并重新构建群集中运行状况良好的目标集合。

:::note
响应通常会在被动运行状况策略运行之前就已发送给客户端，因此除非代理应用程序引入了完整的响应缓冲，否则策略无法拦截响应正文，也无法修改响应标头中的任何内容。
:::

这与主动运行状况检查的逻辑存在一个重要区别：一旦目标被赋予了不健康的被动运行状况，它就会停止接收所有新流量，这也会阻碍后续对其运行状况的重新评估。因此，该策略还会安排在配置的时间段后对目标进行重新激活。重新激活是指将被动运行状况从 Unhealthy 重置回初始的 Unknown 值，从而使该目标重新有资格接收流量。

有若干个群集级别的配置设置用于控制被动运行状况检查，既可以在配置文件中设置，也可以在代码中设置。

## 文件示例

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

## 代码示例

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

## 配置

被动运行状况检查设置在群集级别的 Cluster/HealthCheck/Passive 部分中指定。也可以通过代码来定义，具体方式是使用 Yarp.ReverseProxy.Configuration 命名空间中与配置契约相对应的类型。

被动运行状况检查需要将 PassiveHealthCheckMiddleware 添加到管道中才能生效。默认的 MapReverseProxy(this IEndpointRouteBuilder endpoints) 方法会自动完成这一操作，但如果是手动构建管道，则必须调用 UsePassiveHealthChecks 方法来添加该中间件，如下面的示例所示。

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

## 内置策略

目前有一个内置的被动运行状况检查策略——TransportFailureRateHealthPolicy。它会为每个目标计算已代理请求的失败率，如果超过指定的限制，就将该目标标记为不健康。失败率的计算方式是：在给定时间段内，代理到某个目标的失败请求数占总请求数的百分比。失败计数器和总计数器都是在一个滑动时间窗口内进行跟踪的，也就是说，只有落在该窗口内的最近读数才会被计入。该策略的参数分为全局和每个群集两个级别设置。

全局参数通过选项机制设置，使用 TransportFailureRateHealthPolicyOptions 类型，具有以下属性：

- DetectionWindowSize——检测到的失败会被保留并计入失败率计算的时间段。默认值为 00:01:00。
- MinimalTotalCountThreshold——在该策略开始评估目标的运行状况并实施失败率限制之前，在检测窗口内必须已代理到某个目标的最小总请求数。默认值为 10。
- DefaultFailureRateLimit——当群集元数据中未设置失败率限制时，用于将目标标记为不健康的默认失败率限制。取值范围为 (0,1)。默认值为 0.3（30%）。

可以按如下方式在代码中设置全局策略选项：

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

## 设计

主要组件是位于请求管道中的 PassiveHealthCheckMiddleware，它负责分析各个目标返回的响应。对于来自已启用被动运行状况检查的群集下某个目标的每个响应，PassiveHealthCheckMiddleware 都会调用为该群集指定的 IPassiveHealthCheckPolicy。该策略会分析给定的响应，评估出目标的新被动运行状况，并调用 IDestinationHealthUpdater 来实际更新 DestinationHealthState.Passive 的值。该更新是在后台异步进行的，不会阻塞请求管道。当目标被标记为不健康时，它会停止接收新请求，直到经过配置的时间段后被重新激活。重新激活是指将目标的 DestinationHealthState.Passive 状态从 Unhealthy 重置为 Unknown，并重新构建群集中运行状况良好的目标列表，将该目标重新纳入其中。IDestinationHealthUpdater 会在将目标的 DestinationHealthState.Passive 设置为 Unhealthy 之后立即安排一次重新激活。

(对被代理请求的响应) |

PassiveHealthCheckMiddleware | V

IPassiveHealthCheckPolicy |

(评估新的被动运行状况) |

IDestinationHealthUpdater --(异步更新被动状态)--> DestinationState.Health.Passive

| V (安排重新激活) --(设置为 Unknown)--> DestinationState.Health.Passive

## 可扩展性

被动运行状况检查子系统中有一个主要的可扩展点，即 IPassiveHealthCheckPolicy。

## IPassiveHealthCheckPolicy

IPassiveHealthCheckPolicy 会分析目标对某个被代理的客户端请求作出的响应，评估其新的被动运行状况，最后调用 IDestinationHealthUpdater.SetPassiveAsync 来创建一个异步任务，实际更新被动运行状况并重新构建运行状况良好的目标集合。

下面是一个自定义 IPassiveHealthCheckPolicy 的简单示例：只要被代理的请求收到第一个不成功的响应，就将目标标记为 Unhealthy。

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

## 可用目标集合

目标的运行状况被用来确定哪些目标有资格接收被代理的请求。每个群集都会在 ClusterDestinationState 类型的 AvailableDestinations 属性中维护自己的可用目标列表。当任何目标的运行状况发生变化时，该列表都会被重新构建。这一过程由 IClusterDestinationsUpdater 控制，它会调用为群集配置的 IAvailableDestinationsPolicy，从群集的全部目标中实际选出可用目标。系统提供了以下内置策略，如有需要，也可以实现自定义策略。

HealthyAndUnknown——检查每个 DestinationState，如果以下所有陈述都为 TRUE，则将其添加到可用目标列表中。如果没有可用目标，请求将收到 503 错误。

- 群集上已禁用主动运行状况检查，或者 DestinationHealthState.Active != DestinationHealth.Unhealthy
- 群集上已禁用被动运行状况检查，或者 DestinationHealthState.Passive != DestinationHealth.Unhealthy

HealthyOrPanic——首先调用 HealthyAndUnknown 策略来获取可用目标。如果该调用未返回任何目标，则将群集的所有目标都标记为可用。这是默认策略。

:::note
无论给定群集上是否为其启用了任何运行状况检查，配置在该群集上的可用目标策略都会始终被调用。已禁用运行状况
:::

检查的运行状况会被设置为 Unknown。

## 配置

## 文件示例

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
