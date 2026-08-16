---
slug: dests-health-checks
title: Verificações de integridade de destino
lede: >-
  Na maioria dos sistemas do mundo real, é esperado que seus nós ocasionalmente sofram
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/dests-health-checks
lastUpdated: 2026-08-11
---

Na maioria dos sistemas do mundo real, é esperado que seus nós ocasionalmente sofram problemas transitórios e fiquem completamente indisponíveis por uma variedade de motivos, como sobrecarga, vazamento de recursos, falhas de hardware etc. Idealmente, seria desejável evitar completamente esses eventos indesejados de forma proativa, mas o custo de projetar e construir um sistema ideal desse tipo costuma ser proibitivo. No entanto, há outra abordagem, reativa, que é mais barata e visa minimizar o impacto negativo que as falhas causam nas requisições dos clientes. O proxy pode analisar a integridade de cada nó e parar de enviar tráfego de clientes para os que não estão íntegros até que se recuperem. O YARP implementa essa abordagem na forma de verificações de integridade de destino ativas e passivas. Elas são independentes uma da outra e armazenadas nas propriedades correspondentes de cada destino. Os estados de integridade são inicializados com o valor Unknown, que pode ser alterado posteriormente para Healthy ou Unhealthy pelas políticas correspondentes, conforme explicado abaixo.

## Verificações de integridade ativas

O YARP pode monitorar proativamente a integridade dos destinos enviando requisições de sondagem periódicas para endpoints de integridade designados e analisando as respostas. Essa análise é realizada por uma política de verificação de integridade ativa especificada para um cluster e resulta no cálculo dos novos estados de integridade dos destinos. Ao final, a política marca cada destino como íntegro ou não íntegro com base no código de resposta HTTP (2xx é considerado íntegro) e reconstrói a coleção de destinos íntegros do cluster.

Existem várias configurações de nível de cluster que controlam as verificações de integridade ativas e que podem ser definidas tanto no arquivo de configuração quanto em código. Um endpoint de integridade dedicado também pode ser especificado por destino.

## Exemplo de arquivo

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

## Exemplo de código

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

## Configuração

Todas as configurações de verificação de integridade ativa, exceto uma, são especificadas em nível de cluster na seção Cluster/HealthCheck/Active. A única exceção é um elemento opcional Destination/Health que especifica um endpoint de verificação de integridade ativa separado. O URI de sondagem de integridade real é construído como Destination/Address (ou Destination/Health, quando definido) + Cluster/HealthCheck/Active/Path .

As configurações de verificação de integridade ativa também podem ser definidas em código por meio dos tipos correspondentes no namespace Yarp.ReverseProxy.Configuration, que espelha o contrato de configuração.

Seção Cluster/HealthCheck/Active e ActiveHealthCheckConfig:

Enabled : Sinalizador que indica se a verificação de integridade ativa está habilitada para um cluster. Padrão

false

Interval : Período de envio das requisições de sondagem de integridade. Padrão 00:00:15 Timeout : Tempo limite da requisição de sondagem. Padrão 00:00:10 Policy : Nome de uma política que avalia os estados de integridade ativa dos destinos. Parâmetro obrigatório Path : Caminho de verificação de integridade em todos os destinos do cluster. Padrão null . Query : Consulta de verificação de integridade em todos os destinos do cluster. Padrão null .

Seção Destination e DestinationConfig.

Health : Um endpoint de sondagem de integridade dedicado, como http://destination:12345/ . O padrão é null e retorna para Destination/Address .

## Políticas integradas

Atualmente existe uma política de verificação de integridade ativa integrada - ConsecutiveFailuresHealthPolicy . Ela conta as falhas consecutivas de sondagem de integridade e marca um destino como não íntegro quando o limite definido é atingido. Na primeira resposta bem-sucedida, um destino é marcado como íntegro e o contador é reiniciado. Os parâmetros da política são definidos nos metadados do cluster da seguinte forma:

ConsecutiveFailuresHealthPolicy.Threshold - número de requisições de sondagem de integridade ativa falhadas consecutivamente necessário para marcar um destino como não íntegro. Padrão 2 .

## Design

O principal serviço nesse processo é o IActiveHealthCheckMonitor, que cria periodicamente requisições de sondagem por meio do IProbingRequestFactory, envia-as para todos os DestinationConfig de cada

ClusterConfig com verificações de integridade ativas habilitadas e, em seguida, repassa todas as respostas para uma

IActiveHealthCheckPolicy especificada para um cluster. O IActiveHealthCheckMonitor não toma a

decisão real sobre se um destino está íntegro ou não, mas delega essa responsabilidade a uma

IActiveHealthCheckPolicy especificada para um cluster. Uma política é chamada para avaliar os novos estados de integridade

depois que a sondagem de todos os destinos do cluster é concluída. Ela recebe um ClusterState

