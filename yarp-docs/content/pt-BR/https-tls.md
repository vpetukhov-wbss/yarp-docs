---
slug: https-tls
title: HTTPS e TLS
lede: >-
  HTTPS (HTTP sobre conexões criptografadas por TLS) é a forma padrão de fazer requisições HTTP na
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/https-tls
lastUpdated: 2026-08-11
---

HTTPS (HTTP sobre conexões criptografadas por TLS) é a forma padrão de fazer requisições HTTP na Internet por motivos de segurança, integridade e privacidade. Há várias considerações sobre HTTPS/TLS a serem levadas em conta ao usar um proxy reverso como o YARP.

## Terminação de TLS

O YARP é um proxy HTTP de camada 7, o que significa que as conexões HTTPS/TLS de entrada são totalmente descriptografadas pelo proxy para que ele possa processar e encaminhar as requisições HTTP. Isso é comumente conhecido como terminação de TLS. As conexões de saída para o(s) destino(s) podem ou não ser criptografadas, dependendo da configuração fornecida.

Tunelamento de TLS (CONNECT)

O tunelamento de TLS usando o método CONNECT é um recurso usado para fazer proxy de requisições sem descriptografá-las. Isso não é compatível com o YARP e não há planos de adicionar suporte a ele.

## Configurando conexões de entrada

O YARP pode ser executado sobre todos os servidores do ASP.NET Core, e a configuração de HTTPS/TLS para conexões de entrada é específica de cada servidor. Consulte a documentação do Kestrel, do IIS e do Http.Sys para obter detalhes de configuração.

## Filtros avançados de TLS com o Kestrel

O Kestrel oferece suporte à interceptação de conexões de entrada antes do handshake de TLS. O YARP inclui uma API TlsFrameHelper que pode analisar o handshake de TLS bruto e permitir que você colete telemetria personalizada ou rejeite conexões antecipadamente. Essas APIs não podem modificar o handshake de TLS nem descriptografar o fluxo de dados. Veja este exemplo .

## Configurando conexões de saída

Para habilitar a criptografia TLS na comunicação com um destino, especifique o endereço de destino como https, como em "https://destinationHost" . Consulte a documentação de configuração para ver exemplos.

O nome do host especificado no endereço de destino será usado para o handshake de TLS por

padrão, incluindo o SNI e a validação do certificado do servidor. Se o encaminhamento do cabeçalho host original estiver

habilitado, esse valor será usado para o handshake de TLS. Se for necessário usar um valor de host

personalizado, use a transformação RequestHeader para definir o cabeçalho host.

As conexões de saída para os destinos são tratadas pelo HttpClient/SocketsHttpHandler. Uma instância e configurações diferentes podem ser definidas por cluster. Algumas configurações estão disponíveis no modelo de configuração, enquanto outras só podem ser configuradas em código. Consulte a documentação do HttpClient para obter detalhes.

Os certificados do servidor de destino precisam ser confiáveis para o proxy, ou uma validação personalizada precisa ser aplicada por meio da configuração do HttpClient.

:::note
O autor criou este artigo com o auxílio de IA. Saiba mais
:::
