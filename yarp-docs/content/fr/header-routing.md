---
slug: header-routing
title: Routage basé sur les en-têtes
lede: >-
  Les routes du proxy définies dans la configuration ou par code doivent inclure au minimum un
  chemin ou un hôte à faire correspondre.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-routing
lastUpdated: 2026-08-11
---

## Routage YARP basé sur les en-têtes

Les routes du proxy définies dans la configuration ou par code doivent inclure au minimum un chemin ou un hôte à faire correspondre. En plus de ces critères, une route peut également spécifier un ou plusieurs en-têtes qui doivent être présents sur la requête.

## Priorité

L'ordre de priorité par défaut de correspondance des routes est le suivant :

1. chemin
1. méthode
1. hôte
1. en-têtes
1. paramètres de requête

Cela signifie qu'une route qui spécifie des méthodes mais pas d'en-têtes correspondra avant une route qui spécifie des en-têtes mais pas de méthodes. Ce comportement peut être remplacé en définissant la propriété Order sur une route (voir l'exemple dans les propriétés de configuration).

## Configuration

Les en-têtes sont spécifiés dans la section Match d'une route de proxy.

Si plusieurs règles d'en-têtes sont spécifiées sur une route, elles doivent toutes correspondre pour que la route soit sélectionnée. Une logique OU doit être mise en œuvre soit au sein d'une même règle d'en-tête, soit via des routes distinctes.

Configuration :

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

## Contrat

RouteHeader définit le contrat de code et est mappé à partir de la configuration.

## Name

Le nom de l'en-tête à rechercher sur la requête. Une valeur non vide est requise. Ce champ n'est pas sensible à la casse, conformément aux RFC HTTP.

## Values

Une liste de valeurs possibles à rechercher. L'en-tête doit correspondre à au moins une de ces valeurs selon le Mode spécifié, sauf pour 'NotContains'. Au moins une valeur est requise, sauf si Mode est défini sur Exists ou NotExists .

## Mode

HeaderMatchMode spécifie comment comparer la ou les valeurs à l'en-tête de la requête. La valeur par défaut est ExactHeader .

ExactHeader - L'un au moins des en-têtes portant le nom donné doit correspondre intégralement, selon la valeur d'IsCaseSensitive . Si un en-tête contient plusieurs valeurs (séparées par , ou ; ), elles sont scindées avant la comparaison. Une éventuelle paire d'apostrophes entourant la valeur est également retirée avant la comparaison. HeaderPrefix - L'un au moins des en-têtes portant le nom donné doit correspondre par préfixe, selon la valeur d'IsCaseSensitive . Si un en-tête contient plusieurs valeurs (séparées par , ou ; ), elles sont scindées avant la comparaison. Une éventuelle paire d'apostrophes entourant la valeur est également retirée avant la comparaison. Exists - L'en-tête doit exister et contenir une valeur non vide. S'il existe plusieurs en-têtes portant le même nom, la règle correspond également.

Contains - L'un au moins des en-têtes portant le nom donné doit contenir l'une des valeurs recherchées,

selon la valeur d'IsCaseSensitive .

NotContains - Aucun des en-têtes portant le nom donné ne doit contenir l'une des

valeurs recherchées, selon la valeur d'IsCaseSensitive .

## IsCaseSensitive

Indique si la comparaison des valeurs doit être sensible ou non à la casse. La valeur par défaut est false , c'est-à-dire insensible à la casse.

## Exemples

Ces exemples utilisent la configuration spécifiée ci-dessus.

## Scénario 1 - Correspondance exacte d'en-tête

Une requête comportant l'en-tête suivant correspondra à route1.

Header1: Value1

Si un en-tête contient plusieurs valeurs, chacune est comparée séparément. La requête suivante correspondra.

Header1: Value1, Value2

Il en va de même si plusieurs valeurs sont réparties entre plusieurs en-têtes portant le même nom.

Header1: Value1 Header1: Value2

Une éventuelle paire d'apostrophes entourant la valeur peut être retirée avant la comparaison. La requête suivante correspondra.

Header1: "Value1"

Plusieurs paires d'apostrophes ne correspondront pas.

Header1: ""Value1""

## Scénario 2 - Valeurs multiples

Route2 a défini plusieurs valeurs à rechercher dans un en-tête ("1prefix", "2prefix") ; n'importe laquelle de ces valeurs est acceptable. Elle a également spécifié Mode comme HeaderPrefix , de sorte que tout en-tête commençant par ces valeurs est acceptable. N'importe lequel des en-têtes suivants correspondra à route2.

Header2: 1prefix

Header2: 2prefix

Header2: 1prefix-extra

Header2: 2prefix-extra

Si un en-tête contient plusieurs valeurs, chacune est comparée séparément. La requête suivante correspondra.

Header2: foo, 1prefix, 2prefix

Il en va de même si plusieurs valeurs sont réparties entre plusieurs en-têtes portant le même nom.

Header2: 1prefix Header2: 2prefix

Une éventuelle paire d'apostrophes entourant la valeur peut être retirée avant la comparaison. La requête suivante correspondra.

Header2: "2prefix"

Plusieurs paires d'apostrophes ne correspondront pas.

Header2: ""2prefix""

## Scénario 3 - Exists

Route3 exige uniquement que l'en-tête "Header3" existe avec une valeur non vide. Voici un exemple qui correspondra à route3.

Header3: value

Un en-tête vide ne correspondra pas.

Header3:

Ce mode prend en charge les en-têtes à valeurs multiples ainsi que plusieurs en-têtes portant le même nom, car il n'examine pas le contenu de l'en-tête. Ce qui suit correspondra.

Header3: value1, value2

Header3: value1 Header3: value2

Header3: Header3:

## Scénario 4 - En-têtes multiples

Route4 exige à la fois header4 et header5 , chacun correspondant selon son Mode spécifié. Les en-têtes suivants correspondront à route4 :

Header4: value1 Header5: AnyValue

Header4: value2 Header5: AnyValue

Ceux-ci ne correspondront pas à route4 car il leur manque l'un des en-têtes requis :

Header4: value2

Header5: AnyValue

## Scénario 5 - NotExists

Route7 exige que l'en-tête "Header7" n'existe pas. Les en-têtes suivants correspondront à route7 :

NotHeader7: AnyValue

Les en-têtes suivants ne correspondront pas à route7 car l'en-tête "Header7" existe.

Header7: AnyValue

Header7: Remarque : l'auteur a rédigé cet article avec l'aide de l'IA. En savoir plus
