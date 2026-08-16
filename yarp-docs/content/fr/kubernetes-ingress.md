---
slug: kubernetes-ingress
title: Contrôleur Ingress Kubernetes
lede: >-
  YARP peut être intégré à Kubernetes en tant que proxy inverse gérant le trafic HTTP/HTTPS
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/kubernetes-ingress
lastUpdated: 2026-08-11
---

Introduit : aperçu futur

YARP peut être intégré à Kubernetes en tant que proxy inverse gérant l'entrée du trafic HTTP/HTTPS vers un cluster Kubernetes. Actuellement, ce module est distribué sous la forme d'un package distinct et se trouve en préversion.

## Prérequis

Avant de poursuivre ce tutoriel, assurez-vous de disposer des éléments suivants...

1. Installer Docker selon votre système d'exploitation.

2. Un registre de conteneurs. Par défaut, Docker crée un registre de conteneurs sur DockerHub . Vous pouvez également utiliser Azure Container Registry ou un autre registre de conteneurs de votre choix, comme un registre local pour les tests.

1. Un cluster Kubernetes. De nombreuses options sont disponibles, notamment :

Azure Kubernetes Service Kubernetes dans Docker Desktop , cependant cela occupe une quantité non négligeable de mémoire sur votre machine, donc à utiliser avec prudence. Minikube K3s , une distribution Kubernetes certifiée, légère et à binaire unique, proposée par Rancher. Un autre fournisseur Kubernetes de votre choix.

Remarque

Si vous choisissez un registre de conteneurs fourni par un fournisseur cloud autre que Dockerhub, vous devrez probablement configurer votre cluster Kubernetes pour autoriser l'accès. Suivez les instructions fournies par votre fournisseur cloud.

## Pour commencer

:::note
Pour l'instant, il n'existe pas d'image Docker officielle pour le contrôleur Ingress YARP.
:::

En attendant, le contrôleur Ingress YARP doit être généré localement, puis déployé. À la racine

du dépôt, exécutez :

docker build . -t {REGISTRY_NAME}/yarp-controller:{TAG} -f .\src\Kubernetes.Controller\Dockerfile docker push {REGISTRY_NAME}/yarp-controller:{TAG}

Dans les commandes précédentes, l'espace réservé {REGISTRY_NAME} correspond au nom du registre Docker, et l'espace réservé {TAG} correspond à une étiquette pour l'image (par exemple, 1.0.0 ).

La première étape consiste à déployer le contrôleur Ingress YARP sur le cluster Kubernetes. Pour cela, accédez à l'exemple Kubernetes Ingress \samples\KubernetesIngress.Sample\Ingress et exécutez (après avoir modifié ingress- controller.yaml avec les mêmes REGISTRY_NAME et TAG ) :

## kubectl apply -f ingress-controller.yaml

Pour vérifier que le contrôleur Ingress a été déployé, exécutez :

## kubectl get pods -n yarp

Vous pouvez ensuite consulter les journaux du contrôleur Ingress en exécutant :

kubectl logs {POD NAME} -n yarp

Tous les services, déploiements et pods de YARP se trouvent dans l'espace de noms yarp . Veillez à inclure -n yarp si vous souhaitez vérifier l'état de yarp. Ensuite, générez et déployez l'ingress. À la racine du dépôt, exécutez :

docker build . -t {REGISTRY_NAME}/yarp:<TAG> -f .\samples\KuberenetesIngress.Sample\Ingress\Dockerfile docker push {REGISTRY_NAME}/yarp:{TAG}

Dans les commandes précédentes, l'espace réservé {REGISTRY_NAME} correspond au nom du registre

Docker, et l'espace réservé {TAG} correspond à une étiquette pour l'image (par exemple, 1.0.0 ).

Enfin, nous devons déployer l'ingress lui-même sur Kubernetes. Accédez au répertoire Ingress, modifiez le fichier ingress.yaml avec le registre et l'étiquette spécifiés précédemment, puis exécutez :

## kubectl apply -f .\ingress.yaml

À ce stade, votre ingress et votre contrôleur devraient être en cours d'exécution.

## Déploiement d'une application

Pour utiliser l'ingress, nous devons maintenant déployer une application sur Kubernetes. Accédez à samples\KuberenetesIngress.Sample\backend et exécutez :

docker build . -t {REGISTRY_NAME}/backend:{TAG} docker push {REGISTRY_NAME}/backend:{TAG}

Puis déployez-la sur Kubernetes en exécutant, après avoir modifié backend.yaml avec le même nom de registre ( {REGISTRY_NAME} ) et la même étiquette ( {TAG} ) :

## kubectl apply -f .\backend.yaml

## Création de la définition de l'ingress

Enfin, une fois l'application backend déployée, nous devons router le trafic vers celle-ci. Pour cela, exécutez, dans le répertoire backend :

## kubectl apply -f .\ingress-sample.yaml

Puis exécutez la commande suivante pour obtenir l'adresse IP externe de l'ingress, le nom du service associé étant yarp-proxy :

## kubectl get service -n yarp

Si vous utilisez un cluster K8s local et que vous n'obtenez pas d'adresse IP externe, vous pourrez peut-être éviter d'utiliser le port par défaut : 80 pour le service yarp-proxy. Le cas échéant, essayez de mettre à jour de nouveau le fichier ingress.yaml pour utiliser un autre port (par exemple, port: 8085 ) et redéployez l'ingress sur Kubernetes.

Accédez à l'adresse IP externe ; vous devriez voir les informations du backend.

:::note
L'auteur a créé cet article avec l'aide de l'IA. En savoir plus
:::
