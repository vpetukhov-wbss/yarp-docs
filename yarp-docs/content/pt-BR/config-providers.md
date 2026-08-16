---
slug: config-providers
title: Provedores de configuração
lede: >-
  Carregue rotas e clusters de forma programática em vez de a partir de um arquivo, implementando
  você mesmo o IProxyConfigProvider - útil para um banco de dados, uma API remota ou qualquer
  outra fonte.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-providers
lastUpdated: 2025-02-10
---

## A interface do provedor

[Arquivos de configuração](doc:config-files) cobrem o caso comum de carregar a partir de `IConfiguration`. Para carregar de qualquer outro lugar, implemente você mesmo `IProxyConfigProvider` e `IProxyConfig`.

`IProxyConfigProvider` tem um único método, `GetConfig()`, que retorna um `IProxyConfig` - um snapshot com as rotas e clusters atuais, além de um `IChangeToken` que o provedor sinaliza sempre que esse snapshot está desatualizado, o que faz com que o proxy chame `GetConfig()` novamente.

## Carregando rotas e clusters diretamente

Para o caso mais simples - rotas e clusters totalmente conhecidos no código - `InMemoryConfigProvider` é um `IProxyConfigProvider` já pronto:

```csharp
services.AddReverseProxy().LoadFromMemory(routes, clusters);
```

Para alterar essa configuração posteriormente, resolva `InMemoryConfigProvider` a partir do contêiner de serviços e chame `Update`:

```csharp
httpContext.RequestServices.GetRequiredService<InMemoryConfigProvider>()
    .Update(routes, clusters);
```

## Ciclo de vida do provedor

### Inicialização

`IProxyConfigProvider` é registrado como singleton. Na inicialização, o proxy o resolve e chama `GetConfig()` uma vez; o provedor pode:

- lançar uma exceção, se não conseguir produzir uma configuração válida - isso impede que a aplicação seja iniciada;
- bloquear de forma síncrona até que a configuração seja carregada, o que atrasa a inicialização até que dados de rota válidos estejam disponíveis; ou
- retornar imediatamente um `IProxyConfig` vazio e carregar em segundo plano, sinalizando seu `IChangeToken` assim que os dados reais estiverem prontos.

Qualquer configuração retornada é validada, e um resultado inválido lança uma exceção que impede a inicialização - em vez disso, um provedor pode fazer uma pré-validação com `IConfigValidator` e excluir ele mesmo as entradas inválidas.

Os objetos de rota e cluster entregues ao proxy devem ser tratados como somente leitura assim que retornados por `GetConfig()`.

### Recarregamento

Se o `IChangeToken` oferecer suporte a callbacks de alteração ativos, o proxy registra um após o carregamento inicial; caso contrário, `HasChanged` é verificado por polling a cada 5 minutos. Para publicar uma nova configuração, um provedor deve carregá-la em segundo plano - construindo novas instâncias de rota/cluster, já que elas são imutáveis, embora as que não mudaram possam ser reutilizadas - opcionalmente validá-la, e só então sinalizar o `IChangeToken` *anterior*. Em resposta, o proxy chama `GetConfig()` novamente e compara o resultado com a configuração atual, atualizando somente o que mudou; a troca é atômica e afeta apenas novas requisições, não as que já estão em andamento.

:::important
Os `IChangeToken` são de uso único. Se `GetConfig()` lançar uma exceção durante um recarregamento, o proxy perde a capacidade de escutar novas alterações vindas desse provedor. Quaisquer outros erros de recarregamento são registrados em log e suprimidos, e o proxy continua usando a última configuração válida conhecida.
:::

Se vários recarregamentos forem sinalizados em rápida sucessão, o proxy pode ignorar alguns e carregar o que estiver disponível quando conseguir se atualizar - cada `IProxyConfig` é um snapshot completo, não uma diferença incremental, então nada se perde ao pular um intermediário.

## Múltiplos provedores

Mais de um `IProxyConfigProvider` pode ser registrado como singleton; todos eles são resolvidos e suas configurações combinadas, da mesma forma que várias seções de [arquivo de configuração](doc:config-files) podem ser. Uma rota de um provedor pode referenciar um cluster de outro, mas uma única rota ou cluster não pode ser montada a partir de dados parciais espalhados entre dois provedores.
