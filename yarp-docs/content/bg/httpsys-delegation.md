---
slug: httpsys-delegation
title: Делегиране на HTTP.sys
lede: >-
  Делегирането на HTTP.sys е функция на ниво ядро, добавена в по-новите версии на Windows, която
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/httpsys-delegation
lastUpdated: 2026-08-11
---

## Въведение

Делегирането на HTTP.sys е функция на ниво ядро, добавена в по-новите версии на Windows, която позволява заявка да бъде прехвърлена от опашката на HTTP.sys на приемащия процес към опашката на HTTP.sys на целевия процес с минимални допълнителни разходи и латентност. За да работи това делегиране, на приемащия процес е разрешено само да чете заглавните части на заявката. Ако тялото вече е започнало да се чете или отговорът вече е започнал, опитът за делегиране на заявката ще се провали. Отговорът няма да бъде видим за проксито след делегирането, което ограничава функционалността на компонентите за афинитет на сесията и пасивните проверки за състояние, както и на някои от алгоритмите за балансиране на натоварването. Вътрешно YARP използва IHttpSysRequestDelegationFeature на ASP.NET Core

## Изисквания

Делегирането на HTTP.sys изисква:

HTTP.sys сървъра на ASP.NET Core Windows Server 2019 или Windows 10 (номер на build 1809) или по-нова версия.

## Стойности по подразбиране

Делегирането на HTTP.sys няма да се използва, освен ако не бъде добавено към конвейера на проксито и активирано в конфигурацията на дестинацията.

## Конфигурация

Делегирането на HTTP.sys може да се активира за всяка отделна дестинация, като се добави метаданните HttpSysDelegationQueue към дестинацията. Стойността на тези метаданни трябва да бъде името на целевата опашка на HTTP.sys. Полето Address на дестинацията се използва, за да се укаже url префиксът на опашката на HTTP.sys.

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

## Жизнен цикъл на опашката за делегиране

Когато YARP е конфигуриран да използва делегиране за дадена дестинация, се създава handle към посочената опашка на HTTP.sys. Този handle се поддържа активен, докато съществуват дестинациите, които се позовават на него. Изчистването на тези handle-и се извършва по време на GC, така че е възможно изчистването да се забави, ако handle-ът попадне в поколение Gen2. Това може да причини проблеми за някои приемащи страни по време на рестартиране на процеса, защото ако те се опитат да създадат опашката при стартиране, това ще се провали, тъй като тя все още съществува, понеже YARP

има handle към нея. Приемащите страни трябва да са достатъчно интелигентни, за да се прикачат вместо това и правилно да пренастроят

опашката. HTTP.sys сървърът на ASP.NET Core има точно този проблем. За повече информация вижте Http.sys

server should support setting up URL groups when attaching to an existing queue

(dotnet/aspnetcore #40359) .

YARP предоставя начин за нулиране (reset) на своя handle към опашката. Това позволява на потребителите да напишат персонализирана логика, определяща кога handle-ът към опашката трябва да бъде изчистен.

Пример:

```csharp
var delegator = app.Services.GetRequiredService<IHttpSysDelegator>();
delegator.ResetQueue("TargetHttpSysQueueName", "http://*:80");
 Note: The author created this article with assistance from AI. Learn more
```
