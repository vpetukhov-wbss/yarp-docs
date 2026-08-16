---
slug: grpc
title: Proxy de gRPC
lede: >-
  gRPC é um framework de RPC (Remote Procedure Call) de alto desempenho e independente de
  linguagem. É
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/grpc
lastUpdated: 2026-08-11
---

## Introdução

gRPC é um framework de RPC (Remote Procedure Call) de alto desempenho e independente de linguagem. É construído sobre o HTTP/2 e pode ser encaminhado pelo YARP. Embora o YARP não precise ter conhecimento das mensagens gRPC, é necessário garantir que o protocolo HTTP correto esteja habilitado. O gRPC requer HTTP/2, e as chamadas gRPC falharão se o YARP não estiver configurado corretamente para enviar e receber requisições HTTP/2.

## Configurar os protocolos de entrada do YARP

O gRPC requer HTTP/2 na maioria dos cenários. O HTTP/1.1 e o HTTP/2 são habilitados por padrão em servidores ASP.NET Core (o front-end do YARP), mas eles exigem https (TLS) para HTTP/2, portanto o YARP precisa estar escutando em uma URL https://.

HTTP/2 sobre http (sem TLS) só é suportado no Kestrel e requer configurações específicas. Para mais informações, consulte gRPC services with ASP.NET Core.

Isto mostra como configurar o Kestrel para usar HTTP/2 sobre http (sem TLS):

```json
   {
       "Kestrel": {
          "Endpoints": {
             "http": {
                 "Url": "http://localhost:5000",
                 "Protocols": "Http2"
             }
          }
       }
   }
```

## Configurar os protocolos de saída do YARP

O YARP negocia automaticamente HTTP/1.1 ou HTTP/2 para as requisições de proxy de saída, mas apenas para https (TLS). HTTP/2 sobre http (sem TLS) requer configurações adicionais. Observe que os protocolos de saída são independentes dos de entrada. Por exemplo, https pode ser usado para a conexão

de entrada e http para a de saída; isso é chamado de encerramento de TLS (TLS termination). Para detalhes de

configuração, consulte YARP HTTP Client Configuration.

O exemplo a seguir mostra como configurar a requisição de proxy de saída para usar HTTP/2:

```json
"cluster1": {
   "HttpRequest": {
      "Version": "2",
      "VersionPolicy": "RequestVersionExact"
   },
   "Destinations": {
      "cluster1/destination1": {
          "Address": "http://localhost:6000/"
      }
   }
},
```

## gRPC-Web

gRPC-Web é um formato alternativo de transmissão (wire-format) para gRPC compatível com HTTP/1.1.

application/grpc - gRPC sobre HTTP/2 é a forma típica de uso do gRPC. application/grpc-web - o gRPC-Web modifica o protocolo gRPC para ser compatível com HTTP/1.1. O gRPC-Web pode ser usado em mais lugares. O gRPC-Web pode ser usado por aplicativos de navegador e em redes sem suporte completo a HTTP/2. Dois recursos avançados do gRPC não são suportados: streaming de cliente e streaming bidirecional.

O gRPC-Web pode ser encaminhado pela configuração padrão do YARP sem nenhuma consideração especial.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
