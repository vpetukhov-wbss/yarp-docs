---
slug: header-guidelines
title: Diretrizes de cabeçalhos HTTP
lede: >-
  Os cabeçalhos são uma parte muito importante do processamento de requisições HTTP, e cada um tem
  sua própria
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/header-guidelines
lastUpdated: 2026-08-11
---

Os cabeçalhos são uma parte muito importante do processamento de requisições HTTP, e cada um tem sua própria semântica e suas próprias considerações. A maioria dos cabeçalhos é encaminhada por proxy por padrão, embora alguns usados para controlar como a requisição é entregue sejam ajustados ou removidos automaticamente pelo proxy. As conexões entre o cliente e o proxy e entre o proxy e o destino são independentes. Por isso, os cabeçalhos que afetam a conexão e o transporte precisam ser filtrados. Muitos cabeçalhos contêm informações como nomes de domínio, caminhos ou outros detalhes que podem ser afetados quando um proxy reverso é incluído na arquitetura da aplicação. A seguir, uma coletânea de diretrizes sobre como cabeçalhos específicos podem ser afetados e o que fazer a respeito.

## Filtragem de cabeçalhos do YARP

O YARP remove automaticamente cabeçalhos de requisição e resposta que poderiam afetar sua capacidade de encaminhar uma requisição corretamente, ou que poderiam ser usados de forma maliciosa para contornar recursos do proxy. Uma lista completa pode ser encontrada aqui , com alguns destaques descritos abaixo.

## Connection , KeepAlive , Close

Esses cabeçalhos controlam como a conexão TCP é gerenciada e são removidos para evitar impactos na conexão do outro lado do proxy.

## Transfer-Encoding

Esse cabeçalho descreve o formato do corpo da requisição ou da resposta na conexão, por exemplo, 'chunked', e é removido porque o formato pode variar entre a conexão interna e a externa. As pilhas HTTP de entrada e de saída adicionarão os cabeçalhos de transporte conforme necessário.

## TE

Somente o valor de cabeçalho TE: trailers é permitido através do proxy, já que ele é exigido por algumas implementações de gRPC.

## Upgrade

Isso é usado para protocolos como WebSockets. Ele é removido por padrão e só é adicionado novamente para protocolos especificamente compatíveis (WebSockets, SPDY).

## Proxy-*

Esses são cabeçalhos usados com proxies e não são considerados apropriados para encaminhamento.

## Alt-Svc

Esse cabeçalho de resposta é usado com upgrades para HTTP/3 e se aplica somente à conexão imediata.

## Cabeçalhos de rastreamento distribuído

Esses cabeçalhos incluem TraceParent , Request-Id , TraceState , Baggage e Correlation- Context .

Eles são removidos automaticamente com base em DistributedContextPropagator.Fields, permitindo que o HttpClient de encaminhamento os substitua por valores atualizados.

Você pode optar por não modificar esses cabeçalhos definindo SocketsHttpHandler.ActivityHeadersPropagator como null :

```csharp
   services.AddReverseProxy()
          .ConfigureHttpClient((_, handler) => handler.ActivityHeadersPropagator =
   null);
```

## Strict-Transport-Security

Esse cabeçalho instrui os clientes a sempre usar HTTPS, mas pode haver um conflito entre os valores fornecidos pelo proxy e pelo destino. Para evitar confusão, o valor do destino não é copiado para a resposta se um valor já tiver sido adicionado à resposta pela aplicação do proxy.

## Outras diretrizes de cabeçalho

## Host

O cabeçalho Host indica para qual site no servidor a requisição se destina. Esse cabeçalho é removido por padrão, já que o nome de host usado publicamente pelo proxy provavelmente é diferente do usado pelo serviço por trás do proxy. Isso pode ser configurado usando a transformação RequestHeaderOriginalHost.

## X-Forwarded-* , Forwarded

Como uma conexão separada é usada para se comunicar com o destino, esses cabeçalhos de requisição podem ser usados para encaminhar informações sobre a conexão original, como o IP, o esquema, a porta e o certificado do cliente. X-Forwarded-For , X-Forwarded-Proto , X-Forwarded-Host e X-Forwarded-Prefix são habilitados por padrão. Essas informações estão sujeitas a ataques de falsificação, então quaisquer cabeçalhos já existentes na requisição são removidos e substituídos por padrão. A aplicação de destino deve ter cuidado com o quanto confia nesses valores. Consulte as transformações para configurar isso no proxy. Para obter orientações sobre como configurar a aplicação de destino para ler esses cabeçalhos, consulte Configurar o ASP.NET Core para funcionar com servidores proxy e balanceadores de carga.

## X-http-method-override , x-http-method , x-method-override

Alguns clientes e servidores limitam quais métodos HTTP permitem (por exemplo, GET). Esses cabeçalhos de requisição às vezes são usados para contornar essas restrições. Esses cabeçalhos são encaminhados por proxy por padrão. Se, no proxy, você quiser impedir esses contornos, use a transformação RequestHeaderRemove.

## Set-Cookie

Esse cabeçalho de resposta pode conter campos que restringem aspectos da URL, como o esquema, o domínio ou o caminho em que o cookie deve ser usado. O uso de um proxy reverso pode alterar o esquema, o domínio ou o caminho efetivo de um site do ponto de vista público. Embora seja possível reescrever os cookies de resposta usando transformações personalizadas , recomendamos usar os cabeçalhos Forwarded descritos anteriormente para propagar os valores corretos para a aplicação de destino, para que ela possa gerar os cabeçalhos set-cookie corretos.

## Location

Esse cabeçalho de resposta é usado com redirecionamentos e pode conter um esquema, domínio e caminho diferentes dos valores públicos devido ao uso do proxy. Embora seja possível reescrever o cabeçalho Location usando transformações personalizadas, recomenda-se usar os cabeçalhos Forwarded descritos acima para propagar os valores corretos para a aplicação de destino, para que ela possa gerar os cabeçalhos Location corretos.

## Server

Esse cabeçalho de resposta indica qual tecnologia de servidor foi usada para gerar a resposta (por exemplo, IIS, Kestrel). Esse cabeçalho é encaminhado do destino por padrão. As aplicações que quiserem removê-lo podem usar a transformação ResponseHeaderRemove, caso em que o cabeçalho de servidor

padrão do proxy será usado. Suprimir o cabeçalho de servidor padrão do proxy é específico de

cada servidor, como no caso do Kestrel.

## X-Powered-By

Esse cabeçalho de resposta indica qual framework web foi usado para gerar a resposta (por exemplo, ASP.NET). O ASP.NET Core não gera esse cabeçalho, mas o IIS pode gerar. Esse cabeçalho é encaminhado do destino por padrão. As aplicações que quiserem removê-lo podem usar a transformação ResponseHeaderRemove.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
