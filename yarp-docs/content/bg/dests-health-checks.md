---
slug: dests-health-checks
title: Проверки за състоянието на дестинациите
lede: >-
  При повечето реални системи е обичайно възлите им от време на време да изпитват
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks
lastUpdated: 2026-08-11
---

При повечето реални системи е обичайно възлите им от време на време да изпитват временни проблеми и да спират напълно да работят поради различни причини, като претоварване, изчерпване на ресурси, хардуерни повреди и т.н. В идеалния случай би било желателно тези неприятни събития да се предотвратяват изцяло по проактивен начин, но разходът за проектиране и изграждане на подобна идеална система обикновено е непосилно висок. Съществува обаче друг, реактивен подход, който е по-евтин и е насочен към минимизиране на негативното въздействие, което отказите оказват върху клиентските заявки. Прокси сървърът може да анализира състоянието на всеки възел и да спре да изпраща клиентски трафик към нездравите, докато те се възстановят. YARP реализира този подход под формата на активни и пасивни проверки за състоянието на дестинациите. Те са независими една от друга и се съхраняват в съответните свойства на всяка дестинация. Състоянията на здравето се инициализират със стойност Unknown, която впоследствие може да бъде променена на Healthy или Unhealthy от съответните политики, както е обяснено по-долу.

## Активни проверки за състоянието

YARP може проактивно да наблюдава състоянието на дестинациите, като изпраща периодични пробни заявки към определени крайни точки за здравословно състояние и анализира отговорите. Този анализ се извършва от политика за активна проверка на състоянието, зададена за клъстера, и води до изчисляване на новите състояния на здравето на дестинациите. В крайна сметка политиката маркира всяка дестинация като здрава или нездрава въз основа на HTTP кода на отговора (2xx се счита за здраво състояние) и възстановява колекцията от здрави дестинации на клъстера.

Съществуват няколко настройки на ниво клъстер, управляващи активните проверки за състоянието, които могат да се задават както в конфигурационния файл, така и в код. За всяка дестинация може да се зададе и специална крайна точка за проверка на здравословното състояние.

## Пример с файл

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

## Пример с код

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

Всички настройки за активна проверка на състоянието, с изключение на една, се задават на ниво клъстер в секцията Cluster/HealthCheck/Active. Единственото изключение е незадължителният елемент Destination/Health, който задава отделна крайна точка за активна проверка на състоянието. Действителният URI за пробване на състоянието се конструира като Destination/Address (или Destination/Health, когато е зададен) + Cluster/HealthCheck/Active/Path .

Настройките за активна проверка на състоянието могат да се дефинират и в код чрез съответните типове в namespace Yarp.ReverseProxy.Configuration, които отразяват конфигурационния договор.

Секцията Cluster/HealthCheck/Active и ActiveHealthCheckConfig:

Enabled : Флаг, указващ дали активната проверка на състоянието е включена за клъстера. По подразбиране

false

Interval : Период на изпращане на пробни заявки за проверка на състоянието. По подразбиране 00:00:15 Timeout : Таймаут на пробната заявка. По подразбиране 00:00:10 Policy : Име на политика, оценяваща активните състояния на здравето на дестинациите. Задължителен параметър Path : Път за проверка на състоянието за всички дестинации на клъстера. По подразбиране null . Query : Заявка за проверка на състоянието за всички дестинации на клъстера. По подразбиране null .

Секцията Destination и DestinationConfig.

Health : Специална крайна точка за пробване на състоянието, например http://destination:12345/ . По подразбиране е null и се използва Destination/Address .

## Вградени политики

В момента съществува една вградена политика за активна проверка на състоянието - ConsecutiveFailuresHealthPolicy . Тя брои последователните неуспешни пробни заявки за проверка на състоянието и маркира дестинацията като нездрава, щом бъде достигнат зададеният праг. При първия успешен отговор дестинацията се маркира като здрава и броячът се нулира. Параметрите на политиката се задават в метаданните на клъстера, както следва:

ConsecutiveFailuresHealthPolicy.Threshold - брой последователни неуспешни активни пробни заявки за проверка на състоянието, необходими за маркиране на дестинация като нездрава. По подразбиране 2 .

## Дизайн

Основната услуга в този процес е IActiveHealthCheckMonitor, която периодично създава пробни заявки чрез IProbingRequestFactory, изпраща ги към всички DestinationConfig на всеки

ClusterConfig с включени активни проверки на състоянието и след това предава всички отговори надолу към

IActiveHealthCheckPolicy, зададена за клъстера. IActiveHealthCheckMonitor не взема

самото решение дали дадена дестинация е здрава или не, а делегира тази задача на

IActiveHealthCheckPolicy, зададена за клъстера. Политиката се извиква, за да оцени новите

състояния на здравето, след като приключи пробването на всички дестинации на клъстера. Тя приема ClusterState,

представляващ динамичното състояние на клъстера, и набор от DestinationProbingResult, съхраняващи

