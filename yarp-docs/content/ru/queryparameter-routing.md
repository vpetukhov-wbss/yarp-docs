---
slug: queryparameter-routing
title: Маршрутизация по параметрам запроса
lede: >-
  Маршруты прокси, заданные в конфигурации или в коде, должны включать как минимум путь или узел
  для сопоставления
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/queryparameter-routing
lastUpdated: 2026-08-11
---

## Маршрутизация YARP по параметрам запроса

Маршруты прокси, заданные в конфигурации или в коде, должны включать как минимум путь или узел для сопоставления. Помимо этого, маршрут может также указывать один или несколько параметров запроса, которые должны присутствовать в запросе.

## Приоритет

Порядок приоритета сопоставления маршрутов по умолчанию: 1) путь, 2) метод, 3) узел, 4) заголовки, 5) параметры запроса. Это означает, что маршрут, задающий методы, но не параметры запроса, будет сопоставлен раньше, чем маршрут, задающий параметры запроса, но не методы. Это поведение можно переопределить, задав свойство Order у маршрута.

## Конфигурация

Параметры запроса задаются в разделе Match маршрута прокси.

Если для маршрута указано несколько правил параметров запроса, все они должны совпасть, чтобы маршрут был выбран. Логику ИЛИ необходимо реализовывать либо внутри одного правила параметра запроса, либо с помощью отдельных маршрутов.

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

RouteQueryParameter определяет контракт кода и сопоставляется из конфигурации.

## Name

Имя параметра запроса, который проверяется в запросе. Требуется непустое значение. Это поле нечувствительно к регистру.

## Values

Список возможных значений для поиска. Параметр запроса должен совпадать как минимум с одним из этих значений в соответствии с указанным Mode, за исключением режима NotContains. Требуется указать хотя бы одно значение, если только для Mode не задано значение Exists.

## Mode

QueryParameterMatchMode определяет, как сопоставлять значение(-я) с параметром запроса

в запросе. Значение по умолчанию — Exact.

Exact — параметр запроса должен совпадать полностью, с учётом значения IsCaseSensitive. Поддерживаются только одиночные параметры запроса. Если существует несколько параметров запроса с одинаковым именем, сопоставление считается неуспешным. Prefix — параметр запроса должен совпадать по префиксу, с учётом значения IsCaseSensitive. Поддерживаются только одиночные параметры запроса. Если существует несколько параметров запроса с одинаковым именем, сопоставление считается неуспешным. Exists — параметр запроса должен существовать и содержать любое непустое значение. Contains — для совпадения параметр запроса должен содержать указанное значение, с учётом значения IsCaseSensitive. Поддерживаются только одиночные параметры запроса. Если существует несколько параметров запроса с одинаковым именем, сопоставление считается неуспешным. NotContains — параметр запроса не должен содержать ни одно из значений сопоставления, с учётом значения IsCaseSensitive. Поддерживаются только одиночные параметры запроса. Если существует несколько параметров запроса с одинаковым именем, сопоставление считается неуспешным.

## IsCaseSensitive

Указывает, следует ли выполнять сопоставление значений с учётом регистра. Значение по умолчанию — false, то есть без учёта регистра.

## Кодирование

Строка запроса будет разобрана и декодирована перед сопоставлением с правилами маршрута.

"route8" : { "ClusterId": "cluster1", "Match": { "Path": "{**catch-all}", "QueryParameters": [ { "Name": "queryparam8", "Values": [ "another value" ], "Mode": "Exact" } ] }

Совпадает с

?queryparam8=another%20value

или

?queryparam8=another+value

## Примеры

В этих примерах используется конфигурация, приведённая выше.

## Сценарий 1 - Точное совпадение параметра запроса

Запрос со следующим параметром запроса совпадёт с route1.

?QueryParam1=Value1

Несколько параметров запроса с одинаковым именем в настоящее время не поддерживаются и не будут считаться совпадением.

?QueryParam1=Value1&QueryParam1=Value2

## Сценарий 2 - Несколько значений

Route2 задаёт несколько значений для поиска в параметре запроса ("1prefix", "2prefix"); подходит любое из них. Также для этого маршрута указан Mode со значением Prefix, поэтому подходит любой параметр запроса, начинающийся с этих значений. Route2 совпадёт с любым из следующих параметров запроса.

?QueryParam2=1prefix

?QueryParam2=2prefix

?QueryParam2=1prefix-extra

?QueryParam2=2prefix-extra

Несколько параметров запроса с одинаковым именем в настоящее время не поддерживаются и не будут считаться совпадением.

?QueryParam2=2prefix&QueryParam2=1prefix

## Сценарий 3 - Exists

Route3 требует лишь того, чтобы параметр запроса "QueryParam3" существовал с любым непустым значением. Ниже приведён пример запроса, который совпадёт с route3.

?QueryParam3=value

Пустой параметр запроса не будет считаться совпадением.

?QueryParam3 ?QueryParam3=

Этот режим поддерживает параметры запроса с несколькими значениями и несколько параметров запроса с одинаковым именем, поскольку не анализирует содержимое параметра запроса. Следующее будет считаться совпадением.

?QueryParam3=value1&QueryParam3=value2

## Сценарий 4 - Несколько параметров запроса

Route4 требует наличия одновременно QueryParam4 и QueryParam5, каждый из которых должен совпадать согласно своему указанному Mode. Следующие параметры запроса совпадут с route4:

?QueryParam4=value1&QueryParam5=AnyValue

?QueryParam4=value2&QueryParam5=AnyValue

Следующие не совпадут с route4, поскольку в них отсутствует один из обязательных параметров запроса:

?QueryParam4=value2

?QueryParam5=AnyValue Note: The author created this article with assistance from AI. Learn more
