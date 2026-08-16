---
slug: kubernetes-ingress
title: Kubernetes Ingress контролер
lede: >-
  YARP може да бъде интегриран с Kubernetes като обратен прокси, управляващ входящия HTTP/HTTPS
  трафик
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/kubernetes-ingress
lastUpdated: 2026-08-11
---

Въведено: Future Preview

YARP може да бъде интегриран с Kubernetes като обратен прокси, управляващ входящия HTTP/HTTPS трафик към клъстер на Kubernetes. В момента модулът се доставя като отделен пакет и е в preview.

## Предварителни изисквания

Преди да продължите с това ръководство, уверете се, че разполагате със следното...

1. Инсталиран Docker, съобразен с вашата операционна система.

2. Регистър за контейнери (container registry). По подразбиране Docker създава регистър за контейнери в DockerHub . Можете също да използвате Azure Container Registry или друг регистър за контейнери по избор, например локален регистър за целите на тестването.

1. Клъстер на Kubernetes. Тук има много различни възможности, включително:

Azure Kubernetes Service Kubernetes в Docker Desktop , но той заема доста памет на машината ви, така че го използвайте внимателно. Minikube K3s , лек, сертифициран Kubernetes дистрибутив с единичен двоичен файл от Rancher. Друг доставчик на Kubernetes по ваш избор.

Забележка

Ако изберете регистър за контейнери, предоставен от доставчик на облачни услуги, различен от Dockerhub, вероятно ще трябва да предприемете стъпки за конфигуриране на вашия Kubernetes клъстер, за да разрешите достъп. Следвайте инструкциите, предоставени от вашия доставчик на облачни услуги.

## Първи стъпки

:::note
Засега няма официален Docker образ за ingress контролера на YARP.
:::

Междувременно ingress контролерът на YARP трябва да бъде компилиран локално и разгърнат. В корена на

хранилището изпълнете:

docker build . -t {REGISTRY_NAME}/yarp-controller:{TAG} -f .\src\Kubernetes.Controller\Dockerfile docker push {REGISTRY_NAME}/yarp-controller:{TAG}

В предходните команди placeholder-ът {REGISTRY_NAME} представлява името на Docker регистъра, а placeholder-ът {TAG} — таг за образа (например 1.0.0 ).

Първата стъпка е да разгърнете ingress контролера на YARP в клъстера на Kubernetes. Това може да се направи, като отидете в Kubernetes Ingress sample \samples\KubernetesIngress.Sample\Ingress и изпълните (след като промените ingress-controller.yaml със същите REGISTRY_NAME и TAG ):

## kubectl apply -f ingress-controller.yaml

За да проверите, че ingress контролерът е разгърнат, изпълнете:

## kubectl get pods -n yarp

След това можете да проверите логовете от ingress контролера, като изпълните:

kubectl logs {POD NAME} -n yarp

Всички services, deployments и pods за YARP се намират в namespace yarp . Не забравяйте да включите -n yarp, ако искате да проверите състоянието на yarp. След това компилирайте и разгърнете ingress-а. В корена на хранилището изпълнете:

docker build . -t {REGISTRY_NAME}/yarp:<TAG> -f .\samples\KuberenetesIngress.Sample\Ingress\Dockerfile docker push {REGISTRY_NAME}/yarp:{TAG}

В предходните команди placeholder-ът {REGISTRY_NAME} представлява името на Docker

регистъра, а placeholder-ът {TAG} — таг за образа (например 1.0.0 ).

Накрая трябва да разгърнем самия ingress в Kubernetes. Отидете в директорията Ingress, променете файла ingress.yaml със зададените по-рано регистър и таг и изпълнете:

## kubectl apply -f .\ingress.yaml

На този етап вашият ingress и контролерът трябва да работят.

## Разгръщане на приложение

За да използвате ingress-а, сега трябва да разгърнете приложение в Kubernetes. Отидете в samples\KuberenetesIngress.Sample\backend и изпълнете:

docker build . -t {REGISTRY_NAME}/backend:{TAG} docker push {REGISTRY_NAME}/backend:{TAG}

И го разгърнете в Kubernetes, като изпълните следното, след като промените backend.yaml със същото име на регистър ( {REGISTRY_NAME} ) и таг ( {TAG} ):

## kubectl apply -f .\backend.yaml

## Създаване на дефиницията за ingress

Накрая, след като приложението backend е разгърнато, трябва да насочим трафика към него. За целта изпълнете в директорията backend:

## kubectl apply -f .\ingress-sample.yaml

След това изпълнете следната команда, за да получите външния IP адрес на ingress-а, като името на съответната услуга е yarp-proxy :

## kubectl get service -n yarp

Ако използвате локален K8s клъстер и не получите външен IP адрес, е възможно да се наложи да избегнете използването на порт по подразбиране: 80 за услугата yarp-proxy. Ако е така, опитайте отново да редактирате файла ingress.yaml, за да използвате друг порт (например port: 8085 ), и разгърнете отново ingress-а в Kubernetes.

Отворете външния IP адрес и трябва да видите информацията от backend приложението.

:::note
Тази статия е създадена от автора с помощта на изкуствен интелект (AI). Научете повече
:::
