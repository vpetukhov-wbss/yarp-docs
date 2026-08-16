---
slug: header-routing
title: Маршрутизиране по заглавни части
lede: >-
  Прокси маршрутите, зададени в конфигурацията или чрез код, трябва да включват поне път или хост
  за съвпадение
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-routing
lastUpdated: 2026-08-11
---

## Маршрутизиране по заглавни части в YARP

Прокси маршрутите, зададени в конфигурацията или чрез код, трябва да включват поне път или хост, спрямо които да става съвпадението. Освен това маршрутът може да зададе една или повече заглавни части, които трябва да присъстват в заявката.

## Приоритет

Подразбиращият се ред на приоритет при съвпадение на маршрути е

1. път
1. метод
1. хост
1. заглавни части
1. параметри на заявката

Това означава, че маршрут, който задава методи, но не и заглавни части, ще бъде съпоставен преди маршрут, който задава заглавни части, но не и методи. Това може да бъде променено чрез задаване на свойството Order на маршрута (вижте примера в конфигурационните свойства).

## Конфигурация

Заглавните части се задават в секцията Match на прокси маршрута.

Ако за маршрут са зададени правила за няколко заглавни части, всички трябва да съвпаднат, за да бъде избран маршрутът. Логика "ИЛИ" трябва да се реализира или в рамките на едно правило за заглавна част, или чрез отделни маршрути.

Конфигурация:

```json
"Routes": {
   "route1" : {
      "ClusterId": "cluster1",
      "Match": {
         "Path": "{**catch-all}",
         "Headers": [
             {
                "Name": "header1",
                "Values": [ "value1" ],
                "Mode": "ExactHeader"
             }
         ]
      }
},
"route2" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header2",
                          "Values": [ "1prefix", "2prefix" ],
                          "Mode": "HeaderPrefix"
                      }
                   ]
}
},
"route3" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header3",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route4" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header4",
                          "Values": [ "value1", "value2" ],
                          "Mode": "ExactHeader"
                      },
                      {
                          "Name": "header5",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route5" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header5",
                          "Values": [ "value1", "value2" ],
                          "Mode": "Contains"
                      },
                      {
                          "Name": "header6",
                          "Mode": "Exists"
                      }
                   ]
       }
    },
    "route6" : {
       "ClusterId": "cluster1",
       "Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header6",
                          "Values": [ "value1", "value2" ],
                          "Mode": "NotContains"
                      },
                      {
                          "Name": "header7",
                          "Mode": "Exists"
                      }
                   ]
       }
    },
    "route7" : {
       "ClusterId": "cluster1",
       "Match": {
                   "Path": "{**catch-all}",
                   "Headers": [
                      {
                          "Name": "header7",
                          "Mode": "NotExists"
                      }
                   ]
       }
    }
}
Code:
```

```csharp
var routes = new[]
{
      new RouteConfig()
      {
             RouteId = "route1",
             ClusterId = "cluster1",
             Match = new RouteMatch
             {
                   Path = "{**catch-all}",
                   Headers = new[]
                   {
                          new RouteHeader()
                          {
                            Name = "Header1",
                            Values = new[] { "value1" },
                            Mode = HeaderMatchMode.ExactHeader
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route2",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header2",
                            Values = new[] { "1prefix", "2prefix" },
                            Mode = HeaderMatchMode.HeaderPrefix
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route3",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header3",
                            Mode = HeaderMatchMode.Exists
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route4",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header4",
                            Values = new[] { "value1", "value2" },
                             Mode = HeaderMatchMode.ExactHeader
                         },
                         new RouteHeader()
                         {
                             Name = "Header5",
                             Mode = HeaderMatchMode.Exists
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route5",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                             Name = "Header5",
                             Values = new[] { "value1", "value2" },
                             Mode = HeaderMatchMode.Contains
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route6",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                             Name = "Header6",
                             Values = new[] { "value1", "value2" },
                             Mode = HeaderMatchMode.NotContains
                         }
                      }
                   }
},
new RouteConfig()
{
                   RouteId = "route7",
                   ClusterId = "cluster1",
                   Match = new RouteMatch
                   {
                      Path = "{**catch-all}",
                      Headers = new[]
                      {
                         new RouteHeader()
                         {
                            Name = "Header7",
                            Mode = HeaderMatchMode.NotExists
                         }
                      }
                   }
    }
};
```

## Контракт

RouteHeader определя контракта в кода и се съпоставя с конфигурацията.

## Name

Името на заглавната част, за което да се проверява в заявката. Изисква се непразна стойност. Полето не различава главни и малки букви съгласно HTTP RFC документите.

## Values

