---
slug: extensibility
title: Visão geral
lede: >-
  Existem 2 estilos principais de extensibilidade para o YARP, dependendo do comportamento de
  roteamento desejado:
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility
lastUpdated: 2026-08-11
---

## Visão geral da extensibilidade do YARP

Existem 2 estilos principais de extensibilidade para o YARP, dependendo do comportamento de roteamento desejado:

Pipeline de middleware Http Forwarder

## Pipeline de middleware

O YARP usa o conceito de Rotas, Clusters e Destinos. Estes podem ser fornecidos por meio de arquivos de configuração ou diretamente pelo código. Com base nas regras de roteamento, o YARP escolhe um cluster e enumera os possíveis destinos. Em seguida, ele usa o pipeline de middleware para selecionar o destino com base na integridade do destino, na afinidade de sessão, no balanceamento de carga etc.

A maior parte do pipeline pré-construído pode ser personalizada por meio de código:

Provedores de configuração Enumeração de destinos Afinidade de sessão Balanceamento de carga Verificações de integridade Transformações de requisição Configuração do HttpClient

Você também pode alterar a definição do pipeline para substituir módulos por suas próprias implementações ou adicionar módulos adicionais conforme necessário. Para mais informações, consulte Middleware.

## HTTP Forwarder

Se o pipeline do YARP for rígido demais para o seu caso de uso, ou se a escala das regras de roteamento e dos destinos não for adequada para carregamento em memória, você pode implementar sua própria lógica de roteamento e usar o HTTP Forwarder para direcionar as requisições ao destino escolhido. O componente HttpForwarder recebe o contexto HTTP e encaminha a requisição para o destino fornecido.

O componente de transformação ainda pode ser usado se o forwarder for necessário. Para mais informações, consulte Encaminhamento direto.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
