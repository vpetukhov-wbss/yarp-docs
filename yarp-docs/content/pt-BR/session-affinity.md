---
slug: session-affinity
title: Afinidade de sessão
lede: >-
  A afinidade de sessão é um mecanismo para vincular (afinizar) uma sequência de requisições
  causalmente relacionadas ao
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/session-affinity
lastUpdated: 2026-08-11
---

## Conceito

A afinidade de sessão é um mecanismo para vincular (afinizar) uma sequência de requisições causalmente relacionadas ao destino que atendeu à primeira requisição quando a carga é balanceada entre vários destinos. É útil em cenários em que a maioria das requisições de uma sequência trabalha com os mesmos dados e o custo de acesso aos dados difere entre os diferentes nós (destinos) que atendem às requisições. O exemplo mais comum é um cache transitório (por exemplo, em memória), em que a primeira requisição busca os dados de um armazenamento persistente mais lento para um cache local rápido e as demais trabalham apenas com os dados em cache, aumentando assim a taxa de transferência.

## Configuração

## Registro de serviços e middleware

Os serviços de afinidade de sessão são registrados automaticamente no contêiner de DI por AddReverseProxy() . O middleware UseSessionAffinity() é incluído por padrão no método MapReverseProxy sem parâmetros. Se você estiver personalizando o pipeline do proxy, coloque esse middleware antes de adicionar UseLoadBalancing() .

Exemplo:

```csharp
   app.MapReverseProxy(proxyPipeline =>
   {
          proxyPipeline.UseSessionAffinity();
          proxyPipeline.UseLoadBalancing();
   });
Note Some session affinity implementations depend on Data Protection, which will require
additional configuration for scenarios like multiple proxy instances. See Key Protection for
details.
```

## Configuração de cluster

A afinidade de sessão é configurada por cluster de acordo com o seguinte esquema de configuração.

```json
"ReverseProxy": {
   "Clusters": {
      "<cluster-name>": {
         "SessionAffinity": {
             "Enabled": "(true|false)", // defaults to 'false'
             "Policy": "(HashCookie|ArrCookie|Cookie|CustomHeader)", // defaults to
'HashCookie'
             "FailurePolicy": "(Redistribute|Return503Error)", // defaults to
'Redistribute'
             "AffinityKeyName": "Key1",
             "Cookie": {
                "Domain": "localhost",
                "Expiration": "03:00:00",
                "HttpOnly": true,
                "IsEssential": true,
                "MaxAge": "1.00:00:00",
                "Path": "mypath",
                "SameSite": "Strict",
                "SecurePolicy": "Always"
             }
         }
      }
   }
}
```

## Configuração de cookie

Os atributos para configurar o cookie usado com as políticas HashCookie, ArrCookie e Cookie podem ser configurados usando SessionAffinityCookieConfig . As propriedades podem ser definidas na configuração JSON, como mostrado acima, ou em código, como mostrado abaixo:

```csharp
new ClusterConfig
{
      ClusterId = "cluster1",
      SessionAffinity = new SessionAffinityConfig
      {
             Enabled = true,
             FailurePolicy = "Return503Error",
             Policy = "HashCookie",
             AffinityKeyName = "Key1",
             Cookie = new SessionAffinityCookieConfig
             {
                   Domain = "mydomain",
                   Expiration = TimeSpan.FromHours(3),
                   HttpOnly = true,
                   IsEssential = true,
                   MaxAge = TimeSpan.FromDays(1),
                      Path = "mypath",
                      SameSite = Microsoft.AspNetCore.Http.SameSiteMode.Strict,
                      SecurePolicy =
Microsoft.AspNetCore.Http.CookieSecurePolicy.SameAsRequest
                   }
   }
}
```

## Chave de afinidade

A afinidade entre requisição e destino é estabelecida por meio da chave de afinidade que identifica o destino alvo. Essa chave pode ser armazenada em diferentes partes da requisição dependendo da implementação de afinidade de sessão utilizada, mas cada requisição não pode ter mais de uma chave desse tipo. A semântica exata da chave depende da implementação, mas as políticas integradas atualmente usam DestinationId como a chave de afinidade.

O design atual não exige que uma chave identifique exclusivamente um único destino afinizado. É permitido estabelecer afinidade com um grupo de destinos. Nesse caso, o destino exato que atenderá à requisição em questão será determinado pelo balanceador de carga.

Estabelecendo uma nova afinidade ou resolvendo uma existente

Quando uma requisição chega e é roteada para um cluster com afinidade de sessão habilitada, o proxy decide automaticamente se uma nova afinidade deve ser estabelecida ou se uma existente precisa ser resolvida, com base na presença e validade de uma chave de afinidade na requisição, da seguinte forma:

1. A requisição não contém uma chave. A resolução é ignorada e uma nova afinidade será estabelecida com o destino escolhido pelo balanceador de carga

