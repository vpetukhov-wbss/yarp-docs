---
slug: session-affinity
title: Afinidad de sesión
lede: >-
  La afinidad de sesión es un mecanismo para vincular (afinizar) una secuencia de solicitudes
  causalmente relacionadas con el
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/session-affinity
lastUpdated: 2026-08-11
---

## Concepto

La afinidad de sesión es un mecanismo para vincular (afinizar) una secuencia de solicitudes causalmente relacionadas al destino que gestionó la primera solicitud, cuando la carga se equilibra entre varios destinos. Resulta útil en escenarios donde la mayoría de las solicitudes de una secuencia trabajan con los mismos datos y el costo de acceder a ellos difiere según el nodo (destino) que gestione la solicitud. El ejemplo más habitual es una caché transitoria (por ejemplo, en memoria) en la que la primera solicitud obtiene los datos de un almacenamiento persistente más lento y los coloca en una caché local rápida, mientras que las siguientes solicitudes trabajan únicamente con los datos almacenados en caché, aumentando así el rendimiento.

## Configuración

## Registro de servicios y middleware

Los servicios de afinidad de sesión se registran automáticamente en el contenedor de inserción de dependencias mediante AddReverseProxy(). El middleware UseSessionAffinity() se incluye de forma predeterminada en el método MapReverseProxy sin parámetros. Si está personalizando la canalización del proxy, coloque este middleware antes de agregar UseLoadBalancing().

Ejemplo:

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

## Configuración del clúster

La afinidad de sesión se configura por clúster según el siguiente esquema de configuración.

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

## Configuración de la cookie

Los atributos para configurar la cookie usada con las directivas HashCookie, ArrCookie y Cookie se pueden configurar mediante SessionAffinityCookieConfig. Las propiedades se pueden establecer en la configuración JSON, como se mostró anteriormente, o en código, como se muestra a continuación:

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

## Clave de afinidad

La afinidad entre la solicitud y el destino se establece mediante la clave de afinidad que identifica al destino. Esa clave se puede almacenar en distintas partes de la solicitud según la implementación de afinidad de sesión utilizada, pero cada solicitud no puede tener más de una clave de este tipo. La semántica exacta de la clave depende de la implementación, pero las directivas integradas usan actualmente DestinationId como clave de afinidad.

El diseño actual no exige que una clave identifique de forma única a un único destino afinizado. Se permite establecer afinidad con un grupo de destinos. En ese caso, el equilibrador de carga determinará el destino exacto que gestionará la solicitud dada.

Establecimiento de una nueva afinidad o resolución de una existente

Cuando llega una solicitud y se enruta a un clúster con la afinidad de sesión habilitada, el proxy decide automáticamente si se debe establecer una nueva afinidad o resolver una existente, según la presencia y validez de una clave de afinidad en la solicitud, de la siguiente manera:

1. La solicitud no contiene ninguna clave. Se omite la resolución y se establece una nueva afinidad con el destino elegido por el equilibrador de carga.

2. Se encuentra una clave de afinidad válida en la solicitud. El mecanismo de afinidad intenta encontrar todos los destinos en buen estado que coincidan con la clave y, si encuentra alguno, pasa la solicitud a lo largo de la canalización. Si se encuentran varios destinos coincidentes, se invoca al equilibrador de carga para elegir el destino único. Si solo se encuentra un destino coincidente, el equilibrador de carga no hace nada.

3. La clave de afinidad no es válida o no se encuentra ningún destino afinizado en buen estado. Esto se trata como un error que gestiona una directiva de error, explicada más abajo.

Si se establece una nueva afinidad para la solicitud, la clave de afinidad se adjunta a una respuesta; la representación y ubicación exactas de la clave dependen de la implementación. Actualmente hay dos directivas integradas que almacenan la clave en una cookie o en un encabezado personalizado. Una vez que la respuesta se entrega al cliente, es responsabilidad de este adjuntar la clave a todas las solicitudes siguientes de la misma sesión. Además, cuando la siguiente solicitud que porta la clave llega al proxy, este resuelve la afinidad existente, pero la clave de afinidad no se vuelve a adjuntar a la respuesta. Por lo tanto, solo la primera respuesta porta la clave de afinidad.