резултатите от пробването на дестинациите на клъстера. След като оцени новото състояние на здравето на всяка дестинация,

политиката извиква IDestinationHealthUpdater, за да актуализира действително стойностите на DestinationHealthState.Active.

-{For each cluster's destination}- IActiveHealthCheckMonitor <--(Create probing request)--> IProbingRequestFactory

| V HttpMessageInvoker <--(Send probe and receive response)--> Destination | (Save probing result) | V DestinationProbingResult --------------{END}--------------- | (Evaluate new destination active health states using probing results) | V IActiveHealthCheckPolicy --(New active health states)--> IDestinationHealthUpdater --(Update each destination's)--> DestinationState.Health.Active

За всички споменати по-горе компоненти съществуват вградени реализации по подразбиране, които при необходимост могат да бъдат заменени с персонализирани.

## Разширяемост

В подсистемата за активна проверка на състоянието съществуват 2 основни точки за разширяемост.

## IActiveHealthCheckPolicy

IActiveHealthCheckPolicy анализира как дестинациите отговарят на активните пробни заявки, изпратени от IActiveHealthCheckMonitor , оценява новите активни състояния на здравето за всички пробвани дестинации и след това извиква IDestinationHealthUpdater.SetActive , за да зададе новите активни състояния на здравето и да възстанови колекцията от здрави дестинации въз основа на актуализираните стойности.

По-долу е показан прост пример за персонализирана IActiveHealthCheckPolicy , която маркира дестинацията като Healthy , ако за пробата е върнат успешен код на отговор, и като Unhealthy в противен случай.

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

IProbingRequestFactory създава активни пробни заявки за проверка на състоянието, които се изпращат към крайните точки за здраве на дестинациите. Тя може да взема предвид ActiveHealthCheckOptions.Path , DestinationConfig.Health и други конфигурационни настройки при конструирането на пробните заявки.

Реализацията на IProbingRequestFactory по подразбиране използва същата конфигурация на HttpRequest, каквато се използва и за прокси заявките; за да персонализирате това, реализирайте собствена IProbingRequestFactory и я регистрирайте в DI, както е показано по-долу.

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

## Пасивни проверки за състоянието

YARP може пасивно да наблюдава успехите и неуспехите при препращането на клиентски заявки, за да оценява реактивно състоянията на здравето на дестинациите. Отговорите на препратените заявки се прихващат от специален middleware за пасивна проверка на състоянието, който ги предава на политика, конфигурирана за клъстера. Политиката анализира отговорите, за да оцени дали дестинациите, които са ги произвели, са здрави или не. След това тя изчислява и присвоява нови пасивни състояния на здравето на съответните дестинации и възстановява колекцията от здрави дестинации на клъстера.

:::note
отговорът обикновено се изпраща на клиента, преди да се изпълни пасивната политика за проверка на състоянието, така че политиката не може да прихване тялото на отговора, нито да променя нещо в заглавията на отговора, освен ако прокси приложението не въведе пълно буфериране на отговора.
:::

Съществува една важна разлика спрямо логиката на активната проверка на състоянието. След като на дестинация бъде присвоено нездраво пасивно състояние, тя престава да получава нов трафик, което блокира бъдещото преоценяване на състоянието ѝ. Политиката също така планира реактивиране на дестинацията след изтичане на конфигурирания период. Реактивирането означава връщане на пасивното състояние от Unhealthy обратно към първоначалната стойност Unknown, което прави дестинацията отново допустима за трафик.

Съществуват няколко настройки на ниво клъстер, управляващи пасивните проверки за състоянието, които могат да се задават както в конфигурационния файл, така и в код.

## Пример с файл

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

## Пример с код

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

Настройките за пасивна проверка на състоянието се задават на ниво клъстер в секцията Cluster/HealthCheck/Passive. Като алтернатива могат да се дефинират и в код чрез съответните типове в namespace Yarp.ReverseProxy.Configuration, които отразяват конфигурационния договор.

За да работят, пасивните проверки за състоянието изискват добавянето на PassiveHealthCheckMiddleware в конвейера. Методът по подразбиране MapReverseProxy(this IEndpointRouteBuilder endpoints) прави това автоматично, но при ръчно изграждане на конвейера трябва да се извика методът UsePassiveHealthChecks, за да добави този middleware, както е показано в примера по-долу.

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

## Вградени политики

В момента съществува една вградена политика за пасивна проверка на състоянието - TransportFailureRateHealthPolicy. Тя изчислява процента на неуспешните препратени заявки за всяка дестинация и я маркира като нездрава, ако зададеният лимит бъде надвишен. Процентът се изчислява като съотношение на неуспешните заявки към общия брой заявки, препратени към дадена дестинация за определен период от време. Броячите за неуспешни и общи заявки се проследяват в плъзгащ се времеви прозорец, което означава, че се взимат предвид само последните показания, попадащи

в прозореца. Съществуват два набора от параметри на политиката, дефинирани глобално

и на ниво отделен клъстер.

Глобалните параметри се задават чрез механизма за опции, използвайки типа TransportFailureRateHealthPolicyOptions, със следните свойства:

DetectionWindowSize - период от време, през който откритите неуспехи се съхраняват и вземат предвид при изчисляването на процента. По подразбиране е 00:01:00 . MinimalTotalCountThreshold - минимален общ брой заявки, които трябва да бъдат препратени към дестинация в рамките на прозореца за откриване, преди тази политика да започне да оценява състоянието на дестинацията и да прилага лимита на процента на неуспехи. По подразбиране е 10 . DefaultFailureRateLimit - лимит по подразбиране на процента на неуспехи, при който дестинация се маркира като нездрава, и който се прилага, ако не е зададен в метаданните на клъстера. Стойността е в диапазона (0,1) . По подразбиране е 0.3 (30%).

Глобалните опции на политиката могат да се задават в код по следния начин:

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

## Дизайн

Основният компонент е PassiveHealthCheckMiddleware, който се намира в конвейера на заявките и анализира отговорите, връщани от дестинациите. За всеки отговор от дестинация, принадлежаща на клъстер с включени пасивни проверки на състоянието, PassiveHealthCheckMiddleware извиква IPassiveHealthCheckPolicy, зададена за клъстера. Политиката анализира дадения отговор, оценява новото пасивно състояние на здравето на дестинацията и извиква IDestinationHealthUpdater, за да актуализира действително стойността на DestinationHealthState.Passive. Актуализацията се извършва асинхронно във фонов режим и не блокира конвейера на заявките. Когато дестинация бъде маркирана като нездрава, тя престава да получава нови заявки, докато не бъде реактивирана след изтичане на конфигурирания период. Реактивирането означава, че състоянието DestinationHealthState.Passive на дестинацията се връща от

Unhealthy на Unknown и списъкът на здравите дестинации на клъстера се възстановява, за да я включи. А

реактивирането се планира от IDestinationHealthUpdater веднага след задаването на

DestinationHealthState.Passive на дестинацията на Unhealthy .

(Response to a proxied request) |

PassiveHealthCheckMiddleware | V

IPassiveHealthCheckPolicy |

(Evaluate new passive health state) |

IDestinationHealthUpdater --(Asynchronously update passive state)--> DestinationState.Health.Passive

| V (Schedule a reactivation) --(Set to Unknown)--> DestinationState.Health.Passive

## Разширяемост

В подсистемата за пасивна проверка на състоянието съществува една основна точка за разширяемост - IPassiveHealthCheckPolicy .

## IPassiveHealthCheckPolicy

IPassiveHealthCheckPolicy анализира как дадена дестинация е отговорила на препратена клиентска заявка, оценява новото ѝ пасивно състояние на здравето и накрая извиква IDestinationHealthUpdater.SetPassiveAsync , за да създаде асинхронна задача, която действително актуализира пасивното състояние на здравето и възстановява колекцията от здрави дестинации.

По-долу е показан прост пример за персонализирана IPassiveHealthCheckPolicy , която маркира дестинацията като Unhealthy при първия неуспешен отговор на препратена заявка.

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

## Колекция от налични дестинации

Състоянието на здравето на дестинациите се използва, за да се определи кои от тях са допустими за получаване на препратени заявки. Всеки клъстер поддържа собствен списък с налични дестинации в свойството AvailableDestinations на типа ClusterDestinationState. Този списък се възстановява при промяна на състоянието на здравето на която и да е дестинация. IClusterDestinationsUpdater контролира този процес и извиква IAvailableDestinationsPolicy, конфигурирана за клъстера, за да избере действително наличните дестинации измежду всички дестинации на клъстера. Предоставени са следните вградени политики, а при необходимост могат да се реализират и персонализирани.

HealthyAndUnknown - Проверява всеки DestinationState и го добавя в списъка с налични дестинации, ако всички от следните твърдения са TRUE. Ако няма налични дестинации, заявките ще получат грешка 503.

Активните проверки на състоянието са изключени за клъстера ИЛИ DestinationHealthState.Active !=

DestinationHealth.Unhealthy

Пасивните проверки на състоянието са изключени за клъстера ИЛИ DestinationHealthState.Passive

!= DestinationHealth.Unhealthy

HealthyOrPanic - Първо извиква политиката HealthyAndUnknown, за да получи наличните дестинации. Ако от това извикване не бъде върната нито една, тя маркира всички дестинации на клъстера като налични. Това е политиката по подразбиране.

:::note
Политиката за налични дестинации, конфигурирана за клъстер, винаги се извиква, независимо дали за дадения клъстер е включена проверка на състоянието. Състоянието на здравето при изключена проверка
:::

на състоянието се задава на Unknown .

## Конфигурация

## Пример с файл

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
