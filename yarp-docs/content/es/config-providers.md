---
slug: config-providers
title: Proveedores de configuración
lede: >-
  Cargue rutas y clústeres mediante programación en lugar de desde un archivo, implementando
  usted mismo IProxyConfigProvider - útil para una base de datos, una API remota o cualquier otro origen.
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/config-providers
lastUpdated: 2025-02-10
---

## La interfaz del proveedor

[Archivos de configuración](doc:config-files) cubre el caso común de cargar desde `IConfiguration`. Para cargar desde cualquier otro lugar, implemente usted mismo `IProxyConfigProvider` e `IProxyConfig`.

`IProxyConfigProvider` tiene un único método, `GetConfig()`, que devuelve un `IProxyConfig` - una instantánea con las rutas y clústeres actuales, además de un `IChangeToken` que el proveedor señaliza cada vez que esa instantánea queda desactualizada, lo que hace que el proxy vuelva a llamar a `GetConfig()`.

## Carga directa de rutas y clústeres

Para el caso más simple - rutas y clústeres conocidos por completo en el código - `InMemoryConfigProvider` es un `IProxyConfigProvider` ya preparado:

```csharp
services.AddReverseProxy().LoadFromMemory(routes, clusters);
```

Para cambiar esa configuración más adelante, resuelva `InMemoryConfigProvider` desde el contenedor de servicios y llame a `Update`:

```csharp
httpContext.RequestServices.GetRequiredService<InMemoryConfigProvider>()
    .Update(routes, clusters);
```

## Ciclo de vida del proveedor

### Inicio

`IProxyConfigProvider` se registra como un singleton. Al iniciar, el proxy lo resuelve y llama a `GetConfig()` una vez; el proveedor puede:

- generar una excepción si no puede producir una configuración válida - esto impide que la aplicación se inicie;
- bloquearse de forma sincrónica hasta que se cargue la configuración, lo que retrasa el inicio hasta que haya datos de ruta válidos disponibles; o
- devolver de inmediato un `IProxyConfig` vacío y cargar en segundo plano, señalizando su `IChangeToken` una vez que los datos reales estén listos.

Cualquier configuración que se devuelva se valida, y un resultado no válido genera una excepción que impide el inicio - en su lugar, un proveedor puede validarla previamente con `IConfigValidator` y excluir él mismo las entradas no válidas.

Los objetos de ruta y clúster entregados al proxy deben tratarse como de solo lectura una vez devueltos desde `GetConfig()`.

### Recarga

Si el `IChangeToken` admite devoluciones de llamada de cambio activas, el proxy registra una después de la carga inicial; en caso contrario, se sondea `HasChanged` cada 5 minutos. Para publicar una nueva configuración, un proveedor debe cargarla en segundo plano - construyendo nuevas instancias de ruta y clúster, ya que son inmutables, aunque las que no cambiaron se pueden reutilizar - validarla opcionalmente, y solo entonces señalizar el `IChangeToken` *anterior*. En respuesta, el proxy vuelve a llamar a `GetConfig()` y compara el resultado con la configuración actual, actualizando solo lo que cambió; el intercambio es atómico y solo afecta a las solicitudes nuevas, no a las que ya están en curso.

:::important
Los `IChangeToken` son de un solo uso. Si `GetConfig()` genera una excepción durante una recarga, el proxy pierde la capacidad de escuchar más cambios de ese proveedor. Cualquier otro error de recarga, en cambio, se registra y se suprime, y el proxy sigue usando la última configuración correcta conocida.
:::

Si se señalizan varias recargas en rápida sucesión, el proxy puede omitir algunas y cargar lo que esté disponible en el momento en que se pone al día - cada `IProxyConfig` es una instantánea completa, no una diferencia, por lo que no se pierde nada al omitir una intermedia.

## Varios proveedores

Se puede registrar más de un `IProxyConfigProvider` como singleton; todos ellos se resuelven y su configuración se combina, de la misma manera en que se pueden combinar varias secciones de [archivo de configuración](doc:config-files). Una ruta de un proveedor puede hacer referencia a un clúster de otro, pero una sola ruta o clúster no se puede ensamblar a partir de datos parciales repartidos entre dos proveedores.
