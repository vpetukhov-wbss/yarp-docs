---
slug: authn-authz
title: Autenticação e autorização
lede: >-
  O proxy reverso pode ser usado para autenticar e autorizar requisições antes que sejam
  encaminhadas por proxy
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/authn-authz
lastUpdated: 2026-08-11
---

## Autenticação e autorização no YARP

## Introdução

O proxy reverso pode ser usado para autenticar e autorizar requisições antes que sejam encaminhadas para os servidores de destino. Isso pode reduzir a carga nos servidores de destino, adicionar uma camada de proteção e garantir que políticas consistentes sejam implementadas em suas aplicações.

## Padrões

Nenhuma autenticação ou autorização é realizada nas requisições, a menos que isso seja habilitado na configuração da rota ou da aplicação.

## Configuração

As políticas de autorização podem ser especificadas por rota por meio de RouteConfig.AuthorizationPolicy e podem ser vinculadas a partir das seções Routes do arquivo de configuração. Assim como outras propriedades de rota, isso pode ser modificado e recarregado sem reiniciar o proxy. Os nomes das políticas não diferenciam maiúsculas de minúsculas.

Exemplo:

```json
{
   "ReverseProxy": {
      "Routes": {
          "route1" : {
             "ClusterId": "cluster1",
             "AuthorizationPolicy": "customPolicy",
             "Match": {
                "Hosts": [ "localhost" ]
             }
          }
      },
      "Clusters": {
          "cluster1": {
             "Destinations": {
                "cluster1/destination1": {
                    "Address": "https://localhost:10001/"
                }
             }
          }
      }
             }
          }
Authorization policies are an ASP.NET Core concept that the proxy utilizes. The proxy provides
the above configuration to specify a policy per route and the rest is handled by existing
ASP.NET Core authentication and authorization components.
Authorization policies can be configured in the application as follows:
   services.AddAuthorization(options =>
   {
          options.AddPolicy("customPolicy", policy =>
                 policy.RequireAuthenticatedUser());
   });
In Program.cs add the Authorization and Authentication middleware.
   app.UseAuthentication();
   app.UseAuthorization();
   app.MapReverseProxy();
See the Authentication docs for setting up your preferred kind of authentication.
Special values:
In addition to custom policy names, there are two special values that can be specified in a
route's authorization parameter: default and anonymous . ASP.NET Core also has a
FallbackPolicy setting that applies to routes that do not specify a policy.
```

## DefaultPolicy

Especificar o valor default no parâmetro de autorização de uma rota significa que essa rota usará a política definida em AuthorizationOptions.DefaultPolicy. Essa política é pré-configurada para exigir usuários autenticados.

## Anonymous

Especificar o valor anonymous no parâmetro de autorização de uma rota significa que essa rota não vai

exigir autorização, independentemente de qualquer outra configuração na aplicação, como o

FallbackPolicy.

## FallbackPolicy

AuthorizationOptions.FallbackPolicy é a política que será usada para qualquer requisição ou rota que não tenha sido configurada com uma política. Por padrão, FallbackPolicy não tem valor definido, portanto qualquer requisição será permitida.

## Propagação de credenciais

Mesmo depois que uma requisição foi autorizada no proxy, o servidor de destino ainda pode precisar saber quem é o usuário (autenticação) e o que ele tem permissão para fazer (autorização). A forma como você propaga essas informações depende do tipo de autenticação utilizado.

## Cookie, bearer, API keys

Esses tipos de autenticação já passam seus valores nos cabeçalhos da requisição, que fluem para o servidor de destino por padrão. Esse servidor ainda precisará verificar e interpretar esses valores, o que gera algum trabalho duplicado.

## OAuth2, OpenIdConnect, WsFederation

Esses protocolos são comumente usados com provedores de identidade remotos. O processo de autenticação pode ser configurado na aplicação do proxy e resultará em um cookie de autenticação. Esse cookie fluirá para o servidor de destino como um cabeçalho de requisição normal.

## Windows, Negotiate, NTLM, Kerberos

Esses tipos de autenticação costumam estar vinculados a uma conexão específica. Eles não são compatíveis como meio de autenticar um usuário em um servidor de destino atrás do proxy YARP (veja #166 . Eles podem ser usados para autenticar uma requisição de entrada no proxy, mas essa informação de identidade precisará ser comunicada ao servidor de destino de outra forma. Eles também podem ser usados para autenticar o proxy junto aos servidores de destino, mas somente como o próprio usuário do proxy — a representação (impersonation) do cliente não é suportada.

## Certificados de cliente

Certificados de cliente são um recurso do TLS e são negociados como parte de uma conexão. Consulte esta documentação

para mais informações. O certificado pode ser encaminhado para o servidor de destino como um

cabeçalho HTTP usando a transformação ClientCert.

## Troca de tipos de autenticação

Tipos de autenticação como Windows, que não fluem naturalmente para o servidor de destino, precisarão ser convertidos no proxy para outro formato. Por exemplo, um token JWT bearer pode ser criado com as informações do usuário e definido na requisição do proxy.

Essas conversões podem ser realizadas usando transformações de requisição personalizadas. Exemplos detalhados podem ser desenvolvidos para cenários específicos, caso haja interesse suficiente da comunidade. Precisamos de mais feedback da comunidade sobre como vocês desejam converter e propagar as informações de identidade.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
