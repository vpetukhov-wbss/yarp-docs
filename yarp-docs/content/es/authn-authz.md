---
slug: authn-authz
title: Autenticación y autorización
lede: >-
  El proxy inverso se puede usar para autenticar y autorizar solicitudes antes de que se envíen
  por proxy
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/authn-authz
lastUpdated: 2026-08-11
---

## Autenticación y autorización de YARP

## Introducción

El proxy inverso se puede usar para autenticar y autorizar solicitudes antes de que se envíen por proxy a los servidores de destino. Esto puede reducir la carga en los servidores de destino, añadir una capa de protección y garantizar que se apliquen directivas coherentes en todas sus aplicaciones.

## Valores predeterminados

No se realiza ninguna autenticación ni autorización sobre las solicitudes a menos que se habilite en la configuración de la ruta o de la aplicación.

## Configuración

Las directivas de autorización se pueden especificar por ruta mediante RouteConfig.AuthorizationPolicy y se pueden enlazar desde las secciones Routes del archivo de configuración. Al igual que con otras propiedades de ruta, esto se puede modificar y volver a cargar sin reiniciar el proxy. Los nombres de directiva no distinguen mayúsculas de minúsculas.

Ejemplo:

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

Especificar el valor default en el parámetro de autorización de una ruta significa que esa ruta usará la directiva definida en AuthorizationOptions.DefaultPolicy. Esa directiva está preconfigurada para exigir usuarios autenticados.

## Anonymous

Especificar el valor anonymous en el parámetro de autorización de una ruta significa que esa ruta no requerirá autorización, con independencia de cualquier otra configuración de la aplicación, como la FallbackPolicy.

## FallbackPolicy

AuthorizationOptions.FallbackPolicy es la directiva que se usará para cualquier solicitud o ruta que no se haya configurado con una directiva. FallbackPolicy no tiene ningún valor de forma predeterminada, por lo que se permitirá cualquier solicitud.

## Flujo de credenciales

Incluso después de que una solicitud se haya autorizado en el proxy, es posible que el servidor de destino todavía necesite saber quién es el usuario (autenticación) y qué se le permite hacer (autorización). La forma de transmitir esa información dependerá del tipo de autenticación que se use.

## Cookie, token de portador, claves de API

Estos tipos de autenticación ya transmiten sus valores en los encabezados de la solicitud, y estos se enviarán al servidor de destino de forma predeterminada. Ese servidor seguirá teniendo que verificar e interpretar esos valores, lo que supone cierto trabajo duplicado.

## OAuth2, OpenIdConnect, WsFederation

Estos protocolos se usan habitualmente con proveedores de identidades remotos. El proceso de autenticación se puede configurar en la aplicación de proxy y da como resultado una cookie de autenticación. Esa cookie se enviará al servidor de destino como un encabezado de solicitud normal.

## Windows, Negotiate, NTLM, Kerberos

Estos tipos de autenticación suelen estar vinculados a una conexión específica. No se admiten como medio para autenticar a un usuario en un servidor de destino situado detrás del proxy YARP (véase el n.º 166 ). Se pueden usar para autenticar una solicitud entrante en el proxy, pero esa información de identidad tendrá que comunicarse al servidor de destino de otra forma. También se pueden usar para autenticar el proxy ante los servidores de destino, pero solo como el propio usuario del proxy; no se admite la suplantación del cliente.

## Certificados de cliente

Los certificados de cliente son una característica de TLS y se negocian como parte de una conexión. Consulte esta documentación para obtener más información. El certificado se puede reenviar al servidor de destino como un encabezado HTTP mediante la transformación ClientCert.

## Intercambio de tipos de autenticación

Los tipos de autenticación como Windows, que no se transmiten de forma natural al servidor de destino, deberán convertirse en el proxy a una forma alternativa. Por ejemplo, se puede crear un token de portador JWT con la información del usuario y establecerlo en la solicitud de proxy.

Estos intercambios se pueden realizar mediante transformaciones de solicitud personalizadas. Se pueden desarrollar ejemplos detallados para escenarios específicos si hay suficiente interés por parte de la comunidad. Necesitamos más comentarios de la comunidad sobre cómo desea convertir y transmitir la información de identidad.

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
