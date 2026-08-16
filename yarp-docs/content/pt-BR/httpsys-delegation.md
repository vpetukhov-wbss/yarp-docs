---
slug: httpsys-delegation
title: Delegação do HTTP.sys
lede: >-
  A delegação do HTTP.sys é um recurso em nível de kernel adicionado a versões mais recentes do
  Windows que
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/httpsys-delegation
lastUpdated: 2026-08-11
---

## Introdução

A delegação do HTTP.sys é um recurso em nível de kernel adicionado a versões mais recentes do Windows que permite transferir uma solicitação da fila do HTTP.sys do processo receptor para a fila do HTTP.sys de um processo de destino, com pouquíssima sobrecarga ou latência adicional. Para que essa delegação funcione, o processo receptor só tem permissão para ler os cabeçalhos da solicitação. Se a leitura do corpo já tiver começado ou uma resposta já tiver sido iniciada, a tentativa de delegar a solicitação falhará. Após a delegação, a resposta não fica visível para o proxy, o que limita a funcionalidade dos componentes de afinidade de sessão e verificações de integridade passivas, bem como alguns dos algoritmos de balanceamento de carga. Internamente, o YARP utiliza o IHttpSysRequestDelegationFeature do ASP.NET Core

## Requisitos

A delegação do HTTP.sys requer:

O servidor HTTP.sys do ASP.NET Core Windows Server 2019 ou Windows 10 (build 1809) ou mais recente.

## Padrões

A delegação do HTTP.sys não será usada a menos que seja adicionada ao pipeline do proxy e habilitada na configuração do destino.

## Configuração

A delegação do HTTP.sys pode ser habilitada por destino adicionando os metadados HttpSysDelegationQueue ao destino. O valor desses metadados deve ser o nome da fila do HTTP.sys de destino. O Address do destino é usado para especificar o prefixo de URL da fila do HTTP.sys.

```json
{
   "ReverseProxy": {
      "Routes": {
         "route1" : {
             "ClusterId": "cluster1",
             "Match": {
                "Path": "{**catch-all}"
                      }
                   }
      },
      "Clusters": {
                   "cluster1": {
                      "Destinations": {
                         "cluster1/destination1": {
                            "Address": "http://*:80/",
                            "Metadata": {
                               "HttpSysDelegationQueue": "TargetHttpSysQueueName"
                            }
                         }
                      }
                   }
      }
   }
}
In host configuration, configure the host to use the HTTP.sys server:
    C#
   webBuilder.UseHttpSys();
In application configuration, use the MapReverseProxy overload that allows you to customize
the pipeline and add HTTP.sys delegation by calling UseHttpSysDelegation :
```

```csharp
   app.MapReverseProxy(proxyPipeline =>
   {
          // Add the three middleware YARP adds by default plus the HTTP.sys
          // delegation middleware
          proxyPipeline.UseSessionAffinity(); // No affect on delegation destinations
          proxyPipeline.UseLoadBalancing();
          proxyPipeline.UsePassiveHealthChecks();
          proxyPipeline.UseHttpSysDelegation();
   });
```

## Tempo de vida da fila de delegação

Quando o YARP é configurado para usar delegação em um destino, é criado um identificador (handle) para a fila do HTTP.sys especificada. Esse identificador é mantido ativo enquanto existirem destinos que façam referência a ele. A limpeza desses identificadores é feita durante o GC, portanto é possível que essa limpeza seja adiada caso o identificador acabe na Gen2. Isso pode causar problemas para alguns receptores durante a reinicialização do processo, pois, se eles tentarem criar a fila na inicialização, a operação falhará porque ela ainda existe, já que o YARP

ainda mantém um identificador para ela. Os receptores precisam ser inteligentes o suficiente para se anexar a ela

em vez disso e reconfigurar corretamente a fila. O servidor HTTP.sys do ASP.NET Core tem esse problema. Para mais informações, consulte Http.sys

server should support setting up URL groups when attaching to an existing queue

(dotnet/aspnetcore #40359) .

O YARP expõe uma forma de redefinir seu identificador para a fila. Isso permite que os consumidores escrevam lógica personalizada para determinar quando o identificador da fila deve ser limpo.

Exemplo:

```csharp
var delegator = app.Services.GetRequiredService<IHttpSysDelegator>();
delegator.ResetQueue("TargetHttpSysQueueName", "http://*:80");
 Note: The author created this article with assistance from AI. Learn more
```