Списък с възможни стойности, за които да се търси. Заглавната част трябва да съвпадне поне с една от тези стойности съгласно зададения Mode, с изключение на 'NotContains'. Изисква се поне една стойност, освен ако Mode не е зададен на Exists или NotExists.

## Mode

HeaderMatchMode определя как да се съпоставят стойността(ите) спрямо заглавната част на заявката. Стойността по подразбиране е ExactHeader.

ExactHeader - всяка от заглавните части с даденото име трябва да съвпада изцяло, в зависимост от стойността на IsCaseSensitive. Ако заглавна част съдържа няколко стойности (разделени с , или ;), те се разделят преди съпоставянето. Единична двойка кавички също се премахва от стойността преди съпоставянето. HeaderPrefix - всяка от заглавните части с даденото име трябва да съвпада по префикс, в зависимост от стойността на IsCaseSensitive. Ако заглавна част съдържа няколко стойности (разделени с , или ;), те се разделят преди съпоставянето. Единична двойка кавички също се премахва от стойността преди съпоставянето. Exists - заглавната част трябва да съществува и да съдържа произволна непразна стойност. Ако има няколко заглавни части със същото име, правилото също съвпада.

Contains - всяка от заглавните части с даденото име трябва да съдържа някоя от стойностите за съвпадение,

в зависимост от стойността на IsCaseSensitive.

NotContains - нито една от заглавните части с даденото име не трябва да съдържа никоя от стойностите

за съвпадение, в зависимост от стойността на IsCaseSensitive.

## IsCaseSensitive

Указва дали съпоставянето на стойността да се извършва с чувствителност към главни/малки букви. Стойността по подразбиране е false, без чувствителност към регистъра.

## Примери

Тези примери използват конфигурацията, зададена по-горе.

## Сценарий 1 - Точно съвпадение на заглавна част

Заявка със следната заглавна част ще съвпадне с route1.

Header1: Value1

Ако заглавна част съдържа няколко стойности, всяка от тях се съпоставя поотделно. Следната заявка ще съвпадне.

Header1: Value1, Value2

Същото важи, ако няколко стойности са разпределени в различни заглавни части със същото име.

Header1: Value1 Header1: Value2

Единична двойка обграждащи кавички може да бъде премахната от стойността преди съпоставянето. Следната заявка ще съвпадне.

Header1: "Value1"

Множество двойки кавички няма да съвпаднат.

Header1: ""Value1""

## Сценарий 2 - Множество стойности

Route2 задава няколко стойности за търсене в заглавна част ("1prefix", "2prefix") - приема се всяка от тях. Той също така задава Mode като HeaderPrefix, така че се приема всяка заглавна част, която започва с тези стойности. Всяка от следните заглавни части ще съвпадне с route2.

Header2: 1prefix

Header2: 2prefix

Header2: 1prefix-extra

Header2: 2prefix-extra

Ако заглавна част съдържа няколко стойности, всяка от тях се съпоставя поотделно. Следната заявка ще съвпадне.

Header2: foo, 1prefix, 2prefix

Същото важи, ако няколко стойности са разпределени в различни заглавни части със същото име.

Header2: 1prefix Header2: 2prefix

Единична двойка обграждащи кавички може да бъде премахната от стойността преди съпоставянето. Следната заявка ще съвпадне.

Header2: "2prefix"

Множество двойки кавички няма да съвпаднат.

Header2: ""2prefix""

## Сценарий 3 - Exists

Route3 изисква само заглавната част "Header3" да съществува с произволна непразна стойност. Следва пример, който ще съвпадне с route3.

Header3: value

Празна заглавна част няма да съвпадне.

Header3:

Този режим поддържа заглавни части с няколко стойности и няколко заглавни части със същото име, тъй като не проверява съдържанието на заглавната част. Следното ще съвпадне.

Header3: value1, value2

Header3: value1 Header3: value2

Header3: Header3:

## Сценарий 4 - Множество заглавни части

Route4 изисква едновременно header4 и header5, всяка от които съвпада съгласно зададения ѝ Mode. Следните заглавни части ще съвпаднат с route4:

Header4: value1 Header5: AnyValue

Header4: value2 Header5: AnyValue

Тези няма да съвпаднат с route4, защото им липсва една от изискваните заглавни части:

Header4: value2

Header5: AnyValue

## Сценарий 5 - NotExists

Route7 изисква заглавната част "Header7" да не съществува. Следните заглавни части ще съвпаднат с route7:

NotHeader7: AnyValue

Следните заглавни части няма да съвпаднат с route7, защото заглавната част "Header7" съществува.

Header7: AnyValue

Header7: Note: The author created this article with assistance from AI. Learn more
