---
slug: kubernetes-ingress
title: Kubernetes Ingress Controller
lede: >-
  YARP can be integrated with Kubernetes as a reverse proxy managing HTTP/HTTPS traffic
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/kubernetes-ingress
lastUpdated: 2026-08-11
---

Introduced: Future Preview

YARP can be integrated with Kubernetes as a reverse proxy managing HTTP/HTTPS traffic ingress to a Kubernetes cluster. Currently, the module is shipped as a separate package and is in preview.

## Prerequisites {#prerequisites}

Before we continue with this tutorial, make sure you have the following ready...

1. Installing Docker based on your operating system.

2. A container registry. Docker by default will create a container registry on DockerHub . You could also use Azure Container Registry or another container registry of your choice, like a local registry for testing.

1. A Kubernetes Cluster. There are many different options here, including:

Azure Kubernetes Service Kubernetes in Docker Desktop , however it does take up quite a bit of memory on your machine, so use with caution. Minikube K3s , a lightweight single-binary certified Kubernetes distribution from Rancher. Another Kubernetes provider of your choice.

Note

If you choose a container registry provided by a cloud provider other than Dockerhub, you probably must take steps to configure your Kubernetes cluster to allow access. Follow the instructions provided by your cloud provider.

## Get started {#get-started}

:::note
For now, there is no official Docker image for the YARP ingress controller.
:::

In the meantime, the YARP ingress controller must be built locally and deploy it. In the root of

the repository, run:

docker build . -t {REGISTRY_NAME}/yarp-controller:{TAG} -f .\src\Kubernetes.Controller\Dockerfile docker push {REGISTRY_NAME}/yarp-controller:{TAG}

In the preceding commands, the {REGISTRY_NAME} placeholder is the name of the Docker registry, and the {TAG} placeholder is a tag for the image (for example, 1.0.0 ).

The first step is to deploy the YARP ingress controller to the Kubernetes cluster. This can be done by navigating to Kubernetes Ingress sample \samples\KubernetesIngress.Sample\Ingress and running (after modifying ingress- controller.yaml with the same REGISTRY_NAME and TAG ):

## kubectl apply -f ingress-controller.yaml {#kubectl-apply-f-ingress-controller-yaml}

To verify that the ingress controller has been deployed, run:

## kubectl get pods -n yarp {#kubectl-get-pods-n-yarp}

You can then check logs from the ingress controller by running:

kubectl logs {POD NAME} -n yarp

All services, deployments, and pods for YARP are in the namespace yarp . Make sure to include -n yarp if you want to check on the status of yarp. Next, build and deploy the ingress. In the root of the repository, run:

docker build . -t {REGISTRY_NAME}/yarp:<TAG> -f .\samples\KuberenetesIngress.Sample\Ingress\Dockerfile docker push {REGISTRY_NAME}/yarp:{TAG}

In the preceding commands, the {REGISTRY_NAME} placeholder is the name of the Docker

registry, and the {TAG} placeholder is a tag for the image (for example, 1.0.0 ).

Finally, we need to deploy the ingress itself to Kubernetes. Navigate to the Ingress directory and modify the ingress.yaml file for your registry and tag specified earlier and run:

## kubectl apply -f .\ingress.yaml {#kubectl-apply-f-ingress-yaml}

At this point, your ingress and controller should be running.

## Deploying an app {#deploying-an-app}

To use the ingress, we now need to deploy an application to Kubernetes. Navigate to samples\KuberenetesIngress.Sample\backend and run:

docker build . -t {REGISTRY_NAME}/backend:{TAG} docker push {REGISTRY_NAME}/backend:{TAG}

And deploying it to Kubernetes by running, after modifying backend.yaml with the same registry name ( {REGISTRY_NAME} ) and tag ( {TAG} ):

## kubectl apply -f .\backend.yaml {#kubectl-apply-f-backend-yaml}

## Creating the ingress definition {#creating-the-ingress-definition}

Finally, once we have deployed the backend application, we need to route traffic to the backend. To do this, run in the backend directory:

## kubectl apply -f .\ingress-sample.yaml {#kubectl-apply-f-ingress-sample-yaml}

And then execute the following command to get the external IP of the ingress, the name of the related service being yarp-proxy :

## kubectl get service -n yarp {#kubectl-get-service-n-yarp}

If you're using a local K8s cluster and don't get an external IP, you may be able to avoid using the default port: 80 for the yarp-proxy service. If so, try to update the ingress.yaml file again to use another port (for example, port: 8085 ) and redeploy the ingress to Kubernetes.

Navigate to the external IP, and you should see the backend information.

:::note
The author created this article with assistance from AI. Learn more
:::
