---
slug: header-routing
title: Enrutamiento basado en encabezados
lede: >-
  Las rutas de proxy especificadas en la configuración o mediante código deben incluir, como
  mínimo, una ruta de acceso o un host con los que coincidir
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-routing
lastUpdated: 2026-08-11
---

## Enrutamiento de YARP basado en encabezados

Las rutas de proxy especificadas en la configuración o mediante código deben incluir, como mínimo, una ruta de acceso o un host con los que coincidir. Además de estos, una ruta también puede especificar uno o más encabezados que deben estar presentes en la solicitud.

## Precedencia

El orden de precedencia predeterminado para la coincidencia de rutas es el siguiente

1. ruta de acceso
1. método
1. host
1. encabezados
1. parámetros de consulta

Esto significa que una ruta que especifica métodos y ningún encabezado coincidirá antes que una ruta que especifica encabezados y ningún método. Este comportamiento se puede invalidar estableciendo la propiedad Order en una ruta (véase el ejemplo en las propiedades de configuración).

## Configuración

Los encabezados se especifican en la sección Match de una ruta de proxy.

Si se especifican varias reglas de encabezado en una ruta, todas deben coincidir para que se tome esa ruta. La lógica OR debe implementarse dentro de una regla de encabezado o bien mediante rutas independientes.

Configuración:

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

## Contrato

RouteHeader define el contrato de código y se asigna a partir de la configuración.

## Name

El nombre del encabezado que se debe comprobar en la solicitud. Se requiere un valor no vacío. Este campo no distingue mayúsculas de minúsculas, conforme a las RFC de HTTP.

## Values

Una lista de valores posibles que se deben buscar. El encabezado debe coincidir con al menos uno de estos valores según el Mode especificado, excepto en el caso de 'NotContains'. Se requiere al menos un valor a menos que Mode esté establecido en Exists o NotExists.

## Mode

HeaderMatchMode especifica cómo comparar los valores con el encabezado de la solicitud. El valor predeterminado es ExactHeader.

ExactHeader - Cualquiera de los encabezados con el nombre indicado debe coincidir en su totalidad, según el valor de IsCaseSensitive. Si un encabezado contiene varios valores (separados por , o ;), se dividen antes de la comparación. Además, se quita del valor un único par de comillas antes de compararlo. HeaderPrefix - Cualquiera de los encabezados con el nombre indicado debe coincidir por prefijo, según el valor de IsCaseSensitive. Si un encabezado contiene varios valores (separados por , o ;), se dividen antes de la comparación. Además, se quita del valor un único par de comillas antes de compararlo. Exists - El encabezado debe existir y contener cualquier valor no vacío. Si hay varios encabezados con el mismo nombre, la regla también coincide.

Contains - Cualquiera de los encabezados con el nombre indicado debe contener alguno de los valores de coincidencia,

según el valor de IsCaseSensitive.

NotContains - Ninguno de los encabezados con el nombre indicado puede contener alguno de los valores de

coincidencia, según el valor de IsCaseSensitive.

## IsCaseSensitive

Indica si la comparación de valores debe distinguir mayúsculas de minúsculas o no. El valor predeterminado es false, sin distinción.

## Ejemplos

Estos ejemplos usan la configuración especificada anteriormente.

## Escenario 1: coincidencia exacta de encabezado

Una solicitud con el siguiente encabezado coincidirá con route1.

Header1: Value1

Si un encabezado contiene varios valores, cada uno se compara por separado. La siguiente solicitud coincidirá.

Header1: Value1, Value2

Lo mismo ocurre si los valores se reparten entre varios encabezados con el mismo nombre.

Header1: Value1 Header1: Value2

Se puede quitar un único par de comillas que rodeen el valor antes de compararlo. La siguiente solicitud coincidirá.

Header1: "Value1"

Varios pares de comillas no coincidirán.

Header1: ""Value1""

## Escenario 2: varios valores

Route2 definió varios valores para buscar en un encabezado ("1prefix", "2prefix"); cualquiera de esos valores es aceptable. También especificó Mode como HeaderPrefix, de modo que cualquier encabezado que comience con esos valores es aceptable. Cualquiera de los siguientes encabezados coincidirá con route2.

Header2: 1prefix

Header2: 2prefix

Header2: 1prefix-extra

Header2: 2prefix-extra

Si un encabezado contiene varios valores, cada uno se compara por separado. La siguiente solicitud coincidirá.

Header2: foo, 1prefix, 2prefix

Lo mismo ocurre si los valores se reparten entre varios encabezados con el mismo nombre.

Header2: 1prefix Header2: 2prefix

Se puede quitar un único par de comillas que rodeen el valor antes de compararlo. La siguiente solicitud coincidirá.

Header2: "2prefix"

Varios pares de comillas no coincidirán.

Header2: ""2prefix""

## Escenario 3: Exists

route3 solo requiere que el encabezado "Header3" exista con cualquier valor no vacío. El siguiente es un ejemplo que coincidirá con route3.

Header3: value

Un encabezado vacío no coincidirá.

Header3:

Este modo sí admite encabezados con varios valores y varios encabezados con el mismo nombre, ya que no examina el contenido del encabezado. Lo siguiente coincidirá.

Header3: value1, value2

Header3: value1 Header3: value2

Header3: Header3:

## Escenario 4: varios encabezados

route4 exige tanto header4 como header5, cada uno con la coincidencia correspondiente a su Mode. Los siguientes encabezados coincidirán con route4:

Header4: value1 Header5: AnyValue

Header4: value2 Header5: AnyValue

Los siguientes no coincidirán con route4 porque falta uno de los encabezados obligatorios:

Header4: value2

Header5: AnyValue

## Escenario 5: NotExists

route7 exige que el encabezado "Header7" no exista. Los siguientes encabezados coincidirán con route7:

NotHeader7: AnyValue

Los siguientes encabezados no coincidirán con route7 porque el encabezado "Header7" existe.

Header7: AnyValue

Header7: Nota: el autor creó este artículo con la ayuda de inteligencia artificial. Más información
