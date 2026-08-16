---
slug: queryparameter-routing
title: Маршрутизиране по параметри на заявката
lede: >-
  Прокси маршрутите, зададени в конфигурацията или чрез код, трябва да включват поне път или хост
  за съвпадение
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/queryparameter-routing
lastUpdated: 2026-08-11
---

## Маршрутизиране по параметри на заявката в YARP

Прокси маршрутите, зададени в конфигурацията или чрез код, трябва да включват поне път или хост, спрямо които да става съвпадението. Освен това маршрутът може да зададе един или повече параметри на заявката, които трябва да присъстват в заявката.

## Приоритет

Подразбиращият се ред на приоритет при съвпадение на маршрути е 1) път, 2) метод, 3) хост, 4) заглавни части, 5) параметри на заявката. Това означава, че маршрут, който задава методи, но не и параметри на заявката, ще бъде съпоставен преди маршрут, който задава параметри на заявката, но не и методи. Това може да бъде променено чрез задаване на свойството Order на маршрута.

## Конфигурация

Параметрите на заявката се задават в секцията Match на прокси маршрута.

Ако за маршрут са зададени правила за няколко параметъра на заявката, всички трябва да съвпаднат, за да бъде избран маршрутът. Логика "ИЛИ" трябва да се реализира или в рамките на едно правило за параметър на заявката, или чрез отделни маршрути.

Конфигурация:

```json
"Routes": {
   "route1" : {
      "ClusterId": "cluster1",
      "Match": {
         "Path": "{**catch-all}",
         "QueryParameters": [
             {
                "Name": "queryparam1",
                "Values": [ "value1" ],
                "Mode": "Exact"
             }
         ]
      }
   },
   "route2" : {
      "ClusterId": "cluster1",
      "Match": {
         "Path": "{**catch-all}",
         "QueryParameters": [
             {
                          "Name": "queryparam2",
                          "Values": [ "1prefix", "2prefix" ],
                          "Mode": "Prefix"
                      }
                   ]
}
},
"route3" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam3",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route4" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam4",
                          "Values": [ "value1", "value2" ],
                          "Mode": "Exact"
                      },
                      {
                          "Name": "queryparam5",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route5" : {
"ClusterId": "cluster1",
"Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam5",
                          "Values": [ "value1", "value2" ],
                          "Mode": "Contains"
                      },
                      {
                          "Name": "queryparam6",
                          "Mode": "Exists"
                      }
                   ]
}
},
"route6" : {
"ClusterId": "cluster1",
       "Match": {
                   "Path": "{**catch-all}",
                   "QueryParameters": [
                      {
                          "Name": "queryparam6",
                          "Values": [ "value1", "value2" ],
                          "Mode": "NotContains"
                      },
                      {
                          "Name": "queryparam7",
                          "Mode": "Exists"
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
                   QueryParameters = new[]
                   {
                          new RouteQueryParameter()
                          {
                                 Name = "QueryParam1",
                                 Values = new[] { "value1" },
                                 Mode = QueryParameterMatchMode.Exact
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
                   QueryParameters = new[]
                   {
                          new RouteQueryParameter()
                          {
                                 Name = "QueryParam2",
                             Values = new[] { "1prefix", "2prefix" },
                             Mode = QueryParameterMatchMode.Prefix
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
                      QueryParameters = new[]
                      {
                         new RouteQueryParameter()
                         {
                             Name = "QueryParam3",
                             Mode = QueryParameterMatchMode.Exists
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
                      QueryParameters = new[]
                      {
                      new RouteQueryParameter()
                         {
                             Name = "QueryParam4",
                             Values = new[] { "value1", "value2" },
                             Mode = QueryParameterMatchMode.Exact
                         },
                         new RouteQueryParameter()
                         {
                             Name = "QueryParam5",
                             Mode = QueryParameterMatchMode.Exists
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
                      QueryParameters = new[]
                      {
                         new RouteQueryParameter()
                         {
                            Name = "QueryParam5",
                            Values = new[] { "value1", "value2" },
                            Mode = QueryParameterMatchMode.Contains
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
                      QueryParameters = new[]
                      {
                         new RouteQueryParameter()
                         {
                            Name = "QueryParam6",
                            Values = new[] { "value1", "value2" },
                            Mode = QueryParameterMatchMode.NotContains
                         }
                      }
                   }
    }
};
```

## Контракт

RouteQueryParameter определя контракта в кода и се съпоставя с конфигурацията.

