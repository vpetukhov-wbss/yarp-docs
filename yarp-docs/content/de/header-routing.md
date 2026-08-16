---
slug: header-routing
title: Header-basiertes Routing
lede: >-
  Proxyrouten, die in der Konfiguration oder über Code angegeben werden, müssen mindestens einen
  Pfad oder Host enthalten, gegen den abgeglichen
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-routing
lastUpdated: 2026-08-11
---

## Headerbasiertes Routing in YARP

Proxyrouten, die in der Konfiguration oder über Code angegeben werden, müssen mindestens einen Pfad oder Host enthalten, gegen den abgeglichen wird. Zusätzlich dazu kann eine Route auch einen oder mehrere Header angeben, die in der Anforderung vorhanden sein müssen.

## Rangfolge

Die Standardreihenfolge für die Routenübereinstimmung lautet

1. Pfad
1. Methode
1. Host
1. Header
1. Abfrageparameter

Das bedeutet, dass eine Route, die Methoden, aber keine Header angibt, vor einer Route übereinstimmt, die Header, aber keine Methoden angibt. Dies kann überschrieben werden, indem die Order-Eigenschaft einer Route festgelegt wird (siehe Beispiel bei den Konfigurationseigenschaften).

## Konfiguration

Header werden im Abschnitt „Match“ einer Proxyroute angegeben.

Wenn für eine Route mehrere Headerregeln angegeben werden, müssen alle übereinstimmen, damit die Route verwendet wird. Eine ODER-Logik muss entweder innerhalb einer Headerregel oder durch separate Routen umgesetzt werden.

Konfiguration:

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

## Vertrag

RouteHeader definiert den Code-Vertrag und wird aus der Konfiguration zugeordnet.

## Name

Der Headername, nach dem in der Anforderung gesucht wird. Ein nicht leerer Wert ist erforderlich. Dieses Feld unterscheidet gemäß den HTTP-RFCs nicht zwischen Groß- und Kleinschreibung.

## Values

Eine Liste möglicher Werte, nach denen gesucht wird. Der Header muss mindestens einem dieser Werte gemäß dem angegebenen Mode entsprechen – mit Ausnahme von „NotContains“. Mindestens ein Wert ist erforderlich, sofern Mode nicht auf Exists oder NotExists gesetzt ist.

## Mode

HeaderMatchMode gibt an, wie der Wert bzw. die Werte mit dem Anforderungsheader abgeglichen werden. Der Standardwert ist ExactHeader .

ExactHeader - Mindestens einer der Header mit dem angegebenen Namen muss vollständig übereinstimmen, abhängig vom Wert von IsCaseSensitive . Enthält ein Header mehrere Werte (getrennt durch , oder ; ), werden diese vor dem Abgleich aufgeteilt. Ein einzelnes Anführungszeichenpaar wird vor dem Abgleich ebenfalls vom Wert entfernt. HeaderPrefix - Mindestens einer der Header mit dem angegebenen Namen muss anhand eines Präfixes übereinstimmen, abhängig vom Wert von IsCaseSensitive . Enthält ein Header mehrere Werte (getrennt durch , oder ; ), werden diese vor dem Abgleich aufgeteilt. Ein einzelnes Anführungszeichenpaar wird vor dem Abgleich ebenfalls vom Wert entfernt. Exists - Der Header muss vorhanden sein und einen beliebigen nicht leeren Wert enthalten. Sind mehrere Header mit demselben Namen vorhanden, greift die Regel ebenfalls.

Contains - Mindestens einer der Header mit dem angegebenen Namen muss einen der Abgleichswerte enthalten,

abhängig vom Wert von IsCaseSensitive .

NotContains - Keiner der Header mit dem angegebenen Namen darf einen der Abgleichs-

werte enthalten, abhängig vom Wert von IsCaseSensitive .

## IsCaseSensitive

Gibt an, ob der Wertabgleich unter Berücksichtigung oder ohne Berücksichtigung der Groß-/Kleinschreibung erfolgen soll. Der Standardwert ist false , also ohne Berücksichtigung der Groß-/Kleinschreibung.

## Beispiele

Diese Beispiele verwenden die oben angegebene Konfiguration.

## Szenario 1 – Exakte Headerübereinstimmung

Eine Anforderung mit dem folgenden Header stimmt mit route1 überein.

Header1: Value1

Enthält ein Header mehrere Werte, wird jeder einzeln abgeglichen. Die folgende Anforderung stimmt überein.

Header1: Value1, Value2

Dasselbe gilt, wenn mehrere Werte auf mehrere Header mit demselben Namen verteilt sind.

Header1: Value1 Header1: Value2

Ein einzelnes umschließendes Anführungszeichenpaar kann vor dem Abgleich vom Wert entfernt werden. Die folgende Anforderung stimmt überein.

Header1: "Value1"

Mehrere Anführungszeichenpaare führen nicht zu einer Übereinstimmung.

Header1: ""Value1""

## Szenario 2 – Mehrere Werte

Route2 definiert mehrere Werte, nach denen in einem Header gesucht wird („1prefix“, „2prefix“) – jeder der Werte ist zulässig. Zudem wurde Mode als HeaderPrefix angegeben, sodass jeder Header zulässig ist, der mit diesen Werten beginnt. Jeder der folgenden Header stimmt mit route2 überein.

Header2: 1prefix

Header2: 2prefix

Header2: 1prefix-extra

Header2: 2prefix-extra

Enthält ein Header mehrere Werte, wird jeder einzeln abgeglichen. Die folgende Anforderung stimmt überein.

Header2: foo, 1prefix, 2prefix

Dasselbe gilt, wenn mehrere Werte auf mehrere Header mit demselben Namen verteilt sind.

Header2: 1prefix Header2: 2prefix

Ein einzelnes umschließendes Anführungszeichenpaar kann vor dem Abgleich vom Wert entfernt werden. Die folgende Anforderung stimmt überein.

Header2: "2prefix"

Mehrere Anführungszeichenpaare führen nicht zu einer Übereinstimmung.

Header2: ""2prefix""

## Szenario 3 – Exists

Route3 erfordert lediglich, dass der Header „Header3“ vorhanden ist und einen beliebigen nicht leeren Wert enthält. Das folgende Beispiel stimmt mit route3 überein.

Header3: value

Ein leerer Header führt zu keiner Übereinstimmung.

Header3:

Dieser Modus unterstützt Header mit mehreren Werten sowie mehrere Header mit demselben Namen, da der Headerinhalt nicht berücksichtigt wird. Das Folgende stimmt überein.

Header3: value1, value2

Header3: value1 Header3: value2

Header3: Header3:

## Szenario 4 – Mehrere Header

Route4 erfordert sowohl header4 als auch header5 , wobei jeder gemäß dem für ihn angegebenen Mode übereinstimmen muss. Die folgenden Header stimmen mit route4 überein:

Header4: value1 Header5: AnyValue

Header4: value2 Header5: AnyValue

Diese stimmen nicht mit route4 überein, da einer der erforderlichen Header fehlt:

Header4: value2

Header5: AnyValue

## Szenario 5 – NotExists

Route7 erfordert, dass der Header „Header7“ nicht vorhanden ist. Die folgenden Header stimmen mit route7 überein:

NotHeader7: AnyValue

Die folgenden Header stimmen nicht mit route7 überein, da der Header „Header7“ vorhanden ist.

Header7: AnyValue

Header7: Hinweis: Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
