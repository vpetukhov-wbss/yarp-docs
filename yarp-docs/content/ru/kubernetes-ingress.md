---
slug: kubernetes-ingress
title: Ingress-контроллер Kubernetes
lede: >-
  YARP можно интегрировать с Kubernetes в качестве обратного прокси, управляющего входящим
  трафиком HTTP/HTTPS
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/kubernetes-ingress
lastUpdated: 2026-08-11
---

Добавлено: Future Preview

YARP можно интегрировать с Kubernetes в качестве обратного прокси, управляющего входящим трафиком HTTP/HTTPS (Ingress), поступающим в кластер Kubernetes. В настоящее время этот модуль поставляется в виде отдельного пакета и находится в предварительной версии.

## Предварительные требования

Прежде чем продолжить работу с этим руководством, убедитесь, что у вас готово следующее...

1. Установка Docker в соответствии с вашей операционной системой.

2. Реестр контейнеров. По умолчанию Docker создает реестр контейнеров на DockerHub . Вы также можете использовать Azure Container Registry или другой реестр контейнеров по своему выбору, например локальный реестр для тестирования.

1. Кластер Kubernetes. Здесь доступно множество различных вариантов, включая:

Azure Kubernetes Service Kubernetes в Docker Desktop , однако это может занимать довольно много памяти на вашем компьютере, поэтому используйте с осторожностью. Minikube K3s , легковесный однобинарный сертифицированный дистрибутив Kubernetes от Rancher. Другой поставщик Kubernetes по вашему выбору.

Примечание

Если вы выбираете реестр контейнеров, предоставленный облачным провайдером, отличным от DockerHub, вам, вероятно, потребуется предпринять шаги для настройки кластера Kubernetes с целью разрешить доступ. Следуйте инструкциям, предоставленным вашим облачным провайдером.

## Начало работы

:::note
На данный момент официального образа Docker для Ingress-контроллера YARP не существует.
:::

Пока что Ingress-контроллер YARP нужно собрать локально и развернуть его. В корне

репозитория выполните:

docker build . -t {REGISTRY_NAME}/yarp-controller:{TAG} -f .\src\Kubernetes.Controller\Dockerfile docker push {REGISTRY_NAME}/yarp-controller:{TAG}

В предыдущих командах заполнитель {REGISTRY_NAME} обозначает имя реестра Docker, а заполнитель {TAG} — тег образа (например, 1.0.0 ).

Первый шаг — развернуть Ingress-контроллер YARP в кластере Kubernetes. Для этого перейдите в каталог примера Kubernetes Ingress \samples\KubernetesIngress.Sample\Ingress и выполните команду (предварительно изменив ingress- controller.yaml, указав те же значения REGISTRY_NAME и TAG ):

## kubectl apply -f ingress-controller.yaml

Чтобы убедиться, что Ingress-контроллер развернут, выполните команду:

## kubectl get pods -n yarp

Затем вы можете проверить журналы Ingress-контроллера, выполнив команду:

kubectl logs {POD NAME} -n yarp

Все службы, развертывания и поды YARP находятся в пространстве имен yarp . Обязательно указывайте -n yarp, если хотите проверить состояние yarp. Далее соберите и разверните ingress. В корне репозитория выполните:

docker build . -t {REGISTRY_NAME}/yarp:<TAG> -f .\samples\KuberenetesIngress.Sample\Ingress\Dockerfile docker push {REGISTRY_NAME}/yarp:{TAG}

В предыдущих командах заполнитель {REGISTRY_NAME} обозначает имя реестра

Docker, а заполнитель {TAG} — тег образа (например, 1.0.0 ).

Наконец, необходимо развернуть сам Ingress в Kubernetes. Перейдите в каталог Ingress, измените файл ingress.yaml, указав реестр и тег, заданные ранее, и выполните команду:

## kubectl apply -f .\ingress.yaml

На этом этапе ваш Ingress и контроллер должны быть запущены.

## Развертывание приложения

Чтобы использовать Ingress, теперь необходимо развернуть приложение в Kubernetes. Перейдите в каталог samples\KuberenetesIngress.Sample\backend и выполните команду:

docker build . -t {REGISTRY_NAME}/backend:{TAG} docker push {REGISTRY_NAME}/backend:{TAG}

А затем разверните его в Kubernetes, выполнив команду после изменения файла backend.yaml с тем же именем реестра ( {REGISTRY_NAME} ) и тегом ( {TAG} ):

## kubectl apply -f .\backend.yaml

## Создание определения Ingress

Наконец, после развертывания серверного приложения (backend) необходимо направить трафик на него. Для этого выполните команду в каталоге backend:

## kubectl apply -f .\ingress-sample.yaml

Затем выполните следующую команду, чтобы получить внешний IP-адрес ingress; имя связанной службы — yarp-proxy :

## kubectl get service -n yarp

Если вы используете локальный кластер K8s и не получаете внешний IP-адрес, вы можете отказаться от использования порта по умолчанию: 80 для службы yarp-proxy. В этом случае попробуйте снова обновить файл ingress.yaml, указав другой порт (например, port: 8085 ), и повторно разверните ingress в Kubernetes.

Перейдите по внешнему IP-адресу — вы должны увидеть информацию о серверном приложении (backend).

:::note
Автор создал эту статью с помощью ИИ. Подробнее
:::