2. A chave de afinidade é encontrada na requisição e é válida. O mecanismo de afinidade tenta encontrar todos os destinos íntegros que correspondem à chave e, se encontrar algum, passa a requisição adiante no pipeline. Se vários destinos correspondentes forem encontrados, o balanceador de carga é chamado para escolher o único destino alvo. Se apenas um destino correspondente for encontrado, o balanceador de carga não faz nada.

3. A chave de afinidade é inválida ou nenhum destino afinizado íntegro é encontrado. Isso é tratado como uma falha, a ser tratada por uma política de falha explicada abaixo

Se uma nova afinidade foi estabelecida para a requisição, a chave de afinidade é anexada a uma resposta, cuja representação e localização exatas dependem da implementação. Atualmente, existem duas políticas integradas que armazenam a chave em um cookie ou em um cabeçalho personalizado. Depois que a resposta é

entregue ao cliente, é responsabilidade do cliente anexar a chave a todas as requisições seguintes na

mesma sessão. Além disso, quando a próxima requisição contendo a chave chega ao proxy, ele

resolve a afinidade existente, mas a chave de afinidade não é anexada novamente à resposta. Assim,

apenas a primeira resposta carrega a chave de afinidade.

Existem quatro políticas de afinidade integradas que formatam e armazenam a chave de forma diferente nas requisições e respostas. A política padrão é HashCookie .

As políticas HashCookie , ArrCookie e Cookie armazenam a chave como um cookie, com hash ou criptografado, respectivamente; veja Proteção de chave abaixo. A chave da requisição será entregue como um cookie com o nome configurado e define o mesmo cookie com o cabeçalho Set-Cookie na primeira resposta de uma sequência afinizada. O nome do cookie deve ser definido explicitamente via SessionAffinityConfig.AffinityKeyName . Outras propriedades do cookie podem ser configuradas via SessionAffinityCookieConfig . CustomHeader armazena a chave como um cabeçalho criptografado. Ele espera que a chave de afinidade seja entregue em um cabeçalho personalizado com o nome configurado e define o mesmo cabeçalho na primeira resposta de uma sequência afinizada. O nome do cabeçalho deve ser definido via SessionAffinityConfig.AffinityKeyName .

:::note
AffinityKeyName deve ser exclusivo em todos os clusters com afinidade de sessão habilitada, para evitar conflitos.
:::

## Proteção de chave

A política HashCookie usa o hash XxHash64 para produzir um formato de saída rápido, compacto e ofuscado para o valor do cookie.

A política ArrCookie usa o hash SHA-256 para produzir uma saída ofuscada para o valor do cookie que corresponde ao formato do cookie de afinidade ARR do IIS. O ARR usa o nome do host de destino como valor de entrada, portanto os ids de destino do YARP precisariam ser configurados para corresponder, caso usados em conjunto com o ARR.

HashCookie e ArrCookie não fornecem proteção forte de privacidade, e dados sensíveis não devem ser incluídos nos ids de destino. Essas políticas também não ocultam o número total de destinos exclusivos por trás do proxy e não devem ser usadas se isso for uma preocupação.

As políticas Cookie e CustomHeader criptografam a chave usando Data Protection. Isso fornece uma forte proteção de privacidade para a chave, mas requer configuração adicional quando mais de uma instância do proxy está em uso.

## Política de falha de afinidade

Se a chave de afinidade não puder ser decodificada ou nenhum destino íntegro for encontrado, isso é considerado uma

falha e uma política de falha de afinidade é chamada para tratá-la. A política tem acesso completo ao

HttpContext e pode enviar a resposta ao cliente por conta própria. Ela retorna um valor booleano indicando

se o processamento da requisição pode continuar pelo pipeline ou deve ser encerrado.

Existem duas políticas de falha integradas. A padrão é Redistribute .

1. Redistribute - tenta estabelecer uma nova afinidade com um dos destinos íntegros disponíveis, pulando a etapa de busca de afinidade e passando todos os destinos íntegros para o balanceador de carga, da mesma forma que é feito para uma requisição sem nenhuma afinidade. O processamento da requisição continua. Isso é implementado por RedistributeAffinityFailurePolicy .

2. Return503Error - envia uma resposta 503 de volta ao cliente e o processamento da requisição é encerrado. Isso é implementado por Return503ErrorAffinityFailurePolicy

## Pipeline de requisição

Os mecanismos de afinidade de sessão são implementados pelos serviços (mencionados acima) e pelos dois middlewares a seguir:

1. SessionAffinityMiddleware - coordena o processo de resolução de afinidade da requisição. Primeiro, ele chama uma política especificada para o cluster em questão na propriedade ClusterConfig.SessionAffinity.Policy . Em seguida, verifica o status de resolução de afinidade retornado pela política e chama uma política de tratamento de falhas definida em ClusterConfig.SessionAffinity.FailurePolicy em caso de falhas. Ele deve ser adicionado ao pipeline antes do balanceador de carga.

2. AffinitizeTransform - define a chave na resposta se uma nova afinidade tiver sido estabelecida para a requisição. Caso contrário, se a requisição seguir uma afinidade existente, ele não faz nada. Isso é adicionado automaticamente como uma transformação de resposta.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
