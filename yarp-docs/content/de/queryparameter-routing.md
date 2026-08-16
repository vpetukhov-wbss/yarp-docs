---
slug: queryparameter-routing
title: Routing über Abfrageparameter
lede: >-
  Proxyrouten, die in der Konfiguration oder über Code angegeben werden, müssen mindestens einen
  Pfad oder Host enthalten, gegen den abgeglichen
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/queryparameter-routing
lastUpdated: 2026-08-11
---

## Abfrageparameterbasiertes Routing in YARP

Proxyrouten, die in der Konfiguration oder über Code angegeben werden, müssen mindestens einen Pfad oder Host enthalten, gegen den abgeglichen wird. Zusätzlich dazu kann eine Route auch einen oder mehrere Abfrageparameter angeben, die in der Anforderung vorhanden sein müssen.

## Rangfolge

Die Standardreihenfolge für die Routenübereinstimmung lautet 1) Pfad, 2) Methode, 3) Host, 4) Header, 5) Abfrageparameter. Das bedeutet, dass eine Route, die Methoden, aber keine Abfrageparameter angibt, vor einer Route übereinstimmt, die Abfrageparameter, aber keine Methoden angibt. Dies kann überschrieben werden, indem die Order-Eigenschaft einer Route festgelegt wird.

## Konfiguration

Abfrageparameter werden im Abschnitt „Match“ einer Proxyroute angegeben.

Wenn für eine Route mehrere Abfrageparameterregeln angegeben werden, müssen alle übereinstimmen, damit die Route verwendet wird. Eine ODER-Logik muss entweder innerhalb einer Abfrageparameterregel oder durch separate Routen umgesetzt werden.

Konfiguration:

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

## Vertrag

RouteQueryParameter definiert den Code-Vertrag und wird aus der Konfiguration zugeordnet.

## Name

Der Name des Abfrageparameters, nach dem in der Anforderung gesucht wird. Ein nicht leerer Wert ist erforderlich. Dieses Feld unterscheidet nicht zwischen Groß- und Kleinschreibung.

## Values

Eine Liste möglicher Werte, nach denen gesucht wird. Der Abfrageparameter muss mindestens einem dieser Werte gemäß dem angegebenen Mode entsprechen – mit Ausnahme von „NotContains“. Mindestens ein Wert ist erforderlich, sofern Mode nicht auf Exists gesetzt ist.

## Mode

QueryParameterMatchMode gibt an, wie der Wert bzw. die Werte mit dem Abfrageparameter der Anforderung

abgeglichen werden. Der Standardwert ist Exact .

Exact - Der Abfrageparameter muss vollständig übereinstimmen, abhängig vom Wert von IsCaseSensitive . Es werden nur einzelne Abfrageparameter unterstützt. Sind mehrere Abfrageparameter mit demselben Namen vorhanden, schlägt der Abgleich fehl. Prefix - Der Abfrageparameter muss anhand eines Präfixes übereinstimmen, abhängig vom Wert von IsCaseSensitive . Es werden nur einzelne Abfrageparameter unterstützt. Sind mehrere Abfrageparameter mit demselben Namen vorhanden, schlägt der Abgleich fehl. Exists - Der Abfrageparameter muss vorhanden sein und einen beliebigen nicht leeren Wert enthalten. Contains - Der Abfrageparameter muss den Wert für eine Übereinstimmung enthalten, abhängig vom Wert von IsCaseSensitive . Es werden nur einzelne Abfrageparameter unterstützt. Sind mehrere Abfrageparameter mit demselben Namen vorhanden, schlägt der Abgleich fehl. NotContains - Der Abfrageparameter darf keinen der Abgleichswerte enthalten, abhängig vom Wert von IsCaseSensitive . Es werden nur einzelne Abfrageparameter unterstützt. Sind mehrere Abfrageparameter mit demselben Namen vorhanden, schlägt der Abgleich fehl.

## IsCaseSensitive

Gibt an, ob der Wertabgleich unter Berücksichtigung oder ohne Berücksichtigung der Groß-/Kleinschreibung erfolgen soll. Der Standardwert ist false , also ohne Berücksichtigung der Groß-/Kleinschreibung.

## Codierung

Die Abfragezeichenfolge der Anforderung wird geparst und decodiert, bevor sie mit den Routenregeln abgeglichen wird.

"route8" : { "ClusterId": "cluster1", "Match": { "Path": "{**catch-all}", "QueryParameters": [ { "Name": "queryparam8", "Values": [ "another value" ], "Mode": "Exact" } ] }

Übereinstimmung mit

?queryparam8=another%20value

oder

?queryparam8=another+value

## Beispiele

Diese Beispiele verwenden die oben angegebene Konfiguration.

## Szenario 1 – Exakte Abfrageparameterübereinstimmung

Eine Anforderung mit dem folgenden Abfrageparameter stimmt mit route1 überein.

?QueryParam1=Value1

Mehrere Abfrageparameter mit demselben Namen werden derzeit nicht unterstützt und führen zu keiner Übereinstimmung.

?QueryParam1=Value1&QueryParam1=Value2

## Szenario 2 – Mehrere Werte

Route2 definiert mehrere Werte, nach denen in einem Abfrageparameter gesucht wird („1prefix“, „2prefix“) – jeder der Werte ist zulässig. Zudem wurde Mode als Prefix angegeben, sodass jeder Abfrageparameter zulässig ist, der mit diesen Werten beginnt. Jeder der folgenden Abfrageparameter stimmt mit route2 überein.

?QueryParam2=1prefix

?QueryParam2=2prefix

?QueryParam2=1prefix-extra

?QueryParam2=2prefix-extra

Mehrere Abfrageparameter mit demselben Namen werden derzeit nicht unterstützt und führen zu keiner Übereinstimmung.

?QueryParam2=2prefix&QueryParam2=1prefix

## Szenario 3 – Exists

Route3 erfordert lediglich, dass der Abfrageparameter „QueryParam3“ vorhanden ist und einen beliebigen nicht leeren Wert enthält. Das folgende Beispiel stimmt mit route3 überein.

?QueryParam3=value

Ein leerer Abfrageparameter führt zu keiner Übereinstimmung.

?QueryParam3 ?QueryParam3=

Dieser Modus unterstützt Abfrageparameter mit mehreren Werten sowie mehrere Abfrageparameter mit demselben Namen, da der Inhalt des Abfrageparameters nicht berücksichtigt wird. Das Folgende stimmt überein.

?QueryParam3=value1&QueryParam3=value2

## Szenario 4 – Mehrere Abfrageparameter

Route4 erfordert sowohl QueryParam4 als auch QueryParam5 , wobei jeder gemäß dem für ihn angegebenen Mode übereinstimmen muss. Die folgenden Abfrageparameter stimmen mit route4 überein:

?QueryParam4=value1&QueryParam5=AnyValue

?QueryParam4=value2&QueryParam5=AnyValue

Diese stimmen nicht mit route4 überein, da einer der erforderlichen Abfrageparameter fehlt:

?QueryParam4=value2

?QueryParam5=AnyValue Hinweis: Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