Hay cuatro directivas de afinidad integradas que dan formato a la clave y la almacenan de forma distinta en las solicitudes y las respuestas. La directiva predeterminada es HashCookie.

Las directivas HashCookie, ArrCookie y Cookie almacenan la clave en una cookie, aplicando hash o cifrado respectivamente; véase «Protección de la clave» más abajo. La clave de la solicitud se entrega como una cookie con el nombre configurado, y la misma cookie se establece mediante el encabezado Set-Cookie en la primera respuesta de una secuencia afinizada. El nombre de la cookie se debe establecer explícitamente mediante SessionAffinityConfig.AffinityKeyName. Las demás propiedades de la cookie se pueden configurar mediante SessionAffinityCookieConfig. CustomHeader almacena la clave como un encabezado cifrado. Esta directiva espera que la clave de afinidad se entregue en un encabezado personalizado con el nombre configurado, y establece ese mismo encabezado en la primera respuesta de una secuencia afinizada. El nombre del encabezado se debe establecer mediante SessionAffinityConfig.AffinityKeyName.

:::note
AffinityKeyName debe ser único en todos los clústeres con afinidad de sesión habilitada, para evitar conflictos.
:::

## Protección de la clave

La directiva HashCookie usa el hash XxHash64 para generar, de forma rápida y compacta, un valor de cookie ofuscado.

La directiva ArrCookie usa el hash SHA-256 para generar un valor de cookie ofuscado compatible con el formato de cookie de afinidad ARR de IIS. ARR usa el nombre de host del destino como valor de entrada, por lo que los identificadores de destino de YARP deberían configurarse para coincidir si se usan junto con ARR.

HashCookie y ArrCookie no ofrecen una protección de privacidad sólida, por lo que no se deben incluir datos confidenciales en los identificadores de destino. Estas directivas tampoco ocultan el número total de destinos únicos que hay detrás del proxy, por lo que no se deben usar si eso supone un problema.

Las directivas Cookie y CustomHeader cifran la clave mediante Data Protection. Esto ofrece una protección de privacidad sólida para la clave, pero requiere configuración adicional cuando se usa más de una instancia de proxy.

## Directiva de error de afinidad

Si la clave de afinidad no se puede decodificar o no se encuentra ningún destino en buen estado, se considera un error y se invoca una directiva de error de afinidad para gestionarlo. La directiva tiene acceso completo a HttpContext y puede enviar la respuesta al cliente por sí misma. Devuelve un valor booleano que indica si el procesamiento de la solicitud puede continuar por la canalización o si debe finalizar.

Hay dos directivas de error integradas. La predeterminada es Redistribute.

1. Redistribute: intenta establecer una nueva afinidad con uno de los destinos disponibles en buen estado, omitiendo el paso de búsqueda de afinidad y pasando todos los destinos en buen estado al equilibrador de carga, de la misma forma que se hace con una solicitud sin ninguna afinidad. El procesamiento de la solicitud continúa. Esto lo implementa RedistributeAffinityFailurePolicy.

2. Return503Error: envía una respuesta 503 al cliente y el procesamiento de la solicitud finaliza. Esto lo implementa Return503ErrorAffinityFailurePolicy.

## Canalización de solicitudes

Los mecanismos de afinidad de sesión se implementan mediante los servicios mencionados anteriormente y los dos middleware siguientes:

1. SessionAffinityMiddleware: coordina el proceso de resolución de afinidad de la solicitud. Primero, invoca la directiva especificada para el clúster dado en la propiedad ClusterConfig.SessionAffinity.Policy. Luego comprueba el estado de resolución de afinidad que devuelve la directiva y, en caso de error, invoca la directiva de gestión de errores establecida en ClusterConfig.SessionAffinity.FailurePolicy. Debe agregarse a la canalización antes del equilibrador de carga.

2. AffinitizeTransform: establece la clave en la respuesta si se ha establecido una nueva afinidad para la solicitud. En caso contrario, si la solicitud sigue una afinidad existente, no hace nada. Esto se agrega automáticamente como transformación de respuesta.

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
