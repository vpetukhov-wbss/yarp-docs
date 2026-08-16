---
slug: kubernetes-ingress
title: Controlador de Ingress de Kubernetes
lede: >-
  YARP puede integrarse con Kubernetes como un proxy inverso que gestiona el tráfico HTTP/HTTPS
  de
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/kubernetes-ingress
lastUpdated: 2026-08-11
---

Introducido: versión preliminar futura.

YARP puede integrarse con Kubernetes como un proxy inverso que gestiona la entrada (ingress) de tráfico HTTP/HTTPS a un clúster de Kubernetes. Actualmente, el módulo se distribuye como un paquete independiente y se encuentra en versión preliminar (preview).

## Requisitos previos

Antes de continuar con este tutorial, asegúrese de tener preparado lo siguiente...

1. Instalar Docker según su sistema operativo.
2. Un registro de contenedores. De forma predeterminada, Docker crea un registro de contenedores en DockerHub. También puede usar Azure Container Registry u otro registro de contenedores de su elección, como un registro local para pruebas.
3. Un clúster de Kubernetes. Hay muchas opciones disponibles, entre ellas:

Azure Kubernetes Service. Kubernetes en Docker Desktop, aunque este consume bastante memoria en su equipo, así que úselo con precaución. Minikube. K3s, una distribución de Kubernetes certificada, ligera y de un solo binario, de Rancher. Otro proveedor de Kubernetes de su elección.

Nota

Si elige un registro de contenedores proporcionado por un proveedor de nube distinto de Dockerhub, probablemente deba realizar pasos adicionales para configurar su clúster de Kubernetes y permitir el acceso. Siga las instrucciones proporcionadas por su proveedor de nube.

## Primeros pasos

:::note
Por ahora, no existe una imagen oficial de Docker para el controlador de Ingress de YARP.
:::

Mientras tanto, el controlador de Ingress de YARP debe compilarse localmente e implementarse. En la raíz del repositorio, ejecute:

`docker build . -t {REGISTRY_NAME}/yarp-controller:{TAG} -f .\src\Kubernetes.Controller\Dockerfile`
`docker push {REGISTRY_NAME}/yarp-controller:{TAG}`

En los comandos anteriores, el marcador de posición `{REGISTRY_NAME}` es el nombre del registro de Docker, y el marcador de posición `{TAG}` es una etiqueta para la imagen (por ejemplo, `1.0.0`).

El primer paso es implementar el controlador de Ingress de YARP en el clúster de Kubernetes. Para ello, vaya a la muestra de Kubernetes Ingress en `\samples\KubernetesIngress.Sample\Ingress` y ejecute (después de modificar `ingress-controller.yaml` con el mismo `REGISTRY_NAME` y `TAG`):

## kubectl apply -f ingress-controller.yaml

Para comprobar que el controlador de Ingress se ha implementado, ejecute:

## kubectl get pods -n yarp

A continuación, puede revisar los registros del controlador de Ingress ejecutando:

`kubectl logs {POD NAME} -n yarp`

Todos los servicios, implementaciones y pods de YARP se encuentran en el espacio de nombres `yarp`. Asegúrese de incluir `-n yarp` si desea comprobar el estado de yarp. A continuación, compile e implemente el Ingress. En la raíz del repositorio, ejecute:

`docker build . -t {REGISTRY_NAME}/yarp:<TAG> -f .\samples\KuberenetesIngress.Sample\Ingress\Dockerfile`
`docker push {REGISTRY_NAME}/yarp:{TAG}`

En los comandos anteriores, el marcador de posición `{REGISTRY_NAME}` es el nombre del registro de Docker, y el marcador de posición `{TAG}` es una etiqueta para la imagen (por ejemplo, `1.0.0`).

Por último, es necesario implementar el propio Ingress en Kubernetes. Vaya al directorio Ingress, modifique el archivo `ingress.yaml` con el registro y la etiqueta indicados anteriormente, y ejecute:

## kubectl apply -f .\ingress.yaml

En este punto, el Ingress y el controlador deberían estar en ejecución.

## Implementación de una aplicación

Para usar el Ingress, ahora es necesario implementar una aplicación en Kubernetes. Vaya a `samples\KuberenetesIngress.Sample\backend` y ejecute:

`docker build . -t {REGISTRY_NAME}/backend:{TAG}`
`docker push {REGISTRY_NAME}/backend:{TAG}`

Y despliéguela en Kubernetes ejecutando, después de modificar `backend.yaml` con el mismo nombre de registro (`{REGISTRY_NAME}`) y etiqueta (`{TAG}`):

## kubectl apply -f .\backend.yaml

## Creación de la definición del Ingress

Por último, una vez implementada la aplicación de back-end, es necesario enrutar el tráfico hacia ella. Para ello, ejecute en el directorio backend:

## kubectl apply -f .\ingress-sample.yaml

A continuación, ejecute el siguiente comando para obtener la IP externa del Ingress; el nombre del servicio relacionado es `yarp-proxy`:

## kubectl get service -n yarp

Si usa un clúster de K8s local y no obtiene una IP externa, es posible que deba evitar usar el puerto predeterminado, el 80, para el servicio `yarp-proxy`. En ese caso, intente actualizar de nuevo el archivo `ingress.yaml` para usar otro puerto (por ejemplo, `port: 8085`) y vuelva a implementar el Ingress en Kubernetes.

Vaya a la IP externa y debería ver la información del back-end.

:::note
El autor creó este artículo con la ayuda de inteligencia artificial. Más información
:::
