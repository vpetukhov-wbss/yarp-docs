---
slug: kubernetes-ingress
title: Kubernetes Ingress Controller
lede: >-
  YARP kann in Kubernetes als Reverse Proxy integriert werden, der den eingehenden
  HTTP/HTTPS-Datenverkehr
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/kubernetes-ingress
lastUpdated: 2026-08-11
---

Eingeführt: Future Preview

YARP kann als Reverse Proxy in Kubernetes integriert werden, der den eingehenden HTTP/HTTPS-Datenverkehr (Ingress) in einen Kubernetes-Cluster verwaltet. Derzeit wird das Modul als separates Paket ausgeliefert und befindet sich in der Vorschau.

## Voraussetzungen

Bevor Sie mit diesem Tutorial fortfahren, stellen Sie sicher, dass Folgendes bereitsteht ...

1. Installieren von Docker entsprechend Ihrem Betriebssystem.

2. Eine Containerregistrierung. Docker erstellt standardmäßig eine Containerregistrierung auf DockerHub . Sie können auch Azure Container Registry oder eine andere Containerregistrierung Ihrer Wahl verwenden, z. B. eine lokale Registrierung für Testzwecke.

1. Ein Kubernetes-Cluster. Hierfür gibt es viele verschiedene Optionen, darunter:

Azure Kubernetes Service Kubernetes in Docker Desktop , dies beansprucht jedoch recht viel Arbeitsspeicher auf Ihrem Computer, verwenden Sie es daher mit Vorsicht. Minikube K3s , eine schlanke, zertifizierte Single-Binary-Kubernetes-Distribution von Rancher. Ein weiterer Kubernetes-Anbieter Ihrer Wahl.

Hinweis

Wenn Sie eine Containerregistrierung eines anderen Cloudanbieters als DockerHub wählen, müssen Sie wahrscheinlich Schritte unternehmen, um Ihren Kubernetes-Cluster für den Zugriff zu konfigurieren. Befolgen Sie die von Ihrem Cloudanbieter bereitgestellten Anweisungen.

## Erste Schritte

:::note
Derzeit gibt es kein offizielles Docker-Image für den YARP Ingress Controller.
:::

In der Zwischenzeit muss der YARP Ingress Controller lokal erstellt und bereitgestellt werden. Führen Sie im Stammverzeichnis

des Repositorys Folgendes aus:

docker build . -t {REGISTRY_NAME}/yarp-controller:{TAG} -f .\src\Kubernetes.Controller\Dockerfile docker push {REGISTRY_NAME}/yarp-controller:{TAG}

In den vorstehenden Befehlen ist der Platzhalter {REGISTRY_NAME} der Name der Docker-Registrierung, und der Platzhalter {TAG} ist ein Tag für das Image (z. B. 1.0.0 ).

Der erste Schritt besteht darin, den YARP Ingress Controller im Kubernetes-Cluster bereitzustellen. Navigieren Sie dazu zum Kubernetes Ingress-Beispiel \samples\KubernetesIngress.Sample\Ingress, und führen Sie (nach Anpassung von ingress- controller.yaml mit demselben REGISTRY_NAME und TAG ) Folgendes aus:

## kubectl apply -f ingress-controller.yaml

Um zu überprüfen, ob der Ingress Controller bereitgestellt wurde, führen Sie Folgendes aus:

## kubectl get pods -n yarp

Anschließend können Sie die Protokolle des Ingress Controllers überprüfen, indem Sie Folgendes ausführen:

kubectl logs {POD NAME} -n yarp

Alle Dienste, Bereitstellungen und Pods für YARP befinden sich im Namespace yarp . Achten Sie darauf, -n yarp anzugeben, wenn Sie den Status von YARP überprüfen möchten. Erstellen und stellen Sie als Nächstes den Ingress bereit. Führen Sie im Stammverzeichnis des Repositorys Folgendes aus:

docker build . -t {REGISTRY_NAME}/yarp:<TAG> -f .\samples\KuberenetesIngress.Sample\Ingress\Dockerfile docker push {REGISTRY_NAME}/yarp:{TAG}

In den vorstehenden Befehlen ist der Platzhalter {REGISTRY_NAME} der Name der Docker-

Registrierung, und der Platzhalter {TAG} ist ein Tag für das Image (z. B. 1.0.0 ).

Abschließend müssen wir den Ingress selbst in Kubernetes bereitstellen. Navigieren Sie zum Ingress-Verzeichnis, passen Sie die Datei ingress.yaml mit der zuvor angegebenen Registrierung und dem Tag an, und führen Sie Folgendes aus:

## kubectl apply -f .\ingress.yaml

An diesem Punkt sollten Ihr Ingress und der Controller ausgeführt werden.

## Bereitstellen einer App

Um den Ingress zu verwenden, müssen wir nun eine Anwendung in Kubernetes bereitstellen. Navigieren Sie zu samples\KuberenetesIngress.Sample\backend, und führen Sie Folgendes aus:

docker build . -t {REGISTRY_NAME}/backend:{TAG} docker push {REGISTRY_NAME}/backend:{TAG}

Und stellen Sie sie in Kubernetes bereit, indem Sie nach Anpassung von backend.yaml mit demselben Registrierungsnamen ( {REGISTRY_NAME} ) und Tag ( {TAG} ) Folgendes ausführen:

## kubectl apply -f .\backend.yaml

## Erstellen der Ingress-Definition

Sobald die Backend-Anwendung bereitgestellt wurde, müssen wir abschließend den Datenverkehr zum Backend leiten. Führen Sie dazu im Backend-Verzeichnis Folgendes aus:

## kubectl apply -f .\ingress-sample.yaml

Führen Sie anschließend den folgenden Befehl aus, um die externe IP-Adresse des Ingress zu erhalten. Der Name des zugehörigen Diensts lautet yarp-proxy :

## kubectl get service -n yarp

Wenn Sie einen lokalen K8s-Cluster verwenden und keine externe IP-Adresse erhalten, können Sie möglicherweise die Verwendung des Standardports 80 für den yarp-proxy-Dienst vermeiden. Aktualisieren Sie in diesem Fall die Datei ingress.yaml erneut, um einen anderen Port zu verwenden (z. B. port: 8085 ), und stellen Sie den Ingress erneut in Kubernetes bereit.

Navigieren Sie zur externen IP-Adresse; Sie sollten die Backend-Informationen sehen.

:::note
Dieser Artikel wurde mit Unterstützung von KI erstellt. Weitere Informationen
:::