representando o estado dinâmico do cluster e um conjunto de DestinationProbingResult armazenando os

resultados de sondagem dos destinos do cluster. Após avaliar um novo estado de integridade para cada destino, a

política chama o IDestinationHealthUpdater para efetivamente atualizar os valores de DestinationHealthState.Active.

-{For each cluster's destination}- IActiveHealthCheckMonitor <--(Create probing request)--> IProbingRequestFactory

| V HttpMessageInvoker <--(Send probe and receive response)--> Destination | (Save probing result) | V DestinationProbingResult --------------{END}--------------- | (Evaluate new destination active health states using probing results) | V IActiveHealthCheckPolicy --(New active health states)--> IDestinationHealthUpdater --(Update each destination's)--> DestinationState.Health.Active

Existem implementações integradas padrão para todos os componentes mencionados acima, que também podem ser substituídas por implementações personalizadas quando necessário.

## Extensibilidade

Existem 2 pontos de extensibilidade principais no subsistema de verificação de integridade ativa.

## IActiveHealthCheckPolicy

IActiveHealthCheckPolicy analisa como os destinos respondem às sondagens de integridade ativa enviadas pelo IActiveHealthCheckMonitor , avalia novos estados de integridade ativa para todos os destinos sondados e, em seguida, chama IDestinationHealthUpdater.SetActive para definir os novos estados de integridade ativa e reconstruir a coleção de destinos íntegros com base nos valores atualizados.

Abaixo está um exemplo simples de um IActiveHealthCheckPolicy personalizado que marca o destino como Healthy , se um código de resposta bem-sucedido foi retornado para uma sondagem, e como Unhealthy caso contrário.

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

IProbingRequestFactory cria as requisições de sondagem de integridade ativa a serem enviadas aos endpoints de integridade dos destinos. Ele pode levar em conta ActiveHealthCheckOptions.Path , DestinationConfig.Health e outras configurações para construir as requisições de sondagem.

O IProbingRequestFactory padrão usa a mesma configuração de HttpRequest das requisições do proxy; para personalizar isso, implemente seu próprio IProbingRequestFactory e registre-o na DI como mostrado abaixo.

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

## Verificações de integridade passivas

O YARP pode observar passivamente os sucessos e as falhas no encaminhamento de requisições de clientes para avaliar reativamente os estados de integridade dos destinos. As respostas às requisições encaminhadas são interceptadas por um middleware dedicado de verificação de integridade passiva, que as repassa para uma política configurada no cluster. A política analisa as respostas para avaliar se os destinos que as produziram estão íntegros ou não. Em seguida, calcula e atribui novos estados de integridade passiva aos respectivos destinos e reconstrói a coleção de destinos íntegros do cluster.

:::note
a resposta normalmente é enviada ao cliente antes da execução da política de integridade passiva, portanto uma política não pode interceptar o corpo da resposta, nem modificar nada nos cabeçalhos de resposta, a menos que a aplicação do proxy introduza o buffering completo da resposta.
:::

Há uma diferença importante em relação à lógica de verificação de integridade ativa. Assim que um destino recebe um estado passivo não íntegro, ele para de receber todo o novo tráfego, o que bloqueia a reavaliação futura da integridade. A política também agenda a reativação de um destino após o período configurado. Reativação significa redefinir o estado de integridade passiva de Unhealthy de volta para o valor inicial Unknown, o que torna o destino elegível para tráfego novamente.

Existem várias configurações de nível de cluster que controlam as verificações de integridade passivas e que podem ser definidas tanto no arquivo de configuração quanto em código.

## Exemplo de arquivo

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

## Exemplo de código

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

## Configuração

As configurações de verificação de integridade passiva são especificadas em nível de cluster na seção Cluster/HealthCheck/Passive. Alternativamente, podem ser definidas em código por meio dos tipos correspondentes no namespace Yarp.ReverseProxy.Configuration, que espelha o contrato de configuração.

As verificações de integridade passivas exigem que o PassiveHealthCheckMiddleware seja adicionado ao pipeline para funcionarem. O método padrão MapReverseProxy(this IEndpointRouteBuilder endpoints) faz isso automaticamente, mas, no caso de uma construção manual do pipeline, o método UsePassiveHealthChecks deve ser chamado para adicionar esse middleware, conforme mostrado no exemplo abaixo.

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

## Políticas integradas

Atualmente existe uma política de verificação de integridade passiva integrada - TransportFailureRateHealthPolicy. Ela calcula a taxa de falha das requisições encaminhadas para cada destino e o marca como não íntegro se o limite especificado for excedido. A taxa é calculada como a porcentagem de requisições com falha em relação ao número total de requisições encaminhadas a um destino em um determinado período de tempo. Os contadores de falhas e de total são rastreados em uma janela de tempo deslizante, o que significa que apenas as leituras recentes que se encaixam

na janela são levadas em conta. Há dois conjuntos de parâmetros de política definidos globalmente

e em nível de cluster.

Os parâmetros globais são definidos por meio do mecanismo de opções usando o tipo TransportFailureRateHealthPolicyOptions, com as seguintes propriedades:

DetectionWindowSize - período de tempo durante o qual as falhas detectadas são mantidas e levadas em conta no cálculo da taxa. O padrão é 00:01:00 . MinimalTotalCountThreshold - número total mínimo de requisições que devem ser encaminhadas a um destino dentro da janela de detecção antes que essa política comece a avaliar a integridade do destino e aplicar o limite de taxa de falha. O padrão é 10 . DefaultFailureRateLimit - limite padrão de taxa de falha para que um destino seja marcado como não íntegro, aplicado quando não está definido nos metadados de um cluster. O valor está no intervalo (0,1) . O padrão é 0.3 (30%).

Os parâmetros globais da política podem ser definidos em código da seguinte forma:

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

## Design

O principal componente é o PassiveHealthCheckMiddleware, que fica no pipeline de requisições analisando as respostas retornadas pelos destinos. Para cada resposta de um destino pertencente a um cluster com verificações de integridade passivas habilitadas, o PassiveHealthCheckMiddleware invoca uma IPassiveHealthCheckPolicy especificada para o cluster. A política analisa a resposta recebida, avalia o novo estado de integridade passiva do destino e chama o IDestinationHealthUpdater para efetivamente atualizar o valor de DestinationHealthState.Passive. A atualização acontece de forma assíncrona em segundo plano e não bloqueia o pipeline de requisições. Quando um destino é marcado como não íntegro, ele para de receber novas requisições até ser reativado após um período configurado. Reativação significa que o estado DestinationHealthState.Passive do destino é redefinido de

Unhealthy para Unknown e a lista de destinos íntegros do cluster é reconstruída para incluí-lo. Uma

reativação é agendada pelo IDestinationHealthUpdater logo após definir o

DestinationHealthState.Passive do destino como Unhealthy .

(Response to a proxied request) |

PassiveHealthCheckMiddleware | V

IPassiveHealthCheckPolicy |

(Evaluate new passive health state) |

IDestinationHealthUpdater --(Asynchronously update passive state)--> DestinationState.Health.Passive

| V (Schedule a reactivation) --(Set to Unknown)--> DestinationState.Health.Passive

## Extensibilidade

Há um ponto de extensibilidade principal no subsistema de verificação de integridade passiva, o IPassiveHealthCheckPolicy .

## IPassiveHealthCheckPolicy

IPassiveHealthCheckPolicy analisa como um destino respondeu a uma requisição de cliente encaminhada, avalia seu novo estado de integridade passiva e, por fim, chama IDestinationHealthUpdater.SetPassiveAsync para criar uma tarefa assíncrona que efetivamente atualiza o estado de integridade passiva e reconstrói a coleção de destinos íntegros.

Abaixo está um exemplo simples de um IPassiveHealthCheckPolicy personalizado que marca o destino como Unhealthy na primeira resposta malsucedida a uma requisição encaminhada.

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

## Coleção de destinos disponíveis

O estado de integridade dos destinos é usado para determinar quais deles são elegíveis para receber requisições encaminhadas. Cada cluster mantém sua própria lista de destinos disponíveis na propriedade AvailableDestinations do tipo ClusterDestinationState. Essa lista é reconstruída sempre que o estado de integridade de algum destino muda. O IClusterDestinationsUpdater controla esse processo e chama uma IAvailableDestinationsPolicy configurada no cluster para efetivamente escolher os destinos disponíveis entre todos os destinos do cluster. Há as seguintes políticas integradas fornecidas, e políticas personalizadas podem ser implementadas se necessário.

HealthyAndUnknown - Inspeciona cada DestinationState e o adiciona à lista de destinos disponíveis se todas as afirmações a seguir forem TRUE. Se nenhum destino estiver disponível, as requisições receberão um erro 503.

As verificações de integridade ativas estão desabilitadas no cluster OR DestinationHealthState.Active !=

DestinationHealth.Unhealthy

As verificações de integridade passivas estão desabilitadas no cluster OR DestinationHealthState.Passive

!= DestinationHealth.Unhealthy

HealthyOrPanic - Chama primeiro a política HealthyAndUnknown para obter os destinos disponíveis. Se nenhum for retornado dessa chamada, ela marca todos os destinos do cluster como disponíveis. Essa é a política padrão.

:::note
Uma política de destino disponível configurada em um cluster sempre será chamada, independentemente de haver alguma verificação de integridade habilitada no cluster em questão. O estado de integridade de uma verificação de integridade
:::

desabilitada é definido como Unknown .

## Configuração

## Exemplo de arquivo

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
