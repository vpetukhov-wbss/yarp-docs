---
slug: queryparameter-routing
title: Roteamento por parâmetro de consulta
lede: >-
  As rotas de proxy especificadas na configuração ou via código devem incluir pelo menos um
  caminho ou host para corresponder
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/queryparameter-routing
lastUpdated: 2026-08-11
---

## Roteamento baseado em parâmetro de consulta do YARP

As rotas de proxy especificadas na configuração ou via código devem incluir pelo menos um caminho ou host para corresponder. Além disso, uma rota também pode especificar um ou mais parâmetros de consulta que devem estar presentes na requisição.

## Precedência

A ordem de precedência padrão de correspondência de rotas é 1) caminho, 2) método, 3) host, 4) cabeçalhos, 5) parâmetros de consulta. Isso significa que uma rota que especifica métodos e nenhum parâmetro de consulta terá correspondência antes de uma rota que especifica parâmetros de consulta e nenhum método. Isso pode ser sobrescrito definindo a propriedade Order em uma rota.

## Configuração

Os parâmetros de consulta são especificados na seção Match de uma rota de proxy.

Se várias regras de parâmetro de consulta forem especificadas em uma rota, todas devem corresponder para que a rota seja escolhida. A lógica OR deve ser implementada dentro de uma regra de parâmetro de consulta ou como rotas separadas.

Configuração:

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

RouteQueryParameter define o contrato de código e é mapeado a partir da configuração.

## Name

O nome do parâmetro de consulta a ser verificado na requisição. Um valor não vazio é obrigatório. Este campo não diferencia maiúsculas de minúsculas.

## Values

Uma lista de valores possíveis a serem procurados. O parâmetro de consulta deve corresponder a pelo menos um desses valores de acordo com o Mode especificado, exceto para o 'NotContains'. Pelo menos um valor é obrigatório, a menos que o Mode esteja definido como Exists .

## Mode

QueryParameterMatchMode especifica como corresponder o(s) valor(es) ao parâmetro de consulta

da requisição. O padrão é Exact .

Exact - O parâmetro de consulta deve corresponder por completo, conforme o valor de IsCaseSensitive . Apenas parâmetros de consulta únicos são suportados. Se houver múltiplos parâmetros de consulta com o mesmo nome, a correspondência falha. Prefix - O parâmetro de consulta deve corresponder por prefixo, conforme o valor de IsCaseSensitive . Apenas parâmetros de consulta únicos são suportados. Se houver múltiplos parâmetros de consulta com o mesmo nome, a correspondência falha. Exists - O parâmetro de consulta deve existir e conter qualquer valor não vazio. Contains - O parâmetro de consulta deve conter o valor para haver correspondência, conforme o valor de IsCaseSensitive . Apenas parâmetros de consulta únicos são suportados. Se houver múltiplos parâmetros de consulta com o mesmo nome, a correspondência falha. NotContains - O parâmetro de consulta não deve conter nenhum dos valores de correspondência, conforme o valor de IsCaseSensitive . Apenas parâmetros de consulta únicos são suportados. Se houver múltiplos parâmetros de consulta com o mesmo nome, a correspondência falha.

## IsCaseSensitive

Indica se a correspondência de valor deve ser feita diferenciando maiúsculas de minúsculas ou não. O padrão é false , ou seja, não diferencia.

## Encoding

A cadeia de consulta da requisição será analisada e decodificada antes da correspondência com as regras de rota.

"route8" : { "ClusterId": "cluster1", "Match": { "Path": "{**catch-all}", "QueryParameters": [ { "Name": "queryparam8", "Values": [ "another value" ], "Mode": "Exact" } ] }

Corresponde a

?queryparam8=another%20value

ou

?queryparam8=another+value

## Exemplos

Estes exemplos usam a configuração especificada acima.

## Cenário 1 - Correspondência exata de parâmetro de consulta

Uma requisição com o seguinte parâmetro de consulta corresponderá à route1.

?QueryParam1=Value1

Múltiplos parâmetros de consulta com o mesmo nome não são suportados atualmente e não corresponderão.

?QueryParam1=Value1&QueryParam1=Value2

## Cenário 2 - Múltiplos valores

A route2 definiu múltiplos valores para procurar em um parâmetro de consulta ("1prefix", "2prefix"), qualquer um dos valores é aceitável. Ela também especificou o Mode como Prefix , então qualquer parâmetro de consulta que comece com esses valores é aceitável. Qualquer um dos seguintes parâmetros de consulta corresponderá à route2.

?QueryParam2=1prefix

?QueryParam2=2prefix

?QueryParam2=1prefix-extra

?QueryParam2=2prefix-extra

Múltiplos parâmetros de consulta com o mesmo nome não são suportados atualmente e não corresponderão.

?QueryParam2=2prefix&QueryParam2=1prefix

## Cenário 3 - Exists

A route3 exige apenas que o parâmetro de consulta "QueryParam3" exista com qualquer valor não vazio. O exemplo a seguir corresponderá à route3.

?QueryParam3=value

Um parâmetro de consulta vazio não corresponderá.

?QueryParam3 ?QueryParam3=

Este modo suporta parâmetros de consulta com múltiplos valores e múltiplos parâmetros de consulta com o mesmo nome, já que não observa o conteúdo do parâmetro de consulta. Os seguintes corresponderão.

?QueryParam3=value1&QueryParam3=value2

## Cenário 4 - Múltiplos parâmetros de consulta

A route4 exige tanto QueryParam4 quanto QueryParam5 , cada um correspondendo de acordo com seu Mode especificado. Os seguintes parâmetros de consulta corresponderão à route4:

?QueryParam4=value1&QueryParam5=AnyValue

?QueryParam4=value2&QueryParam5=AnyValue

Estes não corresponderão à route4 porque falta um dos parâmetros de consulta exigidos:

?QueryParam4=value2

?QueryParam5=AnyValue Nota: o autor criou este artigo com o auxílio de IA. Saiba mais
