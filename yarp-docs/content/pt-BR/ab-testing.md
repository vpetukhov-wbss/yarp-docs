---
slug: ab-testing
title: Testes A/B e atualizações graduais
lede: >-
  Testes A/B e atualizações graduais exigem procedimentos para atribuir dinamicamente o tráfego de
  entrada
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/ab-testing
lastUpdated: 2026-08-11
---

## Testes A/B e atualizações graduais no YARP

## Introdução

Testes A/B e atualizações graduais exigem procedimentos para atribuir dinamicamente o tráfego de entrada, a fim de avaliar alterações no aplicativo de destino. O YARP não possui um modelo interno para isso, mas expõe uma infraestrutura útil para a criação de um sistema desse tipo. Consulte a issue #126 para mais detalhes sobre esse cenário.

## Exemplo

app.MapReverseProxy(proxyPipeline => {

// Custom cluster selection proxyPipeline.Use((context, next) => {

var lookup = context.RequestServices.GetRequiredService<IProxyStateLookup> ();

if (lookup.TryGetCluster(ChooseCluster(context), out var cluster)) {

context.ReassignProxyRequest(cluster); }

return next(); }); proxyPipeline.UseSessionAffinity(); proxyPipeline.UseLoadBalancing(); });

string ChooseCluster(HttpContext context) {

// Decide which cluster to use. This could be random, weighted, based on head- ers, etc.

return Random.Shared.Next(2) == 1 ? "cluster1" : "cluster2"; }

## Uso

Esse cenário usa duas APIs, IProxyStateLookup e ReassignProxyRequest, chamadas a partir de um middleware de proxy personalizado, como mostrado no exemplo acima.

IProxyStateLookup é um serviço disponível no contêiner de injeção de dependência que pode ser

usado para localizar ou enumerar as rotas e os clusters atuais. Observe que esses dados podem mudar se a

configuração for alterada. Um algoritmo de orquestração de teste A/B pode examinar a solicitação, decidir para qual

cluster enviá-la e, em seguida, recuperar esse cluster por meio de IProxyStateLookup.TryGetCluster .

Depois que o cluster é selecionado, o ReassignProxyRequest pode ser chamado para atribuir a solicitação a esse cluster. Isso atualiza o IReverseProxyFeature com as novas informações de cluster e destino necessárias para que o restante do pipeline de middleware do proxy processe a solicitação.

## Afinidade de sessão

:::note
que a funcionalidade de afinidade de sessão é dividida entre o middleware, que lê suas configurações a partir do cluster atual, e as transformações, que fazem parte da rota original. Os clusters usados para testes A/B devem usar a mesma configuração de afinidade de sessão para evitar conflitos.
:::

:::note
O autor criou este artigo com a ajuda de IA. Saiba mais
:::
