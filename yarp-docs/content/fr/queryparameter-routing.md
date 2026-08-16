---
slug: queryparameter-routing
title: Routage par paramètre de requête
lede: >-
  Les routes du proxy définies dans la configuration ou par code doivent inclure au minimum un
  chemin ou un hôte à faire correspondre.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/queryparameter-routing
lastUpdated: 2026-08-11
---

## Routage YARP par paramètre de requête

Les routes du proxy définies dans la configuration ou par code doivent inclure au minimum un chemin ou un hôte à faire correspondre. En plus de ces critères, une route peut également spécifier un ou plusieurs paramètres de requête qui doivent être présents sur la requête.

## Priorité

L'ordre de priorité par défaut de correspondance des routes est le suivant : 1) chemin, 2) méthode, 3) hôte, 4) en-têtes, 5) paramètres de requête. Cela signifie qu'une route qui spécifie des méthodes mais pas de paramètres de requête correspondra avant une route qui spécifie des paramètres de requête mais pas de méthodes. Ce comportement peut être remplacé en définissant la propriété Order sur une route.

## Configuration

Les paramètres de requête sont spécifiés dans la section Match d'une route de proxy.

Si plusieurs règles de paramètre de requête sont spécifiées sur une route, elles doivent toutes correspondre pour que la route soit sélectionnée. Une logique OU doit être mise en œuvre soit au sein d'une même règle de paramètre de requête, soit via des routes distinctes.

Configuration :

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

## Contrat

RouteQueryParameter définit le contrat de code et est mappé à partir de la configuration.

## Name

Le nom du paramètre de requête à rechercher sur la requête. Une valeur non vide est requise. Ce champ n'est pas sensible à la casse.

## Values

Une liste de valeurs possibles à rechercher. Le paramètre de requête doit correspondre à au moins une de ces valeurs selon le Mode spécifié, sauf pour 'NotContains'. Au moins une valeur est requise, sauf si Mode est défini sur Exists .

## Mode

QueryParameterMatchMode spécifie comment comparer la ou les valeurs au paramètre de requête

de la requête. La valeur par défaut est Exact .

Exact - Le paramètre de requête doit correspondre intégralement, selon la valeur d'IsCaseSensitive . Seuls les paramètres de requête uniques sont pris en charge. S'il existe plusieurs paramètres de requête portant le même nom, la correspondance échoue. Prefix - Le paramètre de requête doit correspondre par préfixe, selon la valeur d'IsCaseSensitive . Seuls les paramètres de requête uniques sont pris en charge. S'il existe plusieurs paramètres de requête portant le même nom, la correspondance échoue. Exists - Le paramètre de requête doit exister et contenir une valeur non vide. Contains - Le paramètre de requête doit contenir la valeur pour qu'il y ait correspondance, selon la valeur d'IsCaseSensitive . Seuls les paramètres de requête uniques sont pris en charge. S'il existe plusieurs paramètres de requête portant le même nom, la correspondance échoue. NotContains - Le paramètre de requête ne doit contenir aucune des valeurs recherchées, selon la valeur d'IsCaseSensitive . Seuls les paramètres de requête uniques sont pris en charge. S'il existe plusieurs paramètres de requête portant le même nom, la correspondance échoue.

## IsCaseSensitive

Indique si la comparaison des valeurs doit être sensible ou non à la casse. La valeur par défaut est false , c'est-à-dire insensible à la casse.

## Encodage

La chaîne de requête est analysée puis décodée avant d'être comparée aux règles de la route.

"route8" : { "ClusterId": "cluster1", "Match": { "Path": "{**catch-all}", "QueryParameters": [ { "Name": "queryparam8", "Values": [ "another value" ], "Mode": "Exact" } ] }

Correspond à

?queryparam8=another%20value

ou

?queryparam8=another+value

## Exemples

Ces exemples utilisent la configuration spécifiée ci-dessus.

## Scénario 1 - Correspondance exacte de paramètre de requête

Une requête comportant le paramètre de requête suivant correspondra à route1.

?QueryParam1=Value1

Les paramètres de requête multiples portant le même nom ne sont actuellement pas pris en charge et ne correspondront pas.

?QueryParam1=Value1&QueryParam1=Value2

## Scénario 2 - Valeurs multiples

Route2 a défini plusieurs valeurs à rechercher dans un paramètre de requête ("1prefix", "2prefix") ; n'importe laquelle de ces valeurs est acceptable. Elle a également spécifié Mode comme Prefix , de sorte que tout paramètre de requête commençant par ces valeurs est acceptable. N'importe lequel des paramètres de requête suivants correspondra à route2.

?QueryParam2=1prefix

?QueryParam2=2prefix

?QueryParam2=1prefix-extra

?QueryParam2=2prefix-extra

Les paramètres de requête multiples portant le même nom ne sont actuellement pas pris en charge et ne correspondront pas.

?QueryParam2=2prefix&QueryParam2=1prefix

## Scénario 3 - Exists

Route3 exige uniquement que le paramètre de requête "QueryParam3" existe avec une valeur non vide. Voici un exemple qui correspondra à route3.

?QueryParam3=value

Un paramètre de requête vide ne correspondra pas.

?QueryParam3 ?QueryParam3=

Ce mode prend en charge les paramètres de requête à valeurs multiples ainsi que plusieurs paramètres de requête portant le même nom, car il n'examine pas le contenu du paramètre de requête. Ce qui suit correspondra.

?QueryParam3=value1&QueryParam3=value2

## Scénario 4 - Paramètres de requête multiples

Route4 exige à la fois QueryParam4 et QueryParam5 , chacun correspondant selon son Mode spécifié. Les paramètres de requête suivants correspondront à route4 :

?QueryParam4=value1&QueryParam5=AnyValue

?QueryParam4=value2&QueryParam5=AnyValue

Ceux-ci ne correspondront pas à route4 car il leur manque l'un des paramètres de requête requis :

?QueryParam4=value2

?QueryParam5=AnyValue Remarque : l'auteur a rédigé cet article avec l'aide de l'IA. En savoir plus
