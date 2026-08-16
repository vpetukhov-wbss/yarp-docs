---
slug: header-routing
title: Roteamento baseado em cabeçalho
lede: >-
  As rotas de proxy especificadas na configuração ou via código devem incluir pelo menos um
  caminho ou host para corresponder
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-routing
lastUpdated: 2026-08-11
---

## Roteamento baseado em cabeçalho do YARP

As rotas de proxy especificadas na configuração ou via código devem incluir pelo menos um caminho ou host para corresponder. Além disso, uma rota também pode especificar um ou mais cabeçalhos que devem estar presentes na requisição.

## Precedência

A ordem de precedência padrão de correspondência de rotas é

1. caminho
1. método
1. host
1. cabeçalhos
1. parâmetros de consulta

Isso significa que uma rota que especifica métodos e nenhum cabeçalho terá correspondência antes de uma rota que especifica cabeçalhos e nenhum método. Isso pode ser sobrescrito definindo a propriedade Order em uma rota (veja o exemplo nas propriedades de configuração).

## Configuração

Os cabeçalhos são especificados na seção Match de uma rota de proxy.

Se várias regras de cabeçalho forem especificadas em uma rota, todas devem corresponder para que a rota seja escolhida. A lógica OR deve ser implementada dentro de uma regra de cabeçalho ou como rotas separadas.

Configuração:

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

RouteHeader define o contrato de código e é mapeado a partir da configuração.

## Name

O nome do cabeçalho a ser verificado na requisição. Um valor não vazio é obrigatório. Este campo não diferencia maiúsculas de minúsculas, conforme os RFCs de HTTP.

## Values

Uma lista de valores possíveis a serem procurados. O cabeçalho deve corresponder a pelo menos um desses valores de acordo com o Mode especificado, exceto para o 'NotContains'. Pelo menos um valor é obrigatório, a menos que o Mode esteja definido como Exists ou NotExists .

## Mode

HeaderMatchMode especifica como corresponder o(s) valor(es) ao cabeçalho da requisição. O padrão é ExactHeader .

ExactHeader - Qualquer um dos cabeçalhos com o nome informado deve corresponder por completo, conforme o valor de IsCaseSensitive . Se um cabeçalho contiver múltiplos valores (separados por , ou ; ), eles são divididos antes da correspondência. Um único par de aspas também é removido do valor antes da correspondência. HeaderPrefix - Qualquer um dos cabeçalhos com o nome informado deve corresponder por prefixo, conforme o valor de IsCaseSensitive . Se um cabeçalho contiver múltiplos valores (separados por , ou ; ), eles são divididos antes da correspondência. Um único par de aspas também é removido do valor antes da correspondência. Exists - O cabeçalho deve existir e conter qualquer valor não vazio. Se houver múltiplos cabeçalhos com o mesmo nome, a regra também corresponderá.

Contains - Qualquer um dos cabeçalhos com o nome informado deve conter algum dos valores de correspondência,

conforme o valor de IsCaseSensitive .

NotContains - Nenhum dos cabeçalhos com o nome informado pode conter algum dos valores de correspondência,

conforme o valor de IsCaseSensitive .

## IsCaseSensitive

Indica se a correspondência de valor deve ser feita diferenciando maiúsculas de minúsculas ou não. O padrão é false , ou seja, não diferencia.

## Exemplos

Estes exemplos usam a configuração especificada acima.

## Cenário 1 - Correspondência exata de cabeçalho

Uma requisição com o seguinte cabeçalho corresponderá à route1.

Header1: Value1

Se um cabeçalho contiver múltiplos valores, cada um será correspondido separadamente. A seguinte requisição corresponderá.

Header1: Value1, Value2

O mesmo vale se os múltiplos valores estiverem divididos entre múltiplos cabeçalhos com o mesmo nome.

Header1: Value1 Header1: Value2

Um único par de aspas que envolve o valor pode ser removido antes da correspondência. A seguinte requisição corresponderá.

Header1: "Value1"

Múltiplos pares de aspas não corresponderão.

Header1: ""Value1""

## Cenário 2 - Múltiplos valores

A route2 definiu múltiplos valores para procurar em um cabeçalho ("1prefix", "2prefix"), qualquer um dos valores é aceitável. Ela também especificou o Mode como HeaderPrefix , então qualquer cabeçalho que comece com esses valores é aceitável. Qualquer um dos seguintes cabeçalhos corresponderá à route2.

Header2: 1prefix

Header2: 2prefix

Header2: 1prefix-extra

Header2: 2prefix-extra

Se um cabeçalho contiver múltiplos valores, cada um será correspondido separadamente. A seguinte requisição corresponderá.

Header2: foo, 1prefix, 2prefix

O mesmo vale se os múltiplos valores estiverem divididos entre múltiplos cabeçalhos com o mesmo nome.

Header2: 1prefix Header2: 2prefix

Um único par de aspas que envolve o valor pode ser removido antes da correspondência. A seguinte requisição corresponderá.

Header2: "2prefix"

Múltiplos pares de aspas não corresponderão.

Header2: ""2prefix""

## Cenário 3 - Exists

A route3 exige apenas que o cabeçalho "Header3" exista com qualquer valor não vazio. O exemplo a seguir corresponderá à route3.

Header3: value

Um cabeçalho vazio não corresponderá.

Header3:

Este modo suporta cabeçalhos com múltiplos valores e múltiplos cabeçalhos com o mesmo nome, já que não observa o conteúdo do cabeçalho. Os seguintes corresponderão.

Header3: value1, value2

Header3: value1 Header3: value2

Header3: Header3:

## Cenário 4 - Múltiplos cabeçalhos

A route4 exige tanto header4 quanto header5 , cada um correspondendo de acordo com seu Mode especificado. Os seguintes cabeçalhos corresponderão à route4:

Header4: value1 Header5: AnyValue

Header4: value2 Header5: AnyValue

Estes não corresponderão à route4 porque falta um dos cabeçalhos exigidos:

Header4: value2

Header5: AnyValue

## Cenário 5 - NotExists

A route7 exige que o cabeçalho "Header7" não exista. Os seguintes cabeçalhos corresponderão à route7:

NotHeader7: AnyValue

Os seguintes cabeçalhos não corresponderão à route7 porque o cabeçalho "Header7" existe.

Header7: AnyValue

Header7: Nota: o autor criou este artigo com o auxílio de IA. Saiba mais
