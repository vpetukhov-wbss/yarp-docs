---
slug: kubernetes-ingress
title: Kubernetes Ingress 控制器
lede: >-
  YARP 可以与 Kubernetes 集成,作为管理进入 Kubernetes 群集的 HTTP/HTTPS 流量的反向代理。
sourceUrl: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/kubernetes-ingress
lastUpdated: 2026-08-11
---

引入版本:未来预览版

YARP 可以与 Kubernetes 集成,作为管理进入 Kubernetes 群集的 HTTP/HTTPS 流量的反向代理。目前,该模块作为单独的包发布,处于预览阶段。

## 前提条件

在继续本教程之前,请确保你已经准备好以下内容……

1. 根据你的操作系统安装 Docker。

2. 一个容器注册表。默认情况下,Docker 会在 DockerHub 上创建一个容器注册表。你也可以使用 Azure Container Registry,或你选择的其他容器注册表,例如用于测试的本地注册表。

1. 一个 Kubernetes 群集。这里有许多不同的选择,包括:

Azure Kubernetes Service;Docker Desktop 中的 Kubernetes(不过它会占用机器上相当多的内存,请谨慎使用);Minikube;K3s(Rancher 提供的一个轻量级单二进制文件、经过认证的 Kubernetes 发行版);或者你选择的其他 Kubernetes 提供程序。

注意

如果你选择的容器注册表是由 Dockerhub 以外的云提供商提供的,你可能需要采取相应步骤来配置你的 Kubernetes 群集,以允许访问该注册表。请按照你所用云提供商提供的说明进行操作。

## 开始使用

:::note
目前还没有官方提供的 YARP Ingress 控制器 Docker 镜像。
:::

在此之前,你必须在本地构建 YARP Ingress 控制器并进行部署。在仓库根目录下运行:

docker build . -t {REGISTRY_NAME}/yarp-controller:{TAG} -f .\src\Kubernetes.Controller\Dockerfile docker push {REGISTRY_NAME}/yarp-controller:{TAG}

在上面的命令中,占位符 {REGISTRY_NAME} 是 Docker 注册表的名称,占位符 {TAG} 是镜像的标签(例如 1.0.0)。

第一步是将 YARP Ingress 控制器部署到 Kubernetes 群集。为此,可以进入 Kubernetes Ingress 示例目录 \samples\KubernetesIngress.Sample\Ingress,并在按照相同的 REGISTRY_NAME 和 TAG 修改 ingress-controller.yaml 后,运行:

## kubectl apply -f ingress-controller.yaml

要验证 Ingress 控制器是否已部署成功,请运行:

## kubectl get pods -n yarp

随后,你可以通过运行以下命令查看 Ingress 控制器的日志:

kubectl logs {POD NAME} -n yarp

YARP 的所有服务、部署和 Pod 都位于 yarp 命名空间中。如果要查看 yarp 的状态,请务必加上 -n yarp。接下来,构建并部署 Ingress。在仓库根目录下运行:

docker build . -t {REGISTRY_NAME}/yarp:<TAG> -f .\samples\KuberenetesIngress.Sample\Ingress\Dockerfile docker push {REGISTRY_NAME}/yarp:{TAG}

在上面的命令中,占位符 {REGISTRY_NAME} 是 Docker 注册表的名称,占位符 {TAG} 是镜像的标签(例如 1.0.0)。

最后,我们需要将 Ingress 本身部署到 Kubernetes。进入 Ingress 目录,按照前面指定的注册表和标签修改 ingress.yaml 文件,然后运行:

## kubectl apply -f .\ingress.yaml

至此,你的 Ingress 和控制器应该已经在运行了。

## 部署应用

要使用该 Ingress,现在需要将一个应用程序部署到 Kubernetes。进入 samples\KuberenetesIngress.Sample\backend,并运行:

docker build . -t {REGISTRY_NAME}/backend:{TAG} docker push {REGISTRY_NAME}/backend:{TAG}

在按照相同的注册表名称({REGISTRY_NAME})和标签({TAG})修改 backend.yaml 后,通过运行以下命令将其部署到 Kubernetes:

## kubectl apply -f .\backend.yaml

## 创建 Ingress 定义

最后,在部署完后端应用程序之后,我们需要将流量路由到该后端。为此,请在 backend 目录下运行:

## kubectl apply -f .\ingress-sample.yaml

然后执行以下命令,获取该 Ingress 的外部 IP 地址(相关服务的名称为 yarp-proxy):

## kubectl get service -n yarp

如果你使用的是本地 K8s 群集,并且没有获得外部 IP,你可以尝试不为 yarp-proxy 服务使用默认端口 80。如果是这种情况,请再次修改 ingress.yaml 文件以使用另一个端口(例如 port: 8085),然后将该 Ingress 重新部署到 Kubernetes。

导航到该外部 IP,你应该会看到后端信息。

:::note
本文作者在 AI 的协助下创作本文。了解详情
:::