## Name

Името на параметъра на заявката, за което да се проверява в заявката. Изисква се непразна стойност. Полето не различава главни и малки букви.

## Values

Списък с възможни стойности, за които да се търси. Параметърът на заявката трябва да съвпадне поне с една от тези стойности съгласно зададения Mode, с изключение на 'NotContains'. Изисква се поне една стойност, освен ако Mode не е зададен на Exists.

## Mode

QueryParameterMatchMode определя как да се съпоставят стойността(ите) спрямо параметъра

на заявката. Стойността по подразбиране е Exact.

Exact - параметърът на заявката трябва да съвпада изцяло, в зависимост от стойността на IsCaseSensitive. Поддържат се само единични параметри на заявката. Ако има няколко параметъра на заявката със същото име, съпоставянето се проваля. Prefix - параметърът на заявката трябва да съвпада по префикс, в зависимост от стойността на IsCaseSensitive. Поддържат се само единични параметри на заявката. Ако има няколко параметъра на заявката със същото име, съпоставянето се проваля. Exists - параметърът на заявката трябва да съществува и да съдържа произволна непразна стойност. Contains - параметърът на заявката трябва да съдържа стойността, за да има съвпадение, в зависимост от стойността на IsCaseSensitive. Поддържат се само единични параметри на заявката. Ако има няколко параметъра на заявката със същото име, съпоставянето се проваля. NotContains - параметърът на заявката не трябва да съдържа никоя от стойностите за съвпадение, в зависимост от стойността на IsCaseSensitive. Поддържат се само единични параметри на заявката. Ако има няколко параметъра на заявката със същото име, съпоставянето се проваля.

## IsCaseSensitive

Указва дали съпоставянето на стойността да се извършва с чувствителност към главни/малки букви. Стойността по подразбиране е false, без чувствителност към регистъра.

## Кодиране

Низът за заявка (query string) на заявката ще бъде анализиран и декодиран, преди да бъде съпоставен спрямо правилата на маршрута.

"route8" : { "ClusterId": "cluster1", "Match": { "Path": "{**catch-all}", "QueryParameters": [ { "Name": "queryparam8", "Values": [ "another value" ], "Mode": "Exact" } ] }

Съответства на

?queryparam8=another%20value

или

?queryparam8=another+value

## Примери

Тези примери използват конфигурацията, зададена по-горе.

## Сценарий 1 - Точно съвпадение на параметър на заявката

Заявка със следния параметър на заявката ще съвпадне с route1.

?QueryParam1=Value1

Понастоящем не се поддържат няколко параметъра на заявката със същото име и такива заявки няма да съвпаднат.

?QueryParam1=Value1&QueryParam1=Value2

## Сценарий 2 - Множество стойности

Route2 задава няколко стойности за търсене в параметър на заявката ("1prefix", "2prefix") - приема се всяка от тях. Той също така задава Mode като Prefix, така че се приема всеки параметър на заявката, който започва с тези стойности. Всеки от следните параметри на заявката ще съвпадне с route2.

?QueryParam2=1prefix

?QueryParam2=2prefix

?QueryParam2=1prefix-extra

?QueryParam2=2prefix-extra

Понастоящем не се поддържат няколко параметъра на заявката със същото име и такива заявки няма да съвпаднат.

?QueryParam2=2prefix&QueryParam2=1prefix

## Сценарий 3 - Exists

Route3 изисква само параметърът на заявката "QueryParam3" да съществува с произволна непразна стойност. Следва пример, който ще съвпадне с route3.

?QueryParam3=value

Празен параметър на заявката няма да съвпадне.

?QueryParam3 ?QueryParam3=

Този режим поддържа параметри на заявката с няколко стойности и няколко параметъра на заявката със същото име, тъй като не проверява съдържанието на параметъра на заявката. Следното ще съвпадне.

?QueryParam3=value1&QueryParam3=value2

## Сценарий 4 - Множество параметри на заявката

Route4 изисква едновременно QueryParam4 и QueryParam5, всеки от които съвпада съгласно зададения му Mode. Следните параметри на заявката ще съвпаднат с route4:

?QueryParam4=value1&QueryParam5=AnyValue

?QueryParam4=value2&QueryParam5=AnyValue

Тези няма да съвпаднат с route4, защото им липсва един от изискваните параметри на заявката:

?QueryParam4=value2

?QueryParam5=AnyValue Note: The author created this article with assistance from AI. Learn more
