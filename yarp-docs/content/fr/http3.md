---
slug: http3
title: HTTP/3
lede: >-
  YARP 1.1 prend en charge HTTP/3 pour les connexions entrantes et sortantes grâce à la prise en
  charge
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/http3
lastUpdated: 2026-08-11
---

## Introduction

YARP 1.1 prend en charge HTTP/3 pour les connexions entrantes et sortantes grâce à la prise en charge de HTTP/3 dans .NET 7. Pour activer le protocole HTTP/3 dans YARP, vous devez :

Configurer les connexions entrantes dans Kestrel Configurer les connexions sortantes dans HttpClient

## Configurer HTTP/3 sur Kestrel

Les protocoles doivent être spécifiés dans les options d'écoute :

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

La version par défaut de HttpRequest doit être remplacée par "3" ; pour en savoir plus sur la configuration de HttpRequest.

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
