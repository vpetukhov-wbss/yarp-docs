---
slug: header-routing
title: Маршрутизация на основе заголовков
lede: >-
  Маршруты прокси, заданные в конфигурации или в коде, должны включать как минимум путь или узел
  для сопоставления
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-routing
lastUpdated: 2026-08-11
---

## Маршрутизация YARP на основе заголовков

Маршруты прокси, заданные в конфигурации или в коде, должны включать как минимум путь или узел для сопоставления. Помимо этого, маршрут может также указывать один или несколько заголовков, которые должны присутствовать в запросе.

## Приоритет

Порядок приоритета сопоставления маршрутов по умолчанию:

1. путь
1. метод
1. узел
1. заголовки
1. параметры запроса

Это означает, что маршрут, задающий методы, но не заголовки, будет сопоставлен раньше, чем маршрут, задающий заголовки, но не методы. Это поведение можно переопределить, задав свойство Order у маршрута (см. пример в свойствах конфигурации).

## Конфигурация

Заголовки задаются в разделе Match маршрута прокси.

Если для маршрута указано несколько правил заголовков, все они должны совпасть, чтобы маршрут был выбран. Логику ИЛИ необходимо реализовывать либо внутри одного правила заголовка, либо с помощью отдельных маршрутов.

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

RouteHeader определяет контракт кода и сопоставляется из конфигурации.

## Name

Имя заголовка, который проверяется в запросе. Требуется непустое значение. Это поле нечувствительно к регистру в соответствии со спецификациями HTTP (RFC).

## Values

Список возможных значений для поиска. Заголовок должен совпадать как минимум с одним из этих значений в соответствии с указанным Mode, за исключением режима NotContains. Требуется указать хотя бы одно значение, если только для Mode не задано значение Exists или NotExists.

## Mode

HeaderMatchMode определяет, как сопоставлять значение(-я) с заголовком запроса. Значение по умолчанию — ExactHeader.

ExactHeader — любой из заголовков с указанным именем должен совпадать полностью, с учётом значения IsCaseSensitive. Если заголовок содержит несколько значений (разделённых , или ;), перед сопоставлением они разбиваются на отдельные значения. Также перед сопоставлением из значения удаляется одна пара кавычек, если она есть. HeaderPrefix — любой из заголовков с указанным именем должен совпадать по префиксу, с учётом значения IsCaseSensitive. Если заголовок содержит несколько значений (разделённых , или ;), перед сопоставлением они разбиваются на отдельные значения. Также перед сопоставлением из значения удаляется одна пара кавычек, если она есть. Exists — заголовок должен существовать и содержать любое непустое значение. Если существует несколько заголовков с одинаковым именем, правило также считается совпавшим.

Contains — любой из заголовков с указанным именем должен содержать любое из значений сопоставления,

с учётом значения IsCaseSensitive.

NotContains — ни один из заголовков с указанным именем не должен содержать ни одно из значений

сопоставления, с учётом значения IsCaseSensitive.

## IsCaseSensitive

Указывает, следует ли выполнять сопоставление значений с учётом регистра. Значение по умолчанию — false, то есть без учёта регистра.

## Примеры

В этих примерах используется конфигурация, приведённая выше.

## Сценарий 1 - Точное совпадение заголовка

Запрос со следующим заголовком совпадёт с route1.

Header1: Value1

Если заголовок содержит несколько значений, каждое из них сопоставляется отдельно. Следующий запрос будет совпадать.

Header1: Value1, Value2

То же самое верно, если несколько значений разделены между несколькими заголовками с одинаковым именем.

Header1: Value1 Header1: Value2

Одна пара окружающих кавычек может быть удалена из значения перед сопоставлением. Следующий запрос будет совпадать.

Header1: "Value1"

Несколько пар кавычек не будут считаться совпадением.

Header1: ""Value1""

## Сценарий 2 - Несколько значений

Route2 задаёт несколько значений для поиска в заголовке ("1prefix", "2prefix"); подходит любое из них. Также для этого маршрута указан Mode со значением HeaderPrefix, поэтому подходит любой заголовок, начинающийся с этих значений. Route2 совпадёт с любым из следующих заголовков.

Header2: 1prefix

Header2: 2prefix

Header2: 1prefix-extra

Header2: 2prefix-extra

Если заголовок содержит несколько значений, каждое из них сопоставляется отдельно. Следующий запрос будет совпадать.

Header2: foo, 1prefix, 2prefix

То же самое верно, если несколько значений разделены между несколькими заголовками с одинаковым именем.

Header2: 1prefix Header2: 2prefix

Одна пара окружающих кавычек может быть удалена из значения перед сопоставлением. Следующий запрос будет совпадать.

Header2: "2prefix"

Несколько пар кавычек не будут считаться совпадением.

Header2: ""2prefix""

## Сценарий 3 - Exists

Route3 требует лишь того, чтобы заголовок "Header3" существовал с любым непустым значением. Ниже приведён пример запроса, который совпадёт с route3.

Header3: value

Пустой заголовок не будет считаться совпадением.

Header3:

Этот режим поддерживает заголовки с несколькими значениями и несколько заголовков с одинаковым именем, поскольку не анализирует содержимое заголовка. Следующее будет считаться совпадением.

Header3: value1, value2

Header3: value1 Header3: value2

Header3: Header3:

## Сценарий 4 - Несколько заголовков

Route4 требует наличия одновременно header4 и header5, каждый из которых должен совпадать согласно своему указанному Mode. Следующие заголовки совпадут с route4:

Header4: value1 Header5: AnyValue

Header4: value2 Header5: AnyValue

Следующие не совпадут с route4, поскольку в них отсутствует один из обязательных заголовков:

Header4: value2

Header5: AnyValue

## Сценарий 5 - NotExists

Route7 требует, чтобы заголовок "Header7" отсутствовал. Следующие заголовки совпадут с route7:

NotHeader7: AnyValue

Следующие заголовки не совпадут с route7, поскольку заголовок "Header7" присутствует.

Header7: AnyValue

Header7: Note: The author created this article with assistance from AI. Learn more
