---
slug: destination-resolvers
title: Resolvedores de destino
lede: >-
  O YARP usa um resolvedor de destino para expandir o conjunto de endereços de destino
  configurados. O
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/destination-resolvers
lastUpdated: 2026-08-11
---

## Resolvedores de destino da extensibilidade do YARP

## Introdução

O YARP usa um resolvedor de destino para expandir o conjunto de endereços de destino configurados. O resolvedor de destino pode ser usado como um ponto de integração com sistemas de descoberta de serviços.

## Estrutura

## IDestinationResolver tem um único método

ResolveDestinationsAsync(IReadOnlyDictionary<string, DestinationConfig> destinations,

CancellationToken cancellationToken) que deve retornar uma instância de ResolvedDestinationCollection. O ResolvedDestinationCollection tem uma coleção de instâncias de DestinationConfig, além de um IChangeToken para notificar o proxy quando essa informação está desatualizada e deve ser recarregada, o que fará com que ResolveDestinationsAsync seja chamado novamente.

## DestinationConfig

DestinationConfig tem uma propriedade Host que pode ser usada para especificar o valor padrão do cabeçalho Host que o proxy deve usar ao se comunicar com aquele destino. Isso permite que o IDestinationResolver resolva destinos para uma coleção de endereços IP, por exemplo, sem causar falhas no SNI ou no roteamento baseado em host.

## Ciclo de vida

## Inicialização

O IDestinationResolver deve ser registrado no contêiner de DI como um singleton. Na inicialização, o proxy resolverá essa instância e chamará ResolveDestinationsAsync(...) com os destinos configurados obtidos dos IProxyConfigProviders resolvidos. Nessa primeira chamada, o provedor pode optar por:

Lançar uma exceção se o provedor não conseguir produzir uma configuração de proxy válida por qualquer motivo. Isso impedirá que a aplicação inicie. Resolver os destinos de forma assíncrona. Isso impedirá que a aplicação inicie até que os destinos resolvidos estejam disponíveis.

Ou ainda, ele pode optar por retornar uma instância vazia de ResolvedDestinationCollection enquanto

resolve os destinos em segundo plano. O provedor precisará acionar o

IChangeToken quando a configuração estiver disponível.

## Atomicidade

Os objetos e coleções de destinos fornecidos ao proxy devem ser somente leitura e não devem ser modificados depois de terem sido entregues ao proxy via GetConfig() .

## Recarregamento

Se o IChangeToken suportar ActiveChangeCallbacks , assim que o proxy tiver processado o conjunto inicial de destinos, ele registrará um callback com esse token. Se o provedor não suportar callbacks, então HasChanged será verificado periodicamente junto com os tokens de alteração do IProxyConfig, a cada 5 minutos.

Quando o provedor desejar fornecer um novo conjunto de destinos ao proxy, ele deve:

Resolver esses destinos em segundo plano. ResolvedDestinationCollection é imutável, portanto novas instâncias precisam ser criadas para quaisquer dados novos. Objetos para destinos inalterados podem ser reutilizados, ou novas instâncias podem ser criadas.

Invalidar o IChangeToken retornado pela invocação anterior de ResolveDestinationsAsync .

Depois que os novos destinos forem aplicados, o proxy registrará um callback com o novo IChangeToken . Observe que, se houver múltiplos recarregamentos sinalizados em sucessão rápida, o proxy pode ignorar alguns e resolver os destinos assim que estiver pronto.

## Resolvedor de destino DNS

O YARP inclui uma implementação de IDestinationResolver que expande o conjunto de destinos configurados resolvendo cada nome de host para um ou mais endereços IP usando DNS, criando um destino para cada IP resolvido. O resolvedor de destino DNS pode ser adicionado ao seu proxy reverso usando o

método IReverseProxyBuilder.AddDnsDestinationResolver(Action<DnsDestinationResolverOptions>)

. O método aceita um delegate opcional para configurar as opções do resolvedor, DnsDestinationResolverOptions.

## Exemplo

```csharp
// Add the DNS destination resolver, restricting results to IPv4 addresses
reverseProxyBuilder.AddDnsDestinationResolver(o => o.AddressFamily =
AddressFamily.InterNetwork);
```

## Configuração

As opções do resolvedor de destino DNS, DnsDestinationResolverOptions, têm as seguintes propriedades:

## RefreshPeriod

O período entre as solicitações de atualização de um nome resolvido. O padrão é 5 minutos.

## AddressFamily

Opcionalmente, especifique um valor de System.Net.Sockets.AddressFamily igual a AddressFamily.InterNetwork ou AddressFamily.InterNetworkV6 para restringir a resolução a endereços IPv4 ou IPv6, respectivamente. O valor padrão, null , instrui o resolvedor a não restringir a família de endereços dos resultados e a aceitar todos os endereços retornados.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
