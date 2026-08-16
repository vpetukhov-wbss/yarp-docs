---
slug: websockets
title: WebSockets e SPDY
lede: >-
  O YARP habilita o encaminhamento de conexões WebSocket e SPDY por padrão. Esse suporte funciona
  com
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/websockets
lastUpdated: 2026-08-11
---

## Encaminhamento de WebSockets e SPDY pelo YARP

## Introdução

O YARP habilita o encaminhamento de conexões WebSocket e SPDY por padrão. Esse suporte funciona tanto com a abordagem de encaminhamento direto quanto com o pipeline completo.

WebSockets é um protocolo de streaming bidirecional construído sobre HTTP/1.1 ou posterior, adaptado para HTTP/2.

SPDY é o precursor do HTTP/2 e é comumente usado em ambientes Kubernetes.

## Upgrades de HTTP/1.1

WebSockets e SPDY são construídos sobre HTTP/1.1 usando um recurso chamado upgrades de conexão. O YARP encaminha a requisição inicial e, se o servidor de destino responder com 101 Switching Protocols, promove a conexão para um fluxo bidirecional opaco usando o novo protocolo. O YARP não oferece suporte a upgrade para outros protocolos, como HTTP/2, dessa forma.

## HTTP/2

O YARP suporta WebSockets sobre HTTP/2 a partir do .NET 7 e do YARP 2.0. O Kestrel é o único servidor AspNetCore disponível que aceitará requisições WebSocket de entrada via HTTP/2, e esse suporte é habilitado automaticamente. Os navegadores conseguem detectar esse suporte anunciado pelo servidor e alternar automaticamente para HTTP/2.

As versões de protocolo de entrada e saída não precisam corresponder. A requisição WebSocket de entrada pode ser HTTP/1.1 ou 2. Não há configuração específica para WebSockets nas requisições de saída; o YARP usará o Version e o VersionPolicy do ForwarderRequestConfig para determinar a versão de saída a ser usada. Os padrões são HTTP/2 e RequestVersionOrLower.

WebSockets exigem cabeçalhos HTTP diferentes para HTTP/2, portanto o YARP adicionará e removerá esses cabeçalhos conforme necessário ao adaptar entre as diferentes versões.

Após o handshake inicial, os WebSockets funcionam da mesma forma em ambas as versões de HTTP.

## Tempo limite

Os Http Request Timeouts (.NET 8+) podem aplicar tempos limite a todas as requisições por padrão ou por política.

Esses tempos limite serão desabilitados após um handshake de WebSocket. Eles ainda se aplicarão a requisições

gRPC. Para configurações adicionais, consulte Tempos limite de requisição.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
