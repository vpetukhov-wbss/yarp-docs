---
slug: extensibility
title: Información general
lede: >-
  Hay 2 estilos principales de extensibilidad para YARP, según el comportamiento de enrutamiento
  que desee:
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/extensibility
lastUpdated: 2026-08-11
---

## Información general sobre la extensibilidad de YARP

Hay 2 estilos principales de extensibilidad para YARP, según el comportamiento de enrutamiento que desee:

Canalización de middleware. HTTP Forwarder.

## Canalización de middleware

YARP utiliza el concepto de rutas, clústeres y destinos. Estos se pueden proporcionar mediante archivos de configuración o directamente en código. Según las reglas de enrutamiento, YARP selecciona un clúster y enumera los posibles destinos. A continuación, usa la canalización de middleware para seleccionar el destino en función del estado del destino, la afinidad de sesión, el equilibrio de carga, etc.

La mayor parte de la canalización predefinida se puede personalizar mediante código:

Proveedores de configuración. Enumeración de destinos. Afinidad de sesión. Equilibrio de carga. Comprobaciones de estado. Transformaciones de solicitud. Configuración de HttpClient.

También puede cambiar la definición de la canalización para reemplazar módulos por sus propias implementaciones o agregar módulos adicionales según sea necesario. Para obtener más información, consulte Middleware.

## HTTP Forwarder

Si la canalización de YARP resulta demasiado rígida para su caso de uso, o si la escala de las reglas de enrutamiento y los destinos no es adecuada para cargarse en memoria, puede implementar su propia lógica de enrutamiento y usar HTTP Forwarder para dirigir las solicitudes al destino que elija. El componente HttpForwarder toma el contexto HTTP y reenvía la solicitud al destino proporcionado.

El componente de transformación se puede seguir usando si se necesita el forwarder. Para obtener más información, consulte Reenvío directo.

:::note
El autor creó este artículo con la ayuda de la IA. Más información
:::
