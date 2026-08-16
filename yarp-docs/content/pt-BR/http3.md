---
slug: http3
title: HTTP/3
lede: >-
  O YARP 1.1 suporta HTTP/3 para conexões de entrada e saída usando o suporte a HTTP/3
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http3
lastUpdated: 2026-08-11
---

## Introdução

O YARP 1.1 suporta HTTP/3 para conexões de entrada e saída usando o suporte a HTTP/3 do .NET 7. Para habilitar o protocolo HTTP/3 no YARP, você precisa:

Configurar as conexões de entrada no Kestrel Configurar as conexões de saída no HttpClient

## Configurar o HTTP/3 no Kestrel

Os protocolos são exigidos nas opções do listener:

```csharp
   var builder = WebApplication.CreateBuilder(args);
   builder.WebHost.ConfigureKestrel(kestrel =>
   {
          kestrel.ListenAnyIP(443, portOptions =>
          {
                 portOptions.Protocols = HttpProtocols.Http1AndHttp2AndHttp3;
                 portOptions.UseHttps();
          });
   });
```

## HttpClient

A versão padrão do HttpRequest deve ser substituída por "3"; encontre mais detalhes sobre a configuração do HttpRequest.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
