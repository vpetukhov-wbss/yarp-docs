---
slug: queryparameter-routing
title: Enrutamiento por parámetros de consulta
lede: >-
  Las rutas de proxy especificadas en la configuración o mediante código deben incluir, como
  mínimo, una ruta de acceso o un host con los que coincidir
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/queryparameter-routing
lastUpdated: 2026-08-11
---

## Enrutamiento de YARP basado en parámetros de consulta

Las rutas de proxy especificadas en la configuración o mediante código deben incluir, como mínimo, una ruta de acceso o un host con los que coincidir. Además de estos, una ruta también puede especificar uno o más parámetros de consulta que deben estar presentes en la solicitud.

## Precedencia

El orden de precedencia predeterminado para la coincidencia de rutas es: 1) ruta de acceso, 2) método, 3) host, 4) encabezados, 5) parámetros de consulta. Esto significa que una ruta que especifica métodos y ningún parámetro de consulta coincidirá antes que una ruta que especifica parámetros de consulta y ningún método. Este comportamiento se puede invalidar estableciendo la propiedad Order en una ruta.

## Configuración

Los parámetros de consulta se especifican en la sección Match de una ruta de proxy.

Si se especifican varias reglas de parámetro de consulta en una ruta, todas deben coincidir para que se tome esa ruta. La lógica OR debe implementarse dentro de una regla de parámetro de consulta o bien mediante rutas independientes.

Configuración:

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

## Contrato

RouteQueryParameter define el contrato de código y se asigna a partir de la configuración.

## Name

El nombre del parámetro de consulta que se debe comprobar en la solicitud. Se requiere un valor no vacío. Este campo no distingue mayúsculas de minúsculas.

## Values

Una lista de valores posibles que se deben buscar. El parámetro de consulta debe coincidir con al menos uno de estos valores según el Mode especificado, excepto en el caso de 'NotContains'. Se requiere al menos un valor a menos que Mode esté establecido en Exists.

## Mode

QueryParameterMatchMode especifica cómo comparar los valores con el parámetro de consulta de la

solicitud. El valor predeterminado es Exact.

Exact - El parámetro de consulta debe coincidir en su totalidad, según el valor de IsCaseSensitive. Solo se admiten parámetros de consulta individuales. Si hay varios parámetros de consulta con el mismo nombre, la coincidencia falla. Prefix - El parámetro de consulta debe coincidir por prefijo, según el valor de IsCaseSensitive. Solo se admiten parámetros de consulta individuales. Si hay varios parámetros de consulta con el mismo nombre, la coincidencia falla. Exists - El parámetro de consulta debe existir y contener cualquier valor no vacío. Contains - El parámetro de consulta debe contener el valor para que haya coincidencia, según el valor de IsCaseSensitive. Solo se admiten parámetros de consulta individuales. Si hay varios parámetros de consulta con el mismo nombre, la coincidencia falla. NotContains - El parámetro de consulta no debe contener ninguno de los valores de coincidencia, según el valor de IsCaseSensitive. Solo se admiten parámetros de consulta individuales. Si hay varios parámetros de consulta con el mismo nombre, la coincidencia falla.

## IsCaseSensitive

Indica si la comparación de valores debe distinguir mayúsculas de minúsculas o no. El valor predeterminado es false, sin distinción.

## Encoding

La cadena de consulta de la solicitud se analiza y se decodifica antes de compararla con las reglas de la ruta.

"route8" : { "ClusterId": "cluster1", "Match": { "Path": "{**catch-all}", "QueryParameters": [ { "Name": "queryparam8", "Values": [ "another value" ], "Mode": "Exact" } ] }

Coincide con

?queryparam8=another%20value

o

?queryparam8=another+value

## Ejemplos

Estos ejemplos usan la configuración especificada anteriormente.

## Escenario 1: coincidencia exacta de parámetro de consulta

Una solicitud con el siguiente parámetro de consulta coincidirá con route1.

?QueryParam1=Value1

Varios parámetros de consulta con el mismo nombre no se admiten actualmente y no coincidirán.

?QueryParam1=Value1&QueryParam1=Value2

## Escenario 2: varios valores

Route2 definió varios valores para buscar en un parámetro de consulta ("1prefix", "2prefix"); cualquiera de esos valores es aceptable. También especificó Mode como Prefix, de modo que cualquier parámetro de consulta que comience con esos valores es aceptable. Cualquiera de los siguientes parámetros de consulta coincidirá con route2.

?QueryParam2=1prefix

?QueryParam2=2prefix

?QueryParam2=1prefix-extra

?QueryParam2=2prefix-extra

Varios parámetros de consulta con el mismo nombre no se admiten actualmente y no coincidirán.

?QueryParam2=2prefix&QueryParam2=1prefix

## Escenario 3: Exists

route3 solo requiere que el parámetro de consulta "QueryParam3" exista con cualquier valor no vacío. El siguiente es un ejemplo que coincidirá con route3.

?QueryParam3=value

Un parámetro de consulta vacío no coincidirá.

?QueryParam3 ?QueryParam3=

Este modo sí admite parámetros de consulta con varios valores y varios parámetros de consulta con el mismo nombre, ya que no examina el contenido del parámetro de consulta. Lo siguiente coincidirá.

?QueryParam3=value1&QueryParam3=value2

## Escenario 4: varios QueryParameters

route4 exige tanto QueryParam4 como QueryParam5, cada uno con la coincidencia correspondiente a su Mode. Los siguientes parámetros de consulta coincidirán con route4:

?QueryParam4=value1&QueryParam5=AnyValue

?QueryParam4=value2&QueryParam5=AnyValue

Los siguientes no coincidirán con route4 porque falta uno de los parámetros de consulta obligatorios:

?QueryParam4=value2

?QueryParam5=AnyValue Nota: el autor creó este artículo con la ayuda de inteligencia artificial. Más información
