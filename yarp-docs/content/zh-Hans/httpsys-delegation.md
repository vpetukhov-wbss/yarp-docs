---
slug: httpsys-delegation
title: HTTP.sys 委派
lede: >-
  HTTP.sys 委派是较新版本 Windows 中新增的一项内核级功能,它能以极小的开销和极低的额外延迟,将
  请求从接收进程的 HTTP.sys 队列转移到目标进程的 HTTP.sys 队列。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/httpsys-delegation
lastUpdated: 2026-08-11
---

## 简介

HTTP.sys 委派是较新版本 Windows 中新增的一项内核级功能,它能以极小的开销和极低的额外延迟,将请求从接收进程的 HTTP.sys 队列转移到目标进程的 HTTP.sys 队列。要使这种委派生效,接收进程只被允许读取请求标头。如果正文已经开始被读取,或者响应已经开始发送,那么尝试委派该请求就会失败。委派完成后,代理将无法再看到响应,这会限制会话相关性和被动运行状况检查组件的功能,也会限制部分负载均衡算法的功能。在内部,YARP 借助了 ASP.NET Core 的 IHttpSysRequestDelegationFeature。

## 要求

HTTP.sys 委派需要:

ASP.NET Core 的 HTTP.sys 服务器;Windows Server 2019 或 Windows 10(内部版本 1809)或更高版本。

## 默认设置

除非将 HTTP.sys 委派添加到代理管道并在目标配置中启用,否则不会使用该功能。

## 配置

可以通过向目标添加 HttpSysDelegationQueue 元数据,按目标启用 HTTP.sys 委派。该元数据的值应为目标 HTTP.sys 队列的名称。目标的 Address 用于指定该 HTTP.sys 队列的 URL 前缀。

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

## 委派队列的生命周期

当 YARP 为某个目标配置了委派后,系统会为指定的 HTTP.sys 队列创建一个句柄。只要引用该队列的目标仍然存在,这个句柄就会一直保持存活。这些句柄的清理工作在垃圾回收(GC)期间进行,因此如果句柄进入第 2 代(Gen2),其清理可能会被延迟。这可能会给某些接收方在进程重启期间带来问题:如果它们在启动时尝试创建该队列,由于 YARP 仍持有该队列的句柄、队列依然存在,创建就会失败。接收方必须足够智能,能够改为附加到现有队列,并正确地重新设置该队列。ASP.NET Core 的 HTTP.sys 服务器就存在这个问题。有关更多信息,请参阅 Http.sys 服务器在附加到现有队列时应支持设置 URL 组(dotnet/aspnetcore #40359)。

YARP 提供了一种方式,用于重置它持有的队列句柄。这样一来,使用者就可以编写自定义逻辑来决定何时应清理该队列句柄。

示例:

```csharp
var delegator = app.Services.GetRequiredService<IHttpSysDelegator>();
delegator.ResetQueue("TargetHttpSysQueueName", "http://*:80");
 Note: The author created this article with assistance from AI. Learn more
```
